"""Punto de entrada: python -m ophir [init-db | run]"""

import json
import os
import sys

from ophir import create_app


def main() -> None:
    app = create_app()
    args = sys.argv[1:]

    if args and args[0] == "init-db":
        with app.app_context():
            from ophir.extensions import db

            db.create_all()
        # Carga opcional del grafo desde un JSON de aristas.
        seed = os.environ.get("OPHIR_GRAPH_SEED")
        if seed and os.path.exists(seed):
            _seed_graph(app, seed)
        print("Base inicializada.")
        return

    app.run(host=os.environ.get("OPHIR_HOST", "127.0.0.1"), port=int(os.environ.get("OPHIR_PORT", "5001")), debug=True)


def _seed_graph(app, path: str) -> None:
    from ophir.models import CrossRefEdge
    from ophir.extensions import db

    with app.app_context():
        with open(path, encoding="utf-8") as fh:
            edges = json.load(fh)
        count = 0
        for e in edges:
            if not all(k in e for k in ("src", "dst", "type")):
                continue
            exists = CrossRefEdge.query.filter_by(
                src_ref=e["src"], dst_ref=e["dst"], rel_type=e["type"]
            ).first()
            if not exists:
                db.session.add(
                    CrossRefEdge(
                        src_ref=e["src"], dst_ref=e["dst"], rel_type=e["type"]
                    )
                )
                count += 1
        db.session.commit()
        print(f"Grafo sembrado: {count} aristas nuevas/ {len(edges)} totales.")


if __name__ == "__main__":
    main()
