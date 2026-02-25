import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    console.log('--- INICIO DE INYECCIÓN DE DATOS IA EDICAREX ENTERPRISE ---');

    // 1. Obtener o crear entidades base
    let doctor = await prisma.doctor.findFirst();
    if (!doctor) {
        console.log('Creando doctor base para estadísticas...');
        const user = await prisma.user.create({
            data: {
                email: 'dr.ia@edicarex.com',
                password: 'password_hashed',
                firstName: 'Admin',
                lastName: 'AI Doctor',
                role: { connect: { name: 'Doctor' } }
            }
        });
        doctor = await prisma.doctor.create({
            data: {
                userId: user.id,
                licenseNumber: 'AI-2026-X',
                specialization: 'Medicina General'
            }
        });
    }

    let patient = await prisma.patient.findFirst();
    if (!patient) {
        console.log('Creando paciente base...');
        patient = await prisma.patient.create({
            data: {
                firstName: 'Paciente',
                lastName: 'Estadístico',
                phone: '555-STAT',
                gender: 'OTHER',
                dateOfBirth: new Date('1990-01-01')
            }
        });
    }

    // 2. Generar Citas (6 meses atrás)
    console.log('Generando historial de 120 citas...');
    const now = new Date();
    for (let i = 0; i < 120; i++) {
        const date = new Date();
        date.setDate(now.getDate() - (i % 180)); // Distribución en 6 meses
        await prisma.appointment.create({
            data: {
                appointmentDate: date,
                startTime: '09:00',
                reason: 'Consulta Proyectada IA',
                status: 'COMPLETED',
                patientId: patient.id,
                doctorId: doctor.id,
                type: i % 10 === 0 ? 'EMERGENCY' : 'CONSULTATION'
            }
        });
    }

    // 3. Generar Invoices (80 Facturas Pagadas)
    console.log('Generando historial de 80 facturas pagadas...');
    for (let i = 0; i < 80; i++) {
        const date = new Date();
        date.setDate(now.getDate() - (i * 2)); // Una cada 2 días aprox
        const amount = 50 + Math.random() * 200;
        await prisma.invoice.create({
            data: {
                invoiceNumber: `FACT-AI-${2026}${i.toString().padStart(3, '0')}`,
                invoiceDate: date,
                subtotal: amount,
                tax: amount * 0.18,
                total: amount * 1.18,
                status: 'PAID',
                patientId: patient.id,
                doctorId: doctor.id
            }
        });
    }

    // 4. Inyectar Logs de IA con latencia realista
    console.log('Inyectando logs de auditoría IA con latencias promediadas...');
    const adminUser = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } }) ||
        await prisma.user.findFirst();

    if (adminUser) {
        for (let i = 0; i < 50; i++) {
            const latencies = [350, 420, 580, 210, 890, 440];
            const lat = latencies[i % latencies.length] + Math.floor(Math.random() * 50);
            await prisma.auditLog.create({
                data: {
                    userId: adminUser.id,
                    action: 'AI',
                    resource: i % 2 === 0 ? 'Triage' : 'Strategic Analytics',
                    changes: { duration: lat, model: 'llama-3.3-70b-versatile' }
                }
            });
        }
    }

    console.log('--- FINALIZADO: DATOS IA INYECTADOS EXITOSAMENTE ---');
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
