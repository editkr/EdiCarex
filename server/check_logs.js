const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogs() {
    try {
        const logs = await prisma.auditLog.findMany({
            where: { resource: 'AI' },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        console.log('--- LATEST AI AUDIT LOGS ---');
        console.log(JSON.stringify(logs, null, 2));
        console.log('---------------------------');
        console.log('Total AI Logs:', logs.length);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLogs();
