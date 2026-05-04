// Design system showcase — color, type, spacing, components.
// One artboard per direction, 1100w. Walks through tokens systematically.

function DesignSystemBoard({ direction }) {
  const dir = window.DIRECTIONS[direction];
  const { Eyebrow, Serif, Btn, Surface, Rule, Avatar, PhotoPlaceholder, WaveformPlaceholder, Icon } = window;

  return (
    <window.DirProvider direction={direction}>
      <div style={{
        background: dir.bg,
        color: dir.ink,
        fontFamily: dir.sans,
        padding: '56px 64px 72px',
        minHeight: '100%',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <Eyebrow>Direction · {String(['hearth','vellum','dusk'].indexOf(direction)+1).padStart(2,'0')}</Eyebrow>
          <Eyebrow>Family History · Design System</Eyebrow>
        </div>
        <h1 style={{ fontFamily: dir.serif, fontWeight: 400, fontSize: 88, lineHeight: 0.95, margin: '8px 0 4px', letterSpacing: '-0.025em' }}>
          {dir.name}<Serif italic style={{ color: dir.accent, fontSize: 88 }}>.</Serif>
        </h1>
        <div style={{ display: 'flex', gap: 24, alignItems: 'baseline', marginBottom: 48 }}>
          <Serif italic style={{ fontSize: 22, color: dir.inkSoft }}>{dir.tagline}</Serif>
          <div style={{ flex: 1, height: 1, background: dir.rule, marginBottom: 8 }}/>
          <span style={{ fontSize: 14, color: dir.inkMute, fontFamily: dir.mono }}>v0.1 · 2026</span>
        </div>

        {/* Voice / principles */}
        <Section title="Voice" num="01">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            <Principle dir={dir} title="Show, don't dress up." body={<>No leather, no parchment, no fake stitching. The warmth lives in <Serif italic>type</Serif>, color, and breathing room — not in pretending to be an heirloom.</>}/>
            <Principle dir={dir} title="Honor every voice." body={<>Built for Grandma's first tap and a teenager's tenth. Touch targets ≥ 44px. Body type ≥ 17px. Captions never less than 14px.</>}/>
            <Principle dir={dir} title="The story is the artifact." body={<>Photos, audio, video, notes — all citizens. The interface gets out of the way so a recorded story can <Serif italic>breathe</Serif>.</>}/>
          </div>
        </Section>

        {/* Color */}
        <Section title="Color" num="02">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
            <Swatch dir={dir} c={dir.bg} name="Bg" hex={dir.bg}/>
            <Swatch dir={dir} c={dir.surface} name="Surface" hex={dir.surface}/>
            <Swatch dir={dir} c={dir.surfaceAlt} name="Sunken" hex={dir.surfaceAlt}/>
            <Swatch dir={dir} c={dir.ink} name="Ink" hex={dir.ink}/>
            <Swatch dir={dir} c={dir.inkSoft} name="Ink·Soft" hex={dir.inkSoft}/>
            <Swatch dir={dir} c={dir.inkMute} name="Ink·Mute" hex={dir.inkMute}/>
            <Swatch dir={dir} c={dir.accent} name="Accent" hex={dir.accent} accent/>
            <Swatch dir={dir} c={dir.gold} name="Era" hex={dir.gold} accent/>
          </div>
        </Section>

        {/* Type */}
        <Section title="Typography" num="03">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 56, alignItems: 'start' }}>
            <div>
              <TypeRow dir={dir} label="Display · Serif" font={dir.serif} size={64} weight={400} sample="A century in one place"/>
              <TypeRow dir={dir} label="H1 · Sans" font={dir.sans} size={40} weight={500} sample="Eleanor Marcaccio"/>
              <TypeRow dir={dir} label="H2 · Sans" font={dir.sans} size={28} weight={500} sample="Brooklyn, 1947"/>
              <TypeRow dir={dir} label="H3 · Sans" font={dir.sans} size={20} weight={600} sample="The summer kitchen"/>
              <TypeRow dir={dir} label="Body Lg · Sans" font={dir.sans} size={19} weight={400} sample="Grandma kept the recipe in a tin behind the flour."/>
              <TypeRow dir={dir} label="Body · Sans" font={dir.sans} size={17} weight={400} sample="She was the youngest of seven. Three of her siblings made it to America."/>
              <TypeRow dir={dir} label="Caption · Mono" font={dir.mono} size={12} weight={500} sample="RECORDED · 04 MAR 2026 · 12:14"/>
            </div>
            <Surface padding={32}>
              <Eyebrow style={{ marginBottom: 12 }}>Editorial sample</Eyebrow>
              <div style={{ fontFamily: dir.serif, fontSize: 44, lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 16 }}>
                The day the <Serif italic style={{ color: dir.accent }}>almonds</Serif> bloomed
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.6, color: dir.inkSoft, marginBottom: 16 }}>
                Eleanor was nine when her father took her up the hill behind the house. <Serif italic>It was a Tuesday</Serif>, she remembered, because her mother had been baking. The almond trees had bloomed overnight, white as linen, and her father stood quietly for a long time without saying anything.
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: dir.inkMute, fontSize: 13, fontFamily: dir.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <span>Eleanor M.</span> <span style={{ width: 4, height: 4, borderRadius: 999, background: dir.inkMute }}/> <span>04:18</span> <span style={{ width: 4, height: 4, borderRadius: 999, background: dir.inkMute }}/> <span>1947 · Brooklyn</span>
              </div>
            </Surface>
          </div>
        </Section>

        {/* Spacing & rhythm */}
        <Section title="Spacing & rhythm" num="04">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16 }}>
            {[4,8,12,16,20,24,32,40,56,72,96].map(s => (
              <div key={s} style={{ textAlign: 'center' }}>
                <div style={{ width: s, height: s, background: dir.ink, borderRadius: 2 }}/>
                <div style={{ fontSize: 11, fontFamily: dir.mono, color: dir.inkMute, marginTop: 6 }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 14, color: dir.inkSoft, maxWidth: 540 }}>
            4-pt base. Component padding usually <strong>20–32</strong>. Section spacing <strong>56–96</strong>. Generous gutters keep the eye unhurried — this is an app for sitting down, not scrolling fast.
          </div>
        </Section>

        {/* Components */}
        <Section title="Components" num="05">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Surface padding={24}>
              <Eyebrow style={{ marginBottom: 16 }}>Buttons</Eyebrow>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <Btn kind="primary" icon={<Icon name="mic" size={16}/>}>Record a story</Btn>
                <Btn kind="accent">Save</Btn>
                <Btn kind="ghost">Cancel</Btn>
                <Btn kind="quiet">Skip for now</Btn>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn kind="primary" size="sm">Sm</Btn>
                <Btn kind="primary" size="md">Md</Btn>
                <Btn kind="primary" size="lg">Lg</Btn>
              </div>
            </Surface>
            <Surface padding={24}>
              <Eyebrow style={{ marginBottom: 16 }}>Avatars · Era chips</Eyebrow>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                <Avatar size={56} initials="E"/>
                <Avatar size={44} initials="M"/>
                <Avatar size={36} initials="R"/>
                <Avatar size={28} initials="S"/>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['1920s','1930s','1940s','1950s','1960s','1970s'].map(d => (
                  <span key={d} style={{
                    padding: '4px 10px', borderRadius: 999,
                    border: `1px solid ${dir.rule}`,
                    fontFamily: dir.mono, fontSize: 11, color: dir.inkSoft, letterSpacing: '0.06em',
                  }}>{d}</span>
                ))}
              </div>
            </Surface>
            <Surface padding={24}>
              <Eyebrow style={{ marginBottom: 16 }}>Memory card</Eyebrow>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <PhotoPlaceholder w={88} h={88} label="audio"/>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: dir.surface, color: dir.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="play" size={14}/>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Eyebrow>Audio · 4:18</Eyebrow>
                  <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4, marginBottom: 4 }}>The day the almonds bloomed</div>
                  <div style={{ fontSize: 13, color: dir.inkMute, fontFamily: dir.mono }}>Eleanor M. · 1947</div>
                  <WaveformPlaceholder w={'100%'} h={20} bars={32} style={{ marginTop: 8 }}/>
                </div>
              </div>
            </Surface>
            <Surface padding={24}>
              <Eyebrow style={{ marginBottom: 16 }}>Form input</Eyebrow>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: dir.inkSoft, marginBottom: 6 }}>Title</div>
                <div style={{ background: dir.bg, border: `1px solid ${dir.rule}`, borderRadius: dir.radius, padding: '12px 14px', fontSize: 16 }}>
                  The summer kitchen<span style={{ borderRight: `1.5px solid ${dir.accent}`, marginLeft: 1, animation: 'none' }}>&nbsp;</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: dir.inkSoft, marginBottom: 6 }}>People in this memory</div>
                <div style={{ background: dir.bg, border: `1px solid ${dir.rule}`, borderRadius: dir.radius, padding: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Eleanor M.','Frank M.','Rosa M.'].map(p => (
                    <span key={p} style={{ padding: '4px 10px', borderRadius: 999, background: dir.accentSoft, color: dir.accent, fontSize: 13, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                      {p} <span style={{ opacity: 0.6 }}>×</span>
                    </span>
                  ))}
                  <span style={{ padding: '4px 4px', fontSize: 13, color: dir.inkMute }}>+ add…</span>
                </div>
              </div>
            </Surface>
          </div>
        </Section>

        {/* Iconography */}
        <Section title="Iconography" num="06" tail="1.5px stroke · rounded">
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {['mic','photo','video','doc','tree','heart','search','calendar','mappin','user','bell','pin','link','play','plus'].map(n => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: dir.inkSoft }}>
                <Icon name={n} size={22} stroke={1.5}/>
                <span style={{ fontFamily: dir.mono, fontSize: 10, color: dir.inkMute, letterSpacing: '0.06em' }}>{n}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </window.DirProvider>
  );
}

function Section({ title, num, tail, children }) {
  const dir = window.useDir ? window.useDir() : window.DIRECTIONS.hearth;
  return (
    <div style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
        <span style={{ fontFamily: dir.mono, fontSize: 12, color: dir.inkMute, letterSpacing: '0.14em' }}>§ {num}</span>
        <h2 style={{ fontFamily: dir.serif, fontSize: 32, fontWeight: 400, fontStyle: 'italic', margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
        <div style={{ flex: 1, height: 1, background: dir.rule, alignSelf: 'center' }}/>
        {tail && <span style={{ fontFamily: dir.mono, fontSize: 11, color: dir.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{tail}</span>}
      </div>
      {children}
    </div>
  );
}

function Principle({ dir, title, body }) {
  return (
    <div>
      <div style={{ fontFamily: dir.serif, fontSize: 24, fontStyle: 'italic', fontWeight: 400, marginBottom: 12, letterSpacing: '-0.01em' }}>
        {title}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.55, color: dir.inkSoft }}>
        {body}
      </div>
    </div>
  );
}

function Swatch({ dir, c, name, hex, accent }) {
  return (
    <div>
      <div style={{
        background: c, height: 84, borderRadius: dir.radius,
        border: `1px solid ${dir.rule}`,
        position: 'relative',
      }}>
        {accent && <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 999, background: dir.bg, opacity: 0.6 }}/>}
      </div>
      <div style={{ fontSize: 12, marginTop: 8, fontWeight: 500, color: dir.ink }}>{name}</div>
      <div style={{ fontFamily: dir.mono, fontSize: 10, color: dir.inkMute, marginTop: 2 }}>{hex.toUpperCase()}</div>
    </div>
  );
}

function TypeRow({ dir, label, font, size, weight, sample }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '14px 0', borderTop: `1px solid ${dir.rule}` }}>
      <div style={{ fontFamily: dir.mono, fontSize: 10, color: dir.inkMute, width: 110, flexShrink: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: font, fontSize: size, fontWeight: weight, color: dir.ink, lineHeight: 1.15, letterSpacing: size > 30 ? '-0.015em' : '0' }}>
        {sample}
      </div>
    </div>
  );
}

window.DesignSystemBoard = DesignSystemBoard;
