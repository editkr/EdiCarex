import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function main() {
    const prisma = new PrismaClient();
    let output = '--- DIAGNÓSTICO DE DATOS IA EDICAREX (PERSISTENTE) ---\n\n';

    try {
        // 1. Audit Logs
        const aiLogsCount = await prisma.auditLog.count({ where: { action: 'AI' } });
        output += `1. Total Logs AI: ${aiLogsCount}\n`;

        const lastLogs = await prisma.auditLog.findMany({
            where: { action: 'AI' },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });

        output += '\n2. Detalle de los Últimos 20 Logs:\n';
        lastLogs.forEach((log, i) => {
            const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
            output += `${i + 1}. [${log.resource}] Duration: ${changes?.duration ?? 'MISSING'} ms | CreatedAt: ${log.createdAt.toISOString()}\n`;
        });

        // 2. Data Volume for Analytics
        const [appts, patients, invoices, beds] = await Promise.all([
            prisma.appointment.count(),
            prisma.patient.count(),
            prisma.invoice.count({ where: { status: 'PAID' } }),
            prisma.bed.count()
        ]);

        output += `\n3. Volumen de Datos Reales:\n`;
        output += `   - Citas Totales: ${appts}\n`;
        output += `   - Pacientes: ${patients}\n`;
        output += `   - Facturas Pagadas: ${invoices}\n`;
        output += `   - Camas Totales: ${beds}\n`;

        // 3. AI Service Direct Call
        output += '\n4. Verificando conectividad con Microservicio Python (Port 8000)...\n';
        const fetch = (await import('node-fetch')).default;
        try {
            const healthRes = await fetch('http://127.0.0.1:8000/health');
            if (healthRes.ok) {
                const data = await healthRes.json();
                output += '   ESTADO: ONLINE\n';
                output += '   DATA: ' + JSON.stringify(data, null, 2) + '\n';
            } else {
                output += '   ESTADO: ERROR HTTP ' + healthRes.status + '\n';
            }
        } catch (err: any) {
            output += '   ESTADO: OFFLINE - ' + err.message + '\n';
        }

    } catch (e: any) {
        output += '\n[ERROR FATAL]: ' + e.message + '\n';
    } finally {
        fs.writeFileSync('diag_result.txt', output);
        await prisma.$disconnect();
    }
}

main();
