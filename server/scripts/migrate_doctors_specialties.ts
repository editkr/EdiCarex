import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting HealthStaff Specialty Migration...');

    // 1. Get all specialties to have a map
    const specialties = await prisma.specialty.findMany();
    const specialtyMap: Record<string, string> = {};
    specialties.forEach(s => {
        specialtyMap[s.name.toLowerCase()] = s.id;
    });

    // 2. Get all doctors
    const staff = await prisma.healthStaff.findMany({
        where: { specialtyId: null }
    });

    console.log(`Found ${staff.length} staff members without specialtyId.`);

    for (const doc of staff) {
        const specName = doc.specialization?.toLowerCase() || '';

        // Try to match the name
        let targetId = specialtyMap[specName];

        // Fallback: If "Emergencias" vs "Emergency" etc, but user synced to Spanish
        // If no match found, we could default to "Medicina General" or skip
        if (!targetId) {
            console.log(`⚠️ No exact match for specialty: "${doc.specialization}". Skipping or manual fix needed.`);
            continue;
        }

        console.log(`✅ Mapping staff ${doc.licenseNumber} (${doc.specialization}) -> specialtyId ${targetId}`);
        await prisma.healthStaff.update({
            where: { id: doc.id },
            data: { specialtyId: targetId }
        });
    }

    console.log('🎉 Migration completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
