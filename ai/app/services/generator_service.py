import json
import logging
from app.models.schemas import TextGeneratorInput, TextGeneratorOutput
from datetime import datetime

logger = logging.getLogger("EdiCarexAI.Generator")


class GeneratorService:
    """
    Servicio de Generación de Documentación Clínica de EdiCarex.
    Crea documentos médicos de alta fidelidad con la identidad corporativa.
    """

    def __init__(self):
        # Se remueven plantillas estáticas para priorizar generación dinámica con Groq
        pass

    async def generate(self, data: TextGeneratorInput) -> TextGeneratorOutput:
        """Genera documentación profesional de EdiCarex utilizando IA."""
        system_persona = (
            "Eres un Asistente Administrativo Médico de EdiCarex. "
            "Tu especialidad es redactar documentos clínicos impecables, profesionales y claros. "
            "Sigues los estándares internacionales de documentación hospitalaria."
        )

        prompt = f"""
        GENERA UN DOCUMENTO MÉDICO PROFESIONAL:
        - Tipo: {data.template_type}
        - Datos del Paciente: {json.dumps(data.patient_data)}
        - Notas del Médico: {data.additional_notes}
        
        REQUISITOS:
        1. Encabezado institucional de 'Centro Médico EdiCarex'.
        2. Estructura clara y profesional.
        3. Vocabulario técnico médico apropiado.
        4. No inventes diagnósticos, básate en las 'Notas del Médico'.
        
        FORMATO JSON REQUERIDO:
        {{
            "generated_text": "El contenido completo del documento en formato Markdown profesional"
        }}
        """

        try:
            from app.services.groq_service import GroqService
            groq = GroqService()
            result = await groq.execute_prompt(prompt, system_persona, model=data.model, temperature=data.temperature)
            
            if result and isinstance(result, dict):
                # Si el modelo devuelve un JSON con una llave específica
                generated_text = result.get("generated_text") or result.get("response") or result.get("content") or str(result)
            else:
                # Fallback a plantilla si falla la IA
                generated_text = self._fallback_generate(data)
                
            return TextGeneratorOutput(
                generated_text=generated_text,
                template_type=data.template_type,
                model=result.get("model") if result else None
            )
        except Exception as e:
            logger.error(f"Error en generación de texto: {e}")
            return TextGeneratorOutput(
                generated_text=self._fallback_generate(data),
                template_type=data.template_type
            )

    def _fallback_generate(self, data: TextGeneratorInput) -> str:
        """Generación determinística de respaldo."""
        patient_name = data.patient_data.get("name", "N/A")
        date_str = datetime.now().strftime("%d/%m/%Y")
        
        return f"""
=========================================
      {data.template_type.upper()} - EDICAREX (MODO BACKUP)
=========================================
Fecha: {date_str}
Paciente: {patient_name}

{data.additional_notes}

Sistema EdiCarex AI - Verificación manual requerida.
"""
