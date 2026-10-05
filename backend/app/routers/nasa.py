from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import date
from typing import Optional

from app.services.nasa_service import (
    fetch_nasa_power_data,
    get_summary_stats,
    DISTRICT_COORDS,
    REGIONAL_DISTRICTS,
)
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()

PRIMARY_DISTRICTS = ["bogura", "rangpur", "dinajpur", "rajshahi", "sylhet"]


@router.get("/districts")
def list_districts():
    """Available Bangladesh agricultural monitoring districts."""
    return {
        "districts": PRIMARY_DISTRICTS,
        "regions": REGIONAL_DISTRICTS,
        "default": "bogura",
        "note": "Use district name in /climate endpoint. Both 'bogura' and 'bogra' are supported.",
    }


@router.get("/climate")
async def get_climate_data(
    district: Optional[str] = Query(default=None, description="District name (e.g. bogura, rangpur, dinajpur, rajshahi, sylhet)"),
    lat:      Optional[float] = Query(default=None, alias="latitude", description="Latitude coordinate (-90 to 90)"),
    lon:      Optional[float] = Query(default=None, alias="longitude", description="Longitude coordinate (-180 to 180)"),
    start:    Optional[date] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end:      Optional[date] = Query(default=None, description="End date (YYYY-MM-DD)"),
    # current_user: User = Depends(get_current_user),  # auth চাইলে uncomment করো
):
    """
    NASA POWER API থেকে নির্দিষ্ট district অথবা coordinates (lat, lon) এর climate data নিয়ে আসে।
    
    উদাহরণ (District): GET /api/nasa/climate?district=bogura&start=2024-01-01&end=2024-03-31
    উদাহরণ (Coordinates): GET /api/nasa/climate?latitude=24.8465&longitude=89.3773
    """
    if (lat is None) != (lon is None):
        raise HTTPException(
            status_code=400,
            detail="Both latitude and longitude must be provided together.",
        )
    if lat is not None and lon is not None:
        if not (-90.0 <= lat <= 90.0):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid latitude: {lat}. Range must be between -90.0 and 90.0.",
            )
        if not (-180.0 <= lon <= 180.0):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid longitude: {lon}. Range must be between -180.0 and 180.0.",
            )
    else:
        if not district:
            district = "bogura"
        norm_district = district.lower().strip()
        if norm_district not in DISTRICT_COORDS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown district '{district}'. Available: {PRIMARY_DISTRICTS}",
            )

    try:
        result = await fetch_nasa_power_data(district=district, lat=lat, lon=lon, start=start, end=end)
        result["summary"] = get_summary_stats(result["data"])
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA API error: {str(e)}")


@router.get("/climate/summary")
async def get_climate_summary(
    district: Optional[str] = Query(default=None),
    lat:      Optional[float] = Query(default=None, alias="latitude"),
    lon:      Optional[float] = Query(default=None, alias="longitude"),
    start:    Optional[date] = Query(default=None),
    end:      Optional[date] = Query(default=None),
):
    """Daily data ছাড়া শুধু summary statistics (district অথবা coordinates)।"""
    if (lat is None) != (lon is None):
        raise HTTPException(
            status_code=400,
            detail="Both latitude and longitude must be provided together.",
        )
    if lat is not None and lon is not None:
        if not (-90.0 <= lat <= 90.0):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid latitude: {lat}. Range must be between -90.0 and 90.0.",
            )
        if not (-180.0 <= lon <= 180.0):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid longitude: {lon}. Range must be between -180.0 and 180.0.",
            )
    else:
        if not district:
            district = "bogura"
        norm_district = district.lower().strip()
        if norm_district not in DISTRICT_COORDS:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown district '{district}'. Available: {PRIMARY_DISTRICTS}",
            )

    try:
        result = await fetch_nasa_power_data(district=district, lat=lat, lon=lon, start=start, end=end)
        return {
            "district":         result.get("district", district),
            "display_name":     result.get("display_name"),
            "latitude":         result.get("latitude"),
            "longitude":        result.get("longitude"),
            "is_custom_coords": result.get("is_custom_coords", False),
            "nearest_district": result.get("nearest_district"),
            "start_date":       result["start_date"],
            "end_date":         result["end_date"],
            "summary":          get_summary_stats(result["data"]),
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA API error: {str(e)}")
