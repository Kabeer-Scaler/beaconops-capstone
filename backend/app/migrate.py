"""Run Alembic safely when several replicas start at the same time."""

import time

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

from .config import settings

LOCK_ID = 4_210_042
MAX_ATTEMPTS = 30


def migrate() -> None:
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with engine.connect() as connection:
                is_postgres = connection.dialect.name == "postgresql"
                if is_postgres:
                    connection.execute(text("SELECT pg_advisory_lock(:lock_id)"), {"lock_id": LOCK_ID})
                try:
                    command.upgrade(Config("alembic.ini"), "head")
                finally:
                    if is_postgres:
                        connection.execute(text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": LOCK_ID})
            return
        except OperationalError:
            if attempt == MAX_ATTEMPTS:
                raise
            time.sleep(2)


if __name__ == "__main__":
    migrate()
