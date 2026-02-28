import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EncountersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    async create(data: Prisma.EncounterCreateInput) {
        const encounter = await this.prisma.encounter.create({
            data,
            include: {
                patient: true,
                staff: true,
            },
        });

        await this.auditService.createLog({
            userId: 'SYSTEM',
            action: 'CREATE',
            resource: 'ENCOUNTER',
            resourceId: encounter.id,
            changes: data
        });

        return encounter;
    }

    async findAll(query: { patientId?: string; staffId?: string; status?: string }) {
        return this.prisma.encounter.findMany({
            where: {
                patientId: query.patientId,
                staffId: query.staffId,
                status: query.status,
            },
            include: {
                patient: { select: { firstName: true, lastName: true, documentNumber: true } },
                staff: { select: { user: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const encounter = await this.prisma.encounter.findUnique({
            where: { id },
            include: {
                patient: true,
                staff: true,
                triage: true,
                prescriptions: true,
                labResults: true,
            },
        });

        if (!encounter) {
            throw new NotFoundException(`Encounter with ID ${id} not found`);
        }

        return encounter;
    }

    async update(id: string, data: Prisma.EncounterUpdateInput) {
        return this.prisma.encounter.update({
            where: { id },
            data,
        });
    }

    async close(id: string, notes?: string) {
        const current = await this.findOne(id);
        const updated = await this.prisma.encounter.update({
            where: { id },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                notes: notes ? notes : undefined,
            },
        });

        await this.auditService.createLog({
            userId: 'SYSTEM',
            action: 'CLOSE',
            resource: 'ENCOUNTER',
            resourceId: id,
            changes: { from: current.status, to: 'CLOSED', notes }
        });

        return updated;
    }

    async getPatientHistory(patientId: string) {
        return this.prisma.encounter.findMany({
            where: { patientId },
            include: {
                staff: { select: { user: { select: { firstName: true, lastName: true } } } },
                triage: true,
                prescriptions: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
