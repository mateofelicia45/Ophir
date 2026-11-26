# Ophir API — Backend de sincronización

Backend en **Flask + SQLAlchemy** para la plataforma Ophir. Proporciona
sincronización multi-dispositivo de **notas** y **resaltados**, más un
**grafo de referencias cruzadas** consultable con CTEs recursivas.

La app web sigue siendo **offline-first**: guarda primero en `localStorage`
y replica a este servidor cuando hay conexión.

## Requisitos

- Python ≥ 3.10 (probado con 3.14)
- Dependencias: `pip install flask flask-cors flask-sqlalchemy PyMySQL cryptography`
- Para pruebas: `pip install pytest`

## Cómo correr

```powershell
cd <ophir>\apps\api
$env:PYTHONPATH = "<ophir>\apps\api"

# 1) Crear/actualizar la base (SQLite por defecto -> apps\api\var\ophir.db)
python -m ophir init-db

# 2) Levantar el servidor (default http://127.0.0.1:5001)
python -m ophir
```

## Configuración por entorno (variables)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `OPHIR_DATABASE_URL` | `sqlite:///var/ophir.db` | **SQLite** para dev. Para **MySQL 8**: `mysql+pymysql://user:pass@host:3306/ophir` |
| `OPHIR_HOST` / `OPHIR_PORT` | `127.0.0.1` / `5001` | Bind del servidor |
| `OPHIR_CORS_ORIGINS` | `http://localhost:5173,...` | Orígenes permitidos (front Vite) |
| `OPHIR_GRAPH_SEED` | — | Ruta a JSON de aristas para sembrar el grafo al hacer `init-db` |
| `OPHIR_SECRET_KEY` | dev | Clave de firma (cambiar en prod) |

## Endpoints

### Salud

- `GET /api/health` → `{"status":"ok","service":"ophir-api","version":"0.1.0"}`

### Sincronización (notas + resaltados)

Requiere header `X-Device-Id` (identificador opaco que genera el cliente).

- `GET /api/sync` → estado consolidado del dispositivo:
  ```json
  { "notes": [ ... ], "highlights": [ ... ], "server_time": "..." }
  ```
- `POST /api/sync` → recibe un batch y devuelve el estado consolidado
  (last-write-wins por nota y por resaltado):
  ```json
  {
    "notes": [ { "id","title","body","created","updated" } ],
    "highlights": [ { "ref","color","updated_at" } ]
  }
  ```

Los resaltados usan la referencia canónica (`"rom.8.29"`) con `color`, el
mismo shape de `lib/highlights.js` del front.

### Grafo de referencias cruzadas (CTE recursiva)

- `GET /api/references/neighbors?ref=isa.53.5&depth=2` → aristas del vecindario
  a N saltos en ambas direcciones:
  ```json
  { "root": "isa.53.5", "maxdepth": 2,
    "edges": [ { "src","dst","type","depth" } ] }
  ```

La consulta usa `WITH RECURSIVE` (soportado por SQLite **y** MySQL 8+).

## Pruebas

```powershell
$env:PYTHONPATH="<ophir>\apps\api"
python -m pytest tests -q
```

5/5 pasan (salud, sync pull/push, last-write-wins y la CTE de vecindario).
