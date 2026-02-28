import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators';

@Controller('encounters')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class EncountersController {
    constructor(private readonly encountersService: EncountersService) { }

    @Post()
    @RequirePermission('ENC_EDIT')
    @Audit('CREATE_ENCOUNTER', 'clinical')
    create(@Body() data: any) {
        return this.encountersService.create(data);
    }

    @Get()
    @RequirePermission('ENC_VIEW')
    findAll(
        @Query('patientId') patientId?: string,
        @Query('staffId') staffId?: string,
        @Query('status') status?: string,
    ) {
        return this.encountersService.findAll({ patientId, staffId, status });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.encountersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.encountersService.update(id, data);
    }

    @Post(':id/close')
    close(@Param('id') id: string, @Body('notes') notes?: string) {
        return this.encountersService.close(id, notes);
    }

    @Get('patient/:patientId')
    getPatientHistory(@Param('patientId') patientId: string) {
        return this.encountersService.getPatientHistory(patientId);
    }
}
