from fastapi import Request
from fastapi.responses import JSONResponse

class DomainError(Exception):
    def __init__(self, code: str, message: str, status: int = 422, details: dict | None = None):
        self.code, self.message, self.status, self.details = code, message, status, details or {}
        super().__init__(message)

def register_error_handlers(app):
    @app.exception_handler(DomainError)
    async def _domain(_: Request, e: DomainError):
        return JSONResponse(
            status_code=e.status,
            content={"error": {"code": e.code, "message": e.message, "details": e.details}},
        )

