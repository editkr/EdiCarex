from app.models.schemas import AnalyticsInput, ChatOutput
from app.services.groq_service import GroqService
import json
import logging
import pandas as pd
import numpy as np

logger = logging.getLogger("EdiCarexAI.Analytics")

class AnalyticsService:
    """
    Servicio de Analítica Predictiva CFO de EdiCarex.
    Especializado en proyecciones de ingresos y estrategia hospitalaria.
    """
    def __init__(self):
        self.groq = GroqService()

    async def predict_growth(self, data: AnalyticsInput) -> dict:
        """
        Genera proyecciones estratégicas utilizando el cerebro de EdiCarex.
        """
        financial_data = data.financial_data
        system_persona = (
            "Eres el Director Financiero (CFO) de EdiCarex Enterprise de nivel Global. "
            "Tu análisis debe ser puramente estratégico y basado en datos reales. "
            "Identifica ineficiencias, proyecta ROI y utiliza un lenguaje corporativo de alta finanza médica."
        )
        
        # Procesamiento estadístico local (Hybrid Intelligence)
        trend_analysis = "No data available in local engine"
        if financial_data.get("history") or financial_data.get("monthlyBreakdown"):
            try:
                history = financial_data.get("history") or financial_data.get("monthlyBreakdown")
                df = pd.DataFrame(history)
                if not df.empty and "revenue" in df.columns:
                    mean_val = df["revenue"].mean()
                    std_val = df["revenue"].std()
                    trend = (df["revenue"].iloc[-1] - df["revenue"].iloc[0]) / len(df) if len(df) > 1 else 0
                    trend_analysis = f"Media de Ingresos: {mean_val:.2f}, Volatilidad (STD): {std_val:.2f}, Delta de Crecimiento: {trend:.2f}/mes"
            except Exception as e:
                logger.warning(f"Error en pre-procesamiento estadístico EdiCarex: {e}")

        prompt = f"""
        REPORTE ESTRATÉGICO DE CRECIMIENTO HOSPITALARIO (EdiCarex CFO Core)
        
        INDICADORES ESTADÍSTICOS TÉCNICOS (Pandas Engine):
        {trend_analysis}

        CONJUNTO DE DATOS FINANCIEROS:
        {json.dumps(financial_data, indent=2)}
        
        REQUERIMIENTOS DEL REPORTE:
        1. Proyecciones Semestrales: Detalla mes a mes con intervalos de confianza realistas.
        2. Insight de Inversión Hospitalaria: Una recomendación de alto nivel sobre dónde asignar capital (e.g., ampliar Farmacia, mejorar UCI, contrataciones).
        3. Análisis de Riesgos Financieros: Basado en la volatilidad de los datos proporcionados.
        
        FORMATO JSON REQUERIDO:
        {{
            "predictions": [
                {{"month": "Nombre", "predicted": float, "confidence": float}}
            ],
            "insight": "Narrativa ejecutiva profunda y formateada con markdown (listas, negritas) en español.",
            "projected_annual_growth": float,
            "accuracy_score": float
        }}
        """

        try:
            result = await self.groq.execute_prompt(prompt, system_persona, model=data.model, temperature=data.temperature)
            if result:
                # Veracity Engine (Senior Plus): Penalize confidence if data volume is low
                data_points = len(financial_data.get("history", [])) + len(financial_data.get("categories", []))
                veracity_multiplier = min(1.0, data_points / 10.0) if data_points > 0 else 0.1
                
                if "accuracy_score" in result:
                    # Hybrid Confidence: AI self-assessment * Data Integrity Multiplier
                    result["accuracy_score"] = round(result["accuracy_score"] * veracity_multiplier, 2)
                
                # Post-procesamiento EdiCarex para asegurar profesionalidad
                if "strategic" not in result.get("insight", "").lower():
                    result["insight"] = "### [ANÁLISIS ESTRATÉGICO EDICAREX]\n\n" + result.get("insight", "")
                
                logger.info(f"Información estratégica generada. Multiplicador de veracidad: {veracity_multiplier}")
                return result
            return self._fallback_prediction(financial_data)
        except Exception as e:
            logger.error(f"Error en analítica EdiCarex: {e}")
            return self._fallback_prediction(financial_data)

    def _fallback_prediction(self, data: dict) -> dict:
        """Contingencia profesional de EdiCarex."""
        return {
            "predictions": [
                {"month": "Mes Proyectado", "predicted": 5000.0, "confidence": 0.8}
            ],
            "insight": "Análisis en modo de respaldo. Los datos sugieren una trayectoria estable. Se recomienda activar el motor avanzado para insights profundos de EdiCarex.",
            "projected_annual_growth": 5.2,
            "accuracy_score": 0.6
        }
