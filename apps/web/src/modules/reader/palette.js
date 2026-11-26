// Paleta personal migrada del sistema físico de resaltado
export const PALETTE = [
  { id: 'rojo', label: 'Cosas fuertes', css: 'var(--highlight-red)' },
  { id: 'celeste', label: 'Celestial, poder y autoridad', css: 'var(--highlight-sky)' },
  { id: 'dorado', label: 'Atributos de Dios', css: 'var(--highlight-gold)' },
  { id: 'naranja', label: 'Datos históricos', css: 'var(--highlight-orange)' },
  { id: 'rosa', label: 'Profecía', css: 'var(--highlight-pink)' },
  { id: 'amarillo', label: 'Felicidad o buenas noticias', css: 'var(--highlight-yellow)' },
  { id: 'verde', label: 'Aspectos positivos', css: 'var(--highlight-green)' },
  { id: 'violeta', label: 'Tristeza, juicio, aspectos negativos', css: 'var(--highlight-violet)' },
  { id: 'pendiente', label: 'Asuntos pendientes / aplicación personal', css: 'var(--highlight-peach)' },
];

export const PALETTE_BY_ID = Object.fromEntries(PALETTE.map((p) => [p.id, p]));
