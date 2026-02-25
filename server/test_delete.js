const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDelete() {
    try {
        // 1. Find a log to delete
        const log = await prisma.auditLog.findFirst({
            where: { resource: 'AI' }
        });

        if (!log) {
            console.log('No AI logs found to delete.');
            return;
        }

        console.log('Attempting to delete log:', log.id);

        // 2. Delete it
        await prisma.auditLog.delete({
            where: { id: log.id }
        });
        console.log('Delete operation called.');

        // 3. Verify it's gone
        const check = await prisma.auditLog.findUnique({
            where: { id: log.id }
        });

        if (check) {
            console.error('CRITICAL: Log still exists after deletion!');
        } else {
            console.log('Verification successful: Log is gone.');
        }
    } catch (e) {
        console.error('Error during test:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testDelete();
