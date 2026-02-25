const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllLogs() {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        console.log('--- ALL AUDIT LOGS ---');
        console.log(JSON.stringify(logs, null, 2));
        console.log('---------------------------');
        console.log('Total Logs:', logs.length);

        // Also check unique resources
        const resources = await prisma.auditLog.groupBy({
            by: ['resource'],
            _count: true
        });
        console.log('--- RESOURCES COUNT ---');
        console.log(resources);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllLogs();
