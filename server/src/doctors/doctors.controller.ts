import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';

import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('doctors')
export class DoctorsController {
    constructor(private readonly doctorsService: DoctorsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all doctors' })
    @RequirePermission('STAFF_VIEW')
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.doctorsService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @Get('specialties')
    @ApiOperation({ summary: 'Get all specialties' })
    // Specialties might be needed for dropdowns, so maybe lax permission or STAFF_VIEW
    @RequirePermission('STAFF_VIEW')
    findSpecialties() {
        return this.doctorsService.findSpecialties();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get doctor by ID' })
    @RequirePermission('STAFF_VIEW')
    findOne(@Param('id') id: string) {
        return this.doctorsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create doctor' })
    @RequirePermission('STAFF_CREATE')
    @Audit('CREATE_DOCTOR', 'doctors')
    create(@Body() data: any) {
        return this.doctorsService.create(data);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update doctor' })
    @RequirePermission('STAFF_EDIT')
    @Audit('UPDATE_DOCTOR', 'doctors')
    update(@Param('id') id: string, @Body() data: any) {
        return this.doctorsService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete doctor' })
    @RequirePermission('STAFF_DELETE')
    @Audit('DELETE_DOCTOR', 'doctors')
    remove(@Param('id') id: string) {
        return this.doctorsService.remove(id);
    }

    @Post(':id/documents')
    @ApiOperation({ summary: 'Add document to doctor' })
    @RequirePermission('STAFF_EDIT')
    addDocument(@Param('id') id: string, @Body() data: any) {
        return this.doctorsService.addDocument(id, data);
    }

    @Get(':id/documents')
    @ApiOperation({ summary: 'Get doctor documents' })
    @RequirePermission('STAFF_VIEW')
    getDocuments(@Param('id') id: string) {
        return this.doctorsService.getDocuments(id);
    }

    @Delete(':id/documents/:docId')
    @ApiOperation({ summary: 'Delete doctor document' })
    @RequirePermission('STAFF_EDIT')
    removeDocument(@Param('id') id: string, @Param('docId') docId: string) {
        return this.doctorsService.removeDocument(id, docId);
    }
}
