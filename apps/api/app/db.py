from collections.abc import Iterator
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

from .config import settings


@contextmanager
def db_connection() -> Iterator[psycopg.Connection]:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required to persist embeddings.")

    with psycopg.connect(settings.database_url, autocommit=False) as connection:
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise


@contextmanager
def db_cursor() -> Iterator[psycopg.Cursor]:
    with db_connection() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            yield cursor
