"""Aristas del grafo de referencias cruzadas (Origen -> Destino, tipificadas).

Las consultas de vecindario se resuelven con CTEs recursivas sobre esta
tabla (ver routes/references.py). El grafo es global (por ahora), no por
usuario.
"""

from ..extensions import db


class CrossRefEdge(db.Model):
    __tablename__ = "crossref"

    id = db.Column(db.Integer, primary_key=True)
    src_ref = db.Column(db.String(48), nullable=False, index=True)  # "isa.53.5"
    dst_ref = db.Column(db.String(48), nullable=False, index=True)
    # cita-directa | alusion | tipologia | contraste | eco
    rel_type = db.Column(db.String(16), nullable=False, index=True)

    __table_args__ = (
        db.UniqueConstraint("src_ref", "dst_ref", "rel_type", name="uq_edge"),
    )

    def to_json(self) -> dict:
        return {
            "src": self.src_ref,
            "dst": self.dst_ref,
            "type": self.rel_type,
        }
