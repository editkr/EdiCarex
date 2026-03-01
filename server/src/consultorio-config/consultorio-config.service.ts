import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsultorioConfigService {
    private readonly logger = new Logger(ConsultorioConfigService.name);

    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.consultorioConfig.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
        });
    }

    async seed() {
        const configs = [
            { serviceName: 'MEDICINA_GENERAL', label: 'Medicina General', upss: 'CONSULTA EXTERNA', maxDailySlots: 18, slotDurationMinutes: 20, color: 'bg-blue-500' },
            { serviceName: 'OBSTETRICIA', label: 'Obstetricia', upss: 'OBSTETRICIA', maxDailySlots: 12, slotDurationMinutes: 30, color: 'bg-rose-500' },
            { serviceName: 'ODONTOLOGIA', label: 'Odontología', upss: 'ODONTOLOGÍA', maxDailySlots: 12, slotDurationMinutes: 30, color: 'bg-orange-500' },
            { serviceName: 'PSICOLOGIA', label: 'Psicología', upss: 'PSICOLOGÍA', maxDailySlots: 8, slotDurationMinutes: 45, color: 'bg-indigo-500' },
            { serviceName: 'NUTRICION', label: 'Nutrición', upss: 'NUTRICIÓN', maxDailySlots: 12, slotDurationMinutes: 30, color: 'bg-lime-500' },
            { serviceName: 'CRED_VACUNACION', label: 'C.R.E.D. / Vacunas', upss: 'CONSULTA EXTERNA (CRED)', maxDailySlots: 24, slotDurationMinutes: 30, color: 'bg-emerald-500' },
            { serviceName: 'TRIAJE', label: 'Tópico de Triaje', upss: 'URGENCIAS/TRIAJE', maxDailySlots: 36, slotDurationMinutes: 10, color: 'bg-slate-500' },
            { serviceName: 'LABORATORIO', label: 'Laboratorio Clínico', upss: 'PATOLOGÍA CLÍNICA', maxDailySlots: 12, slotDurationMinutes: 30, color: 'bg-cyan-500' },
        ];

        for (const config of configs) {
            await this.prisma.consultorioConfig.upsert({
                where: { serviceName: config.serviceName },
                update: {},
                create: config,
            });
        }

        return { message: 'Consultorio configurations seeded successfully', count: configs.length };
    }
}
