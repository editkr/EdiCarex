from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routers import triage, summarization, pharmacy, generator, chat, analytics
from dotenv import load_dotenv
import os
import logging

# Configuración de Logging Profesional
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EdiCarexAI")

load_dotenv()

app = FastAPI(
    title="EdiCarex AI Enterprise",
    description="Servicios de Inteligencia Artificial de nivel Senior para la plataforma EdiCarex. Todos los servicios están optimizados para el área clínica y financiera.",
    version="2.5.0",
)

# Middleware de Manejo de Errores Global (Estilo Senior)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no controlado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Error Interno del Servidor",
            "message": "Ha ocurrido un error inesperado en el servicio de IA. Por favor, contacte con soporte técnico.",
            "details": str(exc) if os.getenv("NODE_ENV") == "development" else None
        }
    )

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de Routers
app.include_router(triage.router, prefix="/predict", tags=["Triage Médico"])
app.include_router(summarization.router, prefix="", tags=["Resúmenes Clínicos"])
app.include_router(pharmacy.router, prefix="/pharmacy", tags=["Gestión de Farmacia"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analítica Financiera"])
app.include_router(chat.router, prefix="/ai", tags=["Asistente Virtual"])
app.include_router(generator.router, prefix="/text/generator", tags=["Generación de Documentos"])


@app.get("/health", tags=["Sistema"])
async def health_check():
    from app.services.groq_service import GroqService
    groq = GroqService()
    connectivity = await groq.verify_connectivity()
    security = groq.get_security_status()
    
    return {
        "status": "online" if connectivity else "degraded",
        "service": "EdiCarex AI Enterprise",
        "engines": {
            "core": "Llama 3.3, 3.1 & Mixtral (Groq LPU)",
            "statistical": "Pandas & Numpy",
            "clinical": "Scikit-Learn Severity Cluster",
            "security": security
        },
        "connectivity": "verified" if connectivity else "failure",
        "version": "2.5.0"
    }


@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "EdiCarex AI Service Professional is running",
        "docs": "/docs",
        "language": "es-PE"
    }
