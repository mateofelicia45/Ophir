// Íconos del prototipo (trazo 24×24, currentColor).
const S = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const IconLeftPanel = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...S}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>
);
export const IconRightPanel = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...S}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></svg>
);
export const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...S}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></svg>
);
export const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...S}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
);
export const IconSearch = () => (
  <svg className="ico" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...S}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...S}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Logo = () => (
  <svg className="logo" width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="16" cy="16" r="12.5" />
    <path d="M3.5 16h25M16 3.5c-4 4-5.5 8-5.5 12.5S12 24.5 16 28.5M16 3.5c4 4 5.5 8 5.5 12.5S20 24.5 16 28.5" />
    <path d="M16 9.5v13M12.2 13.5h7.6" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
export const IconRuler = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...S}><path d="m3 17 14-14 4 4L7 21z" /><path d="m7 13 2 2M10 10l2 2M13 7l2 2" /></svg>
);
