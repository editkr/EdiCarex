import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';
import { NotificationsService } from '../notifications/notifications.service';

import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators';

import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('appointments')
export class AppointmentsController {
    constructor(
        private readonly appointmentsService: AppointmentsService,
        private readonly notificationsService: NotificationsService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Crear nueva cita con validación horario I-4 y triaje IA' })
    @RequirePermission('APPOINTMENTS_CREATE')
    @Audit('CREATE_APPOINTMENT', 'appointments')
    create(@Body() createDto: any) {
        return this.appointmentsService.create(createDto);
    }

    // ⚠️ IMPORTANTE: stats/dashboard debe ir ANTES de :id para evitar colisión de rutas
    @Get('stats/dashboard')
    @ApiOperation({ summary: 'Dashboard de estadísticas de citas (día, semana, mes, HIS pendiente)' })
    @RequirePermission('APPOINTMENTS_VIEW')
    getDashboardStats() {
        return this.appointmentsService.getDashboardStats();
    }

    @Get('daily/stats')
    @ApiOperation({ summary: 'Estadísticas detalladas de la agenda diaria (ocupación, esperas)' })
    @RequirePermission('APPOINTMENTS_VIEW')
    getDailyStats(@Query('date') date: string) {
        return this.appointmentsService.getDailyStats(date);
    }

    @Get()
    @ApiOperation({ summary: 'Listar citas con filtros MINSA I-4' })
    @RequirePermission('APPOINTMENTS_VIEW')
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'staffId', required: false })
    @ApiQuery({ name: 'patientId', required: false })
    @ApiQuery({ name: 'date', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'appointmentType', required: false })
    @ApiQuery({ name: 'financiador', required: false })
    @ApiQuery({ name: 'patientCondition', required: false })
    @ApiQuery({ name: 'upss', required: false })
    @ApiQuery({ name: 'hisLinked', required: false })
    findAll(@Query() query: any) {
        const { page, limit, ...filters } = query;
        return this.appointmentsService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 100,
            filters,
        );
    }

    @Get(':id/notifications')
    @ApiOperation({ summary: 'Notificaciones de la cita' })
    @RequirePermission('APPOINTMENTS_VIEW')
    async getNotifications(@Param('id') id: string) {
        return this.notificationsService.findByRelatedEntity('APPOINTMENT', id);
    }

    @Post(':id/generate-his')
    @ApiOperation({ summary: 'Generar registro HIS automáticamente desde cita completada' })
    @RequirePermission('APPOINTMENTS_EDIT')
    @Audit('GENERATE_HIS_FROM_APPOINTMENT', 'appointments')
    generateHis(@Param('id') id: string) {
        return this.appointmentsService.generateHis(id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener cita por ID' })
    @RequirePermission('APPOINTMENTS_VIEW')
    findOne(@Param('id') id: string) {
        return this.appointmentsService.findOne(id);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Actualizar estado de la cita' })
    @RequirePermission('APPOINTMENTS_EDIT')
    @Audit('UPDATE_APPOINTMENT_STATUS', 'appointments')
    updateStatus(@Param('id') id: string, @Body() body: { status: string; notes?: string }) {
        return this.appointmentsService.updateStatus(id, body.status, body.notes);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar cita (incluyendo signos vitales, diagnósticos, recetas)' })
    @RequirePermission('APPOINTMENTS_EDIT')
    @Audit('UPDATE_APPOINTMENT', 'appointments')
    update(@Param('id') id: string, @Body() data: any) {
        return this.appointmentsService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar cita (soft delete)' })
    @RequirePermission('APPOINTMENTS_EDIT')
    @Audit('DELETE_APPOINTMENT', 'appointments')
    remove(@Param('id') id: string) {
        return this.appointmentsService.remove(id);
    }
}
