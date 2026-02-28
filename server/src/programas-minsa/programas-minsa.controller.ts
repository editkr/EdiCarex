import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, OnModuleInit } from '@nestjs/common';
import { ProgramasMinsaService } from './programas-minsa.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('programas-minsa')
@UseGuards(JwtAuthGuard)
export class ProgramasMinsaController implements OnModuleInit {
    constructor(private readonly service: ProgramasMinsaService) { }

    async onModuleInit() {
        // Asegurar que los programas base existen en la BD al arrancar
        await this.service.ensureDefaultPrograms();
    }

    @Get()
    getAll() {
        return this.service.getAll();
    }

    @Get('dashboard')
    getDashboard() {
        return this.service.getDashboard();
    }

    @Get(':programId/records')
    getRecords(@Param('programId') programId: string, @Query('month') month?: string) {
        return this.service.getRecords(programId, month);
    }

    @Post('records')
    createRecord(@Body() data: any) {
        return this.service.createRecord(data);
    }

    @Put('records/:id')
    updateRecord(@Param('id') id: string, @Body() data: any) {
        return this.service.updateRecord(id, data);
    }
}
