import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ObservationRoomService } from './observation-room.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('observation-room')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('observation-room')
export class ObservationRoomController {
    constructor(private readonly obsService: ObservationRoomService) { }

    @Get()
    @ApiOperation({ summary: 'List all observation stretchers' })
    findAll() {
        return this.obsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get stretcher details' })
    findOne(@Param('id') id: string) {
        return this.obsService.findOne(id);
    }

    @Post(':id/admit')
    @ApiOperation({ summary: 'Admit a patient to a stretcher' })
    admit(
        @Param('id') id: string,
        @Body() body: { patientId: string, diagnosis: string, attendedBy: string },
        @Request() req
    ) {
        return this.obsService.admit(id, body.patientId, body.diagnosis, body.attendedBy, req.user.id);
    }

    @Post(':id/discharge')
    @ApiOperation({ summary: 'Discharge a patient from a stretcher' })
    discharge(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @Request() req
    ) {
        return this.obsService.discharge(id, reason, req.user.id);
    }

    @Post(':id/refer')
    @ApiOperation({ summary: 'Refer patient from stretcher & auto-create record' })
    refer(
        @Param('id') id: string,
        @Body() body: { destinationIpress: string, urgencyLevel: string, reason: string },
        @Request() req
    ) {
        return this.obsService.refer(id, body.destinationIpress, body.urgencyLevel, body.reason, req.user.id);
    }
}
