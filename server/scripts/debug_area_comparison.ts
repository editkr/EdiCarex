import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const range = '12months';
    const now = new Date();
    const startDate = new Date();
    startDate.setFullYear(now.getFullYear() - 1);

    console.log(`Searching from: ${startDate.toISOString()}`);

    const specialties = await prisma.specialty.findMany({
        include: {
            staff: {
                include: {
                    invoices: {
                        where: { status: 'PAID', invoiceDate: { gte: startDate } },
                        select: { total: true }
                    },
                    _count: { select: { appointments: { where: { appointmentDate: { gte: startDate } } } } }
                }
            }
        }
    });

    const result = specialties.map(spec => {
        let totalRevenue = 0;
        let totalPatients = 0;

        spec.staff.forEach(doc => {
            const rev = doc.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
            totalRevenue += rev;
            totalPatients += doc._count.appointments;

            if (rev > 0) {
                console.log(`Staff ${doc.id} has ${rev} revenue in ${spec.name}`);
            }
        });

        return {
            area: spec.name,
            patients: totalPatients,
            revenue: totalRevenue
        };
    });

    console.log(JSON.stringify(result, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
