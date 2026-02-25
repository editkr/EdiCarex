const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        console.log('--- DB LOGS DUMP (ID + ACTION + RESOURCE + CREATEDAT) ---');
        logs.forEach(l => {
            console.log(`${l.id} | ${l.action} | ${l.resource} | ${l.createdAt.toISOString()}`);
        });
        console.log('-------------------------------------------------------');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkDuplicates();
