from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.schemas.farm import FarmCreate, FarmUpdate, FarmOut
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("", response_model=FarmOut, status_code=status.HTTP_201_CREATED)
def create_farm(
    payload: FarmCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    নতুন farm তৈরি করবে বর্তমান logged-in user এর জন্য।
    JWT Authentication required.
    """
    farm = Farm(
        user_id=current_user.id,
        farm_name=payload.farm_name.strip(),
        district=payload.district.strip(),
        latitude=round(payload.latitude, 4),
        longitude=round(payload.longitude, 4),
        area=payload.area,
        area_unit=payload.area_unit.strip() if payload.area_unit else "bigha",
        soil_type=payload.soil_type.strip() if payload.soil_type else None,
        current_crop=payload.current_crop.strip() if payload.current_crop else None,
        planting_date=payload.planting_date,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("", response_model=List[FarmOut])
def list_my_farms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    বর্তমান logged-in user এর সব সংরক্ষিত farm list ফেরত দেয়।
    JWT Authentication required.
    """
    farms = (
        db.query(Farm)
        .filter(Farm.user_id == current_user.id)
        .order_by(Farm.created_at.desc())
        .all()
    )
    return farms


@router.get("/{farm_id}", response_model=FarmOut)
def get_farm(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    নির্দিষ্ট farm এর বিস্তারিত তথ্য ফেরত দেয় (শুধুমাত্র মালিকের জন্য)।
    JWT Authentication required.
    """
    farm = (
        db.query(Farm)
        .filter(Farm.id == farm_id, Farm.user_id == current_user.id)
        .first()
    )
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {farm_id} not found or unauthorized.",
        )
    return farm


@router.put("/{farm_id}", response_model=FarmOut)
def update_farm(
    farm_id: int,
    payload: FarmUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Farm তথ্য update করবে (শুধুমাত্র মালিকের জন্য)।
    JWT Authentication required.
    """
    farm = (
        db.query(Farm)
        .filter(Farm.id == farm_id, Farm.user_id == current_user.id)
        .first()
    )
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {farm_id} not found or unauthorized.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            if field in ("latitude", "longitude"):
                setattr(farm, field, round(value, 4))
            elif isinstance(value, str):
                setattr(farm, field, value.strip())
            else:
                setattr(farm, field, value)

    farm.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(farm)
    return farm


@router.delete("/{farm_id}")
def delete_farm(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Farm মুছে ফেলবে (শুধুমাত্র মালিকের জন্য)।
    JWT Authentication required.
    """
    farm = (
        db.query(Farm)
        .filter(Farm.id == farm_id, Farm.user_id == current_user.id)
        .first()
    )
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {farm_id} not found or unauthorized.",
        )

    db.delete(farm)
    db.commit()
    return {"detail": "Farm deleted successfully", "id": farm_id}
