import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { TriajeService } from './triaje.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators';

@Controller('triaje')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class TriajeController {
    constructor(private readonly triajeService: TriajeService) { }

    @Get()
    @RequirePermission('TRIAGE_VIEW')
    getAll(@Query('date') date?: string) {
        return this.triajeService.getAll(date);
    }

    @Get('stats')
    getStats() {
        return this.triajeService.getStats();
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.triajeService.getById(id);
    }

    @Post()
    @RequirePermission('TRIAGE_EDIT')
    @Audit('CREATE_TRIAGE', 'clinical')
    create(@Body() data: any) {
        return this.triajeService.create(data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.triajeService.update(id, data);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.triajeService.updateStatus(id, status);
    }
}
