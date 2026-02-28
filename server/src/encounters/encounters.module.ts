import { Module } from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { EncountersController } from './encounters.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EncountersController],
    providers: [EncountersService],
    exports: [EncountersService],
})
export class EncountersModule { }
