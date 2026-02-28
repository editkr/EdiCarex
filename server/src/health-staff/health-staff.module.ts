import { Module } from '@nestjs/common';
import { HealthStaffService } from './health-staff.service';
import { HealthStaffController } from './health-staff.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [HealthStaffController],
    providers: [HealthStaffService],
    exports: [HealthStaffService],
})
export class HealthStaffModule { }
