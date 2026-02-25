const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    console.log('Seeding recent appointments...');

    // Get some existing patient and doctor to link
    const patient = await prisma.patient.findFirst();
    const doctor = await prisma.doctor.findFirst();

    if (!patient || !doctor) {
        console.log('Error: Need at least one patient and one doctor in DB');
        return;
    }

    const now = new Date();
    const currentDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Create 2-3 appointments for today and yesterday
    for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i % 3)); // Spread over last 3 days

        await prisma.appointment.create({
            data: {
                appointmentDate: date,
                startTime: '10:00',
                endTime: '11:00',
                status: 'CONFIRMED',
                type: i % 2 === 0 ? 'CONSULTATION' : 'EMERGENCY',
                priority: 'NORMAL',
                patientId: patient.id,
                doctorId: doctor.id,
                reason: 'Prueba de Analítica'
            }
        });
    }

    console.log('Seed completed successfully.');
    await prisma.$disconnect();
}

seed();
