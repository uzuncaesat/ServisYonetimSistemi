from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import User, Trip as TripModel, Project as ProjectModel, TripStatus
from app.schemas import TripCreate, TripUpdate, Trip
from app.auth import get_current_user

router = APIRouter()


@router.post("", response_model=Trip, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if project exists
    project = db.query(ProjectModel).filter(ProjectModel.id == trip.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db_trip = TripModel(**trip.dict(), status=TripStatus.PENDING)
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip


@router.get("", response_model=List[Trip])
async def get_trips(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trips = db.query(TripModel).filter(TripModel.project_id == project_id).all()
    return trips


@router.get("/{trip_id}", response_model=Trip)
async def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trip = db.query(TripModel).filter(TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    return trip


@router.put("/{trip_id}", response_model=Trip)
async def update_trip(
    trip_id: int,
    trip_update: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = db.query(TripModel).filter(TripModel.id == trip_id).first()
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Update fields
    if trip_update.status is not None:
        db_trip.status = trip_update.status
        if trip_update.status == TripStatus.COMPLETED and not db_trip.completed_at:
            db_trip.completed_at = datetime.utcnow()
    
    if trip_update.actual_km is not None:
        db_trip.actual_km = trip_update.actual_km
    
    if trip_update.notes is not None:
        db_trip.notes = trip_update.notes
    
    if trip_update.passenger_count is not None:
        db_trip.passenger_count = trip_update.passenger_count
    
    db.commit()
    db.refresh(db_trip)
    return db_trip


@router.post("/{trip_id}/start", response_model=Trip)
async def start_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = db.query(TripModel).filter(TripModel.id == trip_id).first()
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    db_trip.status = TripStatus.STARTED
    db.commit()
    db.refresh(db_trip)
    return db_trip


@router.post("/{trip_id}/complete", response_model=Trip)
async def complete_trip(
    trip_id: int,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actual_km = body.get("actual_km")
    if actual_km is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="actual_km is required"
        )
    
    db_trip = db.query(TripModel).filter(TripModel.id == trip_id).first()
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    if actual_km <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="actual_km must be greater than 0"
        )
    
    db_trip.status = TripStatus.COMPLETED
    db_trip.actual_km = actual_km
    db_trip.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(db_trip)
    return db_trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_trip = db.query(TripModel).filter(TripModel.id == trip_id).first()
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    db.delete(db_trip)
    db.commit()
    return None

