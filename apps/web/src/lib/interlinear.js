// Interlineal: carga perezosa de los textos originales (OSHB hebreo /
// SBLGNT griego) + decodificadores de morfología a etiquetas en español.
const SOURCES = {
  hb: () => import('@data/interlinear/hebrew.json'),
  gr: () => import('@data/interlinear/greek.json'),
};

const STRONGS = {
  hb: () => import('@data/interlinear/strongs-h.json'),
  gr: () => import('@data/interlinear/strongs-g.json'),
};

const INDEXES = {
  hb: () => import('@data/interlinear/strongs-h-index.json'),
  gr: () => import('@data/interlinear/strongs-g-index.json'),
};

const cache = new Map();
const strongsCache = new Map();
const indexCache = new Map();

export async function loadOriginal(testament) {
  if (!SOURCES[testament]) throw new Error(`Testamento desconocido: ${testament}`);
  if (!cache.has(testament)) {
    const mod = await SOURCES[testament]();
    cache.set(testament, mod.default);
  }
  return cache.get(testament);
}

export async function loadStrongs(testament) {
  if (!STRONGS[testament]) return {};
  if (!strongsCache.has(testament)) {
    const mod = await STRONGS[testament]();
    strongsCache.set(testament, mod.default);
  }
  return strongsCache.get(testament);
}

export function getCachedOriginal(testament) {
  return cache.get(testament) || null;
}

export function getCachedStrongs(testament) {
  return strongsCache.get(testament) || null;
}

export async function loadStrongIndex(testament) {
  if (!INDEXES[testament]) return {};
  if (!indexCache.has(testament)) {
    const mod = await INDEXES[testament]();
    indexCache.set(testament, mod.default);
  }
  return indexCache.get(testament);
}

export function getCachedStrongIndex(testament) {
  return indexCache.get(testament) || null;
}

// ---------- Hebreo (códigos OSHB) ----------
const HB_POS = {
  A: 'adjetivo',
  C: 'conjunción',
  D: 'adverbio',
  I: 'interjección',
  N: 'sustantivo',
  P: 'preposición',
  R: 'pronombre',
  T: 'partícula',
  V: 'verbo',
  S: 'sufijo',
};

const HB_GENDER = { m: 'masc.', f: 'fem.', b: 'ambos', d: 'dual' };
const HB_NUMBER = { s: 'sing.', p: 'plur.', d: 'dual' };
const HB_STATE = { a: 'absoluto', c: 'constructo', d: 'determinado' };

const HB_STEM = {
  q: 'qal',
  N: 'nifal',
  p: 'piel',
  P: 'pual',
  h: 'hiphil',
  H: 'hofal',
  t: 'hithpael',
  o: 'polel',
  O: 'polal',
  r: 'pilpel',
  R: 'polpal',
  f: 'hitpolel',
  F: 'hitpalel',
  i: 'pealal',
  v: 'pilel',
  u: 'pulal',
};

const HB_CONJ = {
  a: 'perfecto (qatal)',
  z: 'consec. imperfecto (wayyiqtol)',
  y: 'imperfecto (yiqtol)',
  h: 'imperativo',
  j: 'yusivo',
  i: 'cohortativo',
  v: 'consec. perfecto (veqatal)',
  r: 'infinitivo constructo',
  s: 'infinitivo absoluto',
  m: 'participio',
  q: 'participio (2ª forma)',
  p: 'participio pasivo',
  c: 'infinitivo constructo (2ª forma)',
};

const HB_PERSON = { 1: '1ª pers.', 2: '2ª pers.', 3: '3ª pers.' };

const HB_PARTICLE = { d: 'artículo definido', i: 'interrogativa', n: 'negación' };

function decodeHbSegment(code) {
  const out = [];
  const pos = HB_POS[code[0]];
  if (!pos) return code;
  out.push(pos);
  let rest = code.slice(1);
  if (code[0] === 'N') {
    if (rest.startsWith('c')) { out.push('común'); rest = rest.slice(1); }
    else if (rest.startsWith('p')) { out.push('propio'); rest = rest.slice(1); }
    else if (rest.startsWith('S')) { out.push('con sufijos'); rest = rest.slice(1); }
    const g = HB_GENDER[rest[0]];
    if (g) { out.push(g); rest = rest.slice(1); }
    const n = HB_NUMBER[rest[0]];
    if (n) { out.push(n); rest = rest.slice(1); }
    const st = HB_STATE[rest[0]];
    if (st) { rest = rest.slice(1); out.push(st); }
  } else if (code[0] === 'V') {
    const stem = HB_STEM[rest[0]];
    if (stem) { out.push(stem); rest = rest.slice(1); }
    const conj = HB_CONJ[rest[0]];
    if (conj) { out.push(conj); rest = rest.slice(1); }
    const p = HB_PERSON[rest[0]];
    if (p) { out.push(p); rest = rest.slice(1); }
    const g = HB_GENDER[rest[0]];
    if (g) { out.push(g); rest = rest.slice(1); }
    const n = HB_NUMBER[rest[0]];
    if (n) { out.push(n); rest = rest.slice(1); }
  } else if (code[0] === 'T') {
    const pt = HB_PARTICLE[rest[0]];
    if (pt) { out.push(pt); rest = rest.slice(1); }
  } else if (code[0] === 'P' && rest.startsWith('d')) {
    rest = rest.slice(1);
    out.push('con artículo');
  } else if (code[0] === 'R') {
    const g = HB_GENDER[rest[0]];
    if (g) { out.push(g); rest = rest.slice(1); }
    const n = HB_NUMBER[rest[0]];
    if (n) { out.push(n); rest = rest.slice(1); }
    const p = HB_PERSON[rest[0]];
    if (p) { out.push(p); rest = rest.slice(1); }
  } else if (code[0] === 'A') {
    const g = HB_GENDER[rest[0]];
    if (g) { out.push(g); rest = rest.slice(1); }
    const n = HB_NUMBER[rest[0]];
    if (n) { out.push(n); rest = rest.slice(1); }
    const st = HB_STATE[rest[0]];
    if (st) { out.push(st); rest = rest.slice(1); }
  } else if (code[0] === 'S') {
    const p = HB_PERSON[rest[0]];
    if (p) { out.push(p); rest = rest.slice(1); }
    const g = HB_GENDER[rest[0]];
    if (g) { out.push(g); rest = rest.slice(1); }
    const n = HB_NUMBER[rest[0]];
    if (n) { out.push(n); rest = rest.slice(1); }
  }
  if (rest) out.push(rest);
  return out.join(' · ');
}

export function decodeHebrewMorph(morph) {
  if (!morph) return '';
  return morph
    .split('/')
    .map((seg, i) => (morph.split('/').length > 1 ? `[${i + 1}] ` : '') + decodeHbSegment(seg))
    .join(' | ');
}

// ---------- Griego (POS + código de análisis morphgnt / Robinson) ----------
const GR_POS = {
  'N-': 'sustantivo',
  'A-': 'adjetivo',
  RA: 'artículo',
  RP: 'pronombre personal',
  RD: 'pronombre demostrativo',
  RI: 'pronombre interrog./indef.',
  RR: 'pronombre relativo',
  RX: 'pronombre reflexivo/recíproco',
  'C-': 'conjunción',
  'D-': 'adverbio',
  'P-': 'preposición',
  'V-': 'verbo',
  'I-': 'interjección',
  'X-': 'partícula',
};

const GR_PARSE = [
  {
    label: 'persona',
    map: { 1: '1ª', 2: '2ª', 3: '3ª' },
  },
  {
    label: 'tiempo',
    map: {
      P: 'presente',
      I: 'imperfecto',
      F: 'futuro',
      A: 'aoristo',
      X: 'perfecto',
      Y: 'pluscuamperfecto',
    },
  },
  {
    label: 'voz',
    map: { A: 'activa', M: 'media', P: 'pasiva' },
  },
  {
    label: 'modo',
    map: {
      I: 'indicativo',
      D: 'imperativo',
      S: 'subjuntivo',
      O: 'optativo',
      N: 'infinitivo',
      P: 'participio',
    },
  },
  {
    label: 'caso',
    map: { N: 'nom.', G: 'gen.', D: 'dat.', A: 'acus.', V: 'voc.' },
  },
  { label: 'número', map: { S: 'sing.', P: 'plur.' } },
  { label: 'género', map: { M: 'masc.', F: 'fem.', N: 'neutro' } },
  { label: 'grado', map: { C: 'comparativo', S: 'superlativo' } },
];

export function decodeGreekMorph(pos, parse) {
  const parts = [];
  const posLabel = GR_POS[pos];
  if (posLabel) parts.push(posLabel);
  else if (pos) parts.push(pos);
  const chars = String(parse || '');
  for (let i = 0; i < GR_PARSE.length; i++) {
    const ch = chars[i];
    if (!ch || ch === '-') continue;
    const val = GR_PARSE[i].map[ch];
    if (val) parts.push(val);
  }
  return parts.join(' · ');
}

export function testamentOf(bookId) {
  // AT completo en hebreo/arameo (Oshb incluye Daniel-Esdras arameo).
  const nt = new Set([
    'mat', 'mrk', 'luk', 'jhn', 'act', 'rom', '1co', '2co', 'gal', 'eph',
    'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm', 'heb', 'jas',
    '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev',
  ]);
  return nt.has(bookId) ? 'gr' : 'hb';
}
