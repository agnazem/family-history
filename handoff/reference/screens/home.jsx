// Home / Dashboard — what you see when you open the app.
// Design intent: invitation, not feed. Big "record now" affordance,
// recently-told stories, who's contributed lately, gentle prompts.

function HomeBoard({ direction }) {
  const dir = window.DIRECTIONS[direction];
  const { Eyebrow, Serif, Btn, Surface, Avatar, PhotoPlaceholder, WaveformPlaceholder, Icon } = window;

  return (
    <window.DirProvider direction={direction}>
      <div style={{ background: dir.bg, color: dir.ink, fontFamily: dir.sans, minHeight: '100%' }}>
        {/* Top bar */}
        <div style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${dir.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ fontFamily: dir.serif, fontSize: 22, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
              The Marcaccio<Serif italic style={{ color: dir.accent }}>s</Serif>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 14, color: dir.inkSoft }}>
              {['Home','Tree','People','Memories','Places'].map((n,i) => (
                <span key={n} style={{
                  padding: '6px 12px', borderRadius: dir.radius,
                  color: i===0 ? dir.ink : dir.inkSoft,
                  fontWeight: i===0 ? 500 : 400,
                  background: i===0 ? dir.surfaceAlt : 'transparent',
                  cursor: 'pointer',
                }}>{n}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: dir.surface, border: `1px solid ${dir.rule}`, borderRadius: 999, color: dir.inkMute, fontSize: 13, width: 220 }}>
              <Icon name="search" size={14}/> Search 437 memories…
            </div>
            <Avatar size={34} initials="J"/>
          </div>
        </div>

        <div style={{ padding: '40px 40px 56px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 40 }}>
          {/* Left column */}
          <div>
            {/* Hero / record CTA */}
            <div style={{ marginBottom: 40 }}>
              <Eyebrow style={{ marginBottom: 12 }}>Sunday · 03 May 2026 · 9:42 am</Eyebrow>
              <h1 style={{ fontFamily: dir.serif, fontSize: 56, fontWeight: 400, lineHeight: 1.04, margin: 0, letterSpacing: '-0.025em' }}>
                Good morning, Jamie. <Serif italic style={{ color: dir.accent }}>Grandma</Serif><br/>
                hasn't been heard from in <Serif italic>17 days</Serif>.
              </h1>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Btn kind="primary" size="lg" icon={<Icon name="mic" size={17}/>}>Record a story</Btn>
                <Btn kind="ghost" size="lg" icon={<Icon name="photo" size={17}/>}>Add a photo</Btn>
                <Btn kind="quiet" size="lg">Ask Grandma a question →</Btn>
              </div>
            </div>

            {/* Today's prompt */}
            <Surface raised padding={28} style={{ marginBottom: 32, background: `linear-gradient(180deg, ${dir.accentSoft}, transparent)` }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div>
                  <Eyebrow style={{ color: dir.accent, marginBottom: 10 }}>Prompt for today</Eyebrow>
                  <div style={{ fontFamily: dir.serif, fontSize: 28, fontWeight: 400, lineHeight: 1.2, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                    "What's a smell that takes you straight back to your <Serif italic>childhood kitchen</Serif>?"
                  </div>
                  <div style={{ fontSize: 14, color: dir.inkSoft }}>One question, every Sunday. Three minutes of audio is plenty.</div>
                </div>
                <Btn kind="accent" size="md" icon={<Icon name="mic" size={15}/>}>Begin</Btn>
              </div>
            </Surface>

            {/* Recent stories */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
              <h2 style={{ fontFamily: dir.serif, fontSize: 28, fontStyle: 'italic', fontWeight: 400, margin: 0 }}>Recently told</h2>
              <div style={{ flex: 1, height: 1, background: dir.rule }}/>
              <span style={{ fontSize: 13, color: dir.inkMute, fontFamily: dir.mono, letterSpacing: '0.06em' }}>THIS WEEK</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <StoryRow dir={dir} title="The day the almonds bloomed" by="Eleanor M." kind="audio" duration="4:18" when="Yesterday" tag="1947 · Brooklyn"/>
              <StoryRow dir={dir} title="Frank's letter from Naples" by="Rosa M." kind="doc" duration="3 pages" when="Wed" tag="1944"/>
              <StoryRow dir={dir} title="Sunday at the lake house" by="Michael M." kind="photo" duration="12 photos" when="Tue" tag="1972 · Lake George"/>
              <StoryRow dir={dir} title="How we met at the Loew's" by="Eleanor M." kind="video" duration="6:02" when="Mon" tag="1946"/>
            </div>
          </div>

          {/* Right column */}
          <div>
            <Surface padding={24} style={{ marginBottom: 24 }}>
              <Eyebrow style={{ marginBottom: 16 }}>Family · 12 contributors</Eyebrow>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {['E','F','R','M','J','A','S','T','+4'].map((n,i) => (
                  <Avatar key={i} size={40} initials={n}/>
                ))}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: dir.inkSoft }}>
                <Serif italic style={{ color: dir.ink }}>Eleanor</Serif> contributed 23 memories. <Serif italic style={{ color: dir.ink }}>Michael</Serif> uploaded 47 photos last month.
              </div>
            </Surface>

            <Surface padding={24} style={{ marginBottom: 24 }}>
              <Eyebrow style={{ marginBottom: 16 }}>Coming up</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <UpcomingRow dir={dir} when="Sun · 11am" what="Call with Grandma" sub="2 questions queued"/>
                <UpcomingRow dir={dir} when="May 14" what="Frank's birthday" sub="Would have been 102"/>
                <UpcomingRow dir={dir} when="Jun 2" what="Family reunion" sub="Bring memory prompts"/>
              </div>
            </Surface>

            <Surface padding={24}>
              <Eyebrow style={{ marginBottom: 14 }}>The archive · at a glance</Eyebrow>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Stat dir={dir} n="437" label="memories"/>
                <Stat dir={dir} n="68" label="people"/>
                <Stat dir={dir} n="14h" label="of audio"/>
                <Stat dir={dir} n="1903" label="earliest year"/>
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </window.DirProvider>
  );
}

function StoryRow({ dir, title, by, kind, duration, when, tag }) {
  const { Icon, PhotoPlaceholder, WaveformPlaceholder, Eyebrow, Serif } = window;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18,
      padding: '14px 18px',
      background: dir.surface,
      border: `1px solid ${dir.rule}`,
      borderRadius: dir.radiusLg,
    }}>
      <div style={{ width: 64, height: 64, borderRadius: dir.radius, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <PhotoPlaceholder w={64} h={64} label={kind}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
          <Eyebrow style={{ color: dir.accent }}>{kind}</Eyebrow>
          <span style={{ width: 3, height: 3, borderRadius: 999, background: dir.inkMute }}/>
          <span style={{ fontFamily: dir.mono, fontSize: 11, color: dir.inkMute, letterSpacing: '0.06em' }}>{duration.toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, color: dir.inkSoft }}>
          <Serif italic>{by}</Serif> <span style={{ color: dir.inkMute }}>· {tag}</span>
        </div>
      </div>
      {kind === 'audio' && <WaveformPlaceholder w={140} h={24} bars={28}/>}
      <div style={{ fontSize: 12, color: dir.inkMute, fontFamily: dir.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{when}</div>
      <button style={{ background: 'transparent', border: 'none', padding: 8, color: dir.inkMute, cursor: 'pointer' }}>
        <Icon name="more" size={18}/>
      </button>
    </div>
  );
}

function UpcomingRow({ dir, when, what, sub }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        fontFamily: dir.mono, fontSize: 11, color: dir.accent,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        width: 76, flexShrink: 0, paddingTop: 2,
      }}>{when}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{what}</div>
        <div style={{ fontSize: 13, color: dir.inkSoft }}>{sub}</div>
      </div>
    </div>
  );
}

function Stat({ dir, n, label }) {
  return (
    <div>
      <div style={{ fontFamily: dir.serif, fontSize: 32, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em' }}>{n}</div>
      <div style={{ fontSize: 12, color: dir.inkMute, fontFamily: dir.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  );
}

window.HomeBoard = HomeBoard;
