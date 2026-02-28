import { Module } from '@nestjs/common';
import { ProgramasMinsaService } from './programas-minsa.service';
import { ProgramasMinsaController } from './programas-minsa.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ProgramasMinsaController],
    providers: [ProgramasMinsaService],
    exports: [ProgramasMinsaService],
})
export class ProgramasMinsaModule { }
