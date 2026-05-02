export default function MockupPage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Visual Mockups — Design Direction</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: CONTENT }} />
      </body>
    </html>
  );
}

const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:          #FAFAF8;
  --surface:     #FFFFFF;
  --surface-2:   #F5F3F0;
  --text-1:      #18181A;
  --text-2:      #6B6560;
  --text-3:      #A8A39D;
  --accent:      #8B5E3C;
  --accent-pale: #F5EFE8;
  --accent-mid:  #C2874F;
  --border:      #EDE8E3;
  --border-2:    #F0ECE8;
  --shadow-sm:   0 1px 3px rgba(28,20,14,.07), 0 1px 2px rgba(28,20,14,.04);
  --shadow-md:   0 4px 16px rgba(28,20,14,.09), 0 2px 4px rgba(28,20,14,.04);
  --shadow-lg:   0 12px 40px rgba(28,20,14,.12), 0 4px 8px rgba(28,20,14,.05);
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   12px;
  --font-display: 'Fraunces', Georgia, serif;
  --font-ui:      'DM Sans', system-ui, sans-serif;
}

body {
  background: #ECEAE6;
  color: var(--text-1);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  padding: 56px 24px 96px;
}

.page-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 400;
  font-style: italic;
  color: #B0AAA4;
  text-align: center;
  margin-bottom: 56px;
  letter-spacing: .02em;
}

/* Screen wrapper */
.screen { max-width: 880px; margin: 0 auto 72px; }
.screen-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #A09990;
  margin-bottom: 14px;
  padding-left: 2px;
}
.device {
  background: var(--surface);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}

/* ── Toolbar ── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  background: rgba(250,250,248,.96);
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-icon {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: var(--accent);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 13px;
}
.brand-name {
  font-family: var(--font-display);
  font-size: 15px; font-weight: 400;
  color: var(--text-1); letter-spacing: -.01em;
}
.toolbar-actions { display: flex; align-items: center; gap: 7px; }
.tbtn {
  font-family: var(--font-ui); font-size: 12.5px; font-weight: 500;
  border-radius: var(--radius-sm); cursor: pointer;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 11px; line-height: 1; border: none;
}
.tbtn-ghost { background: transparent; color: var(--text-2); border: 1px solid var(--border); }
.tbtn-primary { background: var(--accent); color: white; }
.tbtn-icon { width: 30px; height: 30px; padding: 0; justify-content: center; background: transparent; border: 1px solid transparent; color: var(--text-2); }

/* ── Tree canvas ── */
.tree-canvas {
  background: var(--bg);
  height: 380px;
  position: relative;
  overflow: hidden;
}
.tree-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.node-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 10px 13px;
  display: flex; align-items: center; gap: 9px;
  width: 152px;
  position: absolute;
  cursor: pointer;
}
.node-card.focused {
  border-color: var(--accent-mid);
  box-shadow: 0 0 0 3px var(--accent-pale), var(--shadow-md);
}
.node-av {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 13px; font-weight: 400;
  flex-shrink: 0;
}
.node-name { font-family: var(--font-display); font-size: 12.5px; font-weight: 400; color: var(--text-1); line-height: 1.25; }
.node-dates { font-size: 10px; color: var(--text-3); margin-top: 1px; }
.mem-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-mid); position: absolute; top: 8px; right: 8px; }

/* ── Folio ── */
.folio-header { padding: 28px 32px 24px; border-bottom: 1px solid var(--border-2); background: var(--surface); }
.back-link { font-size: 12px; color: var(--text-3); display: flex; align-items: center; gap: 5px; margin-bottom: 24px; }
.folio-hero { display: flex; align-items: flex-start; gap: 22px; }
.folio-av {
  width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 26px; font-weight: 300;
  color: white; letter-spacing: -.01em;
  background: linear-gradient(145deg, #D4A574 0%, #A87B52 100%);
}
.folio-name { font-family: var(--font-display); font-size: 30px; font-weight: 300; color: var(--text-1); line-height: 1.15; margin-bottom: 5px; letter-spacing: -.02em; }
.folio-dates { font-size: 13px; color: var(--text-3); margin-bottom: 10px; }
.folio-bio { font-size: 13.5px; color: var(--text-2); line-height: 1.65; max-width: 400px; }
.folio-btns { display: flex; gap: 7px; margin-top: 14px; }
.fbtn { font-family: var(--font-ui); font-size: 12px; font-weight: 500; border-radius: var(--radius-sm); padding: 6px 12px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; border: none; }
.fbtn-ghost { background: transparent; color: var(--text-2); border: 1px solid var(--border); }
.fbtn-danger { background: transparent; color: #B8362A; border: 1px solid #F0C4C0; }
.folio-body { padding: 28px 32px; background: var(--bg); }

.sec-title { font-family: var(--font-display); font-size: 18px; font-weight: 400; color: var(--text-1); margin-bottom: 12px; }
.sec-heading { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 9px; }
.add-btns { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
.add-btn { font-family: var(--font-ui); font-size: 11.5px; font-weight: 500; border-radius: var(--radius-sm); padding: 5px 10px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; color: var(--accent); border: 1px solid #DBC9B6; background: var(--accent-pale); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.chip { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 6px 12px 6px 6px; cursor: pointer; }
.chip-av { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 10.5px; }
.chip-name { font-size: 13px; font-weight: 500; color: var(--text-1); }

.mem-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.add-mem-btn { font-family: var(--font-ui); font-size: 12px; font-weight: 500; background: var(--accent); color: white; border: none; border-radius: var(--radius-sm); padding: 6px 12px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; }
.mem-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 11px; cursor: pointer; box-shadow: var(--shadow-sm); }
.mem-accent { height: 3px; }
.mem-body { padding: 15px 17px; }
.mem-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.mem-badge { font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; border-radius: 4px; padding: 2px 7px; }
.mem-date { font-size: 11px; color: var(--text-3); }
.mem-title { font-family: var(--font-display); font-size: 16px; font-weight: 400; color: var(--text-1); margin-bottom: 5px; line-height: 1.3; }
.mem-text { font-size: 13px; color: var(--text-2); line-height: 1.6; }
.mem-tagged { margin-top: 9px; display: flex; align-items: center; gap: 6px; }
.tagged-label { font-size: 11px; color: var(--text-3); }
.tagged-avs { display: flex; }
.tagged-av { width: 19px; height: 19px; border-radius: 50%; border: 1.5px solid white; display: flex; align-items: center; justify-content: center; font-size: 7.5px; font-family: var(--font-display); margin-right: -5px; }

/* ── Edit form ── */
.form-wrap { padding: 28px 32px; background: var(--bg); }
.form-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-sm); }
.form-title { font-family: var(--font-display); font-size: 20px; font-weight: 400; color: var(--text-1); margin-bottom: 22px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.form-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.form-label { font-size: 11px; font-weight: 600; color: var(--text-2); letter-spacing: .03em; }
.form-input { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 9px 13px; font-family: var(--font-ui); font-size: 14px; color: var(--text-1); outline: none; }
.form-input.active { border-color: var(--accent-mid); box-shadow: 0 0 0 3px var(--accent-pale); }
.form-ta { resize: none; height: 78px; }
.upload-zone { background: var(--surface-2); border: 1.5px dashed var(--border); border-radius: var(--radius-md); padding: 18px; text-align: center; cursor: pointer; }
.upload-label { font-size: 13px; color: var(--text-3); }
.upload-sub { font-size: 11px; color: var(--text-3); margin-top: 3px; }
.divider { height: 1px; background: var(--border-2); margin: 22px 0; }
.form-actions { display: flex; gap: 10px; }
.form-btn { flex: 1; font-family: var(--font-ui); font-size: 13.5px; font-weight: 500; border-radius: var(--radius-md); padding: 10px 0; text-align: center; cursor: pointer; border: none; }
.form-btn-cancel { background: var(--surface); border: 1px solid var(--border); color: var(--text-2); }
.form-btn-save { background: var(--accent); color: white; }

/* ── Settings ── */
.settings-wrap { padding: 28px 32px; background: var(--bg); }
.settings-heading { font-family: var(--font-display); font-size: 24px; font-weight: 300; color: var(--text-1); margin-bottom: 3px; }
.settings-sub { font-size: 12px; color: var(--text-3); margin-bottom: 22px; }
.settings-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); margin-bottom: 12px; }
.card-header { padding: 14px 20px; border-bottom: 1px solid var(--border-2); display: flex; align-items: center; gap: 8px; }
.card-title { font-size: 13.5px; font-weight: 600; color: var(--text-1); }
.card-count { margin-left: auto; font-size: 11px; color: var(--text-3); }
.mem-row { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--border-2); }
.mem-row:last-child { border-bottom: none; }
.mem-av { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 14px; font-weight: 400; flex-shrink: 0; }
.mem-info { flex: 1; }
.mem-name { font-size: 13.5px; font-weight: 500; color: var(--text-1); }
.mem-email { font-size: 11.5px; color: var(--text-3); }
.badge { font-size: 10.5px; font-weight: 600; border-radius: 99px; padding: 2px 8px; display: inline-flex; align-items: center; gap: 4px; }
.badge-admin { color: var(--accent); background: var(--accent-pale); border: 1px solid #DBC9B6; }
.badge-member { color: var(--text-3); background: var(--surface-2); border: 1px solid var(--border); }
.row-actions { display: flex; gap: 5px; }
.row-btn { font-size: 11px; font-weight: 500; border-radius: var(--radius-sm); padding: 4px 9px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; border: none; }
.row-btn-sec { background: var(--surface); border: 1px solid var(--border); color: var(--text-2); }
.row-btn-danger { background: transparent; border: 1px solid #F0C4C0; color: #B8362A; }
.invite-row { padding: 16px 20px; display: flex; gap: 8px; }
.invite-input { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 12px; font-family: var(--font-ui); font-size: 13px; color: var(--text-2); outline: none; }
.invite-btn { font-family: var(--font-ui); font-size: 12.5px; font-weight: 500; background: var(--accent); color: white; border: none; border-radius: var(--radius-md); padding: 8px 16px; cursor: pointer; }

svg { display: block; }
`;

const CONTENT = `
<p class="page-title">Family History — Visual Direction</p>

<!-- Screen 1: Tree -->
<div class="screen">
  <p class="screen-label">01 — Tree Canvas</p>
  <div class="device">
    <div class="toolbar">
      <div class="brand">
        <div class="brand-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <span class="brand-name">Sullivan Family</span>
      </div>
      <div class="toolbar-actions">
        <button class="tbtn tbtn-ghost">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Search
        </button>
        <button class="tbtn tbtn-ghost">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Timeline
        </button>
        <button class="tbtn tbtn-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Add Person
        </button>
        <button class="tbtn tbtn-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>
    <div class="tree-canvas">
      <svg class="tree-svg" xmlns="http://www.w3.org/2000/svg">
        <line x1="160" y1="130" x2="160" y2="160" stroke="#DDD8D2" stroke-width="1.5"/>
        <line x1="340" y1="130" x2="340" y2="160" stroke="#DDD8D2" stroke-width="1.5"/>
        <line x1="160" y1="160" x2="340" y2="160" stroke="#DDD8D2" stroke-width="1.5"/>
        <line x1="250" y1="160" x2="250" y2="205" stroke="#DDD8D2" stroke-width="1.5"/>
        <line x1="250" y1="270" x2="250" y2="300" stroke="#DDD8D2" stroke-width="1.5"/>
        <line x1="250" y1="300" x2="450" y2="300" stroke="#DDD8D2" stroke-width="1.5"/>
        <line x1="350" y1="300" x2="350" y2="330" stroke="#DDD8D2" stroke-width="1.5"/>
        <line x1="450" y1="300" x2="450" y2="330" stroke="#DDD8D2" stroke-width="1.5"/>
        <line x1="250" y1="235" x2="550" y2="235" stroke="#DDD8D2" stroke-width="1.5" stroke-dasharray="4 3"/>
        <line x1="550" y1="235" x2="550" y2="205" stroke="#DDD8D2" stroke-width="1.5"/>
      </svg>

      <div class="node-card" style="top:50px; left:84px;">
        <div class="node-av" style="background:#E8DDD4; color:#8B5E3C;">T</div>
        <div><div class="node-name">Thomas</div><div class="node-dates">1895–1968</div></div>
      </div>
      <div class="node-card" style="top:50px; left:264px;">
        <div class="node-av" style="background:#E4E0EC; color:#5E4B8B;">E</div>
        <div><div class="node-name">Eleanor</div><div class="node-dates">1898–1975</div></div>
      </div>
      <div class="node-card focused" style="top:148px; left:174px;">
        <div class="mem-dot"></div>
        <div class="node-av" style="background:linear-gradient(145deg,#D4A574,#A87B52); color:white;">M</div>
        <div><div class="node-name">Margaret</div><div class="node-dates">1924–2003</div></div>
      </div>
      <div class="node-card" style="top:148px; left:474px;">
        <div class="node-av" style="background:#D4E0EC; color:#2E6B9E;">R</div>
        <div><div class="node-name">Robert</div><div class="node-dates">1922–1998</div></div>
      </div>
      <div class="node-card" style="top:270px; left:274px;">
        <div class="node-av" style="background:#DCEADE; color:#3A7D44;">J</div>
        <div><div class="node-name">James</div><div class="node-dates">b. 1948</div></div>
      </div>
      <div class="node-card" style="top:270px; left:374px;">
        <div class="mem-dot"></div>
        <div class="node-av" style="background:#F5EFE8; color:#8B5E3C;">P</div>
        <div><div class="node-name">Patricia</div><div class="node-dates">b. 1952</div></div>
      </div>
    </div>
  </div>
</div>

<!-- Screen 2: Person Folio -->
<div class="screen">
  <p class="screen-label">02 — Person Folio</p>
  <div class="device" style="max-width:680px;">
    <div class="folio-header">
      <div class="back-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to tree
      </div>
      <div class="folio-hero">
        <div class="folio-av">M</div>
        <div>
          <div class="folio-name">Margaret Rose Sullivan</div>
          <div class="folio-dates">Born 12 March 1924 · Died 4 November 2003</div>
          <div class="folio-bio">A schoolteacher for 35 years in County Cork, Ireland. Known for her extraordinary memory and her gift for baking soda bread, always shared with neighbours. Emigrated to Boston in 1961 with her husband Robert.</div>
          <div class="folio-btns">
            <button class="fbtn fbtn-ghost">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="fbtn fbtn-danger">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="folio-body">
      <div style="margin-bottom:28px;">
        <div class="sec-title">Relationships</div>
        <div class="add-btns">
          <button class="add-btn">+ Add Parent</button>
          <button class="add-btn">+ Add Child</button>
          <button class="add-btn">+ Add Sibling</button>
          <button class="add-btn">+ Add Spouse</button>
        </div>
        <div class="sec-heading">Spouse / Partner</div>
        <div class="chips">
          <div class="chip">
            <div class="chip-av" style="background:#D4E0EC; color:#2E6B9E;">R</div>
            <span class="chip-name">Robert Sullivan</span>
          </div>
        </div>
        <div class="sec-heading">Children</div>
        <div class="chips">
          <div class="chip">
            <div class="chip-av" style="background:#DCEADE; color:#3A7D44;">J</div>
            <span class="chip-name">James Sullivan</span>
          </div>
          <div class="chip">
            <div class="chip-av" style="background:#F5EFE8; color:#8B5E3C;">P</div>
            <span class="chip-name">Patricia O'Brien</span>
          </div>
        </div>
        <div class="sec-heading">Parents</div>
        <div class="chips">
          <div class="chip">
            <div class="chip-av" style="background:#E8DDD4; color:#8B5E3C;">T</div>
            <span class="chip-name">Thomas Callahan</span>
          </div>
          <div class="chip">
            <div class="chip-av" style="background:#E4E0EC; color:#5E4B8B;">E</div>
            <span class="chip-name">Eleanor Callahan</span>
          </div>
        </div>
      </div>
      <div>
        <div class="mem-header">
          <div class="sec-title" style="margin-bottom:0;">Memories</div>
          <button class="add-mem-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Memory
          </button>
        </div>
        <div style="height:14px;"></div>
        <div class="mem-card">
          <div class="mem-accent" style="background:linear-gradient(90deg,#8B5E3C,#C2874F);"></div>
          <div class="mem-body">
            <div class="mem-meta">
              <span class="mem-badge" style="color:#8B5E3C; background:#F5EFE8;">Story</span>
              <span class="mem-date">Summer 1972</span>
            </div>
            <div class="mem-title">The bread she baked every Sunday morning</div>
            <div class="mem-text">She'd rise before everyone else, and by the time we came downstairs the whole house smelled of warm bread. She never used a recipe — just knew it by feel, she said.</div>
            <div class="mem-tagged">
              <span class="tagged-label">Also in:</span>
              <div class="tagged-avs">
                <div class="tagged-av" style="background:#DCEADE; color:#3A7D44;">J</div>
                <div class="tagged-av" style="background:#F5EFE8; color:#8B5E3C;">P</div>
              </div>
            </div>
          </div>
        </div>
        <div class="mem-card">
          <div class="mem-accent" style="background:linear-gradient(90deg,#5E8B7A,#7AB5A0);"></div>
          <div class="mem-body">
            <div class="mem-meta">
              <span class="mem-badge" style="color:#3D7A68; background:#E8F4F0;">Photo</span>
              <span class="mem-date">Boston, 1965</span>
            </div>
            <div class="mem-title">First Christmas in America</div>
            <div class="mem-text">Taken outside our apartment on Beacon Street. She kept this photo on the mantelpiece for the rest of her life.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Screen 3: Edit Form -->
<div class="screen">
  <p class="screen-label">03 — Edit Person</p>
  <div class="device" style="max-width:520px;">
    <div class="toolbar" style="height:46px;">
      <div class="back-link" style="margin:0;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </div>
    </div>
    <div class="form-wrap">
      <div class="form-card">
        <div class="form-title">Edit Person</div>
        <div class="form-row">
          <div class="form-field" style="margin-bottom:0;"><label class="form-label">First Name *</label><input class="form-input" value="Margaret" readonly/></div>
          <div class="form-field" style="margin-bottom:0;"><label class="form-label">Last Name *</label><input class="form-input" value="Sullivan" readonly/></div>
        </div>
        <div style="height:14px;"></div>
        <div class="form-row">
          <div class="form-field" style="margin-bottom:0;"><label class="form-label">Date of Birth</label><input class="form-input" value="1924-03-12" readonly/></div>
          <div class="form-field" style="margin-bottom:0;"><label class="form-label">Date of Death</label><input class="form-input active" value="2003-11-04" readonly/></div>
        </div>
        <div style="height:14px;"></div>
        <div class="form-field">
          <label class="form-label">Profile Photo</label>
          <div class="upload-zone">
            <div class="upload-label">Drop an image or click to browse</div>
            <div class="upload-sub">JPG, PNG or HEIC · up to 10 MB</div>
          </div>
        </div>
        <div class="form-field" style="margin-bottom:0;">
          <label class="form-label">Bio</label>
          <textarea class="form-input form-ta" readonly>A schoolteacher for 35 years in County Cork, Ireland. Known for her extraordinary memory and her gift for baking soda bread...</textarea>
        </div>
        <div class="divider"></div>
        <div class="form-actions">
          <button class="form-btn form-btn-cancel">Cancel</button>
          <button class="form-btn form-btn-save">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Screen 4: Settings -->
<div class="screen">
  <p class="screen-label">04 — Settings / Members</p>
  <div class="device" style="max-width:600px;">
    <div class="toolbar" style="height:46px;">
      <div class="back-link" style="margin:0;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to tree
      </div>
    </div>
    <div class="settings-wrap">
      <div class="settings-heading">Sullivan Family</div>
      <div class="settings-sub">Admin panel</div>
      <div class="settings-card">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span class="card-title">Members</span>
          <span class="card-count">3 total</span>
        </div>
        <div class="mem-row">
          <div class="mem-av" style="background:linear-gradient(145deg,#D4A574,#A87B52); color:white;">M</div>
          <div class="mem-info"><div class="mem-name">Margaret Sullivan <span style="font-size:11px;color:var(--text-3);font-weight:400;">(you)</span></div><div class="mem-email">margaret@example.com</div></div>
          <span class="badge badge-admin">★ Admin</span>
        </div>
        <div class="mem-row">
          <div class="mem-av" style="background:#DCEADE; color:#3A7D44;">J</div>
          <div class="mem-info"><div class="mem-name">James Sullivan</div><div class="mem-email">james.sullivan@example.com</div></div>
          <span class="badge badge-member">Member</span>
          <div class="row-actions">
            <button class="row-btn row-btn-sec">Make admin</button>
            <button class="row-btn row-btn-danger">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
        <div class="mem-row">
          <div class="mem-av" style="background:#F5EFE8; color:#8B5E3C;">P</div>
          <div class="mem-info"><div class="mem-name">Patricia O'Brien</div><div class="mem-email">patricia.obrien@example.com</div></div>
          <span class="badge badge-member">Member</span>
          <div class="row-actions">
            <button class="row-btn row-btn-sec">Make admin</button>
            <button class="row-btn row-btn-danger">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="settings-card">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5E3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          <span class="card-title">Invite Someone</span>
        </div>
        <div class="invite-row">
          <input class="invite-input" placeholder="family@example.com" readonly/>
          <button class="invite-btn">Send Invite</button>
        </div>
      </div>
    </div>
  </div>
</div>
`;
