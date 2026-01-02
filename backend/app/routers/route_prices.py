from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, RoutePrice as RoutePriceModel, Route as RouteModel
from app.schemas import RoutePriceCreate, RoutePrice
from app.auth import get_current_user

router = APIRouter()


@router.post("", response_model=RoutePrice, status_code=status.HTTP_201_CREATED)
async def create_route_price(
    route_price: RoutePriceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if route exists
    route = db.query(RouteModel).filter(RouteModel.id == route_price.route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    
    # Check if price already exists for this route and vehicle type
    existing = db.query(RoutePriceModel).filter(
        RoutePriceModel.route_id == route_price.route_id,
        RoutePriceModel.vehicle_type == route_price.vehicle_type
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price already exists for this route and vehicle type"
        )
    
    db_route_price = RoutePriceModel(**route_price.dict())
    db.add(db_route_price)
    db.commit()
    db.refresh(db_route_price)
    return db_route_price


@router.get("", response_model=List[RoutePrice])
async def get_route_prices(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    route_prices = db.query(RoutePriceModel).filter(RoutePriceModel.route_id == route_id).all()
    return route_prices


@router.get("/{route_price_id}", response_model=RoutePrice)
async def get_route_price(
    route_price_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    route_price = db.query(RoutePriceModel).filter(RoutePriceModel.id == route_price_id).first()
    if not route_price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route price not found"
        )
    return route_price


@router.put("/{route_price_id}", response_model=RoutePrice)
async def update_route_price(
    route_price_id: int,
    route_price: RoutePriceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_route_price = db.query(RoutePriceModel).filter(RoutePriceModel.id == route_price_id).first()
    if not db_route_price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route price not found"
        )
    
    # Check if route exists
    route = db.query(RouteModel).filter(RouteModel.id == route_price.route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    
    for key, value in route_price.dict().items():
        setattr(db_route_price, key, value)
    
    db.commit()
    db.refresh(db_route_price)
    return db_route_price


@router.delete("/{route_price_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route_price(
    route_price_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_route_price = db.query(RoutePriceModel).filter(RoutePriceModel.id == route_price_id).first()
    if not db_route_price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route price not found"
        )
    
    db.delete(db_route_price)
    db.commit()
    return None

