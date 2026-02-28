import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SisService } from './sis.service';
import { ValidateSisDto } from './dto/validate-sis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('sis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sis')
export class SisController {
    constructor(private readonly sisService: SisService) { }

    @Post('validate')
    @ApiOperation({ summary: 'Validate SIS via DNI and save log' })
    validate(@Body() validateSisDto: ValidateSisDto, @Request() req) {
        return this.sisService.validate(validateSisDto, req.user.id);
    }

    @Get('patient/:id/history')
    @ApiOperation({ summary: 'Get validation history for a patient' })
    getHistoryByPatient(@Param('id') patientId: string) {
        return this.sisService.getHistoryByPatient(patientId);
    }
}
