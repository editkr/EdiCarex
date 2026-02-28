import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    // ============================================
    // USER NOTIFICATIONS
    // ============================================
    async getNotifications(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            (this.prisma as any).notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            (this.prisma as any).notification.count({ where: { userId } }),
        ]);

        return {
            data: notifications,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getUnreadCount(userId: string) {
        const count = await (this.prisma as any).notification.count({
            where: { userId, isRead: false },
        });
        return { count };
    }

    async markAsRead(notificationId: string) {
        return (this.prisma as any).notification.update({
            where: { id: notificationId },
            data: { isRead: true, readAt: new Date() },
        });
    }

    async markAllAsRead(userId: string) {
        await (this.prisma as any).notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { message: 'All notifications marked as read' };
    }

    async create(data: {
        userId: string;
        title: string;
        message: string;
        type: string;
        relatedEntityType?: string;
        relatedEntityId?: string;
        link?: string;
    }) {
        return (this.prisma as any).notification.create({
            data: {
                ...data,
                isRead: false,
            },
        });
    }

    async deleteNotification(notificationId: string) {
        return (this.prisma as any).notification.delete({
            where: { id: notificationId },
        });
    }

    // ============================================
    // NOTIFICATION PREFERENCES
    // ============================================
    async getPreferences(userId: string) {
        let prefs = await (this.prisma as any).notificationPreference.findUnique({
            where: { userId },
        });

        if (!prefs) {
            // Create default preferences
            prefs = await (this.prisma as any).notificationPreference.create({
                data: { userId },
            });
        }

        return prefs;
    }

    async updatePreferences(userId: string, data: any) {
        return (this.prisma as any).notificationPreference.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
        });
    }

    // ============================================
    // SEND NOTIFICATIONS
    // ============================================
    async createNotification(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        relatedEntityType?: string;
        relatedEntityId?: string;
    }) {
        return (this.prisma as any).notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                relatedEntityType: data.relatedEntityType,
                relatedEntityId: data.relatedEntityId,
            },
        });
    }

    async sendAppointmentReminder(appointmentId: string) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                patient: true,
                staff: { include: { user: true } },
            },
        });

        if (!appointment) return null;

        // Log the notification
        const log = await (this.prisma as any).notificationLog.create({
            data: {
                type: 'APPOINTMENT_REMINDER',
                channel: 'EMAIL',
                recipient: appointment.patient.email || 'unknown',
                subject: 'Recordatorio de Cita',
                message: `Tiene una cita programada para el ${appointment.appointmentDate} con ${appointment.staff.user.firstName} ${appointment.staff.user.lastName}`,
                status: 'SENT',
                sentAt: new Date(),
            },
        });

        console.log(`[Notification] Appointment reminder sent for ${appointmentId}`);
        return log;
    }

    async sendLabResultReady(labOrderId: string) {
        const labOrder = await this.prisma.labOrder.findUnique({
            where: { id: labOrderId },
            include: { patient: true },
        });

        if (!labOrder) return null;

        const log = await (this.prisma as any).notificationLog.create({
            data: {
                type: 'LAB_READY',
                channel: 'EMAIL',
                recipient: labOrder.patient.email || 'unknown',
                subject: 'Resultados de Laboratorio Listos',
                message: `Sus resultados de laboratorio están listos para retiro.`,
                status: 'SENT',
                sentAt: new Date(),
            },
        });

        console.log(`[Notification] Lab result ready notification sent for ${labOrderId}`);
        return log;
    }

    // ============================================
    // NOTIFICATION TEMPLATES
    // ============================================
    async getTemplates() {
        return (this.prisma as any).notificationTemplate.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async createTemplate(data: any) {
        return (this.prisma as any).notificationTemplate.create({ data });
    }

    async updateTemplate(id: string, data: any) {
        return (this.prisma as any).notificationTemplate.update({
            where: { id },
            data,
        });
    }

    async deleteTemplate(id: string) {
        return (this.prisma as any).notificationTemplate.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // ============================================
    // NOTIFICATION LOGS
    // ============================================
    async getLogs(page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            (this.prisma as any).notificationLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            (this.prisma as any).notificationLog.count(),
        ]);

        return {
            data: logs,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findByRelatedEntity(entityType: string, entityId: string) {
        return (this.prisma as any).notification.findMany({
            where: {
                relatedEntityType: entityType,
                relatedEntityId: entityId,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
