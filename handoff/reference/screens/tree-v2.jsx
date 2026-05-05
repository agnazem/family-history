// Tree / Pedigree view — v2 with direct-lineage emphasis + click-to-reroot.
// "Direct" lineage of subject S includes: ancestors of S, descendants of S,
// siblings of S, spouse of S, and the spouses of any direct ancestor or
// descendant. Aunts/uncles and cousins remain collateral.
// Click any node to make them the lineage subject; their chain lights up.

function TreeBoardV2({ direction }) {
  const dir = window.DIRECTIONS[direction];
  const { Eyebrow, Serif, Btn, Avatar, Icon, PhotoPlaceholder } = window;
  const [lineageMode, setLineageMode] = React.useState(false);
  const [subjectId, setSubjectId] = React.useState('g3c'); // Jamie = you, default

  const W = 1100, H = 720;
  const GEN_X = [120, 360, 620, 900];

  // Relational graph. parents: list of parent ids. spouseOf: id of spouse, if any.
  // siblings are derived (anyone sharing a parent with the subject).
  const rawNodes = [
    { id:'g0a', x:GEN_X[0], y:160, name:'Giovanni', surname:'Russo',     years:'1894–1962', gen:0, parents:[],         spouseOf:'g0b' },
    { id:'g0b', x:GEN_X[0], y:260, name:'Concetta', surname:'Russo',     years:'1901–1979', gen:0, parents:[],         spouseOf:'g0a' },
    { id:'g0c', x:GEN_X[0], y:480, name:'Antonio',  surname:'Marcaccio', years:'1890–1955', gen:0, parents:[],         spouseOf:'g0d' },
    { id:'g0d', x:GEN_X[0], y:580, name:'Maria',    surname:'Marcaccio', years:'1895–1968', gen:0, parents:[],         spouseOf:'g0c' },
    { id:'g1a', x:GEN_X[1], y:210, name:'Eleanor',  surname:'Marcaccio', years:'1927–',     gen:1, parents:['g0a','g0b'], spouseOf:'g1b', focused:true },
    { id:'g1b', x:GEN_X[1], y:530, name:'Frank Sr.',surname:'Marcaccio', years:'1924–2011', gen:1, parents:['g0c','g0d'], spouseOf:'g1a' },
    { id:'g2a', x:GEN_X[2], y:140, name:'Frank Jr.',surname:'Marcaccio', years:'1948–',     gen:2, parents:['g1a','g1b'] },
    { id:'g2b', x:GEN_X[2], y:340, name:'Michael',  surname:'Marcaccio', years:'1952–',     gen:2, parents:['g1a','g1b'] },
    { id:'g2c', x:GEN_X[2], y:540, name:'Anna',     surname:'Marcaccio', years:'1955–',     gen:2, parents:['g1a','g1b'] },
    { id:'g3a', x:GEN_X[3], y:80,  name:'Sofia',    surname:'M.', years:'1978–', gen:3, parents:['g2a'] },
    { id:'g3b', x:GEN_X[3], y:180, name:'Tony',     surname:'M.', years:'1981–', gen:3, parents:['g2a'] },
    { id:'g3c', x:GEN_X[3], y:300, name:'Jamie',    surname:'M.', years:'1989–', gen:3, parents:['g2b'], you:true },
    { id:'g3d', x:GEN_X[3], y:400, name:'Rosa',     surname:'M.', years:'1992–', gen:3, parents:['g2b'] },
    { id:'g3e', x:GEN_X[3], y:520, name:'Lena',     surname:'M.', years:'1986–', gen:3, parents:['g2c'] },
    { id:'g3f', x:GEN_X[3], y:620, name:'Marco',    surname:'M.', years:'1990–', gen:3, parents:['g2c'] },
  ];
  const byId = Object.fromEntries(rawNodes.map(n => [n.id, n]));

  // Compute direct-lineage set for a given subject.
  function computeLineage(subjId) {
    const direct = new Set([subjId]);
    // Ancestors (recursive up parents).
    const climb = (id) => {
      const n = byId[id]; if (!n) return;
      for (const p of n.parents) { direct.add(p); climb(p); }
    };
    climb(subjId);
    // Descendants (recursive down).
    const descend = (id) => {
      for (const n of rawNodes) {
        if (n.parents.includes(id)) { direct.add(n.id); descend(n.id); }
      }
    };
    descend(subjId);
    // Siblings (share a parent with subject).
    const subj = byId[subjId];
    if (subj && subj.parents.length) {
      for (const n of rawNodes) {
        if (n.id === subjId) continue;
        if (n.parents.some(p => subj.parents.includes(p))) direct.add(n.id);
      }
    }
    // Spouse of subject + spouses of any direct ancestor or descendant.
    const withSpouses = new Set(direct);
    for (const id of direct) {
      const sp = byId[id]?.spouseOf;
      if (sp) withSpouses.add(sp);
    }
    return withSpouses;
  }

  const directSet = computeLineage(subjectId);
  const subjectNode = byId[subjectId];
  const isAtSelf = subjectId === 'g3c';

  const nodes = rawNodes.map(n => ({ ...n, lineage: directSet.has(n.id) ? 'direct' : 'collateral' }));

  // Edges: parent → child. Spine = both endpoints in direct set.
  const edges = [
    { fromId:'g0a-b', toId:'g1a', from:{x:GEN_X[0]+100,y:210}, to:{x:GEN_X[1]-30,y:210}, parents:['g0a','g0b'], childId:'g1a' },
    { fromId:'g0c-d', toId:'g1b', from:{x:GEN_X[0]+100,y:530}, to:{x:GEN_X[1]-30,y:530}, parents:['g0c','g0d'], childId:'g1b' },
    { fromId:'g1a-b', toId:'g2a', from:{x:GEN_X[1]+100,y:370}, to:{x:GEN_X[2]-30,y:140}, parents:['g1a','g1b'], childId:'g2a' },
    { fromId:'g1a-b', toId:'g2b', from:{x:GEN_X[1]+100,y:370}, to:{x:GEN_X[2]-30,y:340}, parents:['g1a','g1b'], childId:'g2b' },
    { fromId:'g1a-b', toId:'g2c', from:{x:GEN_X[1]+100,y:370}, to:{x:GEN_X[2]-30,y:540}, parents:['g1a','g1b'], childId:'g2c' },
    { fromId:'g2a',   toId:'g3a', from:{x:GEN_X[2]+100,y:140}, to:{x:GEN_X[3]-30,y:80 }, parents:['g2a'], childId:'g3a' },
    { fromId:'g2a',   toId:'g3b', from:{x:GEN_X[2]+100,y:140}, to:{x:GEN_X[3]-30,y:180}, parents:['g2a'], childId:'g3b' },
    { fromId:'g2b',   toId:'g3c', from:{x:GEN_X[2]+100,y:340}, to:{x:GEN_X[3]-30,y:300}, parents:['g2b'], childId:'g3c' },
    { fromId:'g2b',   toId:'g3d', from:{x:GEN_X[2]+100,y:340}, to:{x:GEN_X[3]-30,y:400}, parents:['g2b'], childId:'g3d' },
    { fromId:'g2c',   toId:'g3e', from:{x:GEN_X[2]+100,y:540}, to:{x:GEN_X[3]-30,y:520}, parents:['g2c'], childId:'g3e' },
    { fromId:'g2c',   toId:'g3f', from:{x:GEN_X[2]+100,y:540}, to:{x:GEN_X[3]-30,y:620}, parents:['g2c'], childId:'g3f' },
  ].map(e => ({ ...e, spine: e.parents.every(p => directSet.has(p)) && directSet.has(e.childId) }));

  const partners = [
    { x:GEN_X[0]+50, y1:200, y2:220 },
    { x:GEN_X[0]+50, y1:520, y2:540 },
    { x:GEN_X[1]+50, y1:250, y2:490 },
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
            <Btn
              kind={lineageMode ? 'accent' : 'ghost'}
              size="sm"
              onClick={() => setLineageMode(v => !v)}
              icon={<Icon name="user" size={13}/>}
            >Highlight line</Btn>
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
            {/* Subject pill — shows whose line is currently highlighted */}
            <div style={{
              position: 'absolute', top: 16, right: 16, zIndex: 5,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px 6px 8px',
              background: dir.accentSoft, border: `1px solid ${dir.accent}`,
              borderRadius: 999, fontSize: 12, color: dir.ink,
            }}>
              <span style={{ fontFamily: dir.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: dir.accent }}>Line of</span>
              <span style={{ fontFamily: dir.serif, fontStyle: 'italic', fontSize: 14 }}>{subjectNode?.name}</span>
              {!isAtSelf && (
                <button
                  onClick={() => setSubjectId('g3c')}
                  style={{ marginLeft: 4, padding: '2px 8px', background: dir.surface, border: `1px solid ${dir.rule}`, borderRadius: 999, fontSize: 11, color: dir.inkSoft, cursor: 'pointer', fontFamily: dir.sans }}
                >← back to me</button>
              )}
            </div>

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

            <svg viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', top: 60, left: 0, width: '100%', height: H, pointerEvents: 'none' }}>
              {edges.map((e, i) => {
                const midX = (e.from.x + e.to.x) / 2;
                const isSpine = e.spine;
                const dimmed = lineageMode && !isSpine;
                return (
                  <path key={i}
                    d={`M ${e.from.x} ${e.from.y} C ${midX} ${e.from.y}, ${midX} ${e.to.y}, ${e.to.x} ${e.to.y}`}
                    fill="none"
                    stroke={isSpine ? dir.inkMute : dir.rule}
                    strokeWidth={isSpine ? 1.5 : 1}
                    opacity={dimmed ? 0.3 : 1}
                  />
                );
              })}
              {partners.map((p, i) => (
                <line key={i} x1={p.x} y1={p.y1} x2={p.x} y2={p.y2} stroke={dir.inkMute} strokeWidth="1" strokeDasharray="2 3"/>
              ))}
            </svg>

            {/* Nodes */}
            {nodes.map(n => (
              <TreeNodeV2
                key={n.id}
                dir={dir}
                node={n}
                lineageMode={lineageMode}
                isSubject={n.id === subjectId}
                onClick={() => setSubjectId(n.id)}
              />
            ))}
          </div>

          {/* Side rail */}
          <div>
            <div style={{
              background: dir.surface,
              border: `1px solid ${dir.rule}`,
              borderRadius: dir.radiusLg,
              padding: 24,
              marginBottom: 16,
            }}>
              <Eyebrow style={{ color: dir.accent, marginBottom: 12 }}>Lineage subject</Eyebrow>
              <PhotoPlaceholder w="100%" h={180} label={`${subjectNode?.name} · portrait`} style={{ marginBottom: 16 }}/>
              <div style={{ fontFamily: dir.serif, fontSize: 32, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em' }}>{subjectNode?.name}</div>
              <div style={{ fontFamily: dir.serif, fontStyle: 'italic', fontSize: 22, color: dir.inkSoft, marginBottom: 12 }}>{subjectNode?.surname}</div>
              <div style={{ fontSize: 13, fontFamily: dir.mono, color: dir.inkMute, letterSpacing: '0.06em', marginBottom: 16 }}>{subjectNode?.years}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: dir.inkSoft, marginBottom: 16 }}>
                {directSet.size - 1} people in <Serif italic>{subjectNode?.name}'s direct lineage</Serif> — ancestors, descendants, siblings, and spouses.
              </div>
              <Btn kind="primary" size="sm" style={{ width: '100%', justifyContent: 'center' }} icon={<Icon name="user" size={14}/>}>Open profile</Btn>
            </div>
            <div style={{
              background: dir.surface, border: `1px solid ${dir.rule}`,
              borderRadius: dir.radiusLg, padding: 20,
            }}>
              <Eyebrow style={{ marginBottom: 12 }}>Legend</Eyebrow>
              <LegendRowV2 dir={dir} dot={
                <div style={{ width: 20, height: 20, borderRadius: 6, background: dir.surface, border: `1px solid ${dir.ink}` }}/>
              } label={<span><Serif>Direct lineage</Serif> — ancestors, descendants, siblings, spouses</span>}/>
              <LegendRowV2 dir={dir} dot={
                <div style={{ width: 20, height: 20, borderRadius: 6, background: 'transparent', border: `1px dashed ${dir.rule}` }}/>
              } label="Collateral — aunts, uncles, cousins"/>
              <LegendRowV2 dir={dir} dot={<div style={{ width: 20, height: 20, borderRadius: 999, border: `2px solid ${dir.accent}` }}/>} label="Lineage subject (click any node)"/>
              <LegendRowV2 dir={dir} dot={<div style={{ width: 20, height: 1, background: dir.inkMute }}/>} label="Spine edge (thicker)"/>
            </div>
          </div>
        </div>
      </div>
    </window.DirProvider>
  );
}

function TreeNodeV2({ dir, node, lineageMode, isSubject, onClick }) {
  const { Avatar, Serif } = window;
  const direct = node.lineage === 'direct';
  const dimmed = lineageMode && !direct;

  // Tiers:
  //   subject     → accent fill + accent border (highest)
  //   direct      → cream surface, full ink border, Fraunces name
  //   collateral  → bg fill, dashed soft border, ink-soft name
  const bg = isSubject ? dir.accentSoft : direct ? dir.surface : dir.bg;
  const borderColor = isSubject ? dir.accent : direct ? dir.ink : dir.rule;
  const borderStyle = direct || isSubject ? 'solid' : 'dashed';
  const borderWidth = isSubject ? 1.5 : 1;
  const nameColor = direct || isSubject ? dir.ink : dir.inkSoft;
  const nameFamily = direct || isSubject ? dir.serif : dir.sans;
  const nameSize = direct || isSubject ? 14 : 12;
  const nameWeight = direct || isSubject ? 500 : 400;
  const avatarSize = direct || isSubject ? 36 : 30;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: node.x - 65, top: node.y - 30 + 60,
        width: 140,
        padding: direct || isSubject ? 11 : 9,
        background: bg,
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: dir.radius,
        display: 'flex', alignItems: 'center', gap: 10,
        opacity: dimmed ? 0.35 : 1,
        transition: 'opacity 200ms ease, background 200ms ease, border-color 200ms ease',
        boxShadow: direct && !isSubject ? `0 0 0 3px ${dir.bg}` : 'none',
        cursor: 'pointer',
        zIndex: isSubject ? 3 : 2,
      }}
    >
      <Avatar size={avatarSize} initials={node.name[0]} ring={isSubject}/>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: nameFamily, fontSize: nameSize, fontWeight: nameWeight,
          color: nameColor, lineHeight: 1.1,
          letterSpacing: nameFamily === dir.serif ? '-0.01em' : '0',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {node.name}{node.you && <span style={{ color: dir.accent, marginLeft: 4, fontFamily: dir.sans, fontSize: 10, fontWeight: 500 }}>YOU</span>}
        </div>
        <div style={{ fontSize: 9, fontFamily: dir.mono, color: dir.inkMute, letterSpacing: '0.04em', marginTop: 2 }}>
          {node.years}
        </div>
      </div>
    </div>
  );
}

function LegendRowV2({ dir, dot, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '5px 0', fontSize: 13, color: dir.inkSoft, lineHeight: 1.4 }}>
      <div style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0, paddingTop: 2 }}>{dot}</div>
      <div>{label}</div>
    </div>
  );
}

window.TreeBoardV2 = TreeBoardV2;
