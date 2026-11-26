"""Health check y meta."""

from flask import Blueprint, jsonify

bp = Blueprint("health", __name__)


@bp.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "ophir-api", "version": "0.1.0"})
