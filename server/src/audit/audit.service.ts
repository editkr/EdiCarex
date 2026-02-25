import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async createLog(data: {
        userId: string;
        action: string;
        resource: string;
        resourceId?: string;
        changes?: any;
        ipAddress?: string;
        userAgent?: string;
    }) {
        console.log(`[AUDIT] Creating log: Action=${data.action}, Resource=${data.resource}`);
        return this.prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                resource: data.resource,
                resourceId: data.resourceId,
                changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    }

    async updateLog(id: string, data: { changes?: any }) {
        return this.prisma.auditLog.update({
            where: { id },
            data: {
                changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : undefined,
            },
        });
    }

    async deleteLog(id: string) {
        console.log(`[AUDIT] Deleting log: ID=${id}`);
        try {
            const result = await this.prisma.auditLog.delete({
                where: { id },
            });
            console.log(`[AUDIT] Delete successful for ID=${id}`);
            return result;
        } catch (error) {
            console.error(`[AUDIT] Delete FAILED for ID=${id}: ${error.message}`);
            throw error;
        }
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        userId?: string;
        resource?: string;
        action?: string;
        query?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { skip, take, userId, resource, action, query, startDate, endDate } = params;

        const where: Prisma.AuditLogWhereInput = {
            userId: userId || undefined,
            resource: resource || undefined,
            action: action || undefined,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            ...(query && {
                OR: [
                    { action: { contains: query, mode: 'insensitive' } },
                    { resource: { contains: query, mode: 'insensitive' } },
                    { ipAddress: { contains: query, mode: 'insensitive' } },
                    {
                        user: {
                            OR: [
                                { firstName: { contains: query, mode: 'insensitive' } },
                                { lastName: { contains: query, mode: 'insensitive' } },
                                { email: { contains: query, mode: 'insensitive' } },
                            ]
                        }
                    }
                ]
            })
        };

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: { select: { name: true } },
                        },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data: logs,
            meta: {
                total,
                page: skip / take + 1,
                lastPage: Math.ceil(total / take),
            },
        };
    }

    async getHistory(resource: string, resourceId: string) {
        return this.prisma.auditLog.findMany({
            where: {
                resource,
                resourceId,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async getStats() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [totalLogs, logsToday, uniqueUsersToday, byAction, byResource, trends] = await Promise.all([
            this.prisma.auditLog.count(),
            this.prisma.auditLog.count({
                where: { createdAt: { gte: startOfDay } },
            }),
            this.prisma.auditLog.groupBy({
                by: ['userId'],
                where: { createdAt: { gte: startOfDay } },
            }),
            this.prisma.auditLog.groupBy({
                by: ['action'],
                _count: true,
                orderBy: { _count: { action: 'desc' } },
                take: 5
            }),
            this.prisma.auditLog.groupBy({
                by: ['resource'],
                _count: true,
                orderBy: { _count: { resource: 'desc' } },
                take: 5
            }),
            this.prisma.auditLog.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' }
            })
        ]);

        // Process trends for the last 7 days
        const trendMap = new Map();
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            trendMap.set(date.toLocaleDateString(), 0);
        }

        trends.forEach(log => {
            const dateStr = log.createdAt.toLocaleDateString();
            if (trendMap.has(dateStr)) {
                trendMap.set(dateStr, trendMap.get(dateStr) + 1);
            }
        });

        const historicalTrends = Array.from(trendMap.entries())
            .map(([date, count]) => ({ date, count }))
            .reverse();

        return {
            totalLogs,
            logsToday,
            activeUsersToday: uniqueUsersToday.length,
            byAction: byAction.map(a => ({ name: a.action, value: a._count })),
            byResource: byResource.map(r => ({ name: r.resource, value: r._count })),
            historicalTrends
        };
    }
}
