// Mobile screens — Folio direction.
// Two phones: Home (recently told + prompt) and Recording (mid-record).

function MobileHome() {
  const dir = window.DIRECTIONS.hearth;
  const { Eyebrow, Serif, Avatar, Icon, PhotoPlaceholder, WaveformPlaceholder } = window;

  return (
    <window.DirProvider direction="hearth">
      <div style={{ background: dir.bg, color: dir.ink, fontFamily: dir.sans, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Top */}
        <div style={{ padding: '8px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: dir.serif, fontSize: 22, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
            Marcaccio<Serif italic style={{ color: dir.accent }}>s</Serif>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button style={{ background: 'transparent', border: 'none', padding: 8, color: dir.inkSoft }}><Icon name="search" size={20}/></button>
            <Avatar size={32} initials="J"/>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 20px' }}>
          {/* Prompt card */}
          <div style={{
            background: `linear-gradient(180deg, ${dir.accentSoft} 0%, ${dir.surface} 100%)`,
            border: `1px solid ${dir.rule}`,
            borderRadius: dir.radiusLg, padding: 20, marginBottom: 24,
          }}>
            <Eyebrow style={{ color: dir.accent, marginBottom: 8 }}>Sunday prompt</Eyebrow>
            <div style={{ fontFamily: dir.serif, fontSize: 24, fontWeight: 400, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.01em' }}>
              "A smell that takes you straight back to your <Serif italic>childhood kitchen</Serif>?"
            </div>
            <button style={{
              width: '100%', padding: '14px 18px',
              background: dir.accent, color: '#fff', border: 'none',
              borderRadius: dir.radius, fontSize: 16, fontWeight: 500, fontFamily: dir.sans,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Icon name="mic" size={16}/> Record with Grandma
            </button>
          </div>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
            <h2 style={{ fontFamily: dir.serif, fontSize: 22, fontStyle: 'italic', fontWeight: 400, margin: 0 }}>Recently told</h2>
            <div style={{ flex: 1, height: 1, background: dir.rule }}/>
          </div>

          {/* Memory cards */}
          {[
            { kind: 'audio', title: 'The day the almonds bloomed', by: 'Eleanor M.', dur: '4:18', tag: '1947 · Brooklyn' },
            { kind: 'doc', title: "Frank's letter from Naples", by: 'Rosa M.', dur: '3 pages', tag: '1944' },
            { kind: 'photo', title: 'Sunday at the lake house', by: 'Michael M.', dur: '12 photos', tag: '1972' },
            { kind: 'video', title: "How we met at the Loew's", by: 'Eleanor M.', dur: '6:02', tag: '1946' },
          ].map((m,i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: 14, marginBottom: 12,
              background: dir.surface, border: `1px solid ${dir.rule}`,
              borderRadius: dir.radiusLg,
            }}>
              <PhotoPlaceholder w={64} h={64} label={m.kind}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  <Eyebrow style={{ color: dir.accent }}>{m.kind} · {m.dur}</Eyebrow>
                </div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 3, lineHeight: 1.25 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: dir.inkSoft }}>
                  <Serif italic>{m.by}</Serif> <span style={{ color: dir.inkMute }}>· {m.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{
          padding: '10px 20px 8px',
          background: dir.surface, borderTop: `1px solid ${dir.rule}`,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        }}>
          {[
            ['home','Home',true],
            ['tree','Tree',false],
            ['mic','Record',false,true],
            ['user','People',false],
            ['heart','Saved',false],
          ].map(([n,label,active,fab],i) => (
            fab ? (
              <div key={i} style={{ position: 'relative', top: -18 }}>
                <button style={{
                  width: 56, height: 56, borderRadius: 999,
                  background: dir.accent, border: 'none', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px -8px rgba(139,94,60,0.6)',
                }}>
                  <Icon name="mic" size={22}/>
                </button>
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: active ? dir.accent : dir.inkMute }}>
                <Icon name={n} size={20}/>
                <span style={{ fontSize: 10, fontFamily: dir.mono, letterSpacing: '0.06em' }}>{label}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </window.DirProvider>
  );
}

function MobileRecord() {
  const dir = window.DIRECTIONS.hearth;
  const { Eyebrow, Serif, Avatar, Icon, WaveformPlaceholder } = window;

  return (
    <window.DirProvider direction="hearth">
      <div style={{ background: dir.bg, color: dir.ink, fontFamily: dir.sans, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top */}
        <div style={{ padding: '8px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button style={{ background: 'transparent', border: 'none', color: dir.inkSoft, fontSize: 14 }}>Cancel</button>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, fontFamily: dir.mono, color: dir.accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: dir.accent, animation: 'pulse 1.6s infinite' }}/>
            Rec · 02:14
          </div>
          <button style={{ background: 'transparent', border: 'none', color: dir.accent, fontSize: 14, fontWeight: 500 }}>Save</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 0' }}>
          <Eyebrow style={{ color: dir.accent, marginBottom: 8 }}>Now telling</Eyebrow>
          <div style={{ fontFamily: dir.serif, fontSize: 28, fontWeight: 400, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.015em' }}>
            "A smell that takes you straight back to your <Serif italic style={{ color: dir.accent }}>childhood kitchen</Serif>"
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', background: dir.surface, borderRadius: dir.radius, border: `1px solid ${dir.rule}` }}>
            <Avatar size={32} initials="E"/>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Eleanor</div>
            <div style={{ fontSize: 11, color: dir.inkMute, fontFamily: dir.mono }}>SPEAKER</div>
          </div>

          <div style={{ fontFamily: dir.serif, fontSize: 18, lineHeight: 1.55, color: dir.ink, fontWeight: 300 }}>
            <p style={{ margin: '0 0 14px' }}>
              Oh — well, the first thing is <Serif italic>yeast</Serif>. My mother baked every Tuesday and Friday. She had a wooden bowl, and she'd cover it with a dish towel and put it on top of the radiator…
            </p>
            <p style={{ margin: '0 0 14px', color: dir.inkSoft }}>
              And I'd come in from school and I'd know, just from the smell in the hallway, what she was up to.
            </p>
            <p style={{ margin: '0 0 14px', color: dir.inkMute }}>
              And there was something else, the orange peel, she would —
              <span style={{ display: 'inline-block', width: 2, height: 18, background: dir.accent, marginLeft: 3, verticalAlign: 'middle', animation: 'blink 0.8s step-end infinite' }}/>
            </p>
          </div>
        </div>

        {/* Big record bar */}
        <div style={{
          padding: '20px 22px 28px', background: dir.surface,
          borderTop: `1px solid ${dir.rule}`,
        }}>
          <WaveformPlaceholder w="100%" h={36} bars={40}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <button style={{ background: 'transparent', border: `1px solid ${dir.rule}`, padding: '10px 14px', borderRadius: dir.radius, color: dir.inkSoft, fontSize: 13 }}>
              Pause
            </button>
            <button style={{
              width: 72, height: 72, borderRadius: 999,
              background: dir.accent, border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 6px rgba(139,94,60,0.18), 0 12px 24px -8px rgba(139,94,60,0.5)',
            }}>
              <div style={{ width: 22, height: 22, borderRadius: 4, background: '#fff' }}/>
            </button>
            <button style={{ background: 'transparent', border: `1px solid ${dir.rule}`, padding: '10px 14px', borderRadius: dir.radius, color: dir.inkSoft, fontSize: 13 }}>
              Hint
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
          @keyframes blink { 50% { opacity: 0.3; } }
        `}</style>
      </div>
    </window.DirProvider>
  );
}

window.MobileHome = MobileHome;
window.MobileRecord = MobileRecord;
