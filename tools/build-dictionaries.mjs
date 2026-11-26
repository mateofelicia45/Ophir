// Convierte los datasets de diccionarios/temas al formato de Ophir.
//
// Fuentes:
//  - Easton: github.com/garydavenport73/eastons-bible-dictionary-json (PD)
//    -> { "<nombre>": [ {definition}, ... ] }
//  - Nave:   mega.bible /api/v1/data/topics (CC BY 4.0, via BibleData)
//    -> { data: { topics: [ {slug,name,sub:[{label,refs:[[book,c,v,vEnd?]]}]} ] } }
//
// Uso: node tools/build-dictionaries.mjs <eastonJson> <navesJson>
import fs from 'node:fs';

const [, , eastonIn, navesIn] = process.argv;
if (!eastonIn || !navesIn) {
  console.error('Uso: node tools/build-dictionaries.mjs <easton.json> <naves.json>');
  process.exit(1);
}

const OUT = 'packages/data';

// ---------- Easton ----------
{
  const raw = JSON.parse(fs.readFileSync(eastonIn, 'utf8'));
  let entries = 0;
  let defs = 0;
  const out = {};
  for (const [name, variants] of Object.entries(raw)) {
    const texts = (Array.isArray(variants) ? variants : [variants])
      .map((v) => String(v.definition || '').trim())
      .filter(Boolean);
    if (!texts.length) continue;
    out[name] = texts;
    entries++;
    defs += texts.length;
  }
  fs.mkdirSync(`${OUT}/dictionaries`, { recursive: true });
  fs.writeFileSync(
    `${OUT}/dictionaries/easton.json`,
    JSON.stringify({
      id: 'easton',
      name: "Easton's Bible Dictionary (1897)",
      lang: 'en',
      license: 'Public Domain — github.com/garydavenport73/eastons-bible-dictionary-json',
      entries: out,
    })
  );
  console.log(`Easton: ${entries} entradas, ${defs} definiciones`);
}

// ---------- Nave ----------
{
  const raw = JSON.parse(fs.readFileSync(navesIn, 'utf8'));
  const topics = raw.data.topics.map((t) => ({
    slug: t.slug,
    name: t.name,
    sub: t.sub || [],
  }));
  fs.mkdirSync(`${OUT}/naves`, { recursive: true });
  fs.writeFileSync(
    `${OUT}/naves/topics.json`,
    JSON.stringify({
      id: 'naves',
      name: "Nave's Topical Bible",
      lang: 'en',
      license: 'CC BY 4.0 — Nave\'s Topical Bible (public domain) via BibleData / mega.bible',
      topics,
    })
  );
  console.log(`Nave: ${topics.length} temas`);
}
