import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { LaboratoryService } from './laboratory.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators';

@ApiTags('Laboratory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard)
@UseInterceptors(AuditInterceptor)
@Controller('laboratory')
export class LaboratoryController {
    constructor(private readonly laboratoryService: LaboratoryService) { }

    @Get('orders')
    @ApiOperation({ summary: 'Get all lab orders' })
    async getOrders(@Query() query: any) {
        return this.laboratoryService.getOrders(query);
    }

    @Get('orders/:id')
    @ApiOperation({ summary: 'Get lab order by ID' })
    async getOrder(@Param('id') id: string) {
        return this.laboratoryService.getOrder(id);
    }

    @Post('orders')
    @ApiOperation({ summary: 'Create lab order' })
    @Audit('CREATE_LAB_ORDER', 'laboratory')
    async createOrder(@Body() data: any) {
        return this.laboratoryService.createOrder(data);
    }

    @Patch('orders/:id')
    @ApiOperation({ summary: 'Update lab order' })
    @Audit('UPDATE_LAB_ORDER', 'laboratory')
    async updateOrder(@Param('id') id: string, @Body() data: any) {
        return this.laboratoryService.updateOrder(id, data);
    }

    @Patch('orders/:id/status')
    @ApiOperation({ summary: 'Update order status' })
    @Audit('UPDATE_LAB_ORDER_STATUS', 'laboratory')
    async updateStatus(@Param('id') id: string, @Body() data: any) {
        return this.laboratoryService.updateStatus(id, data);
    }

    @Delete('orders/:id')
    @ApiOperation({ summary: 'Delete lab order' })
    @Audit('DELETE_LAB_ORDER', 'laboratory')
    async deleteOrder(@Param('id') id: string) {
        return this.laboratoryService.deleteOrder(id);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get laboratory statistics' })
    async getStats() {
        return this.laboratoryService.getStats();
    }

    @Get('tests')
    @ApiOperation({ summary: 'Get available tests' })
    async getTests() {
        return this.laboratoryService.getTests();
    }
}
