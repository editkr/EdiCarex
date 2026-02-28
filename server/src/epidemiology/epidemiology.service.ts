import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEpidemiologyDto } from './dto/create-epidemiology.dto';

@Injectable()
export class EpidemiologyService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async create(createEpidemiologyDto: CreateEpidemiologyDto, userId: string) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        // Auto-generate code EPID-CSJC-YYYYMMDD-[SEQ]
        const count = await this.prisma.epidemiologyReport.count({
            where: {
                createdAt: {
                    gte: new Date(today.setHours(0, 0, 0, 0)),
                }
            }
        });

        const seq = (count + 1).toString().padStart(3, '0');
        const code = `EPID-CSJC-${dateStr}-${seq}`;

        const report = await this.prisma.epidemiologyReport.create({
            data: {
                ...createEpidemiologyDto,
                code,
            },
            include: {
                patient: true
            }
        });

        await this.auditService.createLog({
            action: 'CREATE',
            resource: 'EPIDEMIOLOGY_REPORT',
            resourceId: report.id,
            userId,
            changes: report,
        });

        return report;
    }

    async findAll() {
        return this.prisma.epidemiologyReport.findMany({
            include: {
                patient: {
                    select: { firstName: true, lastName: true, documentNumber: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        const report = await this.prisma.epidemiologyReport.findUnique({
            where: { id },
            include: { patient: true }
        });

        if (!report) {
            throw new NotFoundException(`Epidemiology report with ID ${id} not found`);
        }

        return report;
    }

    async notifyMinsa(id: string, userId: string) {
        const updated = await this.prisma.epidemiologyReport.update({
            where: { id },
            data: { status: 'NOTI-MINSA' }
        });

        await this.auditService.createLog({
            action: 'UPDATE',
            resource: 'EPIDEMIOLOGY_REPORT',
            resourceId: updated.id,
            userId,
            changes: { status: 'NOTI-MINSA' },
        });

        return updated;
    }
}
