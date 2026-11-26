"""Configuración de la aplicación Flask de Ophir.

La base de datos se selecciona por entorno:
- Por defecto SQLite (dev, offline-first, sin servidor externo).
- En producción, definir OPHIR_DATABASE_URL con una URL MySQL 8
  (p. ej. mysql+pymysql://user:pass@host:3306/ophir).
"""

import os


def _default_db_url() -> str:
    data_dir = os.environ.get("OPHIR_DATA_DIR", os.path.join(os.getcwd(), "var"))
    os.makedirs(data_dir, exist_ok=True)
    return "sqlite:///" + os.path.join(data_dir, "ophir.db").replace("\\", "/")


class Config:
    SECRET_KEY = os.environ.get("OPHIR_SECRET_KEY", "ophir-dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "OPHIR_DATABASE_URL", _default_db_url()
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # CORS: en dev el front corre en :5173.
    CORS_ORIGINS = os.environ.get(
        "OPHIR_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    # Sincronización: ventana de documentos por cliente (para limpieza).
    MAX_SYNC_WINDOW = 1000
