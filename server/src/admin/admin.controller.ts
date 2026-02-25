import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateConfigDto, UpdateConfigDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit, Public } from '../common/decorators';
import { UseInterceptors } from '@nestjs/common';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('config')
    @ApiOperation({ summary: 'Create system configuration' })
    createConfig(@Body() createConfigDto: CreateConfigDto) {
        return this.adminService.createConfig(createConfigDto);
    }

    @Get('config')
    @ApiOperation({ summary: 'Get all configurations' })
    @ApiQuery({ name: 'category', required: false })
    getAllConfigs(@Query('category') category?: string) {
        return this.adminService.getAllConfigs(category);
    }

    @Get('config/:id')
    @ApiOperation({ summary: 'Get configuration by ID' })
    getConfigById(@Param('id') id: string) {
        return this.adminService.getConfigById(id);
    }

    @Put('config/:id')
    @Audit('ACTUALIZAR', 'SEGURIDAD')
    @ApiOperation({ summary: 'Update configuration' })
    updateConfig(@Param('id') id: string, @Body() updateConfigDto: UpdateConfigDto) {
        return this.adminService.updateConfig(id, updateConfigDto);
    }

    @Delete('config/:id')
    @ApiOperation({ summary: 'Delete configuration' })
    deleteConfig(@Param('id') id: string) {
        return this.adminService.deleteConfig(id);
    }

    @Get('services/by-category')
    @ApiOperation({ summary: 'Get services grouped by category' })
    getServicesByCategory() {
        return this.adminService.getServicesByCategory();
    }

    @Public()
    @Get('organization')
    @ApiOperation({ summary: 'Get organization configuration' })
    getOrganizationConfig() {
        return this.adminService.getOrganizationConfig();
    }

    @Put('organization')
    @Audit('ACTUALIZAR', 'SEGURIDAD')
    @ApiOperation({ summary: 'Update organization configuration' })
    updateOrganizationConfig(@Body() body: any) {
        return this.adminService.updateOrganizationConfig(body);
    }

    @Get('backups')
    @ApiOperation({ summary: 'Get backup logs' })
    getBackups() {
        return this.adminService.getBackups();
    }

    @Post('backups')
    @Audit('CREAR', 'SEGURIDAD')
    @ApiOperation({ summary: 'Create new backup' })
    createBackup() {
        return this.adminService.createBackup();
    }

    @Post('backups/:id/restore')
    @Audit('RESTAURAR', 'SEGURIDAD')
    @ApiOperation({ summary: 'Restore from backup' })
    restoreBackup(@Param('id') id: string) {
        return this.adminService.restoreBackup(id);
    }

    @Get('backups/:filename/download')
    @ApiOperation({ summary: 'Download backup file' })
    async downloadBackup(@Param('filename') filename: string, @Res() res) {
        const filePath = await this.adminService.getBackupFile(filename);
        return res.download(filePath);
    }

    @Delete('backups/:id')
    @Audit('ELIMINAR', 'SEGURIDAD')
    @ApiOperation({ summary: 'Delete backup' })
    deleteBackup(@Param('id') id: string) {
        return this.adminService.deleteBackup(id);
    }

    @Post('backups/cleanup')
    @Audit('ELIMINAR', 'SEGURIDAD')
    @ApiOperation({ summary: 'Cleanup old backups (30 days retention)' })
    cleanupBackups() {
        return this.adminService.cleanupOldBackups();
    }

    @Get('backups/:filename/verify')
    @ApiOperation({ summary: 'Verify backup integrity using SHA-256' })
    verifyBackup(@Param('filename') filename: string) {
        return this.adminService.verifyBackupIntegrity(filename);
    }

    @Get('system/stats')
    @ApiOperation({ summary: 'Get real-time system infrastructure stats' })
    getSystemStats() {
        return this.adminService.getSystemStats();
    }

    @Get('system/health')
    @ApiOperation({ summary: 'Get status of core and external services' })
    getSystemHealth() {
        return this.adminService.getSystemHealth();
    }
}
