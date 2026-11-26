// Convierte el repositorio lyteword/mhenry-complete (Markdown, CC0) al
// formato de comentarios de Ophir: un JSON por libro con bloques tipados.
//
// Formato de salida (por libro):
// { id, name, license, book, chapters: [ [ {t:'h'|'p', x:string}, ... ], ... ] }
//
// Uso: node tools/build-commentary.mjs <repoDir> <outDir>
import fs from 'node:fs';
import path from 'node:path';

const [, , repoDir, outDir] = process.argv;
if (!repoDir || !outDir) {
  console.error('Uso: node tools/build-commentary.mjs <repoDir> <outDir>');
  process.exit(1);
}

const SLUG_MAP = {
  genesis: 'gen', exodus: 'exo', leviticus: 'lev', numbers: 'num',
  deuteronomy: 'deu', joshua: 'jos', judges: 'jdg', ruth: 'rut',
  '1-samuel': '1sa', '2-samuel': '2sa', '1-kings': '1ki', '2-kings': '2ki',
  '1-chronicles': '1ch', '2-chronicles': '2ch', ezra: 'ezr',
  nehemiah: 'neh', esther: 'est', job: 'job', psalms: 'psa', psalm: 'psa',
  proverbs: 'pro', ecclesiastes: 'ecc', 'song-of-solomon': 'sng',
  isaiah: 'isa', jeremiah: 'jer', lamentations: 'lam', ezekiel: 'eze',
  daniel: 'dan', hosea: 'hos', joel: 'jol', amos: 'amo', obadiah: 'oba',
  jonah: 'jon', micah: 'mic', nahum: 'nam', habakkuk: 'hab',
  zephaniah: 'zep', haggai: 'hag', zechariah: 'zec', malachi: 'mal',
  matthew: 'mat', mark: 'mrk', luke: 'luk', john: 'jhn', acts: 'act',
  romans: 'rom', '1-corinthians': '1co', '2-corinthians': '2co',
  galatians: 'gal', ephesians: 'eph', philippians: 'php',
  colossians: 'col', '1-thessalonians': '1th', '2-thessalonians': '2th',
  '1-timothy': '1ti', '2-timothy': '2ti', titus: 'tit', philemon: 'phm',
  hebrews: 'heb', james: 'jas', '1-peter': '1pe', '2-peter': '2pe',
  '1-john': '1jn', '2-john': '2jn', '3-john': '3jn', jude: 'jud',
  revelation: 'rev',
};

function cleanMd(text) {
  let t = text
    .replace(/^---\n[\s\S]*?\n---\n/, '') // frontmatter
    .replace(/^#.*$/gm, '') // títulos H1/H2/H3 -> se manejan aparte
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // enlaces -> texto
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/\\([.,\-()])/g, '$1') // escapes md
    .replace(/> \*\*[^\s*]+\*\* /g, '') // prefijo de cita de verso
    .replace(/^>\s?/gm, '');
  return t;
}

function parseChapter(raw) {
  const body = cleanMd(raw);
  const blocks = [];
  // Agrupa líneas contiguas en párrafos; los encabezados ya se quitaron,
  // pero conservamos los H2 como subtítulos antes de limpiarlos.
  const lines = body.split('\n');
  let buf = [];

  function flush() {
    const x = buf.join(' ').replace(/\s+/g, ' ').trim();
    if (x) blocks.push({ t: 'p', x });
    buf = [];
  }

  const headingRe = /^(#{2,4})\s+(.*)$/;
  for (const line of lines) {
    const hm = line.match(headingRe);
    if (hm) {
      flush();
      const x = cleanInline(hm[2]);
      if (x) blocks.push({ t: 'h', x });
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    buf.push(line.trim());
  }
  flush();
  return blocks;
}

function cleanInline(s) {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')
    .replace(/\\([.,\-()])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Recorre volumes y acumula capítulos por slug de libro.
const bySlug = new Map();
for (const vol of fs
  .readdirSync(repoDir)
  .filter((d) => /^volume-\d+$/.test(d))
  .sort()) {
  const volDir = path.join(repoDir, vol);
  for (const slug of fs.readdirSync(volDir)) {
    const slugDir = path.join(volDir, slug);
    if (!fs.statSync(slugDir).isDirectory()) continue;
    const bookId = SLUG_MAP[slug];
    if (!bookId) {
      console.warn(`Slug desconocido: ${slug} — omitido`);
      continue;
    }
    if (!bySlug.has(bookId)) bySlug.set(bookId, new Map());
    const chapters = bySlug.get(bookId);
    for (const f of fs.readdirSync(slugDir)) {
      const cm = f.match(/^chapter-(\d+)\.md$/);
      if (!cm) continue;
      const num = parseInt(cm[1], 10);
      const raw = fs.readFileSync(path.join(slugDir, f), 'utf8');
      if (/[\uFFFD]/.test(raw.slice(0, 2000))) {
        console.warn(`AVISO caracteres inválidos en ${vol}/${slug}/${f}`);
      }
      chapters.set(num, parseChapter(raw));
    }
  }
}

fs.mkdirSync(outDir, { recursive: true });
let totalBlocks = 0;
let totalChapters = 0;
for (const [bookId, chapters] of [...bySlug.entries()].sort()) {
  const nums = [...chapters.keys()].sort((a, b) => a - b);
  const arr = [];
  for (let i = 1; i <= Math.max(...nums); i++) {
    arr.push(chapters.get(i) || []);
  }
  totalChapters += arr.length;
  totalBlocks += arr.reduce((a, c) => a + c.length, 0);
  const json = {
    id: 'mhc',
    name: "Matthew Henry — Comentario Completo",
    license: 'CC0-1.0 — github.com/lyteword/mhenry-complete',
    book: bookId,
    chapters: arr,
  };
  fs.writeFileSync(
    path.join(outDir, `${bookId}.json`),
    JSON.stringify(json)
  );
}
console.log(
  `MHC: ${bySlug.size} libros, ${totalChapters} capítulos, ${totalBlocks} bloques -> ${outDir}`
);
