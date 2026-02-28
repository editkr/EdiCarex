import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { EpidemiologyService } from './epidemiology.service';
import { CreateEpidemiologyDto } from './dto/create-epidemiology.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('epidemiology')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('epidemiology')
export class EpidemiologyController {
    constructor(private readonly epidemiologyService: EpidemiologyService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new epidemiology report' })
    create(@Body() createEpidemiologyDto: CreateEpidemiologyDto, @Request() req) {
        return this.epidemiologyService.create(createEpidemiologyDto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'List epidemiology reports' })
    findAll() {
        return this.epidemiologyService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get details of an epidemiology report' })
    findOne(@Param('id') id: string) {
        return this.epidemiologyService.findOne(id);
    }

    @Patch(':id/notify')
    @ApiOperation({ summary: 'Mark epidemiology report as NOTI-MINSA' })
    notifyMinsa(@Param('id') id: string, @Request() req) {
        return this.epidemiologyService.notifyMinsa(id, req.user.id);
    }
}
