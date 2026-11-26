"""Factory de la aplicación Flask."""

from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import db


def create_app(config_object: Config | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object or Config)

    db.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"])

    from . import models  # noqa: F401  (registra modelos en metadata)

    from .routes import health, references, sync, ai

    app.register_blueprint(health.bp)
    app.register_blueprint(sync.bp)
    app.register_blueprint(references.bp)
    app.register_blueprint(ai.bp)

    return app
