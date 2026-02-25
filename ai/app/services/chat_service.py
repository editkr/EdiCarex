from app.models.schemas import ChatInput, ChatOutput
from typing import List, Dict
import re
from app.services.groq_service import GroqService

class ChatService:
    """
    Asistente Médico Virtual de EdiCarex.
    Provee respuestas inteligentes y orientación médica bajo la identidad EdiCarex.
    """

    def __init__(self):
        self.groq_service = GroqService()
        
        # PERSONA PROFESIONAL PARA PERSONAL MÉDICO (STAFF)
        self.staff_persona = (
            "Identidad: Consultor Clínico Senior y Arquitecto Hospitalatario EdiCarex.\n"
            "Rol: Soporte de Élite para Personal Médico y Administrativo de Alta Gerencia.\n"
            "Tono: Técnico-Científico, Analítico, Resolutivo y de 'Experto a Experto'.\n\n"
            "GUÍA DE NAVEGACIÓN PROFESIONAL:\n"
            "- Gestión Clínica: Dashboard (KPIS), Pacientes (Historias), Doctores (Staff), Sala de Espera (Flujo) y Camas (Ocupación).\n"
            "- Servicios Médicos: Emergencia (Triage), Farmacia (Inventario) y Laboratorio (Órdenes).\n"
            "- Administración: Facturación (Revenue), Reportes (BI), Analítica (Predicciones) y Auditoría (Logs).\n\n"
            "DIRECTRICES DE ÉLITE:\n"
            "1. Provee análisis técnicos basados en protocolos internacionales (Manchester, SOAP, SNOMED-CT).\n"
            "2. Habla en términos de eficiencia operativa, saturación del servicio y seguridad del paciente.\n"
            "3. Redacta documentos con terminología médica de precisión quirúrgica.\n"
            "4. Sé proactivo: Si se menciona una emergencia, sugiere activar protocolos de Triage inmediato.\n"
            "5. NO uses muletillas; eres una autoridad técnica en la infraestructura EdiCarex."
        )

        # PERSONA PROFESIONAL PARA PACIENTES (PORTAL)
        self.patient_persona = (
            "Identidad: Asistente Virtual Concierge de EdiCarex Hospital.\n"
            "Rol: Guía Personal de Salud y Soporte de Calidez para el Paciente.\n"
            "Tono: Empático, Protector, Elegante, Claro y Siempre Optimista.\n\n"
            "MISIONES CRÍTICAS:\n"
            "1. Dashboard: 'Tu salud en un vistazo'.\n"
            "2. Mis Citas: 'Agendamos tu bienestar'.\n"
            "3. Historial Médico: 'Tu camino recorrido con nosotros'.\n"
            "4. Resultados Lab: 'La precisión de tu diagnóstico'.\n"
            "5. Facturación: 'Transparencia en tus servicios'.\n\n"
            "REGLAS DE ORO:\n"
            "1. NUNCA diagnostiques condiciones críticas; calma al paciente y guíalo a 'Mis Citas'.\n"
            "2. Usa un lenguaje que transmita seguridad y cuidado institucional.\n"
            "3. Eres la voz humana y amable detrás de la tecnología EdiCarex."
        )

        # PERSONA PROFESIONAL PARA RECURSOS HUMANOS (HR/ATTENDANCE)
        self.hr_persona = (
            "Identidad: Analista Senior de Capital Humano y Estratégica EdiCarex.\n"
            "Rol: Soporte Ejecutivo para Gestión de Personal, Asistencia y Nómina.\n"
            "Tono: Formal, Estructurado, Normativo y Altamente Eficiente.\n\n"
            "DOMINIO DE RRHH:\n"
            "1. Asistencia: Marcaciones, horas extras, retardos y ausentismo.\n"
            "2. Turnos: Optimización de roles hospitalarios y rotación de personal.\n"
            "3. Nómina: Estructuras salariales, bonificaciones y liquidaciones.\n"
            "4. Cumplimiento: Normativa hospitalaria y auditoría de asistencia.\n\n"
            "DIRECTRICES EJECUTIVAS:\n"
            "1. Prioriza la productividad y el cumplimiento de los estándares hospitalarios.\n"
            "2. Provee datos exactos y referencia a módulos de 'Auditoría' o 'Configuración' si es necesario.\n"
            "3. Mantén una comunicación directa, libre de ambigüedades, enfocada en resultados."
        )

    async def chat(self, data: ChatInput) -> ChatOutput:
        message = data.message.lower().strip()
        
        # 1. FILTRO DE SEGURIDAD (Protocolo de Emergencia)
        if any(word in message for word in ["emergencia", "urgente", "suicidio", "morir", "infarto", "sangrado severo"]):
            return ChatOutput(
                response=(
                    "### 🚨 PROTOCOLO DE RESPUESTA INMEDIATA EDICAREX\n\n"
                    "**PRECAUCIÓN SEVERA:** Hemos detectado una posible emergencia de salud.\n\n"
                    "1. Si usted está solo, **llame al 911 ahora mismo** o a su servicio de urgencias local.\n"
                    "2. No intente esperar una respuesta de esta IA; su vida es prioridad.\n"
                    "3. Diríjase a la sala de emergencias de EdiCarex más cercana de inmediato.\n\n"
                    "*Este asistente IA es de carácter informativo y no sustituye la intervención médica de urgencia.*"
                ),
                confidence=1.0,
                source="security_filter",
                model="EdiCarex Guardian Core"
            )

        # 2. SELECCIÓN DE CONTEXTO Y PERSONA
        context_lower = (data.context or "").lower()
        if "patient" in context_lower or "portal" in context_lower:
            active_persona = self.patient_persona
            current_mode = "patient"
        elif "hr" in context_lower or "attendance" in context_lower:
            active_persona = self.hr_persona
            current_mode = "hr"
        else:
            active_persona = self.staff_persona
            current_mode = "staff"

        # 3. EJECUCIÓN CON MOTOR GROQ (LPU llama-3.3-70b)
        full_system_context = f"{active_persona}\n\nMETADATOS DE SESIÓN: {data.context}"
        
        groq_response = await self.groq_service.generate_response(
            data.message, 
            system_persona=full_system_context, 
            model=data.model, 
            temperature=data.temperature if data.temperature else (0.4 if current_mode != "patient" else 0.7)
        )
        
        if groq_response and "Local Fallback" not in groq_response.model:
            return groq_response
        
        # 4. FALLBACK DINÁMICO (Modo Local EdiCarex)
        return self._get_professional_local_response(message, current_mode)

    def _get_professional_local_response(self, message: str, mode: str) -> ChatOutput:
        msg = message.lower()
        
        if mode == "patient":
            response = (
                "Estimado Usuario EdiCarex: Actualmente opero en **Modo de Soporte Local**.\n\n"
                "Puedo asistirte navegando por las funciones críticas del portal:\n\n"
            )
            if "cita" in msg or "médico" in msg:
                response += "📅 **Mis Citas**: Para agendar con especialistas o gestionar tus turnos vigentes."
            elif "resultado" in msg or "analisis" in msg or "laboratorio" in msg:
                response += "🧪 **Resultados Lab**: Aquí podrás descargar tus informes de laboratorio validados."
            elif "historial" in msg or "receta" in msg:
                response += "📋 **Historial Médico**: Consulta tus diagnósticos pasados y recetas extendidas por nuestros médicos."
            elif "pagar" in msg or "factura" in msg:
                response += "💳 **Facturación**: Accede a tus recibos y realiza pagos electrónicos de forma segura."
            else:
                response += "Por favor, utiliza las secciones de Citas, Historial, Resultados o Facturación para navegar."
            
            return ChatOutput(response=response, model="EdiCarex Portal AI (Local)", source="edicarex-ai")
            
        elif mode == "hr":
            response = (
                "### 💼 Soporte Local RRHH EdiCarex\n\n"
                "El motor de análisis estratégico de personal está cargando. Mientras tanto, puedes acceder a:\n\n"
            )
            if "turno" in msg or "horario" in msg:
                response += "🕒 **Turnos**: Gestión de roles y horarios operativos."
            elif "nomina" in msg or "pago" in msg or "sueldo" in msg:
                response += "💰 **Nómina**: Liquidación de haberes y finanzas laborales."
            elif "asis" in msg or "marca" in msg:
                response += "✅ **Marcaciones**: Registro y auditoría de asistencia en tiempo real."
            elif "personal" in msg or "empleado" in msg:
                response += "👥 **Personal**: Directorio y gestión de capital humano."
            else:
                response += "Utilice las pestañas de Dashboard, Marcaciones, Turnos, Personal o Nómina según su necesidad."
                
            return ChatOutput(response=response, model="EdiCarex HR Engine (Local)", source="edicarex-ai")
            
        else:
            response = (
                "### 🛠️ Soporte Clínico Local EdiCarex\n\n"
                "El motor de inferencia masiva está en mantenimiento breve. Puedo guiarlo a las secciones principales:\n\n"
            )
            if "paciente" in msg:
                response += "👥 **Pacientes**: Gestión de historias clínicas y registro."
            elif "cita" in msg:
                response += "📅 **Citas**: Control de agenda médica centralizada."
            elif "emerge" in msg:
                response += "🚨 **Emergencia**: Protocolos de triaje y atención inmediata."
            elif "farma" in msg:
                response += "💊 **Farmacia**: Control de stock y recetas dispensadas."
            elif "lab" in msg:
                response += "🧪 **Laboratorio**: Gestión de órdenes y resultados clínicos."
            elif "cama" in msg or "hospi" in msg:
                response += "🛏️ **Camas**: Monitoreo de ocupación hospitalaria."
            else:
                response += "Puede navegar a través de las secciones de Gestión Clínica, Servicios Médicos o Administración en el menú lateral."

            return ChatOutput(response=response, model="EdiCarex Staff Engine (Local)", source="edicarex-ai")
