# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.errors import register_error_handlers

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

def create_app() -> FastAPI:
    application = FastAPI(title=settings.app_name, version="1.0.0", docs_url="/docs", redoc_url="/redoc")
    application.state.limiter = limiter
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_error_handlers(application)

    # Registrasi handler event (WAJIB di-import agar @subscribe terdaftar)
    import app.modules.accounting.handlers  # noqa
    import app.modules.procurement.handlers  # noqa
    import app.modules.reporting.esg_handlers  # noqa

    # Import and register routers
    from app.modules.auth.router import router as auth_router, users_router
    from app.modules.master.router import router as master_router
    from app.modules.procurement.router import router as procurement_router
    from app.modules.inventory.router import router as inventory_router
    from app.modules.manufacturing.router import router as manufacturing_router
    from app.modules.sales.router import router as sales_router
    from app.modules.accounting.router import router as accounting_router
    from app.modules.reporting.router import router as reporting_router

    for r in (
        auth_router,
        users_router,
        master_router,
        procurement_router,
        inventory_router,
        manufacturing_router,
        sales_router,
        accounting_router,
        reporting_router,
    ):
        application.include_router(r, prefix="/api/v1")

    @application.get("/")
    def root():
        return {
            "app": settings.app_name,
            "version": "1.0.0",
            "docs": "/docs",
            "status": "healthy",
        }

    return application

app = create_app()

