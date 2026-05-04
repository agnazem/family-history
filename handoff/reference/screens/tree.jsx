// Tree / Pedigree view — the centerpiece.
// Design intent: a tree should feel like a constellation, not a hierarchy chart.
// Hairlines connecting nodes, soft accents on the focused person, era band
// running along the side as a temporal anchor.

function TreeBoard({ direction }) {
  const dir = window.DIRECTIONS[direction];
  const { Eyebrow, Serif, Btn, Avatar, Icon, PhotoPlaceholder } = window;

  // Coordinates for tree nodes — generations are columns.
  // Generations: G0 (great-grand) → G3 (current).
  // x = generation, y = row.
  const W = 1100, H = 720;
  const GEN_X = [120, 360, 620, 900];

  // node = { id, x, y, name, years, gen, focused?, deceased? }
  const nodes = [
    // G0 (1880s)
    { id:'g0a', x:GEN_X[0], y:160, name:'Giovanni', surname:'Russo', years:'1894–1962', gen:0 },
    { id:'g0b', x:GEN_X[0], y:260, name:'Concetta', surname:'Russo', years:'1901–1979', gen:0, partner:'g0a' },
    { id:'g0c', x:GEN_X[0], y:480, name:'Antonio', surname:'Marcaccio', years:'1890–1955', gen:0 },
    { id:'g0d', x:GEN_X[0], y:580, name:'Maria', surname:'Marcaccio', years:'1895–1968', gen:0, partner:'g0c' },
    // G1 (Eleanor + Frank)
    { id:'g1a', x:GEN_X[1], y:210, name:'Eleanor', surname:'Marcaccio', years:'1927–', gen:1, focused:true },
    { id:'g1b', x:GEN_X[1], y:530, name:'Frank Sr.', surname:'Marcaccio', years:'1924–2011', gen:1, partner:'g1a' },
    // G2 (children)
    { id:'g2a', x:GEN_X[2], y:140, name:'Frank Jr.', surname:'Marcaccio', years:'1948–', gen:2 },
    { id:'g2b', x:GEN_X[2], y:340, name:'Michael', surname:'Marcaccio', years:'1952–', gen:2 },
    { id:'g2c', x:GEN_X[2], y:540, name:'Anna', surname:'Marcaccio', years:'1955–', gen:2 },
    // G3 (grandchildren — Jamie is "you")
    { id:'g3a', x:GEN_X[3], y:80,  name:'Sofia',  surname:'M.', years:'1978–', gen:3 },
    { id:'g3b', x:GEN_X[3], y:180, name:'Tony',   surname:'M.', years:'1981–', gen:3 },
    { id:'g3c', x:GEN_X[3], y:300, name:'Jamie',  surname:'M.', years:'1989–', gen:3, you:true },
    { id:'g3d', x:GEN_X[3], y:400, name:'Rosa',   surname:'M.', years:'1992–', gen:3 },
    { id:'g3e', x:GEN_X[3], y:520, name:'Lena',   surname:'M.', years:'1986–', gen:3 },
    { id:'g3f', x:GEN_X[3], y:620, name:'Marco',  surname:'M.', years:'1990–', gen:3 },
  ];

  // edges: parent → child (or partner couples → child)
  const edges = [
    // g0a/g0b → g1a
    { from: { x: GEN_X[0]+100, y: 210 }, to: { x: GEN_X[1]-30, y: 210 } },
    // g0c/g0d → g1b
    { from: { x: GEN_X[0]+100, y: 530 }, to: { x: GEN_X[1]-30, y: 530 } },
    // g1a/g1b → g2 children
    { from: { x: GEN_X[1]+100, y: 370 }, to: { x: GEN_X[2]-30, y: 140 } },
    { from: { x: GEN_X[1]+100, y: 370 }, to: { x: GEN_X[2]-30, y: 340 } },
    { from: { x: GEN_X[1]+100, y: 370 }, to: { x: GEN_X[2]-30, y: 540 } },
    // g2 → g3
    { from: { x: GEN_X[2]+100, y: 140 }, to: { x: GEN_X[3]-30, y: 80 } },
    { from: { x: GEN_X[2]+100, y: 140 }, to: { x: GEN_X[3]-30, y: 180 } },
    { from: { x: GEN_X[2]+100, y: 340 }, to: { x: GEN_X[3]-30, y: 300 } },
    { from: { x: GEN_X[2]+100, y: 340 }, to: { x: GEN_X[3]-30, y: 400 } },
    { from: { x: GEN_X[2]+100, y: 540 }, to: { x: GEN_X[3]-30, y: 520 } },
    { from: { x: GEN_X[2]+100, y: 540 }, to: { x: GEN_X[3]-30, y: 620 } },
  ];

  // Partner ties (vertical hairlines)
  const partners = [
    { x: GEN_X[0]+50, y1: 200, y2: 220 },
    { x: GEN_X[0]+50, y1: 520, y2: 540 },
    { x: GEN_X[1]+50, y1: 250, y2: 490 },
  ];

  return (
    <window.DirProvider direction={direction}>
      <div style={{ background: dir.bg, color: dir.ink, fontFamily: dir.sans, minHeight: '100%' }}>
        {/* Top bar */}
        <div style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${dir.rule}` }}>
          <div>
            <Eyebrow>The Marcaccios · Pedigree</Eyebrow>
            <div style={{ fontFamily: dir.serif, fontSize: 28, fontStyle: 'italic', marginTop: 4 }}>Four generations · 68 people</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Btn kind="ghost" size="sm">All</Btn>
            <Btn kind="ghost" size="sm">Russo line</Btn>
            <Btn kind="ghost" size="sm">Marcaccio line</Btn>
            <div style={{ width: 1, height: 22, background: dir.rule, margin: '0 6px' }}/>
            <Btn kind="primary" size="sm" icon={<Icon name="plus" size={13}/>}>Add person</Btn>
          </div>
        </div>

        <div style={{ padding: '24px 40px 40px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
          {/* Tree canvas */}
          <div style={{
            background: dir.surface,
            border: `1px solid ${dir.rule}`,
            borderRadius: dir.radiusLg,
            position: 'relative',
            height: H + 80,
            overflow: 'hidden',
          }}>
            {/* Generation column headers */}
            <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', pointerEvents: 'none' }}>
              {['Great-grandparents · 1890s','Grandparents · 1920s','Parents · 1950s','You & cousins · 1980s'].map((label, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: GEN_X[i] - 60, width: 200,
                  fontFamily: dir.mono, fontSize: 10, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: dir.inkMute,
                  textAlign: 'center',
                }}>{label}</div>
              ))}
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', top: 60, left: 0, width: '100%', height: H }}>
              {/* Edges */}
              {edges.map((e, i) => {
                const midX = (e.from.x + e.to.x) / 2;
                return (
                  <path key={i}
                    d={`M ${e.from.x} ${e.from.y} C ${midX} ${e.from.y}, ${midX} ${e.to.y}, ${e.to.x} ${e.to.y}`}
                    fill="none" stroke={dir.rule} strokeWidth="1"/>
                );
              })}
              {/* Partner ties */}
              {partners.map((p, i) => (
                <line key={i} x1={p.x} y1={p.y1} x2={p.x} y2={p.y2} stroke={dir.inkMute} strokeWidth="1" strokeDasharray="2 3"/>
              ))}
            </svg>

            {/* Nodes */}
            {nodes.map(n => (
              <TreeNode key={n.id} dir={dir} node={n}/>
            ))}
          </div>

          {/* Side rail — focused person summary */}
          <div>
            <div style={{
              background: dir.surface,
              border: `1px solid ${dir.rule}`,
              borderRadius: dir.radiusLg,
              padding: 24,
              marginBottom: 16,
            }}>
              <Eyebrow style={{ color: dir.accent, marginBottom: 12 }}>Focused</Eyebrow>
              <PhotoPlaceholder w="100%" h={180} label="Eleanor · 1948" style={{ marginBottom: 16 }}/>
              <div style={{ fontFamily: dir.serif, fontSize: 32, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em' }}>Eleanor</div>
              <div style={{ fontFamily: dir.serif, fontStyle: 'italic', fontSize: 22, color: dir.inkSoft, marginBottom: 12 }}>Marcaccio</div>
              <div style={{ fontSize: 13, fontFamily: dir.mono, color: dir.inkMute, letterSpacing: '0.06em', marginBottom: 16 }}>1927 — present · age 98</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: dir.inkSoft, marginBottom: 16 }}>
                Maternal grandmother. <Serif italic>23 memories recorded.</Serif> Last call: <Serif italic>17 days ago</Serif>.
              </div>
              <Btn kind="primary" size="sm" style={{ width: '100%', justifyContent: 'center' }} icon={<Icon name="user" size={14}/>}>Open profile</Btn>
            </div>
            <div style={{
              background: dir.surface, border: `1px solid ${dir.rule}`,
              borderRadius: dir.radiusLg, padding: 20,
            }}>
              <Eyebrow style={{ marginBottom: 12 }}>Legend</Eyebrow>
              <LegendRow dir={dir} dot={<Avatar size={20} initials="·"/>} label="Living"/>
              <LegendRow dir={dir} dot={<div style={{ width: 20, height: 20, borderRadius: 999, background: dir.surfaceAlt, border: `1px solid ${dir.rule}` }}/>} label="Deceased"/>
              <LegendRow dir={dir} dot={<div style={{ width: 20, height: 20, borderRadius: 999, border: `2px solid ${dir.accent}` }}/>} label="Focused"/>
              <LegendRow dir={dir} dot={<div style={{ width: 20, height: 1, background: dir.inkMute, borderTop: `1px dashed ${dir.inkMute}`, height: 0 }}/>} label="Partnership"/>
            </div>
          </div>
        </div>
      </div>
    </window.DirProvider>
  );
}

function TreeNode({ dir, node }) {
  const { Avatar, Serif } = window;
  const focused = node.focused;
  const you = node.you;
  return (
    <div style={{
      position: 'absolute',
      left: node.x - 60, top: node.y - 30 + 60,
      width: 130,
      padding: 10,
      background: focused ? dir.accentSoft : dir.bg,
      border: `1px solid ${focused ? dir.accent : dir.rule}`,
      borderRadius: dir.radius,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <Avatar size={32} initials={node.name[0]} ring={focused}/>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: dir.ink, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.name}{you && <span style={{ color: dir.accent, marginLeft: 4 }}>·</span>}
        </div>
        <div style={{ fontSize: 9, fontFamily: dir.mono, color: dir.inkMute, letterSpacing: '0.04em', marginTop: 2 }}>
          {node.years}
        </div>
      </div>
    </div>
  );
}

function LegendRow({ dir, dot, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 13, color: dir.inkSoft }}>
      <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>{dot}</div>
      {label}
    </div>
  );
}

window.TreeBoard = TreeBoard;
