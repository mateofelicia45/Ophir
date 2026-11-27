// Tipografías y paletas del mapa. Sin React ni MapLibre.

// Tipografías servidas como glifos locales (tools/build-glyphs.mjs).
export const FONTS = {
  serif: ['Source Serif 4 Regular'],
  serifItalic: ['Source Serif 4 Italic'],
  serifBold: ['Source Serif 4 Semibold'],
  serifBoldItalic: ['Source Serif 4 Semibold Italic'],
  sans: ['IBM Plex Sans Regular'],
  sansMedium: ['IBM Plex Sans Medium'],
};

// Variables CSS del prototipo (docs/prototipos/atlas-biblico/Main.dc.html, .app y .app.dark).
export const PALETTES = {
  light: {
    paper: '#FBFAF7', ink: '#1D2327', ink2: '#465056', accent: '#1F5C7A', accentInk: '#FFFFFF', clay: '#A3452A',
    sea: '#CBD9E1', land: '#F4F1E9', coast: '#93A9B6', lake: '#BCD0DB', border: '#857F75', river: '#4A82A8',
    halo: 'rgba(251,250,247,.92)',
    't-ciudad': '#22292E', 't-sitio': '#A3452A', 't-montana': '#7A4F2C', 't-fuente': '#2A6A92', 't-isla': '#0E7470',
    't-rio': '#2A6A92', 't-mar': '#2F6488', 't-desierto': '#86600F', 't-valle': '#3E6C2C', 't-region': '#5F4785',
    't-reino': '#5F4785', 't-camino': '#87553D',
    c1: '#B4672F', c2: '#3F77A0', c3: '#6E8E36', c4: '#8E5A88', c5: '#A88627',
    r0: '#B4532F', r1: '#2E6C9E', r2: '#5E7F22', r3: '#874C98', r4: '#A87C12', r5: '#227F78', r6: '#A23C60', r7: '#55606B',
    hsShadow: '#4A3B2A', hsHighlight: '#FFFFFF', hsAccent: '#6B5A45',
  },
  dark: {
    paper: '#161A1D', ink: '#E8E6E0', ink2: '#BCC0BE', accent: '#86BCD6', accentInk: '#0E1417', clay: '#E39273',
    sea: '#0F1A21', land: '#23292D', coast: '#3F5665', lake: '#13222B', border: '#8A8781', river: '#5592B8',
    halo: 'rgba(22,26,29,.9)',
    't-ciudad': '#ECEAE4', 't-sitio': '#E39273', 't-montana': '#D1A57E', 't-fuente': '#74B6DC', 't-isla': '#5CC6C1',
    't-rio': '#74B6DC', 't-mar': '#7DB3D6', 't-desierto': '#DDB75C', 't-valle': '#93C47D', 't-region': '#BBA5DE',
    't-reino': '#BBA5DE', 't-camino': '#D3A288',
    c1: '#D08A55', c2: '#6FA3CB', c3: '#9BBE61', c4: '#BE86B8', c5: '#D6B653',
    r0: '#E0805C', r1: '#6EA8D6', r2: '#A3C463', r3: '#C08AD3', r4: '#E0B545', r5: '#5CC2B8', r6: '#E07CA0', r7: '#A9B4BE',
    hsShadow: '#000000', hsHighlight: '#8FA3AE', hsAccent: '#1B2226',
  },
};
