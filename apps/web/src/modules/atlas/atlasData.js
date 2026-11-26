import locationsJson from '@data/atlas/locations.json';

const REGEX_BOOK_SPLIT = /^(.+?)\s+\d+:\d+$/;

function extractBooks(verses) {
  const books = new Set();
  for (const verse of verses) {
    const match = verse.match(REGEX_BOOK_SPLIT);
    if (match) books.add(match[1].replace(/^[0-9]+\s*/, '').trim());
  }
  return [...books];
}

export function loadAtlasData() {
  const locations = locationsJson;
  const regions = new Set();
  const categories = new Set();
  const books = new Set();

  for (const loc of locations) {
    if (loc.region) regions.add(loc.region);
    if (loc.category) categories.add(loc.category);
    if (loc.bibleVerses) {
      for (const book of extractBooks(loc.bibleVerses)) books.add(book);
    }
  }

  function getById(id) {
    return locations.find((l) => l.id === id) || null;
  }

  function getFiltered({ query, region, category, book } = {}) {
    return locations.filter((loc) => {
      if (query) {
        const q = query.toLowerCase();
        const nameMatch = loc.name.toLowerCase().includes(q);
        const hebrewMatch = loc.nameHebrew && loc.nameHebrew.includes(query.trim());
        if (!nameMatch && !hebrewMatch) return false;
      }
      if (region && loc.region !== region) return false;
      if (category && loc.category !== category) return false;
      if (
        book &&
        (!loc.bibleVerses ||
          !loc.bibleVerses.some((v) => v.toLowerCase().includes(book.toLowerCase())))
      )
        return false;
      return true;
    });
  }

  function findByVerse(referenceText) {
    if (!referenceText) return [];
    const needle = referenceText.toLowerCase().replace(/\s+/g, ' ');
    return locations.filter((loc) =>
      (loc.bibleVerses || []).some((v) =>
        v.toLowerCase().replace(/\s+/g, ' ').includes(needle)
      )
    );
  }

  return {
    locations,
    regions: [...regions].sort(),
    categories: [...categories].sort(),
    books: [...books].sort((a, b) => a.localeCompare(b)),
    getById,
    getFiltered,
    findByVerse,
  };
}
