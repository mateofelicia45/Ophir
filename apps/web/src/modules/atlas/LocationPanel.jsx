import { useEffect } from 'react';

function confidenceClass(level) {
  return { Alta: 'high', Media: 'medium', Baja: 'low' }[level] || 'medium';
}

function bibleGatewayUrl(verse) {
  const query = verse.replace(/\s+/g, '+');
  return `https://www.biblegateway.com/passage/?search=${query}&version=RVR1960`;
}

export default function LocationPanel({ location, onClose }) {
  useEffect(() => {
    if (!location) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [location, onClose]);

  if (!location) return null;

  return (
    <div className="info-panel">
      <div className="panel-header">
        <h2>{location.name}</h2>
        <button className="btn-icon" onClick={onClose} title="Cerrar">
          ✕
        </button>
      </div>
      <div className="panel-body">
        {location.nameHebrew && (
          <div className="panel-hebrew">{location.nameHebrew}</div>
        )}

        <div className="panel-section">
          <h4>Región</h4>
          <p>{location.region || 'No especificada'}</p>
        </div>

        <div className="panel-section">
          <h4>Categoría</h4>
          <p>
            <span className="badge badge-category">
              {location.category || 'No especificada'}
            </span>
          </p>
        </div>

        <div className="panel-section">
          <h4>Confianza de ubicación</h4>
          <p>
            <span className={`badge badge-${confidenceClass(location.confidence)}`}>
              {location.confidence || 'No especificada'}
            </span>
          </p>
        </div>

        <div className="panel-section">
          <h4>Coordenadas</h4>
          <p>
            {location.latitude.toFixed(4)}° N,{' '}
            {Math.abs(location.longitude).toFixed(4)}°{' '}
            {location.longitude >= 0 ? 'E' : 'O'}
          </p>
        </div>

        {location.description && (
          <div className="panel-section">
            <h4>Descripción</h4>
            <p>{location.description}</p>
          </div>
        )}

        {location.bibleVerses?.length > 0 && (
          <div className="panel-section">
            <h4>Citas bíblicas</h4>
            <p>
              {location.bibleVerses.map((verse) => (
                <a
                  key={verse}
                  className="verse-chip"
                  href={bibleGatewayUrl(verse)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {verse}
                </a>
              ))}
            </p>
          </div>
        )}

        {location.bibleLink && (
          <div className="panel-section">
            <a
              className="panel-link"
              href={location.bibleLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Leer en BibleGateway →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
