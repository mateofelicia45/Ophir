import { BibleService } from '../../lib/bibleService.js';

export const VERSIONS = [
  { id: 'rv1909', abbr: 'RV09', name: 'Reina Valera 1909', lang: 'es' },
  { id: 'onbv', abbr: 'NBV', name: 'Nueva Biblia Viva (Biblica Open)', lang: 'es' },
  { id: 'v1602', abbr: 'V16P', name: 'Valera 1602 Purificada', lang: 'es' },
  { id: 'kjv', abbr: 'KJV', name: 'King James Version', lang: 'en' },
  { id: 'web', abbr: 'WEB', name: 'World English Bible', lang: 'en' },
  { id: 'nvi', abbr: 'NVI', name: 'Nueva Versión Internacional', lang: 'es' },
  { id: 'nbla', abbr: 'NBLA', name: 'Nueva Biblia de las Américas', lang: 'es' },
  { id: 'rv60', abbr: 'RV60', name: 'Reina Valera 1960', lang: 'es' },
  { id: 'ntv', abbr: 'NTV', name: 'Nueva Traducción Viviente', lang: 'es' },
  { id: 'dhh', abbr: 'DHH', name: 'Dios Habla Hoy', lang: 'es' },
];

export async function loadVersion(id) {
  return await BibleService.loadFullVersion(id);
}

export function getCachedVersion(id) {
  return BibleService.getCachedVersion(id);
}

export async function getChapterText(versionId, bookId, chapter) {
  return await BibleService.getChapter(versionId, bookId, chapter);
}
