// «Estás aquí»: la posición del usuario cuando cae dentro del mapa. Sin React ni MapLibre.
export function youLayers(P) {
  return [
    {
      id: 'you-halo', type: 'circle', source: 'you',
      paint: { 'circle-radius': 18, 'circle-color': P.accent, 'circle-opacity': 0.16 },
    },
    {
      id: 'you-dot', type: 'circle', source: 'you',
      paint: { 'circle-radius': 6.5, 'circle-color': P.accent, 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2.5 },
    },
  ];
}
