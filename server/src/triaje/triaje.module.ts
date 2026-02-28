import { Module } from '@nestjs/common';
import { TriajeService } from './triaje.service';
import { TriajeController } from './triaje.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EncountersModule } from '../encounters/encounters.module';

@Module({
    imports: [PrismaModule, EncountersModule],
    controllers: [TriajeController],
    providers: [TriajeService],
    exports: [TriajeService],
})
export class TriajeModule { }
