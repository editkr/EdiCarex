import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Current Specialties in Database ---');
    const specs = await prisma.specialty.findMany({
        orderBy: { name: 'asc' }
    });

    specs.forEach(s => {
        console.log(`- ID: ${s.id} | Name: ${s.name}`);
    });
    console.log('---------------------------------------');

    console.log('\n--- Current HealthStaff Specialization Strings ---');
    const staff = await prisma.healthStaff.findMany({
        select: { specialization: true, specialtyId: true }
    });

    const uniqueSpecs = [...new Set(staff.map(d => d.specialization))];
    uniqueSpecs.forEach(s => {
        console.log(`- specialization: ${s}`);
    });
    console.log('---------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
