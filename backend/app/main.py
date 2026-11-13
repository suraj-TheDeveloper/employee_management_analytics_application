from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.routers import health, auth, departments, designations, employees, leaves, reports

app = FastAPI(title="Employee Management API", version="1.0.0")
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(departments.router, prefix="/api/v1")
app.include_router(designations.router, prefix="/api/v1")
app.include_router(employees.router, prefix="/api/v1")
app.include_router(leaves.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")