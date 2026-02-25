from fastapi import APIRouter, HTTPException
from app.models.schemas import TextGeneratorInput, TextGeneratorOutput
from app.services.generator_service import GeneratorService

router = APIRouter()
generator_service = GeneratorService()


@router.post("/text", response_model=TextGeneratorOutput)
async def generate_text(data: TextGeneratorInput):
    """
    Generar documentos de texto médicos (recetas, referencias, resúmenes de alta).
    
    Retorna:
        - generated_text: Documento médico generado
        - template_type: Tipo de documento generado
    """
    try:
        result = await generator_service.generate(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo en la generación de texto: {str(e)}")
