export function norm(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Algunos nombres de OpenBible llevan un sufijo numérico para distinguir homónimos
// («Monte Seir 1»). En la interfaz se muestra sin él.
export function displayName(s) {
  return String(s == null ? '' : s).replace(/\s+\d+$/, '');
}
