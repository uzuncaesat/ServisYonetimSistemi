from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class VehicleType(str, enum.Enum):
    MINIBUS = "minibus"
    MIDIBUS = "midibus"
    BUS = "bus"


class TripStatus(str, enum.Enum):
    PENDING = "pending"
    STARTED = "started"
    COMPLETED = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicles = relationship("Vehicle", back_populates="project", cascade="all, delete-orphan")
    drivers = relationship("Driver", back_populates="project", cascade="all, delete-orphan")
    routes = relationship("Route", back_populates="project", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="project", cascade="all, delete-orphan")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    plate = Column(String, nullable=False)
    vehicle_type = Column(SQLEnum(VehicleType), nullable=False)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="vehicles")
    trips = relationship("Trip", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="drivers")
    trips = relationship("Trip", back_populates="driver")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    start_point = Column(String, nullable=False)
    end_point = Column(String, nullable=False)
    estimated_km = Column(Float, nullable=False)
    estimated_duration = Column(Integer, nullable=False)  # dakika
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="routes")
    trips = relationship("Trip", back_populates="route")
    route_prices = relationship("RoutePrice", back_populates="route")


class RoutePrice(Base):
    __tablename__ = "route_prices"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    vehicle_type = Column(SQLEnum(VehicleType), nullable=False)
    price_per_km = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    route = relationship("Route", back_populates="route_prices")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    passenger_count = Column(Integer, default=0)
    status = Column(SQLEnum(TripStatus), default=TripStatus.PENDING)
    notes = Column(Text)
    actual_km = Column(Float)  # Gerçek km (sefer bitince girilir)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    project = relationship("Project", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    route = relationship("Route", back_populates="trips")

