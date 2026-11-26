// Convierte USFM (ebible.org) al formato compacto de biblias de Ophir:
// { id, name, lang, license, books: { gen: [[verso, ...], ...] } }
//
// Uso: node tools/build-bible.mjs <dirUsfm> <salida.json> <id> <name> <lang> <license>
import fs from 'node:fs';
import path from 'node:path';

const [, , dirUsfm, outFile, bibleId, name, lang, license] = process.argv;
if (!dirUsfm || !outFile || !bibleId || !name || !lang || !license) {
  console.error(
    'Uso: node tools/build-bible.mjs <dirUsfm> <salida.json> <id> <name> <lang> <license>'
  );
  process.exit(1);
}

const CODE_MAP = {
  GEN: 'gen', EXO: 'exo', LEV: 'lev', NUM: 'num', DEU: 'deu', JOS: 'jos',
  JDG: 'jdg', RUT: 'rut', '1SA': '1sa', '2SA': '2sa', '1KI': '1ki',
  '2KI': '2ki', '1CH': '1ch', '2CH': '2ch', EZR: 'ezr', NEH: 'neh',
  EST: 'est', JOB: 'job', PSA: 'psa', PRO: 'pro', ECC: 'ecc', SNG: 'sng',
  ISA: 'isa', JER: 'jer', LAM: 'lam', EZK: 'eze', DAN: 'dan', HOS: 'hos',
  JOL: 'jol', AMO: 'amo', OBA: 'oba', JON: 'jon', MIC: 'mic', NAM: 'nam',
  HAB: 'hab', ZEP: 'zep', HAG: 'hag', ZEC: 'zec', MAL: 'mal',
  MAT: 'mat', MRK: 'mrk', LUK: 'luk', JHN: 'jhn', ACT: 'act', ROM: 'rom',
  '1CO': '1co', '2CO': '2co', GAL: 'gal', EPH: 'eph', PHP: 'php',
  COL: 'col', '1TH': '1th', '2TH': '2th', '1TI': '1ti', '2TI': '2ti',
  TIT: 'tit', PHM: 'phm', HEB: 'heb', JAS: 'jas', '1PE': '1pe',
  '2PE': '2pe', '1JN': '1jn', '2JN': '2jn', '3JN': '3jn', JUD: 'jud',
  REV: 'rev',
};

function cleanText(raw) {
  let t = raw
    // Bloques completos de notas y referencias cruzadas se eliminan.
    .replace(/\\f\s[\s\S]*?\\f\*/g, '')
    .replace(/\\fe\s[\s\S]*?\\fe\*/g, '')
    .replace(/\\x\s[\s\S]*?\\x\*/g, '')
    .replace(/\\fig[\s\S]*?\\fig\*/g, '')
    .replace(/\\z[\s\S]*?\\z\*/g, '')
    // Marcadores restantes: se quita la etiqueta y se conserva el texto interior.
    .replace(/\\[^\s]+\*?/g, '')
    // Atributos de marcadores (p. ej. strong="G1063" en listas de palabras).
    .replace(/[a-zA-Z-]+="[^"]*"/g, '')
    // Espacios pegados a puntuación ("pastor ;" -> "pastor;").
    .replace(/\s+([;:,.\u00bf?\u00a1!\u00bb])/g, '$1')
    // Caracteres de formato USFM.
    .replace(/[~|]/g, ' ')
    .replace(/\\\\\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t;
}

function parseUsfm(text) {
  const m = text.match(/\\id\s+(\w{3})/);
  if (!m) return null;
  const code = m[1];
  const bookId = CODE_MAP[code];
  if (!bookId) {
    console.warn(`Código desconocido: ${code} — omitido`);
    return null;
  }
  const books = { [bookId]: [] };
  let curChapter = null;

  const lines = text.split('\n');
  for (const line of lines) {
    const cm = line.match(/^\\c\s+(\d+)\b/);
    if (cm) {
      curChapter = parseInt(cm[1], 10);
      books[bookId][curChapter - 1] = [];
      continue;
    }
    const vm = line.match(/^\\v\s+([\d]+(?:-[\d]+)?)\s+(.*)$/);
    if (!vm || !curChapter) continue;
    const clean = cleanText(vm[2]);
    if (!clean) continue;
    const range = vm[1].split('-').map(Number);
    const arr = books[bookId][curChapter - 1];
    if (range.length === 2) {
      for (let v = range[0]; v <= range[1]; v++) arr.push(clean);
    } else {
      arr.push(clean);
    }
  }

  const total = books[bookId].reduce((a, c) => a + (c ? c.length : 0), 0);
  if (!total) return null;
  return { [bookId]: books[bookId].map((c) => c || []) };
}

const files = fs
  .readdirSync(dirUsfm)
  .filter((f) => f.toLowerCase().endsWith('.usfm'))
  .sort();

const outBooks = {};
let fileCount = 0;
for (const f of files) {
  const text = fs.readFileSync(path.join(dirUsfm, f), 'utf8');
  if (!/\u00e9|\u00ed/.test(text.slice(0, 400)) && /[Ã]/.test(text.slice(0, 400))) {
    console.warn(`AVISO: ${f} parece tener codificación incorrecta`);
  }
  const parsed = parseUsfm(text);
  if (parsed) {
    Object.assign(outBooks, parsed);
    fileCount++;
  } else {
    console.warn(`Sin contenido: ${f}`);
  }
}

const json = {
  id: bibleId,
  name,
  lang,
  license,
  books: Object.fromEntries(Object.keys(outBooks).sort().map((k) => [k, outBooks[k]])),
};

fs.writeFileSync(outFile, JSON.stringify(json));
console.log(
  `${bibleId}: ${fileCount} libros, ${Object.keys(outBooks).length} registrados -> ${outFile}`
);
