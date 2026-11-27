// Límites visibles del mapa como un almacén externo: el mapa los publica en cada
// cuadro y solo quien se suscribe (el minimapa) vuelve a dibujarse; la página no.
export function createViewStore() {
  let view = null;
  const subs = new Set();
  const same = (a, b) => a && b && a.flat().every((v, i) => v === b.flat()[i]);
  return {
    get: () => view,
    set(next) {
      if (same(view, next)) return;
      view = next;
      subs.forEach((f) => f());
    },
    subscribe(f) {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}
