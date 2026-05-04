// Shared primitives that adapt to a direction's tokens via context.

const DirCtx = React.createContext(window.DIRECTIONS.hearth);
const useDir = () => React.useContext(DirCtx);

function DirProvider({ direction, children }) {
  const dir = window.DIRECTIONS[direction];
  return <DirCtx.Provider value={dir}>{children}</DirCtx.Provider>;
}

// Subtly-striped photo placeholder — never hand-drawn imagery.
function PhotoPlaceholder({ label = 'photo', w, h, style, tone = 'auto', round = false }) {
  const dir = useDir();
  const base = tone === 'dark' || (tone === 'auto' && dir.name === 'Dusk') ? '#3a4050' : '#cdc4b0';
  const stripe = tone === 'dark' || (tone === 'auto' && dir.name === 'Dusk') ? '#2e3445' : '#bdb39d';
  const ink = tone === 'dark' || (tone === 'auto' && dir.name === 'Dusk') ? 'rgba(236,229,212,0.55)' : 'rgba(31,26,20,0.5)';
  return (
    <div style={{
      width: w, height: h,
      background: `repeating-linear-gradient(135deg, ${base} 0 8px, ${stripe} 8px 16px)`,
      borderRadius: round ? 999 : dir.radius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: dir.mono, fontSize: 10, letterSpacing: '0.08em',
      color: ink, textTransform: 'uppercase',
      flexShrink: 0,
      ...style,
    }}>
      {label}
    </div>
  );
}

// Audio waveform placeholder — abstract bars, not pretending to be a real waveform.
function WaveformPlaceholder({ w = 200, h = 32, bars = 40, color, style }) {
  const dir = useDir();
  const c = color || dir.inkSoft;
  // Deterministic pseudo-random heights so it's stable.
  const heights = React.useMemo(() => {
    const out = [];
    let seed = 7;
    for (let i = 0; i < bars; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      out.push(0.2 + (seed / 233280) * 0.8);
    }
    return out;
  }, [bars]);
  return (
    <div style={{ width: w, height: h, display: 'flex', alignItems: 'center', gap: 2, ...style }}>
      {heights.map((hh, i) => (
        <div key={i} style={{
          flex: 1, height: `${hh * 100}%`,
          background: c, borderRadius: 1, opacity: 0.7,
        }} />
      ))}
    </div>
  );
}

// Avatar — circular photo placeholder with optional initials.
function Avatar({ size = 44, initials, src, ring }) {
  const dir = useDir();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: dir.surfaceAlt, color: dir.inkSoft,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: dir.serif, fontStyle: 'italic',
      fontSize: size * 0.42, fontWeight: 400,
      flexShrink: 0,
      boxShadow: ring ? `0 0 0 2px ${dir.bg}, 0 0 0 3px ${dir.accent}` : 'none',
      backgroundImage: `repeating-linear-gradient(135deg, ${dir.surfaceAlt} 0 6px, ${dir.bg} 6px 12px)`,
    }}>
      {initials}
    </div>
  );
}

// Button
function Btn({ children, kind = 'ghost', size = 'md', icon, onClick, style }) {
  const dir = useDir();
  const pad = size === 'lg' ? '14px 22px' : size === 'sm' ? '6px 12px' : '10px 18px';
  const fs = size === 'lg' ? 17 : size === 'sm' ? 13 : 15;
  const styles = {
    primary: { background: dir.ink, color: dir.bg, border: '1px solid ' + dir.ink },
    accent:  { background: dir.accent, color: '#fff', border: '1px solid ' + dir.accent },
    ghost:   { background: 'transparent', color: dir.ink, border: '1px solid ' + dir.rule },
    quiet:   { background: 'transparent', color: dir.inkSoft, border: 'none', padding: '6px 8px' },
  };
  return (
    <button onClick={onClick} style={{
      ...styles[kind],
      padding: pad,
      fontSize: fs,
      fontFamily: dir.sans,
      fontWeight: 500,
      borderRadius: dir.radius,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 8,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon}{children}
    </button>
  );
}

// Eyebrow / category tag — uppercase mono micro
function Eyebrow({ children, color, style }) {
  const dir = useDir();
  return (
    <div style={{
      fontFamily: dir.mono,
      fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: color || dir.inkMute, fontWeight: 500,
      ...style,
    }}>{children}</div>
  );
}

// Italic serif accent — used for years, whispers, subtitles
function Serif({ children, italic = true, style, size }) {
  const dir = useDir();
  return (
    <span style={{
      fontFamily: dir.serif,
      fontStyle: italic ? 'italic' : 'normal',
      fontWeight: 400,
      fontSize: size,
      ...style,
    }}>{children}</span>
  );
}

// Card / surface
function Surface({ children, style, raised = false, padding = 20 }) {
  const dir = useDir();
  return (
    <div style={{
      background: dir.surface,
      border: `1px solid ${dir.rule}`,
      borderRadius: dir.radiusLg,
      padding,
      boxShadow: raised ? dir.shadow : 'none',
      ...style,
    }}>{children}</div>
  );
}

// Divider with optional centered label
function Rule({ label, style }) {
  const dir = useDir();
  if (!label) return <div style={{ height: 1, background: dir.rule, ...style }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}>
      <div style={{ flex: 1, height: 1, background: dir.rule }} />
      <Eyebrow>{label}</Eyebrow>
      <div style={{ flex: 1, height: 1, background: dir.rule }} />
    </div>
  );
}

// Icon — minimal stroked glyphs (no fancy SVG).
function Icon({ name, size = 18, color, stroke = 1.5, style }) {
  const dir = useDir();
  const c = color || 'currentColor';
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'mic':       return <svg {...common}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    case 'photo':     return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="11" r="1.5"/><path d="M21 16l-5-5-9 8"/></svg>;
    case 'video':     return <svg {...common}><rect x="3" y="6" width="13" height="12" rx="1"/><path d="M16 10l5-3v10l-5-3z"/></svg>;
    case 'doc':       return <svg {...common}><path d="M7 3h8l4 4v14H7zM15 3v4h4M9 12h8M9 16h8M9 8h3"/></svg>;
    case 'tree':      return <svg {...common}><circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M12 7.5V12M12 12L6 15.5M12 12l6 3.5"/></svg>;
    case 'heart':     return <svg {...common}><path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"/></svg>;
    case 'plus':      return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'search':    return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case 'arrow':     return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'play':      return <svg {...common}><path d="M7 5v14l12-7z" fill={c}/></svg>;
    case 'pause':     return <svg {...common}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>;
    case 'menu':      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    case 'bell':      return <svg {...common}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5z"/><path d="M10 21h4"/></svg>;
    case 'user':      return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
    case 'home':      return <svg {...common}><path d="M4 11l8-7 8 7v9h-6v-6h-4v6H4z"/></svg>;
    case 'pin':       return <svg {...common}><path d="M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1z"/></svg>;
    case 'calendar':  return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'mappin':    return <svg {...common}><path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'check':     return <svg {...common}><path d="M5 12l5 5 9-10"/></svg>;
    case 'more':      return <svg {...common}><circle cx="5" cy="12" r="1" fill={c}/><circle cx="12" cy="12" r="1" fill={c}/><circle cx="19" cy="12" r="1" fill={c}/></svg>;
    case 'link':      return <svg {...common}><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1"/></svg>;
    default: return null;
  }
}

window.DirCtx = DirCtx;
window.useDir = useDir;
window.DirProvider = DirProvider;
window.PhotoPlaceholder = PhotoPlaceholder;
window.WaveformPlaceholder = WaveformPlaceholder;
window.Avatar = Avatar;
window.Btn = Btn;
window.Eyebrow = Eyebrow;
window.Serif = Serif;
window.Surface = Surface;
window.Rule = Rule;
window.Icon = Icon;
