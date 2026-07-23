from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from pathlib import Path


def _normalize_database_url(value: str) -> str:
    url = (value or "").strip()

    if not url:
        return ""

    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)

    if url.startswith("postgresql://") and "+psycopg" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)

    return url


@dataclass(slots=True)
class AppConfig:
    root_dir: Path
    data_dir: Path
    outputs_dir: Path
    database_url: str
    secret_key: str
    admin_username: str
    admin_password: str
    public_domain: str
    support_phone: str
    whatsapp_number: str
    support_email: str
    pickup_note: str


def load_config() -> AppConfig:
    root_dir = Path(__file__).resolve().parent.parent
    data_dir = root_dir / "data"
    outputs_dir = root_dir / "outputs"
    data_dir.mkdir(parents=True, exist_ok=True)

    sqlite_path = data_dir / "oneroot_v2.db"
    raw_database_url = (
        os.getenv("ONEROOT_APP_DATABASE_URL")
        or os.getenv("ONEROOT_DATABASE_PRIVATE_URL")
        or os.getenv("DATABASE_PRIVATE_URL")
        or os.getenv("ONEROOT_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or f"sqlite:///{sqlite_path}"
    )
    database_url = _normalize_database_url(raw_database_url)

    admin_username = (os.getenv("ONEROOT_ADMIN_USER") or "phil").strip() or "phil"
    admin_password = (os.getenv("ONEROOT_ADMIN_PASSWORD") or "oneroot@123").strip() or "oneroot@123"
    seed_secret = "|".join(
        [
            admin_username.lower(),
            admin_password,
            database_url,
            "oneroot-essentials-rebuild",
        ]
    )
    secret_key = (
        os.getenv("ONEROOT_SECRET_KEY")
        or hashlib.sha256(seed_secret.encode("utf-8")).hexdigest()
    )

    return AppConfig(
        root_dir=root_dir,
        data_dir=data_dir,
        outputs_dir=outputs_dir,
        database_url=database_url,
        secret_key=secret_key,
        admin_username=admin_username,
        admin_password=admin_password,
        public_domain=(os.getenv("ONEROOT_PUBLIC_DOMAIN") or "OneRoot.shop").strip() or "OneRoot.shop",
        support_phone=(os.getenv("ONEROOT_SUPPORT_PHONE") or "0246497301").strip() or "0246497301",
        whatsapp_number=(os.getenv("ONEROOT_WHATSAPP_NUMBER") or "0242847065").strip() or "0242847065",
        support_email=(os.getenv("ONEROOT_SUPPORT_EMAIL") or "orders@oneroot.shop").strip() or "orders@oneroot.shop",
        pickup_note=(
            os.getenv("ONEROOT_PICKUP_NOTE")
            or "Pickup and delivery confirmation are handled by OneRoot after the order is received."
        ).strip()
        or "Pickup and delivery confirmation are handled by OneRoot after the order is received.",
    )
