from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Trip as TripModel, Vehicle as VehicleModel, Driver as DriverModel, RoutePrice as RoutePriceModel, Route as RouteModel, TripStatus
from app.schemas import MonthlyReport, VehicleReport, DriverReport
from app.auth import get_current_user

router = APIRouter()


@router.get("/monthly", response_model=MonthlyReport)
async def get_monthly_report(
    project_id: int,
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get completed trips for the month
    # SQLite doesn't support extract, so we filter in Python
    all_trips = db.query(TripModel).filter(
        TripModel.project_id == project_id,
        TripModel.status == TripStatus.COMPLETED,
        TripModel.actual_km.isnot(None)
    ).all()
    
    # Filter by month and year in Python (SQLite compatible)
    trips = [
        trip for trip in all_trips
        if trip.date.month == month and trip.date.year == year
    ]
    
    total_km = sum(trip.actual_km for trip in trips if trip.actual_km)
    total_trips = len(trips)
    
    # Calculate total revenue
    total_revenue = 0.0
    for trip in trips:
        if trip.actual_km and trip.route:
            # Get price for this route and vehicle type
            route_price = db.query(RoutePriceModel).filter(
                RoutePriceModel.route_id == trip.route_id,
                RoutePriceModel.vehicle_type == trip.vehicle.vehicle_type
            ).first()
            
            if route_price:
                total_revenue += trip.actual_km * route_price.price_per_km
    
    return MonthlyReport(
        month=month,
        year=year,
        total_km=total_km,
        total_trips=total_trips,
        total_revenue=total_revenue
    )


@router.get("/vehicles", response_model=List[VehicleReport])
async def get_vehicle_reports(
    project_id: int,
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all vehicles for the project
    vehicles = db.query(VehicleModel).filter(VehicleModel.project_id == project_id).all()
    
    reports = []
    for vehicle in vehicles:
        all_trips = db.query(TripModel).filter(
            TripModel.project_id == project_id,
            TripModel.vehicle_id == vehicle.id,
            TripModel.status == TripStatus.COMPLETED,
            TripModel.actual_km.isnot(None)
        ).all()
        
        # Filter by month and year in Python (SQLite compatible)
        trips = [
            trip for trip in all_trips
            if trip.date.month == month and trip.date.year == year
        ]
        
        total_km = sum(trip.actual_km for trip in trips if trip.actual_km)
        total_trips = len(trips)
        
        # Calculate revenue
        total_revenue = 0.0
        for trip in trips:
            if trip.actual_km and trip.route:
                route_price = db.query(RoutePriceModel).filter(
                    RoutePriceModel.route_id == trip.route_id,
                    RoutePriceModel.vehicle_type == vehicle.vehicle_type
                ).first()
                
                if route_price:
                    total_revenue += trip.actual_km * route_price.price_per_km
        
        reports.append(VehicleReport(
            vehicle_id=vehicle.id,
            vehicle_plate=vehicle.plate,
            total_km=total_km,
            total_trips=total_trips,
            total_revenue=total_revenue
        ))
    
    return reports


@router.get("/drivers", response_model=List[DriverReport])
async def get_driver_reports(
    project_id: int,
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all drivers for the project
    drivers = db.query(DriverModel).filter(DriverModel.project_id == project_id).all()
    
    reports = []
    for driver in drivers:
        all_trips = db.query(TripModel).filter(
            TripModel.project_id == project_id,
            TripModel.driver_id == driver.id,
            TripModel.status == TripStatus.COMPLETED,
            TripModel.actual_km.isnot(None)
        ).all()
        
        # Filter by month and year in Python (SQLite compatible)
        trips = [
            trip for trip in all_trips
            if trip.date.month == month and trip.date.year == year
        ]
        
        total_km = sum(trip.actual_km for trip in trips if trip.actual_km)
        total_trips = len(trips)
        
        # Calculate revenue
        total_revenue = 0.0
        for trip in trips:
            if trip.actual_km and trip.route and trip.vehicle:
                route_price = db.query(RoutePriceModel).filter(
                    RoutePriceModel.route_id == trip.route_id,
                    RoutePriceModel.vehicle_type == trip.vehicle.vehicle_type
                ).first()
                
                if route_price:
                    total_revenue += trip.actual_km * route_price.price_per_km
        
        reports.append(DriverReport(
            driver_id=driver.id,
            driver_name=driver.full_name,
            total_km=total_km,
            total_trips=total_trips,
            total_revenue=total_revenue
        ))
    
    return reports

