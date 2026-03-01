import { Module } from '@nestjs/common';
import { ConsultorioConfigService } from './consultorio-config.service';
import { ConsultorioConfigController } from './consultorio-config.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ConsultorioConfigController],
    providers: [ConsultorioConfigService],
    exports: [ConsultorioConfigService],
})
export class ConsultorioConfigModule { }
