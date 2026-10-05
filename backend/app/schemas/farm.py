from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class FarmBase(BaseModel):
    farm_name: str = Field(..., min_length=2, max_length=100, description="Name or identifier of the farm")
    district: str = Field(..., min_length=2, max_length=50, description="District location (e.g. Bogura, Rangpur, Dinajpur, Rajshahi, Sylhet)")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    area: Optional[float] = Field(None, ge=0.0, description="Farm area size")
    area_unit: Optional[str] = Field("bigha", max_length=20, description="Unit of measurement (bigha, acre, decimal, hectare)")
    soil_type: Optional[str] = Field(None, max_length=50, description="Soil texture or classification")
    current_crop: Optional[str] = Field(None, max_length=50, description="Current standing or planned crop")
    planting_date: Optional[date] = Field(None, description="Planting / sowing date (YYYY-MM-DD)")


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = Field(None, min_length=2, max_length=100)
    district: Optional[str] = Field(None, min_length=2, max_length=50)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    area: Optional[float] = Field(None, ge=0.0)
    area_unit: Optional[str] = Field(None, max_length=20)
    soil_type: Optional[str] = Field(None, max_length=50)
    current_crop: Optional[str] = Field(None, max_length=50)
    planting_date: Optional[date] = None


class FarmOut(FarmBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
