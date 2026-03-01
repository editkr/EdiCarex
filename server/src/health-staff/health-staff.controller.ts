import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HealthStaffService } from './health-staff.service';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';

import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Health Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('health-staff')
export class HealthStaffController {
    constructor(private readonly healthStaffService: HealthStaffService) { }

    @Get()
    @ApiOperation({ summary: 'Get all health staff' })
    @RequirePermission('STAFF_VIEW')
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'profession', required: false, type: String })
    @ApiQuery({ name: 'contractType', required: false, type: String })
    @ApiQuery({ name: 'minsaProgram', required: false, type: String })
    @ApiQuery({ name: 'isAvailable', required: false, type: String })
    @ApiQuery({ name: 'collegiateStatus', required: false, type: String })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('profession') profession?: string,
        @Query('contractType') contractType?: string,
        @Query('minsaProgram') minsaProgram?: string,
        @Query('isAvailable') isAvailable?: string,
        @Query('collegiateStatus') collegiateStatus?: string
    ) {
        return this.healthStaffService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            { profession, contractType, minsaProgram, isAvailable, collegiateStatus }
        );
    }

    @Get('specialties')
    @ApiOperation({ summary: 'Get all specialties' })
    @RequirePermission('STAFF_VIEW')
    findSpecialties() {
        return this.healthStaffService.findSpecialties();
    }

    @Get('rrhh/dashboard')
    @ApiOperation({ summary: 'Get HR Dashboard stats' })
    @RequirePermission('HR_VIEW')
    getRRHHDashboard() {
        return this.healthStaffService.getRRHHDashboard();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get staff member by ID' })
    @RequirePermission('STAFF_VIEW')
    findOne(@Param('id') id: string) {
        return this.healthStaffService.findOne(id);
    }

    @Get(':id/stats')
    @ApiOperation({ summary: 'Get staff member clinical stats' })
    @RequirePermission('STAFF_VIEW')
    getStaffStats(@Param('id') id: string) {
        return this.healthStaffService.getStaffStats(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create staff member' })
    @RequirePermission('STAFF_CREATE')
    @Audit('CREATE_STAFF', 'health-staff')
    create(@Body() data: any) {
        return this.healthStaffService.create(data);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update staff member' })
    @RequirePermission('STAFF_EDIT')
    @Audit('UPDATE_STAFF', 'health-staff')
    update(@Param('id') id: string, @Body() data: any) {
        return this.healthStaffService.update(id, data);
    }

    @Patch(':id/contract')
    @ApiOperation({ summary: 'Renew staff contract' })
    @RequirePermission('STAFF_EDIT')
    @Audit('RENEW_STAFF_CONTRACT', 'health-staff')
    renewContract(@Param('id') id: string, @Body() data: { contractEndDate: string, notes?: string }) {
        return this.healthStaffService.renewContract(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete staff member' })
    @RequirePermission('STAFF_DELETE')
    @Audit('DELETE_STAFF', 'health-staff')
    remove(@Param('id') id: string) {
        return this.healthStaffService.remove(id);
    }

    @Post(':id/documents')
    @ApiOperation({ summary: 'Add document to staff member' })
    @RequirePermission('STAFF_EDIT')
    addDocument(@Param('id') id: string, @Body() data: any) {
        return this.healthStaffService.addDocument(id, data);
    }

    @Get(':id/documents')
    @ApiOperation({ summary: 'Get staff member documents' })
    @RequirePermission('STAFF_VIEW')
    getDocuments(@Param('id') id: string) {
        return this.healthStaffService.getDocuments(id);
    }

    @Delete(':id/documents/:docId')
    @ApiOperation({ summary: 'Delete staff document' })
    @RequirePermission('STAFF_EDIT')
    removeDocument(@Param('id') id: string, @Param('docId') docId: string) {
        return this.healthStaffService.removeDocument(id, docId);
    }
}
