/* GolBite — app state, persistence and small shared helpers. */

const STORE_KEY = 'golbite.demo.v1';

function freshMatch() {
  return { phase: 'prematch', minute: -30, home: 0, away: 0, intensity: 35, redCard: false, won: false, clock: true, lastGoalMinute: null };
}

function defaultState() {
  return {
    lang: 'en',
    role: 'fan',
    user: null,
    setup: null,                  // { eventId, teamId, section, row, seat, arrival, gate, locationMode }
    theme: 'brand',               // brand | team
    simSpeed: 1,
    reducedMotion: false,
    match: freshMatch(),
    crowd: { A: 40, B: 30, C: 45, P1: 35, P2: 25, P3: 30 },
    closedRoutes: [],             // list of {from, to} angle ranges on the concourse
    overloaded: [],               // pickup ids
    soldOut: [],                  // menu item ids
    vendorLoad: { v1: 40, v2: 30, v3: 25, v4: 35 },
    cart: { type: 'pickup', items: {}, dest: null, schedule: 'now', combo: 0 },
    orders: [],
    opsOrders: [],                // synthetic orders from other fans
    favorites: [],
    vouchers: [],                 // { id, item, label }
    group: null,
    points: 0,
    badges: [],
    collectibles: [],
    trophies: [],
    bag: {},
    purchases: [],
    unlocked: [],                 // special merch ids unlocked
    quests: { snack: 0, scarf: 0, quiz: 0, seat: 0, vendors: [] },
    prediction: null,             // { result, snack, locked, resolved, correct }
    quiz: { done: false, score: 0 },
    rivalry: { A: 1240, B: 1180, C: 1010 },
    stadiumUnlock: 62,
    offers: JSON.parse(JSON.stringify(DEFAULT_OFFERS)),
    alerts: [],
    season: { matchday: 7, attended: 3, vendorsTried: [], history: [] },
    interests: ['food', 'merch'],
    visibility: { name: true, section: true, badges: true, collectibles: true, predictions: true },
    mapMode: 'simple',
    heatmap: true,
    menuCat: 'burgers',
    menuDiet: [],
    dismissed: [],                // dismissed companion cards this match
    seenFlash: 0,
    tour: null,
  };
}

let S = loadState();

function loadState() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    const st = Object.assign(base, saved, { tour: null });
    // older saves used fictional team ids; map them onto the current event's home team
    if (st.setup && !TEAMS[st.setup.teamId]) st.setup.teamId = (EVENTS.find((e) => e.id === st.setup.eventId) || EVENTS[0]).home;
    return st;
  } catch (e) {
    return base;
  }
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable: demo still works in memory */ }
  }, 120);
}

function resetState() {
  try { localStorage.removeItem(STORE_KEY); } catch (e) {}
  const keep = { lang: S.lang };
  S = Object.assign(defaultState(), keep);
}

/* ---------- helpers ---------- */
const T = (en, ar) => (S.lang === 'ar' ? ar : en);
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[S.lang] || o.en));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sar = (n) => (S.lang === 'ar' ? `${fmtNum(n)} ر.س` : `SAR ${fmtNum(n)}`);
const fmtNum = (n) => (Math.round(n * 100) / 100).toLocaleString('en-US');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = (p = '') => p + Math.random().toString(36).slice(2, 7).toUpperCase();

const item = (id) => MENU.find((m) => m.id === id);
const merch = (id) => MERCH.find((m) => m.id === id);
const vendor = (id) => VENDORS.find((v) => v.id === id);
const pickup = (id) => PICKUPS.find((p) => p.id === id);
const currentEvent = () => EVENTS.find((e) => e.id === (S.setup?.eventId || 'e1')) || EVENTS[0];
const isConcert = () => currentEvent().type === 'concert';
const phaseLabel = (p) => L(PHASE_LABELS[currentEvent().type][p || S.match.phase]);
const myTeam = () => TEAMS[S.setup?.teamId || currentEvent().home];
const tierOf = (pts) => (pts >= 1500 ? 'gold' : pts >= 500 ? 'silver' : 'bronze');
const TIERS = {
  bronze: { name: { en: 'Bronze', ar: 'برونزي' }, min: 0, next: 500, color: '#B87333' },
  silver: { name: { en: 'Silver', ar: 'فضي' }, min: 500, next: 1500, color: '#8A99A8' },
  gold:   { name: { en: 'Gold', ar: 'ذهبي' }, min: 1500, next: null, color: '#D4A017' },
};
const activeOrder = () => S.orders.find((o) => o.status < 3);
const cartCount = () => Object.values(S.cart.items).reduce((a, b) => a + b, 0) + (S.cart.combo || 0);
const cartTotal = () => Object.entries(S.cart.items).reduce((s, [id, q]) => s + item(id).price * q, 0) + (S.cart.combo || 0) * COMBO.price;
const bagCount = () => Object.values(S.bag).reduce((a, b) => a + b, 0);
const seatLabel = () => (S.setup ? `${S.setup.section}-${S.setup.row}-${S.setup.seat}` : '—');
