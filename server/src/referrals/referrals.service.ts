import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';

@Injectable()
export class ReferralsService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async create(createReferralDto: CreateReferralDto, userId: string) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        // Auto-generate code REF-CSJC-YYYYMMDD-[SEQ]
        const count = await this.prisma.referralRecord.count({
            where: {
                createdAt: {
                    gte: new Date(today.setHours(0, 0, 0, 0)),
                }
            }
        });

        const seq = (count + 1).toString().padStart(3, '0');
        const code = `REF-CSJC-${dateStr}-${seq}`;

        const referral = await this.prisma.referralRecord.create({
            data: {
                ...createReferralDto,
                code,
            },
            include: {
                patient: true
            }
        });

        await this.auditService.createLog({
            action: 'CREATE',
            resource: 'REFERRAL_RECORD',
            resourceId: referral.id,
            userId,
            changes: referral,
        });

        return referral;
    }

    async findAll(status?: string, date?: string) {
        const where: any = {};
        if (status) where.status = status;
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            where.date = { gte: start, lte: end };
        }

        return this.prisma.referralRecord.findMany({
            where,
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                        documentNumber: true,
                        sisCode: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        const referral = await this.prisma.referralRecord.findUnique({
            where: { id },
            include: {
                patient: true
            }
        });

        if (!referral) {
            throw new NotFoundException(`Referral record with ID ${id} not found`);
        }

        return referral;
    }

    async update(id: string, updateReferralDto: UpdateReferralDto, userId: string) {
        const referral = await this.findOne(id);

        const updated = await this.prisma.referralRecord.update({
            where: { id },
            data: updateReferralDto,
        });

        await this.auditService.createLog({
            action: 'UPDATE',
            resource: 'REFERRAL_RECORD',
            resourceId: updated.id,
            userId,
            changes: updateReferralDto,
        });

        return updated;
    }
}
