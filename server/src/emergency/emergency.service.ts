import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBedDto, UpdateBedStatusDto, CreateEmergencyCaseDto } from './dto';

@Injectable()
export class EmergencyService {
    constructor(private prisma: PrismaService) { }

    async getDashboard() {
        // We filter beds by 'Emergencia' ward as this is the Emergency Dashboard
        const ER_WARD = 'Emergencia';

        const [criticalPatients, totalBeds, availableBeds, occupiedBeds, bedsByWard] = await Promise.all([
            // Critical patients: Strictly Triage level 1 (Emergency)
            this.prisma.emergencyCase.count({
                where: {
                    status: { in: ['TRIAGE', 'ADMITTED', 'OBSERVATION'] },
                    triageLevel: 1,
                },
            }),
            this.prisma.bed.count({ where: { ward: ER_WARD } }),
            this.prisma.bed.count({ where: { ward: ER_WARD, status: 'AVAILABLE' } }),
            this.prisma.bed.count({ where: { ward: ER_WARD, status: 'OCCUPIED' } }),
            this.prisma.bed.groupBy({
                by: ['ward', 'status'],
                _count: true,
            }),
        ]);

        return {
            criticalPatients,
            beds: {
                total: totalBeds,
                available: availableBeds,
                occupied: occupiedBeds,
                maintenance: totalBeds - availableBeds - occupiedBeds,
            },
            bedsByWard,
        };
    }

    async getCriticalPatients() {
        return this.prisma.emergencyCase.findMany({
            where: {
                status: { in: ['TRIAGE', 'ADMITTED', 'OBSERVATION'] },
            },
            include: {
                bed: true,
                staff: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: { triageLevel: 'asc' }, // Lower number = Higher priority
        });
    }

    async getCaseById(id: string) {
        return this.prisma.emergencyCase.findUnique({
            where: { id },
            include: {
                patient: true,
                bed: true,
                staff: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                vitalSignsHistory: {
                    orderBy: { createdAt: 'desc' }
                },
                medications: {
                    orderBy: { administeredAt: 'desc' }
                },
                procedures: {
                    orderBy: { performedAt: 'desc' }
                },
                attachments: {
                    orderBy: { createdAt: 'desc' }
                },
                pharmacyOrders: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    // [NEW] Get patient emergency history
    async getPatientHistory(patientId: string) {
        if (!patientId) return [];

        // Try to match by patient ID if we were storing it, 
        // or for now return empty since our seed data mocks names not IDs strictly linked yet.
        // However, we should try to match on something.
        // If we update EmergencyCase schema to have patientId, we can use it.
        // Since we didn't add patientId to EmergencyCase schema (only to Patient), 
        // we might have limited luck. 
        // WAIT: In Step 169 summary I said: "EmergencyCase ... patientId (opcional)".
        // So I can query it.

        return this.prisma.emergencyCase.findMany({
            where: {
                patientId: patientId
            },
            orderBy: { admissionDate: 'desc' }
        });
    }

    // [NEW] Helper to create emergency case
    async createEmergencyCase(data: CreateEmergencyCaseDto) {
        // Fetch patient name if patientId is provided
        let patientName = data.patientName || 'Unknown Patient';
        let patientAge = data.patientAge;

        if (data.patientId) {
            const patient = await this.prisma.patient.findUnique({
                where: { id: data.patientId },
                select: { firstName: true, lastName: true, dateOfBirth: true }
            });

            if (patient) {
                patientName = `${patient.firstName} ${patient.lastName}`;
                if (patient.dateOfBirth) {
                    const today = new Date();
                    const birthDate = new Date(patient.dateOfBirth);
                    patientAge = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        patientAge--;
                    }
                }
            }
        }

        let bedNumber = null;
        if (data.bedId) {
            const bed = await this.prisma.bed.findUnique({
                where: { id: data.bedId },
                select: { number: true }
            });
            if (bed) bedNumber = bed.number;

            // Update bed status to OCCUPIED
            await this.prisma.bed.update({
                where: { id: data.bedId },
                data: {
                    status: 'OCCUPIED',
                    patientId: data.patientId || null,
                    diagnosis: data.diagnosis || data.chiefComplaint,
                    admissionDate: new Date()
                }
            });
        }

        let staffName = null;
        if (data.doctorId) {
            const staff = await this.prisma.healthStaff.findUnique({
                where: { id: data.doctorId },
                include: { user: { select: { firstName: true, lastName: true } } }
            });
            if (staff) staffName = `${staff.user.firstName} ${staff.user.lastName}`;
        }

        const newCase = await this.prisma.emergencyCase.create({
            data: {
                patientName,
                patientAge,
                patientId: data.patientId || null,
                triageLevel: data.triageLevel,
                chiefComplaint: data.chiefComplaint,
                diagnosis: data.diagnosis || null,
                bedId: data.bedId || null,
                bedNumber,
                staffId: data.doctorId || null,
                staffName,
                vitalSigns: data.vitalSigns || null,
                status: 'ADMITTED'
            }
        });

        // [SENIOR] Automatically record initial vital signs in history
        if (data.vitalSigns) {
            const vs = data.vitalSigns;
            await this.addVitalSign(newCase.id, {
                hr: vs.hr,
                bp: vs.bp,
                temp: vs.temp,
                spo2: vs.spo2,
                rr: vs.rr,
                performedBy: staffName || 'Admisión'
            });
        }

        return newCase;
    }

    async updateEmergencyCase(id: string, data: Partial<CreateEmergencyCaseDto>) {
        console.log(`[EmergencyService] Update start for case ${id}`);
        try {
            const currentCase = await this.prisma.emergencyCase.findUnique({
                where: { id },
                select: { bedId: true, staffId: true, patientId: true }
            });

            if (!currentCase) {
                throw new Error(`No se encontró el caso con ID ${id}`);
            }

            const updateData: any = {};

            // Basic Fields
            if (data.triageLevel !== undefined) {
                const level = typeof data.triageLevel === 'string' ? parseInt(data.triageLevel) : data.triageLevel;
                if (!isNaN(level)) updateData.triageLevel = level;
            }
            if (data.chiefComplaint !== undefined) updateData.chiefComplaint = data.chiefComplaint;
            if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis;
            if (data.notes !== undefined) updateData.notes = data.notes;

            // Vital Signs (Handle JSON carefully)
            if (data.vitalSigns) {
                const vs = data.vitalSigns;
                updateData.vitalSigns = {
                    hr: (vs.hr !== null && vs.hr !== "") ? parseFloat(vs.hr) : null,
                    bp: vs.bp || null,
                    temp: (vs.temp !== null && vs.temp !== "") ? parseFloat(vs.temp) : null,
                    spo2: (vs.spo2 !== null && vs.spo2 !== "") ? parseFloat(vs.spo2) : null,
                    rr: (vs.rr !== null && vs.rr !== "") ? parseFloat(vs.rr) : null,
                };
            }

            // Staff & Bed Caching details
            if (data.doctorId && data.doctorId !== currentCase.staffId) {
                const staffMember = await this.prisma.healthStaff.findUnique({
                    where: { id: data.doctorId },
                    include: { user: { select: { firstName: true, lastName: true } } }
                });
                if (staffMember) {
                    updateData.staffId = data.doctorId;
                    updateData.staffName = `${staffMember.user.firstName} ${staffMember.user.lastName}`;
                }
            }

            // [SENIOR] If vital signs are updated during edit, also log to history
            if (data.vitalSigns) {
                await this.addVitalSign(id, {
                    ...data.vitalSigns,
                    performedBy: updateData.staffName || 'Actualización Sistema'
                });
            }

            // Bed reassignment logic
            if (data.bedId && data.bedId !== currentCase.bedId) {
                // Release old bed
                if (currentCase.bedId) {
                    await this.prisma.bed.update({
                        where: { id: currentCase.bedId },
                        data: {
                            status: 'AVAILABLE',
                            patientId: null,
                            admissionDate: null,
                            diagnosis: null
                        }
                    });
                }

                const newBed = await this.prisma.bed.findUnique({ where: { id: data.bedId } });
                if (newBed) {
                    updateData.bedId = data.bedId;
                    updateData.bedNumber = newBed.number;

                    // Occupy new bed
                    await this.prisma.bed.update({
                        where: { id: data.bedId },
                        data: {
                            status: 'OCCUPIED',
                            patientId: currentCase.patientId,
                            diagnosis: data.diagnosis || data.chiefComplaint,
                            admissionDate: new Date() // Reset admission date to now for the new bed
                        }
                    });
                }
            } else if (data.bedId === currentCase.bedId && (data.diagnosis || data.chiefComplaint)) {
                // If bed is same, still update the bed's diagnosis
                await this.prisma.bed.update({
                    where: { id: currentCase.bedId },
                    data: {
                        diagnosis: data.diagnosis || data.chiefComplaint
                    }
                });
            }

            console.log(`[EmergencyService] Executing Prisma update for ${id}`);
            await this.prisma.emergencyCase.update({
                where: { id },
                data: updateData
            });

            return this.getCaseById(id);
        } catch (error: any) {
            console.error(`[EmergencyService] FATAL ERROR updating case ${id}:`, error);
            throw new Error(`Error en el servicio: ${error.message}`);
        }
    }

    async createBed(data: CreateBedDto) {
        return this.prisma.bed.create({
            data: {
                number: data.bedNumber,
                ward: data.ward,
                type: 'Camilla', // Default for emergency
                status: 'AVAILABLE',
            },
        });
    }

    async getAllBeds(ward?: string, status?: string) {
        const where: any = {};
        if (ward) where.ward = ward;
        if (status) where.status = status;

        return this.prisma.bed.findMany({
            where,
            include: {
                patient: true,
            },
            orderBy: [{ ward: 'asc' }, { number: 'asc' }],
        });
    }

    async getBedById(id: string) {
        return this.prisma.bed.findUnique({
            where: { id },
            include: {
                patient: true,
            },
        });
    }

    async updateBedStatus(id: string, data: UpdateBedStatusDto) {
        const updateData: any = { ...data };

        if (data.patientId) {
            updateData.admissionDate = new Date();
        } else if (data.status === 'AVAILABLE') {
            updateData.patientId = null;
            updateData.admissionDate = null;
        }

        return this.prisma.bed.update({
            where: { id },
            data: updateData,
        });
    }

    async getWardStats() {
        const wards = await this.prisma.bed.groupBy({
            by: ['ward'],
            _count: true,
        });

        const wardDetails = await Promise.all(
            wards.map(async (ward) => {
                const [available, occupied, maintenance] = await Promise.all([
                    this.prisma.bed.count({ where: { ward: ward.ward, status: 'AVAILABLE' } }),
                    this.prisma.bed.count({ where: { ward: ward.ward, status: 'OCCUPIED' } }),
                    this.prisma.bed.count({ where: { ward: ward.ward, status: 'MAINTENANCE' } }),
                ]);

                return {
                    ward: ward.ward,
                    total: ward._count,
                    available,
                    occupied,
                    maintenance,
                };
            }),
        );

        return wardDetails;
    }

    async dischargeCase(id: string) {
        const emergencyCase = await this.prisma.emergencyCase.findUnique({
            where: { id },
        });

        if (!emergencyCase) {
            throw new Error('Emergency case not found');
        }

        // 1. Update the emergency case status
        const updatedCase = await this.prisma.emergencyCase.update({
            where: { id },
            data: {
                status: 'DISCHARGED',
                updatedAt: new Date(),
            },
        });

        // 2. If it had a bed assigned, release it
        if (emergencyCase.bedId) {
            await this.prisma.bed.update({
                where: { id: emergencyCase.bedId },
                data: {
                    status: 'AVAILABLE',
                    patientId: null,
                    admissionDate: null,
                    diagnosis: null,
                },
            });

            // Log activity
            await this.prisma.bedActivity.create({
                data: {
                    bedId: emergencyCase.bedId,
                    action: 'ALTA',
                    details: `Paciente dado de alta desde Emergencias. Caso: ${id}`,
                }
            });
        }

        return updatedCase;
    }

    // --- Clinical Tracking Methods ---

    async addVitalSign(caseId: string, data: any) {
        // Also update the main case vitalSigns JSON for quick display
        await this.prisma.emergencyCase.update({
            where: { id: caseId },
            data: {
                vitalSigns: data,
                updatedAt: new Date()
            }
        });

        return this.prisma.emergencyVitalSign.create({
            data: {
                emergencyCaseId: caseId,
                hr: data.hr ? parseFloat(data.hr) : null,
                bp: data.bp,
                temp: data.temp ? parseFloat(data.temp) : null,
                spo2: data.spo2 ? parseFloat(data.spo2) : null,
                rr: data.rr ? parseFloat(data.rr) : null,
                performedBy: data.performedBy
            }
        });
    }

    async addMedication(caseId: string, data: any) {
        const emergencyCase = await this.prisma.emergencyCase.findUnique({
            where: { id: caseId },
            select: { patientId: true, staffId: true, staffName: true }
        });

        // 1. Create clinical record
        const newMed = await this.prisma.emergencyMedication.create({
            data: {
                emergencyCaseId: caseId,
                medicationId: data.medicationId || null,
                name: data.name,
                dosage: data.dosage,
                route: data.route,
                administeredBy: data.administeredBy || null,
                notes: data.notes || null,
            }
        });

        // 2. Create Pharmacy Order link
        if (emergencyCase?.patientId && emergencyCase?.staffId) {
            const orderCount = await this.prisma.pharmacyOrder.count();
            const orderNumber = `ORD-ER-${(orderCount + 1).toString().padStart(5, '0')}`;

            // [SENIOR] Precise linking
            let medication = null;
            if (data.medicationId) {
                medication = await this.prisma.medication.findUnique({
                    where: { id: data.medicationId }
                });
            } else {
                medication = await this.prisma.medication.findFirst({
                    where: { name: { contains: data.name, mode: 'insensitive' } }
                });
            }

            if (medication) {
                await this.prisma.pharmacyOrder.create({
                    data: {
                        orderNumber,
                        medicationId: medication.id,
                        emergencyCaseId: caseId, // [NEW] Explicit Case Link
                        quantity: 1, // Default unit for ER
                        staffId: emergencyCase.staffId,
                        patientId: emergencyCase.patientId,
                        status: 'PENDIENTE'
                    }
                });
                console.log(`[EmergencyService] Pharmacy order ${orderNumber} created for case ${caseId} linked to med ${medication.id}`);
            } else {
                console.warn(`[EmergencyService] Medication "${data.name}" (ID: ${data.medicationId}) not found in pharmacy library. Skipping order creation.`);
            }
        }

        return newMed;
    }

    async addProcedure(caseId: string, data: any) {
        return this.prisma.emergencyProcedure.create({
            data: {
                emergencyCaseId: caseId,
                name: data.name,
                description: data.description,
                performedBy: data.performedBy,
                result: data.result
            }
        });
    }

    async uploadAttachment(caseId: string, data: any) {
        return this.prisma.emergencyAttachment.create({
            data: {
                emergencyCaseId: caseId,
                title: data.title,
                url: data.url,
                type: data.type
            }
        });
    }

    async updateAttachment(id: string, data: { title: string }) {
        return this.prisma.emergencyAttachment.update({
            where: { id },
            data: { title: data.title }
        });
    }

    async deleteAttachment(id: string) {
        // In a real app, we would also delete the file from storage
        return this.prisma.emergencyAttachment.delete({
            where: { id }
        });
    }

    // --- Transfer Logic ---

    async transferPatient(id: string, data: { targetWard: string, targetBedId?: string, notes?: string }) {
        const { targetWard, targetBedId, notes } = data;

        const emergencyCase = await this.prisma.emergencyCase.findUnique({
            where: { id },
        });

        if (!emergencyCase) {
            throw new Error('Emergency case not found');
        }

        // 1. Update case status to OBSERVATION and cache new bed if provided
        const updateData: any = {
            status: 'OBSERVATION',
            notes: notes || `Trasladado a ${targetWard} el ${new Date().toISOString()}`,
            updatedAt: new Date(),
        };

        if (targetBedId) {
            const targetBed = await this.prisma.bed.findUnique({ where: { id: targetBedId } });
            if (targetBed) {
                updateData.bedId = targetBedId;
                updateData.bedNumber = targetBed.number;
            }
        }

        const updatedCase = await this.prisma.emergencyCase.update({
            where: { id },
            data: updateData,
        });

        // 2. Release the ER bed
        if (emergencyCase.bedId) {
            await this.prisma.bed.update({
                where: { id: emergencyCase.bedId },
                data: {
                    status: 'AVAILABLE',
                    patientId: null,
                    admissionDate: null,
                    diagnosis: null,
                },
            });

            // Log activity for the ER bed
            await this.prisma.bedActivity.create({
                data: {
                    bedId: emergencyCase.bedId,
                    action: 'TRASLADO',
                    details: `Paciente trasladado a ${targetWard}. Caso: ${id}`,
                }
            });
        }

        // 3. Occupy target bed if provided
        if (targetBedId) {
            await this.prisma.bed.update({
                where: { id: targetBedId },
                data: {
                    status: 'OCCUPIED',
                    patientId: emergencyCase.patientId,
                    admissionDate: new Date(),
                    diagnosis: emergencyCase.diagnosis || emergencyCase.chiefComplaint,
                    notes: notes || 'Traslado desde Emergencias'
                }
            });

            // Log activity for the target bed
            await this.prisma.bedActivity.create({
                data: {
                    bedId: targetBedId,
                    action: 'INGRESO',
                    details: `Paciente ingresado desde Emergencias. Caso: ${id}`,
                }
            });
        }

        // 3. Create a Medical Record entry for the transfer (Epicrisis de Traslado)
        if (emergencyCase.patientId && emergencyCase.staffId) {
            await this.prisma.medicalRecord.create({
                data: {
                    patientId: emergencyCase.patientId,
                    staffId: emergencyCase.staffId,
                    visitDate: new Date(),
                    chiefComplaint: emergencyCase.chiefComplaint,
                    diagnosis: emergencyCase.diagnosis || 'Pendiente',
                    treatment: `TRASLADO A ${targetWard.toUpperCase()}.`,
                    notes: notes || `Traslado a ${targetWard} para manejo continuo.`,
                    // We could also add a field for patient status if the schema supports it
                }
            });
        }

        return updatedCase;
    }
}
