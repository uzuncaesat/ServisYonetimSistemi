from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, projects, vehicles, drivers, routes, route_prices, trips, reports

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UZHAN API",
    description="Servis taşımacılığı yönetim sistemi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["Vehicles"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["Drivers"])
app.include_router(routes.router, prefix="/api/routes", tags=["Routes"])
app.include_router(route_prices.router, prefix="/api/route-prices", tags=["Route Prices"])
app.include_router(trips.router, prefix="/api/trips", tags=["Trips"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "UZHAN API is running"}

