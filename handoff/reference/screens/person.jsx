// Person profile — Eleanor Marcaccio.
// Design intent: a person, not a database row. Big portrait,
// life dates set in serif, a "cabinet" of their memories below,
// relationships clear but not noisy.

function PersonBoard({ direction }) {
  const dir = window.DIRECTIONS[direction];
  const { Eyebrow, Serif, Btn, Surface, Avatar, PhotoPlaceholder, WaveformPlaceholder, Icon } = window;

  return (
    <window.DirProvider direction={direction}>
      <div style={{ background: dir.bg, color: dir.ink, fontFamily: dir.sans, minHeight: '100%' }}>
        {/* Breadcrumb */}
        <div style={{ padding: '16px 40px', borderBottom: `1px solid ${dir.rule}`, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: dir.inkMute, fontFamily: dir.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span>People</span>
          <span>›</span>
          <span>Marcaccio</span>
          <span>›</span>
          <span style={{ color: dir.ink }}>Eleanor</span>
          <div style={{ flex: 1 }}/>
          <Btn kind="ghost" size="sm" icon={<Icon name="link" size={13}/>}>Share</Btn>
          <Btn kind="ghost" size="sm" icon={<Icon name="plus" size={13}/>}>Add memory</Btn>
        </div>

        {/* Hero band */}
        <div style={{ padding: '48px 40px 32px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 48, alignItems: 'flex-start' }}>
          <div>
            <PhotoPlaceholder w={320} h={400} label="portrait · 1948" style={{ borderRadius: dir.radiusLg }}/>
            <div style={{ marginTop: 12, fontSize: 12, color: dir.inkMute, fontFamily: dir.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Brooklyn · age 21
            </div>
          </div>
          <div>
            <Eyebrow style={{ marginBottom: 12 }}>Maternal grandmother · 3rd generation</Eyebrow>
            <h1 style={{ fontFamily: dir.serif, fontSize: 80, fontWeight: 400, lineHeight: 1, margin: 0, letterSpacing: '-0.03em' }}>
              Eleanor
            </h1>
            <div style={{ fontFamily: dir.serif, fontSize: 56, fontStyle: 'italic', fontWeight: 400, lineHeight: 1, margin: '4px 0 24px', color: dir.inkSoft, letterSpacing: '-0.02em' }}>
              Marcaccio
            </div>
            <div style={{ display: 'flex', gap: 32, marginBottom: 32, flexWrap: 'wrap' }}>
              <Fact dir={dir} label="Born" v="1927" sub="Brooklyn, NY"/>
              <Fact dir={dir} label="Née" v={<Serif italic>Russo</Serif>} sub="Naples, Italy"/>
              <Fact dir={dir} label="Living" v="98" sub="Hudson Valley, NY"/>
              <Fact dir={dir} label="Children" v="3" sub="Frank, Michael, Anna"/>
            </div>
            <div style={{ fontFamily: dir.serif, fontSize: 22, lineHeight: 1.5, color: dir.inkSoft, maxWidth: 580 }}>
              Youngest of seven. Came through Ellis with her mother in <Serif italic>1932</Serif>. Worked the floor at Loew's Kings until she met Frank. <Serif italic>Sang at every family wedding</Serif> for sixty years.
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
              <Btn kind="primary" icon={<Icon name="mic" size={15}/>}>Record her story</Btn>
              <Btn kind="ghost" icon={<Icon name="tree" size={15}/>}>View in tree</Btn>
              <Btn kind="quiet">Edit details</Btn>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 40px', display: 'flex', gap: 28, borderBottom: `1px solid ${dir.rule}`, marginBottom: 32 }}>
          {[
            ['Memories', 47, true],
            ['Timeline', null, false],
            ['Photos', 124, false],
            ['Letters & docs', 18, false],
            ['Relationships', 23, false],
          ].map(([n, c, active]) => (
            <div key={n} style={{
              padding: '14px 0',
              borderBottom: `2px solid ${active ? dir.accent : 'transparent'}`,
              color: active ? dir.ink : dir.inkSoft,
              fontWeight: active ? 500 : 400,
              fontSize: 15,
              display: 'flex', gap: 6, alignItems: 'baseline',
              cursor: 'pointer',
            }}>
              {n} {c != null && <span style={{ fontFamily: dir.mono, fontSize: 11, color: dir.inkMute }}>{c}</span>}
            </div>
          ))}
        </div>

        {/* Memories grid */}
        <div style={{ padding: '0 40px 56px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            <MemoryCard dir={dir} kind="audio" title="The day the almonds bloomed" sub="A Tuesday in the spring of 1947" duration="4:18" tag="1947"/>
            <MemoryCard dir={dir} kind="photo" title="At the Loew's Kings" sub="Where she met Frank, working the candy counter" duration="3 photos" tag="1946"/>
            <MemoryCard dir={dir} kind="audio" title="Crossing on the SS Rex" sub="What her mother packed for the voyage" duration="7:22" tag="1932"/>
            <MemoryCard dir={dir} kind="video" title="Wedding toast for Anna" sub="The one where she cried halfway through" duration="2:48" tag="1975"/>
            <MemoryCard dir={dir} kind="doc" title="Letters from her sister Maria" sub="Sent from Naples through the war" duration="14 letters" tag="1942–46"/>
            <MemoryCard dir={dir} kind="audio" title="The recipe nobody could replicate" sub="Sunday gravy, told three different ways" duration="11:04" tag="1990s"/>
          </div>

          {/* Sidebar pull-out: relationships */}
          <Surface padding={28} style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
              <h3 style={{ fontFamily: dir.serif, fontSize: 22, fontStyle: 'italic', fontWeight: 400, margin: 0 }}>Family</h3>
              <div style={{ flex: 1, height: 1, background: dir.rule }}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              <Relation dir={dir} role="Father" name="Giovanni Russo" years="1894 – 1962"/>
              <Relation dir={dir} role="Mother" name="Concetta Russo" years="1901 – 1979"/>
              <Relation dir={dir} role="Husband" name="Frank Marcaccio" years="1924 – 2011"/>
              <Relation dir={dir} role="Eldest" name="Frank Jr." years="1948 –"/>
            </div>
          </Surface>
        </div>
      </div>
    </window.DirProvider>
  );
}

function Fact({ dir, label, v, sub }) {
  const { Eyebrow } = window;
  return (
    <div>
      <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow>
      <div style={{ fontFamily: dir.serif, fontSize: 32, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em' }}>{v}</div>
      <div style={{ fontSize: 13, color: dir.inkSoft, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function MemoryCard({ dir, kind, title, sub, duration, tag }) {
  const { Eyebrow, Icon, PhotoPlaceholder, WaveformPlaceholder } = window;
  return (
    <div style={{
      background: dir.surface, border: `1px solid ${dir.rule}`,
      borderRadius: dir.radiusLg, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'relative', height: 140 }}>
        <PhotoPlaceholder w="100%" h={140} label={kind}/>
        {kind === 'audio' && (
          <div style={{ position: 'absolute', inset: 0, padding: 18, display: 'flex', alignItems: 'flex-end' }}>
            <WaveformPlaceholder w="100%" h={36} bars={48} color={dir.bg}/>
          </div>
        )}
        <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', background: dir.bg, borderRadius: 999, fontFamily: dir.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: dir.ink }}>
          {kind} · {duration}
        </div>
        {(kind === 'audio' || kind === 'video') && (
          <div style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 999, background: dir.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dir.ink }}>
            <Icon name="play" size={12}/>
          </div>
        )}
      </div>
      <div style={{ padding: 18 }}>
        <Eyebrow style={{ color: dir.accent, marginBottom: 8 }}>{tag}</Eyebrow>
        <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 13, color: dir.inkSoft, lineHeight: 1.5 }}>{sub}</div>
      </div>
    </div>
  );
}

function Relation({ dir, role, name, years }) {
  const { Avatar, Eyebrow, Serif } = window;
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar size={48} initials={name[0]}/>
      <div style={{ minWidth: 0 }}>
        <Eyebrow style={{ marginBottom: 4 }}>{role}</Eyebrow>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 12, color: dir.inkMute, fontFamily: dir.mono }}><Serif italic={false}>{years}</Serif></div>
      </div>
    </div>
  );
}

window.PersonBoard = PersonBoard;
