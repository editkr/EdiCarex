import { Controller, Get, Query, Param, UseGuards, Patch, Delete, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard)
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @ApiOperation({ summary: 'Get all audit logs with filters' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'resource', required: false })
    @ApiQuery({ name: 'action', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('userId') userId?: string,
        @Query('resource') resource?: string,
        @Query('action') action?: string,
        @Query('query') query?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.auditService.findAll({
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
            userId,
            resource,
            action,
            query,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get audit statistics' })
    getStats() {
        return this.auditService.getStats();
    }

    @Get('history/:resource/:id')
    @ApiOperation({ summary: 'Get history for a specific resource' })
    async getHistory(
        @Param('resource') resource: string,
        @Param('id') id: string,
    ) {
        return this.auditService.getHistory(resource, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an audit log (e.g. rename chat)' })
    async update(
        @Param('id') id: string,
        @Body() data: { changes?: any }
    ) {
        return this.auditService.updateLog(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an audit log' })
    async remove(@Param('id') id: string) {
        return this.auditService.deleteLog(id);
    }
}
