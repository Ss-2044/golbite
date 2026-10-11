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
  root.innerHTML = `<canvas id="fx"></canvas>
    <div class="celeb-card" role="status" aria-live="assertive">
      <div class="celeb-emoji">${emoji}</div>
      <h2>${title}</h2>
      ${sub ? `<p>${sub}</p>` : ''}
      <div class="row gap center mt-s">
        ${cta ? `<button class="btn btn-primary btn-sm" data-act="${cta.act}" data-arg="${cta.arg || ''}">${cta.label}</button>` : ''}
        <button class="btn btn-ghost-light btn-sm" data-act="dismissCelebrate">${T('Dismiss', 'إغلاق')}</button>
      </div>
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
  const team = myTeam().color;
  const concert = isConcert();
  const sky = variant === 'day' ? ['#2B6C93', '#0F405E'] : ['#0A2A3F', '#0F405E'];
  let crowd = '';
  for (let i = 0; i < 70; i++) {
    const x = (i * 23) % 800, y = 150 + ((i * 37) % 40);
    crowd += `<circle cx="${x}" cy="${y}" r="${2 + (i % 3)}" fill="${i % 5 === 0 ? team : i % 7 === 0 ? '#F0862A' : '#1D5A80'}" opacity=".8"/>`;
  }
  const light = (x) => `<g><rect x="${x - 2}" y="20" width="4" height="120" fill="#123A55"/><rect x="${x - 22}" y="10" width="44" height="16" rx="3" fill="#E9F2F7"/>
    <polygon points="${x - 22},26 ${x + 22},26 ${x + 160},260 ${x - 160},260" fill="url(#beam)" opacity=".35"/></g>`;
  const stage = concert
    ? `<rect x="300" y="190" width="200" height="40" rx="4" fill="#0A2233"/><rect x="330" y="160" width="140" height="34" rx="4" fill="${team}" opacity=".85"/>
       <polygon points="400,160 300,40 500,40" fill="${team}" opacity=".12"/>`
    : `<ellipse cx="400" cy="240" rx="330" ry="46" fill="#167A4C"/><ellipse cx="400" cy="240" rx="330" ry="46" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
       <line x1="400" y1="194" x2="400" y2="286" stroke="#fff" stroke-opacity=".5" stroke-width="2"/><ellipse cx="400" cy="240" rx="50" ry="12" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
  return `<svg class="hero-art" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6D8"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></linearGradient></defs>
    <rect width="800" height="300" fill="url(#sky)"/>
    ${light(120)}${light(680)}
    <path d="M0 140 Q400 95 800 140 V300 H0z" fill="#0B3049"/>
    ${crowd}
    ${stage}
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
