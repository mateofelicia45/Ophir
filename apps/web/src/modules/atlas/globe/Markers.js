import * as THREE from 'three';

const MARKER_COLORS = {
  Ciudad: 0xc8a446,
  Montaña: 0x6b8e23,
  Río: 0x4a90d9,
  Desierto: 0xd4a060,
  Templo: 0xcd5c5c,
};

const DEFAULT_COLOR = 0x88aacc;
const GOLD = 0xc8a446;

// Encogimiento suave entre pines individuales muy cercanos en pantalla
const DENSITY_THRESHOLD_PX = 26;
const MIN_DENSITY_FACTOR = 0.5;

// Escala según distancia de cámara: lejos = puntitos, cerca = pines completos
const CAM_NEAR = 7;
const CAM_FAR = 24;
const ZOOM_SHRINK = 0.68;

// Clustering en espacio de pantalla
const CLUSTER_RADIUS_PX = 42;
const CLUSTER_MIN_POINTS = 3;
const GLOBE_RADIUS = 5;

function directionToLatLng(dir) {
  const r = dir.length() || 1;
  const latitude = 90 - (Math.acos(dir.y / r) * 180) / Math.PI;
  let longitude = (Math.atan2(dir.z, -dir.x) * 180) / Math.PI - 180;
  longitude = ((longitude + 540) % 360) - 180;
  return { latitude, longitude };
}

export function categoryColor(category) {
  return MARKER_COLORS[category] || DEFAULT_COLOR;
}

export default class MarkerManager {
  constructor(globe) {
    this.globe = globe;
    this.markers = new Map();
    this.pulsePhase = 0;
    this.selectedId = null;
    this._zoomFactor = 1;
    this._clusterGroups = [];
    this._signature = '';
    this._targets = [];
    this._filterIds = null;
  }

  createMarkers(locations) {
    this.globe.clearMarkers();
    this.markers.clear();
    this.selectedId = null;
    this._signature = '';
    this._clearClusters();

    // Jitter determinista solo para coordenadas exactamente duplicadas:
    // separa los pines unos pocos km para que sean distinguibles.
    const seen = new Map();
    for (const loc of locations) {
      const key = `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;
      const occurrence = seen.get(key) || 0;
      seen.set(key, occurrence + 1);

      let jitter = null;
      if (occurrence > 0) {
        const angle = occurrence * 2.39996;
        const radiusDeg = 0.04 + occurrence * 0.02;
        jitter = {
          latitude: loc.latitude + Math.cos(angle) * radiusDeg,
          longitude: loc.longitude + Math.sin(angle) * radiusDeg,
        };
      }

      const markerSrc = jitter
        ? { ...loc, latitude: jitter.latitude, longitude: jitter.longitude }
        : loc;
      const marker = this._createMarker(markerSrc);
      this.globe.addToScene(marker);
      this.markers.set(loc.id, { marker, data: loc, jitter, density: 1 });
    }

    this._startPulse();
    this._updateClusters();
  }

  getTargets() {
    return this._targets;
  }

  _createMarker({ latitude, longitude, category }) {
    const pos = this.globe.latLngToPosition(latitude, longitude);
    const color = MARKER_COLORS[category] || DEFAULT_COLOR;

    // Pin orientado perpendicular a la superficie: eje +Y local = normal exterior
    const group = new THREE.Group();
    group.position.copy(pos);
    group.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      pos.clone().normalize()
    );

    // Base cónica: punta clavada en y=0, cuerpo hacia arriba
    const PIN_HEIGHT = 0.16;
    const stemGeo = new THREE.ConeGeometry(0.04, PIN_HEIGHT, 10);
    const stemMat = new THREE.MeshPhongMaterial({ color, shininess: 40 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.rotation.x = Math.PI;
    stem.position.y = PIN_HEIGHT / 2;
    group.add(stem);

    // Cabeza esférica del pin
    const headGeo = new THREE.SphereGeometry(0.06, 14, 14);
    const headMat = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      shininess: 30,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = PIN_HEIGHT * 0.92;
    group.add(head);

    group.userData = { pulseMat: headMat };
    return group;
  }

  _startPulse() {
    if (this._pulseInterval) clearInterval(this._pulseInterval);
    this._pulseInterval = setInterval(() => {
      if (this.globe.disposed) return;
      this.pulsePhase = (this.pulsePhase + 0.05) % (Math.PI * 2);
      for (const [, { marker }] of this.markers) {
        if (marker.userData.pulseMat && marker.visible) {
          marker.userData.pulseMat.emissiveIntensity =
            0.4 + Math.sin(this.pulsePhase) * 0.18;
        }
      }
      this._updateClusters();
    }, 50);
  }

  _updateClusters() {
    const globe = this.globe;
    if (!globe.container.isConnected || globe.disposed) return;

    const camDist = globe.camera.position.length();
    const zoomT = Math.min(
      1,
      Math.max(0, (camDist - CAM_NEAR) / (CAM_FAR - CAM_NEAR))
    );
    this._zoomFactor = 1 - zoomT * ZOOM_SHRINK;

    // Proyección de todos los pines a espacio de pantalla
    const pts = [];
    for (const [id, entry] of this.markers) {
      if (this._filterIds && !this._filterIds.has(id)) continue;
      const src = entry.jitter || entry.data;
      const s = globe.latLngToScreen(src.latitude, src.longitude);
      if (!s || s.behindCamera) continue;
      pts.push({ id, x: s.x, y: s.y });
    }

    // El pin seleccionado nunca se agrupa
    const pool = [];
    const forcedSingles = [];
    for (const p of pts) {
      if (p.id === this.selectedId) forcedSingles.push(p);
      else pool.push(p);
    }

    // Aglomeración greedy por proximidad en pantalla
    const groups = [];
    for (const p of pool) {
      let best = null;
      let bestD = Infinity;
      for (const g of groups) {
        const d = Math.hypot(p.x - g.x, p.y - g.y);
        if (d < bestD) {
          bestD = d;
          best = g;
        }
      }
      if (best && bestD <= CLUSTER_RADIUS_PX) {
        best.points.push(p);
        best.cx = (best.cx * (best.points.length - 1) + p.x) / best.points.length;
        best.cy = (best.cy * (best.points.length - 1) + p.y) / best.points.length;
      } else {
        groups.push({ cx: p.x, cy: p.y, points: [p] });
      }
    }

    const multiDefs = groups.filter(
      (g) => g.points.length >= CLUSTER_MIN_POINTS
    );
    const singles = [
      ...forcedSingles,
      ...groups
        .filter((g) => g.points.length < CLUSTER_MIN_POINTS)
        .flatMap((g) => g.points),
    ];

    // Densidad entre pines individuales muy cercanos (encogimiento suave)
    for (const p of singles) {
      let nearest = Infinity;
      for (const q of singles) {
        if (q === p) continue;
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < nearest) nearest = d;
      }
      const entry = this.markers.get(p.id);
      entry.density =
        nearest === Infinity
          ? 1
          : Math.max(
              MIN_DENSITY_FACTOR,
              Math.min(1, nearest / DENSITY_THRESHOLD_PX)
            );
    }

    // Reconstruir mallas de clusters solo si cambió la composición
    const signature = multiDefs
      .map((g) => g.points.map((p) => p.id).sort().join('+'))
      .sort()
      .join('|');
    if (signature !== this._signature) {
      this._signature = signature;
      this._rebuildClusterMeshes(multiDefs);
    }

    // Visibilidad y escala final
    const singleIds = new Set(singles.map((p) => p.id));
    for (const [id, entry] of this.markers) {
      entry.marker.visible = singleIds.has(id);
      this._applyScale(entry);
    }

    // Targets para raycasting: pines individuales + clusters
    this._targets = [];
    for (const id of singleIds) {
      const entry = this.markers.get(id);
      this._targets.push({ mesh: entry.marker, data: entry.data, cluster: null });
    }
    for (const g of this._clusterGroups) {
      this._targets.push(g.targetRef);
    }
  }

  _rebuildClusterMeshes(defs) {
    this._clearClusters();

    for (const def of defs) {
      const members = def.points.map((p) => this.markers.get(p.id).data);

      // Centro geográfico: promedio de los vectores 3D de los miembros
      let ax = 0;
      let ay = 0;
      let az = 0;
      for (const m of members) {
        const v = this.globe.latLngToPosition(m.latitude, m.longitude);
        ax += v.x;
        ay += v.y;
        az += v.z;
      }
      const dir = new THREE.Vector3(ax, ay, az).normalize();

      const group = new THREE.Group();
      group.position.copy(dir.clone().multiplyScalar(GLOBE_RADIUS));

      // Punto ancla sobre la superficie
      const dotGeo = new THREE.SphereGeometry(0.035, 10, 10);
      const dotMat = new THREE.MeshBasicMaterial({ color: GOLD });
      group.add(new THREE.Mesh(dotGeo, dotMat));

      // Esfera invisible para raycasting
      const hitGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(hitGeo, hitMat));

      // Etiqueta con el número de lugares
      const sprite = this._makeCountSprite(members.length);
      sprite.position.copy(dir.clone().multiplyScalar(0.28));
      group.add(sprite);

      this.globe.addToScene(group);

      const targetRef = {
        mesh: group,
        data: null,
        cluster: {
          ...directionToLatLng(dir),
          names: members.map((m) => m.name),
        },
      };

      this._clusterGroups.push({ group, targetRef });
    }
  }

  _makeCountSprite(count) {
    const size = 96;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(19, 26, 36, 0.92)';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#c8a446';
    ctx.stroke();

    ctx.fillStyle = '#e8e4d8';
    ctx.font = `600 ${count > 99 ? 36 : 44}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(count), size / 2, size / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(0.55);
    return sprite;
  }

  _clearClusters() {
    for (const { group } of this._clusterGroups) {
      group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
      this.globe.removeFromScene(group);
    }
    this._clusterGroups = [];
  }

  _applyScale(entry) {
    const isSelected = entry.data.id === this.selectedId;
    const base = this.selectedId ? (isSelected ? 1.8 : 0.6) : 1;
    entry.marker.scale.setScalar(base * entry.density * this._zoomFactor);
  }

  highlightById(id) {
    this.selectedId = id;
    for (const [, entry] of this.markers) {
      this._applyScale(entry);
    }
  }

  resetHighlight() {
    this.selectedId = null;
    for (const [, entry] of this.markers) {
      this._applyScale(entry);
    }
  }

  showOnly(ids) {
    this._filterIds = new Set(ids);
    this._updateClusters();
  }

  showAll() {
    this._filterIds = null;
    this._updateClusters();
  }

  dispose() {
    if (this._pulseInterval) {
      clearInterval(this._pulseInterval);
      this._pulseInterval = null;
    }
    this._clearClusters();
    this.globe.clearMarkers();
    this.markers.clear();
  }
}
