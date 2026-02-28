import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const docId = 'e0e4de21-3bd1-4dba-b483-539b12a875be';
    const doc = await prisma.healthStaff.findUnique({
        where: { id: docId },
        include: { specialty: true }
    });

    if (doc) {
        console.log(`Staff ID: ${doc.id}`);
        console.log(`Specialization: ${doc.specialization}`);
        console.log(`Specialty ID: ${doc.specialtyId}`);
        console.log(`Specialty Name: ${doc.specialty?.name}`);
    } else {
        console.log('Staff not found');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
