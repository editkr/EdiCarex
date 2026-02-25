const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Searching between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());

    const apps = await prisma.appointment.findMany({
        where: {
            appointmentDate: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });

    console.log('Appointments found for today:', apps.length);
    apps.forEach(a => {
        console.log(`- ID: ${a.id}, Date: ${a.appointmentDate.toISOString()}, Time: ${a.startTime}`);
    });

    await prisma.$disconnect();
}

check();
