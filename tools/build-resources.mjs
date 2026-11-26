// Convierte recursos de estudio adicionales al formato Ophir.
//
// Fuentes:
//  - Smith: neuu-org/bible-dictionary-dataset (git) — entradas {name, defs:[{source,text}]}
//    solo se toman las definiciones fuente "SMI" (Smith's Bible Dictionary)
//  - Spurgeon: CollierTR/morning-and-evening-json (git) — {mes:{dia:{morning,evening}}}
//
// Uso: node tools/build-resources.mjs <cartellaConSmith> <archivoMae.json>
import fs from 'node:fs';
import path from 'node:path';
import { scanReferences } from '../apps/web/src/lib/refscan.js';

const [, , smithDir, maeFile] = process.argv;
if (!smithDir || !maeFile) {
  console.error(
    'Uso: node tools/build-resources.mjs <smith/letters.json> <morning-and-evening.json>'
  );
  process.exit(1);
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ---------- Smith's Bible Dictionary ----------
{
  const entries = {};
  const files = fs.readdirSync(smithDir).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(smithDir, f), 'utf8'));
    for (const [name, ent] of Object.entries(data)) {
      const defs = (ent.definitions || [])
        .filter((d) => d.source === 'SMI')
        .map((d) => String(d.text).trim())
        .filter(Boolean);
      if (!defs.length) continue;
      entries[name] = defs;
    }
  }
  fs.mkdirSync('packages/data/dictionaries', { recursive: true });
  fs.writeFileSync(
    'packages/data/dictionaries/smith.json',
    JSON.stringify({
      id: 'smith',
      name: "Smith's Bible Dictionary (1863)",
      lang: 'en',
      license: 'Public Domain — neuu-org/bible-dictionary-dataset',
      entries,
    })
  );
  console.log(`Smith: ${Object.keys(entries).length} entradas`);
}

// ---------- Spurgeon, Morning and Evening ----------
{
  const raw = JSON.parse(fs.readFileSync(maeFile, 'utf8'));
  const out = [];
  let dayIdx = 0;
  const monthOrder = [...Array(12).keys()].map((i) => String(i + 1));
  for (const m of monthOrder) {
    const monthData = raw[m];
    if (!monthData) continue;
    const days = Object.keys(monthData).sort((a, b) => Number(a) - Number(b));
    for (const d of days) {
      const slots = monthData[d];
      for (const slot of ['morning', 'evening']) {
        const entry = slots[slot];
        if (!entry?.keyverse && !entry?.body) continue;
        let ref = null;
        const hits = scanReferences(entry.keyverse || '');
        const first = hits.find((h) => h.type === 'ref');
        if (first) {
          ref = first.ref;
        }
        out.push({
          dow: dayIdx,
          m: Number(m),
          d: Number(d),
          slot,
          slotLabel: slot === 'morning' ? 'Mañana' : 'Noche',
          dateLabel: `${MESES[Number(m) - 1]} ${Number(d)}`,
          keyverse: (entry.keyverse || '').trim(),
          ref,
          body: (entry.body || '').trim(),
        });
      }
      dayIdx += 1;
    }
  }
  fs.mkdirSync('packages/data/devotional', { recursive: true });
  fs.writeFileSync(
    'packages/data/devotional/spurgeon.json',
    JSON.stringify({
      id: 'spurgeon',
      name: 'C. H. Spurgeon — Mañana y Noche',
      lang: 'en',
      license:
        'Public Domain — CollierTR/morning-and-evening-json (C. H. Spurgeon, 1865?)',
      entries: out,
    })
  );
  console.log(`Spurgeon: ${out.length} devocionales (${Math.round(out.length / 2)} días)`);
}