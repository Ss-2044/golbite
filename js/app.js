/* GolBite — app shell, router, actions, Demo Controls and Product Tour. */

/* ---------- routing ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'home';
  const [name, ...rest] = h.split('/');
  return { name, arg: rest.join('/') };
}
function go(path) {
  if (location.hash === '#/' + path) rerender();
  else location.hash = '#/' + path;
}

const FAN_NAV = [
  ['home', 'home', { en: 'Home', ar: 'الرئيسية' }],
  ['orders', 'receipt', { en: 'Orders', ar: 'الطلبات' }],
  ['play', 'play', { en: 'Play', ar: 'العب' }],
  ['shop', 'shirt', { en: 'Club Shop', ar: 'المتجر' }],
  ['profile', 'user', { en: 'Profile', ar: 'حسابي' }],
];
const NAV_OWNER = { home: 'home', map: 'home', menu: 'orders', summary: 'orders', track: 'orders', orders: 'orders', group: 'orders', play: 'play', shop: 'shop', profile: 'profile', settings: 'profile' };

function currentView() {
  const r = route();
  if (!S.user) return { key: 'signin', html: viewSignin };
  if (!S.setup || r.name === 'setup') return { key: 'setup', html: viewSetup };
  if (S.role === 'operator') return { key: 'ops', html: viewOps };
  if (S.role === 'partner') return { key: 'partner', html: viewPartner };
  const map = { home: viewHome, map: viewMap, menu: viewMenu, summary: viewSummary, track: () => viewTrack(r.arg), orders: viewOrders, group: viewGroup, play: viewPlay, shop: viewShop, profile: viewProfile, settings: viewSettings };
  return { key: r.name, html: map[r.name] || viewHome };
}

/* ---------- rendering ---------- */
let lastKey = null;
let lastArg = null;
function applyDocState() {
  const html = document.documentElement;
  html.lang = S.lang;
  html.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
  html.classList.toggle('rm', motionReduced());
  html.classList.toggle('theme-team', S.theme === 'team');
  html.style.setProperty('--team', myTeam().color);
  document.body.classList.toggle('heat', S.match.intensity > 80 && S.role === 'fan');
  document.title = 'GolBite — ' + T('Matchday Companion', 'رفيق المباراة');
}

function rerender() {
  applyDocState();
  const v = currentView();
  const app = document.getElementById('app');
  const focusSig = focusSignature();
  LIVE = {};
  const inApp = S.user && S.setup && v.key !== 'setup';
  const fan = S.role === 'fan';
  const navOwner = NAV_OWNER[route().name] || 'home';
  app.className = inApp ? 'shell' : 'shell bare';
  app.innerHTML = `
    ${inApp ? topbar() : `<div class="mini-top"><img src="assets/logo.png" alt="GolBite" class="logo-img"/>${langBtn()}</div>`}
    ${inApp && fan ? `<nav class="sidenav" aria-label="${T('Main', 'الرئيسية')}">${FAN_NAV.map(([k, ic, l]) => `<a href="#/${k}" class="${navOwner === k ? 'on' : ''}" ${navOwner === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${L(l)}</span>${k === 'orders' && activeOrder() ? '<i class="dot"></i>' : ''}</a>`).join('')}
      <div class="sidenav-foot"><a href="#/settings">${icon('settings')}<span>${T('Settings', 'الإعدادات')}</span></a></div></nav>` : ''}
    <main id="main" tabindex="-1">${v.html()}</main>
    ${inApp && fan ? `<nav class="bottomnav" aria-label="${T('Main', 'الرئيسية')}">${FAN_NAV.map(([k, ic, l]) => `<a href="#/${k}" class="${navOwner === k ? 'on' : ''}" ${navOwner === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${L(l)}</span>${k === 'orders' && activeOrder() ? '<i class="dot"></i>' : ''}</a>`).join('')}</nav>` : ''}
    ${inApp ? `<button class="demo-fab" data-act="openDemo" aria-label="${T('Demo controls', 'أدوات العرض')}" title="${T('Demo controls', 'أدوات العرض')}">${icon('flask')}</button>` : ''}
  `;
  const main = document.getElementById('main');
  if (v.key !== lastKey || route().arg !== lastArg) { window.scrollTo(0, 0); main.classList.add('anim'); lastKey = v.key; lastArg = route().arg; }
  restoreFocus(focusSig);
  renderDemo();
  renderTour();
  if (SHEET) renderSheet();
  document.querySelectorAll('[data-live]').forEach((el) => (el._last = el.innerHTML));
}

function topbar() {
  const ev = currentEvent();
  return `<header class="topbar">
    <a href="#/home" class="brand" aria-label="GolBite ${T('home', 'الرئيسية')}"><img src="assets/logo.png" alt="GolBite" class="logo-img"/></a>
    <div class="top-event"><span class="team-dot" style="--tc:${myTeam().color}"></span><span class="ellipsis">${esc(L(ev.title))}</span>${live('top-clock', () => `<b>${S.match.phase === 'arrival' || S.match.phase === 'prematch' ? phaseLabel() : S.match.phase === 'halftime' || S.match.phase === 'final' ? phaseLabel() : S.match.minute + "'"}</b>`, 'span')}</div>
    <div class="role-switch seg" role="group" aria-label="${T('Switch role', 'تبديل الدور')}">
      ${[['fan', T('Fan', 'مشجع'), 'user'], ['operator', T('Venue', 'المكان'), 'store'], ['partner', T('Partner', 'شريك'), 'megaphone']].map(([k, l, ic]) => `<button class="${S.role === k ? 'on' : ''}" data-act="setRole" data-arg="${k}" aria-pressed="${S.role === k}">${icon(ic)}<span>${l}</span></button>`).join('')}
    </div>
    ${langBtn()}
  </header>`;
}
function langBtn() {
  return `<button class="lang-btn" data-act="setLang" data-arg="${S.lang === 'ar' ? 'en' : 'ar'}" aria-label="${S.lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}" lang="${S.lang === 'ar' ? 'en' : 'ar'}">${icon('globe')}<span>${S.lang === 'ar' ? 'EN' : 'عربي'}</span></button>`;
}

function focusSignature() {
  const a = document.activeElement;
  if (!a || a === document.body) return null;
  return { act: a.dataset?.act, arg: a.dataset?.arg, id: a.id, name: a.name, change: a.dataset?.change, input: a.dataset?.input };
}
function restoreFocus(sig) {
  if (!sig) return;
  let sel = null;
  if (sig.id) sel = '#' + CSS.escape(sig.id);
  else if (sig.act) sel = `[data-act="${sig.act}"]${sig.arg != null ? `[data-arg="${CSS.escape(sig.arg)}"]` : ''}`;
  else if (sig.input) sel = `[data-input="${sig.input}"]`;
  else if (sig.change) sel = `[data-change="${sig.change}"]${sig.arg != null ? `[data-arg="${sig.arg}"]` : ''}`;
  else if (sig.name) sel = `[name="${sig.name}"]`;
  const el = sel && document.querySelector('#app ' + sel);
  if (el && !el.disabled) el.focus({ preventScroll: true });
}

/* ---------- actions ---------- */
function commit() { save(); rerender(); }

const A = {
  go: (a) => { closeSheetSilently(); dismissCelebrate(); go(a); },
  closeSheet: () => closeSheet(),
  dismissCelebrate: () => dismissCelebrate(),
  confirmOk: () => { const cb = SHEET?.onOk; SHEET = null; renderSheet(); cb && cb(); },
  setRole: (r) => { S.role = r; commit(); toast(T(`Viewing as ${{ fan: 'Fan', operator: 'Venue Operator', partner: 'Club / Partner' }[r]}`, `العرض كـ ${{ fan: 'مشجع', operator: 'مشغّل المكان', partner: 'النادي / الشريك' }[r]}`)); },
  roleGo: (a) => { const [r, p] = a.split(':'); S.role = r; save(); go(p); },
  setLang: (l) => { S.lang = l; commit(); },
  quickDemo: () => {
    S.user = { name: 'Sara', handle: 'sara@golbite.demo' };
    S.setup = { eventId: 'e1', teamId: 'hilal', section: 'B', row: 8, seat: 14, arrival: '19:00', gate: 'G2', locationMode: 'manual' };
    awardBadge('first');
    commit(); go('home');
  },
  signOut: () => confirmSheet({ title: T('Sign out?', 'تسجيل الخروج؟'), body: T('Your demo progress stays saved in this browser.', 'يبقى تقدمك محفوظاً في هذا المتصفح.'), ok: T('Sign out', 'خروج'), onOk: () => { S.user = null; SETUP = null; commit(); go('home'); } }),

  // setup
  setupSet: (a) => { const [k, v] = a.split(':'); const d = setupDraft(); d[k] = v; if (k === 'eventId') d.teamId = EVENTS.find((e) => e.id === v).home; rerender(); },
  setupStep: (n) => { const d = setupDraft(); if (+n > 0 && d.step === 1 && !d.section) return; d.step = clamp(d.step + +n, 0, 2); rerender(); document.querySelector('#main h1')?.focus?.(); },
  setupDone: () => {
    const d = setupDraft();
    const changedEvent = S.setup && S.setup.eventId !== d.eventId;
    S.setup = { eventId: d.eventId, teamId: d.teamId, section: d.section, row: +d.row, seat: +d.seat, arrival: d.arrival, gate: d.gate, locationMode: d.locationMode || 'manual' };
    if (changedEvent) S.match = freshMatch();
    SETUP = null;
    awardBadge('first');
    S.cart.dest = null;
    commit(); go('home');
    toast(T(`Welcome! Seat ${seatLabel()} saved.`, `أهلاً! تم حفظ المقعد ${seatLabel()}.`), 'success');
  },
  requestLocation: () => {
    const d = setupDraft();
    const status = document.getElementById('loc-status');
    if (status) status.innerHTML = `<div class="notice info mt-s"><span class="spinner"></span><span>${T('Requesting location…', 'جارٍ طلب الموقع…')}</span></div>`;
    const fail = () => { d.locationMode = 'denied'; rerender(); };
    if (!navigator.geolocation) return fail();
    navigator.geolocation.getCurrentPosition(() => { d.locationMode = 'gps'; d.gate = 'G1'; if (!d.section) d.section = 'A'; rerender(); }, fail, { timeout: 7000 });
  },

  // companion & map
  findSeat: (sec) => { MAPSTATE = { route: true, section: sec || S.setup.section }; closeSheetSilently(); if (route().name === 'map') rerender(); else go('map'); },
  arrivedSeat: () => { if (!S.quests.seat) { S.quests.seat = 1; addPoints(30, T('Found your seat', 'وصلت لمقعدك')); awardBadge('explorer'); } MAPSTATE.route = false; commit(); },
  mapMode: (m) => { S.mapMode = m; commit(); },
  toggleHeat: () => { S.heatmap = !S.heatmap; commit(); },
  mapInfo: (a) => openSheet(() => mapInfoSheet(a), { live: true, label: T('Map details', 'تفاصيل الخريطة') }),
  choosePickup: (id) => {
    S.cart.type = 'pickup'; S.cart.dest = id;
    const o = activeOrder();
    if (o && o.type === 'pickup' && o.status < 2 && o.dest !== id) { o.dest = id; toast(T(`Order ${o.id} moved to ${L(pickup(id).name)}`, `تم نقل الطلب ${o.id} إلى ${L(pickup(id).name)}`), 'success'); }
    else toast(T(`Pickup set to ${L(pickup(id).name)}`, `تم اختيار ${L(pickup(id).name)} للاستلام`), 'success');
    closeSheetSilently(); commit();
  },
  setGate: (id) => { S.setup.gate = id; closeSheetSilently(); commit(); toast(T(`Entry gate set to ${id}`, `تم تحديد البوابة ${id}`)); },
  dismissMoment: (id) => { S.dismissed.push(id); commit(); },
  preorderHalftime: () => { S.cart.schedule = 'halftime'; save(); go('menu'); toast(T('Your order will be ready at halftime.', 'سيكون طلبك جاهزاً في الاستراحة.')); },
  redeemOffer: (id) => {
    const of = S.offers.find((o) => o.id === id);
    if (!of) return;
    of.redemptions++;
    const it = of.item || 'd2';
    if (!S.vouchers.some((v) => v.offer === id)) S.vouchers.unshift({ id: uid('v'), offer: id, item: it, pct: of.discount || 25, label: { en: `${L({ en: of.title.en || of.title })} (−${of.discount}%)`, ar: `${of.title.ar || of.title} (−${of.discount}%)` } });
    S.cart.items[it] = (S.cart.items[it] || 0) + 1;
    commit(); toast(T('Offer added to your order.', 'تمت إضافة العرض لطلبك.'), 'success');
  },

  // menu & cart
  cartType: (t) => { S.cart.type = t; S.cart.dest = null; ensureCartDest(); commit(); },
  cartDest: (d) => { S.cart.dest = d; commit(); },
  cartSchedule: (s) => { S.cart.schedule = s; commit(); },
  addItem: (id) => {
    if (S.soldOut.includes(id)) { toast(T('Sold out — try the suggested alternative.', 'نفد — جرّب البديل المقترح.'), 'warn'); return; }
    S.cart.items[id] = (S.cart.items[id] || 0) + 1; commit();
    if (route().name !== 'menu' && route().name !== 'summary' && !SHEET) toast(`${item(id).emoji} ${L(item(id).name)} ${T('added', 'أضيف')} · <a href="#/summary">${T('Review', 'مراجعة')}</a>`, 'success');
  },
  removeItem: (id) => { if (!S.cart.items[id]) return; S.cart.items[id]--; if (!S.cart.items[id]) delete S.cart.items[id]; commit(); },
  comboAdd: () => { S.cart.combo = (S.cart.combo || 0) + 1; commit(); },
  comboRemove: () => { S.cart.combo = Math.max(0, (S.cart.combo || 0) - 1); commit(); },
  menuCat: (c) => { S.menuCat = c; commit(); },
  menuDiet: (d) => { S.menuDiet = S.menuDiet.includes(d) ? S.menuDiet.filter((x) => x !== d) : [...S.menuDiet, d]; commit(); },
  clearDiet: () => { S.menuDiet = []; commit(); },
  toggleFav: (id) => { S.favorites = S.favorites.includes(id) ? S.favorites.filter((x) => x !== id) : [...S.favorites, id]; commit(); },
  itemInfo: (id) => openSheet(() => itemInfoSheet(id), { label: L(item(id).name) }),
  reorder: (id) => {
    const o = S.orders.find((x) => x.id === id);
    S.cart.items = {}; S.cart.combo = 0;
    o.items.forEach((i) => { if (i.combo) return; const use = S.soldOut.includes(i.id) ? ALTERNATIVES[i.id] : i.id; S.cart.items[use] = (S.cart.items[use] || 0) + i.qty; });
    const comboQ = o.items.find((i) => i.combo)?.qty; if (comboQ) S.cart.combo = comboQ;
    S.cart.type = o.type; S.cart.dest = o.dest; S.cart.schedule = 'now';
    save(); go('summary');
  },
  swapItem: (id) => { const alt = ALTERNATIVES[id]; S.cart.items[alt] = (S.cart.items[alt] || 0) + S.cart.items[id]; delete S.cart.items[id]; commit(); },
  placeOrder: () => {
    ensureCartDest();
    const items = cartItemsList();
    if (!items.length) { toast(T('Your order is empty.', 'طلبك فارغ.'), 'error'); return; }
    const btn = document.querySelector('[data-act="placeOrder"]');
    if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> ${T('Sending to kitchens…', 'جارٍ الإرسال للمطابخ…')}`; }
    setTimeout(() => {
      const fee = S.cart.type === 'delivery' ? 5 : 0;
      const o = placeOrder({ items, type: S.cart.type, dest: S.cart.dest, schedule: S.cart.schedule });
      o.total += fee;
      S.cart = { type: S.cart.type, items: {}, dest: S.cart.dest, schedule: 'now', combo: 0 };
      save(); go('track/' + o.id);
      celebrate({ emoji: '✅', title: T('Order confirmed!', 'تم تأكيد الطلب!'), sub: T(`${o.id} · routed to ${o.tasks.length} kitchen(s)`, `${o.id} · موزّع على ${o.tasks.length} مطبخ`), kind: 'confetti', ms: 2200 });
    }, 700);
  },

  // tracking & help
  collected: (id) => { const o = S.orders.find((x) => x.id === id); completeOrder(o); commit(); },
  movePickup: (id) => {
    const o = S.orders.find((x) => x.id === id) || S.opsOrders.find((x) => x.id === id);
    const alt = bestPickup(o.dest);
    o.dest = alt.id;
    addAlert('route', { en: `${o.id} moved to ${alt.name.en}`, ar: `نقل ${o.id} إلى ${alt.name.ar}` });
    toast(T(`Moved to ${L(alt.name)} — shorter wait.`, `تم النقل إلى ${L(alt.name)} — انتظار أقل.`), 'success');
    commit();
  },
  orderHelp: (id) => openSheet(() => orderHelpSheet(id), { label: T('Order help', 'مساعدة الطلب') }),
  helpResolve: (a) => {
    const [id, kind] = a.split(':');
    const o = S.orders.find((x) => x.id === id);
    addAlert('help', { en: `Fan reported ${kind} on ${id}`, ar: `بلاغ من مشجع (${kind}) على ${id}` });
    if (kind === 'delayed') { o.tasks.forEach((t) => (t.need = Math.max(1, t.need - 4))); addPoints(50, T('Sorry for the wait', 'نعتذر عن التأخير')); }
    else {
      const it = o.items[0];
      placeOrderSilent({ items: [{ id: it.id, qty: 1, by: 'me' }], type: o.type === 'delivery' ? 'delivery' : 'pickup', dest: o.dest, priority: true });
    }
    closeSheetSilently();
    openSheet(() => `<div class="center"><div class="celeb-emoji">🤝</div><h2 class="sheet-title">${T('We are on it', 'نعمل على ذلك')}</h2><p class="muted">${kind === 'delayed' ? T('Your order has been prioritised and 50 points were added.', 'تمت أولوية طلبك وأضيفت 50 نقطة.') : T('A free replacement is being prepared with priority. No charge.', 'يتم تحضير بديل مجاني بأولوية. بدون تكلفة.')}</p><button class="btn btn-primary w-full" data-act="closeSheet">${T('OK', 'حسناً')}</button></div>`);
    commit();
  },
  acceptAlt: (id) => {
    const o = S.orders.find((x) => x.id === id);
    const bad = o.issue.item, alt = ALTERNATIVES[bad];
    o.items.forEach((i) => { if (i.id === bad) { i.id = alt; i.price = i.combo ? i.price : item(alt).price; } });
    o.tasks = routeItems(o.items, destAngle(o));
    o.issue = null;
    toast(T(`Swapped for ${L(item(alt).name)}.`, `تم الاستبدال بـ ${L(item(alt).name)}.`), 'success');
    commit();
  },

  // group
  groupCreate: () => {
    const me = S.user.name;
    S.group = { code: 'GB-' + uid().slice(0, 4), leader: me, me, members: [me], items: [], type: 'pickup', dest: bestPickup().id, sim: false };
    commit(); toast(T('Group created — share the code.', 'تم إنشاء المجموعة — شارك الرمز.'), 'success');
  },
  groupInvite: () => {
    const g = S.group;
    GROUP_FRIENDS.forEach((f) => { if (!g.members.includes(f) && g.members.length < 4) g.members.push(f); });
    g.sim = true; commit(); toast(T('Friends joined with your code.', 'انضم الأصدقاء برمزك.'));
  },
  addGroup: (id) => { if (S.soldOut.includes(id)) return; const g = S.group; const ex = g.items.find((i) => i.id === id && i.by === g.me); ex ? ex.qty++ : g.items.push({ id, qty: 1, by: g.me }); commit(); },
  removeGroup: (id) => { const g = S.group; const ex = g.items.find((i) => i.id === id && i.by === g.me); if (!ex) return; ex.qty--; if (!ex.qty) g.items = g.items.filter((i) => i !== ex); commit(); },
  groupType: (t) => { S.group.type = t; S.group.dest = t === 'delivery' ? S.setup.section : bestPickup().id; commit(); },
  groupDest: (d) => { S.group.dest = d; commit(); },
  groupConfirm: () => openSheet(groupConfirmSheet, { label: T('Confirm group order', 'تأكيد الطلب الجماعي') }),
  groupLeaderConfirm: () => A.groupPlace(),
  groupPlace: () => {
    const g = S.group;
    const o = placeOrder({ items: g.items.map((i) => ({ ...i })), type: g.type, dest: g.dest, group: g.code });
    S.group = null; closeSheetSilently(); save(); go('track/' + o.id);
    celebrate({ emoji: '👥', title: T('Group order placed!', 'تم تنفيذ الطلب الجماعي!'), sub: T('One handoff for the whole group.', 'تسليم واحد للمجموعة كاملة.'), ms: 2500 });
  },
  groupLeave: () => confirmSheet({ title: T('Leave this group?', 'مغادرة المجموعة؟'), body: T('Items you added will be removed.', 'ستُزال الأصناف التي أضفتها.'), ok: T('Leave', 'مغادرة'), danger: true, onOk: () => { S.group = null; commit(); } }),
  copyCode: () => { navigator.clipboard?.writeText(S.group.code).catch(() => {}); toast(T('Join code copied', 'تم نسخ الرمز'), 'success'); },

  // play
  makeNoise: () => { S.match.intensity = clamp(S.match.intensity + 12, 0, 100); S.rivalry[S.setup.section] += 15; refreshLive(); save(); },
  cheer: () => { S.rivalry[S.setup.section] += 25; addPoints(5); refreshLive(); save(); },
  predict: (a) => { const [k, v] = a.split(':'); S.prediction = { ...(S.prediction || {}), [k]: v }; commit(); },
  lockPrediction: () => { S.prediction.locked = true; addPoints(10, T('Prediction locked', 'تم تثبيت التوقع')); commit(); },
  startQuiz: () => { QUIZSTATE = { i: 0, score: 0, picked: null }; openSheet(quizSheet, { label: T('Halftime Quiz', 'مسابقة الاستراحة'), onClose: () => rerender() }); },
  quizAnswer: (i) => { QUIZSTATE.picked = +i; if (+i === QUIZ[QUIZSTATE.i].c) QUIZSTATE.score++; renderSheet(); },
  quizNext: () => {
    QUIZSTATE.i++; QUIZSTATE.picked = null;
    if (QUIZSTATE.i >= QUIZ.length) { S.quiz = { done: true, score: QUIZSTATE.score }; addPoints(QUIZSTATE.score * 100, T('Halftime Quiz', 'مسابقة الاستراحة')); if (QUIZSTATE.score === QUIZ.length) awardBadge('quiz'); save(); }
    renderSheet(true);
  },
  miniTap: () => {
    const now = Date.now();
    if (MINI.done) return;
    if (MINI.until < now) { MINI.taps = 0; MINI.until = now + 6000; setTimeout(() => { if (!MINI.done) { MINI.taps = 0; refreshLive(); } }, 6100); }
    MINI.taps++;
    if (MINI.taps >= 12) { MINI.done = true; addPoints(80, T('Goal Unlock', 'افتح الهدف')); celebrate({ emoji: '🔓', title: T('Goal unlocked!', 'تم فتح الهدف!'), sub: '+80 ' + T('points', 'نقطة'), ms: 2200 }); }
    refreshLive();
    document.querySelector('[data-act="miniTap"]')?.focus();
  },

  // shop
  merchInfo: (id) => openSheet(() => merchInfoSheet(id), { label: L(merch(id).name) }),
  lockedInfo: (id) => toast(`🔒 ${L(merch(id).name)} — ${specialState(merch(id))}`, 'info'),
  pickSize: (s) => { S.size = s; renderSheet(); },
  bagAdd: (id) => { S.bag[id] = (S.bag[id] || 0) + 1; save(); if (SHEET) renderSheet(); rerender(); if (!SHEET) toast(`${merch(id).emoji} ${T('Added to bag', 'أضيف للحقيبة')}`, 'success', 1800); },
  bagRemove: (id) => { S.bag[id]--; if (!S.bag[id]) delete S.bag[id]; save(); renderSheet(); rerender(); },
  openBag: () => openSheet(bagSheet, { label: T('Bag', 'الحقيبة') }),
  bagMode: (m) => { S.bagMode = m; renderSheet(); },
  checkout: () => {
    const entries = Object.entries(S.bag);
    const sub = entries.reduce((s, [id, q]) => s + merch(id).price * q, 0);
    entries.forEach(([id]) => {
      if (!S.trophies.some((t) => t.id === id)) S.trophies.push({ id, at: Date.now() });
      S.purchases.push({ id, at: Date.now() });
      S.season.history.unshift({ kind: 'merch', id, md: S.season.matchday, at: Date.now() });
      if (['m3', 'x77', 'xstad'].includes(id)) S.quests.scarf = 1;
    });
    S.bag = {};
    S.stadiumUnlock = clamp(S.stadiumUnlock + 5, 0, 100);
    closeSheetSilently();
    addPoints(Math.round(sub / 2), T('Club Shop purchase', 'شراء من المتجر'));
    if (S.trophies.length >= 3) awardBadge('collector');
    commit();
    celebrate({ emoji: '🛍️', title: T('Purchase complete!', 'تم الشراء!'), sub: T('Digital twin added to your Trophy Cabinet.', 'أضيفت النسخة الرقمية إلى خزانة جوائزك.'), cta: { act: 'go', arg: 'profile', label: T('View cabinet', 'عرض الخزانة') }, ms: 3500 });
  },
  mystery: () => {
    const box = document.querySelector('.mystery');
    box?.classList.add('shake');
    setTimeout(() => {
      MYSTERY = pick(MERCH.filter((m) => !m.special && m.price >= 49)).id;
      if (!S.trophies.some((t) => t.id === MYSTERY)) S.trophies.push({ id: MYSTERY, at: Date.now() });
      if (MYSTERY === 'm3') S.quests.scarf = 1;
      commit(); toast(`🎁 ${T('Mystery Box', 'الصندوق الغامض')}: ${merch(MYSTERY).emoji} ${L(merch(MYSTERY).name)}`, 'success');
    }, motionReduced() ? 50 : 900);
  },
  lotto: () => {
    if (S.points < 100) return;
    S.points -= 100;
    LOTTO = { spinning: true };
    rerender();
    setTimeout(() => {
      const win = Math.random() < 0.45;
      const idx = Math.floor(Math.random() * 5);
      LOTTO = { spinning: false, idx: win ? idx : -1 };
      if (win) { const id = ['m3', 'm4', 'm1', 'm6', 'm5'][idx]; if (!S.trophies.some((t) => t.id === id)) S.trophies.push({ id, at: Date.now() }); if (id === 'm3') S.quests.scarf = 1; celebrate({ emoji: merch(id).emoji, title: T('You won!', 'فزت!'), sub: L(merch(id).name), ms: 2600 }); }
      else { S.points += 20; toast(T('No win this time — 20 points back.', 'لم تفز هذه المرة — استرجعت 20 نقطة.')); }
      commit();
    }, motionReduced() ? 100 : 1600);
  },
  luckySeat: () => {
    S.luckySeat = Math.random() < 0.3 ? seatLabel() : `${pick(['A', 'B', 'C'])}-${1 + Math.floor(Math.random() * 20)}-${1 + Math.floor(Math.random() * 30)}`;
    if (S.luckySeat === seatLabel()) celebrate({ emoji: '💺', title: T('Your seat won!', 'مقعدك فاز!'), sub: T('Signed jersey — collect at the Club Store.', 'قميص موقّع — استلمه من متجر النادي.'), ms: 3000 });
    commit();
  },
  bundleAdd: (id) => {
    const b = BUNDLES.find((x) => x.id === id);
    b.items.forEach((x) => { if (x === 'combo') S.cart.combo = (S.cart.combo || 0) + 1; else if (merch(x)) S.bag[x] = (S.bag[x] || 0) + 1; else S.cart.items[x] = (S.cart.items[x] || 0) + 1; });
    commit(); toast(T('Bundle added: merch to your bag, food to your order.', 'أضيفت الحزمة: المنتج للحقيبة والطعام للطلب.'), 'success');
  },

  // profile & settings
  toggleInterest: (k) => { S.interests = S.interests.includes(k) ? S.interests.filter((x) => x !== k) : [...S.interests, k]; commit(); },
  setTheme: (t) => { S.theme = t; commit(); },
  switchEvent: (id) => { S.setup.eventId = id; S.setup.teamId = EVENTS.find((e) => e.id === id).home; S.match = freshMatch(); S.dismissed = []; commit(); toast(T('Event switched', 'تم تغيير الحدث') + ': ' + L(currentEvent().title)); },
  setSpeed: (s) => { S.simSpeed = +s; startSim(); commit(); },
  startTour: () => { closeSheetSilently(); DEMO_OPEN = false; S.tour = 0; runTourStep(); },
  openDemo: () => { DEMO_OPEN = !DEMO_OPEN; renderDemo(); if (DEMO_OPEN) setTimeout(() => document.querySelector('.demo-panel button')?.focus(), 30); },
  askResetEvent: () => confirmSheet({ title: T('Reset the event?', 'إعادة ضبط الحدث؟'), body: T('Match clock, crowds, closures and sold-out items go back to the start. Orders and rewards are kept.', 'تعود الساعة والكثافة والإغلاقات والأصناف النافدة للبداية. تبقى الطلبات والمكافآت.'), ok: T('Reset event', 'إعادة الحدث'), onOk: () => trigger('reset') }),
  askResetAll: () => confirmSheet({ title: T('Reset all demo data?', 'مسح كل البيانات؟'), body: T('This permanently clears orders, points, badges, collectibles and preferences in this browser.', 'سيتم مسح الطلبات والنقاط والأوسمة والمقتنيات والتفضيلات نهائياً من هذا المتصفح.'), ok: T('Reset everything', 'مسح الكل'), danger: true, onOk: () => { resetState(); SETUP = null; dismissCelebrate(); DEMO_OPEN = false; MINI = { taps: 0, until: 0, done: false }; startSim(); go('home'); rerender(); toast(T('Demo data cleared.', 'تم مسح البيانات.'), 'success'); } }),

  // ops
  opsTab: (t) => { OPS.tab = t; rerender(); },
  opsGroup: (g) => { OPS.group = g; rerender(); },
  opsAdvance: (id) => {
    const o = S.orders.find((x) => x.id === id) || S.opsOrders.find((x) => x.id === id);
    const st = Math.min(...o.tasks.map((t) => t.st));
    if (st >= 2) { completeOrder(o); }
    else { o.tasks.forEach((t) => { if (t.st === st) { t.st++; t.t = t.st === 1 ? 3 : 3 + t.need; } }); const prev = o.status; o.status = Math.min(...o.tasks.map((t) => t.st)) >= 2 ? 2 : 1; if (!o.synthetic && prev !== o.status) onOrderStatus(o); }
    commit();
  },
  opsReroute: (a) => {
    const [oid, vid] = a.split(':');
    const o = S.orders.find((x) => x.id === oid);
    const t = o.tasks.find((x) => x.vid === vid);
    const cat = item(t.items[0].id).cat;
    const alt = VENDORS.filter((v) => v.id !== vid && v.cats.includes(cat)).sort((a, b) => S.vendorLoad[a.id] - S.vendorLoad[b.id])[0];
    if (!alt) { toast(T('No other vendor can make this item.', 'لا يوجد بائع آخر لهذا الصنف.'), 'warn'); return; }
    const ex = o.tasks.find((x) => x.vid === alt.id);
    if (ex) { ex.items.push(...t.items); o.tasks = o.tasks.filter((x) => x !== t); }
    else { t.vid = alt.id; t.reason = 'load'; t.t = 0; t.st = 0; }
    addAlert('route', { en: `${oid}: rerouted from ${vendor(vid).name.en} to ${alt.name.en}`, ar: `${oid}: إعادة توجيه إلى ${alt.name.ar}` });
    toast(T(`Rerouted to ${L(alt.name)}`, `أعيد التوجيه إلى ${L(alt.name)}`), 'success');
    commit();
  },
  opsUnavailable: (id) => trigger('soldout', id),
  opsRunner: (id) => { const o = S.orders.find((x) => x.id === id); o.runner = pick(RUNNERS.filter((r) => r !== o.runner)); addAlert('order', { en: `${id}: runner reassigned to ${o.runner}`, ar: `${id}: تعيين المندوب ${o.runner}` }); commit(); },
  opsToggleStock: (id) => { if (S.soldOut.includes(id)) { S.soldOut = S.soldOut.filter((x) => x !== id); toast(T('Restocked', 'تمت إعادة التوفير'), 'success'); commit(); } else trigger('soldout', id); },

  // partner
  partnerTab: (t) => { PARTNER_TAB = t; rerender(); },
  draftImage: (e) => { draftOffer().image = e; rerender(); },
  draftMoment: (m) => { draftOffer().moment = m; rerender(); },
  draftSection: (k) => { const d = draftOffer(); d.sections = d.sections.includes(k) ? d.sections.filter((x) => x !== k) : [...d.sections, k]; if (!d.sections.length) d.sections = [k]; rerender(); },
  draftTone: (t) => { draftOffer().tone = t; rerender(); },
  previewOffer: (id) => {
    const of = S.offers.find((o) => o.id === id);
    openSheet(() => `<h2 class="sheet-title">${T('Fan preview', 'معاينة المشجع')}</h2><div class="phone"><div class="phone-in"><small class="muted">${sunMark(14, 'brand-sun')} ${T('Matchday Companion', 'رفيق المباراة')}</small>${offerCard(of, true)}</div></div>
      <p class="muted small mt">${offerLive(of) ? T('Live now for eligible sections.', 'مباشر الآن للأقسام المؤهلة.') : T('Will appear at:', 'سيظهر عند:') + ' ' + L(OFFER_MOMENTS.find((m) => m.id === of.moment).name)}</p>
      <button class="btn btn-primary w-full" data-act="roleGo" data-arg="fan:home">${T('Open fan view', 'افتح واجهة المشجع')}</button>`, { label: T('Fan preview', 'معاينة المشجع') });
  },

  trigger: (a) => { const [k, v] = a.split(':'); trigger(k, v); },
};

function placeOrderSilent(opts) {
  const id = 'GB-' + Math.floor(5000 + Math.random() * 4000);
  const o = { id, items: opts.items, type: opts.type, dest: opts.dest, schedule: 'now', status: 0, created: Date.now(), handoff: 0, tasks: routeItems(opts.items, opts.type === 'delivery' ? SECTIONS[opts.dest].angle : pickup(opts.dest).angle), total: 0, runner: opts.type === 'delivery' ? pick(RUNNERS) : null, code: String(Math.floor(100 + Math.random() * 900)), eventId: currentEvent().id, replacement: true };
  o.tasks.forEach((t) => (t.need = 1));
  S.orders.unshift(o);
}

function closeSheetSilently() { SHEET = null; renderSheet(); }

const INPUTS = {
  draftTitle: (v) => { draftOffer().title = v; const pv = document.getElementById('offer-preview'); if (pv) pv.innerHTML = offerCard({ ...draftOffer(), title: { en: v || T('Your offer title', 'عنوان عرضك'), ar: v || 'عنوان عرضك' } }, true); },
  draftDiscount: (v) => (draftOffer().discount = clamp(+v || 0, 0, 100)),
  draftMinute: (v) => (draftOffer().minute = clamp(+v || 1, 1, 90)),
  draftMinutes: (v) => { draftOffer().minutes = +v; const o = document.getElementById('minutes-out'); if (o) o.textContent = `${v} ${T('min', 'د')}`; },
};
const CHANGES = {
  setupRow: (v) => { setupDraft().row = +v; rerender(); },
  setupSeat: (v) => { setupDraft().seat = +v; rerender(); },
  draftSponsor: (v) => (draftOffer().sponsor = v),
  toggleVis: (v, el) => { S.visibility[el.dataset.arg] = el.checked; commit(); },
  toggleMotion: (v, el) => { S.reducedMotion = el.checked; commit(); },
  toggleClock: (v, el) => { S.match.clock = el.checked; commit(); },
};
const SUBMITS = {
  signin: (form) => {
    const v = form.handle.value.trim();
    if (!v) { document.getElementById('signin-error').hidden = false; form.handle.setAttribute('aria-invalid', 'true'); form.handle.focus(); return; }
    const name = v.includes('@') ? v.split('@')[0] : /^\+?\d[\d\s]+$/.test(v) ? T('Fan', 'مشجع') : v;
    S.user = { name: name.charAt(0).toUpperCase() + name.slice(1), handle: v };
    commit(); go('setup');
  },
  groupJoin: (form) => {
    const code = (form.code.value || '').trim().toUpperCase();
    if (code.length < 4) { toast(T('Enter the join code you received.', 'أدخل رمز الانضمام.'), 'error'); return; }
    const me = S.user.name;
    S.group = { code: code.startsWith('GB-') ? code : 'GB-' + code, leader: 'Faisal', me, members: ['Faisal', 'Noura', me], items: [{ id: 'b3', qty: 1, by: 'Faisal' }, { id: 'd4', qty: 2, by: 'Noura' }], type: 'pickup', dest: bestPickup().id, sim: true };
    commit(); toast(T("You joined Faisal's group.", 'انضممت لمجموعة فيصل.'), 'success');
  },
  publishOffer: (form) => {
    const d = draftOffer();
    if (!d.title.trim()) { document.getElementById('offer-error').hidden = false; form.title.focus(); return; }
    const of = { id: uid('of'), title: { en: d.title, ar: d.title }, sponsor: d.sponsor, image: d.image, moment: d.moment, minute: d.minute, sections: [...d.sections], minutes: d.minutes, discount: d.discount, item: { '🥤': 'd2', '🍔': 'b1', '🍟': 'f1', '☕': 'd3', '🍿': 's2' }[d.image] || 'd2', active: true, views: 0, redemptions: 0, orders: 0, tone: d.tone, endsAt: Date.now() + d.minutes * 60000, byMoment: {} };
    S.offers.unshift(of);
    DRAFT = null;
    commit();
    openSheet(() => `<div class="center"><div class="celeb-emoji">📣</div><h2 class="sheet-title">${T('Offer scheduled', 'تمت جدولة العرض')}</h2>
      <p class="muted">${offerLive(of) ? T('It is live now for eligible fans.', 'العرض مباشر الآن للمشجعين المؤهلين.') : T('It will appear in the Matchday Companion at:', 'سيظهر في رفيق المباراة عند:') + ' ' + L(OFFER_MOMENTS.find((m) => m.id === of.moment).name)}</p>
      ${offerCard(of, true)}
      <div class="row gap mt"><button class="btn btn-primary grow" data-act="roleGo" data-arg="fan:home">${T('Preview as fan', 'معاينة كمشجع')}</button>${!offerLive(of) ? `<button class="btn btn-ghost grow" data-act="triggerOfferMoment" data-arg="${of.moment}">${T('Simulate moment', 'محاكاة اللحظة')}</button>` : ''}</div></div>`);
  },
};
A.triggerOfferMoment = (m) => {
  closeSheetSilently();
  if (m === 'goal') trigger('goal');
  else if (m === 'halftime') trigger('halftime');
  else if (m === 'prematch') trigger('phase', 'prematch');
  else if (m === 'minute') { const of = S.offers[0]; setPhase(of.minute > 45 ? 'second' : 'kickoff'); S.match.minute = of.minute; commit(); }
};

/* ---------- Demo Controls ---------- */
let DEMO_OPEN = false;
function renderDemo() {
  const root = document.getElementById('demo-root');
  if (!DEMO_OPEN || !S.user || !S.setup) { root.innerHTML = ''; return; }
  const c = isConcert();
  const btn = (act, arg, emoji, label) => `<button class="demo-btn" data-act="${act}" data-arg="${arg}"><span>${emoji}</span>${label}</button>`;
  root.innerHTML = `<div class="demo-panel" role="dialog" aria-label="${T('Demo controls', 'أدوات العرض')}">
    <div class="row between"><b>${icon('flask')} ${T('Demo Controls', 'أدوات العرض')}</b><button class="icon-btn sm" data-act="openDemo" aria-label="${T('Close', 'إغلاق')}">${icon('x')}</button></div>
    <small class="muted">${phaseLabel()} · ${S.match.minute}' · ${S.match.home}-${S.match.away}</small>
    <div class="demo-grid">
      ${btn('trigger', 'advance', '⏭️', T('Advance timeline', 'تقديم المخطط'))}
      ${btn('trigger', 'goal', c ? '🎤' : '⚽', c ? T('Hit song', 'أغنية مميزة') : T('Home goal', 'هدف للمضيف'))}
      ${c ? '' : btn('trigger', 'goal:away', '🥅', T('Away goal', 'هدف للضيف'))}
      ${btn('trigger', 'halftime', '⏱️', c ? T('Intermission', 'الاستراحة') : T('Halftime', 'الاستراحة'))}
      ${btn('trigger', 'redcard', '🟥', c ? T('Surprise guest', 'ضيف مفاجئ') : T('Red card', 'بطاقة حمراء'))}
      ${btn('trigger', 'win', '🏆', c ? T('Encore finale', 'الختام') : T('Home win', 'فوز المضيف'))}
      ${btn('trigger', 'drop77', '🔥', T("77' merch drop", 'إصدار الدقيقة 77'))}
      ${btn('trigger', 'crowd:up', '📈', T('Crowd surge', 'ارتفاع الكثافة'))}
      ${btn('trigger', 'crowd:down', '📉', T('Crowd eases', 'انخفاض الكثافة'))}
      ${btn('trigger', 'closure', '🚧', S.closedRoutes.length ? T('Reopen route', 'فتح الممر') : T('Route closure', 'إغلاق ممر'))}
      ${btn('trigger', 'overload', '⚠️', T('Overload pickup', 'ازدحام الاستلام'))}
      ${btn('trigger', 'soldout', '📦', T('Item sold out', 'نفاد صنف'))}
      ${btn('askResetEvent', '', '🔄', T('Event reset', 'إعادة الحدث'))}
      ${btn('startTour', '', '✨', T('Product tour', 'جولة المنتج'))}
    </div>
    <div class="row gap wrap mt-s">${EVENTS.map((e) => `<button class="chip ${currentEvent().id === e.id ? 'on' : ''}" data-act="switchEvent" data-arg="${e.id}">${e.type === 'concert' ? '🎤' : '⚽'} ${L(e.title)}</button>`).join('')}</div>
    <div class="row gap wrap mt-s"><span class="muted small">${T('Speed', 'السرعة')}</span>${[0.5, 1, 2, 4].map((s) => `<button class="chip ${S.simSpeed === s ? 'on' : ''}" data-act="setSpeed" data-arg="${s}">${s}×</button>`).join('')}
      <button class="chip ${S.theme === 'team' ? 'on' : ''}" data-act="setTheme" data-arg="${S.theme === 'team' ? 'brand' : 'team'}">🎨 ${T('Team colours', 'ألوان الفريق')}</button></div>
  </div>`;
}

/* ---------- Product Tour ---------- */
const TOUR = [
  { t: { en: 'Fan picks event, section & seat', ar: 'المشجع يختار الحدث والقسم والمقعد' }, b: { en: 'Setup personalises everything: route, pickup points, offers and the timeline.', ar: 'الإعداد يخصص كل شيء: المسار ونقاط الاستلام والعروض والمخطط الزمني.' },
    run: () => { S.role = 'fan'; SETUP = null; go('setup'); } },
  { t: { en: 'Matchday Companion guides the next action', ar: 'رفيق المباراة يرشد للخطوة التالية' }, b: { en: 'Home shows the event, seat, crowd, waits and one or two useful actions for this moment.', ar: 'الرئيسية تعرض الحدث والمقعد والكثافة والانتظار وإجراءً أو اثنين مفيدين لهذه اللحظة.' },
    run: () => { S.role = 'fan'; go('home'); } },
  { t: { en: 'Fan places a pickup or delivery order', ar: 'المشجع يطلب استلاماً أو توصيلاً' }, b: { en: 'We added a burger, fries and a drink. Review and confirm.', ar: 'أضفنا برجر وبطاطس ومشروب. راجع وأكّد.' },
    run: () => { S.role = 'fan'; S.cart.items = { b1: 1, f2: 1, d4: 1 }; S.cart.type = 'pickup'; S.cart.dest = bestPickup().id; save(); go('summary'); } },
  { t: { en: 'Venue Operator receives and prepares it', ar: 'مشغّل المكان يستلم ويحضّر' }, b: { en: 'The order is split across vendors by stock, prep time, location and workload — one handoff for the fan.', ar: 'يتوزع الطلب على البائعين حسب المخزون ووقت التحضير والموقع والضغط — تسليم واحد للمشجع.' },
    run: () => { if (!activeOrder()) { const items = [{ id: 'b1', qty: 1, by: 'me' }, { id: 'f2', qty: 1, by: 'me' }, { id: 'd4', qty: 1, by: 'me' }]; placeOrder({ items, type: 'pickup', dest: bestPickup().id }); S.cart.items = {}; } S.role = 'operator'; OPS.tab = 'network'; save(); go('home'); } },
  { t: { en: 'A live event changes the experience', ar: 'حدث مباشر يغيّر التجربة' }, b: { en: 'A goal triggers celebrations, a goal-time offer, crowd surges and updated estimates.', ar: 'الهدف يطلق الاحتفال وعرض الهدف وارتفاع الكثافة وتحديث التقديرات.' },
    run: () => { S.role = 'fan'; go('home'); setTimeout(() => trigger('goal'), 400); } },
  { t: { en: 'Fan earns rewards and explores Club Shop', ar: 'المشجع يكسب المكافآت ويتصفح المتجر' }, b: { en: 'Points, badges and drops connect food, play and merchandise.', ar: 'النقاط والأوسمة والإصدارات تربط الطعام واللعب والمنتجات.' },
    run: () => { S.role = 'fan'; go('shop'); } },
  { t: { en: 'Club / Partner sees offers and engagement', ar: 'النادي/الشريك يرى العروض والتفاعل' }, b: { en: 'Create a matchday offer, preview it in the Companion and track simulated results.', ar: 'أنشئ عرضاً، عاينه في رفيق المباراة وتابع النتائج المحاكاة.' },
    run: () => { S.role = 'partner'; PARTNER_TAB = 'results'; save(); go('home'); } },
];
function runTourStep() {
  const step = TOUR[S.tour];
  if (!step) { S.tour = null; renderTour(); return; }
  if (!S.user) A.quickDemo();
  step.run();
  save();
  rerender();
}
function renderTour() {
  const root = document.getElementById('tour-root');
  if (S.tour == null) { root.innerHTML = ''; return; }
  const step = TOUR[S.tour];
  root.innerHTML = `<div class="tour" role="dialog" aria-label="${T('Product tour', 'جولة المنتج')}">
    <div class="row between"><small class="eyebrow">${T('Product tour', 'جولة المنتج')} · ${S.tour + 1}/${TOUR.length}</small><button class="icon-btn sm" data-act="tourExit" aria-label="${T('Exit tour', 'إنهاء الجولة')}">${icon('x')}</button></div>
    <b>${L(step.t)}</b><p>${L(step.b)}</p>
    <div class="tour-dots">${TOUR.map((_, i) => `<i class="${i === S.tour ? 'on' : i < S.tour ? 'done' : ''}"></i>`).join('')}</div>
    <div class="row gap"><button class="btn btn-ghost btn-sm" data-act="tourPrev" ${S.tour ? '' : 'disabled'}>${T('Back', 'رجوع')}</button><button class="btn btn-primary btn-sm grow" data-act="tourNext">${S.tour === TOUR.length - 1 ? T('Finish', 'إنهاء') : T('Next', 'التالي')}</button></div>
  </div>`;
}
A.tourNext = () => { S.tour++; if (S.tour >= TOUR.length) { S.tour = null; S.role = 'fan'; go('home'); toast(T('Tour complete — explore freely!', 'انتهت الجولة — استكشف بحرية!'), 'success'); rerender(); } else runTourStep(); };
A.tourPrev = () => { S.tour = Math.max(0, S.tour - 1); runTourStep(); };
A.tourExit = () => { S.tour = null; renderTour(); };

/* ---------- global event delegation ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  fn(el.dataset.arg ?? '', el, e);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (SHEET) closeSheet();
    else if (!document.getElementById('celebrate-root').hidden) dismissCelebrate();
    else if (DEMO_OPEN) { DEMO_OPEN = false; renderDemo(); document.querySelector('.demo-fab')?.focus(); }
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]:not(button)')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  // simple focus trap inside sheets
  if (e.key === 'Tab' && SHEET) {
    const f = [...document.querySelectorAll('#sheet-root button:not([disabled]), #sheet-root input, #sheet-root select, #sheet-root [tabindex="0"]')];
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
document.addEventListener('input', (e) => { const k = e.target.dataset?.input; if (k && INPUTS[k]) INPUTS[k](e.target.value, e.target); });
document.addEventListener('change', (e) => { const k = e.target.dataset?.change; if (k && CHANGES[k]) CHANGES[k](e.target.value, e.target); });
document.addEventListener('submit', (e) => { const k = e.target.dataset?.submit; if (k && SUBMITS[k]) { e.preventDefault(); SUBMITS[k](e.target); } });
window.addEventListener('hashchange', () => { closeSheetSilently(); if (route().name !== 'map') MAPSTATE.route = MAPSTATE.route && false; rerender(); document.getElementById('main')?.focus({ preventScroll: true }); });
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', rerender);

/* ---------- boot ---------- */
function boot() {
  const splash = document.getElementById('splash');
  rerender();
  startSim();
  setTimeout(() => { splash.classList.add('out'); setTimeout(() => splash.remove(), 500); }, motionReduced() ? 300 : 1500);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
