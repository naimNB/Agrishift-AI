from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import date
from typing import Optional

from app.services.nasa_service import fetch_nasa_power_data, get_summary_stats, DISTRICT_COORDS
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/districts")
def list_districts():
    """Available North Bengal districts এর list।"""
    return {
        "districts": [d for d in DISTRICT_COORDS.keys() if d != "default"],
        "note": "Use district name in /climate endpoint",
    }


@router.get("/climate")
async def get_climate_data(
    district: str = Query(default="rangpur", description="North Bengal district name"),
    start:    Optional[date] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end:      Optional[date] = Query(default=None, description="End date (YYYY-MM-DD)"),
    # current_user: User = Depends(get_current_user),  # auth চাইলে uncomment করো
):
    """
    NASA POWER API থেকে নির্দিষ্ট district এর climate data নিয়ে আসে।
    
    উদাহরণ: GET /api/nasa/climate?district=rangpur&start=2024-01-01&end=2024-03-31
    """
    if district.lower() not in DISTRICT_COORDS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown district. Available: {list(DISTRICT_COORDS.keys())}",
        )
    try:
        result = await fetch_nasa_power_data(district=district, start=start, end=end)
        result["summary"] = get_summary_stats(result["data"])
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA API error: {str(e)}")


@router.get("/climate/summary")
async def get_climate_summary(
    district: str = Query(default="rangpur"),
    start:    Optional[date] = Query(default=None),
    end:      Optional[date] = Query(default=None),
):
    """Daily data ছাড়া শুধু summary statistics।"""
    try:
        result = await fetch_nasa_power_data(district=district, start=start, end=end)
        return {
            "district":  district,
            "start_date": result["start_date"],
            "end_date":   result["end_date"],
            "summary":   get_summary_stats(result["data"]),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA API error: {str(e)}")
