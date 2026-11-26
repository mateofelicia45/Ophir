"""Sincronización de datos personales (notas + resaltados).

Estrategia:
- GET /api/sync  -> trae todo el estado del usuario (pull).
- POST /api/sync -> recibe un batch de notas y resaltados (push,
  last-write-wins), devuelve el estado consolidado.

El front sigue siendo offline-first: guarda primero en localStorage y
replica a este endpoint cuando hay conexión.
"""

from datetime import datetime

from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Highlight, Note, User

bp = Blueprint("sync", __name__, url_prefix="/api/sync")


def _identity() -> User:
    """Resuelve el usuario a partir del Device-ID anónimo del header.

    (Punto único donde más adelante entra la autenticación real.)
    """
    device = (request.headers.get("X-Device-Id") or "").strip()
    if not device:
        raise PermissionError("Falta X-Device-Id")
    label = (request.headers.get("X-Device-Label") or "").strip() or None
    return User.get_or_create(device, label)


@bp.get("")
def pull():
    user = _identity()
    notes = [n.to_json() for n in user.notes.all()]
    highlights = [h.to_json() for h in user.highlights.all()]
    return jsonify(
        {"notes": notes, "highlights": highlights, "server_time": __now_iso()}
    )


@bp.post("")
def push():
    user = _identity()
    payload = request.get_json(silent=True) or {}
    errors = []

    for note in payload.get("notes", []):
        nid = str(note.get("id", "")).strip()
        if not nid:
            errors.append({"kind": "note", "msg": "nota sin id"})
            continue
        updated = _parse(note.get("updated"))
        existing = Note.query.filter_by(id=nid, user_id=user.id).first()
        if existing:
            # last-write-wins
            if existing.updated_at and updated and updated <= existing.updated_at:
                continue
            existing.title = str(note.get("title", existing.title))
            existing.body = str(note.get("body", existing.body))
            if updated:
                existing.updated_at = updated
        else:
            db.session.add(
                Note(
                    id=nid,
                    user_id=user.id,
                    title=str(note.get("title", "")),
                    body=str(note.get("body", "")),
                    created_at=_parse(note.get("created")) or datetime.now(),
                    updated_at=updated or datetime.now(),
                )
            )

    for hl in payload.get("highlights", []):
        ref = str(hl.get("ref", "")).strip()
        color = str(hl.get("color", "")).strip()
        if not ref or not color:
            errors.append({"kind": "highlight", "msg": "resaltado inválido"})
            continue
        existing = Highlight.query.filter_by(
            user_id=user.id, ref=ref
        ).first()
        if existing:
            existing.color = color
            if _parse(hl.get("updated_at")):
                existing.updated_at = _parse(hl["updated_at"])
        else:
            db.session.add(Highlight(user_id=user.id, ref=ref, color=color))

    db.session.commit()

    notes = [n.to_json() for n in user.notes.all()]
    highlights = [h.to_json() for h in user.highlights.all()]
    return jsonify(
        {"notes": notes, "highlights": highlights, "errors": errors, "synced": True}
    )


def _parse(iso: str | None):
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None


def __now_iso() -> str:
    return datetime.now().isoformat()
