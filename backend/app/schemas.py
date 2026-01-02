from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models import VehicleType, TripStatus, UserRole


# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: int
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# Vehicle Schemas
class VehicleBase(BaseModel):
    plate: str
    vehicle_type: VehicleType
    capacity: int


class VehicleCreate(VehicleBase):
    project_id: int


class Vehicle(VehicleBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Driver Schemas
class DriverBase(BaseModel):
    full_name: str
    phone: str


class DriverCreate(DriverBase):
    project_id: int


class Driver(DriverBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Route Schemas
class RouteBase(BaseModel):
    name: str
    start_point: str
    end_point: str
    estimated_km: float
    estimated_duration: int


class RouteCreate(RouteBase):
    project_id: int


class Route(RouteBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Route Price Schemas
class RoutePriceBase(BaseModel):
    route_id: int
    vehicle_type: VehicleType
    price_per_km: float


class RoutePriceCreate(RoutePriceBase):
    pass


class RoutePrice(RoutePriceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Trip Schemas
class TripBase(BaseModel):
    vehicle_id: int
    driver_id: int
    route_id: int
    date: datetime
    passenger_count: int = 0
    notes: Optional[str] = None


class TripCreate(TripBase):
    project_id: int


class TripUpdate(BaseModel):
    status: Optional[TripStatus] = None
    actual_km: Optional[float] = None
    notes: Optional[str] = None
    passenger_count: Optional[int] = None


class Trip(TripBase):
    id: int
    project_id: int
    status: TripStatus
    actual_km: Optional[float]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# Report Schemas
class MonthlyReport(BaseModel):
    month: int
    year: int
    total_km: float
    total_trips: int
    total_revenue: float


class VehicleReport(BaseModel):
    vehicle_id: int
    vehicle_plate: str
    total_km: float
    total_trips: int
    total_revenue: float


class DriverReport(BaseModel):
    driver_id: int
    driver_name: str
    total_km: float
    total_trips: int
    total_revenue: float

