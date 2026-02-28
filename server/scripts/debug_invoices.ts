import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- RECENT INVOICES ---');
    const invoices = await prisma.invoice.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
            staff: {
                include: {
                    specialty: true
                }
            }
        }
    });

    invoices.forEach(inv => {
        console.log(`ID: ${inv.id}`);
        console.log(`Number: ${inv.invoiceNumber}`);
        console.log(`Status: ${inv.status}`);
        console.log(`Total: ${inv.total}`);
        console.log(`Staff ID: ${inv.staffId}`);
        console.log(`Staff Name: ${inv.staff?.specialization}`);
        console.log(`Specialty: ${inv.staff?.specialty?.name}`);
        console.log('-------------------------');
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
