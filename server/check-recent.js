const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const latest = await prisma.appointment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, appointmentDate: true, type: true, createdAt: true }
    });
    console.log('Latest 10 Appointments Created:\n', JSON.stringify(latest, null, 2));

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const count = await prisma.appointment.count({
        where: {
            appointmentDate: {
                gte: sevenDaysAgo
            }
        }
    });
    console.log('Appointments in the last 7 days (by appointmentDate):', count);

    await prisma.$disconnect();
}

check();
