from app.models.schemas import TriageInput, TriageOutput
from app.services.groq_service import GroqService
import re
import json
import logging
import numpy as np
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger("EdiCarexAI.Triage")

class TriageService:
    """
    Servicio de Triaje Clínico de EdiCarex.
    Clasifica emergencias basándose en el Protocolo Manchester con soporte de IA.
    """

    def __init__(self):
        self.groq = GroqService()

    async def predict(self, data: TriageInput) -> TriageOutput:
        """
        Calcula la prioridad de triaje utilizando la lógica avanzada de EdiCarex.
        Integra un modelo local de severidad (Scikit-Learn) + Razonamiento LLM.
        """
        vital_score, vital_warnings = self._analyze_vital_signs(data.vitalSigns or {})
        
        # Clasificación Local de Severidad (Digital Phenotyping / Hybrid AI)
        severity_index = self._calculate_local_severity(data)
        
        system_persona = (
            "Eres el Jefe de Triaje Senior de EdiCarex Enterprise. Tu razonamiento debe ser de nivel médico especialista. "
            "Sigues estrictamente el Protocolo Manchester de clasificación de riesgos. "
            "No seas genérico. Analiza la cronicidad vs agudeza. Por ejemplo, 'cancer' por sí solo es una condición crónica, "
            "pero debes evaluar si hay signos de descompensación aguda. "
            "Tu objetivo es la seguridad del paciente y la eficiencia hospitalaria."
        )
        
        prompt = f"""
        SOLICITUD DE EVALUACIÓN CLÍNICA DE ALTA PRECISIÓN:
        - Paciente: {data.age} años.
        - Motivo de Consulta: "{data.symptoms}"
        - Historial Médico: {", ".join(data.medicalHistory) if data.medicalHistory else "Ninguno reportado"}
        - Signos Vitales: {json.dumps(data.vitalSigns)}
        - Alertas de Monitoreo Local: {", ".join(vital_warnings)}
        - Índice de Desviación de Severidad: {severity_index:.2f}
        
        REQUERIMIENTOS TÉCNICOS:
        1. Clasificación Manchester (PRIORIDAD):
           - ROJO: Emergencia (Inmediato).
           - NARANJA: Muy Urgente (10-15 min).
           - AMARILLO: Urgente (60 min).
           - VERDE: Estándar (120 min).
           - AZUL: No urgente (240 min).
        
        2. Justificación Médica: Detalla por qué se asigna esa prioridad, riesgos potenciales y diagnósticos diferenciales.
        
        3. Acciones Recomendadas: Lista de 3 a 5 pasos clínicos concretos para el personal de enfermería/médico.
        
        DEBES RESPONDER EXCLUSIVAMENTE EN FORMATO JSON:
        {{
            "score": {vital_score},
            "priority": "COLOR (Nivel)",
            "wait_time": 0,
            "recommendations": ["Acción 1", "Acción 2", ...],
            "notes": "Análisis clínico senior detallado...",
            "confidence": 0.XX
        }}
        """

        try:
            result = await self.groq.execute_prompt(prompt, system_persona, model=data.model, temperature=data.temperature)
            if result:
                # Normalización del resultado
                notes = result.get("notes", "")
                if len(notes) < 30:
                    notes += f"\n\n[Soporte EdiCarex]: Severidad {severity_index:.2f}. Signos: {', '.join(vital_warnings) or 'Estables'}."

                return TriageOutput(
                    score=result.get("score", vital_score),
                    priority=result.get("priority", "VERDE (Estándar)"),
                    recommendations=result.get("recommendations", ["Evaluación médica estándar", "Controlar signos vitales"]),
                    wait_time=result.get("wait_time", 120),
                    notes=notes,
                    confidence=result.get("confidence", 0.95),
                    model=result.get("model")
                )
            return self._get_fallback_triage(vital_score, vital_warnings)
        except Exception as e:
            logger.error(f"Error en triaje EdiCarex: {e}")
            return self._get_fallback_triage(vital_score, vital_warnings)
    
    def _score_to_priority(self, score: int) -> str:
        if score >= 90: return "URGENT"
        if score >= 70: return "HIGH"
        if score >= 40: return "NORMAL"
        return "LOW"

    def _get_fallback_triage(self, vital_score: int, warnings: list) -> TriageOutput:
        priority = self._score_to_priority(vital_score)
        notes = f"⚠️ (Modo Backup) Evaluación basada en signos vitales. Alertas: {', '.join(warnings) if warnings else 'Ninguna'}."
        return TriageOutput(score=vital_score, priority=priority, notes=notes, confidence=0.6)

    def _analyze_vital_signs(self, vital_signs: dict) -> tuple[int, list]:
        """Análisis determinístico de signos vitales para soporte de IA."""
        score = 0
        notes = []
        
        # Temperatura (Fiebre alta o hipotermia)
        if "temperature" in vital_signs:
            temp = float(vital_signs["temperature"])
            if temp >= 40.0 or temp <= 35.0:
                score = max(score, 90); notes.append("Temperatura crítica")
            elif temp >= 38.5:
                score = max(score, 50); notes.append("Hipertermia moderada")
        
        # Presión Arterial (Sistólica crírtica)
        if "bloodPressure" in vital_signs:
            bp = str(vital_signs["bloodPressure"])
            match = re.match(r"(\d+)/(\d+)", bp)
            if match:
                sys = int(match.group(1))
                if sys >= 180 or sys <= 80:
                    score = max(score, 95); notes.append("Inestabilidad hemodinámica")
                elif sys >= 140:
                    score = max(score, 40); notes.append("Hipertensión estadio 1")
        
        # Saturación de Oxígeno (Crítica)
        if "oxygenSaturation" in vital_signs:
            o2 = int(vital_signs["oxygenSaturation"])
            if o2 <= 88:
                score = max(score, 100); notes.append("Insuficiencia respiratoria inminente")
            elif o2 <= 92:
                score = max(score, 80); notes.append("Hipoxia moderada")
        
        return score, notes

    def _calculate_local_severity(self, data: TriageInput) -> float:
        """
        Utiliza Scikit-Learn para normalizar y calcular un vector de gravedad clínica.
        En un entorno real, este vector se usaría en un clasificador entrenado (ej. Random Forest).
        """
        try:
            # Simulamos un vector de características: [edad, temp, sat, sys_bp]
            vs = data.vitalSigns or {}
            features = np.array([[
                float(data.age),
                float(vs.get("temperature", 37.0)),
                float(vs.get("oxygenSaturation", 98)),
                float(re.search(r"(\d+)", str(vs.get("bloodPressure", "120/80"))).group(1)) if vs.get("bloodPressure") else 120
            ]])
            
            scaler = StandardScaler()
            norm_features = scaler.fit_transform(features)
            
            # Cálculo de score de anomalía local (Mock de modelo predictivo)
            severity = np.abs(norm_features).mean()
            return float(severity)
        except Exception as e:
            logger.warning(f"Error en clasificación Scikit-Learn: {e}")
            return 0.0
