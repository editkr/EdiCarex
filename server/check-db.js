const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const count = await prisma.appointment.count();
    console.log('Total Appointments:', count);

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));

    const thisWeek = await prisma.appointment.count({
        where: {
            appointmentDate: {
                gte: startOfWeek,
                lte: endOfWeek
            }
        }
    });
    console.log('Appointments this week:', thisWeek);

    const sample = await prisma.appointment.findMany({
        take: 3,
        select: { appointmentDate: true, type: true }
    });
    console.log('Sample Appointments:', JSON.stringify(sample, null, 2));

    await prisma.$disconnect();
}

check();
