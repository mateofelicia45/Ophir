// Paneles del atlas según el ancho real del contenedor (no el de la ventana: el
// atlas vive dentro del diseño de Ophir, con su barra lateral).
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export const LEFT_W = 336;
export const RIGHT_W = 400;
const NARROW = 900; // debajo: los paneles se superponen al mapa
const SINGLE = 1300; // debajo: un solo panel lateral abierto a la vez

// Margen para encuadrar un foco: deja libre el ancho del cartel del foco
// (12 px de margen + hasta 330 px) si el mapa da para eso.
export function focusPadding(mapW) {
  const card = Math.min(330, mapW - 76) + 12;
  if (mapW > 0 && mapW - card - 24 >= 280) return { top: 50, bottom: 50, right: 50, left: card + 24 };
  return 40;
}

export function useAtlasLayout(rootRef) {
  const [width, setWidth] = useState(0);
  const [left, setLeft] = useState(true);
  const [right, setRight] = useState(true);
  const measured = useRef(false);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (!w) return;
      setWidth(w);
      if (!measured.current) {
        measured.current = true;
        if (w < NARROW) {
          setLeft(false);
          setRight(false);
        } else if (w < SINGLE) setRight(false);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [rootRef]);

  const narrow = width > 0 && width < NARROW;
  const single = width >= NARROW && width < SINGLE;

  const openLeft = useCallback((v = true) => {
    setLeft(v);
    if (v && (single || narrow)) setRight(false);
  }, [single, narrow]);
  const openRight = useCallback((v = true) => {
    setRight(v);
    if (v && (single || narrow)) setLeft(false);
  }, [single, narrow]);
  // Ancho del mapa con los paneles indicados (en celular los paneles flotan encima).
  const mapWidth = useCallback(
    (l, r) => (narrow ? width : width - (l ? LEFT_W : 0) - (r ? RIGHT_W : 0)),
    [narrow, width],
  );

  return { width, narrow, single, left, right, openLeft, openRight, mapWidth };
}
