import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';

// Duración estándar según normativa MINSA de consulta externa (minutos)
const APPOINTMENT_DURATION_MAP: Record<string, number> = {
    CONSULTA_MEDICINA_GENERAL: 20,
    CONSULTA_OBSTETRICIA: 30,
    CONTROL_PRENATAL: 30,
    CONSULTA_ODONTOLOGIA: 30,
    CONSULTA_PSICOLOGIA: 45,
    CONSULTA_NUTRICION: 45,
    CONSULTA_ASISTENCIA_SOCIAL: 30,
    CONTROL_CRED: 20,
    VACUNACION: 15,
    LABORATORIO: 15,
    TRIAJE: 15,
    TELEMEDICINA: 20,
    VISITA_DOMICILIARIA: 45,
};

// UPSS automática según tipo de cita (NTS N°021, RM 546-2011)
const UPSS_MAP: Record<string, string> = {
    CONSULTA_MEDICINA_GENERAL: 'CONSULTA_EXTERNA',
    CONSULTA_OBSTETRICIA: 'CONSULTA_EXTERNA',
    CONTROL_PRENATAL: 'CONSULTA_EXTERNA',
    CONSULTA_ODONTOLOGIA: 'CONSULTA_EXTERNA',
    CONSULTA_PSICOLOGIA: 'CONSULTA_EXTERNA',
    CONSULTA_NUTRICION: 'CONSULTA_EXTERNA',
    CONSULTA_ASISTENCIA_SOCIAL: 'CONSULTA_EXTERNA',
    CONTROL_CRED: 'CONSULTA_EXTERNA',
    VACUNACION: 'INMUNIZACIONES',
    LABORATORIO: 'PATOLOGIA_CLINICA',
    TRIAJE: 'CONSULTA_EXTERNA',
    TELEMEDICINA: 'CONSULTA_EXTERNA',
    VISITA_DOMICILIARIA: 'CONSULTA_EXTERNA',
};

@Injectable()
export class AppointmentsService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
        private notificationsService: NotificationsService,
    ) { }

    private validateScheduleHours(appointmentDate: Date): void {
        const hours = appointmentDate.getHours();
        const minutes = appointmentDate.getMinutes();
        const timeInMinutes = hours * 60 + minutes;
        // 08:00 = 480 min, 18:00 = 1080 min
        if (timeInMinutes < 480 || timeInMinutes >= 1080) {
            throw new BadRequestException(
                'El horario de citas es de 08:00 a 18:00 horas. No se pueden agendar citas fuera de este rango (Horario oficial C.S. Jorge Chávez).'
            );
        }
    }

    private calculateAge(dateOfBirth: Date | string | null): number {
        if (!dateOfBirth) return 30; // Default if not available
        const birth = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    private async checkSlotConflict(
        staffId: string,
        appointmentDate: Date,
        estimatedDuration: number,
        excludeId?: string,
    ): Promise<void> {
        const endDate = new Date(appointmentDate.getTime() + estimatedDuration * 60000);
        const conflict = await this.prisma.appointment.findFirst({
            where: {
                staffId,
                deletedAt: null,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
                id: excludeId ? { not: excludeId } : undefined,
                AND: [
                    { appointmentDate: { lt: endDate } },
                    {
                        appointmentDate: {
                            gte: new Date(appointmentDate.getTime() - 90 * 60000), // ventana máxima 90 min
                        },
                    },
                ],
            },
        });
        if (conflict) {
            throw new ConflictException(
                `El profesional ya tiene una cita programada en ese horario (${new Date(conflict.appointmentDate).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}). Por favor elija otro horario.`
            );
        }
    }

    async create(data: any) {
        try {
            let triageScore = null;
            let triageNotes = null;

            let priority = (typeof data.priority === 'string' && data.priority) ? data.priority : 'NORMAL';

            // Combinar fecha y hora para validación
            const appointmentDate = new Date(data.appointmentDate);
            if (data.time) {
                const [h, m] = data.time.split(':');
                appointmentDate.setHours(parseInt(h), parseInt(m), 0, 0);
            }

            // Validar horario 08:00–18:00 (normativa C.S. Jorge Chávez)
            this.validateScheduleHours(appointmentDate);

            // Auto-calcular duración y UPSS según tipo
            const estimatedDuration = data.estimatedDuration
                ? parseInt(data.estimatedDuration)
                : (APPOINTMENT_DURATION_MAP[data.type] || 20);

            const upss = data.upss || UPSS_MAP[data.type] || 'CONSULTA_EXTERNA';

            // Verificar conflicto de horario del profesional
            if (data.staffId) {
                await this.checkSlotConflict(data.staffId, appointmentDate, estimatedDuration);
            }

            if (data.symptoms) {
                try {
                    const triage = await this.aiService.predictTriage({
                        symptoms: data.symptoms,
                        age: 30,
                        vitalSigns: {},
                    });
                    triageScore = triage.score;
                    triageNotes = triage.notes;
                    priority = (typeof triage.priority === 'string' && triage.priority) ? triage.priority : 'NORMAL';
                } catch (error) {
                    console.error('AI triage failed (non-critical):', error);
                }
            }

            const { time, ...rest } = data;

            const appointment = await this.prisma.appointment.create({
                data: {
                    ...rest,
                    appointmentDate,
                    startTime: time,
                    triageScore,
                    triageNotes,
                    priority,
                    estimatedDuration,
                    upss,
                },
                include: {
                    patient: true,
                    staff: { include: { user: true, specialty: true } },
                },
            });

            await this.prisma.appointmentHistory.create({
                data: {
                    appointmentId: appointment.id,
                    status: 'SCHEDULED',
                    notes: 'Cita creada',
                },
            });

            if (appointment.staff?.user?.id) {
                await this.notificationsService.create({
                    userId: appointment.staff.user.id,
                    title: 'Nueva Cita Agendada',
                    message: `Nueva cita con ${appointment.patient.firstName} ${appointment.patient.lastName} para el ${appointmentDate.toLocaleDateString('es-PE')} a las ${time || appointmentDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}.`,
                    type: 'APPOINTMENT_REMINDER',
                    relatedEntityType: 'APPOINTMENT',
                    relatedEntityId: appointment.id,
                });
            }

            return appointment;
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof ConflictException) throw error;
            console.error('Failed to create appointment:', error);
            throw new BadRequestException(`Error creando cita: ${error.message}`);
        }
    }

    async findAll(page: number = 1, limit: number = 100, filters?: any) {
        try {
            const skip = (page - 1) * limit;
            const where: any = { deletedAt: null };

            if (filters?.status && filters.status !== 'all') where.status = filters.status;
            if (filters?.staffId && filters.staffId !== 'all') where.staffId = filters.staffId;
            if (filters?.patientId) where.patientId = filters.patientId;

            // Nuevos filtros MINSA
            if (filters?.appointmentType && filters.appointmentType !== 'all') where.type = filters.appointmentType;
            if (filters?.financiador && filters.financiador !== 'all') where.financiador = filters.financiador;
            if (filters?.patientCondition && filters.patientCondition !== 'all') where.patientCondition = filters.patientCondition;
            if (filters?.upss && filters.upss !== 'all') where.upss = filters.upss;
            if (filters?.hisLinked !== undefined && filters.hisLinked !== 'all') {
                where.hisLinked = filters.hisLinked === 'true' || filters.hisLinked === true;
            }

            // Filtro por rango de fechas
            if (filters?.startDate || filters?.endDate) {
                where.appointmentDate = {};
                if (filters.startDate) where.appointmentDate.gte = new Date(filters.startDate);
                if (filters.endDate) where.appointmentDate.lte = new Date(filters.endDate);
            } else if (filters?.date) {
                const date = new Date(filters.date);
                if (!isNaN(date.getTime())) {
                    where.appointmentDate = {
                        gte: date,
                        lt: new Date(new Date(date).setDate(date.getDate() + 1)),
                    };
                }
            }

            const [appointments, total] = await Promise.all([
                this.prisma.appointment.findMany({
                    where,
                    include: {
                        patient: true,
                        staff: { include: { user: true, specialty: true } },
                        history: { orderBy: { createdAt: 'desc' } },
                    },
                    skip,
                    take: limit,
                    orderBy: { appointmentDate: 'asc' },
                }),
                this.prisma.appointment.count({ where }),
            ]);

            return {
                data: appointments,
                meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
            };
        } catch (error) {
            console.error('Error in findAll appointments:', error);
            return {
                data: [],
                meta: { total: 0, page: 1, limit: 100, error: 'Failed to load appointments' },
            };
        }
    }

    async findOne(id: string) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: {
                patient: true,
                staff: { include: { user: true, specialty: true } },
                history: { orderBy: { createdAt: 'desc' } },
                medicalRecords: true,
            },
        });

        if (!appointment || appointment.deletedAt) {
            throw new NotFoundException('Cita no encontrada');
        }

        return appointment;
    }

    async updateStatus(id: string, status: string, notes?: string) {
        await this.findOne(id);

        const updated = await this.prisma.appointment.update({
            where: { id },
            data: { status },
            include: {
                patient: true,
                staff: { include: { user: true } },
            },
        });

        await this.prisma.appointmentHistory.create({
            data: {
                appointmentId: id,
                status,
                notes: notes || `Estado actualizado a ${status}`,
            },
        });

        return updated;
    }

    async update(id: string, data: any) {
        const { time, ...rest } = data;
        const updateData: any = { ...rest };
        if (time) updateData.startTime = time;

        // Si hay nueva fecha/hora, re-validar horario
        if (updateData.appointmentDate) {
            const newDate = new Date(updateData.appointmentDate);
            this.validateScheduleHours(newDate);
        }

        return this.prisma.appointment.update({
            where: { id },
            data: updateData,
            include: {
                patient: true,
                staff: { include: { user: true, specialty: true } },
            },
        });
    }

    async remove(id: string) {
        return this.prisma.appointment.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async getDashboardStats() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const [
            todayTotal,
            todayCompleted,
            weekTotal,
            pendingHis,
            monthByType,
            monthByFinanciador,
            newPatientsMonth,
            monthCompleted,
            monthTotal,
        ] = await Promise.all([
            this.prisma.appointment.count({ where: { deletedAt: null, appointmentDate: { gte: startOfDay, lte: endOfDay } } }),
            this.prisma.appointment.count({ where: { deletedAt: null, status: 'COMPLETED', appointmentDate: { gte: startOfDay, lte: endOfDay } } }),
            this.prisma.appointment.count({ where: { deletedAt: null, appointmentDate: { gte: startOfWeek } } }),
            this.prisma.appointment.count({ where: { deletedAt: null, status: 'COMPLETED', hisLinked: false } }),
            this.prisma.appointment.groupBy({ by: ['type'], where: { deletedAt: null, appointmentDate: { gte: startOfMonth, lte: endOfMonth } }, _count: { type: true } }),
            this.prisma.appointment.groupBy({ by: ['financiador'], where: { deletedAt: null, appointmentDate: { gte: startOfMonth, lte: endOfMonth } }, _count: { financiador: true } }),
            this.prisma.appointment.count({ where: { deletedAt: null, patientCondition: 'NUEVO', appointmentDate: { gte: startOfMonth, lte: endOfMonth } } }),
            this.prisma.appointment.count({ where: { deletedAt: null, status: 'COMPLETED', appointmentDate: { gte: startOfMonth, lte: endOfMonth } } }),
            this.prisma.appointment.count({ where: { deletedAt: null, appointmentDate: { gte: startOfMonth, lte: endOfMonth } } }),
        ]);

        const completionRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

        return {
            today: { total: todayTotal, completed: todayCompleted },
            week: { total: weekTotal },
            month: {
                total: monthTotal,
                completed: monthCompleted,
                completionRate,
                newPatients: newPatientsMonth,
                pendingHis,
                byType: monthByType.map(t => ({ type: t.type, count: t._count.type })),
                byFinanciador: monthByFinanciador.map(f => ({ financiador: f.financiador, count: f._count.financiador })),
            },
        };
    }

    async generateHis(id: string) {
        const appointment = await this.findOne(id);

        if (appointment.status !== 'COMPLETED') {
            throw new BadRequestException('Solo se puede registrar en HIS una cita completada.');
        }

        if (appointment.hisLinked) {
            throw new BadRequestException('Esta cita ya fue registrada en el sistema HIS.');
        }

        // Mapear financiador de cita al código HIS
        const financingTypeMap: Record<string, string> = {
            '02': 'SIS', '03': 'ESSALUD', '01': 'PAGANTE',
            '04': 'SOAT', '09': 'OTROS',
        };
        const financingType = financingTypeMap[appointment.financiador] || 'SIS';

        // Mapear tipo de cita al tipo de servicio HIS
        const serviceTypeMap: Record<string, string> = {
            CONSULTA_MEDICINA_GENERAL: 'CONSULTATION',
            CONSULTA_OBSTETRICIA: 'OBSTETRICS',
            CONTROL_PRENATAL: 'PRENATAL',
            CONSULTA_ODONTOLOGIA: 'DENTISTRY',
            CONSULTA_PSICOLOGIA: 'PSYCHOLOGY',
            CONSULTA_NUTRICION: 'NUTRITION',
            CONSULTA_ASISTENCIA_SOCIAL: 'SOCIAL_WORK',
            CONTROL_CRED: 'CRED',
            VACUNACION: 'VACCINATION',
            LABORATORIO: 'LABORATORY',
            TRIAJE: 'TRIAGE',
            TELEMEDICINA: 'TELEMEDICINE',
            VISITA_DOMICILIARIA: 'HOME_VISIT',
        };

        try {
            const diagCodes = Array.isArray(appointment.diagnosisCodes) ? appointment.diagnosisCodes : [];
            const firstDiag = diagCodes[0] as any;

            const hisRecord = await this.prisma.hISRecord.create({
                data: {
                    patientId: appointment.patientId,
                    staffId: appointment.staffId,
                    attentionDate: appointment.appointmentDate,
                    serviceType: serviceTypeMap[appointment.type] || 'CONS_EXT',
                    fundingType: financingType,
                    conditionType: appointment.patientCondition || 'CONTINUADOR',
                    diagnosis: firstDiag?.code || firstDiag?.description || appointment.reason,
                    age: this.calculateAge(appointment.patient?.dateOfBirth),
                    gender: appointment.patient?.gender === 'FEMALE' ? 'F' : 'M',
                    ubigeo: appointment.patient?.ubigeo || '211101', // Juliaca/San Román default
                    exportFields: {
                        prescriptions: appointment.prescriptions,
                        vitalSigns: appointment.vitalSignsAtEntry,
                    } as any,
                },
            });

            // Marcar la cita como vinculada al HIS
            await this.prisma.appointment.update({
                where: { id },
                data: { hisLinked: true, hisRecordId: hisRecord.id },
            });

            return { success: true, hisRecordId: hisRecord.id, message: 'Registro HIS creado exitosamente.' };
        } catch (error) {
            console.error('Error generating HIS record:', error);
            throw new BadRequestException(`Error al generar registro HIS: ${error.message}`);
        }
    }
}
