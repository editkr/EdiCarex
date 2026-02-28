import { Controller, Get, Post, Body, Query, UseGuards, Request, Res } from '@nestjs/common';
import { HisService } from './his.service';
import { CreateHisDto } from './dto/create-his.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('his')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('his')
export class HisController {
    constructor(private readonly hisService: HisService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new HIS record' })
    create(@Body() createHisDto: CreateHisDto, @Request() req) {
        return this.hisService.create(createHisDto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'List HIS records with optional filters' })
    findAll(
        @Query('date') date?: string,
        @Query('type') type?: string
    ) {
        return this.hisService.findAll(date, type);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get monthly stats for dashboard' })
    getStats() {
        return this.hisService.getStats();
    }

    @Post('export')
    @ApiOperation({ summary: 'Export HIS records to CSV format (MINSA)' })
    async exportCsv(@Query('date') date: string, @Res() res: Response) {
        const records = await this.hisService.findAll(date);

        // BASIC MINSA CSV FORMAT
        const header = "IPRESS,FECHA_ATENCION,HCL_DNI,EDAD,GENERO,UBIGEO,DX_CIE10,TIPO_DX,FINANCIAMIENTO,SERVICIO,PERSONAL\n";
        const rows = records.map(r => {
            const patientIdOrDni = r.patient?.documentNumber || 'NN';
            const staffName = r.staff?.user ? `${r.staff.user.firstName} ${r.staff.user.lastName}` : 'NN';
            return `${r.ipressCode},${r.attentionDate.toISOString().split('T')[0]},${patientIdOrDni},${r.age},${r.gender},${r.ubigeo},${r.diagnosis},${r.conditionType},${r.fundingType},${r.serviceType},${staffName}`;
        }).join('\n');

        res.header('Content-Type', 'text/csv');
        res.attachment(`HIS-Export-${date || 'All'}.csv`);
        return res.send(header + rows);
    }
}
