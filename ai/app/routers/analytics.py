from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyticsInput
from app.services.analytics_service import AnalyticsService

router = APIRouter()
analytics_service = AnalyticsService()

@router.post("/predict/growth")
async def predict_growth(data: AnalyticsInput):
    """
    Predice el crecimiento futuro y las tendencias basándose en datos financieros reales.
    """
    try:
        result = await analytics_service.predict_growth(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo en la predicción analítica: {str(e)}")
