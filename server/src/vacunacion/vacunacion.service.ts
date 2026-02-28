import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncountersService } from '../encounters/encounters.service';

@Injectable()
export class VacunacionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly encountersService: EncountersService,
    ) { }

    async getAll(category?: string, month?: string) {
        const where: any = {};
        if (category && category !== 'all') where.category = category;
        if (month) {
            const [year, m] = month.split('-').map(Number);
            where.appliedAt = {
                gte: new Date(year, m - 1, 1),
                lt: new Date(year, m, 1),
            };
        }
        return this.prisma.vaccination.findMany({
            where,
            include: { patient: { select: { firstName: true, lastName: true } } },
            orderBy: { appliedAt: 'desc' },
        });
    }

    async getStats(month?: string) {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 1);

        const [totalMonth, ninos, embarazadas, adultos, adultosMayores, today] = await Promise.all([
            this.prisma.vaccination.count({ where: { appliedAt: { gte: start, lt: end } } }),
            this.prisma.vaccination.count({ where: { appliedAt: { gte: start, lt: end }, category: 'NINO' } }),
            this.prisma.vaccination.count({ where: { appliedAt: { gte: start, lt: end }, category: 'EMBARAZADA' } }),
            this.prisma.vaccination.count({ where: { appliedAt: { gte: start, lt: end }, category: 'ADULTO' } }),
            this.prisma.vaccination.count({ where: { appliedAt: { gte: start, lt: end }, category: 'ADULTO_MAYOR' } }),
            this.prisma.vaccination.count({
                where: {
                    appliedAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
            }),
        ]);

        const topVaccines = await this.prisma.vaccination.groupBy({
            by: ['vaccineName'],
            where: { appliedAt: { gte: start, lt: end } },
            _count: { vaccineName: true },
            orderBy: { _count: { vaccineName: 'desc' } },
            take: 10,
        });

        return {
            totalMonth,
            today,
            byCategory: { ninos, embarazadas, adultos, adultosMayores },
            topVaccines: topVaccines.map(v => ({ name: v.vaccineName, count: v._count.vaccineName })),
        };
    }

    async create(data: any) {
        const vax = await this.prisma.vaccination.create({ data });

        if (vax.patientId) {
            await this.encountersService.create({
                type: 'CONTROL',
                status: 'CLOSED',
                closedAt: new Date(),
                patient: { connect: { id: vax.patientId } },
                reason: `Inmunización: ${vax.vaccineName} (${vax.doseNumber})`,
                notes: `Vacunador: ${vax.appliedBy}. Lote: ${vax.lotNumber}. Próxima dosis: ${vax.nextDoseDate?.toLocaleDateString() || 'N/A'}`,
            } as any);
        }

        return vax;
    }

    async update(id: string, data: any) {
        return this.prisma.vaccination.update({ where: { id }, data });
    }

    async getById(id: string) {
        return this.prisma.vaccination.findUnique({
            where: { id },
            include: { patient: true },
        });
    }
}
