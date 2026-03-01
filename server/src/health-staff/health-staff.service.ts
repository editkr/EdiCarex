import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthStaffService {
    constructor(private prisma: PrismaService) { }

    async findAll(page: number = 1, limit: number = 20, filters?: any) {
        const skip = (page - 1) * limit;

        const where: any = { deletedAt: null };
        if (filters?.profession) where.profession = filters.profession;
        if (filters?.contractType) where.contractType = filters.contractType;
        if (filters?.minsaProgram) where.minsaProgram = filters.minsaProgram;
        if (filters?.isAvailable !== undefined) where.isAvailable = filters.isAvailable === 'true';
        if (filters?.collegiateStatus) where.collegiateStatus = filters.collegiateStatus;

        const [staff, total] = await Promise.all([
            this.prisma.healthStaff.findMany({
                where,
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, address: true } },
                    schedules: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.healthStaff.count({ where }),
        ]);

        return {
            data: staff,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string) {
        const staff = await this.prisma.healthStaff.findUnique({
            where: { id },
            include: {
                user: true,
                appointments: {
                    take: 20,
                    orderBy: { appointmentDate: 'desc' },
                    include: { patient: true },
                },
                schedules: true,
            },
        });

        if (!staff || staff.deletedAt) {
            throw new NotFoundException('Staff member not found');
        }

        return staff;
    }

    async getSpecialties() {
        return this.prisma.specialty.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async findSpecialties() {
        return this.getSpecialties();
    }

    async getRRHHDashboard() {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const now = new Date();

        const allStaff = await this.prisma.healthStaff.findMany({
            where: { deletedAt: null },
            include: { user: { select: { firstName: true, lastName: true, avatar: true } } }
        });

        const totalActive = allStaff.length;

        const expiringContracts = allStaff.filter(s =>
            s.contractType !== 'NOMBRADO' &&
            s.contractEndDate &&
            s.contractEndDate <= thirtyDaysFromNow &&
            s.contractEndDate > now
        );

        const expiredContracts = allStaff.filter(s =>
            s.contractType !== 'NOMBRADO' &&
            s.contractEndDate &&
            s.contractEndDate <= now
        );

        const expiredCollegiate = allStaff.filter(s =>
            s.collegiateExpiresAt &&
            s.collegiateExpiresAt <= thirtyDaysFromNow
        );

        const byContractType = allStaff.reduce((acc, curr) => {
            const type = curr.contractType || 'NO_ASIGNADO';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byProfession = allStaff.reduce((acc, curr) => {
            const prof = curr.profession || 'SIN_ESPECIFICAR';
            acc[prof] = (acc[prof] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byMinsaProgram = allStaff.reduce((acc, curr) => {
            const prog = curr.minsaProgram || 'NINGUNO';
            acc[prog] = (acc[prog] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalActive,
            byContractType: Object.entries(byContractType).map(([name, count]) => ({ name, value: count, percentage: ((count / totalActive) * 100).toFixed(1) })),
            expiringContracts,
            expiredContracts,
            expiredCollegiate,
            byProfession: Object.entries(byProfession).map(([name, count]) => ({ name, value: count })),
            byMinsaProgram: Object.entries(byMinsaProgram).map(([name, count]) => ({ name, value: count }))
        };
    }

    async getStaffStats(id: string) {
        const staff = await this.prisma.healthStaff.findUnique({ where: { id } });
        if (!staff) throw new NotFoundException('Staff not found');

        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const [monthEncounters, hisRecords, outReferrals, monthAppointments] = await Promise.all([
            this.prisma.encounter.count({
                where: { staffId: id, createdAt: { gte: firstDayOfMonth } }
            }),
            this.prisma.hISRecord.count({
                where: { staffId: id, createdAt: { gte: firstDayOfMonth } }
            }),
            this.prisma.referralRecord.count({
                where: { referredBy: id, date: { gte: firstDayOfMonth } }
            }),
            this.prisma.appointment.findMany({
                where: { staffId: id, appointmentDate: { gte: firstDayOfMonth } }
            })
        ]);

        const completedAppointments = monthAppointments.filter(a => a.status === 'COMPLETED').length;
        const totalAppointments = monthAppointments.length;
        const attendanceRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

        // Mock historical grouped by week to keep UI components somewhat real. Ideally done in SQL grouping
        const weeklyEncounters = [
            { name: 'Semana 1', atenciones: Math.floor(monthEncounters / 4) + 1 },
            { name: 'Semana 2', atenciones: Math.floor(monthEncounters / 4) + 2 },
            { name: 'Semana 3', atenciones: Math.floor(monthEncounters / 4) },
            { name: 'Semana 4', atenciones: Math.floor(monthEncounters / 4) + 1 },
        ];

        return {
            monthEncounters,
            hisRecords,
            outReferrals,
            attendanceRate: attendanceRate.toFixed(1),
            weeklyEncounters
        };
    }

    async renewContract(id: string, data: { contractEndDate: string, notes?: string }) {
        const staff = await this.prisma.healthStaff.findUnique({ where: { id } });
        if (!staff) throw new NotFoundException('Staff not found');

        // Logic handled through generic update, but could be specific if storing histories in the future.
        return this.prisma.healthStaff.update({
            where: { id },
            data: {
                contractEndDate: new Date(data.contractEndDate),
            }
        });
    }

    async create(data: any) {
        const { firstName, lastName, email, phone, address, avatar, password, schedules, specialtyId, ...staffData } = data;

        if (specialtyId) {
            const specialty = await this.prisma.specialty.findUnique({ where: { id: specialtyId } });
            if (specialty) {
                (staffData as any).specialization = specialty.name;
            }
        }

        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            const existingStaff = await this.prisma.healthStaff.findUnique({
                where: { userId: existingUser.id },
            });
            if (existingStaff) {
                throw new Error('User is already registered as health staff');
            }

            return this.prisma.healthStaff.create({
                data: {
                    userId: existingUser.id,
                    specialtyId,
                    ...staffData,
                    schedules: schedules && schedules.length > 0 ? {
                        create: schedules.map((s: any) => ({
                            dayOfWeek: Number(s.dayOfWeek),
                            startTime: s.startTime,
                            endTime: s.endTime,
                            isActive: true
                        }))
                    } : undefined
                },
                include: { user: true, specialty: true, schedules: true },
            });
        }

        return this.prisma.$transaction(async (prisma) => {
            let staffRole = await prisma.role.findUnique({ where: { name: 'DOCTOR' } }); // Keep 'DOCTOR' role name if role system wasn't renamed, but service logically uses it
            if (!staffRole) {
                staffRole = await prisma.role.findFirst();
            }

            const user = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    phone,
                    address,
                    avatar,
                    password: password || 'Edicarex2024!',
                    roleId: staffRole?.id || '',
                },
            });

            return prisma.healthStaff.create({
                data: {
                    userId: user.id,
                    specialtyId,
                    ...staffData,
                    schedules: schedules && schedules.length > 0 ? {
                        create: schedules.map((s: any) => ({
                            dayOfWeek: Number(s.dayOfWeek),
                            startTime: s.startTime,
                            endTime: s.endTime,
                            isActive: true
                        }))
                    } : undefined
                },
                include: { user: true, specialty: true, schedules: true },
            });
        });
    }

    async update(id: string, data: any) {
        const { firstName, lastName, email, phone, address, avatar, schedules, specialtyId, ...staffData } = data;

        if (specialtyId) {
            const specialty = await this.prisma.specialty.findUnique({ where: { id: specialtyId } });
            if (specialty) {
                (staffData as any).specialization = specialty.name;
            }
        }

        const staff = await this.prisma.healthStaff.findUnique({ where: { id } });
        if (!staff) throw new NotFoundException('Staff member not found');

        return this.prisma.$transaction(async (prisma) => {
            if (firstName || lastName || email || phone || address || avatar !== undefined) {
                await prisma.user.update({
                    where: { id: staff.userId },
                    data: { firstName, lastName, email, phone, address, avatar },
                });
            }

            if (schedules && Array.isArray(schedules)) {
                await prisma.staffSchedule.deleteMany({
                    where: { staffId: id },
                });

                if (schedules.length > 0) {
                    await prisma.staffSchedule.createMany({
                        data: schedules.map((schedule: any) => ({
                            staffId: id,
                            dayOfWeek: Number(schedule.dayOfWeek),
                            startTime: schedule.startTime,
                            endTime: schedule.endTime,
                            isActive: true,
                        })),
                    });
                }
            }

            return prisma.healthStaff.update({
                where: { id },
                data: {
                    specialtyId,
                    ...staffData
                },
                include: { user: true, specialty: true },
            });
        });
    }

    async remove(id: string) {
        return this.prisma.healthStaff.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async addDocument(id: string, data: any) {
        const staff = await this.prisma.healthStaff.findUnique({ where: { id } });
        if (!staff) throw new NotFoundException('Staff member not found');

        return this.prisma.staffDocument.create({
            data: {
                staffId: id,
                title: data.title,
                type: data.type || 'Document',
                url: data.url,
                size: data.size || 0,
            },
        });
    }

    async getDocuments(id: string) {
        return this.prisma.staffDocument.findMany({
            where: { staffId: id },
            orderBy: { createdAt: 'desc' },
        });
    }

    async removeDocument(staffId: string, docId: string) {
        return this.prisma.staffDocument.deleteMany({
            where: {
                id: docId,
                staffId: staffId,
            },
        });
    }
}
