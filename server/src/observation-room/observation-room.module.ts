import { Module } from '@nestjs/common';
import { ObservationRoomService } from './observation-room.service';
import { ObservationRoomController } from './observation-room.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ObservationRoomController],
  providers: [ObservationRoomService],
})
export class ObservationRoomModule { }
