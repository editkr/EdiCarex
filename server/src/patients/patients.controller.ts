import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, SearchPatientsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators';

import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('patients')
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Post()
    @ApiOperation({ summary: 'Create new patient' })
    @RequirePermission('PATIENTS_CREATE')
    @Audit('CREATE_PATIENT', 'patients')
    create(@Body() createPatientDto: CreatePatientDto) {
        return this.patientsService.create(createPatientDto);
    }

    @Post('import')
    @ApiOperation({ summary: 'Import multiple patients' })
    @RequirePermission('PATIENTS_CREATE')
    @Audit('IMPORT_PATIENTS', 'patients')
    import(@Body() patients: CreatePatientDto[]) {
        return this.patientsService.importPatients(patients);
    }

    @Post(':id/enable-portal')
    @ApiOperation({ summary: 'Enable portal access for patient' })
    @RequirePermission('PATIENTS_EDIT')
    @Audit('ENABLE_PORTAL', 'patients')
    enablePortal(@Param('id') id: string) {
        return this.patientsService.enablePortalAccess(id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all patients with search and filters' })
    @RequirePermission('PATIENTS_VIEW')
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'query', required: false, type: String })
    @ApiQuery({ name: 'gender', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, type: String })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('query') query?: string,
        @Query('gender') gender?: string,
        @Query('status') status?: string,
    ) {
        const search: SearchPatientsDto = { query, gender, status };
        return this.patientsService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            search,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get patient by ID with complete history' })
    @RequirePermission('PATIENTS_VIEW')
    @Audit('VIEW_PATIENT', 'patients')
    findOne(@Param('id') id: string) {
        return this.patientsService.findOne(id);
    }

    @Get(':id/medical-history')
    @ApiOperation({ summary: 'Get patient medical history' })
    @RequirePermission('MEDICAL_RECORDS_VIEW')
    @Audit('VIEW_MEDICAL_HISTORY', 'patients')
    getMedicalHistory(@Param('id') id: string) {
        return this.patientsService.getMedicalHistory(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update patient' })
    @RequirePermission('PATIENTS_EDIT')
    @Audit('UPDATE_PATIENT', 'patients')
    update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
        return this.patientsService.update(id, updatePatientDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete patient (soft delete)' })
    @RequirePermission('PATIENTS_DELETE')
    @Audit('DELETE_PATIENT', 'patients')
    remove(@Param('id') id: string) {
        return this.patientsService.remove(id);
    }

    // ============================================
    // TIMELINE
    // ============================================
    @Get(':id/timeline')
    @ApiOperation({ summary: 'Get patient timeline of all events' })
    getTimeline(@Param('id') id: string) {
        return this.patientsService.getTimeline(id);
    }

    // ============================================
    // ALLERGIES
    // ============================================
    @Get(':id/allergies')
    @ApiOperation({ summary: 'Get patient allergies' })
    getAllergies(@Param('id') id: string) {
        return this.patientsService.getAllergies(id);
    }

    @Post(':id/allergies')
    @ApiOperation({ summary: 'Add patient allergy' })
    @Audit('ADD_ALLERGY', 'patients')
    addAllergy(@Param('id') id: string, @Body() data: any) {
        return this.patientsService.addAllergy(id, data);
    }

    @Patch(':id/allergies/:allergyId')
    @ApiOperation({ summary: 'Update patient allergy' })
    updateAllergy(@Param('id') id: string, @Param('allergyId') allergyId: string, @Body() data: any) {
        return this.patientsService.updateAllergy(id, allergyId, data);
    }

    @Delete(':id/allergies/:allergyId')
    @ApiOperation({ summary: 'Delete patient allergy' })
    deleteAllergy(@Param('id') id: string, @Param('allergyId') allergyId: string) {
        return this.patientsService.deleteAllergy(id, allergyId);
    }

    // ============================================
    // VITAL SIGNS
    // ============================================
    @Get(':id/vital-signs')
    @ApiOperation({ summary: 'Get patient vital signs history' })
    getVitalSigns(@Param('id') id: string, @Query('limit') limit?: string) {
        return this.patientsService.getVitalSigns(id, limit ? parseInt(limit) : 50);
    }

    @Post(':id/vital-signs')
    @ApiOperation({ summary: 'Add patient vital sign record' })
    @Audit('ADD_VITAL_SIGNS', 'patients')
    addVitalSign(@Param('id') id: string, @Body() data: any) {
        return this.patientsService.addVitalSign(id, data);
    }

    @Get(':id/vital-signs/chart')
    @ApiOperation({ summary: 'Get patient vital signs chart data (last 6 months)' })
    getVitalSignsChart(@Param('id') id: string) {
        return this.patientsService.getVitalSignsChart(id);
    }

    // ============================================
    // MEDICATIONS
    // ============================================
    @Get(':id/medications')
    @ApiOperation({ summary: 'Get patient medications' })
    @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
    getMedications(@Param('id') id: string, @Query('activeOnly') activeOnly?: string) {
        return this.patientsService.getMedications(id, activeOnly === 'true');
    }

    @Post(':id/medications')
    @ApiOperation({ summary: 'Add patient medication' })
    @Audit('ADD_MEDICATION', 'patients')
    addMedication(@Param('id') id: string, @Body() data: any) {
        return this.patientsService.addMedication(id, data);
    }

    @Patch(':id/medications/:medicationId')
    @ApiOperation({ summary: 'Update patient medication' })
    updateMedication(@Param('id') id: string, @Param('medicationId') medicationId: string, @Body() data: any) {
        return this.patientsService.updateMedication(id, medicationId, data);
    }

    // ============================================
    // DIAGNOSES
    // ============================================
    @Get(':id/diagnoses')
    @ApiOperation({ summary: 'Get patient diagnoses' })
    getDiagnoses(@Param('id') id: string) {
        return this.patientsService.getDiagnoses(id);
    }

    @Post(':id/diagnoses')
    @ApiOperation({ summary: 'Add patient diagnosis' })
    @Audit('ADD_DIAGNOSIS', 'patients')
    addDiagnosis(@Param('id') id: string, @Body() data: any) {
        return this.patientsService.addDiagnosis(id, data);
    }

    @Patch(':id/diagnoses/:diagnosisId')
    @ApiOperation({ summary: 'Update patient diagnosis' })
    updateDiagnosis(@Param('id') id: string, @Param('diagnosisId') diagnosisId: string, @Body() data: any) {
        return this.patientsService.updateDiagnosis(id, diagnosisId, data);
    }

    // ============================================
    // FAMILY MEMBERS
    // ============================================
    @Get(':id/family-members')
    @ApiOperation({ summary: 'Get patient family members' })
    getFamilyMembers(@Param('id') id: string) {
        return this.patientsService.getFamilyMembers(id);
    }

    @Post(':id/family-members')
    @ApiOperation({ summary: 'Add family member' })
    @Audit('ADD_FAMILY_MEMBER', 'patients')
    addFamilyMember(@Param('id') id: string, @Body() data: any) {
        return this.patientsService.addFamilyMember(id, data);
    }

    @Patch(':id/family-members/:memberId')
    @ApiOperation({ summary: 'Update family member' })
    updateFamilyMember(@Param('id') id: string, @Param('memberId') memberId: string, @Body() data: any) {
        return this.patientsService.updateFamilyMember(id, memberId, data);
    }

    @Delete(':id/family-members/:memberId')
    @ApiOperation({ summary: 'Delete family member' })
    deleteFamilyMember(@Param('id') id: string, @Param('memberId') memberId: string) {
        return this.patientsService.deleteFamilyMember(id, memberId);
    }

    // ============================================
    // DOCUMENTS
    // ============================================
    @Get(':id/documents')
    @ApiOperation({ summary: 'Get patient documents' })
    getDocuments(@Param('id') id: string) {
        return this.patientsService.getDocuments(id);
    }

    @Post(':id/documents')
    @ApiOperation({ summary: 'Add patient document' })
    @Audit('ADD_DOCUMENT', 'patients')
    addDocument(@Param('id') id: string, @Body() data: any) {
        return this.patientsService.addDocument(id, data);
    }

    @Delete(':id/documents/:documentId')
    @ApiOperation({ summary: 'Delete patient document' })
    deleteDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
        return this.patientsService.deleteDocument(id, documentId);
    }

    // ============================================
    // CLINICAL NOTES
    // ============================================
    @Post(':id/notes')
    @ApiOperation({ summary: 'Add clinical note' })
    @Audit('ADD_CLINICAL_NOTE', 'patients')
    addNote(@Param('id') id: string, @Body() data: any) {
        return this.patientsService.addNote(id, data);
    }
}
