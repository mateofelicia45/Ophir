// Convierte OpenScriptures morphhb (WLC/OSHB XML) + morphgnt/sblgnt (TXT)
// + openscriptures/strongs (diccionarios JS) en los JSON compactos que usa
// la app: packages/data/interlinear/{hebrew,greek,strongs-h,strongs-g}.json
//
// Uso: node tools/build-interlinear.mjs <dir-morphhb-wlc> <dir-sblgnt> <dir-strongs>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require2 = createRequire(import.meta.url);

const [, , wlcDir, sblgntDir, strongsDir] = process.argv;

const HB_BOOKS = {
  Gen: 'gen', Exod: 'exo', Lev: 'lev', Num: 'num', Deut: 'deu',
  Josh: 'jos', Judg: 'jue', Ruth: 'rut', '1Sam': '1sa', '2Sam': '2sa',
  '1Kgs': '1ki', '2Kgs': '2ki', '1Chr': '1ch', '2Chr': '2ch',
  Ezra: 'ezr', Neh: 'neh', Esth: 'est', Job: 'job', Ps: 'psa',
  Prov: 'pro', Eccl: 'ecc', Song: 'sng', Isa: 'isa', Jer: 'jer',
  Lam: 'lam', Ezek: 'ezk', Dan: 'dan', Hos: 'hos', Joel: 'jol',
  Amos: 'amo', Obad: 'oba', Jonah: 'jon', Mic: 'mic', Nah: 'nam',
  Hab: 'hab', Zeph: 'zep', Hag: 'hag', Zech: 'zec', Mal: 'mal',
};

const GR_BOOKS = {
  '61-Mt': 'mat', '62-Mk': 'mrk', '63-Lk': 'luk', '64-Jn': 'jhn',
  '65-Ac': 'act', '66-Ro': 'rom', '67-1Co': '1co', '68-2Co': '2co',
  '69-Ga': 'gal', '70-Eph': 'eph', '71-Php': 'php', '72-Col': 'col',
  '73-1Th': '1th', '74-2Th': '2th', '75-1Ti': '1ti', '76-2Ti': '2ti',
  '77-Tit': 'tit', '78-Phm': 'phm', '79-Heb': 'heb', '80-Jas': 'jas',
  '81-1Pe': '1pe', '82-2Pe': '2pe', '83-1Jn': '1jn', '84-2Jn': '2jn',
  '85-3Jn': '3jn', '86-Jud': 'jud', '87-Re': 'rev',
};

const OUT_DIR = path.resolve('packages/data/interlinear');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- léxicos Strong ----------
function loadStrongs(file, prefix) {
  const parsed = require2(path.resolve(file));
  const out = {};
  for (const [id, e] of Object.entries(parsed)) {
    const num = id.replace(prefix, '');
    const def = String(e.strongs_def || '').trim();
    const short =
      def.split(/[;,(]/)[0].replace(/^[-–—\s]+/, '').replace(/\.$/, '').slice(0, 60) ||
      String(e.kjv_def || '').split(/[,;]/)[0].trim();
    out[num] = {
      l: e.lemma,
      x: e.xlit || e.translit,
      g: short,
      d: (def || String(e.kjv_def || '')).trim(),
    };
  }
  return out;
}

function stripDiacritics(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const strongsH = loadStrongs(path.join(strongsDir, 'hebrew-dict.js'), 'H');
const strongsG = loadStrongs(path.join(strongsDir, 'greek-dict.js'), 'G');

// Índice lema normalizado -> número Strong (para el griego de morphgnt).
const lemmaToStrong = new Map();
for (const [num, e] of Object.entries(strongsG)) {
  const key = stripDiacritics(e.l).toLowerCase();
  if (!lemmaToStrong.has(key)) lemmaToStrong.set(key, num);
}

// ---------- Hebreo: WLC XML ----------
function convertHebrew() {
  const books = {};
  let words = 0;
  for (const [osisFile, bookId] of Object.entries(HB_BOOKS)) {
    const xml = fs.readFileSync(
      path.join(wlcDir, `${osisFile}.xml`),
      'utf8'
    );
    const chapters = [];
    const verseRe = /<verse[^>]*osisID="([\w]+)\.(\d+)\.(\d+)"/g;
    // Cortar por capítulos: recorrer versículos y agrupar.
    const verses = [...xml.matchAll(verseRe)];
    const wordRe = /<w\s+([^>]*)>([^<]*)<\/w>/g;
    let lastChapter = -1;
    for (let vi = 0; vi < verses.length; vi++) {
      const [, , cStr, vStr] = verses[vi];
      const c = Number(cStr);
      const start = verses[vi].index + verses[vi][0].length;
      const end = vi + 1 < verses.length ? verses[vi + 1].index : xml.length;
      const body = xml.slice(start, end);
      while (chapters.length < c) chapters.push([]);
      const list = [];
      for (const m of body.matchAll(wordRe)) {
        const attrs = m[1];
        const surf = m[2].trim();
        if (!surf) continue;
        const lemma = (attrs.match(/lemma="([^"]*)"/) || [])[1] || '';
        const morph = (attrs.match(/\bmorph="([^"]*)"/) || [])[1] || '';
        const surfSegs = surf.split('/');
        const morphSegs = morph.split('/');
        const lemmaSegs = lemma.split('/');
        for (let i = 0; i < surfSegs.length; i++) {
          const ms = morphSegs[i] ?? morphSegs[morphSegs.length - 1] ?? '';
          const ls = lemmaSegs[i] ?? lemmaSegs[lemmaSegs.length - 1] ?? '';
          const strong = (ls.match(/^\d+/) || [''])[0];
          list.push([surfSegs[i], ms, strong]);
          words++;
        }
      }
      chapters[c - 1].push(list);
      void lastChapter;
      lastChapter = c;
    }
    books[bookId] = chapters;
    console.log(`hb ${bookId}: ${chapters.length} caps`);
  }
  console.log('hebreo palabras:', words);
  return {
    id: 'oshb',
    name: 'Open Scriptures Hebrew Bible (WLC)',
    lang: 'heb-aram',
    license: 'Texto WLC: CC BY 4.0 · Morfología OSHB: CC BY-SA 4.0',
    source: 'https://github.com/openscriptures/morphhb',
    books,
  };
}

// ---------- Griego: morphgnt TXT ----------
function convertGreek() {
  const books = {};
  let words = 0;
  let missingStrong = 0;
  for (const [fileBase, bookId] of Object.entries(GR_BOOKS)) {
    const txt = fs.readFileSync(
      path.join(sblgntDir, `${fileBase}-morphgnt.txt`),
      'utf8'
    );
    const chapters = [];
    for (const line of txt.split('\n')) {
      if (!line.trim()) continue;
      const f = line.trim().split(/\s+/);
      if (f.length < 7) continue;
      const ref = f[0];
      const c = Number(ref.slice(2, 4));
      const v = Number(ref.slice(4, 6));
      const pos = f[1];
      const parse = f[2];
      const surf = f[4];
      const lemma = f[6];
      while (chapters.length < c) chapters.push([]);
      const arr = chapters[c - 1];
      while (arr.length < v) arr.push([]);
      const key = stripDiacritics(lemma).toLowerCase();
      const strong = lemmaToStrong.get(key) ?? '';
      if (!strong) missingStrong++;
      arr[v - 1].push([surf, pos, parse, strong]);
      words++;
    }
    books[bookId] = chapters;
    console.log(`gr ${bookId}: ${chapters.length} caps`);
  }
  console.log('griego palabras:', words, 'sin strong:', missingStrong);
  return {
    id: 'sblgnt',
    name: 'SBL Greek New Testament (morphgnt)',
    lang: 'grc',
    license:
      'Texto SBLGNT: CC BY 4.0 · Análisis morphgnt: CC BY-SA 4.0 · Strong vía openscriptures',
    source: 'https://github.com/morphgnt/sblgnt',
    books,
  };
}

const hb = convertHebrew();
const gr = convertGreek();

fs.writeFileSync(
  path.join(OUT_DIR, 'strongs-h.json'),
  JSON.stringify(strongsH)
);
fs.writeFileSync(
  path.join(OUT_DIR, 'strongs-g.json'),
  JSON.stringify(strongsG)
);
fs.writeFileSync(path.join(OUT_DIR, 'hebrew.json'), JSON.stringify(hb));
fs.writeFileSync(path.join(OUT_DIR, 'greek.json'), JSON.stringify(gr));

for (const f of ['hebrew.json', 'greek.json', 'strongs-h.json', 'strongs-g.json']) {
  const kb = Math.round(fs.statSync(path.join(OUT_DIR, f)).size / 1024);
  console.log(`${f}: ${kb} KB`);
}
console.log('OK');
