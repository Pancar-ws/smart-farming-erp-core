# modules/master/router.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import current_user, require
from app.modules.auth.models import User
from . import service
from .models import (
    Customer,
    GradeDefinition,
    Member,
    Product,
    ProductCategory,
    PurchasePrice,
    SalesPrice,
    SaprotanItem,
    Supplier,
    SupplierItem,
    Warehouse,
)
from .schemas import (
    CustomerCreate,
    CustomerOut,
    GradeDefinitionCreate,
    GradeDefinitionOut,
    MemberCreate,
    MemberOut,
    MemberUpdate,
    ProductCategoryCreate,
    ProductCategoryOut,
    ProductCreate,
    ProductOut,
    PurchasePriceCreate,
    PurchasePriceOut,
    SalesPriceCreate,
    SalesPriceOut,
    SaprotanCreate,
    SaprotanOut,
    SupplierCreate,
    SupplierItemCreate,
    SupplierItemOut,
    SupplierOut,
    WarehouseCreate,
    WarehouseOut,
)

router = APIRouter(prefix="/master", tags=["Master Data"])

# --- Members ---
@router.get("/members", response_model=list[MemberOut])
def list_members(
    status: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require("member:read")),
):
    stmt = select(Member)
    if status:
        stmt = stmt.where(Member.status == status)
    if q:
        stmt = stmt.where(Member.name.ilike(f"%{q}%") | Member.member_code.ilike(f"%{q}%"))
    return db.scalars(stmt.order_by(Member.id.desc())).all()

@router.post("/members", response_model=MemberOut, status_code=201)
def register_member(
    body: MemberCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("member:write")),
):
    return service.register_member(db, body, user.id)

@router.get("/members/{member_id}", response_model=MemberOut)
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require("member:read")),
):
    return db.get(Member, member_id)

@router.patch("/members/{member_id}", response_model=MemberOut)
def update_member(
    member_id: int,
    body: MemberUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require("member:write")),
):
    m = db.get(Member, member_id)
    if not m:
        from app.core.errors import DomainError
        raise DomainError("NOT_FOUND", "Anggota tidak ditemukan", 404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.flush()
    return m

@router.get("/members/{member_id}/summary")
def get_member_summary(
    member_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require("member:read")),
):
    return service.member_summary(db, member_id)

# --- Categories & Grades ---
@router.get("/categories", response_model=list[ProductCategoryOut])
def list_categories(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(ProductCategory).order_by(ProductCategory.id)).all()

@router.post("/categories", response_model=ProductCategoryOut, status_code=201)
def create_category(
    body: ProductCategoryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("master:write")),
):
    return service.create_category(db, body)

@router.get("/categories/{cat_id}/grades", response_model=list[GradeDefinitionOut])
def list_grades(cat_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(
        select(GradeDefinition)
        .where(GradeDefinition.category_id == cat_id)
        .order_by(GradeDefinition.sort_order)
    ).all()

@router.post("/categories/{cat_id}/grades", response_model=GradeDefinitionOut, status_code=201)
def create_grade(
    cat_id: int,
    body: GradeDefinitionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("mfg:config")),
):
    return service.create_grade(db, cat_id, body)

# --- Products ---
@router.get("/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(Product).order_by(Product.id)).all()

@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("master:write")),
):
    return service.create_product(db, body)

# --- Pricing ---
@router.get("/purchase-prices", response_model=list[PurchasePriceOut])
def list_purchase_prices(
    product_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    stmt = select(PurchasePrice)
    if product_id:
        stmt = stmt.where(PurchasePrice.product_id == product_id)
    return db.scalars(stmt.order_by(PurchasePrice.valid_from.desc(), PurchasePrice.id.desc())).all()

@router.post("/purchase-prices", response_model=PurchasePriceOut, status_code=201)
def create_purchase_price(
    body: PurchasePriceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("price:purchase:write")),
):
    return service.create_purchase_price(db, body, user.id)

@router.get("/sales-prices", response_model=list[SalesPriceOut])
def list_sales_prices(
    product_id: int | None = None,
    segment: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    stmt = select(SalesPrice)
    if product_id:
        stmt = stmt.where(SalesPrice.product_id == product_id)
    if segment:
        stmt = stmt.where(SalesPrice.segment == segment)
    return db.scalars(stmt.order_by(SalesPrice.valid_from.desc(), SalesPrice.id.desc())).all()

@router.post("/sales-prices", response_model=SalesPriceOut, status_code=201)
def create_sales_price(
    body: SalesPriceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("price:sales:write")),
):
    return service.create_sales_price(db, body, user.id)

# --- Saprotan ---
@router.get("/saprotan", response_model=list[SaprotanOut])
def list_saprotan(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(SaprotanItem).order_by(SaprotanItem.id)).all()

@router.post("/saprotan", response_model=SaprotanOut, status_code=201)
def create_saprotan(
    body: SaprotanCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("master:write")),
):
    return service.create_saprotan(db, body)

# --- Customers ---
@router.get("/customers", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(Customer).order_by(Customer.id)).all()

@router.post("/customers", response_model=CustomerOut, status_code=201)
def create_customer(
    body: CustomerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("master:write")),
):
    return service.create_customer(db, body)

# --- Warehouses ---
@router.get("/warehouses", response_model=list[WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(Warehouse).order_by(Warehouse.id)).all()

@router.post("/warehouses", response_model=WarehouseOut, status_code=201)
def create_warehouse(
    body: WarehouseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("master:write")),
):
    return service.create_warehouse(db, body)

# --- Suppliers ---
@router.get("/suppliers", response_model=list[SupplierOut])
def list_suppliers(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(Supplier).order_by(Supplier.id)).all()

@router.post("/suppliers", response_model=SupplierOut, status_code=201)
def create_supplier(
    body: SupplierCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("master:write")),
):
    return service.create_supplier(db, body)

@router.post("/supplier-items", response_model=SupplierItemOut, status_code=201)
def create_supplier_item(
    body: SupplierItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require("master:write")),
):
    return service.create_supplier_item(db, body)

