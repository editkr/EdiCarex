import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmergencyService } from './emergency.service';
import { CreateBedDto, UpdateBedStatusDto, CreateEmergencyCaseDto } from './dto';
import { AddVitalSignDto, AddMedicationDto, AddProcedureDto, AddAttachmentDto } from './dto/clinical.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators';

@ApiTags('Emergency')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard)
@UseInterceptors(AuditInterceptor)
@Controller('emergency')
export class EmergencyController {
    constructor(private readonly emergencyService: EmergencyService) { }

    @Post('cases')
    @ApiOperation({ summary: 'Create new emergency case' })
    @Audit('CREATE_EMERGENCY_CASE', 'emergency')
    createCase(@Body() createEmergencyCaseDto: CreateEmergencyCaseDto) {
        return this.emergencyService.createEmergencyCase(createEmergencyCaseDto);
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get emergency dashboard data' })
    getDashboard() {
        return this.emergencyService.getDashboard();
    }

    @Get('critical-patients')
    @ApiOperation({ summary: 'Get critical patients list' })
    getCriticalPatients() {
        return this.emergencyService.getCriticalPatients();
    }

    @Get('cases/:id')
    @ApiOperation({ summary: 'Get emergency case details' })
    getCaseById(@Param('id') id: string) {
        return this.emergencyService.getCaseById(id);
    }

    @Put('cases/:id')
    @ApiOperation({ summary: 'Update emergency case' })
    @Audit('UPDATE_EMERGENCY_CASE', 'emergency')
    async updateCase(@Param('id') id: string, @Body() updateCaseDto: Partial<CreateEmergencyCaseDto>) {
        try {
            return await this.emergencyService.updateEmergencyCase(id, updateCaseDto);
        } catch (error: any) {
            console.error('Update Case Error:', error);
            // Re-throw with message to show in frontend
            const { InternalServerErrorException } = require('@nestjs/common');
            throw new InternalServerErrorException(error.message || 'Internal server error');
        }
    }

    @Get('history/:patientId')
    @ApiOperation({ summary: 'Get patient emergency history' })
    getPatientHistory(@Param('patientId') patientId: string) {
        return this.emergencyService.getPatientHistory(patientId);
    }

    @Post('beds')
    @ApiOperation({ summary: 'Create new bed' })
    createBed(@Body() createBedDto: CreateBedDto) {
        return this.emergencyService.createBed(createBedDto);
    }

    @Get('beds')
    @ApiOperation({ summary: 'Get all beds' })
    @ApiQuery({ name: 'ward', required: false })
    @ApiQuery({ name: 'status', required: false })
    getAllBeds(@Query('ward') ward?: string, @Query('status') status?: string) {
        return this.emergencyService.getAllBeds(ward, status);
    }

    @Get('beds/:id')
    @ApiOperation({ summary: 'Get bed by ID' })
    getBedById(@Param('id') id: string) {
        return this.emergencyService.getBedById(id);
    }

    @Put('beds/:id')
    @ApiOperation({ summary: 'Update bed status' })
    @Audit('UPDATE_BED_STATUS', 'emergency')
    updateBedStatus(@Param('id') id: string, @Body() updateBedStatusDto: UpdateBedStatusDto) {
        return this.emergencyService.updateBedStatus(id, updateBedStatusDto);
    }

    @Get('wards/stats')
    @ApiOperation({ summary: 'Get ward statistics' })
    getWardStats() {
        return this.emergencyService.getWardStats();
    }

    @Put('cases/:id/discharge')
    @ApiOperation({ summary: 'Discharge emergency case and free bed' })
    @Audit('DISCHARGE_EMERGENCY_CASE', 'emergency')
    dischargeCase(@Param('id') id: string) {
        return this.emergencyService.dischargeCase(id);
    }

    @Put('cases/:id/transfer')
    @ApiOperation({ summary: 'Transfer emergency case to another ward' })
    @Audit('TRANSFER_PATIENT', 'emergency')
    transferPatient(@Param('id') id: string, @Body() data: { targetWard: string, targetBedId?: string, notes?: string }) {
        return this.emergencyService.transferPatient(id, data);
    }

    // --- Clinical Recording Endpoints ---

    @Post('cases/:id/vitals')
    @ApiOperation({ summary: 'Add vital sign record to case' })
    addVitalSign(@Param('id') id: string, @Body() dto: AddVitalSignDto) {
        return this.emergencyService.addVitalSign(id, dto);
    }

    @Post('cases/:id/medications')
    @ApiOperation({ summary: 'Add medication record to case' })
    addMedication(@Param('id') id: string, @Body() dto: AddMedicationDto) {
        return this.emergencyService.addMedication(id, dto);
    }

    @Post('cases/:id/procedures')
    @ApiOperation({ summary: 'Add procedure record to case' })
    addProcedure(@Param('id') id: string, @Body() dto: AddProcedureDto) {
        return this.emergencyService.addProcedure(id, dto);
    }

    @Post('cases/:id/attachments')
    @ApiOperation({ summary: 'Add attachment record to case' })
    addAttachment(@Param('id') id: string, @Body() dto: AddAttachmentDto) {
        return this.emergencyService.uploadAttachment(id, dto);
    }

    @Put('attachments/:id')
    @ApiOperation({ summary: 'Update attachment (rename)' })
    updateAttachment(@Param('id') id: string, @Body() data: { title: string }) {
        return this.emergencyService.updateAttachment(id, data);
    }

    @Put('attachments/:id/delete') // Using PUT for delete if they prefer, but DELETE is better
    @ApiOperation({ summary: 'Delete attachment' })
    deleteAttachment(@Param('id') id: string) {
        return this.emergencyService.deleteAttachment(id);
    }
}
