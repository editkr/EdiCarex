from app.models.schemas import SummarizationInput, SummarizationOutput
from app.services.groq_service import GroqService
import re
import asyncio
import logging

logger = logging.getLogger("EdiCarexAI.Summarization")


class SummarizationService:
    """
    Clinical text summarization service using Groq.
    """

    def __init__(self):
        self.groq = GroqService()

    async def summarize(self, data: SummarizationInput) -> SummarizationOutput:
        """
        Genera un resumen clínico estructurado (SOAP Lite) utilizando el motor EdiCarex.
        """
        text = data.text
        max_length = data.max_length

        system_persona = (
            "Eres un Especialista en Documentación Médica de EdiCarex. "
            "Tu tarea es destilar notas clínicas densas en resúmenes profesionales, "
            "priorizando diagnósticos, planes de tratamiento y medicamentos."
        )

        prompt = f"""
        SINTETIZA LA SIGUIENTE NOTA CLÍNICA (Protocolo EdiCarex):
        "{text}"
        
        REQUISITOS ESTRÍCTOS:
        1. Estructura: S: Subjetivo, O: Objetivo, A: Análisis, P: Plan.
        2. Tono: Académico-Clínico.
        3. Longitud máxima: {max_length} caracteres.
        
        FORMATO JSON REQUERIDO:
        {{
            "summary": "Texto del resumen estructurado con markdown",
            "clinical_entities": ["entidad 1", "entidad 2"]
        }}
        """

        try:
            result = await self.groq.execute_prompt(prompt, system_persona, model=data.model, temperature=data.temperature)
            if result:
                summary = result.get("summary", "Error en síntesis clínica.")
            else:
                summary = "### [RESUMEN DE EMERGENCIA]\n" + text[:max_length-30] + "..."
        except Exception as e:
            logger.error(f"Error en resumen EdiCarex: {e}")
            summary = "### [ERROR DE SISTEMA]\nNo se pudo procesar la nota clínica."

        return SummarizationOutput(
            summary=summary,
            original_length=len(text),
            summary_length=len(summary),
            model=result.get("model") if result else None
        )
