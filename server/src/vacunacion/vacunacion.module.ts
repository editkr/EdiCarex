import { Module } from '@nestjs/common';
import { VacunacionService } from './vacunacion.service';
import { VacunacionController } from './vacunacion.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EncountersModule } from '../encounters/encounters.module';

@Module({
    imports: [PrismaModule, EncountersModule],
    controllers: [VacunacionController],
    providers: [VacunacionService],
    exports: [VacunacionService],
})
export class VacunacionModule { }
