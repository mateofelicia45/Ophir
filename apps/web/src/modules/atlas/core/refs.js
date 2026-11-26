import { BOOKS } from '../../../lib/references.js';
import { norm } from './text.js';

export const BOOK_NAMES_ES = ['Génesis','Éxodo','Levítico','Números','Deuteronomio','Josué','Jueces','Rut','1 Samuel','2 Samuel','1 Reyes','2 Reyes','1 Crónicas','2 Crónicas','Esdras','Nehemías','Ester','Job','Salmos','Proverbios','Eclesiastés','Cantares','Isaías','Jeremías','Lamentaciones','Ezequiel','Daniel','Oseas','Joel','Amós','Abdías','Jonás','Miqueas','Nahúm','Habacuc','Sofonías','Hageo','Zacarías','Malaquías','Mateo','Marcos','Lucas','Juan','Hechos','Romanos','1 Corintios','2 Corintios','Gálatas','Efesios','Filipenses','Colosenses','1 Tesalonicenses','2 Tesalonicenses','1 Timoteo','2 Timoteo','Tito','Filemón','Hebreos','Santiago','1 Pedro','2 Pedro','1 Juan','2 Juan','3 Juan','Judas','Apocalipsis'];
const EN = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Songs','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'];
const OSIS = ['Gen','Exod','Lev','Num','Deut','Josh','Judg','Ruth','1Sam','2Sam','1Kgs','2Kgs','1Chr','2Chr','Ezra','Neh','Esth','Job','Ps','Prov','Eccl','Song','Isa','Jer','Lam','Ezek','Dan','Hos','Joel','Amos','Obad','Jonah','Mic','Nah','Hab','Zeph','Hag','Zech','Mal','Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'];
const AB = ['gn gen ge','ex exo','lv lev','nm num nu','dt deut','jos','jue jc','rt','1s 1sa 1sam','2s 2sa 2sam','1r 1re 1rey','2r 2re 2rey','1cr 1cro','2cr 2cro','esd','neh ne','est','jb','sal sl','pr prov','ec ecl qo','cnt cant ct','is isa','jer jr','lm lam','ez eze','dn dan','os','jl','am','abd','jon','mi miq','nah na','hab','sof','hag ag','zac','mal ml','mt mat','mc mr','lc luc','jn','hch hech hc','ro rom rm','1co 1cor','2co 2cor','ga gal','ef efe','fil flp','col','1ts 1tes','2ts 2tes','1ti 1tim','2ti 2tim','tit tt','flm fm','he heb hb','stg sant','1p 1pe 1ped','2p 2pe 2ped','1jn','2jn','3jn','jud jds','ap apoc'];

const compact = (s) => norm(s).replace(/\s+/g, '');
const BOOK_FULL = BOOK_NAMES_ES.map(compact);
const BOOK_ALIAS = new Map();
for (let i = 0; i < 66; i++) {
  const add = (a) => {
    const k = compact(a);
    if (k && !BOOK_ALIAS.has(k)) BOOK_ALIAS.set(k, i);
  };
  add(BOOK_NAMES_ES[i]);
  AB[i].split(' ').forEach(add);
  add(OSIS[i]);
  add(EN[i]);
}

export function bookOf(tok) {
  if (BOOK_ALIAS.has(tok)) return BOOK_ALIAS.get(tok);
  if (tok.length >= 3) {
    let hit = -1;
    let n = 0;
    for (let i = 0; i < 66; i++) {
      if (BOOK_FULL[i].indexOf(tok) === 0) {
        hit = i;
        n++;
      }
    }
    if (n === 1) return hit;
  }
  return -1;
}

export function refLabel(r) {
  const { b, c1, v1, c2, v2 } = r;
  let s = BOOK_NAMES_ES[b] + ' ' + c1;
  if (v1 > 0) s += ':' + v1;
  if (c2 !== c1) {
    s += '–' + c2;
    if (v2 < 999) s += ':' + v2;
  } else if (v1 > 0 && v2 !== v1 && v2 < 999) s += '-' + v2;
  return s;
}

export function parseRef(text) {
  if (!text) return null;
  const s = norm(String(text).split(';')[0]).replace(/\s*[–—-]\s*/g, '-');
  const m = s.match(/^([123])?\s*([a-zñ]+)\.?\s*(\d+)(?:\s*[:.,]\s*(\d+))?(?:-(\d+)(?:[:.](\d+))?)?\s*$/);
  if (!m) return null;
  const b = bookOf((m[1] || '') + m[2]);
  if (b < 0) return null;
  const c1 = +m[3];
  const v1 = m[4] ? +m[4] : 0;
  let c2 = c1;
  let v2 = m[4] ? +m[4] : 999;
  if (m[5]) {
    if (m[6]) {
      c2 = +m[5];
      v2 = +m[6];
    } else if (m[4]) v2 = +m[5];
    else {
      c2 = +m[5];
      v2 = 999;
    }
  }
  if (c2 < c1) c2 = c1;
  return { b, c1, v1, c2, v2 };
}

export function refToCode(b, c, v) {
  return b * 1e6 + c * 1e3 + (v || 0);
}

export function toOphirRef(r) {
  return {
    bookId: BOOKS[r.b].id,
    chapter: r.c1,
    verseStart: r.v1 > 0 ? r.v1 : null,
    verseEnd: r.v1 > 0 && r.c2 === r.c1 && r.v2 < 999 && r.v2 !== r.v1 ? r.v2 : null,
  };
}
