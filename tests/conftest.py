import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.core.database import SessionLocal, get_db
from app.core.security import create_token
from app.modules.auth.models import User
from app.modules.master.models import Product, Warehouse, GradeDefinition, Customer

@pytest.fixture(scope="session")
def client():
    return TestClient(app)

@pytest.fixture(scope="session")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="session")
def auth_headers(db):
    def _auth(username: str):
        user = db.scalar(select(User).where(User.username == username))
        if not user:
            token = create_token(1, "SUPERADMIN", "access")
        else:
            token = create_token(user.id, user.role.code, "access")
        return {"Authorization": f"Bearer {token}"}
    return _auth

@pytest.fixture(scope="session")
def scenario_ids(db):
    cabai = db.scalar(select(Product.id).where(Product.code == "CABAI")) or 1
    wh_mentah = db.scalar(select(Warehouse.id).where(Warehouse.type == "PANEN_MENTAH")) or 2
    grade_a = db.scalar(select(GradeDefinition.id).where(GradeDefinition.code == "A")) or 1
    grade_b = db.scalar(select(GradeDefinition.id).where(GradeDefinition.code == "B")) or 2
    grade_afkir = db.scalar(select(GradeDefinition.id).where(GradeDefinition.code == "AFKIR")) or 3
    cust = db.scalar(select(Customer.id).where(Customer.segment == "RETAIL")) or 2

    return {
        "cabai": cabai,
        "wh_mentah": wh_mentah,
        "grade_a": grade_a,
        "grade_b": grade_b,
        "grade_afkir": grade_afkir,
        "customer_id": cust,
    }

