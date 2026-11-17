# modules/accounting/handlers.py
from datetime import timedelta
from decimal import Decimal
from app.core.events import (
    DeliveryPosted,
    InvoiceIssued,
    SalesReturned,
    SaprotanIssued,
    SaprotanReceived,
    SortingPosted,
    StockAdjusted,
    subscribe,
)
from app.core.settings_store import get_setting
from .journal import post_journal, JLine as L
from .models import Payable, Receivable

KAS, PIUT_USAHA, PIUT_SAPROTAN, PERS_SAPROTAN, PERS_JADI = "1-1100", "1-2100", "1-2200", "1-3100", "1-3200"
HUT_SUPP, HUT_ANGGOTA = "2-1100", "2-1200"
PENJ, PEND_SAPROTAN, RETUR = "4-1100", "4-1200", "4-1300"
HPP, HPP_SAPROTAN, SELISIH = "5-1100", "5-1200", "5-1300"

@subscribe(SortingPosted)
def on_sorting(db, e: SortingPosted):
    if e.total_value <= 0:
        return
    # Satu hutang + jurnal per anggota (satu order bisa memuat batch beberapa anggota)
    per_member: dict[int, Decimal] = {}
    for ln in e.lines:
        per_member[ln["member_id"]] = per_member.get(ln["member_id"], Decimal(0)) + ln["value"]
    terms = int(get_setting(db, "member.payment_term_days", 7))
    for member_id, value in per_member.items():
        if value <= 0:
            continue
        je = post_journal(
            db,
            entry_date=e.process_date,
            description="Pembelian hasil panen anggota (sortasi)",
            lines=[
                L(PERS_JADI, debit=value, memo="Persediaan barang jadi per grade"),
                L(HUT_ANGGOTA, credit=value, memo=f"Hutang anggota #{member_id}", party_type="MEMBER", party_id=member_id),
            ],
            source_type="SORTING",
            source_id=e.order_id,
            source_no=f"SRT#{e.order_id}",
            user_id=e.user_id,
        )
        db.add(
            Payable(
                party_type="MEMBER",
                member_id=member_id,
                source_type="SORTING",
                source_id=e.order_id,
                source_no=je.entry_no,
                amount=value,
                paid=Decimal(0),
                due_date=e.process_date + timedelta(days=terms),
                status="OPEN",
            )
        )

@subscribe(SaprotanReceived)
def on_gr(db, e: SaprotanReceived):
    post_journal(
        db,
        entry_date=e.received_date,
        description=f"Penerimaan saprotan {e.gr_no}",
        lines=[
            L(PERS_SAPROTAN, debit=e.total_value),
            L(HUT_SUPP, credit=e.total_value, party_type="SUPPLIER", party_id=e.supplier_id),
        ],
        source_type="GR",
        source_id=e.gr_id,
        source_no=e.gr_no,
    )
    db.add(
        Payable(
            party_type="SUPPLIER",
            supplier_id=e.supplier_id,
            source_type="GR",
            source_id=e.gr_id,
            source_no=e.gr_no,
            amount=e.total_value,
            paid=Decimal(0),
            due_date=e.due_date,
            status="OPEN",
        )
    )

@subscribe(SaprotanIssued)
def on_issue(db, e: SaprotanIssued):
    post_journal(
        db,
        entry_date=e.issue_date,
        description=f"Penyaluran saprotan {e.issue_no}",
        lines=[
            L(PIUT_SAPROTAN, debit=e.price_total, party_type="MEMBER", party_id=e.member_id),
            L(PEND_SAPROTAN, credit=e.price_total),
            L(HPP_SAPROTAN, debit=e.cost_total),
            L(PERS_SAPROTAN, credit=e.cost_total),
        ],
        source_type="SAPROTAN_ISSUE",
        source_id=e.issue_id,
        source_no=e.issue_no,
    )
    db.add(
        Receivable(
            party_type="MEMBER",
            member_id=e.member_id,
            source_type="SAPROTAN_ISSUE",
            source_id=e.issue_id,
            source_no=e.issue_no,
            amount=e.price_total,
            paid=Decimal(0),
            due_date=None,
            status="OPEN",
        )
    )

@subscribe(DeliveryPosted)
def on_delivery(db, e: DeliveryPosted):
    post_journal(
        db,
        entry_date=e.delivered_on,
        description=f"HPP pengiriman {e.do_no}",
        lines=[
            L(HPP, debit=e.cogs_total),
            L(PERS_JADI, credit=e.cogs_total),
        ],
        source_type="DO",
        source_id=e.do_id,
        source_no=e.do_no,
    )

@subscribe(InvoiceIssued)
def on_invoice(db, e: InvoiceIssued):
    post_journal(
        db,
        entry_date=e.issue_date,
        description=f"Faktur penjualan {e.invoice_no}",
        lines=[
            L(PIUT_USAHA, debit=e.total, party_type="CUSTOMER", party_id=e.customer_id),
            L(PENJ, credit=e.total),
        ],
        source_type="INVOICE",
        source_id=e.invoice_id,
        source_no=e.invoice_no,
    )
    db.add(
        Receivable(
            party_type="CUSTOMER",
            customer_id=e.customer_id,
            source_type="INVOICE",
            source_id=e.invoice_id,
            source_no=e.invoice_no,
            amount=e.total,
            paid=Decimal(0),
            due_date=e.due_date,
            status="OPEN",
        )
    )

@subscribe(SalesReturned)
def on_return(db, e: SalesReturned):
    post_journal(
        db,
        entry_date=e.return_date,
        description=f"Retur penjualan {e.return_no}",
        lines=[
            L(RETUR, debit=e.revenue_total),
            L(PIUT_USAHA, credit=e.revenue_total, party_type="CUSTOMER", party_id=e.customer_id),
            L(PERS_JADI, debit=e.cogs_total),
            L(HPP, credit=e.cogs_total),
        ],
        source_type="SALES_RETURN",
        source_id=e.return_id,
        source_no=e.return_no,
    )

@subscribe(StockAdjusted)
def on_adjust(db, e: StockAdjusted):
    if e.value_delta == 0:
        return
    amt = abs(e.value_delta)
    lines = (
        [L(PERS_JADI, debit=amt), L(SELISIH, credit=amt)]
        if e.value_delta > 0
        else [L(SELISIH, debit=amt), L(PERS_JADI, credit=amt)]
    )
    post_journal(
        db,
        entry_date=e.adj_date,
        description=f"Penyesuaian stok {e.adj_no}",
        lines=lines,
        source_type="ADJUSTMENT",
        source_id=e.adj_id,
        source_no=e.adj_no,
    )

