from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_name: str = "Smart Farming ERP API"
    app_env: str = "dev"
    database_url: str = "postgresql+psycopg://erp:erp@localhost:5432/smartfarm"
    jwt_secret: str = "ganti-dengan-string-acak-minimal-32-karakter-harus-aman"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    refresh_token_hours: int = 8        # SDD 6.2: sesi 8 jam
    timezone: str = "Asia/Jakarta"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

settings = Settings()

