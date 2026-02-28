import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgramasMinsaService {
    constructor(private readonly prisma: PrismaService) { }

    async getAll() {
        const programs = await this.prisma.minsaProgram.findMany({
            where: { isActive: true },
            include: {
                records: {
                    where: {
                        visitDate: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
                        },
                    },
                    select: { id: true, status: true },
                },
            },
            orderBy: { code: 'asc' },
        });

        return programs.map(p => ({
            ...p,
            monthlyCount: p.records.length,
            activeCount: p.records.filter(r => r.status === 'ACTIVE').length,
            completedCount: p.records.filter(r => r.status === 'COMPLETED').length,
            progressPercent: Math.min(Math.round((p.records.length / p.monthlyGoal) * 100), 100),
        }));
    }

    async getRecords(programId: string, month?: string) {
        const now = new Date();
        const y = month ? parseInt(month.split('-')[0]) : now.getFullYear();
        const m = month ? parseInt(month.split('-')[1]) - 1 : now.getMonth();

        return this.prisma.minsaProgramRecord.findMany({
            where: {
                programId,
                visitDate: {
                    gte: new Date(y, m, 1),
                    lt: new Date(y, m + 1, 1),
                },
            },
            include: { patient: { select: { firstName: true, lastName: true } } },
            orderBy: { visitDate: 'desc' },
        });
    }

    async createRecord(data: any) {
        return this.prisma.minsaProgramRecord.create({ data });
    }

    async updateRecord(id: string, data: any) {
        return this.prisma.minsaProgramRecord.update({ where: { id }, data });
    }

    async getDashboard() {
        const programs = await this.getAll();
        const totalRecordsMonth = programs.reduce((s, p) => s + p.monthlyCount, 0);
        const avgProgress = programs.length
            ? Math.round(programs.reduce((s, p) => s + p.progressPercent, 0) / programs.length)
            : 0;

        return { programs, totalRecordsMonth, avgProgress };
    }

    async ensureDefaultPrograms() {
        const defaults = [
            { code: 'PRENATAL', name: 'Control Prenatal', description: 'Controles de gestantes para embarazo saludable', monthlyGoal: 40, coordinator: 'Lic. Elena Ccopa Huanca' },
            { code: 'CRED', name: 'CRED – Niño Sano', description: 'Control de Crecimiento y Desarrollo de niños menores de 5 años', monthlyGoal: 60, coordinator: 'Lic. Elena Ccopa Huanca' },
            { code: 'TBC', name: 'TBC / Estrategia DOTS', description: 'Tratamiento directamente observado de tuberculosis', monthlyGoal: 15, coordinator: 'Lic. Ana Choque Mamani' },
            { code: 'ANEMIA', name: 'Anemia y Desnutrición', description: 'Detección y tratamiento de anemia infantil y desnutrición crónica', monthlyGoal: 30, coordinator: 'Lic. María Mamani Quispe' },
            { code: 'PF', name: 'Planificación Familiar', description: 'Entrega de métodos anticonceptivos y orientación reproductiva', monthlyGoal: 25, coordinator: 'Lic. Elena Ccopa Huanca' },
            { code: 'MENTAL', name: 'Salud Mental', description: 'Atenciones de psicología y salud mental comunitaria', monthlyGoal: 20, coordinator: 'Lic. Carlos Pari Quispe' },
        ];

        for (const p of defaults) {
            await this.prisma.minsaProgram.upsert({
                where: { code: p.code },
                create: p,
                update: {},
            });
        }
    }
}
