"""Notas tipo Obsidian (Markdown). Sincronización last-write-wins por nota."""

from datetime import datetime, timezone

from ..extensions import db


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.String(64), primary_key=True)  # uuid del cliente
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    title = db.Column(db.Text, nullable=False, default="")
    body = db.Column(db.Text, nullable=False, default="")
    created_at = db.Column(db.DateTime(timezone=True), default=_now)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now)

    def to_json(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "created": self.created_at.isoformat(),
            "updated": self.updated_at.isoformat(),
        }
