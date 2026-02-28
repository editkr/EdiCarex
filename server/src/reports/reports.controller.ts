import { Controller, Get, Query, Res, Param, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('dashboard')
    getDashboardStats() {
        return this.reportsService.getDashboardStats();
    }

    @Get('appointments')
    getAppointmentStats(@Query() params: any) {
        return this.reportsService.getAppointmentStats(params);
    }

    @Get('patients')
    getPatientStats(@Query() params: any) {
        return this.reportsService.getPatientStats(params);
    }

    @Get('finance')
    getFinancialStats(@Query() params: any) {
        return this.reportsService.getFinancialStats(params);
    }

    @Get('medications')
    getMedicationStats(@Query() params: any) {
        return this.reportsService.getMedicationStats(params);
    }

    @Get('staff')
    getStaffStats(@Query() params: any) {
        return this.reportsService.getStaffStats(params);
    }

    @Get('emergencies')
    getEmergencyStats(@Query() params: any) {
        return this.reportsService.getEmergencyStats(params);
    }

    @Get('comparison')
    getComparisonStats() {
        return this.reportsService.getComparisonStats();
    }

    @Get('ai-predictions')
    getAiPredictions() {
        return this.reportsService.getAiPredictions();
    }

    @Get('export/:type')
    async exportReport(
        @Param('type') type: string,
        @Res() res: Response,
        @Query() params: any
    ) {
        const { buffer, filename } = await this.reportsService.exportReport(type, params);

        const contentType = filename.endsWith('.csv')
            ? 'text/csv'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename = ${filename} `,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
}
