/* GolBite — UI primitives: icons, live regions, toasts, sheets, celebrations, artwork. */

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  play: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".8"/><circle cx="18" cy="13.5" r=".8"/>',
  shirt: '<path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9.5 17h5"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8C10 4 6 4.5 7 7c.6 1.3 5 1 5 1zm0 0c2-4 6-3.5 5-1-.6 1.3-5 1-5 1z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  store: '<path d="M4 9 5.5 4h13L20 9M4 9h16v2a2.5 2.5 0 0 1-4 2 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4-2zM5 13v8h14v-8M10 21v-5h4v5"/>',
  heart: '<path d="M12 20s-7.5-4.6-9-9.5C2 7 4.5 4.5 7.5 4.5c2 0 3.5 1.2 4.5 2.7 1-1.5 2.5-2.7 4.5-2.7 3 0 5.5 2.5 4.5 6-1.5 4.9-9 9.5-9 9.5z"/>',
  flame: '<path d="M12 22c4 0 7-2.7 7-6.7 0-4.3-3.5-6.3-4.5-10.3-2 1.6-3 3.7-3 6-1.3-1-2-2.5-2-4C6.5 9 5 11.6 5 15.3 5 19.3 8 22 12 22z"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.2v.1"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  megaphone: '<path d="M3 10v4l12 5V5zM15 8a4 4 0 0 1 0 8M6 15l1.5 5h3L9 16"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3z" transform="translate(0 2)"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.1"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  volume: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7M12 14v7M3 12h7M14 12h7"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  filter: '<path d="M4 5h16l-6 8v5l-4 2v-7z"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  note: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 12h8M8 16h5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  live: '<circle cx="12" cy="12" r="3"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.5 10.5 0 0 0 0 14.8M19.4 4.6a10.5 10.5 0 0 1 0 14.8"/>',
  plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
};

function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* The GolBite sun mark, drawn from 24 rays like the "o" in the logo. */
function sunMark(size = 48, cls = '') {
  let rays = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r1 = 13, r2 = 21;
    const x1 = 24 + Math.cos(a) * r1, y1 = 24 + Math.sin(a) * r1, x2 = 24 + Math.cos(a) * r2, y2 = 24 + Math.sin(a) * r2;
    rays += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" style="--i:${i}"/>`;
  }
  return `<svg class="sun ${cls}" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round">${rays}</g></svg>`;
}

/* Sunburst as a progress device: `pct` of the 24 rays are lit. */
function sunProgress(pct, size = 44, cls = '') {
  let rays = '';
  const lit = Math.round((clamp(pct, 0, 100) / 100) * 24);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const x1 = 24 + Math.cos(a) * 13, y1 = 24 + Math.sin(a) * 13, x2 = 24 + Math.cos(a) * 21, y2 = 24 + Math.sin(a) * 21;
    rays += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" class="${i < lit ? 'on' : ''}"/>`;
  }
  return `<svg class="sunp ${cls}" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><g stroke-width="3" stroke-linecap="round">${rays}</g></svg>`;
}
function spinner() { return sunMark(18, 'spin'); }

/* Product imagery: real photo when one is mapped in PHOTOS, otherwise the illustrated tile. */
function media(m, cls = '') {
  if (!m) return '';
  if (PHOTOS[m.id]) return `<span class="media ${cls}"><img src="${PHOTOS[m.id]}" alt="" loading="lazy"/></span>`;
  return `<span class="media ${cls}" style="--tint:${CAT_TINT[m.cat] || '#EEF2F6'}" aria-hidden="true"><i>${m.emoji}</i></span>`;
}

/* ---------- live regions: small DOM fragments refreshed on each simulation tick ---------- */
let LIVE = {};
function live(key, fn, tag = 'div', cls = '') {
  LIVE[key] = fn;
  return `<${tag} data-live="${key}" class="${cls}">${fn()}</${tag}>`;
}
function refreshLive() {
  document.querySelectorAll('[data-live]').forEach((el) => {
    const fn = LIVE[el.dataset.live];
    if (!fn) return;
    const html = fn();
    if (el._last !== html) { el.innerHTML = html; el._last = html; }
  });
}

/* ---------- toasts ---------- */
function toast(msg, kind = 'info', ms = 3200) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  el.innerHTML = `<span>${msg}</span><button class="toast-x" aria-label="${T('Dismiss', 'إغلاق')}">${icon('x')}</button>`;
  el.querySelector('button').onclick = () => el.remove();
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => el.classList.add('out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}

/* ---------- sheets / modals ---------- */
let SHEET = null; // { render: fn, onClose }
let sheetReturnFocus = null;
function openSheet(render, opts = {}) {
  sheetReturnFocus = document.activeElement;
  SHEET = { render, ...opts };
  renderSheet(true);
}
function renderSheet(first = false) {
  const root = document.getElementById('sheet-root');
  if (!SHEET) { root.innerHTML = ''; root.hidden = true; document.body.classList.remove('locked'); return; }
  root.hidden = false;
  document.body.classList.add('locked');
  const inner = root.querySelector('.sheet-body');
  const scroll = inner ? inner.scrollTop : 0;
  root.innerHTML = `<div class="sheet-backdrop" data-act="closeSheet"></div>
    <div class="sheet ${SHEET.wide ? 'sheet-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(SHEET.label || 'GolBite')}">
      <button class="icon-btn sheet-x" data-act="closeSheet" aria-label="${T('Close', 'إغلاق')}">${icon('x')}</button>
      <div class="sheet-body">${SHEET.render()}</div>
    </div>`;
  const body = root.querySelector('.sheet-body');
  body.scrollTop = scroll;
  if (first) setTimeout(() => (root.querySelector('.sheet [autofocus]') || root.querySelector('.sheet button:not(.sheet-x), .sheet input, .sheet-x'))?.focus(), 30);
}
function closeSheet() {
  const cb = SHEET?.onClose;
  SHEET = null;
  renderSheet();
  cb && cb();
  sheetReturnFocus?.focus?.();
}

function confirmSheet({ title, body, ok, danger, onOk }) {
  openSheet(() => `
    <h2 class="sheet-title">${title}</h2>
    <p class="muted">${body}</p>
    <div class="row gap mt">
      <button class="btn btn-ghost grow" data-act="closeSheet">${T('Cancel', 'إلغاء')}</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} grow" data-act="confirmOk" autofocus>${ok}</button>
    </div>`, { label: title, onOk });
}

/* ---------- celebrations ---------- */
let celebTimer = null;
function celebrate({ title, sub, emoji = '🎉', kind = 'confetti', ms = 3800, cta }) {
  const root = document.getElementById('celebrate-root');
  clearTimeout(celebTimer);
  root.hidden = false;
  // A compact banner at the top: celebrates without covering ordering or tracking.
  root.innerHTML = `<canvas id="fx"></canvas>
    <div class="celeb-card" role="status" aria-live="assertive">
      <div class="celeb-mark">${sunMark(56, 'burst')}<span class="celeb-emoji">${emoji}</span></div>
      <div class="celeb-text"><b>${title}</b>${sub ? `<p>${sub}</p>` : ''}
        <div class="row gap mt-xs">
          ${cta ? `<button class="btn btn-orange btn-sm" data-act="${cta.act}" data-arg="${cta.arg || ''}">${cta.label}</button>` : ''}
          <button class="btn btn-ghost-light btn-sm" data-act="dismissCelebrate">${T('Dismiss', 'إغلاق')}</button>
        </div></div>
    </div>`;
  if (!motionReduced()) runFx(root.querySelector('#fx'), kind);
  celebTimer = setTimeout(dismissCelebrate, ms);
}
function dismissCelebrate() {
  const root = document.getElementById('celebrate-root');
  root.hidden = true;
  root.innerHTML = '';
}
function motionReduced() {
  return S.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function runFx(canvas, kind) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = (canvas.width = innerWidth * dpr), H = (canvas.height = innerHeight * dpr);
  const colors = ['#F0862A', '#FFC15E', '#0F405E', '#FFFFFF', myTeam().color];
  let parts = [];
  if (kind === 'fireworks') {
    for (let b = 0; b < 5; b++) {
      const cx = rand(0.2, 0.8) * W, cy = rand(0.15, 0.5) * H, c = pick(colors), delay = b * 18;
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2, sp = rand(2, 6) * dpr;
        parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, c, life: 70 + delay, delay, s: 2.5 * dpr });
      }
    }
  } else {
    for (let i = 0; i < 160; i++) {
      parts.push({ x: rand(0, W), y: rand(-H, 0), vx: rand(-1, 1) * dpr, vy: rand(2, 5) * dpr, c: pick(colors), life: 200, delay: 0, s: rand(4, 8) * dpr, r: rand(0, 6) });
    }
  }
  let f = 0;
  (function loop() {
    if (!canvas.isConnected) return;
    ctx.clearRect(0, 0, W, H);
    parts.forEach((p) => {
      if (f < p.delay) return;
      p.x += p.vx; p.y += p.vy;
      if (kind === 'fireworks') { p.vy += 0.05 * dpr; p.vx *= 0.985; } else { p.r += 0.1; }
      p.life--;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 40));
      ctx.fillStyle = p.c;
      if (kind === 'fireworks') { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); }
      else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
    });
    parts = parts.filter((p) => p.life > 0);
    f++;
    if (parts.length) requestAnimationFrame(loop);
  })();
}

/* ---------- artwork: illustrated stadium hero (no external images needed) ---------- */
function stadiumArt(variant = 'night') {
  const ev = currentEvent();
  const home = TEAMS[ev.home].color, away = ev.away ? TEAMS[ev.away].color : '#F0862A';
  const concert = isConcert();
  // deterministic pseudo-random so the crowd doesn't jump between renders
  let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let crowd = '';
  for (let row = 0; row < 9; row++) {
    const y = 150 + row * 13, n = 46 + row * 4;
    for (let i = 0; i < n; i++) {
      const x = (i / n) * 860 - 30 + rnd() * 10;
      const side = x < 400 ? home : away;
      const c = rnd() < 0.42 ? side : rnd() < 0.08 ? '#FFE8B0' : '#173F5C';
      crowd += `<circle cx="${x.toFixed(1)}" cy="${(y + rnd() * 4).toFixed(1)}" r="${(2.4 + row * 0.25).toFixed(1)}" fill="${c}" opacity="${(0.55 + rnd() * 0.4).toFixed(2)}"/>`;
    }
  }
  let sparks = '';
  for (let i = 0; i < 26; i++) sparks += `<circle class="spark" style="--d:${(rnd() * 3).toFixed(2)}s" cx="${(rnd() * 800).toFixed(0)}" cy="${(150 + rnd() * 110).toFixed(0)}" r="1.6" fill="#FFF4D6"/>`;
  const light = (x, flip) => `<g><rect x="${x - 2}" y="34" width="4" height="96" fill="#0D2F46"/>
    <g transform="translate(${x} 30)">${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${-20 + c * 10}" y="${-12 + r * 7}" width="8" height="5" rx="1" fill="#F4FAFF"/>`).join('')).join('')}</g>
    <circle cx="${x}" cy="26" r="70" fill="url(#glow)"/>
    <polygon points="${x - 22},36 ${x + 22},36 ${x + (flip ? -60 : 260)},330 ${x + (flip ? -300 : 20)},330" fill="url(#beam)" opacity=".28"/></g>`;
  const field = concert
    ? `<polygon points="250,300 550,300 600,420 200,420" fill="#0A2233"/><rect x="300" y="268" width="200" height="34" rx="4" fill="${home}" opacity=".9"/>
       <polygon points="400,268 280,60 520,60" fill="${home}" opacity=".14"/><polygon points="400,268 180,90 260,80" fill="#F0862A" opacity=".1"/>`
    : `<polygon points="120,282 680,282 800,420 0,420" fill="#147A49"/>
       ${[0, 1, 2, 3, 4, 5].map((i) => `<polygon points="${120 + i * 93},282 ${213 + i * 93},282 ${(i + 1) * 133},420 ${i * 133},420" fill="#1A8C55" opacity="${i % 2 ? 0 : 0.55}"/>`).join('')}
       <polygon points="120,282 680,282 800,420 0,420" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>
       <line x1="400" y1="282" x2="400" y2="420" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>
       <ellipse cx="400" cy="340" rx="74" ry="22" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>`;
  return `<svg class="hero-art" viewBox="0 0 800 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#061B2A"/><stop offset=".7" stop-color="#0C3550"/><stop offset="1" stop-color="#0F405E"/></linearGradient>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6D8"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></linearGradient>
      <radialGradient id="glow"><stop offset="0" stop-color="#FFF7E0" stop-opacity=".55"/><stop offset="1" stop-color="#FFF7E0" stop-opacity="0"/></radialGradient>
      <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F405E" stop-opacity="0"/><stop offset="1" stop-color="#9CC3DD" stop-opacity=".18"/></linearGradient>
    </defs>
    <rect width="800" height="420" fill="url(#sky)"/>
    <path d="M-20 150 Q400 112 820 150 V290 H-20z" fill="#0A2C43"/>
    <path d="M-20 136 Q400 100 820 136 V150 Q400 114 -20 150z" fill="#123E5C"/>
    <rect x="70" y="128" width="150" height="14" rx="2" fill="${home}" opacity=".85"/><rect x="580" y="128" width="150" height="14" rx="2" fill="${away}" opacity=".85"/>
    ${crowd}${sparks}
    <rect x="0" y="120" width="800" height="170" fill="url(#haze)"/>
    ${light(90, false)}${light(710, true)}
    ${field}
  </svg>`;
}

function foodTile(emoji, cls = '') {
  return `<span class="food-tile ${cls}" aria-hidden="true">${emoji}</span>`;
}

function pill(text, kind = '') {
  return `<span class="pill ${kind ? 'pill-' + kind : ''}">${text}</span>`;
}

function levelWord(v) {
  return v >= 75 ? T('Busy', 'مزدحم') : v >= 50 ? T('Moderate', 'متوسط') : T('Calm', 'هادئ');
}
function levelKind(v) {
  return v >= 75 ? 'busy' : v >= 50 ? 'mid' : 'calm';
}
function mins(n) {
  n = Math.max(1, Math.round(n));
  return S.lang === 'ar' ? `${n} د` : `${n} min`;
}
