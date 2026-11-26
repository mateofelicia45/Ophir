/**
 * BibleService
 * Gestiona la obtención de textos bíblicos desde diversas fuentes:
 * 1. Archivos JSON locales (Dominio Público).
 * 2. APIs externas (Versiones con Copyright).
 */

const LOCAL_VERSIONS = {
  rv1909: () => import('@data/bibles/rv1909.json'),
  kjv: () => import('@data/bibles/kjv.json'),
  web: () => import('@data/bibles/web.json'),
  onbv: () => import('@data/bibles/onbv.json'),
  v1602: () => import('@data/bibles/v1602.json'),
};

const REMOTE_VERSIONS = {
  nvi: { name: 'Nueva Versión Internacional', lang: 'es', provider: 'api_bible' },
  nbla: { name: 'Nueva Biblia de las Américas', lang: 'es', provider: 'api_bible' },
  rv60: { name: 'Reina Valera 1960', lang: 'es', provider: 'api_bible' },
  ntv: { name: 'Nueva Traducción Viviente', lang: 'es', provider: 'api_bible' },
  dhh: { name: 'Dios Habla Hoy', lang: 'es', provider: 'api_bible' },
};

const cache = new Map();

export const BibleService = {
  /**
   * Retorna la metadata de todas las versiones disponibles.
   */
  getAllVersions() {
    const locals = Object.keys(LOCAL_VERSIONS).map(id => ({
      id,
      name: 'Local Version', // metadata will be refined in bibles.js
      lang: 'es',
      isLocal: true
    }));

    const remotes = Object.entries(REMOTE_VERSIONS).map(([id, meta]) => ({
      id,
      ...meta,
      isLocal: false
    }));

    return [...locals, ...remotes];
  },

  /**
   * Carga una versión completa (solo para locales).
   */
  async loadFullVersion(id) {
    if (LOCAL_VERSIONS[id]) {
      if (!cache.has(id)) {
        const mod = await LOCAL_VERSIONS[id]();
        cache.set(id, mod.default);
      }
      return cache.get(id);
    }

    // Para versiones remotas, no cargamos "todo el libro" de golpe
    // sino que el lector pedirá el capítulo específico.
    return null;
  },

  /**
   * Obtiene el texto de un capítulo específico.
   * Soporta tanto datos locales como llamadas a API.
   */
  async getChapter(versionId, bookId, chapter) {
    // 1. Intentar obtener de caché local
    const localData = cache.get(versionId);
    if (localData && localData.books[bookId]?.[chapter - 1]) {
      return localData.books[bookId][chapter - 1];
    }

    // 2. Si es local pero no está en caché, cargarla
    if (LOCAL_VERSIONS[versionId]) {
      const data = await this.loadFullVersion(versionId);
      return data.books[bookId]?.[chapter - 1] || null;
    }

    // 3. Si es remota, llamar a la API
    return this.fetchRemoteChapter(versionId, bookId, chapter);
  },

  async fetchRemoteChapter(versionId, bookId, chapter) {
    console.log(`Fetching remote chapter: ${versionId} - ${bookId}:${chapter}`);

    // Aquí implementaremos la llamada real a la API.
    // Por ahora, simulamos un delay y retornamos un mensaje para verificar que funciona.
    await new Promise(resolve => setTimeout(resolve, 300));

    // NOTA: Para implementar NVI, NBLA, etc., usaremos la API de api.bible
    // que requiere un API Key. Por ahora retornamos un mockup.
    return [
      `[Versión ${versionId}] Este es un texto simulado del capítulo ${chapter} del libro ${bookId}.`,
      `Para habilitar el texto real de ${REMOTE_VERSIONS[versionId]?.name}, configuraremos la API Key en el servicio.`,
      `El sistema ya está preparado para manejar respuestas asíncronas.`
    ];
  },

  getCachedVersion(id) {
    return cache.get(id) || null;
  }
};
