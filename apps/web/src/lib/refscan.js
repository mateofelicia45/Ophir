// Detecta referencias bíblicas escritas al estilo inglés dentro de un texto
// ("Gen. 1:1", "1 Sam. 17:34-36", "Rev. 1:8") y las convierte en segmentos
// {type:'text'|'ref'} para enlazarlas al Lector.
import { BOOKS, findBook, formatReference } from './references.js';

// Alias inglés -> nombre canónico español del libro.
const EN_ALIASES = {
  genesis: 'Génesis',
  gen: 'Génesis',
  exodus: 'Éxodo',
  exod: 'Éxodo',
  exo: 'Éxodo',
  ex: 'Éxodo',
  leviticus: 'Levítico',
  lev: 'Levítico',
  numbers: 'Números',
  num: 'Números',
  nu: 'Números',
  deuteronomy: 'Deuteronomio',
  deut: 'Deuteronomio',
  deu: 'Deuteronomio',
  joshua: 'Josué',
  josh: 'Josué',
  jos: 'Josué',
  judges: 'Jueces',
  judg: 'Jueces',
  ruth: 'Rut',
  samuel: 'Samuel',
  sam: 'Samuel',
  kings: 'Reyes',
  kgs: 'Reyes',
  ki: 'Reyes',
  chronicles: 'Crónicas',
  chron: 'Crónicas',
  chr: 'Crónicas',
  ezra: 'Esdras',
  ezr: 'Esdras',
  nehemiah: 'Nehemías',
  neh: 'Nehemías',
  esther: 'Ester',
  esth: 'Ester',
  est: 'Ester',
  job: 'Job',
  psalms: 'Salmos',
  psalm: 'Salmos',
  psal: 'Salmos',
  psa: 'Salmos',
  ps: 'Salmos',
  proverbs: 'Proverbios',
  prov: 'Proverbios',
  pro: 'Proverbios',
  ecclesiastes: 'Eclesiastés',
  eccles: 'Eclesiastés',
  eccl: 'Eclesiastés',
  ecc: 'Eclesiastés',
  song: 'Cantares',
  songs: 'Cantares',
  solomon: 'Cantares',
  sos: 'Cantares',
  isaiah: 'Isaías',
  isa: 'Isaías',
  isaias: 'Isaías',
  jeremiah: 'Jeremías',
  jer: 'Jeremías',
  lamentations: 'Lamentaciones',
  lam: 'Lamentaciones',
  ezekiel: 'Ezequiel',
  ezek: 'Ezequiel',
  eze: 'Ezequiel',
  ezk: 'Ezequiel',
  daniel: 'Daniel',
  dan: 'Daniel',
  hosea: 'Oseas',
  hos: 'Oseas',
  joel: 'Joel',
  joe: 'Joel',
  amos: 'Amós',
  amo: 'Amós',
  obadiah: 'Obadías',
  obad: 'Obadías',
  oba: 'Obadías',
  jonah: 'Jonás',
  jon: 'Jonás',
  micah: 'Miqueas',
  mic: 'Miqueas',
  nahum: 'Nahúm',
  nah: 'Nahúm',
  habakkuk: 'Habacuc',
  hab: 'Habacuc',
  zephaniah: 'Sofonías',
  zeph: 'Sofonías',
  zep: 'Sofonías',
  haggai: 'Hageo',
  hag: 'Hageo',
  zechariah: 'Zacarías',
  zech: 'Zacarías',
  zac: 'Zacarías',
  malachi: 'Malaquías',
  mal: 'Malaquías',
  matthew: 'Mateo',
  matt: 'Mateo',
  mat: 'Mateo',
  mt: 'Mateo',
  mark: 'Marcos',
  mrk: 'Marcos',
  mr: 'Marcos',
  mk: 'Marcos',
  luke: 'Lucas',
  luk: 'Lucas',
  lk: 'Lucas',
  john: 'Juan',
  joh: 'Juan',
  jn: 'Juan',
  acts: 'Hechos',
  act: 'Hechos',
  romans: 'Romanos',
  rom: 'Romanos',
  ro: 'Romanos',
  corinthians: 'Corintios',
  cor: 'Corintios',
  galatians: 'Gálatas',
  gal: 'Gálatas',
  ephesians: 'Efesios',
  eph: 'Efesios',
  philippians: 'Filipenses',
  phil: 'Filipenses',
  php: 'Filipenses',
  colossians: 'Colosenses',
  col: 'Colosenses',
  thessalonians: 'Tesalonicenses',
  thess: 'Tesalonicenses',
  th: 'Tesalonicenses',
  timothy: 'Timoteo',
  tim: 'Timoteo',
  titus: 'Tito',
  tit: 'Tito',
  philemon: 'Filemón',
  philem: 'Filemón',
  phm: 'Filemón',
  hebrews: 'Hebreos',
  heb: 'Hebreos',
  james: 'Santiago',
  jas: 'Santiago',
  peter: 'Pedro',
  pet: 'Pedro',
  pe: 'Pedro',
  jude: 'Judas',
  jud: 'Judas',
  revelation: 'Apocalipsis',
  rev: 'Apocalipsis',
};

// "Gen. 1:1", "1 Sam. 17:34", "Isa 41:4" · prefijo 1/2/3 o I/II/III.
const REF_RE =
  /\b((?:[1-3]\s*|I{1,3}\s*)?)([A-Za-z][A-Za-z'’.]*)\.?\s+(\d{1,3})(?::(\d{1,3})(?:\s?[–—-]\s?(\d{1,3}))?)?/g;

const BOOK_BY_ID = new Map(BOOKS.map((b) => [b.id, b]));

function resolveRef(prefixRaw, wordRaw, chapter, verseStart, verseEnd) {
  const prefix = prefixRaw.trim().replace(/[IVX]/gi, (c) =>
    ({ i: '1', v: '', x: '' }[c.toLowerCase()] ?? '')
  );
  const num = prefix.replace(/\D/g, '');
  const word = wordRaw.replace(/['’.]/g, '').toLowerCase();
  const alias = EN_ALIASES[word];
  if (!alias) return null;
  // Libros que solo existen numerados ("Sam." sin número no resuelve).
  const numbered = /^(Samuel|Reyes|Crónicas|Corintios|Tesalonicenses|Timoteo|Pedro)$/.test(
    alias
  );
  if (numbered && !['1', '2', '3'].includes(num)) return null;
  if (!numbered && num && !/^Juan$/.test(alias)) return null;
  const bookName = num ? `${num} ${alias}` : alias;
  const book = findBook(bookName);
  if (!book) return null;
  const c = Number(chapter);
  if (c < 1 || c > book.chapters) return null;
  return {
    bookId: book.id,
    chapter: c,
    verseStart: verseStart ? Number(verseStart) : null,
    verseEnd: verseEnd ? Number(verseEnd) : null,
  };
}

export function scanReferences(text) {
  const segments = [];
  let last = 0;
  REF_RE.lastIndex = 0;
  let m;
  while ((m = REF_RE.exec(text))) {
    const ref = resolveRef(m[1], m[2], m[3], m[4], m[5]);
    if (!ref) continue;
    if (m.index > last) {
      segments.push({ type: 'text', text: text.slice(last, m.index) });
    }
    segments.push({ type: 'ref', ref, label: m[0].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push({ type: 'text', text: text.slice(last) });
  }
  return segments;
}

// Convierte una tupla de Nave ["exo",6,16,20] en chip navegable.
export function naveTupleToRef(tuple) {
  const [bookId, chapter, verseStart, verseEnd] = tuple;
  const book = BOOK_BY_ID.get(bookId);
  if (!book) return null;
  const c = Number(chapter);
  if (c < 1 || c > book.chapters) return null;
  const vs = Number(verseStart) || null;
  return {
    bookId,
    chapter: c,
    verseStart: vs,
    verseEnd: vs ? Number(verseEnd) || null : null,
  };
}

// Formatea una ref {bookId, chapter, verseStart, verseEnd} abreviada ("Jos 24:15").
export function fmtRef(ref) {
  const book = BOOK_BY_ID.get(ref?.bookId);
  if (!book) return '';
  return formatReference(
    {
      book,
      chapter: ref.chapter,
      verseStart: ref.verseStart ?? null,
      verseEnd: ref.verseEnd ?? null,
    },
    'abbr'
  );
}
