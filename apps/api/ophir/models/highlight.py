"""Resaltado por versículo (canónico, independiente de versión)."""

from datetime import datetime, timezone

from ..extensions import db


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Highlight(db.Model):
    __tablename__ = "highlights"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    # Canónico: "rom.8.29" -> {c: "dorado"}  (mismo shape que lib/highlights.js)
    ref = db.Column(db.String(64), nullable=False, index=True)
    color = db.Column(db.String(24), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), default=_now, onupdate=_now)

    __table_args__ = (db.UniqueConstraint("user_id", "ref", name="uq_hl_user_ref"),)

    def to_json(self) -> dict:
        return {
            "ref": self.ref,
            "color": self.color,
            "updated_at": self.updated_at.isoformat(),
        }
