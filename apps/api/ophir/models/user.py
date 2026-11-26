"""Usuarios. Para el alcance offline-first, un usuario se identifica por un
device_id anónimo; el modelo queda listo para sumar autenticación real."""

import uuid
from datetime import datetime, timezone

from ..extensions import db


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    # Identificador opaco que genera el cliente la primera vez.
    public_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    device_label = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=_now)

    highlights = db.relationship("Highlight", backref="user", lazy="dynamic")
    notes = db.relationship("Note", backref="user", lazy="dynamic")

    @staticmethod
    def get_or_create(public_id: str, device_label: str | None = None) -> "User":
        user = User.query.filter_by(public_id=public_id).first()
        if user is None:
            user = User(public_id=public_id, device_label=device_label)
            db.session.add(user)
            db.session.commit()
        elif device_label and user.device_label != device_label:
            user.device_label = device_label
            db.session.commit()
        return user

    @staticmethod
    def new_public_id() -> str:
        return uuid.uuid4().hex
