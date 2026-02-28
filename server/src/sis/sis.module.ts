import { Module } from '@nestjs/common';
import { SisService } from './sis.service';
import { SisController } from './sis.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SisController],
  providers: [SisService],
})
export class SisModule { }
