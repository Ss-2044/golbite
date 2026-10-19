/* GolBite — app state, persistence and small shared helpers. */

const STORE_KEY = 'golbite.demo.v1';

function freshMatch() {
  return { phase: 'prematch', minute: -30, home: 0, away: 0, intensity: 35, redCard: false, won: false, clock: true, lastGoalMinute: null };
}

/* Starting stock per catalogue item (deterministic so every screen agrees). */
function defaultStock() {
  const st = {};
  CATALOG.forEach((m) => {
    if (m.id === 'x77') st[m.id] = 777;
    else if (m.cat === 'merch') st[m.id] = 18 + ((m.id.charCodeAt(1) * 13) % 40);
    else st[m.id] = 30 + ((m.id.charCodeAt(1) * 37) % 130);
  });
  return st;
}

/* Campaign figures are stored as breakdowns (per match moment and per section) so totals,
   charts and table rows always add up to the same numbers. */
const MOMENT_WEIGHTS = {
  goal:     { arrival: 0, prematch: 0, kickoff: 0.55, halftime: 0.05, second: 0.4, final: 0 },
  halftime: { arrival: 0, prematch: 0.05, kickoff: 0.15, halftime: 0.75, second: 0.05, final: 0 },
  prematch: { arrival: 0.3, prematch: 0.6, kickoff: 0.1, halftime: 0, second: 0, final: 0 },
  arrival:  { arrival: 0.8, prematch: 0.2, kickoff: 0, halftime: 0, second: 0, final: 0 },
  minute:   { arrival: 0, prematch: 0, kickoff: 0.3, halftime: 0, second: 0.7, final: 0 },
  now:      { arrival: 0.15, prematch: 0.25, kickoff: 0.2, halftime: 0.2, second: 0.15, final: 0.05 },
};
function seedOfferStats(of, views = 0, red = 0, ord = 0) {
  const w = MOMENT_WEIGHTS[of.moment] || MOMENT_WEIGHTS.now;
  of.m = {};
  const left = { v: views, r: red, o: ord };
  PHASES.forEach((p, i) => {
    const last = i === PHASES.length - 1;
    const take = (k, tot) => { const n = last ? left[k] : Math.min(left[k], Math.round(tot * (w[p] || 0))); left[k] -= n; return n; };
    of.m[p] = { v: take('v', views), r: take('r', red), o: take('o', ord) };
  });
  of.s = {};
  let rLeft = red;
  of.sections.forEach((k, i) => { const n = i === of.sections.length - 1 ? rLeft : Math.round(red / of.sections.length); of.s[k] = n; rLeft -= n; });
  delete of.views; delete of.redemptions; delete of.orders;
  return of;
}
function offerTotals(of) {
  return PHASES.reduce((a, p) => ({ v: a.v + (of.m?.[p]?.v || 0), r: a.r + (of.m?.[p]?.r || 0), o: a.o + (of.m?.[p]?.o || 0) }), { v: 0, r: 0, o: 0 });
}
function defaultOffers() {
  return JSON.parse(JSON.stringify(DEFAULT_OFFERS)).map((of) => seedOfferStats(of, of.views, of.redemptions, of.orders));
}

function defaultState() {
  return {
    lang: 'ar',
    role: 'fan',
    user: null,
    setup: null,                  // { eventId, teamId, section, row, seat, arrival, gate, locationMode }
    theme: 'brand',               // brand | team
    simSpeed: 1,
    reducedMotion: false,
    match: freshMatch(),
    simTick: 0,                   // simulation clock; 2 ticks = 1 match minute
    crowd: { A: 40, B: 30, C: 45, P1: 35, P2: 25, P3: 30 },
    closedRoutes: [],             // list of {from, to} angle ranges on the concourse
    overloaded: [],               // pickup ids
    soldOut: [],                  // catalogue item ids
    stock: defaultStock(),
    vendorLoad: { v1: 40, v2: 30, v3: 25, v4: 35, v5: 20 },
    cart: { type: 'pickup', items: {}, dest: null, schedule: 'now', combo: 0, note: '' },
    orders: [],
    opsOrders: [],                // synthetic orders from other fans
    opsStats: { completed: 214, cancelled: 0, byPhase: { arrival: 58, prematch: 156 } },
    favorites: [],
    vouchers: [],                 // { id, item, pct, label, offer }
    group: null,
    points: 0,
    badges: [],
    collectibles: [],
    trophies: [],
    purchases: [],
    unlocked: [],                 // special merch ids unlocked
    quests: { snack: 0, scarf: 0, quiz: 0, seat: 0, vendors: [] },
    prediction: null,             // { result, snack, locked, resolved, correct }
    quiz: { done: false, score: 0 },
    rivalry: { A: 1240, B: 1180, C: 1010 },
    stadiumUnlock: 62,
    offers: defaultOffers(),
    alerts: [],
    season: { matchday: 7, attended: 3, vendorsTried: [], history: [] },
    interests: ['food', 'merch'],
    visibility: { name: true, section: true, badges: true, collectibles: true, predictions: true },
    mapMode: 'simple',
    heatmap: true,
    menuCat: 'burgers',
    menuDiet: [],
    shopCat: 'all',
    dismissed: [],                // dismissed companion cards this match
    tour: null,
    // platform state (all demo / local to this browser)
    rng: 20261024,                // seed for the deterministic demo generator
    venueCfg: defaultVenueConfig(),
    ops: defaultOpsState(),
    svcStatus: {},                // directory overrides: { id: 'unavailable' }
    activity: [],                 // event-day activity log
    tasks: [],                    // facility issues / frontline tasks
    support: [],                  // fan support requests
    feedback: null,
    savedCar: null,               // only when the fan chooses to save it
    prefs: { saveSeat: true },
    menuAvoid: [],
    ledger: [],
    vendorId: 'v1',               // vendor console scope (demo)
    demo: { autopilot: true, scenario: null },
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
    // older saves kept flat campaign counters and a separate merch bag
    st.offers.forEach((of) => { if (!of.m) seedOfferStats(of, of.views || 0, of.redemptions || 0, of.orders || 0); });
    if (saved.bag) { Object.entries(saved.bag).forEach(([id, q]) => { if (CATALOG.some((m) => m.id === id)) st.cart.items[id] = (st.cart.items[id] || 0) + q; }); delete st.bag; }
    st.stock = Object.assign(defaultStock(), saved.stock || {});
    st.vendorLoad = Object.assign({ v5: 20 }, st.vendorLoad);
    st.venueCfg = Object.assign(defaultVenueConfig(), saved.venueCfg || {});
    st.ops = Object.assign(defaultOpsState(), saved.ops || {});
    st.demo = Object.assign({ autopilot: true, scenario: null }, saved.demo || {});
    // orders from older versions get a lifecycle stage
    [...st.orders, ...st.opsOrders].forEach((o) => { if (!o.stage) { o.stage = ['placed', 'preparing', 'ready', o.type === 'delivery' ? 'delivered' : 'collected'][o.status] || 'placed'; o.history = o.history || []; o.tasks.forEach((tk) => { tk.acc = true; }); } });
    return st;
  } catch (e) {
    return base;
  }
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    // the seat is only remembered on this device when the fan chose to keep it
    const out = S.prefs && !S.prefs.saveSeat && S.setup ? Object.assign({}, S, { setup: null }) : S;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(out)); } catch (e) { /* storage unavailable: demo still works in memory */ }
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
/* Deterministic demo randomness: the same scenario from a reset produces the same results. */
function srand() { S.rng = (S.rng * 1103515245 + 12345) % 2147483648; return S.rng / 2147483648; }
const rand = (a, b) => a + srand() * (b - a);
const pick = (arr) => arr[Math.floor(srand() * arr.length)];
const uid = (p = '') => p + Math.floor(srand() * 60466176).toString(36).toUpperCase().padStart(5, '0');

const item = (id) => CATALOG.find((m) => m.id === id);
const merch = (id) => MERCH_ITEMS.find((m) => m.id === id);
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
const seatLabel = () => (S.setup ? `${S.setup.section}-${S.setup.row}-${S.setup.seat}` : '—');

/* Cart lines are keyed "id" or "id~option". */
const ckey = (id, opt) => (opt ? `${id}~${opt}` : id);
const pkey = (k) => { const [id, opt] = k.split('~'); return { id, opt: opt || null }; };
const optOf = (id, opt) => (opt && item(id)?.opts ? OPTION_SETS[item(id).opts].list.find((o) => o.id === opt) : null);
const linePrice = (id, opt) => item(id).price + (optOf(id, opt)?.add || 0);
/* Show the option in the line name unless it is the default ("Regular"). */
const lineName = (id, opt) => { const o = optOf(id, opt); const isDefault = !o || o.id === OPTION_SETS[item(id).opts].list[0].id && item(id).opts !== 'size'; return L(item(id).name) + (isDefault ? '' : ` · ${L(o.name)}`); };
const cartCount = () => Object.values(S.cart.items).reduce((a, b) => a + b, 0) + (S.cart.combo || 0);
const cartTotal = () => Object.entries(S.cart.items).reduce((s, [k, q]) => { const { id, opt } = pkey(k); return s + linePrice(id, opt) * q; }, 0) + (S.cart.combo || 0) * COMBO.price;
const cartQty = (id) => Object.entries(S.cart.items).reduce((s, [k, q]) => s + (pkey(k).id === id ? q : 0), 0);
const merchCount = () => Object.entries(S.cart.items).reduce((s, [k, q]) => s + (item(pkey(k).id)?.cat === 'merch' ? q : 0), 0);
