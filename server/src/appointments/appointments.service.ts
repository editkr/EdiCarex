import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
        private notificationsService: NotificationsService,
    ) { }

    async create(data: any) {
        try {
            // Get AI triage if symptoms provided
            let triageScore = null;
            let triageNotes = null;

            // Ensure priority is always a valid string, ignore invalid values
            let priority = (typeof data.priority === 'string' && data.priority) ? data.priority : 'NORMAL';

            if (data.symptoms) {
                try {
                    const triage = await this.aiService.predictTriage({
                        symptoms: data.symptoms,
                        age: 30, // Would get from patient
                        vitalSigns: {},
                    });
                    triageScore = triage.score;
                    triageNotes = triage.notes;
                    // Ensure priority from AI is always a valid string
                    priority = (typeof triage.priority === 'string' && triage.priority) ? triage.priority : 'NORMAL';
                } catch (error) {
                    // Non-critical: Log and proceed with default priority
                    console.error('AI triage failed (non-critical):', error);
                }
            }

            // Clean data payload to match Prisma schema
            // Map 'time' -> 'startTime'
            const { time, ...rest } = data;

            console.log('[DEBUG] Creating Appointment Payload:', { ...rest, startTime: time });
            const appointment = await this.prisma.appointment.create({
                data: {
                    ...rest,
                    startTime: time, // Map time to startTime
                    triageScore,
                    triageNotes,
                    priority,
                },
                include: {
                    patient: true,
                    staff: { include: { user: true, specialty: true } },
                },
            });

            // Create history entry
            await this.prisma.appointmentHistory.create({
                data: {
                    appointmentId: appointment.id,
                    status: 'SCHEDULED',
                    notes: 'Cita creada',
                },
            });

            // Create notification for the staff member
            if (appointment.staff?.user?.id) {
                await this.notificationsService.create({
                    userId: appointment.staff.user.id,
                    title: 'Nueva Cita Agendada',
                    message: `Tienes una nueva cita con ${appointment.patient.firstName} ${appointment.patient.lastName} para el ${new Date(appointment.startTime).toLocaleDateString()} a las ${appointment.startTime.toString().split('T')[1]?.substring(0, 5) || 'hora agendada'}.`,
                    type: 'APPOINTMENT_REMINDER',
                    relatedEntityType: 'APPOINTMENT',
                    relatedEntityId: appointment.id,
                });
            }

            return appointment;
        } catch (error) {
            console.error('Failed to create appointment:', error);
            // Re-throw as BadRequest to show meaningful error to client
            throw new BadRequestException(`Error creando cita: ${error.message}`);
        }
    }

    async findAll(page: number = 1, limit: number = 20, filters?: any) {
        try {
            const skip = (page - 1) * limit;
            const where: any = { deletedAt: null };

            if (filters?.status && filters.status !== 'all') where.status = filters.status;
            if (filters?.staffId && filters.staffId !== 'all') where.staffId = filters.staffId;
            if (filters?.patientId) where.patientId = filters.patientId;
            if (filters?.date) {
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
                        history: { orderBy: { createdAt: 'desc' } }, // Include history for accurate tracking
                    },
                    skip,
                    take: limit,
                    orderBy: { appointmentDate: 'desc' },
                }),
                this.prisma.appointment.count({ where }),
            ]);

            return {
                data: appointments,
                meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
            };
        } catch (error) {
            console.error('Error in findAll appointments:', error);
            // Return empty list instead of crashing, to allow UI to render
            return {
                data: [],
                meta: { total: 0, page: 1, limit: 10, error: 'Failed to load appointments' },
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
            throw new NotFoundException('Appointment not found');
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

        // Create history entry
        await this.prisma.appointmentHistory.create({
            data: {
                appointmentId: id,
                status,
                notes: notes || `El estado cambió a ${status}`,
            },
        });

        return updated;
    }

    async update(id: string, data: any) {
        // Clean data payload to match Prisma schema
        // Map 'time' -> 'startTime'
        const { time, ...rest } = data;

        const updateData: any = { ...rest };
        if (time) updateData.startTime = time;

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
}
