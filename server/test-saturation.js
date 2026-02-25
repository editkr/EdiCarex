const axios = require('axios');

async function test() {
    try {
        // Note: We need a token if there's a guard, but maybe we can just call the service method if we have access to it.
        // Let's create a script that calls the compiled service method.
        // Or simpler: just use node to call the service file if possible.
        // Actually, I'll just write a script that mock the prisma call and runs the service logic.

        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        async function getSaturationStats() {
            const totalBeds = await prisma.bed.count();
            const occupiedBeds = await prisma.bed.count({ where: { status: 'OCCUPIED' } });

            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            const appointments = await prisma.appointment.findMany({
                where: {
                    appointmentDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                select: { startTime: true }
            });

            console.log('Stats Debug:');
            console.log('- Total Beds:', totalBeds);
            console.log('- Occupied Beds:', occupiedBeds);
            console.log('- Appointments today:', appointments.length);

            const curve = [];
            for (let h = 8; h <= 18; h++) {
                const appsAtHour = appointments.filter(a => {
                    if (!a.startTime) return false;
                    const hour = parseInt(a.startTime.split(':')[0]);
                    return hour === h;
                }).length;

                const baseSaturation = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 25;
                const hourPressure = appsAtHour * 5;
                const realTimeSaturation = Math.min(100, Math.round(baseSaturation + hourPressure));

                curve.push({
                    hour: `${h}:00`,
                    apps: appsAtHour,
                    current: h <= now.getHours() ? realTimeSaturation : 0,
                    predicted: Math.min(100, realTimeSaturation + (appsAtHour > 0 ? 15 : 5))
                });
            }
            return curve;
        }

        const data = await getSaturationStats();
        console.log('Result Data:');
        data.forEach(d => {
            if (d.apps > 0) console.log(`*** Peak at ${d.hour}: current=${d.current}, predicted=${d.predicted}, apps=${d.apps}`);
            else console.log(`    ${d.hour}: current=${d.current}, predicted=${d.predicted}`);
        });

        await prisma.$disconnect();
    } catch (e) {
        console.error(e);
    }
}

test();
