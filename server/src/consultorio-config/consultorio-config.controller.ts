import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ConsultorioConfigService } from './consultorio-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('consultorio-config')
@Controller('consultorio-config')
export class ConsultorioConfigController {
    constructor(private readonly consultorioConfigService: ConsultorioConfigService) { }

    @Get()
    @ApiOperation({ summary: 'Get all active consultorio configurations' })
    findAll() {
        return this.consultorioConfigService.findAll();
    }

    @Post('seed')
    @ApiOperation({ summary: 'Seed initial consultorio configurations if empty' })
    seed() {
        return this.consultorioConfigService.seed();
    }
}
