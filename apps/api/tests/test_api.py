"""Tests de humo con el test client de Flask. Requiere: python -m ophir init-db."""

import json
import os
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if os.environ.get("PYTHONPATH"):
    sys.path.insert(0, os.environ["PYTHONPATH"])


@pytest.fixture()
def client(tmp_path):
    from ophir import create_app
    from ophir.extensions import db

    dbpath = tmp_path / "test.db"
    os.environ["OPHIR_DATA_DIR"] = str(tmp_path)
    app = create_app()
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + dbpath.as_posix()
    with app.app_context():
        db.drop_all()
        db.create_all()
        from ophir.models import CrossRefEdge

        seed = [
            ("isa.53.5", "1pe.2.24", "cita-directa"),
            ("isa.53.5", "mat.8.17", "alusion"),
            ("mat.8.17", "rom.4.25", "eco"),
            ("1pe.2.24", "rom.4.25", "eco"),
        ]
        for s, d, t in seed:
            db.session.add(CrossRefEdge(src_ref=s, dst_ref=d, rel_type=t))
        db.session.commit()

    app.testing = True
    return app.test_client()


HDRS = {"X-Device-Id": "dev-test-1"}


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_sync_empty_pull(client):
    r = client.get("/api/sync", headers=HDRS)
    assert r.status_code == 200
    body = r.get_json()
    assert body["notes"] == []
    assert body["highlights"] == []


def test_sync_push_and_pull(client):
    push = {
        "notes": [
            {
                "id": "n1",
                "title": "Isaías 53",
                "body": "Siervo sufriente. Ver 1 Pedro 2:24",
                "created": "2026-01-01T10:00:00+00:00",
                "updated": "2026-01-01T10:00:00+00:00",
            }
        ],
        "highlights": [{"ref": "isa.53.5", "color": "dorado", "updated_at": "2026-01-01T10:00:00+00:00"}],
    }
    r = client.post("/api/sync", json=push, headers=HDRS)
    assert r.status_code == 200
    body = r.get_json()
    assert body["synced"] is True
    assert len(body["notes"]) == 1
    assert len(body["highlights"]) == 1

    # Pull lo refleja.
    r2 = client.get("/api/sync", headers=HDRS)
    body2 = r2.get_json()
    assert body2["notes"][0]["title"] == "Isaías 53"
    assert body2["highlights"][0]["ref"] == "isa.53.5"


def test_sync_lww(client):
    push = {
        "notes": [],
        "highlights": [{"ref": "isa.53.5", "color": "rojo", "updated_at": "2026-02-01T00:00:00+00:00"}],
    }
    # Primero agregamos con un color, luego actualizamos.
    client.post("/api/sync", json={"highlights": [{"ref": "isa.53.5", "color": "verde", "updated_at": "2026-01-01T00:00:00+00:00"}]}, headers=HDRS)
    client.post("/api/sync", json=push, headers=HDRS)
    r = client.get("/api/sync", headers=HDRS)
    hls = r.get_json()["highlights"]
    assert hls[0]["color"] == "rojo"


def test_neighbors_cte(client):
    r = client.get("/api/references/neighbors?ref=isa.53.5&depth=2", headers=HDRS)
    assert r.status_code == 200
    body = r.get_json()
    # Vecinos directos: 1pe.2.24, mat.8.17  (sin rom.4.25 a depth 1)
    refs = {e["dst"] if e["src"] == "isa.53.5" else e["src"] for e in body["edges"] if e["depth"] == 1}
    assert "1pe.2.24" in refs
    assert "mat.8.17" in refs
    # A profundidad 2 llega rom.4.25
    assert any(e["dst"] == "rom.4.25" for e in body["edges"])
