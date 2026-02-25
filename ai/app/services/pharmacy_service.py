from app.models.schemas import PharmacyDemandInput, PharmacyDemandOutput
from app.services.groq_service import GroqService
import json
import numpy as np
import logging

logger = logging.getLogger("EdiCarexAI.Pharmacy")

class PharmacyService:
    """
    Servicio de Predicción de Demanda Farmacéutica de EdiCarex.
    Optimiza el stock hospitalario mediante análisis de series temporales con IA.
    """
    def __init__(self):
        self.groq = GroqService()

    async def predict_demand(self, data: PharmacyDemandInput) -> PharmacyDemandOutput:
        """
        Predice la demanda de medicamentos utilizando el motor de EdiCarex.
        """
        system_persona = (
            "Eres el Jefe de Logística y Farmacia de EdiCarex Enterprise. "
            "Experto en gestión de inventarios hospitalarios y previsión de demanda crítica. "
            "Tu objetivo es el desperdicio cero y la disponibilidad total."
        )
        
        # Análisis estadístico local con Numpy (Hybrid Intelligence)
        stats_summary = "Motor estadístico local: Sin datos suficientes para análisis de varianza."
        if data.historical_data:
            try:
                arr = np.array(data.historical_data)
                mean_vol = np.mean(arr)
                volatility = np.std(arr) / mean_vol if mean_vol > 0 else 0
                max_val = np.max(arr)
                stats_summary = f"Volumen promedio: {mean_vol:.2f} uni, Coeficiente de Variación: {volatility:.2f}, Pico Histórico: {max_val} uni."
            except Exception as e:
                logger.warning(f"Error en procesamiento estadístico Numpy: {e}")

        prompt = f"""
        REQUERIMIENTO DE INTELIGENCIA LOGÍSTICA (EdiCarex Pharma System)
        
        IDENTIFICADOR DE MEDICAMENTO: {data.medication_id}
        DATOS DE CONSUMO (Histórico Reciente): {data.historical_data}
        ESTADÍSTICAS CALCULADAS: {stats_summary}
        
        TAREA PARA JEFE DE FARMACIA AI:
        1. Predicción EXACTA: Proyecta el consumo para el próximo ciclo ({data.days_ahead} días).
        2. Análisis de Riesgo: Evalúa si hay riesgo de desabastecimiento (stockout).
        3. Estrategia de Compras: Determina si se requiere una orden de compra urgente.
        
        INDICADORES REQUERIDOS EN LA RECOMENDACIÓN:
        - Punto de Reorden Sugerido.
        - Stock de Seguridad Recomendado.
        - Justificación clínica (ej: si es un medicamento crítico para UCI/Emergencia).
        
        DEBES RESPONDER EXCLUSIVAMENTE EN FORMATO JSON:
        {{
            "predicted_demand": int,
            "confidence": float,
            "recommendation": "Decisión logística senior detallada con pasos a seguir (en español)."
        }}
        """

        try:
            result = await self.groq.execute_prompt(prompt, system_persona, model=data.model, temperature=data.temperature)
            if result:
                return PharmacyDemandOutput(
                    medication_id=data.medication_id,
                    predicted_demand=result.get("predicted_demand", int(np.mean(data.historical_data)) if data.historical_data else 100),
                    confidence=result.get("confidence", 0.85),
                    recommendation=result.get("recommendation", "Análisis completado por EdiCarex AI."),
                    model=result.get("model")
                )
            return self._fallback_pharmacy(data.medication_id)
        except Exception as e:
            logger.error(f"Error en farmacia EdiCarex: {e}")
            return self._fallback_pharmacy(data.medication_id)

    def _fallback_pharmacy(self, med_id: str) -> PharmacyDemandOutput:
        return PharmacyDemandOutput(
            medication_id=med_id,
            predicted_demand=100,
            confidence=0.5,
            recommendation="Modo backup EdiCarex: Se sugiere revisión manual del inventario."
        )
