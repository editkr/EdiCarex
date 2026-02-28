import { Module } from '@nestjs/common';
import { HisService } from './his.service';
import { HisController } from './his.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [HisController],
  providers: [HisService],
})
export class HisModule { }
