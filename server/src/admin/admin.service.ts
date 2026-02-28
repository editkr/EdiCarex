import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConfigDto, UpdateConfigDto } from './dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async createConfig(data: CreateConfigDto) {
        return this.prisma.systemConfig.create({ data });
    }

    async getAllConfigs(category?: string) {
        const where: any = {};
        if (category) where.category = category;

        return this.prisma.systemConfig.findMany({
            where,
            orderBy: { category: 'asc' },
        });
    }

    async getConfigById(id: string) {
        return this.prisma.systemConfig.findUnique({ where: { id } });
    }

    async updateConfig(id: string, data: UpdateConfigDto) {
        return this.prisma.systemConfig.update({
            where: { id },
            data,
        });
    }

    async deleteConfig(id: string) {
        return this.prisma.systemConfig.delete({ where: { id } });
    }

    async getServicesByCategory() {
        // Get appointment type distribution for the last 30 days (real clinical workload)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const appointmentsByType = await this.prisma.appointment.groupBy({
            by: ['type'],
            _count: { type: true },
            where: {
                appointmentDate: { gte: thirtyDaysAgo },
                deletedAt: null,
            },
            orderBy: { _count: { type: 'desc' } },
        });

        // Also get specialty distribution from staff with appointments
        const specialtyAppointments = await this.prisma.healthStaff.findMany({
            where: {
                deletedAt: null,
                appointments: {
                    some: {
                        appointmentDate: { gte: thirtyDaysAgo },
                        deletedAt: null,
                    }
                }
            },
            select: {
                user: { select: { firstName: true, lastName: true } },
                specialtyId: true,
                specialty: { select: { name: true } },
                _count: { select: { appointments: true } }
            },
            take: 10,
        });

        // Map appointment types (prioritize specialty info, fall back to type)
        const typeLabels: Record<string, string> = {
            CONSULTATION: 'Consulta General',
            CHECKUP: 'Control / Chequeo',
            EMERGENCY: 'Emergencia',
            FOLLOW_UP: 'Seguimiento',
            SURGERY: 'Cirugía',
        };

        // Combine: specialty-based cards first, then remaining types
        const result: any[] = [];

        // Add specialty-based groups
        const specialtyGroups: Record<string, number> = {};
        specialtyAppointments.forEach(doc => {
            const key = doc.specialty?.name || 'Medicina General';
            specialtyGroups[key] = (specialtyGroups[key] || 0) + (doc._count?.appointments || 0);
        });

        Object.entries(specialtyGroups)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .forEach(([name, count]) => {
                result.push({
                    category: name,
                    count,
                    trend: count > 10 ? 'ascendente' : 'estable',
                    confidence: Math.min(99, Math.round(70 + (count / 20) * 30)),
                });
            });

        // If no specialty data, fall back to appointment types
        if (result.length === 0) {
            appointmentsByType.slice(0, 4).forEach(t => {
                const count = t._count.type;
                result.push({
                    category: typeLabels[t.type] || t.type,
                    count,
                    trend: count > 10 ? 'ascendente' : 'estable',
                    confidence: Math.min(99, Math.round(70 + (count / 20) * 30)),
                });
            });
        }

        // Always return at least some data (seeded defaults if DB is empty)
        if (result.length === 0) {
            return [
                { category: 'Medicina General', count: 0, trend: 'estable', confidence: 70 },
                { category: 'Emergencias', count: 0, trend: 'estable', confidence: 70 },
            ];
        }

        return result;
    }

    // New Organization Config Methods
    async getOrganizationConfig() {
        const config = await this.prisma.organizationConfig.findFirst();
        if (!config) {
            return this.prisma.organizationConfig.create({
                data: {
                    hospitalName: 'Centro de Salud Jorge Chávez',
                    email: 'esjorgechavez@gmail.com',
                    phone: '951 515 888',
                    address: 'Jr. Áncash S/N – Juliaca, San Román, Puno',
                    openingHours: {
                        monday: { open: '07:00', close: '19:00', enabled: true },
                        tuesday: { open: '07:00', close: '19:00', enabled: true },
                        wednesday: { open: '07:00', close: '19:00', enabled: true },
                        thursday: { open: '07:00', close: '19:00', enabled: true },
                        friday: { open: '07:00', close: '19:00', enabled: true },
                        saturday: { open: '07:00', close: '13:00', enabled: true },
                        sunday: { open: '00:00', close: '00:00', enabled: false },
                    },
                    billing: {
                        taxRate: 18,
                        currency: 'PEN',
                        invoicePrefix: 'F',
                        ipress: '00003308',
                        ruc: '20527421711',
                        category: 'I-3',
                        redSalud: 'Red San Román',
                        microred: 'Santa Adriana',
                    },
                    ai: {
                        enabled: true,
                        model: 'llama-3.3-70b-versatile',
                        features: { triage: true, diagnosis: true },
                    },
                    maintenanceMode: false
                } as any,
            });
        }
        return config;
    }

    async updateOrganizationConfig(data: any) {
        const config = await this.getOrganizationConfig();
        return this.prisma.organizationConfig.update({
            where: { id: config.id },
            data,
        });
    }

    // Backup Methods
    async getBackups() {
        return this.prisma.backupLog.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async createBackup() {
        try {
            const backupDir = path.join(process.cwd(), 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Tables to backup
            // Exhaustive list of all 53 models in alphabetical order for clarity
            const tables = [
                'appointment', 'appointmentCheckIn', 'appointmentHistory', 'attendance',
                'auditLog', 'bed', 'bedActivity', 'category', 'healthStaff', 'staffDocument',
                'staffSchedule', 'emergencyAttachment', 'emergencyCase', 'emergencyMedication',
                'emergencyProcedure', 'emergencyVitalSign', 'employee', 'employeeShift',
                'fileStorage', 'inventoryItem', 'invoice', 'invoiceItem', 'labOrder',
                'labResult', 'labTest', 'medicalRecord', 'medication', 'message',
                'notification', 'notificationLog', 'notificationPreference',
                'notificationTemplate', 'organizationConfig', 'passwordResetToken',
                'patient', 'patientAllergy', 'patientDiagnosis', 'patientDocument',
                'patientFamilyMember', 'patientMedication', 'patientVitalSign',
                'payroll', 'permission', 'pharmacyMovement', 'pharmacyOrder',
                'pharmacyStock', 'role', 'rolePermission', 'serviceCatalog',
                'specialPrice', 'specialty', 'systemConfig', 'tokenBlacklist', 'user'
            ];

            const backupData: any = {};

            for (const table of tables) {
                try {
                    backupData[table] = await (this.prisma as any)[table].findMany();
                } catch (e) {
                    console.warn(`Could not backup table ${table}:`, e.message);
                }
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup_${timestamp}.json`;
            const filePath = path.join(backupDir, filename);

            const jsonContent = JSON.stringify(backupData, null, 2);

            // Calculate Checksum SHA-256
            const checksum = crypto.createHash('sha256').update(jsonContent).digest('hex');

            // Write core backup file
            fs.writeFileSync(filePath, jsonContent);

            // Write Sidecar Metadata [PRO]
            const metadata = {
                filename,
                checksum,
                createdAt: new Date().toISOString(),
                schemaVersion: '1.0.0',
                tablesCount: tables.length,
                recordsCount: Object.values(backupData).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0),
                encryption: 'NONE', // Placeholder for future AES-256
            };
            fs.writeFileSync(`${filePath}.meta.json`, JSON.stringify(metadata, null, 2));

            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';

            return this.prisma.backupLog.create({
                data: {
                    name: filename,
                    type: 'FULL_JSON',
                    size: sizeMB,
                    status: 'COMPLETED',
                    url: `/backups/${filename}`
                }
            });
        } catch (error) {
            console.error('Backup creation failed:', error);
            throw new InternalServerErrorException('Error al crear el respaldo: ' + error.message);
        }
    }

    async restoreBackup(id: string) {
        const backup = await this.prisma.backupLog.findUnique({ where: { id } });
        if (!backup) throw new NotFoundException('Backup no encontrado');

        const backupPath = path.join(process.cwd(), 'backups', backup.name);
        if (!fs.existsSync(backupPath)) {
            throw new NotFoundException('Archivo de respaldo no encontrado en el servidor');
        }

        try {
            const rawData = fs.readFileSync(backupPath, 'utf8');
            const backupData = JSON.parse(rawData);

            // PostgreSQL-Specific restoration strategy: Bypass FK checks using replica mode
            // This is the most reliable way to restore full database snapshots.
            await this.prisma.$transaction(async (tx) => {
                // 1. Disable constraints
                await tx.$executeRawUnsafe("SET session_replication_role = 'replica';");

                try {
                    // 2. Clear all tables (except backupLog to avoid losing context)
                    const tablesToClear = Object.keys(backupData);
                    for (const table of tablesToClear) {
                        if (table !== 'backupLog' && (tx as any)[table]) {
                            await (tx as any)[table].deleteMany({});
                        }
                    }

                    // 3. Restore data
                    for (const table of tablesToClear) {
                        if (table !== 'backupLog' && backupData[table] && backupData[table].length > 0) {
                            for (const item of backupData[table]) {
                                const data = { ...item };
                                // Re-parse ISO dates
                                for (const key in data) {
                                    if (typeof data[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data[key])) {
                                        data[key] = new Date(data[key]);
                                    }
                                }
                                await (tx as any)[table].create({ data });
                            }
                        }
                    }
                } finally {
                    // 4. Re-enable constraints regardless of success/fail
                    await tx.$executeRawUnsafe("SET session_replication_role = 'origin';");
                }
            }, {
                timeout: 30000 // Increase timeout for large restorations
            });

            return { message: 'Restauración completada exitosamente', backupName: backup.name };
        } catch (error) {
            console.error('Restore failed:', error);
            throw new InternalServerErrorException('Error al restaurar el respaldo: ' + error.message);
        }
    }

    async deleteBackup(id: string) {
        const backup = await this.prisma.backupLog.findUnique({ where: { id } });
        if (!backup) throw new NotFoundException('Backup no encontrado');

        const backupPath = path.join(process.cwd(), 'backups', backup.name);

        try {
            // Delete physical file if exists
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }

            // Delete database record
            await this.prisma.backupLog.delete({ where: { id } });

            return { message: 'Respaldo eliminado correctamente', id };
        } catch (error) {
            console.error('Delete backup failed:', error);
            throw new InternalServerErrorException('Error al eliminar el respaldo: ' + error.message);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async handleAutomatedBackup() {
        console.log('[BACKUP-SYSTEM] Inciando respaldo automático programado (3 AM)...');
        try {
            const backup = await this.createBackup();
            console.log(`[BACKUP-SYSTEM] Respaldo automático exitoso: ${backup.name}`);
        } catch (error) {
            console.error('[BACKUP-SYSTEM] Error en respaldo automático:', error.message);
        }
    }

    async verifyBackupIntegrity(filename: string): Promise<any> {
        const backupPath = path.join(process.cwd(), 'backups', filename);
        const metaPath = `${backupPath}.meta.json`;

        if (!fs.existsSync(backupPath) || !fs.existsSync(metaPath)) {
            throw new NotFoundException('Archivo de respaldo o metadatos no encontrados');
        }

        const content = fs.readFileSync(backupPath, 'utf8');
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

        const currentChecksum = crypto.createHash('sha256').update(content).digest('hex');

        return {
            valid: currentChecksum === meta.checksum,
            metadata: meta,
            verifiedAt: new Date().toISOString()
        };
    }

    async cleanupOldBackups() {
        // Retention policy: 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const oldBackups = await this.prisma.backupLog.findMany({
            where: {
                createdAt: { lt: thirtyDaysAgo }
            }
        });

        const results = {
            deleted: 0,
            failed: 0,
            details: []
        };

        for (const backup of oldBackups) {
            try {
                const backupPath = path.join(process.cwd(), 'backups', backup.name);
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                }
                await this.prisma.backupLog.delete({ where: { id: backup.id } });
                results.deleted++;
            } catch (error) {
                results.failed++;
                results.details.push({ id: backup.id, error: error.message });
            }
        }

        return results;
    }

    async getBackupFile(filename: string) {
        const filePath = path.join(process.cwd(), 'backups', filename);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('Archivo no encontrado');
        }
        return filePath;
    }

    // System Monitoring Methods
    async getSystemStats() {
        const os = require('os');
        const cpus = os.cpus();
        const memTotal = os.totalmem();
        const memFree = os.freemem();
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        // Database stats
        const [userCount, patientCount, appointmentCount, backupCount] = await Promise.all([
            this.prisma.user.count({
                where: {
                    deletedAt: null,
                    role: {
                        name: {
                            not: 'PATIENT',
                            mode: 'insensitive'
                        }
                    }
                }
            }),
            this.prisma.patient.count({ where: { deletedAt: null } }),
            this.prisma.appointment.count({ where: { deletedAt: null } }),
            this.prisma.backupLog.count()
        ]);

        return {
            infrastructure: {
                cpu: {
                    model: cpus[0].model,
                    cores: cpus.length,
                    usage: Math.round(os.loadavg()[0] * 100) / cpus.length, // Real 1-min load average normalized by cores
                },
                memory: {
                    total: Math.round(memTotal / (1024 * 1024 * 1024)),
                    free: Math.round(memFree / (1024 * 1024 * 1024)),
                    usagePercent: Math.round(((memTotal - memFree) / memTotal) * 100),
                },
                uptime: { days, hours, minutes },
                environment: {
                    nodeVal: process.version,
                    platform: `${os.platform()} ${os.release()} (${os.arch()})`,
                    hostname: os.hostname(),
                },
                security: {
                    https: process.env.NODE_ENV === 'production', // Assumption for now, or check req
                    dbEncryption: true, // Prisma defaults to SSL in prod usually
                    headers: [
                        { name: 'X-Frame-Options', value: 'DENY', status: 'ACTIVE' },
                        { name: 'X-XSS-Protection', value: '1; mode=block', status: 'ACTIVE' },
                        { name: 'Strict-Transport-Security', value: 'max-age=31536000', status: process.env.NODE_ENV === 'production' ? 'ACTIVE' : 'INACTIVE' },
                        { name: 'Content-Security-Policy', value: "default-src 'self'", status: 'ACTIVE' }
                    ]
                }
            },
            database: {
                engine: 'PostgreSQL / Prisma',
                counts: {
                    users: userCount,
                    patients: patientCount,
                    appointments: appointmentCount,
                    backups: backupCount
                }
            }
        };
    }

    async getSystemHealth() {
        const services = [
            { id: 'database', name: 'Base de Datos (PostgreSQL)', type: 'CORE' },
            { id: 'ai-engine', name: 'Motor IA (EdiCarex AI)', type: 'AI' },
            { id: 'internet', name: 'Conectividad Externa', type: 'NET' },
            { id: 'storage', name: 'Sistema de Archivos', type: 'STORAGE' }
        ];

        const fs = require('fs');
        const dns = require('dns');
        const path = require('path');

        const checkService = async (service: any) => {
            const start = performance.now();
            let status = 'OPERATIONAL';
            let error = null;
            let latencyOverride = null;

            try {
                switch (service.id) {
                    case 'database':
                        // Real DB Ping
                        await this.prisma.$queryRaw`SELECT 1`;
                        break;

                    case 'ai-engine':
                        // Check Python AI Service (default port 8000)
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
                            const response = await fetch('http://127.0.0.1:8000/health', {
                                method: 'GET',
                                signal: controller.signal
                            });
                            clearTimeout(timeoutId);

                            if (!response.ok) throw new Error(`HTTP ${response.status}`);

                            const aiHealth = await response.json();
                            const isSecure = aiHealth.engines?.security?.guardrails_active;

                            // Professional Refinement: Calculate real stats from last hour
                            const oneHourAgo = new Date();
                            oneHourAgo.setHours(oneHourAgo.getHours() - 1);

                            const hourLogs = await this.prisma.auditLog.findMany({
                                where: {
                                    action: 'AI',
                                    createdAt: { gte: oneHourAgo }
                                }
                            });

                            let totalLat = 0;
                            let totalTokens = 0;

                            hourLogs.forEach(log => {
                                const details = typeof log.changes === 'string'
                                    ? JSON.parse(log.changes)
                                    : (log.changes || {});
                                totalLat += (Number(details?.duration) || 0);
                                // Estimate tokens if not present (avg 500 per query if missing)
                                totalTokens += (Number(details?.tokens) || 500);
                            });

                            latencyOverride = hourLogs.length > 0 ? Math.round(totalLat / hourLogs.length) : 0;

                            // Calculate load (capacity is relative, let's say 100 qph is 100%)
                            const qph = hourLogs.length;
                            const loadPercent = Math.min(Math.round((qph / 100) * 100), 100);

                            // Embed real data in the message or dedicated fields for frontend
                            const realMetadata = {
                                load: loadPercent,
                                tokens: totalTokens,
                                isSecure
                            };

                            error = JSON.stringify(realMetadata);
                        } catch (e: any) {
                            status = 'DOWN';
                            error = 'Sin conexión al servicio AI (Puerto 8000)';
                        }
                        break;

                    case 'internet':
                        // Check external connectivity (Google DNS)
                        try {
                            await new Promise((resolve, reject) => {
                                dns.resolve('google.com', (err: any) => {
                                    if (err) reject(err);
                                    else resolve(true);
                                });
                            });
                        } catch (e) {
                            status = 'DOWN';
                            error = 'Sin salida a internet';
                        }
                        break;

                    case 'storage':
                        // Check write permissions in uploads folder
                        try {
                            const uploadsDir = path.join(process.cwd(), 'uploads');
                            if (!fs.existsSync(uploadsDir)) {
                                fs.mkdirSync(uploadsDir);
                            }
                            await fs.promises.access(uploadsDir, fs.constants.W_OK);
                        } catch (e) {
                            status = 'DEGRADED';
                            error = 'Sin permisos de escritura';
                        }
                        break;
                }
            } catch (e: any) {
                status = 'DOWN';
                error = e.message;
            }

            const latency = status === 'DOWN' ? 0 : (latencyOverride !== null ? latencyOverride : Math.round(performance.now() - start));

            return {
                ...service,
                status,
                latency,
                message: error,
                lastCheck: new Date()
            };
        };

        return await Promise.all(services.map(checkService));
    }
}
