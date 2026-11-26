// Construye índices invertidos Strong -> ocurrencias a partir de los
// datasets del interlineal (packages/data/interlinear/{hebrew,greek}.json).
//
// Formato: { "<strong>": { "<bookId>": [[cap, vers, palabra0based], ...] } }
//
// Uso: node tools/build-strongs-index.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const DATA = path.join(root, 'packages', 'data', 'interlinear');

function buildIndex(srcFile, outFile, label, strongAt) {
  const data = JSON.parse(fs.readFileSync(path.join(DATA, srcFile), 'utf8'));
  const index = {};
  let total = 0;

  for (const [bookId, chapters] of Object.entries(data.books)) {
    chapters.forEach((verses, ci) => {
      verses.forEach((words, vi) => {
        words.forEach((word, wi) => {
          const strong = String(word[strongAt] || '');
          if (!strong) return;
          (index[strong] ??= {});
          (index[strong][bookId] ??= []).push([ci + 1, vi + 1, wi]);
          total++;
        });
      });
    });
  }

  // Ordena claves numéricamente y libros canónicamente.
  const sorted = Object.fromEntries(
    Object.keys(index)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => [k, Object.fromEntries(Object.entries(index[k]).sort())])
  );

  const out = path.join(DATA, outFile);
  fs.writeFileSync(out, JSON.stringify(sorted));
  console.log(
    `${label}: ${Object.keys(sorted).length} números Strong, ${total} ocurrencias -> ${out}`
  );
}

buildIndex('hebrew.json', 'strongs-h-index.json', 'Hebreo', 2);
buildIndex('greek.json', 'strongs-g-index.json', 'Griego', 3);
