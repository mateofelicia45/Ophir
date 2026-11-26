export function norm(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
