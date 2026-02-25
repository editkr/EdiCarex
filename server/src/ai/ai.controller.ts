import { Controller, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaintenanceGuard } from '../common/guards/maintenance.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { Audit } from '../common/decorators/audit.decorator';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MaintenanceGuard)
@UseInterceptors(AuditInterceptor)
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('triage')
    @Audit('Triage', 'AI')
    @ApiOperation({ summary: 'AI-powered triage prediction' })
    predictTriage(@Body() data: any) {
        return this.aiService.predictTriage(data);
    }

    @Post('summarize')
    @Audit('Summarization', 'AI')
    @ApiOperation({ summary: 'Summarize clinical notes' })
    summarize(@Body() data: { text: string }) {
        return this.aiService.summarizeClinical(data.text);
    }

    @Post('pharmacy/demand')
    @Audit('Pharmacy Prediction', 'AI')
    @ApiOperation({ summary: 'Predict pharmacy demand' })
    predictDemand(@Body() data: { medication_id: string }) {
        return this.aiService.predictPharmacyDemand(data.medication_id);
    }

    @Post('chat')
    @Audit('Chat', 'AI')
    @ApiOperation({ summary: 'Medical AI Chat' })
    chat(@Body() data: { message: string; context?: string }) {
        return this.aiService.chat(data);
    }

    @Post('text/generate')
    @Audit('Document Generation', 'AI')
    @ApiOperation({ summary: 'Generate clinical documents' })
    generateText(@Body() data: { template_type: string; patient_data: any; additional_notes?: string }) {
        return this.aiService.generateText(data);
    }

    @Post('analytics/growth')
    @ApiOperation({ summary: 'AI-powered growth and logistics prediction' })
    predictGrowth(@Body() data: any) {
        return this.aiService.predictGrowth(data);
    }
}
