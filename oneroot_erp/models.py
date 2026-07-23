from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.utcnow()


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "app_users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200), default="")
    role: Mapped[str] = mapped_column(String(100), default="owner")
    phone: Mapped[str] = mapped_column(String(50), default="")
    password_hash: Mapped[str] = mapped_column(String(255), default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    login_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class ModuleRecord(Base):
    __tablename__ = "module_records"
    __table_args__ = (
        UniqueConstraint("module_key", "reference", name="uq_module_records_module_reference"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module_key: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(255), default="")
    reference: Mapped[str | None] = mapped_column(String(255), default=None, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(100), default="", index=True)
    business_area_id: Mapped[str] = mapped_column(String(100), default="", index=True)
    month: Mapped[str] = mapped_column(String(20), default="", index=True)
    record_date: Mapped[datetime | None] = mapped_column(Date, nullable=True, index=True)
    amount: Mapped[float] = mapped_column(Float, default=0)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    source_catalog_id: Mapped[str] = mapped_column(String(100), default="", index=True)
    sku: Mapped[str] = mapped_column(String(120), default="", index=True)
    barcode: Mapped[str] = mapped_column(String(120), default="", index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    business_area_id: Mapped[str] = mapped_column(String(100), default="", index=True)
    category: Mapped[str] = mapped_column(String(120), default="", index=True)
    source_category: Mapped[str] = mapped_column(String(120), default="")
    item_type: Mapped[str] = mapped_column(String(50), default="stock")
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True)
    quantity_on_hand: Mapped[float] = mapped_column(Float, default=0)
    quantity_known: Mapped[bool] = mapped_column(Boolean, default=True)
    min_stock_level: Mapped[int] = mapped_column(Integer, default=0)
    sales_price: Mapped[float] = mapped_column(Float, default=0)
    cost_price: Mapped[float] = mapped_column(Float, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    user_created: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class PosOrder(Base):
    __tablename__ = "pos_orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    order_number: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    order_date: Mapped[datetime] = mapped_column(Date, index=True)
    business_area_ids: Mapped[list] = mapped_column(JSON, default=list)
    primary_business_area_id: Mapped[str] = mapped_column(String(100), default="", index=True)
    payment_method: Mapped[str] = mapped_column(String(100), default="")
    customer_name: Mapped[str] = mapped_column(String(200), default="")
    customer_phone: Mapped[str] = mapped_column(String(100), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    item_count: Mapped[float] = mapped_column(Float, default=0)
    subtotal: Mapped[float] = mapped_column(Float, default=0)
    total_amount: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    lines: Mapped[list["PosOrderLine"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="PosOrderLine.position",
    )


class PosOrderLine(Base):
    __tablename__ = "pos_order_lines"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("pos_orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[str] = mapped_column(String(100), default="", index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    business_area_id: Mapped[str] = mapped_column(String(100), default="", index=True)
    sku: Mapped[str] = mapped_column(String(120), default="")
    barcode: Mapped[str] = mapped_column(String(120), default="")
    name: Mapped[str] = mapped_column(String(255), default="")
    category: Mapped[str] = mapped_column(String(120), default="")
    item_type: Mapped[str] = mapped_column(String(50), default="stock")
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True)
    quantity: Mapped[float] = mapped_column(Float, default=1)
    unit_price: Mapped[float] = mapped_column(Float, default=0)
    total_amount: Mapped[float] = mapped_column(Float, default=0)

    order: Mapped["PosOrder"] = relationship(back_populates="lines")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module_key: Mapped[str] = mapped_column(String(100), default="", index=True)
    module_label: Mapped[str] = mapped_column(String(150), default="")
    action: Mapped[str] = mapped_column(String(50), default="", index=True)
    title: Mapped[str] = mapped_column(String(255), default="")
    detail: Mapped[str] = mapped_column(Text, default="")
    record_id: Mapped[str] = mapped_column(String(64), default="", index=True)
    actor_id: Mapped[str] = mapped_column(String(64), default="", index=True)
    actor_name: Mapped[str] = mapped_column(String(200), default="")
    actor_role: Mapped[str] = mapped_column(String(100), default="")
    entry_count: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)


class AppSetting(Base):
    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(120), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
