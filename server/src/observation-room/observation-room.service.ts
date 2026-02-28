import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ObservationRoomService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async findAll() {
        const stretchers = await this.prisma.observationStretcher.findMany({
            include: {
                patient: { select: { firstName: true, lastName: true, documentNumber: true, sisCode: true } }
            },
            orderBy: { number: 'asc' }
        });

        const now = new Date();
        return stretchers.map(s => {
            let elapsedSeconds = null;
            if (s.status === 'OCCUPIED' && s.admittedAt) {
                elapsedSeconds = Math.floor((now.getTime() - s.admittedAt.getTime()) / 1000);
            }
            return { ...s, elapsedSeconds };
        });
    }

    async findOne(id: string) {
        const stretcher = await this.prisma.observationStretcher.findUnique({
            where: { id },
            include: { patient: true }
        });

        if (!stretcher) throw new NotFoundException('Observation Stretcher not found');

        let elapsedSeconds = null;
        if (stretcher.status === 'OCCUPIED' && stretcher.admittedAt) {
            elapsedSeconds = Math.floor((new Date().getTime() - stretcher.admittedAt.getTime()) / 1000);
        }

        return { ...stretcher, elapsedSeconds };
    }

    async admit(id: string, patientId: string, diagnosis: string, attendedBy: string, userId: string) {
        const occupiedCount = await this.prisma.observationStretcher.count({
            where: { status: 'OCCUPIED' }
        });

        if (occupiedCount >= 6) {
            throw new ConflictException('Maximum capacity of 6 Observation Stretchers reached. Please discharge or refer a patient first.');
        }

        const stretcher = await this.prisma.observationStretcher.update({
            where: { id },
            data: {
                status: 'OCCUPIED',
                patientId,
                diagnosis,
                attendedBy,
                admittedAt: new Date(),
            }
        });

        await this.auditService.createLog({
            action: 'UPDATE',
            resource: 'OBSERVATION_ROOM_ADMIT',
            resourceId: stretcher.id,
            userId,
            changes: { patientId, diagnosis, admittedAt: stretcher.admittedAt },
        });

        return stretcher;
    }

    async discharge(id: string, dischargeReason: string, userId: string) {
        const stretcher = await this.prisma.observationStretcher.update({
            where: { id },
            data: {
                status: 'AVAILABLE',
                dischargeReason,
                patientId: null,
                diagnosis: null,
                attendedBy: null,
                admittedAt: null,
                vitalSigns: null
            }
        });

        await this.auditService.createLog({
            action: 'UPDATE',
            resource: 'OBSERVATION_ROOM_DISCHARGE',
            resourceId: stretcher.id,
            userId,
            changes: { dischargeReason },
        });

        return stretcher;
    }

    async refer(id: string, destinationIpress: string, urgencyLevel: string, reason: string, userId: string) {
        const stretcher = await this.prisma.observationStretcher.findUnique({ where: { id } });
        if (!stretcher || !stretcher.patientId) throw new NotFoundException('Stretcher empty or not found');

        // Auto-create Referral Record
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const count = await this.prisma.referralRecord.count({ where: { createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) } } });
        const seq = (count + 1).toString().padStart(3, '0');

        const referral = await this.prisma.referralRecord.create({
            data: {
                code: `REF-CSJC-${dateStr}-${seq}`,
                patientId: stretcher.patientId,
                destinationIpress,
                diagnosis: stretcher.diagnosis || 'Desconocido',
                urgencyLevel,
                referredBy: stretcher.attendedBy || 'Médico de turno',
                previousTreatment: reason,
                vitalSigns: stretcher.vitalSigns || {}
            }
        });

        // Discharge Stretcher
        await this.prisma.observationStretcher.update({
            where: { id },
            data: {
                status: 'AVAILABLE',
                dischargeReason: `REFERRED to ${destinationIpress}`,
                referredAt: new Date(),
                referralDestination: destinationIpress,
                patientId: null,
                diagnosis: null,
                attendedBy: null,
                admittedAt: null,
                vitalSigns: null
            }
        });

        await this.auditService.createLog({
            action: 'CREATE',
            resource: 'OBSERVATION_ROOM_REFER',
            resourceId: referral.id,
            userId,
            changes: { referralId: referral.id, destinationIpress },
        });

        return referral;
    }
}
