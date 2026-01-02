from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Vehicle as VehicleModel, Project as ProjectModel
from app.schemas import VehicleCreate, Vehicle
from app.auth import get_current_user

router = APIRouter()


@router.post("", response_model=Vehicle, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        print(f"[VEHICLES] Creating vehicle: {vehicle.dict()}")
        
        # Check if project exists
        project = db.query(ProjectModel).filter(ProjectModel.id == vehicle.project_id).first()
        if not project:
            print(f"[VEHICLES] Project not found: {vehicle.project_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        print(f"[VEHICLES] Project found: {project.name}")
        print(f"[VEHICLES] Vehicle data: {vehicle.dict()}")
        
        db_vehicle = VehicleModel(**vehicle.dict())
        db.add(db_vehicle)
        db.commit()
        db.refresh(db_vehicle)
        print(f"[VEHICLES] Vehicle created: {db_vehicle.id}")
        return db_vehicle
    except HTTPException:
        raise
    except Exception as e:
        print(f"[VEHICLES] Error creating vehicle: {e}")
        import traceback
        print(f"[VEHICLES] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating vehicle: {str(e)}"
        )


@router.get("", response_model=List[Vehicle])
async def get_vehicles(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicles = db.query(VehicleModel).filter(VehicleModel.project_id == project_id).all()
    return vehicles


@router.get("/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vehicle = db.query(VehicleModel).filter(VehicleModel.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return vehicle


@router.put("/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(
    vehicle_id: int,
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_vehicle = db.query(VehicleModel).filter(VehicleModel.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Check if project exists
    project = db.query(ProjectModel).filter(ProjectModel.id == vehicle.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    for key, value in vehicle.dict().items():
        setattr(db_vehicle, key, value)
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_vehicle = db.query(VehicleModel).filter(VehicleModel.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    db.delete(db_vehicle)
    db.commit()
    return None

