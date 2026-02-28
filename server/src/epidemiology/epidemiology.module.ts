import { Module } from '@nestjs/common';
import { EpidemiologyService } from './epidemiology.service';
import { EpidemiologyController } from './epidemiology.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [EpidemiologyController],
  providers: [EpidemiologyService],
})
export class EpidemiologyModule { }
