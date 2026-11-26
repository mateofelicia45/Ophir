"""Grafo de referencias cruzadas consultable con CTEs recursivas.

Vecindario: dado un ref (p. ej. "isa.53.5"), devuelve los nodos con los que
comparte arista a 1 y 2 saltos, tanto hacia el origen como hacia el destino,
sin duplicados y tipificado.
"""

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from ..extensions import db

bp = Blueprint("references", __name__, url_prefix="/api/references")

# CTE recursiva compatible con SQLite y MySQL 8. Empieza en el nodo raíz y
# expande en ambas direcciones hasta `depth` saltos, recolectando aristas.
NEIGHBOR_CTE = """
WITH RECURSIVE
  seed AS (
    SELECT :start AS node
  ),
  r AS (
    SELECT e.src_ref AS src, e.dst_ref AS dst, e.rel_type, 1 AS depth,
           e.src_ref AS root
      FROM crossref e
      JOIN seed ON (e.src_ref = seed.node OR e.dst_ref = seed.node)
    UNION ALL
    SELECT e.src_ref, e.dst_ref, e.rel_type, r.depth + 1, r.root
      FROM crossref e
      JOIN r
        ON (e.src_ref = r.dst AND e.dst_ref <> r.src)
        OR (e.dst_ref = r.src AND e.src_ref <> r.dst)
     WHERE r.depth < :maxdepth
  )
SELECT DISTINCT src, dst, rel_type, depth
  FROM r
 ORDER BY depth, src, dst
"""


@bp.get("/neighbors")
def neighbors():
    ref = (request.args.get("ref") or "").strip().lower()
    if not ref:
        return jsonify({"error": "Falta ref"}), 400
    maxdepth = min(int(request.args.get("depth", "2")), 4)

    result = db.session.execute(
        text(NEIGHBOR_CTE), {"start": ref, "maxdepth": maxdepth}
    )
    edges = [
        {"src": s, "dst": d, "type": t, "depth": dep}
        for s, d, t, dep in result
    ]
    return jsonify({"root": ref, "maxdepth": maxdepth, "edges": edges})
