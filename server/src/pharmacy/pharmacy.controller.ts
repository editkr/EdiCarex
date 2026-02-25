import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators';

@ApiTags('Pharmacy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard)
@UseInterceptors(AuditInterceptor)
@Controller('pharmacy')
export class PharmacyController {
    constructor(private readonly pharmacyService: PharmacyService) { }

    @Get('medications')
    @ApiOperation({ summary: 'Get all medications' })
    async getMedications(@Query() query: any) {
        return this.pharmacyService.getMedications(query);
    }

    @Get('medications/:id')
    @ApiOperation({ summary: 'Get medication by ID' })
    async getMedication(@Param('id') id: string) {
        return this.pharmacyService.getMedication(id);
    }

    @Post('medications')
    @ApiOperation({ summary: 'Create medication' })
    @Audit('CREATE_MEDICATION', 'medications')
    async createMedication(@Body() data: any) {
        return this.pharmacyService.createMedication(data);
    }

    @Patch('medications/:id')
    @ApiOperation({ summary: 'Update medication' })
    @Audit('UPDATE_MEDICATION', 'medications')
    async updateMedication(@Param('id') id: string, @Body() data: any) {
        return this.pharmacyService.updateMedication(id, data);
    }

    @Delete('medications/:id')
    @ApiOperation({ summary: 'Delete medication' })
    @Audit('DELETE_MEDICATION', 'medications')
    async deleteMedication(@Param('id') id: string) {
        return this.pharmacyService.deleteMedication(id);
    }

    @Get('stock')
    @ApiOperation({ summary: 'Get stock information' })
    async getStock(@Query() query: any) {
        return this.pharmacyService.getStock(query);
    }

    @Get('stock/low')
    @ApiOperation({ summary: 'Get low stock medications' })
    async getLowStock() {
        return this.pharmacyService.getLowStock();
    }

    @Patch('stock/:id')
    @ApiOperation({ summary: 'Update stock' })
    @Audit('UPDATE_STOCK', 'stock')
    async updateStock(@Param('id') id: string, @Body() data: any) {
        return this.pharmacyService.updateStock(id, data);
    }

    @Get('orders')
    @ApiOperation({ summary: 'Get pharmacy orders' })
    async getOrders() {
        return this.pharmacyService.getOrders();
    }

    @Get('kardex')
    @ApiOperation({ summary: 'Get kardex entries' })
    async getKardex() {
        return this.pharmacyService.getKardex();
    }

    @Patch('orders/:id/approve')
    @ApiOperation({ summary: 'Approve order' })
    @Audit('APPROVE_PHARMACY_ORDER', 'pharmacy-orders')
    async approveOrder(@Param('id') id: string, @Request() req) {
        return this.pharmacyService.approveOrder(id, req.user.id);
    }

    @Patch('orders/:id/reject')
    @ApiOperation({ summary: 'Reject order' })
    @Audit('REJECT_PHARMACY_ORDER', 'pharmacy-orders')
    async rejectOrder(@Param('id') id: string, @Body('reason') reason: string) {
        return this.pharmacyService.rejectOrder(id, reason);
    }
}
