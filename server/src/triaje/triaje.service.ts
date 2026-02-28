import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { EncountersService } from '../encounters/encounters.service';

@Injectable()
export class TriajeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly encountersService: EncountersService,
    ) { }

    async getAll(date?: string) {
        const startOfDay = date ? new Date(date) : new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.triage.findMany({
            where: {
                triageAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: { patient: { select: { firstName: true, lastName: true, documentNumber: true } } },
            orderBy: [
                { priority: 'asc' }, // ROJO primero
                { triageAt: 'asc' },
            ],
        });
    }

    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [total, waiting, rojo, naranja, verde, atendidos] = await Promise.all([
            this.prisma.triage.count({ where: { triageAt: { gte: today, lt: tomorrow } } }),
            this.prisma.triage.count({ where: { triageAt: { gte: today, lt: tomorrow }, status: 'WAITING' } }),
            this.prisma.triage.count({ where: { triageAt: { gte: today, lt: tomorrow }, priority: 'ROJO' } }),
            this.prisma.triage.count({ where: { triageAt: { gte: today, lt: tomorrow }, priority: 'NARANJA' } }),
            this.prisma.triage.count({ where: { triageAt: { gte: today, lt: tomorrow }, priority: 'VERDE' } }),
            this.prisma.triage.count({ where: { triageAt: { gte: today, lt: tomorrow }, status: 'COMPLETED' } }),
        ]);

        return { total, waiting, rojo, naranja, verde, atendidos };
    }

    async create(data: any) {
        return this.prisma.triage.create({ data });
    }

    async update(id: string, data: any) {
        return this.prisma.triage.update({ where: { id }, data });
    }

    async updateStatus(id: string, status: string) {
        const updateData: any = { status };
        if (status === 'IN_ATTENTION') updateData.attendedAt = new Date();
        if (status === 'COMPLETED') {
            updateData.completedAt = new Date();

            // Buscar datos del triaje para el encuentro
            const triage = await this.prisma.triage.findUnique({ where: { id } });
            if (triage && triage.patientId) {
                // Crear encuentro clínico automático
                await this.encountersService.create({
                    type: 'TRIAGE',
                    status: 'OPEN',
                    patient: { connect: { id: triage.patientId } },
                    reason: triage.chiefComplaint,
                    vitals: {
                        heartRate: triage.heartRate,
                        respiratoryRate: triage.respiratoryRate,
                        temperature: triage.temperature,
                        oxygenSaturation: triage.oxygenSaturation,
                        bloodPressure: triage.bloodPressure,
                        weight: triage.weight,
                        height: triage.height
                    },
                    triage: { connect: { id: triage.id } }
                } as any);
            }
        }
        return this.prisma.triage.update({ where: { id }, data: updateData });
    }

    async getById(id: string) {
        return this.prisma.triage.findUnique({
            where: { id },
            include: { patient: true },
        });
    }
}
