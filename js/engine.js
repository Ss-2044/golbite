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
    const cands = VENDORS.filter((v) => v.cats.includes(m.cat));
    let best = null;
    cands.forEach((v) => {
      const load = S.vendorLoad[v.id];
      const dist = angDist(v.angle, dAngle);
      const score = m.prep + load * 0.08 + dist / 30 + (tasks[v.id] ? 0 : 2);
      const reason = dist < 50 ? 'near' : load < 35 ? 'load' : 'stock';
      if (!best || score < best.score) best = { v, score, reason };
    });
    const t = (tasks[best.v.id] ||= { vid: best.v.id, items: [], st: 0, t: 0, need: 0, reason: best.reason });
    t.items.push({ ...it });
    t.need = Math.max(t.need, m.prep + Math.round(S.vendorLoad[best.v.id] / 15));
  });
  return Object.values(tasks);
}
const REASONS = {
  near:  { en: 'Closest to destination', ar: 'الأقرب للوجهة' },
  load:  { en: 'Lowest workload', ar: 'أقل ضغط عمل' },
  stock: { en: 'Has stock & capacity', ar: 'متوفر ولديه سعة' },
};
const RUNNERS = ['Ahmed', 'Yousef', 'Saad', 'Nasser', 'Bandar'];

function estimate(order) {
  const prep = Math.max(...order.tasks.map((t) => (t.st >= 2 ? 0 : Math.max(1, t.need + 3 - t.t) / 2)));
  const leg = order.type === 'delivery' ? walkMins(planRoute(vendor(order.tasks[0].vid).angle, destAngle(order)).len, order.dest) : 0;
  const queue = order.type === 'pickup' ? pickupWait(order.dest) * 0.4 : 0;
  if (order.status >= 3) return 0;
  if (order.status === 2) return order.type === 'delivery' ? Math.max(1, leg * (1 - (order.handoff || 0) / 10)) : 1;
  return prep + leg + queue;
}
function orderTotal(items) {
  return items.reduce((s, it) => s + (it.price ?? item(it.id).price) * it.qty, 0);
}

function placeOrder({ items, type, dest, schedule = 'now', group = null }) {
  const id = 'GB-' + (1000 + S.orders.length + Math.floor(Math.random() * 900));
  const voucher = S.vouchers.find((v) => items.some((i) => i.id === v.item));
  let discount = 0;
  if (voucher) { discount = Math.round(item(voucher.item).price * (voucher.pct ?? 100)) / 100; S.vouchers = S.vouchers.filter((v) => v !== voucher); }
  const order = {
    id, items, type, dest, schedule, group,
    tasks: routeItems(items, type === 'delivery' ? SECTIONS[dest].angle : pickup(dest).angle),
    status: 0, created: Date.now(), minute: S.match.minute, phase: S.match.phase,
    total: Math.max(0, orderTotal(items) - discount), discount,
    runner: type === 'delivery' ? pick(RUNNERS) : null,
    code: String(Math.floor(100 + Math.random() * 900)),
    handoff: 0, eventId: currentEvent().id,
  };
  order.eta0 = estimate(order);
  S.orders.unshift(order);
  S.stadiumUnlock = clamp(S.stadiumUnlock + 3, 0, 100);
  order.tasks.forEach((t) => { S.vendorLoad[t.vid] = clamp(S.vendorLoad[t.vid] + 6, 0, 100); if (!S.season.vendorsTried.includes(t.vid)) S.season.vendorsTried.push(t.vid); });
  addAlert('order', { en: `New order ${id} split across ${order.tasks.length} vendor(s)`, ar: `طلب جديد ${id} موزّع على ${order.tasks.length} بائع` });
  // rewards
  const pts = Math.round(order.total) + 20;
  addPoints(pts, T('Order placed', 'تم الطلب'));
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

/* ---------- synthetic orders for the operator board ---------- */
const FAKE_NAMES = ['Noura', 'Faisal', 'Huda', 'Omar', 'Sara', 'Khalid', 'Reem', 'Majed', 'Lama', 'Turki', 'Ruba', 'Ziad'];
function makeOpsOrder() {
  const n = 1 + Math.floor(Math.random() * 3);
  const items = [];
  for (let i = 0; i < n; i++) {
    const m = pick(MENU.filter((x) => !S.soldOut.includes(x.id)));
    const ex = items.find((x) => x.id === m.id);
    ex ? ex.qty++ : items.push({ id: m.id, qty: 1, by: 'x' });
  }
  const type = Math.random() < 0.35 ? 'delivery' : 'pickup';
  const dest = type === 'delivery' ? pick(['A', 'B', 'C']) : pick(PICKUPS).id;
  const o = { id: 'GB-' + Math.floor(2000 + Math.random() * 7000), items, type, dest, fan: pick(FAKE_NAMES), status: 0, synthetic: true, handoff: 0,
    runner: type === 'delivery' ? pick(RUNNERS) : null };
  o.tasks = routeItems(items, destAngle(o));
  o.total = orderTotal(items);
  return o;
}
function seedOps() {
  if (S.opsOrders.length) return;
  for (let i = 0; i < 9; i++) {
    const o = makeOpsOrder();
    const st = i % 4;
    o.tasks.forEach((t) => { t.st = Math.min(st, 2); t.t = st * 4; });
    o.status = st;
    S.opsOrders.push(o);
  }
}

/* ---------- order lifecycle ---------- */
function stepOrder(o) {
  if (o.status >= 3) return;
  if (o.schedule === 'halftime' && !['halftime', 'second', 'final'].includes(S.match.phase) && !(S.match.phase === 'kickoff' && S.match.minute >= 38)) return;
  o.tasks.forEach((t) => {
    if (t.st >= 2 || t.hold) return;
    t.t++;
    if (t.st === 0 && t.t >= 3) t.st = 1;
    else if (t.st === 1 && t.t >= 3 + t.need) t.st = 2;
  });
  const minSt = Math.min(...o.tasks.map((t) => t.st));
  const anyPrep = o.tasks.some((t) => t.st >= 1);
  const prev = o.status;
  if (o.status < 2) o.status = minSt >= 2 ? 2 : anyPrep ? 1 : 0;
  if (o.status === 2) {
    o.handoff = (o.handoff || 0) + 1;
    const limit = o.type === 'delivery' ? 10 : 16;
    if (o.handoff >= limit) completeOrder(o);
  }
  if (!o.synthetic && prev !== o.status) onOrderStatus(o);
}
function completeOrder(o) {
  o.status = 3;
  o.tasks.forEach((t) => (t.st = 3));
  o.completedAt = Date.now();
  o.tasks.forEach((t) => (S.vendorLoad[t.vid] = clamp(S.vendorLoad[t.vid] - 5, 5, 100)));
  if (!o.synthetic) onOrderStatus(o);
}
function onOrderStatus(o) {
  const msgs = [
    null,
    T(`Order ${o.id} is being prepared`, `طلبك ${o.id} قيد التحضير`),
    o.type === 'delivery' ? T(`${o.runner} is on the way to your seat`, `${o.runner} في الطريق إلى مقعدك`) : T(`Order ${o.id} is ready at ${L(pickup(o.dest).name)}`, `طلبك ${o.id} جاهز في ${L(pickup(o.dest).name)}`),
    T(`Order ${o.id} completed. Enjoy!`, `اكتمل طلبك ${o.id}. بالعافية!`),
  ];
  if (msgs[o.status]) toast(msgs[o.status], o.status === 3 ? 'success' : 'info');
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
  const m = S.match;
  // match clock
  if (m.clock && S.user && S.setup && tickCount % 2 === 0) {
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
  // crowd drift
  const halftime = m.phase === 'halftime';
  Object.keys(S.crowd).forEach((k) => {
    const isPickup = k.startsWith('P');
    let target = isPickup ? (halftime ? 78 : m.phase === 'prematch' ? 45 : 28) : halftime ? 70 : m.phase === 'arrival' ? 55 : 42;
    if (S.crowdBoost) target += S.crowdBoost;
    if (isPickup && S.overloaded.includes(k)) target = 96;
    S.crowd[k] = clamp(S.crowd[k] + (target - S.crowd[k]) * 0.08 + rand(-2.5, 2.5), 5, 99);
  });
  m.intensity = clamp(m.intensity + rand(-2, 2) + (m.phase === 'second' && m.minute > 75 ? 0.6 : 0) - (m.intensity > 60 ? 0.6 : 0), 10, 100);
  Object.keys(S.vendorLoad).forEach((k) => (S.vendorLoad[k] = clamp(S.vendorLoad[k] + rand(-1.5, 1.6) + (halftime ? 0.8 : 0), 5, 98)));
  // rivalry counters
  S.rivalry.A += Math.round(rand(0, 4)); S.rivalry.B += Math.round(rand(0, 4)); S.rivalry.C += Math.round(rand(0, 3));
  if (tickCount % 6 === 0) S.stadiumUnlock = clamp(S.stadiumUnlock + 0.5, 0, 100);
  if (S.stadiumUnlock >= 100 && !S.unlocked.includes('xstad')) {
    S.unlocked.push('xstad');
    toast(T('✨ Stadium-wide unlock reached! Golden Scarf now in Club Shop.', '✨ اكتمل الهدف الجماعي! الوشاح الذهبي متاح الآن في المتجر.'), 'success', 5000);
  }
  // orders
  S.orders.forEach(stepOrder);
  if (S.group?.sim && tickCount % 7 === 0) groupBotAdd();
  seedOps();
  S.opsOrders.forEach(stepOrder);
  S.opsOrders = S.opsOrders.filter((o) => !(o.status >= 3 && Date.now() - (o.completedAt || 0) > 20000)).slice(0, 18);
  if (Math.random() < (halftime ? 0.35 : 0.15) && S.opsOrders.filter((o) => o.status < 3).length < 12) S.opsOrders.push(makeOpsOrder());
  // offers engagement
  S.offers.forEach((of) => {
    if (!of.active) return;
    const liveNow = offerLive(of);
    of.views += Math.round(rand(liveNow ? 4 : 0, liveNow ? 14 : 2));
    if (liveNow && Math.random() < 0.5) of.redemptions += 1;
    if (liveNow && Math.random() < 0.35) of.orders += 1;
    if (!of.byMoment) of.byMoment = {};
    of.byMoment[m.phase] = (of.byMoment[m.phase] || 0) + (liveNow ? 1 : 0);
  });
  if (S.flash && S.flash.until <= Date.now()) S.flash = null;
  if (!S.flash && Math.random() < 0.01 && m.phase !== 'final') startFlash();
  save();
  refreshLive();
  if (SHEET && SHEET.live) renderSheet();
}

function offerLive(of) {
  const m = S.match;
  if (!of.active) return false;
  switch (of.moment) {
    case 'now': return true;
    case 'prematch': return m.phase === 'arrival' || m.phase === 'prematch';
    case 'halftime': return m.phase === 'halftime';
    case 'goal': return m.lastGoalMinute != null && m.minute - m.lastGoalMinute <= (of.minutes || 5) && m.phase !== 'final';
    case 'minute': return m.minute >= (of.minute || 60) && m.minute < (of.minute || 60) + (of.minutes || 5);
    default: return false;
  }
}

function startFlash() {
  const it = pick(MENU.filter((x) => !S.soldOut.includes(x.id)));
  S.flash = { item: it.id, pct: pick([15, 20, 25, 30]), until: Date.now() + 120000, zone: bestPickup().id };
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
      addAlert('stock', { en: `${item(target).name.en} sold out — suggesting ${item(ALTERNATIVES[target]).name.en}`, ar: `نفد ${item(target).name.ar} — اقتراح ${item(ALTERNATIVES[target]).name.ar}` });
      toast(T(`${item(target).emoji} ${L(item(target).name)} just sold out. Try ${L(item(ALTERNATIVES[target]).name)}.`, `${item(target).emoji} نفد ${L(item(target).name)}. جرّب ${L(item(ALTERNATIVES[target]).name)}.`), 'warn', 5000);
      S.orders.filter((o) => o.status < 2 && o.items.some((i) => i.id === target)).forEach((o) => (o.issue = { kind: 'soldout', item: target }));
      break;
    }
    case 'reset':
      S.match = freshMatch();
      S.closedRoutes = []; S.overloaded = []; S.soldOut = []; S.dismissed = [];
      S.unlocked = S.unlocked.filter((u) => u === 'xstad' || u === 'xpred' || u === 'xgold');
      S.crowd = { A: 40, B: 30, C: 45, P1: 35, P2: 25, P3: 30 };
      S.prediction = null; S.quiz = { done: false, score: 0 };
      S.season.matchday++;
      S.offers.forEach((o) => (o.byMoment = {}));
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
  const who = pick(names);
  if (g.items.filter((i) => i.by === who).length >= 2) { g.sim = g.items.filter((i) => i.by !== g.me).length < names.length * 2; return; }
  const m = pick(MENU.filter((x) => !S.soldOut.includes(x.id)));
  g.items.push({ id: m.id, qty: 1, by: who });
  toast(T(`${who} added ${m.emoji} ${L(m.name)}`, `${who} أضاف ${m.emoji} ${L(m.name)}`), 'info', 1800);
}
