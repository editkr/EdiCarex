import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AiModule } from './ai/ai.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { LaboratoryModule } from './laboratory/laboratory.module';
import { BillingModule } from './billing/billing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { FilesModule } from './files/files.module';
import { HRModule } from './hr/hr.module';
import { EmergencyModule } from './emergency/emergency.module';
import { AdminModule } from './admin/admin.module';
import { MessagesModule } from './messages/messages.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BedsModule } from './beds/beds.module';
import { ServicesCatalogModule } from './services-catalog/services-catalog.module';
import { HealthController } from './health/health.controller';
import { MaintenanceGuard } from './common/guards/maintenance.guard';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Rate limiting
        ThrottlerModule.forRoot([{
            ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60000,
            limit: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        }]),

        // Task Scheduling
        ScheduleModule.forRoot(),

        // Core modules
        PrismaModule,

        // Feature modules
        AuthModule,
        UsersModule,
        PatientsModule,
        DoctorsModule,
        AppointmentsModule,
        PharmacyModule,
        LaboratoryModule,
        BillingModule,
        NotificationsModule,
        AttendanceModule,
        ReportsModule,
        AuditModule,
        FilesModule,
        AiModule,

        // New modules
        HRModule,
        EmergencyModule,
        AdminModule,
        MessagesModule,
        AnalyticsModule,
        BedsModule,
        ServicesCatalogModule,
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: MaintenanceGuard,
        },
    ],
})
export class AppModule { }
