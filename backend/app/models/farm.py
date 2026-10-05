from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_name    = Column(String(100), nullable=False)
    district     = Column(String(50), nullable=False)
    latitude     = Column(Float, nullable=False)
    longitude    = Column(Float, nullable=False)
    area         = Column(Float, nullable=True)
    area_unit    = Column(String(20), default="bigha", nullable=True)
    soil_type    = Column(String(50), nullable=True)
    current_crop = Column(String(50), nullable=True)
    planting_date = Column(Date, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="farms")
