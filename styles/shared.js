// styles/shared.js
// ─── Design tokens ───────────────────────────────────────────
// Warm cream base, same as DBT app.
// Accent: dusty rose — soft, hopeful, not financial-app blue.

export const colors = {
  bg:           '#f5f0eb',   // warm cream background (same as DBT app)
  surface:      '#ffffff',   // cards, inputs
  surfaceMuted: '#ede5df',   // muted rose-tinted buttons

  border:       '#e6e0da',   // soft warm border
  borderMuted:  '#d4ccc5',   // slightly stronger for inputs

  rose:         '#9e6b72',   // primary accent — dusty rose
  roseLight:    'rgba(158, 107, 114, 0.10)', // ghost rose bg
  roseMuted:    '#b8949a',   // secondary text / muted actions

  textDark:     '#2d2828',   // warm near-black
  textMid:      '#6b5e5e',   // warm mid tone
  textLight:    '#b0a09e',   // hints, placeholders
  bill:         '#6b8fa8',   // steel blue — recurring bills
};

export const type = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   16,
  lg:   20,
  xl:   28,
  xxl:  34,
};