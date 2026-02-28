import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ValidateSisDto } from './dto/validate-sis.dto';

@Injectable()
export class SisService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async validate(validateSisDto: ValidateSisDto, userId: string) {
        const { documentNumber } = validateSisDto;

        // SIMULATED EXTERNAL HTTP CALL TO MINSA/SIS PLATFORM
        // Mock response
        const isMockValid = Math.random() > 0.3; // 70% chance of active SIS
        const sisCode = isMockValid ? `SIS-${documentNumber}-${Math.floor(Math.random() * 1000)}` : null;
        const status = isMockValid ? 'ACTIVO' : 'INACTIVO';

        const rawResponse = {
            message: 'Consulta realizada correctamente',
            fecha: new Date().toISOString(),
            data: {
                dni: documentNumber,
                sis_activo: isMockValid,
                codigo_sis: sisCode
            }
        };

        // Save log
        const log = await this.prisma.sISValidationLog.create({
            data: {
                documentNumber,
                sisCode: sisCode || 'N/A',
                status,
                validatedBy: userId,
                rawResponse,
                result: isMockValid ? 'SUCCESS' : 'NO_COVERAGE',
            }
        });

        // If patient exists, update their record
        let patient = await this.prisma.patient.findUnique({
            where: { documentNumber }
        });

        if (patient) {
            patient = await this.prisma.patient.update({
                where: { id: patient.id },
                data: {
                    sisCode,
                    sisStatus: status,
                    sisValidatedAt: new Date(),
                }
            });

            await this.prisma.sISValidationLog.update({
                where: { id: log.id },
                data: { patientId: patient.id }
            });
        }

        await this.auditService.createLog({
            action: 'CREATE',
            resource: 'SIS_VALIDATION',
            resourceId: log.id,
            userId,
            changes: { log, patientUpdated: !!patient },
        });

        return {
            log,
            patient
        };
    }

    async getHistoryByPatient(patientId: string) {
        return this.prisma.sISValidationLog.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
