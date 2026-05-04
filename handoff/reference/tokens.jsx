// Three design directions — shared structure, divergent personality.
// Each direction defines color, type, density, and "voice" tokens.
// Chroma stays subtle (≤ 0.04). No textures, no skeuomorphism.

const DIRECTIONS = {
  hearth: {
    name: 'Folio',
    tagline: 'Editorial · Fraunces display, generous photos, italic flourishes',
    voice: 'Confident family historian. Italics for whispers and dates.',
    bg: '#F7F1E6',          // warmer cream — more inviting than #FAFAF8
    surface: '#FFFEFB',     // softly-warm white
    surfaceAlt: '#F0E6D2',  // sunken / chip — warmer
    ink: '#1F1A14',
    inkSoft: '#5A4F3F',
    inkMute: '#8A7E69',
    rule: '#E0D2BB',
    accent: '#8B5E3C',      // brand brown
    accentSoft: '#F0E1CD',
    gold: '#C2874F',        // brand accent-mid for years/eras
    serif: '"Fraunces", "Iowan Old Style", Georgia, serif',
    sans:  '"DM Sans", system-ui, -apple-system, sans-serif',
    mono:  '"DM Mono", ui-monospace, monospace',
    radius: 8,
    radiusLg: 14,
    shadow: '0 1px 2px rgba(31,26,20,0.04), 0 12px 32px -16px rgba(31,26,20,0.18)',
  },
  vellum: {
    name: 'Vellum',
    tagline: 'Quieter, more editorial — paper-white, hairline-led',
    voice: 'Curatorial. The app as a quiet library.',
    bg: '#F7F4EC',
    surface: '#FDFBF5',
    surfaceAlt: '#EDE8DB',
    ink: '#2A2620',
    inkSoft: '#6B6557',
    inkMute: '#A09988',
    rule: 'rgba(42,38,32,0.12)',
    accent: '#8B5E3C',      // keep the brand brown
    accentSoft: 'rgba(139,94,60,0.08)',
    gold: '#C2874F',
    serif: '"Fraunces", "Iowan Old Style", Georgia, serif',
    sans:  '"DM Sans", system-ui, -apple-system, sans-serif',
    mono:  '"DM Mono", ui-monospace, monospace',
    radius: 4,
    radiusLg: 8,
    shadow: '0 1px 0 rgba(42,38,32,0.04)',
  },
  dusk: {
    name: 'Dusk',
    tagline: 'Evening read — deep ink, cream type, brass accents',
    voice: 'Storyteller after dark. Same fonts, inverted mood.',
    bg: '#1A1F2A',
    surface: '#222836',
    surfaceAlt: '#2C3344',
    ink: '#ECE5D4',
    inkSoft: '#B8B1A0',
    inkMute: '#7A7567',
    rule: 'rgba(236,229,212,0.14)',
    accent: '#D4A85A',      // brass replaces brown for contrast
    accentSoft: 'rgba(212,168,90,0.14)',
    gold: '#D4A85A',
    serif: '"Fraunces", "Iowan Old Style", Georgia, serif',
    sans:  '"DM Sans", system-ui, -apple-system, sans-serif',
    mono:  '"DM Mono", ui-monospace, monospace',
    radius: 8,
    radiusLg: 12,
    shadow: '0 1px 0 rgba(0,0,0,0.4), 0 12px 32px -16px rgba(0,0,0,0.6)',
  },
};

// Type ramp shared across directions — multigenerational legibility.
// Sizes lean larger than typical web defaults so older eyes are comfortable.
const TYPE = {
  display: { size: 64, line: 1.05, weight: 400, tracking: '-0.02em' },
  h1:      { size: 40, line: 1.10, weight: 500, tracking: '-0.015em' },
  h2:      { size: 28, line: 1.20, weight: 500, tracking: '-0.01em' },
  h3:      { size: 20, line: 1.30, weight: 600, tracking: '0' },
  body:    { size: 17, line: 1.55, weight: 400, tracking: '0' },
  bodyLg:  { size: 19, line: 1.55, weight: 400, tracking: '0' },
  small:   { size: 14, line: 1.45, weight: 400, tracking: '0.005em' },
  micro:   { size: 12, line: 1.4,  weight: 500, tracking: '0.06em' },
};

// Spacing scale — 4px base, generous.
const SPACE = [0, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 128];

// Helpers
const t = (token) => ({
  fontSize: token.size,
  lineHeight: token.line,
  fontWeight: token.weight,
  letterSpacing: token.tracking,
});

window.DIRECTIONS = DIRECTIONS;
window.TYPE = TYPE;
window.SPACE = SPACE;
window.tokenStyle = t;
