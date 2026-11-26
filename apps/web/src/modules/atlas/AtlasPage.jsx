import { useEffect, useMemo, useRef, useState } from 'react';
import Globe from './globe/Globe.js';
import MarkerManager, { categoryColor } from './globe/Markers.js';
import { loadAtlasData } from './atlasData.js';
import LocationPanel from './LocationPanel.jsx';

const STORIES = {
  mefiboset: {
    title: 'Mefiboset (2 Samuel 4:4; 5:1-5; 9:1-13)',
    description: 'Historia completa: caída en Jezreel, reinado de David en Hebrón/Jerusalén, bondad a Mefiboset',
    locations: ['jezreel', 'hebron', 'jerusalem', 'lo-debar', 'mahanaim'],
    color: '#c8a446',
  },
  abraham: {
    title: 'Abraham: Ur a Canaán',
    description: 'El viaje del patriarca (Génesis 11-13)',
    locations: ['ur', 'harran', 'sichem', 'belen', 'hebron', 'mamre'],
    color: '#6b8e23',
  },
  jesus_ministerio: {
    title: 'Ministerio de Jesús en Galilea',
    description: 'Lugares clave del ministerio galileo',
    locations: ['nazaret', 'cafarnaum', 'belen', 'mar-galilea', 'monte-carmelo', 'monte-olivos'],
    color: '#4a90d9',
  },
  pablo_viajes: {
    title: 'Viajes de Pablo (Hechos 13-28)',
    description: 'Ciudades visitadas en los viajes misioneros',
    locations: ['antioquia-siria', 'tarso', 'chipre', 'pafos', 'perge', 'antioquia-pisidia', 'iconio', 'listra', 'derbe', 'troas', 'filipos', 'tesalonica', 'berea', 'atenas', 'corinto', 'efeso', 'mileto', 'jerusalem', 'cesarea', 'roma'],
    color: '#cd5c5c',
  },
};

function clusterLabel(cluster) {
  const preview = cluster.names.slice(0, 3).join(', ');
  const rest = cluster.names.length - 3;
  return rest > 0 ? `${preview} +${rest} más` : preview;
}

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AtlasPage() {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const globeRef = useRef(null);
  const markersRef = useRef(null);

  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    query: '',
    region: '',
    category: '',
    book: '',
  });
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [activeStory, setActiveStory] = useState(null);
  const [pinned, setPinned] = useState(new Set());
  const [showPinned, setShowPinned] = useState(false);

  function togglePin(locId) {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(locId)) next.delete(locId);
      else next.add(locId);
      return next;
    });
  }

  function clearPins() {
    setPinned(new Set());
  }

  function pinStory(storyKey) {
    const story = STORIES[storyKey];
    if (!story) return;
    setPinned((prev) => new Set([...prev, ...story.locations]));
  }

  function unpinStory(storyKey) {
    const story = STORIES[storyKey];
    if (!story) return;
    setPinned((prev) => {
      const next = new Set(prev);
      story.locations.forEach((id) => next.delete(id));
      return next;
    });
  }

  useEffect(() => {
    const globe = new Globe(containerRef.current);
    const markers = new MarkerManager(globe);
    const atlasData = loadAtlasData();

    globeRef.current = globe;
    markersRef.current = markers;

    markers.createMarkers(atlasData.locations);
    setData(atlasData);
    setReady(true);

    const dom = globe.renderer.domElement;

    const projectMouse = (event) => {
      const rect = dom.getBoundingClientRect();
      globe.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      globe.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      globe.raycaster.setFromCamera(globe.mouse, globe.camera);
    };

    const pickTarget = (event) => {
      projectMouse(event);
      const targets = markersRef.current?.getTargets() || [];
      const meshes = [];
      for (const t of targets) {
        t.mesh.children.forEach((child) => {
          if (child.isMesh) meshes.push(child);
        });
      }
      const hits = globe.raycaster.intersectObjects(meshes);
      if (hits.length === 0) return null;
      const hit = hits[0].object;
      for (const t of targets) {
        if (t.mesh === hit.parent || t.mesh.children.includes(hit)) return t;
      }
      return null;
    };

    const onClick = (event) => {
      const target = pickTarget(event);
      if (!target) return;
      if (target.cluster) {
        // Clic en cluster: acercarse hasta que se abra en sus pines
        setSelected(null);
        markersRef.current.resetHighlight();
        const d = globe.camera.position.length();
        globe.flyTo(
          target.cluster.latitude,
          target.cluster.longitude,
          Math.max(7.8, d * 0.6)
        );
        return;
      }
      selectLocation(target.data);
    };

    const onHover = (event) => {
      const tooltip = tooltipRef.current;
      const target = pickTarget(event);
      if (target && tooltip) {
        tooltip.textContent = target.cluster
          ? clusterLabel(target.cluster)
          : target.data.name;
        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${event.clientY - 10}px`;
        tooltip.classList.add('visible');
        dom.style.cursor = 'pointer';
        return;
      }
      tooltip?.classList.remove('visible');
      dom.style.cursor = 'default';
    };

    dom.addEventListener('click', onClick);
    dom.addEventListener('mousemove', onHover);

    return () => {
      dom.removeEventListener('click', onClick);
      dom.removeEventListener('mousemove', onHover);
      markers.dispose();
      globe.dispose();
      globeRef.current = null;
      markersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, query: searchText.trim() }));
    }, 150);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filtered = useMemo(
    () => (data ? data.getFiltered(filters) : []),
    [data, filters]
  );

  const suggestions = useMemo(
    () =>
      data && filters.query
        ? data.getFiltered({ query: filters.query }).slice(0, 8)
        : [],
    [data, filters.query]
  );

  useEffect(() => {
    if (!ready || !markersRef.current) return;
    const hasFilter =
      filters.query || filters.region || filters.category || filters.book;
    const storyIds = activeStory ? STORIES[activeStory].locations : null;
    const pinnedIds = Array.from(pinned);
    
    if (storyIds) {
      // Modo historia: mostrar solo los lugares de la historia + fijados
      markersRef.current.showOnly([...new Set([...storyIds, ...pinnedIds])]);
    } else if (hasFilter) {
      markersRef.current.showOnly([...new Set([...filtered.map((l) => l.id), ...pinnedIds])]);
    } else if (pinnedIds.length > 0) {
      // Solo fijados: mostrar solo los fijados
      markersRef.current.showOnly(pinnedIds);
    } else {
      markersRef.current.showAll();
    }
  }, [filtered, filters, ready, activeStory, pinned]);

  function selectLocation(loc) {
    setSelected(loc);
    markersRef.current?.highlightById(loc.id);
    globeRef.current?.flyTo(loc.latitude, loc.longitude);
  }

  function closePanel() {
    setSelected(null);
    markersRef.current?.resetHighlight();
  }

  function resetFilters() {
    setSearchText('');
    setFilters({ query: '', region: '', category: '', book: '' });
    setActiveStory(null);
  }

  function selectStory(storyKey) {
    const story = STORIES[storyKey];
    if (!story) return;
    setActiveStory(storyKey);
    setShowStories(false);
    setShowFilters(false);
    setSearchText('');
    setFilters({ query: '', region: '', category: '', book: '' });
    
    // Resaltar el primer lugar de la historia
    const firstLoc = data?.getById(story.locations[0]);
    if (firstLoc) {
      selectLocation(firstLoc);
    }
  }

  function clearStory() {
    setActiveStory(null);
    markersRef.current?.showAll();
    markersRef.current?.resetHighlight();
    setSelected(null);
  }

  function zoom(step) {
    const globe = globeRef.current;
    if (!globe) return;
    const distance = globe.camera.position.length();
    if (step > 0 && distance > 7.5) {
      const dir = globe.camera.position.clone().normalize();
      globe.camera.position.sub(dir.multiplyScalar(1));
    }
    if (step < 0 && distance < 24) {
      const dir = globe.camera.position.clone().normalize();
      globe.camera.position.add(dir.multiplyScalar(1));
    }
  }

  function resetView() {
    globeRef.current?.resetView();
    markersRef.current?.resetHighlight();
    setSelected(null);
  }

  const hasActiveFilter =
    filters.query || filters.region || filters.category || filters.book;

  return (
    <div className="atlas-root">
      <div className="globe-container" ref={containerRef} />

      <div className="atlas-topbar">
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar lugar..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div
            className={`suggestions${suggestions.length > 0 ? ' active' : ''}`}
          >
            {suggestions.map((loc) => (
              <div
                key={loc.id}
                className="suggestion-item"
                onMouseDown={() => {
                  setSearchText('');
                  selectLocation(loc);
                }}
              >
                {loc.name}
                <em>{loc.region}</em>
              </div>
            ))}
          </div>
        </div>
        <button
          className="btn-icon"
          title="Historias bíblicas"
          onClick={() => setShowStories((v) => !v)}
        >
          📖
        </button>
        <button
          className={`btn-icon ${pinned.size > 0 ? 'pinned-active' : ''}`}
          title={`Lugares fijados (${pinned.size})`}
          onClick={() => setShowPinned((v) => !v)}
        >
          📌
        </button>
        <button
          className="btn-icon"
          title="Filtros"
          onClick={() => setShowFilters((v) => !v)}
        >
          ⚙
        </button>
      </div>

      {showStories && data && (
        <div className="stories-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3>Historias bíblicas</h3>
            <button className="btn-icon" onClick={() => setShowStories(false)}>
              ✕
            </button>
          </div>
          <div className="stories-list">
            {Object.entries(STORIES).map(([key, story]) => {
              const allPinned = story.locations.every((id) => pinned.has(id));
              const somePinned = story.locations.some((id) => pinned.has(id));
              return (
                <div key={key} className="story-row">
                  <button
                    className={`story-btn ${activeStory === key ? 'active' : ''}`}
                    onClick={() => selectStory(key)}
                    style={{ borderLeftColor: story.color, flex: 1 }}
                  >
                    <div className="story-title">{story.title}</div>
                    <div className="story-desc">{story.description}</div>
                    <div className="story-loc-count">{story.locations.length} lugares</div>
                  </button>
                  <button
                    className={`story-pin-btn ${allPinned ? 'pinned' : somePinned ? 'partial' : ''}`}
                    onClick={(e) => { e.stopPropagation(); allPinned ? unpinStory(key) : pinStory(key); }}
                    title={allPinned ? 'Desfijar todos' : 'Fijar todos los lugares de esta historia'}
                  >
                    📌
                  </button>
                </div>
              );
            })}
          </div>
          {activeStory && (
            <button className="btn-reset" onClick={clearStory} style={{ marginTop: '12px' }}>
              Limpiar historia
            </button>
          )}
        </div>
      )}

      {showPinned && data && pinned.size > 0 && (
        <div className="pinned-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3>Lugares fijados ({pinned.size})</h3>
            <button className="btn-icon" onClick={() => setShowPinned(false)}>
              ✕
            </button>
          </div>
          <div className="pinned-list">
            {Array.from(pinned).map((id) => {
              const loc = data.getById(id);
              return loc ? (
                <div key={loc.id} className="pinned-item">
                  <span
                    className="pinned-item-dot"
                    style={{
                      background: `#${categoryColor(loc.category)
                        .toString(16)
                        .padStart(6, '0')}`,
                    }}
                  />
                  <div className="pinned-item-info">
                    <div className="pinned-item-name">{loc.name}</div>
                    <div className="pinned-item-region">{loc.region || ''}</div>
                  </div>
                  <button
                    className="pinned-item-unpin"
                    onClick={(e) => { e.stopPropagation(); togglePin(loc.id); }}
                    title="Desfijar"
                  >
                    📌
                  </button>
                </div>
              ) : null;
            })}
          </div>
          {pinned.size >= 2 && (
            <div className="pinned-distances">
              <h4>Distancias entre fijados</h4>
              {(() => {
                const pinnedLocs = Array.from(pinned).map((id) => data.getById(id)).filter(Boolean);
                const rows = [];
                for (let i = 0; i < pinnedLocs.length; i++) {
                  for (let j = i + 1; j < pinnedLocs.length; j++) {
                    const a = pinnedLocs[i];
                    const b = pinnedLocs[j];
                    const dist = haversine(a.latitude, a.longitude, b.latitude, b.longitude);
                    rows.push(`${a.name} ↔ ${b.name}: ${dist.toFixed(1)} km`);
                  }
                }
                return rows.map((r, idx) => <div key={idx} className="distance-row">{r}</div>);
              })()}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn-reset" onClick={clearPins} style={{ flex: 1 }}>
              Desfijar todos
            </button>
            <button className="btn-reset" onClick={() => setShowPinned(false)} style={{ flex: 1 }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showFilters && data && (
        <div className="filters-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>Filtros</h3>
            <button className="btn-icon" onClick={() => setShowFilters(false)}>
              ✕
            </button>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-region">Región</label>
            <select
              id="filter-region"
              value={filters.region}
              onChange={(e) =>
                setFilters((f) => ({ ...f, region: e.target.value }))
              }
            >
              <option value="">Todas las regiones</option>
              {data.regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-category">Categoría</label>
            <select
              id="filter-category"
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value }))
              }
            >
              <option value="">Todas las categorías</option>
              {data.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-book">Libro de la Biblia</label>
            <select
              id="filter-book"
              value={filters.book}
              onChange={(e) =>
                setFilters((f) => ({ ...f, book: e.target.value }))
              }
            >
              <option value="">Todos los libros</option>
              {data.books.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-reset" onClick={resetFilters}>
            Restablecer filtros
          </button>
        </div>
      )}

      {showList && (
        <div className="location-list">
          <div className="list-header">
            <h3>Lugares</h3>
            <span className="list-count">
              {filtered.length} de {data ? data.locations.length : 0}
            </span>
            <button
              className="btn-icon"
              style={{ marginLeft: 'auto' }}
              onClick={() => setShowList(false)}
            >
              ✕
            </button>
          </div>
          <div className="list-items">
            {filtered.map((loc) => (
              <div
                key={loc.id}
                className="list-item"
                onClick={() => selectLocation(loc)}
              >
                <span
                  className="list-item-dot"
                  style={{
                    background: `#${categoryColor(loc.category)
                      .toString(16)
                      .padStart(6, '0')}`,
                  }}
                />
                <div>
                  <div className="list-item-name">{loc.name}</div>
                  <div className="list-item-region">{loc.region || ''}</div>
                </div>
                <span className="list-item-cat">{loc.category || ''}</span>
                <button
                  className={`pin-btn ${pinned.has(loc.id) ? 'pinned' : ''}`}
                  onClick={(e) => { e.stopPropagation(); togglePin(loc.id); }}
                  title={pinned.has(loc.id) ? 'Desfijar' : 'Fijar'}
                >
                  📌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        className="btn-list-toggle"
        onClick={() => setShowList((v) => !v)}
      >
        ☰ Lugares{hasActiveFilter ? ` (${filtered.length})` : ''}
      </button>

      <div className="map-controls">
        <button className="btn-control" title="Acercar" onClick={() => zoom(1)}>
          +
        </button>
        <button
          className="btn-control"
          title="Alejar"
          onClick={() => zoom(-1)}
        >
          −
        </button>
        <button className="btn-control" title="Vista inicial" onClick={resetView}>
          ⟲
        </button>
      </div>

      <LocationPanel location={selected} onClose={closePanel} />

      {showHelp && (
        <div className="help-overlay" onClick={(e) => e.target === e.currentTarget && setShowHelp(false)}>
          <div className="help-modal">
            <div className="help-header">
              <h2>Cómo usar el Atlas</h2>
              <button className="btn-icon" onClick={() => setShowHelp(false)}>
                ✕
              </button>
            </div>
            <div className="help-body">
              <div className="help-item">
                🖱 <strong>Rotar globo:</strong> arrastrá con el mouse
              </div>
              <div className="help-item">
                🔍 <strong>Zoom:</strong> rueda del mouse o botones +/−
              </div>
              <div className="help-item">
                📍 <strong>Ver lugar:</strong> clic en un marcador
              </div>
              <div className="help-item">
                🔎 <strong>Buscar:</strong> escribí en la barra superior
              </div>
              <div className="help-item">
                📋 <strong>Lista:</strong> botón ☰ Lugares
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="tooltip" ref={tooltipRef} />

      {!ready && (
        <div className="atlas-loading">
          <p>Cargando Atlas Bíblico...</p>
        </div>
      )}
    </div>
  );
}
