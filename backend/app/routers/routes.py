from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Route as RouteModel, Project as ProjectModel
from app.schemas import RouteCreate, Route
from app.auth import get_current_user

router = APIRouter()


@router.post("", response_model=Route, status_code=status.HTTP_201_CREATED)
async def create_route(
    route: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if project exists
    project = db.query(ProjectModel).filter(ProjectModel.id == route.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db_route = RouteModel(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route


@router.get("", response_model=List[Route])
async def get_routes(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    routes = db.query(RouteModel).filter(RouteModel.project_id == project_id).all()
    return routes


@router.get("/{route_id}", response_model=Route)
async def get_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    route = db.query(RouteModel).filter(RouteModel.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    return route


@router.put("/{route_id}", response_model=Route)
async def update_route(
    route_id: int,
    route: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_route = db.query(RouteModel).filter(RouteModel.id == route_id).first()
    if not db_route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    
    # Check if project exists
    project = db.query(ProjectModel).filter(ProjectModel.id == route.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    for key, value in route.dict().items():
        setattr(db_route, key, value)
    
    db.commit()
    db.refresh(db_route)
    return db_route


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_route = db.query(RouteModel).filter(RouteModel.id == route_id).first()
    if not db_route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    
    db.delete(db_route)
    db.commit()
    return None

