import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, SearchPatientsDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../common/services/encryption.service';
import { differenceInYears } from 'date-fns';

function calculateLifeStage(dateOfBirth: Date | string): string {
    const dob = new Date(dateOfBirth);
    const age = differenceInYears(new Date(), dob);
    if (age < 12) return 'NINO';
    if (age < 18) return 'ADOLESCENTE';
    if (age < 30) return 'JOVEN';
    if (age < 60) return 'ADULTO';
    return 'ADULTO_MAYOR';
}

@Injectable()
export class PatientsService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
        private encryptionService: EncryptionService,
    ) { }

    async create(createPatientDto: CreatePatientDto) {
        try {
            // Validar DNI si es documento peruano
            if (createPatientDto.documentType === 'DNI' && createPatientDto.documentNumber?.length !== 8) {
                throw new BadRequestException('El DNI debe tener exactamente 8 caracteres.');
            }

            const lifeStage = calculateLifeStage(createPatientDto.dateOfBirth);

            // Encrypt sensitive fields
            const encryptedData: any = {
                ...createPatientDto,
                lifeStage,
                documentNumber: createPatientDto.documentNumber ? this.encryptionService.encrypt(createPatientDto.documentNumber) : undefined,
                phone: createPatientDto.phone ? this.encryptionService.encrypt(createPatientDto.phone) : undefined,
                address: createPatientDto.address ? this.encryptionService.encrypt(createPatientDto.address) : undefined,
                email: createPatientDto.email ? this.encryptionService.encrypt(createPatientDto.email) : undefined,
            };

            const patient = await this.prisma.patient.create({
                data: encryptedData,
            });

            await this.auditService.createLog({
                userId: 'SYSTEM',
                action: 'CREATE',
                resource: 'PATIENT',
                resourceId: patient.id,
                changes: createPatientDto
            });

            // Decrypt for returning
            patient.documentNumber = this.encryptionService.decrypt(patient.documentNumber);
            if (patient.phone) patient.phone = this.encryptionService.decrypt(patient.phone);
            if (patient.address) patient.address = this.encryptionService.decrypt(patient.address);
            if (patient.email) patient.email = this.encryptionService.decrypt(patient.email);

            return patient;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async importPatients(patients: CreatePatientDto[]) {
        try {
            const encryptedPatients = patients.map(p => ({
                ...p,
                lifeStage: calculateLifeStage(p.dateOfBirth),
                documentNumber: p.documentNumber ? this.encryptionService.encrypt(p.documentNumber) : undefined,
                phone: p.phone ? this.encryptionService.encrypt(p.phone) : undefined,
                address: p.address ? this.encryptionService.encrypt(p.address) : undefined,
                email: p.email ? this.encryptionService.encrypt(p.email) : undefined,
            }));

            return await this.prisma.patient.createMany({
                data: encryptedPatients,
                skipDuplicates: true,
            });
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async findAll(page: number = 1, limit: number = 20, search?: SearchPatientsDto) {
        const skip = (page - 1) * limit;
        const where: any = { deletedAt: null };

        if (search?.query) {
            where.OR = [
                { firstName: { contains: search.query, mode: 'insensitive' } },
                { lastName: { contains: search.query, mode: 'insensitive' } },
                { phone: { contains: search.query } },
                { email: { contains: search.query, mode: 'insensitive' } },
            ];
        }

        if (search?.gender) {
            where.gender = search.gender;
        }

        if (search?.status) {
            where.status = search.status;
        }

        if (search?.insuranceType) {
            where.insuranceProvider = search.insuranceType;
        }

        if (search?.sisStatus) {
            where.sisStatus = search.sisStatus;
        }

        if (search?.lifeStage) {
            where.lifeStage = search.lifeStage;
        }

        if (search?.sector) {
            where.sector = search.sector;
        }

        if (search?.ubigeo) {
            where.ubigeo = search.ubigeo;
        }

        if (search?.isIntercultural !== undefined) {
            where.isIntercultural = search.isIntercultural === 'true' || search.isIntercultural === true;
        }

        const [patients, total] = await Promise.all([
            this.prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            appointments: true,
                            medicalRecords: true,
                        },
                    },
                },
            }),
            this.prisma.patient.count({ where }),
        ]);

        // Decrypt patients for frontend
        const decryptedPatients = patients.map(p => {
            try {
                p.documentNumber = this.encryptionService.decrypt(p.documentNumber);
                if (p.phone) p.phone = this.encryptionService.decrypt(p.phone);
                if (p.address) p.address = this.encryptionService.decrypt(p.address);
                if (p.email) p.email = this.encryptionService.decrypt(p.email);
            } catch (e) {
                console.error(`Error decrypting patient ${p.id}:`, e.message);
            }
            return p;
        });

        return {
            data: decryptedPatients,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
            include: {
                appointments: {
                    take: 10,
                    orderBy: { appointmentDate: 'desc' },
                    include: { staff: { include: { user: true } } },
                },
                medicalRecords: {
                    take: 10,
                    orderBy: { visitDate: 'desc' },
                    include: { staff: { include: { user: true } } },
                },
                labOrders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                files: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                pharmacyOrders: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                }
            },
        });

        if (!patient || (patient as any).deletedAt) {
            throw new NotFoundException('Patient not found');
        }

        // Decrypt sensitive fields
        patient.documentNumber = this.encryptionService.decrypt(patient.documentNumber);
        if (patient.phone) patient.phone = this.encryptionService.decrypt(patient.phone);
        if (patient.address) patient.address = this.encryptionService.decrypt(patient.address);
        if (patient.email) patient.email = this.encryptionService.decrypt(patient.email);

        return patient;
    }

    async update(id: string, updatePatientDto: UpdatePatientDto) {
        const current = await this.findOne(id); // Already decrypted

        // Encrypt updated fields
        const encryptedData: any = { ...updatePatientDto };

        if (updatePatientDto.documentType === 'DNI' && updatePatientDto.documentNumber && updatePatientDto.documentNumber.length !== 8) {
            throw new BadRequestException('El DNI debe tener exactamente 8 caracteres.');
        }

        if (updatePatientDto.dateOfBirth) {
            encryptedData.lifeStage = calculateLifeStage(updatePatientDto.dateOfBirth);
        }

        if (encryptedData.documentNumber) encryptedData.documentNumber = this.encryptionService.encrypt(encryptedData.documentNumber);
        if (encryptedData.phone) encryptedData.phone = this.encryptionService.encrypt(encryptedData.phone);
        if (encryptedData.address) encryptedData.address = this.encryptionService.encrypt(encryptedData.address);
        if (encryptedData.email) encryptedData.email = this.encryptionService.encrypt(encryptedData.email);

        try {
            const updated = await this.prisma.patient.update({
                where: { id },
                data: encryptedData,
            });

            await this.auditService.createLog({
                userId: 'SYSTEM',
                action: 'UPDATE',
                resource: 'PATIENT',
                resourceId: id,
                changes: { from: current, to: updatePatientDto }
            });

            // Decrypt for returning
            updated.documentNumber = this.encryptionService.decrypt(updated.documentNumber);
            if (updated.phone) updated.phone = this.encryptionService.decrypt(updated.phone);
            if (updated.address) updated.address = this.encryptionService.decrypt(updated.address);
            if (updated.email) updated.email = this.encryptionService.decrypt(updated.email);

            return updated;
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    private handlePrismaError(error: any) {
        if (error.code === 'P2002') {
            const fields = error.meta?.target ? ` en: ${error.meta.target.join(', ')}` : '';
            throw new ConflictException(`Ya existe un paciente con este dato único${fields}.`);
        }
        console.error('Prisma Error:', error);
        throw new BadRequestException('Error al procesar datos del paciente. Verifique los campos enviados.');
    }

    async remove(id: string) {
        await this.findOne(id);

        return this.prisma.patient.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async getMedicalHistory(id: string) {
        await this.findOne(id);

        return this.prisma.medicalRecord.findMany({
            where: { patientId: id },
            orderBy: { visitDate: 'desc' },
            include: {
                staff: { include: { user: true } },
            },
        });
    }

    async enablePortalAccess(id: string) {
        const patient = await this.findOne(id) as any;

        const patientRole = await this.prisma.role.findFirst({
            where: { name: 'Patient' },
        });

        if (!patientRole) {
            throw new NotFoundException('Patient role not configured in system');
        }

        const tempPassword = `Portal${new Date().getFullYear()}!`;
        const hashedPassword = await import('bcrypt').then(m => m.hash(tempPassword, 10));

        if (patient.userId) {
            await this.prisma.user.update({
                where: { id: patient.userId },
                data: { password: hashedPassword }
            });

            const user = await this.prisma.user.findUnique({ where: { id: patient.userId } });

            return {
                message: 'Portal access reset successfully',
                credentials: {
                    email: user.email,
                    password: tempPassword
                }
            };
        }

        const baseEmail = patient.email || `patient${patient.documentNumber || patient.id.substring(0, 6)}@edicarex.portal`;

        let email = baseEmail;
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            email = `${patient.id.substring(0, 4)}.${baseEmail}`;
        }

        return this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    phone: patient.phone,
                    roleId: patientRole.id,
                    isActive: true,
                    patient: {
                        connect: { id: patient.id }
                    }
                } as any
            });

            return {
                message: 'Portal access enabled successfully',
                credentials: {
                    email: newUser.email,
                    password: tempPassword
                }
            };
        });
    }

    async getTimeline(id: string) {
        await this.findOne(id);

        const [appointments, diagnoses, medications, labOrders, vitalSigns] = await Promise.all([
            this.prisma.appointment.findMany({
                where: { patientId: id },
                orderBy: { appointmentDate: 'desc' },
                take: 50,
                include: { staff: { include: { user: true } } },
            }),
            (this.prisma as any).patientDiagnosis?.findMany({
                where: { patientId: id },
                orderBy: { diagnosedDate: 'desc' },
                take: 50,
            }) || Promise.resolve([]),
            (this.prisma as any).patientMedication?.findMany({
                where: { patientId: id },
                orderBy: { startDate: 'desc' },
                take: 50,
            }) || Promise.resolve([]),
            this.prisma.labOrder.findMany({
                where: { patientId: id },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            (this.prisma as any).patientVitalSign?.findMany({
                where: { patientId: id },
                orderBy: { recordedAt: 'desc' },
                take: 50,
            }) || Promise.resolve([]),
        ]);

        const events = [
            ...appointments.map(a => ({ type: 'APPOINTMENT', date: a.appointmentDate, data: a })),
            ...diagnoses.map(d => ({ type: 'DIAGNOSIS', date: d.diagnosedDate, data: d })),
            ...medications.map(m => ({ type: 'MEDICATION', date: m.startDate, data: m })),
            ...labOrders.map(l => ({ type: 'LAB_ORDER', date: l.createdAt, data: l })),
            ...vitalSigns.map(v => ({ type: 'VITAL_SIGN', date: v.recordedAt, data: v })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return events;
    }

    async getAllergies(id: string) {
        await this.findOne(id);
        return (this.prisma as any).patientAllergy?.findMany({
            where: { patientId: id },
            orderBy: { createdAt: 'desc' },
        }) || Promise.resolve([]);
    }

    async addAllergy(id: string, data: { allergen: string; reaction?: string; severity?: string; notes?: string }) {
        await this.findOne(id);
        return (this.prisma as any).patientAllergy.create({
            data: { patientId: id, ...data },
        });
    }

    async updateAllergy(id: string, allergyId: string, data: any) {
        await this.findOne(id);
        return (this.prisma as any).patientAllergy.update({
            where: { id: allergyId, patientId: id },
            data,
        });
    }

    async deleteAllergy(id: string, allergyId: string) {
        await this.findOne(id);
        return (this.prisma as any).patientAllergy.delete({
            where: { id: allergyId, patientId: id },
        });
    }

    async getVitalSigns(id: string, limit: number = 50) {
        await this.findOne(id);
        return (this.prisma as any).patientVitalSign?.findMany({
            where: { patientId: id },
            orderBy: { recordedAt: 'desc' },
            take: limit,
        }) || Promise.resolve([]);
    }

    async addVitalSign(id: string, data: any) {
        await this.findOne(id);
        return (this.prisma as any).patientVitalSign.create({
            data: { patientId: id, ...data },
        });
    }

    async getVitalSignsChart(id: string) {
        await this.findOne(id);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const vitals = await (this.prisma as any).patientVitalSign?.findMany({
            where: {
                patientId: id,
                recordedAt: { gte: sixMonthsAgo },
            },
            orderBy: { recordedAt: 'asc' },
        }) || [];

        return {
            weight: vitals.filter(v => v.weight).map(v => ({ date: v.recordedAt, value: v.weight })),
            bloodPressure: vitals.filter(v => v.bloodPressureSystolic).map(v => ({
                date: v.recordedAt,
                systolic: v.bloodPressureSystolic,
                diastolic: v.bloodPressureDiastolic,
            })),
            glucose: vitals.filter(v => v.glucose).map(v => ({ date: v.recordedAt, value: v.glucose })),
            heartRate: vitals.filter(v => v.heartRate).map(v => ({ date: v.recordedAt, value: v.heartRate })),
        };
    }

    async getMedications(id: string, activeOnly: boolean = false) {
        await this.findOne(id);
        const where: any = { patientId: id };
        if (activeOnly) where.isActive = true;

        return (this.prisma as any).patientMedication?.findMany({
            where,
            include: {
                prescribedBy: {
                    include: { user: true }
                }
            },
            orderBy: { startDate: 'desc' },
        }) || Promise.resolve([]);
    }

    async addMedication(id: string, data: any) {
        try {
            await this.findOne(id);

            const staff = await this.prisma.healthStaff.findFirst({
                include: { user: true }
            });

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

            if (staff && medication) {
                const orderCount = await this.prisma.pharmacyOrder.count();
                const orderNumber = `ORD-RX-${(orderCount + 1).toString().padStart(5, '0')}`;

                await (this.prisma as any).pharmacyOrder.create({
                    data: {
                        orderNumber,
                        medicationId: medication.id,
                        quantity: 1,
                        staffId: staff.id,
                        patientId: id,
                        status: 'PENDIENTE'
                    }
                });
            }

            const payload = {
                patientId: id,
                medicationId: medication?.id || data.medicationId || null,
                name: data.name,
                dosage: data.dosage,
                frequency: data.frequency,
                startDate: new Date(data.startDate || new Date()),
                instructions: data.instructions || data.notes || '',
                status: 'ACTIVE',
                prescribedById: staff?.id || null
            };

            return await (this.prisma as any).patientMedication.create({
                data: payload,
            });
        } catch (error) {
            console.error('Error adding medication:', error);
            throw new BadRequestException(`Error al agregar medicamento: ${error.message}`);
        }
    }

    async updateMedication(id: string, medicationId: string, data: any) {
        await this.findOne(id);
        return (this.prisma as any).patientMedication.update({
            where: { id: medicationId, patientId: id },
            data,
        });
    }

    async getDiagnoses(id: string) {
        await this.findOne(id);
        return (this.prisma as any).patientDiagnosis?.findMany({
            where: { patientId: id },
            orderBy: { diagnosedDate: 'desc' },
        }) || Promise.resolve([]);
    }

    async addDiagnosis(id: string, data: any) {
        await this.findOne(id);
        return (this.prisma as any).patientDiagnosis.create({
            data: { patientId: id, ...data },
        });
    }

    async updateDiagnosis(id: string, diagnosisId: string, data: any) {
        await this.findOne(id);
        return (this.prisma as any).patientDiagnosis.update({
            where: { id: diagnosisId, patientId: id },
            data,
        });
    }

    async getFamilyMembers(id: string) {
        await this.findOne(id);
        return (this.prisma as any).patientFamilyMember?.findMany({
            where: { patientId: id },
        }) || Promise.resolve([]);
    }

    async addFamilyMember(id: string, data: any) {
        await this.findOne(id);
        return (this.prisma as any).patientFamilyMember.create({
            data: { patientId: id, ...data },
        });
    }

    async updateFamilyMember(id: string, memberId: string, data: any) {
        await this.findOne(id);
        return (this.prisma as any).patientFamilyMember.update({
            where: { id: memberId, patientId: id },
            data,
        });
    }

    async deleteFamilyMember(id: string, memberId: string) {
        await this.findOne(id);
        return (this.prisma as any).patientFamilyMember.delete({
            where: { id: memberId, patientId: id },
        });
    }

    async getDocuments(id: string) {
        await this.findOne(id);
        return (this.prisma as any).patientDocument?.findMany({
            where: { patientId: id },
            orderBy: { uploadedAt: 'desc' },
        }) || Promise.resolve([]);
    }

    async addDocument(id: string, data: { name: string; type: string; url: string; mimeType?: string; size?: number; uploadedBy?: string }) {
        await this.findOne(id);
        return (this.prisma as any).patientDocument.create({
            data: { patientId: id, ...data },
        });
    }

    async deleteDocument(id: string, documentId: string) {
        await this.findOne(id);
        return (this.prisma as any).patientDocument.delete({
            where: { id: documentId, patientId: id },
        });
    }

    async addNote(id: string, data: { title: string; content: string }) {
        await this.findOne(id);

        const staff = await this.prisma.healthStaff.findFirst();

        if (!staff) {
            throw new BadRequestException('No se encontró personal de salud en el sistema para asignar la nota.');
        }

        return this.prisma.medicalRecord.create({
            data: {
                patientId: id,
                staffId: staff.id,
                visitDate: new Date(),
                chiefComplaint: data.title,
                diagnosis: 'Nota Clínica',
                notes: data.content,
                treatment: '',
                prescriptions: ''
            }
        });
    }

    async getVaccinations(id: string) {
        await this.findOne(id);
        return this.prisma.vaccination.findMany({
            where: { patientId: id },
            orderBy: { appliedAt: 'desc' }
        });
    }

    async getEncounters(id: string) {
        await this.findOne(id);
        return this.prisma.encounter.findMany({
            where: { patientId: id },
            orderBy: { createdAt: 'desc' },
            include: { staff: { include: { user: true } } }
        });
    }

    async getMinsaPrograms(id: string) {
        await this.findOne(id);
        return this.prisma.minsaProgramRecord.findMany({
            where: { patientId: id },
            orderBy: { visitDate: 'desc' },
            include: { program: true }
        });
    }

    async getSisHistory(id: string) {
        await this.findOne(id);
        return this.prisma.sISValidationLog.findMany({
            where: { patientId: id },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getDashboardStats() {
        const patients = await this.prisma.patient.findMany({
            where: { deletedAt: null },
            select: {
                lifeStage: true,
                insuranceProvider: true,
                sisStatus: true
            }
        });

        const stats = {
            total: patients.length,
            byLifeStage: {},
            byInsurance: {},
            bySisStatus: {}
        };

        patients.forEach(p => {
            const stage = p.lifeStage || 'UNKNOWN';
            stats.byLifeStage[stage] = (stats.byLifeStage[stage] || 0) + 1;

            const provider = p.insuranceProvider || 'NINGUNO';
            stats.byInsurance[provider] = (stats.byInsurance[provider] || 0) + 1;

            if (provider.startsWith('SIS')) {
                const sisState = p.sisStatus || 'NOT_AFFILIATED';
                stats.bySisStatus[sisState] = (stats.bySisStatus[sisState] || 0) + 1;
            }
        });

        return stats;
    }
}
