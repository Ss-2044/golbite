/* GolBite — simulation engine: geometry, Smart Fulfillment routing, order lifecycle, match events, rewards. */

/* ---------- stadium geometry (SVG viewBox 0 0 400 300) ---------- */
const GEO = { cx: 200, cy: 150, rx: 176, ry: 127 };
function ptAt(angle, rx = GEO.rx, ry = GEO.ry) {
  const a = (angle * Math.PI) / 180;
  return { x: GEO.cx + Math.cos(a) * rx, y: GEO.cy + Math.sin(a) * ry };
}
const norm = (a) => ((a % 360) + 360) % 360;
const angDist = (a, b) => { const d = Math.abs(norm(a) - norm(b)); return Math.min(d, 360 - d); };

/* A route walks the concourse ring from angle a to angle b, avoiding closed segments. */
function segBlocked(a, b, dir) {
  const steps = Math.ceil(dir > 0 ? norm(b - a) : norm(a - b));
  for (let i = 0; i <= steps; i += 2) {
    const ang = norm(a + dir * i);
    if (S.closedRoutes.some((c) => inRange(ang, c.from, c.to))) return true;
  }
  return false;
}
function inRange(ang, from, to) {
  ang = norm(ang); from = norm(from); to = norm(to);
  return from <= to ? ang >= from && ang <= to : ang >= from || ang <= to;
}
function planRoute(a, b) {
  const cw = norm(b - a), ccw = norm(a - b);
  let dir = cw <= ccw ? 1 : -1;
  let detour = false;
  if (segBlocked(a, b, dir)) {
    if (!segBlocked(a, b, -dir)) { dir = -dir; detour = true; }
  }
  const span = dir > 0 ? cw : ccw;
  const pts = [];
  for (let i = 0; i <= span; i += 4) pts.push(ptAt(a + dir * i));
  pts.push(ptAt(b));
  const len = span * 2.6; // concourse units ≈ metres
  return { pts, span, dir, detour, len, blocked: segBlocked(a, b, dir) };
}
function routeToSeat(fromAngle, section) {
  const sec = SECTIONS[section];
  const r = planRoute(fromAngle, sec.angle);
  const inner = ptAt(sec.angle, 128, 90);
  r.pts.push(inner);
  r.len += 25;
  return r;
}
function walkMins(len, zone) {
  const crowd = zone != null ? (S.crowd[zone] ?? 40) : 40;
  return Math.max(1, (len / 70) * (1 + crowd / 120));
}
function polyPath(pts) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

/* ---------- queue & wait estimates ---------- */
function pickupWait(pid) {
  const load = S.crowd[pid] ?? 30;
  return 2 + load * 0.11 + (S.overloaded.includes(pid) ? 9 : 0);
}
function pickupLoad(pid) { return S.overloaded.includes(pid) ? 96 : S.crowd[pid] ?? 30; }
function bestPickup(excludeId) {
  const sec = S.setup ? SECTIONS[S.setup.section] : SECTIONS.A;
  return PICKUPS.filter((p) => p.id !== excludeId)
    .map((p) => ({ p, score: pickupWait(p.id) + walkMins(planRoute(sec.angle, p.angle).len) }))
    .sort((x, y) => x.score - y.score)[0].p;
}
function nearestPickup() {
  const sec = S.setup ? SECTIONS[S.setup.section] : SECTIONS.A;
  return PICKUPS.slice().sort((a, b) => angDist(a.angle, sec.angle) - angDist(b.angle, sec.angle))[0];
}
function zoneWarning(pid) { return pickupLoad(pid) >= 80; }

/* ---------- Smart Fulfillment Network ---------- */
function destAngle(order) {
  if (order.type === 'delivery') return SECTIONS[order.dest]?.angle ?? 270;
  return pickup(order.dest)?.angle ?? 270;
}
function routeItems(items, dAngle) {
  const tasks = {};
  items.forEach((it) => {
    const m = item(it.id);
    let cands = VENDORS.filter((v) => v.cats.includes(m.cat) && !S.ops.pausedVendors.includes(v.id));
    if (!cands.length) cands = VENDORS.filter((v) => v.cats.includes(m.cat));
    let best = null;
    cands.forEach((v) => {
      const load = S.vendorLoad[v.id];
      const dist = angDist(v.angle, dAngle);
      const score = m.prep + load * 0.08 + dist / 30 + (tasks[v.id] ? 0 : 2);
      const reason = dist < 50 ? 'near' : load < 35 ? 'load' : 'stock';
      if (!best || score < best.score) best = { v, score, reason };
    });
    const t = (tasks[best.v.id] ||= { vid: best.v.id, items: [], st: 0, acc: false, prog: 0, need: 0, reason: best.reason });
    t.items.push({ ...it });
    t.need = Math.max(t.need, m.prep * 2 + Math.round(activeTasks(best.v.id) / Math.max(1, vendorCap(best.v.id)) * 4));
  });
  return Object.values(tasks);
}
const REASONS = {
  near:  { en: 'Closest to destination', ar: 'الأقرب للوجهة' },
  load:  { en: 'Lowest workload', ar: 'أقل ضغط عمل' },
  stock: { en: 'Has stock & capacity', ar: 'متوفر ولديه سعة' },
};
const RUNNERS = ['Ahmed', 'Yousef', 'Saad', 'Nasser', 'Bandar'];

/* ---------- capacity & availability (event-day rules) ---------- */
const vendorCap = (vid) => S.venueCfg.capacity[vid] || 10;
function activeTasks(vid) {
  let n = 0;
  [...S.orders, ...S.opsOrders].forEach((o) => { if (!isFinal(o)) o.tasks.forEach((t) => { if (t.vid === vid && t.st < 2 && !t.rejected) n++; }); });
  return n;
}
const vendorPaused = (vid) => S.ops.pausedVendors.includes(vid);
function eventStatus() {
  if (S.ops.cancelled) return 'cancelled';
  return { arrival: 'scheduled', prematch: 'scheduled', kickoff: 'live', halftime: 'halftime', second: 'live', final: 'post' }[S.match.phase];
}
/* Can fans place food orders right now? Returns { open, reason }. */
function orderingStatus() {
  const cfg = S.venueCfg, ops = S.ops, m = S.match;
  if (ops.cancelled) return { open: false, reason: T('The event has been cancelled.', 'تم إلغاء الفعالية.') };
  if (!cfg.published) return { open: false, reason: T('The venue has not opened this event for orders yet.', 'لم يفتح الملعب هذه الفعالية للطلب بعد.') };
  if (!ops.ordering) return { open: false, reason: t('err.orderingClosed') };
  if (m.phase === 'final') return { open: false, reason: T('Ordering has closed for this event.', 'انتهى وقت الطلب لهذه الفعالية.') };
  if (m.phase === 'second' && m.minute >= cfg.cutoffMinute) return { open: false, reason: T(`Last orders were at ${cfg.cutoffMinute}'.`, `آخر موعد للطلب كان الدقيقة ${cfg.cutoffMinute}.`) };
  return { open: true, reason: '' };
}
const pickupAllowed = (pid) => S.venueCfg.fulfillment.pickup && !S.ops.pausedPickups.includes(pid);
const deliveryAllowed = (sec) => S.venueCfg.fulfillment.delivery && S.venueCfg.deliverySections.includes(sec) && !S.ops.pausedZones.includes(sec);
function itemAvailable(id) {
  const m = item(id);
  if (!m || S.soldOut.includes(id) || S.stock[id] === 0) return false;
  return VENDORS.some((v) => v.cats.includes(m.cat) && !vendorPaused(v.id));
}

/* ---------- order lifecycle: one state machine for fan, operator and vendor ---------- */
const FLOW = {
  pickup: ['placed', 'accepted', 'preparing', 'ready', 'collected'],
  delivery: ['placed', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered'],
};
const STATUS_OF = { placed: 0, accepted: 0, preparing: 1, ready: 2, dispatched: 2, delivered: 3, collected: 3, cancelled: 3 };
const flowOf = (o) => FLOW[o.type];
const isFinal = (o) => ['collected', 'delivered', 'cancelled'].includes(o.stage);
function nextStage(o) { const f = flowOf(o); const i = f.indexOf(o.stage); return i >= 0 && i < f.length - 1 ? f[i + 1] : null; }
const stageLabel = (st) => t('st.' + st);
const actorLabel = (a) => (a === 'sim' ? t('role.sim') : t('role.' + a));
const TASK_LABEL = (tk) => (tk.rejected ? t('vt.rejected') : tk.st >= 3 ? t('vt.handed') : tk.st === 2 ? t('vt.ready') : tk.st === 1 ? t('vt.preparing') : tk.acc ? t('vt.accepted') : t('vt.new'));

function logActivity(role, text) {
  S.activity.unshift({ at: Date.now(), minute: S.match.minute, role, text });
  S.activity = S.activity.slice(0, 80);
}

/* Move an order to `stage`. Only the next stage in its flow (or cancellation) is allowed. */
function setStage(o, stage, actor = 'sim', note = '') {
  const ok = stage === nextStage(o) || (stage === 'cancelled' && !isFinal(o));
  if (!ok) return false;
  o.stage = stage;
  o.status = STATUS_OF[stage];
  o.stageTick = S.simTick;
  o.history = o.history || [];
  o.history.push({ stage, tick: S.simTick, minute: S.match.minute, by: actor, note });
  if (stage === 'accepted') o.tasks.forEach((tk) => (tk.acc = true));
  if (stage === 'preparing') o.tasks.forEach((tk) => { tk.acc = true; tk.st = Math.max(tk.st, 1); });
  if (stage === 'ready') o.tasks.forEach((tk) => (tk.st = Math.max(tk.st, 2)));
  if (['dispatched', 'collected', 'delivered'].includes(stage)) o.tasks.forEach((tk) => (tk.st = 3));
  if (isFinal(o)) {
    o.doneTick = S.simTick; o.completedAt = Date.now();
    if (stage === 'cancelled') S.opsStats.cancelled = (S.opsStats.cancelled || 0) + 1; else S.opsStats.completed++;
    recordLedger(o);
  }
  if (!o.synthetic || actor !== 'sim') logActivity(actor, `${o.id} → ${stageLabel(stage)}${note ? ' · ' + note : ''}`);
  if (!o.synthetic) onOrderStatus(o);
  return true;
}
/* Closed orders are written to a simple ledger used by the business report (simulated amounts; no payouts). */
function recordLedger(o) {
  if (!S.ledger) S.ledger = [];
  if (S.ledger.some((x) => x.id === o.id)) return;
  const byVendor = {};
  o.tasks.forEach((tk) => { if (!tk.rejected) byVendor[tk.vid] = (byVendor[tk.vid] || 0) + orderTotal(tk.items); });
  const gross = Object.values(byVendor).reduce((a, b) => a + b, 0);
  const discount = o.discount || 0;
  const fees = (o.fee || 0) + (o.service || 0);
  const refund = o.stage === 'cancelled' ? gross - discount + fees : o.refund || 0;
  S.ledger.unshift({ id: o.id, stage: o.stage, synthetic: !!o.synthetic, phase: o.phase || S.match.phase, gross, discount, fees, refund, byVendor, at: Date.now() });
  S.ledger = S.ledger.slice(0, 400);
}
/* Order-level "next step" used by operator screens. */
function advanceOrder(o, actor) { const n = nextStage(o); return n ? setStage(o, n, actor) : false; }
function nextActionLabel(o) {
  const n = nextStage(o);
  return n ? t({ accepted: 'act.accept', preparing: 'act.start', ready: 'act.ready', collected: 'act.collect', dispatched: 'act.dispatch', delivered: 'act.deliver' }[n]) : null;
}

/* Vendor-level actions. The order stage follows its vendor tasks. */
function vendorAction(o, vid, action, actor = 'vendor') {
  const tk = o.tasks.find((x) => x.vid === vid);
  if (!tk || isFinal(o)) return false;
  if (action === 'accept' && !tk.acc) tk.acc = true;
  else if (action === 'start' && tk.acc && tk.st === 0) tk.st = 1;
  else if (action === 'ready' && tk.st === 1) { tk.st = 2; tk.prog = tk.need; }
  else if (action === 'reject' && tk.st < 2) {
    tk.rejected = true;
    o.issue = { kind: 'rejected', vid };
    logActivity(actor, `${o.id}: ${L(vendor(vid).name)} ${T('cannot fulfil', 'لا يستطيع التنفيذ')}`);
    if (!o.synthetic) toast(T(`${L(vendor(vid).name)} can't complete part of ${o.id}. Choose what to do in your order.`, `${L(vendor(vid).name)} لا يستطيع إكمال جزء من ${o.id}. اختر الإجراء من صفحة الطلب.`), 'warn', 5000);
    return true;
  } else return false;
  logActivity(actor, `${o.id}: ${L(vendor(vid).name)} → ${TASK_LABEL(tk)}`);
  syncFromTasks(o, actor);
  return true;
}
function syncFromTasks(o, actor) {
  const live = o.tasks.filter((x) => !x.rejected);
  if (!live.length) return;
  if (o.stage === 'placed' && live.every((x) => x.acc)) setStage(o, 'accepted', actor);
  if (o.stage === 'accepted' && live.some((x) => x.st >= 1)) setStage(o, 'preparing', actor);
  if (o.stage === 'preparing' && live.every((x) => x.st >= 2)) setStage(o, 'ready', actor);
}
function cancelOrder(o, actor, note) { return setStage(o, 'cancelled', actor, note); }

/* ---------- deterministic estimates ---------- */
function vendorQueueMin(vid) { return (activeTasks(vid) / Math.max(1, vendorCap(vid))) * 4; }
function estimate(order) {
  if (isFinal(order)) return 0;
  const leg = order.type === 'delivery' ? walkMins(planRoute(vendor(order.tasks[0].vid).angle, destAngle(order)).len, order.dest) : 0;
  const st = order.stage || 'placed';
  if (st === 'dispatched') return Math.max(1, leg * (1 - Math.min(1, (S.simTick - order.stageTick) / 8)));
  if (st === 'ready') return order.type === 'delivery' ? leg + 1 : 1;
  const prep = Math.max(...order.tasks.filter((x) => !x.rejected).map((x) => (x.st >= 2 ? 0 : Math.max(1, x.need - (x.prog || 0)) / 2 + (x.acc ? 0 : 1) + (vendorPaused(x.vid) ? 5 : vendorQueueMin(x.vid)))), 0);
  const queue = order.type === 'pickup' ? pickupWait(order.dest) * 0.3 : 0;
  return prep + leg + queue + (order.delay || 0) / 2;
}
function orderTotal(items) {
  return items.reduce((s, it) => s + (it.price ?? linePrice(it.id, it.opt)) * it.qty, 0);
}
/* Price breakdown. Menu prices include VAT; the VAT share is shown for transparency. */
function priceBreakdown(items, type, discount = 0) {
  const subtotal = orderTotal(items);
  const fee = type === 'delivery' ? S.venueCfg.deliveryFee : 0;
  const service = S.venueCfg.serviceFee || 0;
  const total = Math.max(0, subtotal + fee + service - discount);
  const vat = Math.round((total - total / (1 + S.venueCfg.vatRate)) * 100) / 100;
  return { subtotal, fee, service, discount, total, vat };
}

/* Operator timing: 2 simulation ticks = 1 minute, the same scale as the match clock. */
const elapsedMin = (o) => Math.max(0, Math.round(((o.doneTick ?? S.simTick) - (o.bornTick ?? S.simTick)) / 2));
const promisedMin = (o) => o.promised ?? 10;
const isOverdue = (o) => !isFinal(o) && elapsedMin(o) > promisedMin(o);
const isBlocked = (o) => !isFinal(o) && (!!o.issue || o.tasks.some((x) => vendorPaused(x.vid) && x.st < 2));
const isUnassigned = (o) => !isFinal(o) && o.type === 'delivery' && ['ready', 'dispatched'].includes(o.stage) && !o.runner;
const needsAttention = (o) => isOverdue(o) || isBlocked(o) || isUnassigned(o);
function orderOwner(o) {
  if (o.stage === 'cancelled') return '—';
  if (isFinal(o)) return T('Fan', 'المشجع');
  if (o.stage === 'dispatched' || (o.stage === 'ready' && o.type === 'delivery')) return o.runner ? `${T('Runner', 'المندوب')} ${o.runner}` : T('Unassigned', 'غير مُسند');
  if (o.stage === 'ready') return `${T('Pickup desk', 'مكتب الاستلام')} ${pickup(o.dest)?.id || ''}`;
  return o.tasks.filter((x) => !x.rejected).map((x) => L(vendor(x.vid).name)).join(' + ');
}
function consumeStock(id, qty) {
  if (S.stock[id] == null) return;
  S.stock[id] = Math.max(0, S.stock[id] - qty);
  if (S.stock[id] === 0 && !S.soldOut.includes(id)) {
    S.soldOut.push(id);
    addAlert('stock', { en: `${item(id).name.en} sold out`, ar: `نفد ${item(id).name.ar}` });
  }
}
function countPlaced() { S.opsStats.byPhase[S.match.phase] = (S.opsStats.byPhase[S.match.phase] || 0) + 1; }

function placeOrder({ items, type, dest, schedule = 'now', group = null, note = '' }) {
  const id = 'GB-' + (1000 + S.orders.length * 7 + Math.floor(srand() * 900));
  const voucher = S.vouchers.find((v) => items.some((i) => i.id === v.item));
  let discount = 0;
  if (voucher) {
    discount = Math.round(item(voucher.item).price * (voucher.pct ?? 100)) / 100;
    S.vouchers = S.vouchers.filter((v) => v !== voucher);
    const of = voucher.offer && S.offers.find((x) => x.id === voucher.offer);
    if (of) of.m[S.match.phase].o++;
  }
  const pb = priceBreakdown(items, type, discount);
  const order = {
    id, items, type, dest, schedule, group, note, bornTick: S.simTick, offer: voucher?.offer || null,
    tasks: routeItems(items, type === 'delivery' ? SECTIONS[dest].angle : pickup(dest).angle),
    stage: 'placed', status: 0, stageTick: S.simTick, history: [{ stage: 'placed', tick: S.simTick, minute: S.match.minute, by: 'fan' }],
    created: Date.now(), minute: S.match.minute, phase: S.match.phase,
    total: pb.total, discount, fee: pb.fee, service: pb.service, vat: pb.vat, subtotal: pb.subtotal, payment: { simulated: true },
    runner: type === 'delivery' ? RUNNERS[S.orders.length % RUNNERS.length] : null,
    code: String(100 + Math.floor(srand() * 900)),
    eventId: currentEvent().id,
  };
  order.eta0 = estimate(order);
  order.lastEta = order.eta0;
  order.promised = Math.ceil(order.eta0) + 2;
  S.orders.unshift(order);
  countPlaced();
  logActivity('fan', `${id} ${T('placed', 'جديد')} · ${order.tasks.map((x) => L(vendor(x.vid).name)).join(' + ')}`);
  items.forEach((i) => consumeStock(i.id, i.qty));
  items.filter((i) => item(i.id).cat === 'merch').forEach((i) => {
    if (!S.trophies.some((x) => x.id === i.id)) S.trophies.push({ id: i.id, at: Date.now() });
    S.purchases.push({ id: i.id, at: Date.now(), order: id });
    S.season.history.unshift({ kind: 'merch', id: i.id, md: S.season.matchday, at: Date.now() });
    if (['m3', 'x77', 'xstad'].includes(i.id)) S.quests.scarf = 1;
  });
  S.stadiumUnlock = clamp(S.stadiumUnlock + 3, 0, 100);
  order.tasks.forEach((x) => { if (!S.season.vendorsTried.includes(x.vid)) S.season.vendorsTried.push(x.vid); });
  addAlert('order', { en: `New order ${id} split across ${order.tasks.length} vendor(s)`, ar: `طلب جديد ${id} موزّع على ${order.tasks.length} بائع` });
  // rewards (demo points)
  addPoints(Math.round(order.total) + 20, T('Order placed', 'تم الطلب'));
  if (items.some((i) => ['snacks', 'fries'].includes(item(i.id).cat))) S.quests.snack = 1;
  awardBadge('first');
  if (S.orders.length >= 3) awardBadge('foodie');
  if (group) awardBadge('group');
  if (S.orders.length % 2 === 0) awardCollectible(T('Repeat order reward', 'مكافأة تكرار الطلب'));
  save();
  return order;
}

/* ---------- rewards ---------- */
function addPoints(n, reason) {
  const before = tierOf(S.points);
  S.points += n;
  const after = tierOf(S.points);
  if (reason) toast(`+${n} ${T('pts', 'نقطة')} · ${reason}`, 'success', 2200);
  if (before !== after) {
    setTimeout(() => celebrate({ emoji: after === 'gold' ? '🥇' : '🥈', title: T(`You're now ${L(TIERS[after].name)}!`, `أصبحت ${L(TIERS[after].name)}!`), sub: T('New loyalty tier unlocked.', 'فئة ولاء جديدة.'), kind: 'confetti' }), 600);
  }
}
function awardBadge(id) {
  if (S.badges.includes(id)) return false;
  S.badges.push(id);
  toast(`${BADGES[id].emoji} ${T('Badge unlocked', 'وسام جديد')}: ${L(BADGES[id].name)}`, 'success');
  S.season.history.unshift({ kind: 'badge', id, md: S.season.matchday, at: Date.now() });
  return true;
}
function awardCollectible(reason, forceId) {
  const next = forceId ? COLLECTIBLE_SERIES.find((c) => c.id === forceId) : COLLECTIBLE_SERIES.find((c) => !S.collectibles.some((x) => x.id === c.id));
  if (!next || S.collectibles.some((x) => x.id === next.id)) return;
  S.collectibles.push({ id: next.id, at: Date.now(), md: S.season.matchday, reason });
  S.season.history.unshift({ kind: 'card', id: next.id, md: S.season.matchday, at: Date.now() });
  toast(`${next.emoji} ${T('Collectible card', 'بطاقة مقتنيات')}: ${L(next.name)}`, 'success');
  if (S.collectibles.length >= 3) awardBadge('collector');
}
function addAlert(kind, text) {
  S.alerts.unshift({ id: uid('al'), kind, text, minute: S.match.minute, at: Date.now() });
  S.alerts = S.alerts.slice(0, 25);
}

/* ---------- synthetic orders for the operator board (deterministic) ---------- */
const FAKE_NAMES = ['Noura', 'Faisal', 'Huda', 'Omar', 'Sara', 'Khalid', 'Reem', 'Majed', 'Lama', 'Turki', 'Ruba', 'Ziad'];
let opsSeq = 0;
function makeOpsOrder() {
  opsSeq++;
  const n = 1 + Math.floor(srand() * 3);
  const items = [];
  for (let i = 0; i < n; i++) {
    const pool = srand() < 0.12 ? MERCH_ITEMS.filter((x) => !x.special) : MENU;
    const m = pick(pool.filter((x) => itemAvailable(x.id)));
    if (!m) continue;
    const ex = items.find((x) => x.id === m.id);
    ex ? ex.qty++ : items.push({ id: m.id, qty: 1, by: 'x' });
  }
  if (!items.length) items.push({ id: 'd1', qty: 1, by: 'x' });
  const zones = S.venueCfg.deliverySections.filter(deliveryAllowed);
  const type = zones.length && srand() < 0.35 ? 'delivery' : 'pickup';
  const pids = PICKUPS.filter((p) => pickupAllowed(p.id));
  const dest = type === 'delivery' ? pick(zones) : (pick(pids) || PICKUPS[0]).id;
  const o = { id: 'GB-' + (2000 + ((S.simTick * 37 + opsSeq * 101) % 7000)), items, type, dest, fan: pick(FAKE_NAMES), synthetic: true,
    stage: 'placed', status: 0, stageTick: S.simTick, history: [], runner: type === 'delivery' ? pick(RUNNERS) : null, bornTick: S.simTick, code: String(100 + Math.floor(srand() * 900)),
    note: srand() < 0.25 ? pick([{ en: 'No ice please', ar: 'بدون ثلج لو سمحت' }, { en: 'Allergic to sesame', ar: 'عندي حساسية من السمسم' }, { en: 'Wheelchair seat, aisle side', ar: 'مقعد كرسي متحرك، جهة الممر' }]) : '' };
  o.tasks = routeItems(items, destAngle(o));
  o.total = orderTotal(items);
  o.promised = Math.ceil(estimate(o)) + 2;
  countPlaced();
  return o;
}
function seedOps() {
  if (S.opsOrders.length) return;
  const stages = ['placed', 'accepted', 'preparing', 'ready', 'preparing', 'placed', 'ready', 'collected', 'preparing'];
  stages.forEach((target, i) => {
    const o = makeOpsOrder();
    o.bornTick = S.simTick - (i * 3 + 2 + (i === 4 ? 30 : 0));   // one order is deliberately running late
    const f = flowOf(o);
    const goal = f.includes(target) ? target : f[f.length - 1];
    while (o.stage !== goal && nextStage(o)) setStage(o, nextStage(o), 'sim');
    S.opsOrders.push(o);
  });
}

/* Simulated kitchen/runner progress. Labelled as simulation everywhere it appears; never skips a state. */
function stepOrder(o) {
  if (isFinal(o) || o.issue) return;
  if (o.schedule === 'halftime' && !['halftime', 'second', 'final'].includes(S.match.phase) && !(S.match.phase === 'kickoff' && S.match.minute >= 38)) return;
  const since = S.simTick - (o.stageTick ?? o.bornTick);
  const live = o.tasks.filter((x) => !x.rejected);
  if (live.some((x) => vendorPaused(x.vid) && x.st < 2)) { o.hold = 'vendor_paused'; return; }
  o.hold = null;
  switch (o.stage) {
    case 'placed': if (since >= 2) setStage(o, 'accepted', 'sim'); break;
    case 'accepted': if (since >= 1) setStage(o, 'preparing', 'sim'); break;
    case 'preparing':
      live.forEach((x) => { if (x.st === 1) { x.prog = (x.prog || 0) + 1; if (x.prog >= x.need + (o.delay || 0)) x.st = 2; } });
      if (live.every((x) => x.st >= 2)) setStage(o, 'ready', 'sim');
      break;
    case 'ready':
      if (o.type === 'delivery') { if (since >= 2 && o.runner) setStage(o, 'dispatched', 'sim'); }
      else if (o.synthetic && since >= 10) setStage(o, 'collected', 'sim');
      else if (!o.synthetic && since >= 40 && !o.uncollectedNotice) { o.uncollectedNotice = true; toast(T(`Reminder: ${o.id} is waiting at ${L(pickup(o.dest).name)}.`, `تذكير: ${o.id} بانتظارك في ${L(pickup(o.dest).name)}.`), 'warn', 5000); }
      break;
    case 'dispatched': if (since >= 8) setStage(o, 'delivered', 'sim'); break;
  }
}
function onOrderStatus(o) {
  const where = o.type === 'delivery' ? T('to your seat', 'إلى مقعدك') : L(pickup(o.dest).name);
  const msgs = {
    accepted: T(`${o.id} accepted by the kitchen`, `تم قبول ${o.id} من المطبخ`),
    preparing: T(`${o.id} is being prepared`, `${o.id} قيد التحضير`),
    ready: o.type === 'delivery' ? T(`${o.id} is ready — waiting for the runner`, `${o.id} جاهز — بانتظار المندوب`) : T(`${o.id} is ready at ${where}`, `${o.id} جاهز في ${where}`),
    dispatched: T(`${o.runner} is on the way ${where}`, `${o.runner} في الطريق ${where}`),
    delivered: T(`${o.id} delivered. Enjoy!`, `تم توصيل ${o.id}. بالعافية!`),
    collected: T(`${o.id} collected. Enjoy!`, `تم استلام ${o.id}. بالعافية!`),
    cancelled: T(`${o.id} was cancelled`, `تم إلغاء ${o.id}`),
  };
  if (msgs[o.stage]) toast(msgs[o.stage], isFinal(o) && o.stage !== 'cancelled' ? 'success' : o.stage === 'cancelled' ? 'warn' : 'info');
  nativeOrderStatus(o);
}
/* Tell the fan when an estimate moves by 3+ minutes, and why. */
function checkEtaChange(o) {
  if (isFinal(o) || o.synthetic) return;
  const e = Math.round(estimate(o));
  const prev = Math.round(o.lastEta ?? e);
  if (S.simTick - (o.bornTick ?? 0) < 6) { o.lastEta = e; return; }   // settle the first estimate silently
  if (e - prev >= 3 || prev - e >= 5) {
    const why = o.hold === 'vendor_paused' ? T('a vendor paused orders', 'أوقف أحد البائعين الطلبات مؤقتاً') : o.delay ? T('the kitchen reported a delay', 'أبلغ المطبخ عن تأخير') : e > prev ? T('the queue got longer', 'زاد الطابور') : T('the queue moved faster', 'تحرك الطابور أسرع');
    o.etaNote = { from: prev, to: e, why, tick: S.simTick };
    toast(T(`${o.id}: new estimate ~${e} min (was ${prev}) — ${why}.`, `${o.id}: الوقت المتوقع الجديد ~${e} د (كان ${prev}) — ${why}.`), 'warn', 4500);
    o.lastEta = e;
  }
}

/* ---------- match & crowd simulation ---------- */
let tickCount = 0;
let simTimer = null;
function startSim() {
  clearInterval(simTimer);
  simTimer = setInterval(tick, 1000 / S.simSpeed);
}
function tick() {
  tickCount++;
  S.simTick++;
  const m = S.match;
  // match clock
  if (m.clock && S.user && S.setup && !S.ops.cancelled && S.simTick % 2 === 0) {
    if (m.phase === 'arrival' || m.phase === 'prematch') {
      m.minute++;
      if (m.minute >= -30 && m.phase === 'arrival') m.phase = 'prematch';
      if (m.minute >= 0) setPhase('kickoff');
    } else if (m.phase === 'kickoff') {
      m.minute++;
      if (m.minute >= 45) trigger('halftime');
    } else if (m.phase === 'second') {
      m.minute++;
      if (m.minute === 77 && !S.unlocked.includes('x77')) trigger('drop77');
      if (m.minute >= 90) trigger('final');
    }
  }
  // crowd: deterministic drift toward a phase target (no random noise)
  const halftime = m.phase === 'halftime';
  Object.keys(S.crowd).forEach((k, i) => {
    const isPickup = k.startsWith('P');
    let target = isPickup ? (halftime ? 78 : m.phase === 'prematch' ? 45 : 28) : halftime ? 70 : m.phase === 'arrival' ? 55 : 42;
    if (S.crowdBoost) target += S.crowdBoost;
    if (isPickup) target += S.orders.concat(S.opsOrders).filter((o) => o.type === 'pickup' && o.dest === k && o.stage === 'ready').length * 4;
    if (isPickup && S.overloaded.includes(k)) target = 96;
    S.crowd[k] = clamp(S.crowd[k] + (target - S.crowd[k]) * 0.08 + Math.sin((S.simTick + i * 5) / 6) * 0.8, 5, 99);
  });
  m.intensity = clamp(m.intensity + Math.sin(S.simTick / 5) * 1.5 + (m.phase === 'second' && m.minute > 75 ? 0.6 : 0) - (m.intensity > 60 ? 0.6 : 0), 10, 100);
  // vendor workload = active tasks vs configured capacity
  VENDORS.forEach((v) => (S.vendorLoad[v.id] = clamp(Math.round(10 + (activeTasks(v.id) / vendorCap(v.id)) * 90), 5, 99)));
  S.rivalry.A += S.simTick % 3; S.rivalry.B += (S.simTick + 1) % 3; S.rivalry.C += S.simTick % 2;
  if (S.simTick % 6 === 0) S.stadiumUnlock = clamp(S.stadiumUnlock + 0.5, 0, 100);
  if (S.stadiumUnlock >= 100 && !S.unlocked.includes('xstad')) {
    S.unlocked.push('xstad');
    toast(T('✨ Stadium-wide goal reached (demo)! Golden Scarf is now in the Club Shop.', '✨ اكتمل الهدف الجماعي (تجريبي)! الوشاح الذهبي متاح الآن في المتجر.'), 'success', 5000);
  }
  // orders
  if (S.demo.autopilot) { S.orders.forEach(stepOrder); }
  S.orders.forEach(checkEtaChange);
  if (S.group?.sim && S.simTick % 7 === 0) groupBotAdd();
  seedOps();
  if (S.demo.autopilot) S.opsOrders.forEach(stepOrder);
  S.opsOrders = S.opsOrders.filter((o) => !(isFinal(o) && S.simTick - (o.doneTick || 0) > 20)).slice(0, 20);
  const every = halftime ? 3 : 6;
  if (S.demo.autopilot && orderingStatus().open && S.simTick % every === 0 && S.opsOrders.filter((o) => !isFinal(o)).length < 12) S.opsOrders.push(makeOpsOrder());
  // campaign engagement (simulated, deterministic)
  S.offers.forEach((of) => {
    if (!offerLive(of)) return;
    const b = of.m[m.phase];
    b.v += 6 + (S.simTick % 5);
    if (S.simTick % 2 === 0) { b.r++; const k = of.sections[S.simTick % of.sections.length]; of.s[k] = (of.s[k] || 0) + 1; }
    if (S.simTick % 3 === 0 && b.o < b.r) b.o++;
    if (of.limit && offerTotals(of).r >= of.limit) { of.status = 'ended'; logActivity('sim', `${L(of.title)}: ${T('redemption limit reached', 'وصل حد الاستخدام')}`); }
  });
  if (S.flash && S.flash.until <= Date.now()) S.flash = null;
  save();
  refreshLive();
  if (SHEET && SHEET.live) renderSheet();
}

function offerLive(of) {
  const m = S.match;
  if (!of.active || ['paused', 'ended', 'draft'].includes(of.status)) return false;
  switch (of.moment) {
    case 'now': return true;
    case 'arrival': return m.phase === 'arrival' || (m.phase === 'prematch' && m.minute < -20);
    case 'prematch': return m.phase === 'arrival' || m.phase === 'prematch';
    case 'halftime': return m.phase === 'halftime';
    case 'goal': return m.lastGoalMinute != null && m.minute - m.lastGoalMinute <= (of.minutes || 5) && m.phase !== 'final';
    case 'minute': return m.minute >= (of.minute || 60) && m.minute < (of.minute || 60) + (of.minutes || 5);
    default: return false;
  }
}

function startFlash() {
  const it = MENU.find((x) => x.id === 's2' && itemAvailable(x.id)) || MENU.find((x) => itemAvailable(x.id));
  S.flash = { item: it.id, pct: 20, until: Date.now() + 120000, zone: bestPickup().id };
}

function setPhase(p) {
  const m = S.match;
  m.phase = p;
  if (p === 'arrival') m.minute = -90;
  if (p === 'prematch') m.minute = Math.max(m.minute, -30);
  if (p === 'kickoff') m.minute = Math.max(0, Math.min(m.minute, 44));
  if (p === 'halftime') m.minute = 45;
  if (p === 'second') m.minute = Math.max(46, m.minute);
  if (p === 'final') m.minute = Math.max(90, m.minute);
  S.dismissed = [];
}

/* ---------- demo triggers ---------- */
function trigger(kind, arg) {
  const m = S.match;
  const concert = isConcert();
  switch (kind) {
    case 'advance': {
      const i = PHASES.indexOf(m.phase);
      if (i < PHASES.length - 1) {
        const next = PHASES[i + 1];
        if (next === 'halftime') return trigger('halftime');
        if (next === 'final') return trigger('final');
        setPhase(next);
        toast(`${T('Timeline', 'المخطط الزمني')}: ${phaseLabel()}`);
      }
      break;
    }
    case 'phase': setPhase(arg); break;
    case 'goal': {
      if (['arrival', 'prematch', 'halftime', 'final'].includes(m.phase)) setPhase(m.phase === 'halftime' ? 'second' : m.phase === 'final' ? 'final' : 'kickoff');
      const forHome = arg !== 'away';
      forHome ? m.home++ : m.away++;
      m.lastGoalMinute = m.minute;
      m.intensity = 97;
      S.crowd.P1 = clamp(S.crowd.P1 + 15, 0, 99); S.crowd.P2 = clamp(S.crowd.P2 + 12, 0, 99);
      awardBadge('goal');
      addAlert('goal', { en: `Goal at ${m.minute}' — expect a pickup surge in 5–10 min`, ar: `هدف في الدقيقة ${m.minute} — توقع زيادة في الاستلام خلال 5–10 دقائق` });
      const golden = m.home + m.away === 1;
      const seatNum = +(S.setup?.seat || 1);
      const lucky = seatNum % 3 === m.minute % 3;
      celebrate({
        emoji: concert ? '🎤' : '⚽',
        title: concert ? T('Hit song drop!', 'أغنية الحفل!') : forHome ? T(`GOAL! ${L(TEAMS[currentEvent().home].name)}`, `هدف! ${L(TEAMS[currentEvent().home].name)}`) : T('Goal for the visitors', 'هدف للضيوف'),
        sub: golden ? T('Golden Goal Freebie unlocked: free Classic Fries on your next order.', 'هدية الهدف الذهبي: بطاطس كلاسيك مجانية مع طلبك القادم.') : T('Goal-time drinks offer is live now.', 'عرض مشروبات الهدف متاح الآن.'),
        kind: 'confetti', ms: 4500,
        cta: { act: 'go', arg: 'menu', label: T('Order now', 'اطلب الآن') },
      });
      if (golden) S.vouchers.push({ id: uid('v'), item: 'f1', label: { en: 'Golden Goal Freebie · Classic Fries', ar: 'هدية الهدف الذهبي · بطاطس كلاسيك' } });
      if (lucky) setTimeout(() => {
        addPoints(150, T('Lucky Goal Minute', 'دقيقة الهدف المحظوظة'));
        toast(T(`🍀 Lucky Goal Minute! Seat ${seatLabel()} wins 150 points.`, `🍀 دقيقة الهدف المحظوظة! المقعد ${seatLabel()} يفوز بـ 150 نقطة.`), 'success', 5000);
      }, 4800);
      addPoints(25, T('Goal witness', 'شاهد الهدف'));
      haptic('heavy');
      nativeNotify(concert ? T('Hit song drop!', 'أغنية الحفل!') : T('GOAL!', 'هدف!'), T('Goal-time offers are live in GolBite.', 'عروض الهدف متاحة الآن في GolBite.'), 'goal:' + m.minute);
      break;
    }
    case 'halftime':
      setPhase('halftime');
      S.crowd.P1 = 80; S.crowd.P2 = 70; S.crowd.P3 = 74;
      addAlert('capacity', { en: 'Halftime rush: pickup points filling up', ar: 'ذروة الاستراحة: نقاط الاستلام تمتلئ' });
      toast(T('⏱️ Halftime Rush — calmer pickup points are highlighted on your map.', '⏱️ ذروة الاستراحة — نقاط الاستلام الأهدأ مميزة على خريطتك.'), 'warn', 5000);
      break;
    case 'redcard':
      if (!['kickoff', 'second'].includes(m.phase)) setPhase('second');
      m.redCard = true;
      m.intensity = clamp(m.intensity + 20, 0, 100);
      if (!S.unlocked.includes('xred')) S.unlocked.push('xred');
      celebrate({ emoji: '🟥', title: concert ? T('Surprise guest on stage!', 'ضيف مفاجئ على المسرح!') : T('Red card!', 'بطاقة حمراء!'), sub: T('Red Card Merch revealed in Club Shop — today only.', 'تيشيرت البطاقة الحمراء ظهر في المتجر — اليوم فقط.'), kind: 'confetti', ms: 3500, cta: { act: 'go', arg: 'shop', label: T('See drop', 'شاهد الإصدار') } });
      break;
    case 'drop77':
      if (m.phase !== 'second') setPhase('second');
      m.minute = Math.max(m.minute, 77);
      if (!S.unlocked.includes('x77')) S.unlocked.push('x77');
      addAlert('merch', { en: "77' merch drop live — 777 scarves", ar: 'إصدار الدقيقة 77 متاح — 777 وشاحاً' });
      celebrate({ emoji: '🔥', title: T("77' Drop is live!", 'إصدار الدقيقة 77 متاح!'), sub: T('Limited scarf, 777 pieces. Pick up at halftime counters or seat delivery.', 'وشاح محدود، 777 قطعة.'), kind: 'confetti', ms: 4000, cta: { act: 'go', arg: 'shop', label: T('Open Club Shop', 'افتح المتجر') } });
      break;
    case 'final':
    case 'win': {
      if (kind === 'win' && m.home <= m.away) m.home = m.away + 1;
      setPhase('final');
      const won = m.home > m.away || concert;
      m.won = won;
      resolvePrediction();
      awardCollectible(T('Season matchday card', 'بطاقة جولة الموسم'));
      if (!S.season.history.some((h) => h.kind === 'match' && h.md === S.season.matchday)) {
        S.season.attended++;
        S.season.history.unshift({ kind: 'match', md: S.season.matchday, at: Date.now(), score: `${m.home}-${m.away}`, eventId: currentEvent().id });
      }
      if (won) {
        awardBadge('victory');
        celebrate({ emoji: '🎆', title: concert ? T('What a show!', 'يا له من حفل!') : T('Victory! Home team wins', 'فوز! انتصر صاحب الأرض'), sub: T('Victory Snack Fireworks: 20% off desserts for 10 minutes.', 'ألعاب النصر: خصم 20% على الحلويات لمدة 10 دقائق.'), kind: 'fireworks', ms: 5000 });
      } else {
        toast(T('Final whistle. Thanks for coming — see your matchday summary on Home.', 'صافرة النهاية. شكراً لحضورك — ملخص يومك في الرئيسية.'));
      }
      break;
    }
    case 'crowd': {
      const up = arg !== 'down';
      S.crowdBoost = up ? 30 : -20;
      Object.keys(S.crowd).forEach((k) => (S.crowd[k] = clamp(S.crowd[k] + (up ? 30 : -25), 5, 99)));
      m.intensity = clamp(m.intensity + (up ? 25 : -20), 10, 100);
      addAlert('capacity', up ? { en: 'Crowd intensity rising across concourses', ar: 'ارتفاع كثافة الجماهير في الممرات' } : { en: 'Crowd levels easing', ar: 'انخفاض كثافة الجماهير' });
      toast(up ? T('Crowd intensity rising — estimates updated.', 'الكثافة ترتفع — تم تحديث التقديرات.') : T('Crowds easing — estimates updated.', 'الكثافة تنخفض — تم تحديث التقديرات.'), 'warn');
      setTimeout(() => (S.crowdBoost = 0), 30000);
      break;
    }
    case 'closure': {
      if (S.closedRoutes.length) {
        S.closedRoutes = [];
        addAlert('route', { en: 'Concourse route reopened', ar: 'إعادة فتح الممر' });
        toast(T('Route reopened.', 'أُعيد فتح الممر.'), 'success');
      } else {
        const sec = SECTIONS[S.setup?.section || 'A'];
        const gate = GATES.find((g) => g.id === (S.setup?.gate || 'G1'));
        const r = planRoute(gate.angle, sec.angle);
        const mid = norm(gate.angle + r.dir * r.span * 0.5);
        S.closedRoutes = [{ id: 'cl1', from: norm(mid - 12), to: norm(mid + 12) }];
        addAlert('route', { en: `Concourse closed near ${Math.round(mid)}° — rerouting runners`, ar: 'إغلاق جزء من الممر — إعادة توجيه المندوبين' });
        toast(T('🚧 Route closure — GolBite found a new path to your seat.', '🚧 إغلاق ممر — وجد GolBite طريقاً جديداً لمقعدك.'), 'warn', 5000);
      }
      break;
    }
    case 'overload': {
      const pid = arg || (activeOrder()?.type === 'pickup' ? activeOrder().dest : nearestPickup().id);
      if (S.overloaded.includes(pid)) S.overloaded = S.overloaded.filter((x) => x !== pid);
      else {
        S.overloaded.push(pid);
        addAlert('capacity', { en: `${pickup(pid).name.en} over capacity`, ar: `${pickup(pid).name.ar} تجاوز السعة` });
        toast(T(`⚠️ ${L(pickup(pid).name)} is over capacity. Try ${L(bestPickup(pid).name)}.`, `⚠️ ${L(pickup(pid).name)} مزدحم. جرّب ${L(bestPickup(pid).name)}.`), 'warn', 5000);
      }
      break;
    }
    case 'soldout': {
      const target = arg || activeOrder()?.items.find((i) => !S.soldOut.includes(i.id))?.id || 'b1';
      if (!S.soldOut.includes(target)) S.soldOut.push(target);
      S.stock[target] = 0;
      addAlert('stock', { en: `${item(target).name.en} sold out — suggesting ${item(ALTERNATIVES[target]).name.en}`, ar: `نفد ${item(target).name.ar} — اقتراح ${item(ALTERNATIVES[target]).name.ar}` });
      toast(T(`${item(target).emoji} ${L(item(target).name)} just sold out. Try ${L(item(ALTERNATIVES[target]).name)}.`, `${item(target).emoji} نفد ${L(item(target).name)}. جرّب ${L(item(ALTERNATIVES[target]).name)}.`), 'warn', 5000);
      S.orders.filter((o) => ['placed', 'accepted', 'preparing'].includes(o.stage) && o.items.some((i) => i.id === target)).forEach((o) => {
        o.issue = { kind: 'soldout', item: target };
        logActivity('sim', `${o.id}: ${L(item(target).name)} ${T('unavailable after order', 'غير متاح بعد الطلب')}`);
      });
      break;
    }
    case 'reset':
      S.match = freshMatch();
      S.closedRoutes = []; S.overloaded = []; S.soldOut = []; S.dismissed = [];
      S.unlocked = S.unlocked.filter((u) => u === 'xstad' || u === 'xpred' || u === 'xgold');
      S.crowd = { A: 40, B: 30, C: 45, P1: 35, P2: 25, P3: 30 };
      S.prediction = null; S.quiz = { done: false, score: 0 };
      S.season.matchday++;
      S.stock = defaultStock();
      S.opsOrders = []; S.opsStats = { completed: 214, cancelled: 0, byPhase: { arrival: 58, prematch: 156 } };
      S.alerts = []; S.ledger = []; S.tasks = []; S.ops = defaultOpsState(); S.svcStatus = {}; S.activity = []; S.rng = 20261024; S.flash = null;
      logActivity('admin', T('Event reset to the sample state', 'تمت إعادة الفعالية للحالة النموذجية'));
      toast(T(`Event reset — Matchday ${S.season.matchday} ready.`, `تمت إعادة الحدث — الجولة ${S.season.matchday} جاهزة.`), 'success');
      break;
  }
  save();
  rerender();
}

function resolvePrediction() {
  const p = S.prediction;
  if (!p || !p.locked || p.resolved) return;
  const m = S.match;
  const result = m.home > m.away ? 'home' : m.home < m.away ? 'away' : 'draw';
  p.resolved = true;
  p.correct = p.result === result;
  if (p.correct) {
    addPoints(200, T('Correct prediction', 'توقع صحيح'));
    awardBadge('oracle');
    if (!S.unlocked.includes('xpred')) S.unlocked.push('xpred');
  }
}

/* ---------- group order bots ---------- */
const GROUP_FRIENDS = ['Faisal', 'Noura', 'Majed'];
function groupBotAdd() {
  const g = S.group;
  if (!g || g.confirmed) return;
  const names = g.members.filter((x) => x !== g.me);
  if (!names.length) return;
  const who = names[g.items.length % names.length];
  if (g.items.filter((i) => i.by === who).length >= 2) { g.sim = g.items.filter((i) => i.by !== g.me).length < names.length * 2; return; }
  const m = MENU.filter((x) => itemAvailable(x.id))[(g.items.length * 5) % MENU.length] || MENU[0];
  g.items.push({ id: m.id, qty: 1, by: who });
  toast(T(`Simulated participant ${who} added ${L(m.name)}`, `المشارك الافتراضي ${who} أضاف ${L(m.name)}`), 'info', 1800);
}
