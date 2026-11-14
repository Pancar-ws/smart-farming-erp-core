# modules/master/service.py
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.errors import DomainError
from app.core.numbering import next_member_code
from .models import (
    Member,
    ProductCategory,
    GradeDefinition,
    Product,
    PurchasePrice,
    SalesPrice,
    SaprotanItem,
    Customer,
    Warehouse,
    Supplier,
    SupplierItem,
)
from .schemas import (
    MemberCreate,
    MemberUpdate,
    ProductCategoryCreate,
    GradeDefinitionCreate,
    ProductCreate,
    PurchasePriceCreate,
    SalesPriceCreate,
    SaprotanCreate,
    CustomerCreate,
    WarehouseCreate,
    SupplierCreate,
    SupplierItemCreate,
)

def register_member(db: Session, data: MemberCreate, user_id: int | None = None) -> Member:
    if db.scalar(select(Member.id).where(Member.nik == data.nik)):
        raise DomainError("DUPLICATE", "NIK sudah terdaftar", 409, {"field": "nik"})
    m = Member(
        member_code=next_member_code(db),
        created_by=user_id,
        **data.model_dump(),
    )
    db.add(m)
    db.flush()
    return m

def member_summary(db: Session, member_id: int) -> dict:
    from app.modules.procurement.models import HarvestReceipt
    from app.modules.accounting.models import Payable, Receivable

    member = db.get(Member, member_id)
    if not member:
        raise DomainError("NOT_FOUND", "Anggota tidak ditemukan", 404)

    deposits = db.execute(
        select(
            HarvestReceipt.received_at,
            HarvestReceipt.batch_code,
            HarvestReceipt.product_id,
            HarvestReceipt.net_kg,
        )
        .where(HarvestReceipt.member_id == member_id)
        .order_by(HarvestReceipt.received_at.desc())
    ).all()

    payable = db.execute(
        select(
            func.coalesce(func.sum(Payable.amount), 0),
            func.coalesce(func.sum(Payable.paid), 0),
        ).where(Payable.member_id == member_id, Payable.party_type == "MEMBER", Payable.status != "VOID")
    ).one()

    saprotan_debt = db.execute(
        select(func.coalesce(func.sum(Receivable.amount - Receivable.paid), 0)).where(
            Receivable.member_id == member_id, Receivable.party_type == "MEMBER", Receivable.status != "VOID"
        )
    ).scalar_one()

    return {
        "member": {
            "id": member.id,
            "code": member.member_code,
            "name": member.name,
            "status": member.status,
        },
        "deposits": [
            {
                "received_at": r[0].isoformat() if hasattr(r[0], "isoformat") else str(r[0]),
                "batch_code": r[1],
                "product_id": r[2],
                "net_kg": str(r[3]),
            }
            for r in deposits
        ],
        "payable_total": str(payable[0]),
        "paid_total": str(payable[1]),
        "saprotan_outstanding": str(saprotan_debt),
    }

def create_category(db: Session, data: ProductCategoryCreate) -> ProductCategory:
    if db.scalar(select(ProductCategory.id).where(ProductCategory.name == data.name)):
        raise DomainError("DUPLICATE", "Kategori sudah ada", 409)
    cat = ProductCategory(**data.model_dump())
    db.add(cat)
    db.flush()
    return cat

def create_grade(db: Session, category_id: int, data: GradeDefinitionCreate) -> GradeDefinition:
    cat = db.get(ProductCategory, category_id)
    if not cat:
        raise DomainError("NOT_FOUND", "Kategori tidak ditemukan", 404)
    if db.scalar(select(GradeDefinition.id).where(GradeDefinition.category_id == category_id, GradeDefinition.code == data.code)):
        raise DomainError("DUPLICATE", f"Grade {data.code} sudah ada di kategori ini", 409)
    grade = GradeDefinition(category_id=category_id, **data.model_dump())
    db.add(grade)
    db.flush()
    return grade

def create_product(db: Session, data: ProductCreate) -> Product:
    if db.scalar(select(Product.id).where(Product.code == data.code)):
        raise DomainError("DUPLICATE", "Kode produk sudah ada", 409)
    prod = Product(**data.model_dump())
    db.add(prod)
    db.flush()
    return prod

def create_purchase_price(db: Session, data: PurchasePriceCreate, user_id: int | None = None) -> PurchasePrice:
    grade = db.get(GradeDefinition, data.grade_id)
    if not grade:
        raise DomainError("NOT_FOUND", "Grade tidak ditemukan", 404)
    if grade.is_reject and data.price != 0:
        raise DomainError("REJECT_PRICE", "Harga grade afkir harus Rp0", 422)
    pp = PurchasePrice(created_by=user_id, **data.model_dump())
    db.add(pp)
    db.flush()
    return pp

def create_sales_price(db: Session, data: SalesPriceCreate, user_id: int | None = None) -> SalesPrice:
    grade = db.get(GradeDefinition, data.grade_id)
    if not grade:
        raise DomainError("NOT_FOUND", "Grade tidak ditemukan", 404)
    if grade.is_reject and data.price != 0:
        raise DomainError("REJECT_PRICE", "Harga grade afkir harus Rp0", 422)
    sp = SalesPrice(created_by=user_id, **data.model_dump())
    db.add(sp)
    db.flush()
    return sp

def create_saprotan(db: Session, data: SaprotanCreate) -> SaprotanItem:
    if db.scalar(select(SaprotanItem.id).where(SaprotanItem.code == data.code)):
        raise DomainError("DUPLICATE", "Kode saprotan sudah ada", 409)
    item = SaprotanItem(**data.model_dump())
    db.add(item)
    db.flush()
    return item

def create_customer(db: Session, data: CustomerCreate) -> Customer:
    if db.scalar(select(Customer.id).where(Customer.code == data.code)):
        raise DomainError("DUPLICATE", "Kode pelanggan sudah ada", 409)
    cust = Customer(**data.model_dump())
    db.add(cust)
    db.flush()
    return cust

def create_warehouse(db: Session, data: WarehouseCreate) -> Warehouse:
    if db.scalar(select(Warehouse.id).where(Warehouse.code == data.code)):
        raise DomainError("DUPLICATE", "Kode gudang sudah ada", 409)
    wh = Warehouse(**data.model_dump())
    db.add(wh)
    db.flush()
    return wh

def create_supplier(db: Session, data: SupplierCreate) -> Supplier:
    if db.scalar(select(Supplier.id).where(Supplier.code == data.code)):
        raise DomainError("DUPLICATE", "Kode pemasok sudah ada", 409)
    sup = Supplier(**data.model_dump())
    db.add(sup)
    db.flush()
    return sup

def create_supplier_item(db: Session, data: SupplierItemCreate) -> SupplierItem:
    si = SupplierItem(**data.model_dump())
    db.add(si)
    db.flush()
    return si

