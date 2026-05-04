// Recording flow — capturing a story.
// Design intent: zero anxiety. Big calm prompt, gentle pulse on record,
// transcription appears live. Phone-down-on-the-table moment.

function RecordBoard() {
  const dir = window.DIRECTIONS.hearth;
  const { Eyebrow, Serif, Btn, Avatar, Icon, WaveformPlaceholder } = window;

  return (
    <window.DirProvider direction="hearth">
      <div style={{ background: dir.bg, color: dir.ink, fontFamily: dir.sans, minHeight: '100%', position: 'relative' }}>
        {/* Slim header */}
        <div style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${dir.rule}` }}>
          <Btn kind="quiet" size="sm">← Cancel</Btn>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontFamily: dir.mono, color: dir.accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: dir.accent, animation: 'pulse 1.6s ease-in-out infinite' }}/>
            Recording · 02:14
          </div>
          <Btn kind="ghost" size="sm">Save & finish</Btn>
        </div>

        <div style={{ padding: '40px 80px 80px', maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56, alignItems: 'start' }}>
          {/* Main column */}
          <div>
            {/* Prompt card */}
            <div style={{ marginBottom: 40 }}>
              <Eyebrow style={{ marginBottom: 12, color: dir.accent }}>Today's prompt · skip anytime</Eyebrow>
              <h1 style={{ fontFamily: dir.serif, fontSize: 56, fontWeight: 400, lineHeight: 1.05, margin: 0, letterSpacing: '-0.025em' }}>
                "What's a smell that takes you straight back to your <Serif italic style={{ color: dir.accent }}>childhood kitchen</Serif>?"
              </h1>
              <div style={{ marginTop: 16, display: 'flex', gap: 14, alignItems: 'center', fontSize: 13, color: dir.inkMute }}>
                <Serif italic style={{ fontSize: 15 }}>Eleanor M.</Serif>
                <span>·</span>
                <span>Sun 03 May · 10:24 am</span>
                <span>·</span>
                <span>Hudson Valley, NY</span>
              </div>
            </div>

            {/* Live transcript */}
            <div style={{ background: dir.surface, border: `1px solid ${dir.rule}`, borderRadius: dir.radiusLg, padding: 32, minHeight: 320, fontFamily: dir.serif, fontSize: 22, lineHeight: 1.6, color: dir.ink, fontWeight: 300 }}>
              <div style={{ marginBottom: 18 }}>
                Oh — well, the first thing is <Serif italic>yeast</Serif>. My mother baked every Tuesday and Friday. She had a wooden bowl, and she'd cover it with a dish towel and put it on top of the radiator…
              </div>
              <div style={{ color: dir.inkSoft, marginBottom: 18 }}>
                And I'd come in from school and I'd know, just from the smell in the hallway, what she was up to. The whole apartment, four floors, you could smell it.
              </div>
              <div style={{ color: dir.inkMute }}>
                <span style={{ animation: 'blink 1s step-end infinite' }}>And there was something else, the orange peel, she would —</span>
                <span style={{ display: 'inline-block', width: 2, height: 22, background: dir.accent, marginLeft: 4, verticalAlign: 'middle', animation: 'blink 0.8s step-end infinite' }}/>
              </div>
            </div>

            {/* Big record bar */}
            <div style={{
              marginTop: 40,
              background: dir.surface, borderRadius: 999,
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 18,
              border: `1px solid ${dir.rule}`,
              boxShadow: dir.shadow,
            }}>
              <button style={{
                width: 64, height: 64, borderRadius: 999,
                background: dir.accent, border: 'none', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 6px rgba(139,94,60,0.15), 0 8px 24px -8px rgba(139,94,60,0.5)',
              }}>
                <Icon name="pause" size={20}/>
              </button>
              <div style={{ flex: 1 }}>
                <WaveformPlaceholder w="100%" h={48} bars={56}/>
              </div>
              <div style={{ fontFamily: dir.mono, fontSize: 14, color: dir.ink, letterSpacing: '0.06em', minWidth: 70, textAlign: 'right' }}>
                02:14
              </div>
            </div>
          </div>

          {/* Side rail — context, who's in it, prompts */}
          <div>
            <div style={{ background: dir.surface, border: `1px solid ${dir.rule}`, borderRadius: dir.radiusLg, padding: 24, marginBottom: 20 }}>
              <Eyebrow style={{ marginBottom: 14 }}>Who's telling this</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar size={48} initials="E"/>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>Eleanor Marcaccio</div>
                  <div style={{ fontSize: 12, color: dir.inkMute }}><Serif italic>Grandmother</Serif> · 98</div>
                </div>
              </div>
              <Btn kind="ghost" size="sm" style={{ width: '100%', justifyContent: 'center' }}>Change speaker</Btn>
            </div>

            <div style={{ background: dir.surface, border: `1px solid ${dir.rule}`, borderRadius: dir.radiusLg, padding: 24, marginBottom: 20 }}>
              <Eyebrow style={{ marginBottom: 14 }}>Mentioned so far</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Mention dir={dir} name="Concetta Russo" detected="“my mother”"/>
                <Mention dir={dir} name="Tuesdays & Fridays" detected="time"/>
                <Mention dir={dir} name="Brooklyn apartment" detected="place — guessed" pending/>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: dir.inkMute }}>
                <Serif italic>Auto-detected.</Serif> Tap to confirm or remove.
              </div>
            </div>

            <div style={{ background: dir.accentSoft, border: `1px solid ${dir.rule}`, borderRadius: dir.radiusLg, padding: 24 }}>
              <Eyebrow style={{ marginBottom: 14, color: dir.accent }}>Gentle next prompts</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <NextPrompt dir={dir} t="What did the apartment look like from the outside?"/>
                <NextPrompt dir={dir} t="What was your favorite thing she baked?"/>
                <NextPrompt dir={dir} t="Did she ever teach you to make it?"/>
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: dir.inkSoft }}>
                <Serif italic>Use these only if the conversation slows.</Serif>
              </div>
            </div>
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

function Mention({ dir, name, detected, pending }) {
  const { Serif } = window;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: dir.bg, borderRadius: dir.radius, border: `1px solid ${dir.rule}` }}>
      <div style={{ width: 6, height: 6, borderRadius: 999, background: pending ? dir.gold : dir.accent }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: 11, color: dir.inkMute }}><Serif italic>{detected}</Serif></div>
      </div>
      {pending && <span style={{ fontSize: 10, fontFamily: dir.mono, color: dir.gold, letterSpacing: '0.06em' }}>CONFIRM?</span>}
    </div>
  );
}

function NextPrompt({ dir, t }) {
  return (
    <div style={{
      padding: '12px 14px', background: dir.surface, borderRadius: dir.radius,
      border: `1px solid ${dir.rule}`,
      fontSize: 14, lineHeight: 1.45, color: dir.ink, cursor: 'pointer',
    }}>
      "{t}"
    </div>
  );
}

window.RecordBoard = RecordBoard;
