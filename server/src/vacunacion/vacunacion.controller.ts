import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VacunacionService } from './vacunacion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vacunacion')
@UseGuards(JwtAuthGuard)
export class VacunacionController {
    constructor(private readonly vacunacionService: VacunacionService) { }

    @Get()
    getAll(@Query('category') category?: string, @Query('month') month?: string) {
        return this.vacunacionService.getAll(category, month);
    }

    @Get('stats')
    getStats(@Query('month') month?: string) {
        return this.vacunacionService.getStats(month);
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.vacunacionService.getById(id);
    }

    @Post()
    create(@Body() data: any) {
        return this.vacunacionService.create(data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.vacunacionService.update(id, data);
    }
}
