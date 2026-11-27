// Etiquetas de la interfaz copiadas del prototipo (Main.dc.html: TYPES, Q_LABEL, Q_SHORT).
export const TYPES = [
  { id: 'ciudad', label: 'Ciudades y asentamientos', short: 'Ciudad' },
  { id: 'sitio', label: 'Sitios y lugares de acontecimientos', short: 'Sitio' },
  { id: 'region', label: 'Regiones y provincias', short: 'Región' },
  { id: 'reino', label: 'Reinos, pueblos e imperios', short: 'Reino o pueblo' },
  { id: 'montana', label: 'Montañas y cordilleras', short: 'Montaña' },
  { id: 'rio', label: 'Ríos y torrentes', short: 'Río' },
  { id: 'fuente', label: 'Fuentes, pozos y estanques', short: 'Fuente' },
  { id: 'mar', label: 'Mares y lagos', short: 'Mar o lago' },
  { id: 'desierto', label: 'Desiertos', short: 'Desierto' },
  { id: 'valle', label: 'Valles y llanuras', short: 'Valle' },
  { id: 'isla', label: 'Islas', short: 'Isla' },
  { id: 'camino', label: 'Caminos y rutas', short: 'Camino' },
];
export const TYPE_BY = Object.fromEntries(TYPES.map((t) => [t.id, t]));
export const typeShort = (t) => (TYPE_BY[t] ? TYPE_BY[t].short : '');

export const Q_LABEL = {
  segura: 'Identificación segura',
  probable: 'Identificación probable',
  discutida: 'Identificación discutida',
  desconocida: 'Ubicación desconocida',
};
export const Q_SHORT = { segura: 'Segura', probable: 'Probable', discutida: 'Discutida', desconocida: 'Desconocida' };

export const plural = (n, s, p) => n + ' ' + (n === 1 ? s : p);
