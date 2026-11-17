from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

_handlers: dict[type, list] = defaultdict(list)

def subscribe(event_type):
    def deco(fn):
        _handlers[event_type].append(fn)
        return fn
    return deco

def publish(db, event):
    for h in _handlers[type(event)]:
        h(db, event)           # sinkron, 1 transaksi; exception -> rollback seluruhnya

@dataclass(frozen=True)
class HarvestReceived:
    receipt_id: int
    member_id: int
    batch_code: str
    net_kg: Decimal

@dataclass(frozen=True)
class SortingPosted:
    order_id: int
    process_date: date
    lines: list
    total_value: Decimal
    user_id: int | None

@dataclass(frozen=True)
class SaprotanReceived:
    gr_id: int
    supplier_id: int
    received_date: date
    total_value: Decimal
    gr_no: str
    due_date: date

@dataclass(frozen=True)
class SaprotanIssued:
    issue_id: int
    member_id: int
    issue_date: date
    cost_total: Decimal
    price_total: Decimal
    issue_no: str

@dataclass(frozen=True)
class DeliveryPosted:
    do_id: int
    do_no: str
    so_id: int
    delivered_on: date
    cogs_total: Decimal

@dataclass(frozen=True)
class InvoiceIssued:
    invoice_id: int
    invoice_no: str
    customer_id: int
    issue_date: date
    due_date: date
    total: Decimal

@dataclass(frozen=True)
class SalesReturned:
    return_id: int
    return_no: str
    return_date: date
    revenue_total: Decimal
    cogs_total: Decimal
    customer_id: int

@dataclass(frozen=True)
class PaymentRecorded:
    payment_id: int

@dataclass(frozen=True)
class StockAdjusted:
    adj_id: int
    adj_date: date
    value_delta: Decimal
    adj_no: str

@dataclass(frozen=True)
class StockBelowMinimum:
    saprotan_id: int
    on_hand: Decimal
    min_stock: Decimal

