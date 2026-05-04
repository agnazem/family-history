// Memory detail — story player screen.
// Design intent: when a memory opens, the rest of the app fades.
// Big serif title, photo or waveform takes the stage, transcript runs alongside,
// "people in this memory" chips ground it in the family.

function MemoryDetailBoard() {
  const dir = window.DIRECTIONS.hearth;
  const { Eyebrow, Serif, Btn, Avatar, PhotoPlaceholder, WaveformPlaceholder, Icon } = window;

  return (
    <window.DirProvider direction="hearth">
      <div style={{ background: dir.bg, color: dir.ink, fontFamily: dir.sans, minHeight: '100%' }}>
        {/* Slim top bar */}
        <div style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${dir.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: dir.inkMute }}>
            <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }}/>
            <span style={{ fontFamily: dir.mono, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 11 }}>Eleanor's memories</span>
            <span>›</span>
            <span style={{ color: dir.ink }}>The day the almonds bloomed</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="ghost" size="sm" icon={<Icon name="link" size={13}/>}>Share</Btn>
            <Btn kind="ghost" size="sm" icon={<Icon name="heart" size={13}/>}>Save</Btn>
            <Btn kind="ghost" size="sm" icon={<Icon name="more" size={13}/>}>·</Btn>
          </div>
        </div>

        {/* Hero */}
        <div style={{ padding: '48px 80px 32px', maxWidth: 1180, margin: '0 auto' }}>
          <Eyebrow style={{ marginBottom: 16, color: dir.accent }}>Audio · 4:18 · Recorded 04 Mar 2026</Eyebrow>
          <h1 style={{ fontFamily: dir.serif, fontSize: 88, fontWeight: 400, lineHeight: 0.98, margin: '0 0 16px', letterSpacing: '-0.03em' }}>
            The day the <Serif italic style={{ color: dir.accent }}>almonds</Serif> bloomed
          </h1>
          <div style={{ fontFamily: dir.serif, fontSize: 26, fontStyle: 'italic', color: dir.inkSoft, lineHeight: 1.4, maxWidth: 760 }}>
            Eleanor was nine when her father took her up the hill behind the house. <Serif italic={false}>It was a Tuesday, she remembered, because her mother had been baking.</Serif>
          </div>

          {/* Player band */}
          <div style={{
            marginTop: 40,
            background: dir.surface, borderRadius: dir.radiusLg, border: `1px solid ${dir.rule}`,
            padding: 32, display: 'flex', gap: 28, alignItems: 'center',
            boxShadow: dir.shadow,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 999, background: dir.accent,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 8px 24px -8px rgba(139,94,60,0.6)',
            }}>
              <Icon name="play" size={28}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontFamily: dir.mono, fontSize: 12, color: dir.inkMute, letterSpacing: '0.06em' }}>
                <span style={{ color: dir.accent }}>1:42</span>
                <div style={{ flex: 1, height: 4, background: dir.surfaceAlt, borderRadius: 999, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '40%', background: dir.accent, borderRadius: 999 }}/>
                  <div style={{ position: 'absolute', left: '40%', top: -3, width: 10, height: 10, borderRadius: 999, background: dir.accent, transform: 'translateX(-50%)' }}/>
                </div>
                <span>4:18</span>
              </div>
              <WaveformPlaceholder w="100%" h={36} bars={64}/>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={iconBtn(dir)}><Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }}/></button>
              <button style={iconBtn(dir)}><span style={{ fontFamily: dir.mono, fontSize: 11, fontWeight: 600 }}>15s</span></button>
              <button style={iconBtn(dir)}><span style={{ fontFamily: dir.mono, fontSize: 11, fontWeight: 600 }}>1×</span></button>
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div style={{ padding: '32px 80px 64px', maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 56 }}>
          {/* Transcript */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
              <h2 style={{ fontFamily: dir.serif, fontSize: 24, fontStyle: 'italic', fontWeight: 400, margin: 0 }}>Transcript</h2>
              <div style={{ flex: 1, height: 1, background: dir.rule }}/>
              <Eyebrow>Auto · edited by Jamie</Eyebrow>
            </div>

            <div style={{ fontFamily: dir.serif, fontSize: 22, lineHeight: 1.65, color: dir.ink, fontWeight: 300 }}>
              <p style={{ margin: '0 0 24px' }}>
                <span style={{ fontFamily: dir.mono, fontSize: 11, color: dir.inkMute, letterSpacing: '0.06em', marginRight: 12 }}>00:14</span>
                I was nine. Maybe ten. My father — your <Serif italic style={{ color: dir.accent }}>great-grandfather</Serif>, Giovanni — took me up behind the house. There was a path. Goats had made it, mostly.
              </p>
              <p style={{ margin: '0 0 24px' }}>
                <span style={{ fontFamily: dir.mono, fontSize: 11, color: dir.inkMute, letterSpacing: '0.06em', marginRight: 12 }}>00:42</span>
                It was a Tuesday. I know because my mother had been baking that morning, and she only did the bread on Tuesday and Friday. The whole house smelled of <Serif italic>yeast and that orange peel</Serif> she put in.
              </p>
              <p style={{ margin: '0 0 24px', background: dir.accentSoft, padding: '8px 14px', marginLeft: -14, marginRight: -14, borderRadius: dir.radius, borderLeft: `2px solid ${dir.accent}` }}>
                <span style={{ fontFamily: dir.mono, fontSize: 11, color: dir.accent, letterSpacing: '0.06em', marginRight: 12 }}>01:18</span>
                When we got to the top, the almond trees had bloomed overnight. <Serif italic style={{ fontWeight: 400 }}>White as linen.</Serif> Every one of them. He didn't say a word for a long time. Just stood there.
              </p>
              <p style={{ margin: '0 0 24px', color: dir.inkSoft }}>
                <span style={{ fontFamily: dir.mono, fontSize: 11, color: dir.inkMute, letterSpacing: '0.06em', marginRight: 12 }}>02:04</span>
                I think — and I never asked him this — I think he was thinking about his brother. Pasquale. Who was supposed to come with us to America but didn't.
              </p>
            </div>
          </div>

          {/* Side rail */}
          <div>
            <div style={{ marginBottom: 32 }}>
              <Eyebrow style={{ marginBottom: 14 }}>Recorded by</Eyebrow>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar size={44} initials="J"/>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>Jamie M.</div>
                  <div style={{ fontSize: 12, color: dir.inkMute }}><Serif italic>Granddaughter</Serif> · in person</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <Eyebrow style={{ marginBottom: 14 }}>People in this memory</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <PersonChip dir={dir} name="Eleanor Marcaccio" role="The narrator" age="9"/>
                <PersonChip dir={dir} name="Giovanni Russo" role="Her father" age="38"/>
                <PersonChip dir={dir} name="Pasquale Russo" role="Mentioned" age="—"/>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <Eyebrow style={{ marginBottom: 14 }}>Place & time</Eyebrow>
              <Fact dir={dir} icon="mappin" label="Place" v="Brooklyn, NY"/>
              <Fact dir={dir} icon="calendar" label="Year" v="1947"/>
              <Fact dir={dir} icon="pin" label="Season" v="Spring"/>
            </div>

            <div>
              <Eyebrow style={{ marginBottom: 14 }}>Threads</Eyebrow>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Family · Russo line','Childhood','Brooklyn','Father stories','Almond Hill'].map(t => (
                  <span key={t} style={{
                    padding: '5px 11px', borderRadius: 999,
                    background: dir.accentSoft, color: dir.accent,
                    fontSize: 12, fontWeight: 500,
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comment / response section */}
        <div style={{ padding: '0 80px 56px', maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
            <h2 style={{ fontFamily: dir.serif, fontSize: 24, fontStyle: 'italic', fontWeight: 400, margin: 0 }}>Family said</h2>
            <div style={{ flex: 1, height: 1, background: dir.rule }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Comment dir={dir} who="Michael M." rel="Son" when="2 days ago" body={<>I never knew about Pasquale. <Serif italic>Mom never said his name once</Serif>, my whole life. Wow.</>}/>
            <Comment dir={dir} who="Anna M." rel="Daughter" when="Yesterday" body={<>The orange peel in the bread. I still do this. I had no idea where it came from.</>}/>
            <CommentCompose dir={dir}/>
          </div>
        </div>
      </div>
    </window.DirProvider>
  );
}

function iconBtn(dir) {
  return {
    width: 36, height: 36, borderRadius: 999,
    background: 'transparent', border: `1px solid ${dir.rule}`,
    color: dir.inkSoft, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

function PersonChip({ dir, name, role, age }) {
  const { Avatar, Eyebrow, Serif } = window;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: 10, background: dir.surface, border: `1px solid ${dir.rule}`,
      borderRadius: dir.radius,
    }}>
      <Avatar size={36} initials={name[0]}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: 11, color: dir.inkMute }}><Serif italic>{role}</Serif> · age {age}</div>
      </div>
    </div>
  );
}

function Fact({ dir, icon, label, v }) {
  const { Icon } = window;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${dir.rule}` }}>
      <Icon name={icon} size={14} color={dir.inkMute}/>
      <div style={{ fontSize: 12, color: dir.inkMute, width: 60 }}>{label}</div>
      <div style={{ fontSize: 14, color: dir.ink, fontWeight: 500 }}>{v}</div>
    </div>
  );
}

function Comment({ dir, who, rel, when, body }) {
  const { Avatar, Serif } = window;
  return (
    <div style={{ display: 'flex', gap: 14, padding: 18, background: dir.surface, border: `1px solid ${dir.rule}`, borderRadius: dir.radiusLg }}>
      <Avatar size={40} initials={who[0]}/>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{who}</span>
          <span style={{ fontSize: 12, color: dir.inkMute }}><Serif italic>{rel}</Serif></span>
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 11, color: dir.inkMute, fontFamily: dir.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{when}</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: dir.inkSoft }}>{body}</div>
      </div>
    </div>
  );
}

function CommentCompose({ dir }) {
  const { Avatar, Btn, Icon } = window;
  return (
    <div style={{ display: 'flex', gap: 14, padding: 18, background: dir.surfaceAlt, border: `1px dashed ${dir.rule}`, borderRadius: dir.radiusLg }}>
      <Avatar size={40} initials="J"/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: dir.inkMute, marginBottom: 12 }}>Add what you remember about this story…</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn kind="primary" size="sm" icon={<Icon name="mic" size={13}/>}>Voice reply</Btn>
          <Btn kind="ghost" size="sm">Write reply</Btn>
        </div>
      </div>
    </div>
  );
}

window.MemoryDetailBoard = MemoryDetailBoard;
