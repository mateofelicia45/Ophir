# Ophir

Plataforma integral de estudio bíblico. El nombre evoca la tierra del oro fino (1 Reyes 9:28): mina y refinería del texto a la vez.

## Estructura (monorepo)

```
ophir/
├── docs/
│   ├── DESIGN.md          # Documento de diseño completo + prompt de sistema IA
│   └── ROADMAP.md         # Fases de construcción y estado
├── apps/
│   └── web/               # SPA React + Vite (única app por ahora)
│       └── src/modules/   # Un módulo por carpeta: atlas, reader, notes, ...
└── packages/
    └── data/              # Datasets compartidos (JSON versionado)
        └── atlas/locations.json
```

## Desarrollo

```bash
cd apps/web
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
```

El alias `@data` apunta a `packages/data` (configurado en `vite.config.js`).

## Estado

- **Fase 1 — Fundaciones**: lista (router, layout, tema, contexto de pasaje activo).
- **Fase 2 — Atlas**: integrado como módulo `/atlas` (Three.js + clustering + datos de OpenBible.info).
- **Fase 3 — Lector**: integrado como módulo `/lector` (RV1909/KJV/WEB en columnas paralelas, resaltado con paleta de 9 colores persistente en localStorage, filtro por color).
- **Fase 4 — Notas**: integrado como módulo `/notas` (Markdown con preview, detección automática de referencias citadas, backlinks por pasaje compartido, export `.md` con frontmatter YAML compatible con Obsidian, backup JSON).
- Fases 5–9: ver `docs/ROADMAP.md`.

## Principios

Ophir no arbitra disputas doctrinales, no oculta el aparato crítico y no mezcla dato arqueológico con especulación sin distinguirlos. Detalle en `docs/DESIGN.md` §5.
