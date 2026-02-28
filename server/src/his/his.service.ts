import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateHisDto } from './dto/create-his.dto';
import * as dateFns from 'date-fns';

@Injectable()
export class HisService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async create(createHisDto: CreateHisDto, userId: string) {
        const hisRecord = await this.prisma.hISRecord.create({
            data: createHisDto,
            include: {
                patient: true,
                staff: true
            }
        });

        await this.auditService.createLog({
            action: 'CREATE',
            resource: 'HIS_RECORD',
            resourceId: hisRecord.id,
            userId,
            changes: hisRecord,
        });

        return hisRecord;
    }

    async findAll(date?: string, type?: string) {
        const where: any = {};
        if (type) where.serviceType = type;
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            where.attentionDate = { gte: start, lte: end };
        }

        return this.prisma.hISRecord.findMany({
            where,
            include: {
                patient: {
                    select: { firstName: true, lastName: true, documentNumber: true, sisCode: true }
                },
                staff: {
                    select: { id: true, user: { select: { firstName: true, lastName: true } } }
                }
            },
            orderBy: { attentionDate: 'desc' }
        });
    }

    async getStats() {
        const startOfMonth = dateFns.startOfMonth(new Date());
        const endOfMonth = dateFns.endOfMonth(new Date());

        const records = await this.prisma.hISRecord.findMany({
            where: {
                attentionDate: { gte: startOfMonth, lte: endOfMonth }
            }
        });

        const fundingTotals = records.reduce((acc, curr) => {
            acc[curr.fundingType] = (acc[curr.fundingType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const serviceTotals = records.reduce((acc, curr) => {
            acc[curr.serviceType] = (acc[curr.serviceType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: records.length,
            fundingTotals,
            serviceTotals
        };
    }
}
