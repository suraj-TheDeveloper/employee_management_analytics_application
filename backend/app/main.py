import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.routers import ( auth, departments, designations, employees, health, leaves, reports, users )

setup_logging()
request_logger = logging.getLogger("app.request")

app = FastAPI(title="Employee Management API", version="1.0.0")
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    # Path only: no query string, headers or body, so no tokens or passwords
    request_logger.info(
        "%s %s -> %s (%.0f ms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


for r in (
    health.router,
    auth.router,
    departments.router,
    designations.router,
    employees.router,
    leaves.router,
    reports.router,
    users.router,
    users.roles_router,
):
    app.include_router(r, prefix="/api/v1")