import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
    constructor(private readonly referralsService: ReferralsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new referral record' })
    create(@Body() createReferralDto: CreateReferralDto, @Request() req) {
        return this.referralsService.create(createReferralDto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'List referral records with optional filters' })
    findAll(
        @Query('status') status?: string,
        @Query('date') date?: string
    ) {
        return this.referralsService.findAll(status, date);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get details of a referral record' })
    findOne(@Param('id') id: string) {
        return this.referralsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update referral record status or counter-referral' })
    update(@Param('id') id: string, @Body() updateReferralDto: UpdateReferralDto, @Request() req) {
        return this.referralsService.update(id, updateReferralDto, req.user.id);
    }
}
