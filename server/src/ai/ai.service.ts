import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly aiServiceUrl: string;

    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
        private adminService: AdminService,
    ) {
        this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
    }

    async predictTriage(data: {
        symptoms: string;
        age?: number;
        vitalSigns?: any;
    }): Promise<any> {
        const config = await this.adminService.getOrganizationConfig();
        const aiConfig = config.ai as any;

        if (!aiConfig?.enabled || !aiConfig?.features?.triage) {
            this.logger.warn('AI Triage disabled by admin or global switch, using fallback');
            return this.fallbackTriage(data);
        }

        try {
            const temperature = this.mapCreativityToTemp(aiConfig.creativity);
            const response = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/predict/triage`, {
                    symptoms: data.symptoms,
                    age: data.age || 35, // Default age if missing
                    vitalSigns: data.vitalSigns || {},
                    model: aiConfig.model,
                    temperature
                }),
            );
            this.logger.log('AI triage prediction successful');
            const result = response.data;

            // Normalize for frontend consumption (Senior Mode)
            const priorityStr = String(result.priority || '').toUpperCase();
            let priorityNum = 4; // Default Green

            if (priorityStr.includes('ROJO') || priorityStr.includes('EMERGENCIA')) priorityNum = 1;
            else if (priorityStr.includes('NARANJA') || priorityStr.includes('MUY URGENTE')) priorityNum = 2;
            else if (priorityStr.includes('AMARILLO') || priorityStr.includes('URGENTE')) priorityNum = 3;
            else if (priorityStr.includes('VERDE') || priorityStr.includes('ESTÁNDAR')) priorityNum = 4;
            else if (priorityStr.includes('AZUL') || priorityStr.includes('NO URGENTE')) priorityNum = 5;
            else priorityNum = typeof result.priority === 'number' ? result.priority : (parseInt(priorityStr.match(/\d+/)?.[0] || '4'));

            return {
                ...result,
                priority: priorityNum,
                recommendations: result.recommendations?.length > 0 ? result.recommendations : ['Evaluación médica inmediata', 'Controlar signos vitales'],
                waitTime: result.wait_time || result.waitTime || 60,
                score: result.score || 0,
                notes: result.notes || result.analysis || '',
                analysis: result.notes || result.analysis || '' // Consistency for different frontend components
            };
        } catch (error) {
            this.logger.warn('AI service unavailable, using fallback rules');
            // Fallback to rule-based triage when AI service is not running
            const fallback = this.fallbackTriage(data);
            return {
                ...fallback,
                analysis: '⚠️ (Motor Local) Evaluación automática basada en protocolos de emergencia estándar. El servicio de IA avanzado no está disponible actualmente.'
            };
        }
    }

    async summarizeClinical(text: string): Promise<{ summary: string }> {
        const config = await this.adminService.getOrganizationConfig();
        const aiConfig = config.ai as any;

        if (!aiConfig?.enabled || (!aiConfig?.features?.diagnosis && !aiConfig?.features?.recordSummarization)) {
            this.logger.warn('AI Summarization/Diagnosis Support disabled');
            return { summary: text.substring(0, 200) + '...' };
        }

        try {
            const temperature = this.mapCreativityToTemp(aiConfig.creativity);
            const response = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/summarize`, {
                    text,
                    model: aiConfig.model,
                    temperature
                }),
            );
            return response.data as { summary: string, model?: string };
        } catch (error) {
            this.logger.error('AI summarization failed', error);
            return { summary: text.substring(0, 200) + '...' };
        }
    }

    async predictPharmacyDemand(medicationId: string): Promise<{ predicted_demand: number }> {
        const config = await this.adminService.getOrganizationConfig();
        const aiConfig = config.ai as any;

        if (!aiConfig?.enabled || !aiConfig?.features?.pharmacyStock) {
            this.logger.warn('AI Pharmacy Demand prediction disabled');
            return { predicted_demand: 100 };
        }

        try {
            const temperature = this.mapCreativityToTemp(aiConfig.creativity);
            const response = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/pharmacy/demand`, {
                    medication_id: medicationId,
                    model: aiConfig.model,
                    temperature
                }),
            );
            return response.data as { predicted_demand: number, model?: string };
        } catch (error) {
            this.logger.error('AI demand prediction failed', error);
            return { predicted_demand: 100 };
        }
    }

    async generateText(data: { template_type: string; patient_data: any; additional_notes?: string }): Promise<any> {
        const config = await this.adminService.getOrganizationConfig();
        const aiConfig = config.ai as any;

        if (!aiConfig?.enabled || !aiConfig?.features?.documentGenerator) {
            this.logger.warn('AI Text Generation disabled');
            return { generated_text: `[DOCUMENTO: ${data.template_type.toUpperCase()}]\n\n${data.additional_notes || ''}` };
        }

        try {
            const temperature = this.mapCreativityToTemp(aiConfig.creativity);
            const response = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/text/generator/text`, {
                    ...data,
                    model: aiConfig.model,
                    temperature
                }),
            );
            return response.data;
        } catch (error) {
            this.logger.error('AI text generation failed', error);
            return { generated_text: `[DOCUMENTO: ${data.template_type.toUpperCase()}]\n\n${data.additional_notes || ''}` };
        }
    }

    async predictGrowth(financialData: any): Promise<any> {
        const config = await this.adminService.getOrganizationConfig();
        const aiConfig = config.ai as any;

        if (!aiConfig?.enabled || !aiConfig?.features?.predictiveAnalytics) {
            return null;
        }

        try {
            const temperature = this.mapCreativityToTemp(aiConfig.creativity);
            const response = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/analytics/predict/growth`, {
                    financial_data: financialData,
                    model: aiConfig.model,
                    temperature
                }),
            );
            return response.data;
        } catch (error) {
            this.logger.error('AI growth prediction failed', error);
            return null;
        }
    }

    async chat(data: { message: string; context?: string }): Promise<any> {
        const config = await this.adminService.getOrganizationConfig();
        const aiConfig = config.ai as any;

        const lowerContext = (data.context || '').toLowerCase();
        let isAllowed = true;

        if (lowerContext.includes('hr') || lowerContext.includes('recursos humanos')) {
            isAllowed = !!aiConfig?.features?.hrAssistant;
        } else if (lowerContext.includes('patient') || lowerContext.includes('paciente')) {
            isAllowed = !!aiConfig?.features?.patientConcierge;
        } else if (lowerContext.includes('diagnosis') || lowerContext.includes('diagnóstico')) {
            isAllowed = !!aiConfig?.features?.diagnosis;
        } else {
            // Default to staffAssistant for general/staff context
            isAllowed = !!aiConfig?.features?.staffAssistant;
        }

        if (!aiConfig?.enabled || !isAllowed) {
            this.logger.warn(`AI Chat ${data.context} disabled by admin, using fallback`);
            return this.fallbackChat(data.message);
        }

        try {
            const temperature = this.mapCreativityToTemp(aiConfig.creativity);
            const response = await firstValueFrom(
                this.httpService.post(`${this.aiServiceUrl}/ai/chat`, {
                    ...data,
                    model: aiConfig.model,
                    temperature
                }),
            );
            this.logger.log('AI chat response successful');
            return response.data;
        } catch (error) {
            this.logger.warn('AI chat service unavailable, using fallback response');
            return this.fallbackChat(data.message);
        }
    }

    private fallbackChat(message: string): any {
        const messageLower = message.toLowerCase();
        let response = 'Gracias por tu consulta. Para una orientación más precisa, te recomiendo agendar una cita con un especialista.';

        if (messageLower.includes('fiebre')) {
            response = 'La fiebre puede tener múltiples causas. Te recomiendo: 1) Hidratación abundante, 2) Reposo, 3) Antipiréticos si supera 38.5°C. Si persiste más de 3 días, consulta con un médico.';
        } else if (messageLower.includes('dolor de cabeza') || messageLower.includes('cefalea')) {
            response = 'Para el dolor de cabeza: 1) Descansa en un lugar oscuro y silencioso, 2) Mantente hidratado, 3) Puedes tomar analgésicos de venta libre. Si es muy intenso o frecuente, consulta con un especialista.';
        } else if (messageLower.includes('tos')) {
            response = 'Para la tos: 1) Mantente bien hidratado, 2) Miel con limón puede aliviar, 3) Evita irritantes como humo. Si hay sangre o dificultad respiratoria, busca atención urgente.';
        } else if (messageLower.includes('dolor de pecho') || messageLower.includes('pecho')) {
            response = '⚠️ El dolor de pecho puede ser serio. Si es intenso, repentino o viene con dificultad para respirar, busca atención médica de emergencia inmediatamente.';
        } else if (messageLower.includes('hola') || messageLower.includes('buenos') || messageLower.includes('qué tal')) {
            response = '¡Hola! Soy EdiCarex AI, tu asistente médico inteligente. ¿En qué puedo ayudarte hoy? Puedes consultarme sobre síntomas, orientación médica general o información sobre citas.';
        } else if (messageLower.includes('como estas') || messageLower.includes('cómo estás')) {
            response = '¡Estoy funcionando correctamente y listo para ayudarte! Soy una inteligencia artificial diseñada para asistirte.';
        } else if (messageLower.includes('ok') || messageLower.includes('gracias') || messageLower.includes('entendido')) {
            response = 'Me alegra poder ayudarte. ¿Tienes alguna otra consulta médica?';
        }

        return {
            response,
            confidence: 0.75,
            suggestions: ['Agendar cita médica', 'Describir más síntomas', 'Ver historial médico']
        };
    }

    private fallbackTriage(data: any): any {
        const symptoms = data.symptoms.toLowerCase();

        let result = {
            priority: 4, // Default: NO URGENTE
            waitTime: 60,
            recommendations: ['Seguimiento ambulatorio', 'Control de síntomas']
        };

        if (symptoms.includes('pecho') || symptoms.includes('toracico') || symptoms.includes('respirar') || symptoms.includes('inconsciente')) {
            result = {
                priority: 1, // CRÍTICO
                waitTime: 0,
                recommendations: [
                    'Monitorear signos vitales cada 15 minutos',
                    'Preparar acceso IV inmediato',
                    'Alertar al equipo de reanimación',
                    'EKG de 12 derivaciones ahora'
                ]
            };
        } else if (symptoms.includes('sangre') || symptoms.includes('fractura') || symptoms.includes('quemadura') || symptoms.includes('fuerte') || symptoms.includes('intenso')) {
            result = {
                priority: 2, // URGENTE
                waitTime: 10,
                recommendations: [
                    'Controlar dolor',
                    'Inmovilización de zona afectada',
                    'Radiografías urgentes',
                    'Limpieza de heridas'
                ]
            };
        } else if (symptoms.includes('fiebre') || symptoms.includes('vomito') || symptoms.includes('dolor') || symptoms.includes('mareo')) {
            result = {
                priority: 3, // SEMI-URGENTE
                waitTime: 30,
                recommendations: [
                    'Hidratación oral o IV',
                    'Control térmico físico/químico',
                    'Observación por 2 horas',
                    'Exámenes de laboratorio básicos'
                ]
            };
        } else if (symptoms.includes('gripa') || symptoms.includes('tos') || symptoms.includes('garganta')) {
            result = {
                priority: 5, // BAJA PRIORIDAD
                waitTime: 120,
                recommendations: [
                    'Tratamiento sintomático',
                    'Reposo en casa',
                    'Control por consulta externa'
                ]
            };
        }

        return result;
    }

    private mapCreativityToTemp(level: string): number {
        switch (level) {
            case 'precise': return 0.2;
            case 'balanced': return 0.7;
            case 'creative': return 1.0;
            default: return 0.7;
        }
    }
}
