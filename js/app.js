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
  ['explore', 'map', { en: 'Explore', ar: 'استكشف' }],
  ['menu', 'bag', { en: 'Order', ar: 'اطلب' }],
  ['play', 'trophy', { en: 'Matchday', ar: 'يوم المباراة' }],
  ['profile', 'user', { en: 'Profile', ar: 'حسابي' }],
];
const NAV_OWNER = { home: 'home', guide: 'home', explore: 'explore', map: 'explore', menu: 'menu', summary: 'menu', track: 'menu', orders: 'menu', group: 'menu', shop: 'menu', play: 'play', profile: 'profile', settings: 'profile', support: 'profile' };
const ROLE_HOME = { fan: 'home', operator: 'ops/overview', vendor: 'vendor/queue', partner: 'partner/results', admin: 'admin/setup' };
const ROLE_ICON = { fan: 'user', operator: 'store', vendor: 'bag', partner: 'megaphone', admin: 'settings' };
const ROLES = () => ['fan', 'operator', 'vendor', 'partner', 'admin'].map((k) => [k, t('role.' + k), ROLE_ICON[k]]);
const ROLE_NAV = () => ({ operator: ['ops', OPS_NAV, 'overview'], vendor: ['vendor', VENDOR_NAV, 'queue'], partner: ['partner', PARTNER_NAV, 'results'], admin: ['admin', ADMIN_NAV, 'setup'] });
/* Navigation items per role: [route, icon, label, ownerKey] */
function navItems() {
  const rn = ROLE_NAV()[S.role];
  if (rn) return rn[1].map(([k, ic, l]) => [`${rn[0]}/${k}`, ic, l, k]);
  return FAN_NAV.map(([k, ic, l]) => [k, ic, l, k]);
}
function navActive() {
  const r = route();
  const rn = ROLE_NAV()[S.role];
  if (rn) return r.name === rn[0] && rn[1].some(([k]) => k === r.arg.split('/')[0]) ? r.arg.split('/')[0] : rn[2];
  return NAV_OWNER[r.name] || 'home';
}

function currentView() {
  const r = route();
  if (!S.user) return { key: 'signin', html: viewSignin };
  if (!S.setup || r.name === 'setup') return { key: 'setup', html: viewSetup };
  if (S.role === 'operator') return { key: 'ops', html: () => viewOps(r.name === 'ops' ? r.arg : 'overview') };
  if (S.role === 'vendor') return { key: 'vendor', html: () => viewVendor(r.name === 'vendor' ? r.arg : 'queue') };
  if (S.role === 'partner') return { key: 'partner', html: () => viewPartner(r.name === 'partner' ? r.arg : 'results') };
  if (S.role === 'admin') return { key: 'admin', html: () => viewAdmin(r.name === 'admin' ? r.arg : 'setup') };
  const map = { home: viewHome, explore: viewExplore, guide: () => viewGuide(r.arg), map: viewMap, menu: viewMenu, summary: viewSummary, track: () => viewTrack(r.arg), orders: viewOrders, group: viewGroup, play: viewPlay, shop: viewShop, profile: () => viewProfile(r.arg), settings: viewSettings, support: viewSupport };
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
  const active = navActive();
  const navLink = ([path, ic, l, key]) => `<a href="#/${path}" class="${active === key ? 'on' : ''}" ${active === key ? 'aria-current="page"' : ''}>${icon(ic)}<span>${L(l)}</span>${fan && key === 'menu' && activeOrder() ? `<i class="dot" aria-label="${T('Active order', 'طلب نشط')}"></i>` : ''}${S.role === 'operator' && key === 'orders' && allOpsOrders().some(needsAttention) ? '<i class="dot alert"></i>' : ''}</a>`;
  app.className = inApp ? `shell role-${S.role}` : 'shell bare';
  app.innerHTML = `
    ${inApp ? topbar() : `<div class="mini-top"><img src="assets/logo.png" alt="GolBite" class="logo-img"/>${langBtn()}</div>`}
    ${inApp ? `<nav class="sidenav" aria-label="${T('Main', 'الرئيسية')}">
      <div class="sidenav-role">${roleBadge()}</div>
      ${navItems().map(navLink).join('')}
      <div class="sidenav-foot">${fan ? `<a href="#/support">${icon('help')}<span>${T('Help', 'المساعدة')}</span></a><a href="#/settings">${icon('settings')}<span>${T('Settings', 'الإعدادات')}</span></a>` : `<button class="side-switch" data-act="setRole" data-arg="fan">${icon('user')}<span>${T('Back to fan view', 'العودة لواجهة المشجع')}</span></button>`}</div></nav>` : ''}
    <main id="main" tabindex="-1">${v.html()}</main>
    ${inApp ? `<nav class="bottomnav n${navItems().length}" aria-label="${T('Main', 'الرئيسية')}">${navItems().map(navLink).join('')}</nav>` : ''}
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

function roleBadge() {
  const sub = { fan: T('Matchday companion', 'رفيق المباراة'), operator: T('Venue operations console', 'لوحة تشغيل الملعب'), vendor: T('Vendor console', 'لوحة البائع'), partner: T('Partner campaigns', 'حملات الشركاء'), admin: T('Venue administration', 'إدارة الملعب') }[S.role];
  return `<span class="role-badge r-${S.role}">${icon(ROLE_ICON[S.role])}<span><b>${t('role.' + S.role)}</b><small>${sub}</small></span></span>`;
}
/* Active-order chip, visible on every fan screen. */
function activeChip() {
  const o = activeOrder();
  if (!o || S.role !== 'fan') return '';
  return `<a class="active-chip ${o.issue ? 'warn' : ''}" href="#/track/${o.id}" aria-label="${T('Active order', 'طلب نشط')} ${o.id}: ${stageLabel(o.stage)}">${icon(o.issue ? 'alert' : 'receipt')}<span><b>${stageLabel(o.stage)}</b><small>${o.id}${o.stage === 'ready' || o.stage === 'dispatched' ? '' : ' · ~' + mins(estimate(o))}</small></span></a>`;
}
function topbar() {
  const ev = currentEvent();
  return `<header class="topbar">
    <a href="#/${ROLE_HOME[S.role]}" class="brand" aria-label="GolBite ${T('home', 'الرئيسية')}"><img src="assets/logo.png" alt="GolBite" class="logo-img"/></a>
    <div class="top-event"><span class="team-dot" style="--tc:${myTeam().color}"></span><span class="ellipsis">${esc(L(ev.title))}</span>${live('top-clock', () => `<b>${S.ops.cancelled ? t('ev.cancelled') : S.match.phase === 'arrival' || S.match.phase === 'prematch' || S.match.phase === 'halftime' || S.match.phase === 'final' ? phaseLabel() : S.match.minute + "'"}</b>`, 'span')}</div>
    ${live('active-chip', activeChip, 'span', 'active-chip-wrap')}
    <button class="role-btn r-${S.role}" data-act="roleSheet" aria-haspopup="dialog" aria-label="${T('Demo role', 'الدور التجريبي')}: ${t('role.' + S.role)}">${icon(ROLE_ICON[S.role])}<span>${t('role.' + S.role)}</span><small>${T('Demo', 'تجريبي')}</small>${icon('down')}</button>
    ${langBtn()}
  </header>
  ${S.role !== 'fan' ? `<div class="role-bar r-${S.role}">${roleBadge()}<span class="muted xs">${T('Demo role switch — not access control. A live system checks permissions on the server.', 'تبديل أدوار تجريبي — ليس نظام صلاحيات. النظام الفعلي يتحقق من الصلاحيات في الخادم.')}</span></div>` : ''}`;
}
function roleSheet() {
  const desc = { fan: T('Plan the visit, explore, order and get help', 'خطط للزيارة، استكشف، اطلب واحصل على المساعدة'), operator: T('Event-day controls, orders, distribution, facilities', 'تحكم يوم الفعالية، الطلبات، التوزيع، المرافق'), vendor: T('Accept and prepare orders, stock, capacity', 'قبول وتحضير الطلبات، المخزون، السعة'), partner: T('Matchday campaigns and simulated results', 'حملات يوم المباراة ونتائج محاكاة'), admin: T('Event setup, services, integrations, business report', 'إعداد الفعالية، الخدمات، التكاملات، تقرير الأعمال') };
  return `<h2 class="sheet-title">${T('Switch demo role', 'تبديل الدور التجريبي')}</h2>
    <div class="notice warn">${icon('lock')}<span>${T('For reviewers only. Switching roles here is not access control — a production system must authenticate users and enforce each role on the server.', 'للمراجعين فقط. التبديل هنا ليس نظام صلاحيات — يجب أن يتحقق النظام الفعلي من هوية المستخدم ويفرض صلاحيات كل دور في الخادم.')}</span></div>
    <div class="list mt-s">${ROLES().map(([k, l, ic]) => `<button class="choice ${S.role === k ? 'on' : ''}" data-act="setRole" data-arg="${k}" aria-pressed="${S.role === k}"><span class="choice-ic">${icon(ic)}</span><span class="grow"><b>${l}</b><small>${desc[k]}</small></span>${S.role === k ? icon('check') : ''}</button>`).join('')}</div>`;
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
  setRole: (r) => { S.role = r; closeSheetSilently(); save(); go(ROLE_HOME[r]); toast(T(`Demo role: ${t('role.' + r)}`, `الدور التجريبي: ${t('role.' + r)}`)); },
  roleSheet: () => openSheet(roleSheet, { label: T('Switch demo role', 'تبديل الدور التجريبي') }),
  roleGo: (a) => { const [r, p] = a.split(':'); S.role = r; closeSheetSilently(); save(); go(p || ROLE_HOME[r]); },
  setSection: (k) => { S.setup.section = k; S.setup.locationMode = 'manual'; S.cart.dest = null; commit(); toast(T(`Location set to Section ${k}`, `تم تحديد موقعك في القسم ${k}`), 'success'); },
  setLang: (l) => { S.lang = l; commit(); },
  quickDemo: () => {
    S.user = { name: T('Sara', 'سارة'), handle: T('Demo visitor', 'زائر تجريبي'), demo: true };
    S.setup = { eventId: 'e1', teamId: 'hilal', section: 'B', row: 8, seat: 14, arrival: '19:00', gate: 'G2', locationMode: 'manual' };
    awardBadge('first');
    commit(); go('home');
  },
  guestStart: () => { S.user = { name: T('Guest', 'زائر'), handle: T('Guest (demo)', 'زائر (تجريبي)'), guest: true }; SETUP = null; commit(); go('setup'); },
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
    if (status) status.innerHTML = `<div class="notice info mt-s">${spinner()}<span>${T('Requesting location…', 'جارٍ طلب الموقع…')}</span></div>`;
    getLocation().then((ok) => {
      if (ok) { d.locationMode = 'gps'; d.gate = 'G1'; if (!d.section) d.section = 'A'; } else d.locationMode = 'denied';
      rerender();
    });
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
    if (!of || offerStatus(of) !== 'live') { toast(T('This offer is no longer available.', 'هذا العرض لم يعد متاحاً.'), 'warn'); return; }
    if (!itemAvailable(of.item)) { toast(t('err.unavailable'), 'warn'); return; }
    of.m[S.match.phase].r++;
    of.s[S.setup.section] = (of.s[S.setup.section] || 0) + 1;
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
    if (item(id).opts) return A.itemInfo(id);
    A.addLine(id);
  },
  addLine: (key, el) => {
    const { id, opt } = pkey(key);
    if (S.soldOut.includes(id)) return;
    S.cart.items[key] = (S.cart.items[key] || 0) + 1;
    haptic('light');
    const fromSheetCta = el?.classList?.contains('sheet-add');
    if (fromSheetCta) closeSheetSilently();
    commit();
    if (fromSheetCta || (route().name !== 'menu' && route().name !== 'summary' && !SHEET)) toast(`${item(id).emoji} ${lineName(id, opt)} ${T('added', 'أضيف')} · <a href="#/summary">${T('Review order', 'مراجعة الطلب')}</a>`, 'success');
  },
  removeLine: (key) => { if (!S.cart.items[key]) return; S.cart.items[key]--; if (!S.cart.items[key]) delete S.cart.items[key]; commit(); },
  removeItem: (id) => { const k = Object.keys(S.cart.items).reverse().find((x) => pkey(x).id === id); if (k) A.removeLine(k); },
  destSheet: () => openSheet(destSheet, { live: true, label: T('Destination', 'الوجهة') }),
  shopCat: (c) => { S.shopCat = c; commit(); },
  comboAdd: () => { S.cart.combo = (S.cart.combo || 0) + 1; commit(); },
  comboRemove: () => { S.cart.combo = Math.max(0, (S.cart.combo || 0) - 1); commit(); },
  menuCat: (c) => { S.menuCat = c; commit(); },
  menuDiet: (d) => { S.menuDiet = S.menuDiet.includes(d) ? S.menuDiet.filter((x) => x !== d) : [...S.menuDiet, d]; commit(); },
  clearDiet: () => { S.menuDiet = []; S.menuAvoid = []; MENUQ = ''; commit(); },
  toggleFav: (id) => { S.favorites = S.favorites.includes(id) ? S.favorites.filter((x) => x !== id) : [...S.favorites, id]; commit(); },
  itemInfo: (id) => { SHEETOPT = null; openSheet(() => itemInfoSheet(id), { label: L(item(id).name) }); },
  reorder: (id) => {
    const o = S.orders.find((x) => x.id === id);
    S.cart.items = {}; S.cart.combo = 0;
    o.items.forEach((i) => { if (i.combo) return; const k = S.soldOut.includes(i.id) ? ALTERNATIVES[i.id] : ckey(i.id, i.opt); S.cart.items[k] = (S.cart.items[k] || 0) + i.qty; });
    const comboQ = o.items.find((i) => i.combo)?.qty; if (comboQ) S.cart.combo = comboQ;
    S.cart.type = o.type; S.cart.dest = o.dest; S.cart.schedule = 'now';
    save(); go('summary');
  },
  swapItem: (key) => { const alt = ALTERNATIVES[pkey(key).id]; S.cart.items[alt] = (S.cart.items[alt] || 0) + S.cart.items[key]; delete S.cart.items[key]; commit(); },
  placeOrder: () => {
    ensureCartDest();
    const items = cartItemsList();
    if (!items.length) { toast(T('Your order is empty.', 'طلبك فارغ.'), 'error'); return; }
    const probs = checkoutProblems();
    if (probs.length) { toast(probs[0], 'error'); rerender(); return; }
    const btn = document.querySelector('[data-act="placeOrder"]');
    if (btn) { btn.disabled = true; btn.innerHTML = `${spinner()} ${T('Sending (demo)…', 'جارٍ الإرسال (تجريبي)…')}`; }
    setTimeout(() => {
      const o = placeOrder({ items, type: S.cart.type, dest: S.cart.dest, schedule: S.cart.schedule, note: (S.cart.note || '').trim() });
      scheduleReadyAlert(o); haptic('success');
      S.cart = { type: S.cart.type, items: {}, dest: S.cart.dest, schedule: 'now', combo: 0, note: '' };
      save(); go('track/' + o.id);
      celebrate({ emoji: '✅', title: T('Demo order placed', 'تم إرسال الطلب التجريبي'), sub: T(`${o.id} · no payment was taken`, `${o.id} · لم يتم أي دفع`), kind: 'confetti', ms: 2200 });
    }, 700);
  },

  // tracking & help
  collected: (id) => { const o = S.orders.find((x) => x.id === id); if (o && setStage(o, 'collected', 'fan')) commit(); },
  fanCancel: (id) => {
    const o = S.orders.find((x) => x.id === id);
    if (!o || !['placed', 'accepted'].includes(o.stage)) { toast(T('The kitchen has started — ask support to cancel.', 'بدأ المطبخ التحضير — اطلب الإلغاء من الدعم.'), 'warn'); return; }
    confirmSheet({ title: T(`Cancel ${o.id}?`, `إلغاء ${o.id}؟`), body: T('The kitchen has not started yet. This is a demo, so no money is refunded.', 'لم يبدأ المطبخ بعد. هذا عرض تجريبي ولا يتم استرداد أي مبلغ.'), ok: t('act.cancel'), danger: true,
      onOk: () => { cancelOrder(o, 'fan', T('Cancelled by fan', 'ألغاه المشجع')); Services.payments.refund(o.id, o.total); commit(); } });
  },
  movePickup: (id) => {
    const o = S.orders.find((x) => x.id === id) || S.opsOrders.find((x) => x.id === id);
    const alt = PICKUPS.filter((p) => p.id !== o.dest && pickupAllowed(p.id)).sort((a, b) => pickupWait(a.id) - pickupWait(b.id))[0];
    if (!alt) { toast(T('No other pickup point is open.', 'لا توجد نقطة استلام أخرى مفتوحة.'), 'warn'); return; }
    o.dest = alt.id;
    logActivity(S.role === 'fan' ? 'fan' : 'operator', `${o.id} → ${L(alt.name)}`);
    toast(T(`Moved to ${L(alt.name)}.`, `تم النقل إلى ${L(alt.name)}.`), 'success');
    commit();
  },
  orderHelp: (id) => openSheet(() => orderHelpSheet(id), { label: T('Order help', 'مساعدة الطلب') }),
  supportStart: (kind) => { closeSheetSilently(); openSheet(() => supportSheet(kind), { label: L(SUPPORT_KINDS[kind].name) }); },
  helpResolve: (a) => {
    const [id, kind] = a.split(':');
    const o = S.orders.find((x) => x.id === id);
    if (kind === 'cancel') { closeSheetSilently(); return A.fanCancel(id); }
    const res = resolveSupport(kind, o);
    S.support.unshift({ id: uid('sr'), kind, orderId: id, at: Date.now(), minute: S.match.minute, status: res.status, outcome: res.outcome, next: res.next });
    Services.support.submit(S.support[0]);
    logActivity('fan', `${T('Support', 'دعم')} · ${L(SUPPORT_KINDS[kind].name)} · ${id}`);
    closeSheetSilently();
    openSheet(() => `<div class="center"><div class="celeb-emoji">🤝</div><h2 class="sheet-title">${T('Request received (demo)', 'تم استلام الطلب (تجريبي)')}</h2><p>${esc(L(res.outcome))}</p><p class="muted small">${T('Next', 'التالي')}: ${esc(L(res.next))}</p><p class="muted xs">${t('demo.notReal')}</p><button class="btn btn-primary w-full" data-act="closeSheet">${T('OK', 'حسناً')}</button></div>`, { label: T('Support', 'الدعم') });
    commit();
  },
  recover: (a) => {
    const [id, how] = a.split(':');
    const o = S.orders.find((x) => x.id === id);
    if (!o || !o.issue) return;
    if (how === 'cancel') { cancelOrder(o, 'fan', T('Cancelled after an item became unavailable', 'أُلغي بعد عدم توفر صنف')); o.issue = null; commit(); toast(T('Order cancelled. Demo only — no refund is processed.', 'تم إلغاء الطلب. تجريبي — لا يتم أي استرداد.'), 'info'); return; }
    if (o.issue.kind === 'soldout') {
      const bad = o.issue.item, alt = ALTERNATIVES[bad];
      if (how === 'sub') { o.items.forEach((i) => { if (i.id === bad) { i.id = alt; if (!i.combo) i.price = item(alt).price; } }); o.tasks.forEach((tk) => tk.items.forEach((i) => { if (i.id === bad) i.id = alt; })); toast(T(`Swapped for ${L(item(alt).name)}.`, `تم الاستبدال بـ ${L(item(alt).name)}.`), 'success'); }
      if (how === 'remove') { const line = o.items.find((i) => i.id === bad); o.items = o.items.filter((i) => i.id !== bad); o.tasks.forEach((tk) => (tk.items = tk.items.filter((i) => i.id !== bad))); o.tasks = o.tasks.filter((tk) => tk.items.length); o.refund = (o.refund || 0) + (line ? (line.price ?? linePrice(line.id, line.opt)) * line.qty : 0); toast(T('Item removed. Demo refund recorded — no money moves.', 'تم حذف الصنف. سُجل استرداد تجريبي — لا تتحرك أي أموال.'), 'success'); }
      logActivity('fan', `${o.id}: ${how === 'sub' ? T('substitution accepted', 'قبول البديل') : T('item removed', 'حذف الصنف')}`);
    } else if (o.issue.kind === 'rejected') {
      const vid = o.issue.vid; const tk = o.tasks.find((x) => x.vid === vid);
      if (how === 'reroute') {
        const alt = VENDORS.find((x) => x.id !== vid && !vendorPaused(x.id) && tk.items.every((i) => x.cats.includes(item(i.id).cat)));
        const ex = o.tasks.find((x) => x.vid === alt.id);
        if (ex) { ex.items.push(...tk.items); o.tasks = o.tasks.filter((x) => x !== tk); } else Object.assign(tk, { vid: alt.id, rejected: false, acc: false, st: 0, prog: 0, reason: 'load' });
        toast(T(`Sent to ${L(alt.name)}.`, `أُرسل إلى ${L(alt.name)}.`), 'success');
      }
      if (how === 'dropvendor') { o.refund = (o.refund || 0) + orderTotal(tk.items); o.items = o.items.filter((i) => !tk.items.some((x) => x.id === i.id)); o.tasks = o.tasks.filter((x) => x !== tk); toast(T('Items removed. Demo refund recorded — no money moves.', 'تم حذف الأصناف. سُجل استرداد تجريبي — لا تتحرك أي أموال.'), 'success'); }
      logActivity('fan', `${o.id}: ${how === 'reroute' ? T('rerouted to another vendor', 'نُقل لبائع آخر') : T('vendor items removed', 'حذف أصناف البائع')}`);
    }
    o.issue = null;
    if (o.stage === 'placed' || o.stage === 'accepted' || o.stage === 'preparing') syncFromTasks(o, 'fan');
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
    if (!orderingStatus().open) { closeSheetSilently(); toast(orderingStatus().reason, 'error'); return; }
    const o = placeOrder({ items: g.items.map((i) => ({ ...i })), type: g.type, dest: g.dest, group: g.code });
    S.group = null; closeSheetSilently(); save(); go('track/' + o.id);
    scheduleReadyAlert(o); haptic('success');
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
  lockedInfo: (id) => toast(`🔒 ${L(merch(id).name)} — ${specialState(merch(id))}`, 'info'),
  mystery: () => {
    const box = document.querySelector('.mystery');
    box?.classList.add('shake');
    setTimeout(() => {
      MYSTERY = pick(MERCH_ITEMS.filter((m) => !m.special && m.price >= 49)).id;
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
    b.items.forEach((x) => { if (x === 'combo') S.cart.combo = (S.cart.combo || 0) + 1; else { const k = merch(x)?.opts ? ckey(x, 'M') : x; S.cart.items[k] = (S.cart.items[k] || 0) + 1; } });
    commit(); toast(`${T('Bundle added to your order', 'أضيفت الحزمة لطلبك')} · <a href="#/summary">${T('Review order', 'مراجعة الطلب')}</a>`, 'success');
  },

  // profile & settings
  toggleInterest: (k) => { S.interests = S.interests.includes(k) ? S.interests.filter((x) => x !== k) : [...S.interests, k]; commit(); },
  setTheme: (t) => { S.theme = t; commit(); },
  switchEvent: (id) => { S.setup.eventId = id; S.setup.teamId = EVENTS.find((e) => e.id === id).home; S.match = freshMatch(); S.dismissed = []; commit(); toast(T('Event switched', 'تم تغيير الحدث') + ': ' + L(currentEvent().title)); },
  setSpeed: (s) => { S.simSpeed = +s; startSim(); commit(); },
  startTour: () => { closeSheetSilently(); DEMO_OPEN = false; S.tour = 0; runTourStep(); },
  openDemo: () => { DEMO_OPEN = !DEMO_OPEN; renderDemo(); if (DEMO_OPEN) setTimeout(() => document.querySelector('.demo-panel button')?.focus(), 30); },
  askResetEvent: () => confirmSheet({ title: T('Reset the event?', 'إعادة ضبط الحدث؟'), body: T('Clock, crowds, closures, stock, pauses, notices, tasks and the activity log go back to the sample state. Your orders and rewards are kept.', 'تعود الساعة والكثافة والإغلاقات والمخزون والإيقافات والإعلانات والمهام والسجل للحالة النموذجية. تبقى طلباتك ومكافآتك.'), ok: T('Reset event', 'إعادة الحدث'), onOk: () => trigger('reset') }),
  askResetAll: () => confirmSheet({ title: T('Reset all demo data?', 'مسح كل البيانات؟'), body: T('This permanently clears orders, points, badges, collectibles and preferences in this browser.', 'سيتم مسح الطلبات والنقاط والأوسمة والمقتنيات والتفضيلات نهائياً من هذا المتصفح.'), ok: T('Reset everything', 'مسح الكل'), danger: true, onOk: () => { resetState(); SETUP = null; dismissCelebrate(); DEMO_OPEN = false; MINI = { taps: 0, until: 0, done: false }; startSim(); go('home'); rerender(); toast(T('Demo data cleared.', 'تم مسح البيانات.'), 'success'); } }),

  // explore, guide & support
  exploreCat: (c) => { EXPLORE.cat = c; EXPLORE.sel = null; rerender(); },
  dirSelect: (id) => { EXPLORE.sel = id || null; rerender(); if (id && window.innerWidth < 900) document.querySelector('.map-side')?.scrollIntoView({ block: 'start' }); },
  dirInfo: (id) => { if (route().name === 'explore') return A.dirSelect(id); openSheet(() => dirSheet(id), { live: true, label: T('Details', 'التفاصيل') }); },
  exploreGo: (cat) => { EXPLORE = { q: '', cat, sel: null }; closeSheetSilently(); go('explore'); },
  exploreItem: (id) => { EXPLORE = { q: '', cat: 'all', sel: id }; closeSheetSilently(); go('explore'); },
  menuFor: (cat) => { S.menuCat = cat; MENUQ = ''; closeSheetSilently(); save(); go('menu'); },
  clearCar: () => { S.savedCar = null; commit(); toast(T('Saved parking location deleted.', 'تم حذف موقع الموقف المحفوظ.')); },
  clearSupport: () => { S.support = []; commit(); },
  rateVisit: (n) => { S.feedback = { stars: +n, at: Date.now() }; logActivity('fan', T(`Visit rated ${n}/5`, `تقييم الزيارة ${n}/5`)); commit(); },
  menuAvoid: (a) => { S.menuAvoid = (S.menuAvoid || []).includes(a) ? S.menuAvoid.filter((x) => x !== a) : [...(S.menuAvoid || []), a]; commit(); },
  groupSplit: (m) => { S.group.split = m; commit(); },

  // partner
  draftImage: (e) => { draftOffer().image = e; rerender(); },
  draftMoment: (m) => { draftOffer().moment = m; rerender(); },
  draftSection: (k) => { const d = draftOffer(); d.sections = d.sections.includes(k) ? d.sections.filter((x) => x !== k) : [...d.sections, k]; rerender(); },
  draftSet: (a) => { const [k, v] = a.split(':'); draftOffer()[k] = v; rerender(); },
  draftStep: (i) => { const d = draftOffer(); if (+i <= d.step) { d.step = +i; d.errors = {}; rerender(); } },
  previewOffer: (id) => {
    const of = S.offers.find((o) => o.id === id);
    openSheet(() => `<h2 class="sheet-title">${T('Fan preview', 'معاينة المشجع')}</h2><div class="phone"><div class="phone-in"><small class="muted">${sunMark(14, 'brand-sun')} ${T('Matchday Companion', 'رفيق المباراة')}</small>${offerCard(of, true)}</div></div>
      <p class="muted small mt">${offerLive(of) ? T('Live now for eligible sections.', 'مباشر الآن للأقسام المؤهلة.') : T('Will appear at:', 'سيظهر عند:') + ' ' + L(OFFER_MOMENTS.find((m) => m.id === of.moment).name)}</p>
      <button class="btn btn-primary w-full" data-act="roleGo" data-arg="fan:home">${T('Open fan view', 'افتح واجهة المشجع')}</button>`, { label: T('Fan preview', 'معاينة المشجع'), live: true });
  },

  trigger: (a) => { const [k, v] = a.split(':'); trigger(k, v); },
};

function closeSheetSilently() { SHEET = null; renderSheet(); }

const INPUTS = {
  draftTitle: (v) => { draftOffer().title = v; refreshDraftPreview(); },
  draftDiscount: (v) => { draftOffer().discount = clamp(+v || 0, 0, 100); const o = document.getElementById('disc-out'); if (o) o.textContent = v + '%'; refreshDraftPreview(); },
  cartNote: (v) => { S.cart.note = v; save(); },
  exploreQ: (v) => { EXPLORE.q = v; EXPLORE.sel = null; refreshLive(); },
  menuQ: (v) => { MENUQ = v; const pos = document.activeElement?.selectionStart; rerender(); const el = document.querySelector('[data-input="menuQ"]'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} } },
  draftMinute: (v) => (draftOffer().minute = clamp(+v || 1, 1, 90)),
  draftLimit: (v) => (draftOffer().limit = Math.max(0, Math.round(+v || 0))),
  draftMinutes: (v) => { draftOffer().minutes = +v; const o = document.getElementById('minutes-out'); if (o) o.textContent = `${v} ${T('min', 'د')}`; },
};
const CHANGES = {
  setupRow: (v) => { setupDraft().row = +v; rerender(); },
  prefSaveSeat: (v, el) => { S.prefs.saveSeat = el.checked; save(); },
  setupSeat: (v) => { setupDraft().seat = +v; rerender(); },
  draftSponsor: (v) => { draftOffer().sponsor = v; refreshDraftPreview(); },
  pickOpt: (v) => { SHEETOPT = v; renderSheet(); },
  toggleVis: (v, el) => { S.visibility[el.dataset.arg] = el.checked; commit(); },
  toggleMotion: (v, el) => { S.reducedMotion = el.checked; commit(); },
  toggleClock: (v, el) => { S.match.clock = el.checked; commit(); },
};
const SUBMITS = {
  signin: (form) => {
    const v = form.handle.value.trim();
    if (!v) { document.getElementById('signin-error').hidden = false; form.handle.setAttribute('aria-invalid', 'true'); form.handle.focus(); return; }
    S.user = { name: v, handle: T('Demo visitor', 'زائر تجريبي'), demo: true };
    commit(); go('setup');
  },
  saveCar: (form) => {
    S.savedCar = { zone: form.zone.value, note: form.note.value.trim().slice(0, 40), at: Date.now() };
    commit(); toast(T('Parking location saved on this device only.', 'تم حفظ موقع الموقف على هذا الجهاز فقط.'), 'success');
  },
  supportSubmit: (form) => {
    const kind = form.kind.value;
    const where = form.where?.value || null;
    const res = resolveSupport(kind, null, where);
    S.support.unshift({ id: uid('sr'), kind, where, need: form.need?.value || null, text: (form.text.value || '').trim().slice(0, 160), at: Date.now(), minute: S.match.minute, section: S.setup.section, status: res.status, outcome: res.outcome, next: res.next });
    if (kind === 'facility' && where) S.tasks.unshift({ id: uid('tk'), kind: 'facility', where, by: 'fan', at: Date.now(), minute: S.match.minute, status: 'open', team: null, note: S.support[0].text });
    if (kind === 'assist' || kind === 'lost') S.tasks.unshift({ id: uid('tk'), kind, where: 'sec-' + S.setup.section, by: 'fan', at: Date.now(), minute: S.match.minute, status: 'open', team: null, note: [S.support[0].need, S.support[0].text].filter(Boolean).join(' · ') });
    Services.support.submit(S.support[0]);
    logActivity('fan', `${T('Support', 'دعم')} · ${L(SUPPORT_KINDS[kind].name)}`);
    closeSheetSilently(); commit();
    toast(T('Request recorded (demo). Nobody is notified in this prototype.', 'تم تسجيل الطلب (تجريبي). لا يتم إشعار أحد في هذا النموذج.'), 'success', 4500);
  },
  groupJoin: (form) => {
    const code = (form.code.value || '').trim().toUpperCase();
    if (code.length < 4) { toast(T('Enter the join code you received.', 'أدخل رمز الانضمام.'), 'error'); return; }
    const me = S.user.name;
    S.group = { code: code.startsWith('GB-') ? code : 'GB-' + code, leader: 'Faisal', me, members: ['Faisal', 'Noura', me], items: [{ id: 'b3', qty: 1, by: 'Faisal' }, { id: 'd4', qty: 2, by: 'Noura' }], type: 'pickup', dest: bestPickup().id, sim: true };
    commit(); toast(T("You joined Faisal's group.", 'انضممت لمجموعة فيصل.'), 'success');
  },
  offerNext: () => {
    const d = draftOffer();
    if (!validateDraft(d)) { rerender(); document.querySelector('[aria-invalid="true"]')?.focus(); return; }
    if (d.step < 3) { d.step++; rerender(); return; }
    const fields = { title: { en: d.title, ar: d.title }, sponsor: d.sponsor, image: d.image, moment: d.moment, minute: +d.minute, sections: [...d.sections], minutes: d.minutes,
      discount: d.reward === 'free' ? 100 : +d.discount, item: d.items[0], items: [...d.items], limit: +d.limit || 0, active: true, tone: d.tone, endsAt: d.moment === 'now' ? Date.now() + d.minutes * 60000 : null };
    let of;
    if (d.editing) { of = S.offers.find((x) => x.id === d.editing); Object.assign(of, fields); if (of.status === 'ended' || !of.status) of.status = 'scheduled'; logActivity('partner', `${d.title}: ${T('edited', 'عُدّل')}`); }
    else { of = seedOfferStats({ id: uid('of'), status: 'scheduled', ...fields }); S.offers.unshift(of); logActivity('partner', `${d.title}: ${T('scheduled', 'مجدول')}`); }
    DRAFT = null;
    save(); go('partner/results');
    setTimeout(() => openSheet(() => `<div class="center"><div class="celeb-mark">${sunMark(56, 'burst')}<span class="celeb-emoji">📣</span></div><h2 class="sheet-title">${T('Offer scheduled', 'تمت جدولة العرض')}</h2>
      <p class="muted">${offerLive(of) ? T('It is live now for eligible fans.', 'العرض مباشر الآن للمشجعين المؤهلين.') : T('It will appear in the Matchday Companion at:', 'سيظهر في رفيق المباراة عند:') + ' ' + momentName(of.moment) + (of.moment === 'minute' ? ' ' + of.minute + "'" : '')}</p></div>
      ${offerCard(of, true)}
      <div class="row gap mt wrap"><button class="btn btn-primary grow" data-act="roleGo" data-arg="fan:home">${T('Preview as fan', 'معاينة كمشجع')}</button>${!offerLive(of) ? `<button class="btn btn-ghost grow" data-act="triggerOfferMoment" data-arg="${of.moment}">${T('Simulate moment', 'محاكاة اللحظة')}</button>` : ''}</div>`, { live: true, label: T('Offer scheduled', 'تمت جدولة العرض') }), 60);
  },
};
Object.assign(A, OPS_ACTIONS, VENDOR_ACTIONS, ADMIN_ACTIONS, PARTNER_ACTIONS);
Object.assign(CHANGES, OPS_CHANGES, VENDOR_CHANGES, ADMIN_CHANGES, PARTNER_CHANGES);
Object.assign(SUBMITS, OPS_SUBMITS, ADMIN_SUBMITS);
function refreshDraftPreview() {
  const pv = document.getElementById('offer-preview');
  if (pv) pv.innerHTML = offerCard(previewOfferObj(draftOffer()), true);
}
A.triggerOfferMoment = (m) => {
  closeSheetSilently();
  if (m === 'goal') trigger('goal');
  else if (m === 'halftime') trigger('halftime');
  else if (m === 'prematch') trigger('phase', 'prematch');
  else if (m === 'arrival') trigger('phase', 'arrival');
  else if (m === 'minute') { const of = S.offers[0]; setPhase(of.minute > 45 ? 'second' : 'kickoff'); S.match.minute = of.minute; commit(); }
};

/* ---------- Demo Controls ---------- */
let DEMO_OPEN = false;
const SCENARIOS = () => [
  ['prematch', '🕖', T('Pre-match', 'قبل المباراة')],
  ['busy', '🚶', T('Busy pickup', 'ازدحام الاستلام')],
  ['vendorpause', '⏸️', T('Vendor pause', 'إيقاف بائع')],
  ['goaloffer', '⚽', T('Goal offer', 'عرض الهدف')],
  ['halftime', '⏱️', T('Halftime rush', 'ذروة الاستراحة')],
  ['delayed', '🐢', T('Delayed order', 'طلب متأخر')],
  ['reject', '🙅', T('Vendor rejects', 'رفض البائع')],
  ['unavailable', '📦', T('Item unavailable', 'صنف غير متاح')],
  ['facility', '🚻', T('Facility unavailable', 'مرفق غير متاح')],
];
function demoOrder() {
  let o = activeOrder();
  if (o && !o.issue) return o;
  const items = [{ id: 'b1', qty: 1, by: 'me' }, { id: 'f2', qty: 1, by: 'me' }, { id: 'd4', qty: 1, by: 'me' }].filter((i) => itemAvailable(i.id));
  o = placeOrder({ items: items.length ? items : [{ id: 'd1', qty: 1, by: 'me' }], type: 'pickup', dest: PICKUPS.find((p) => pickupAllowed(p.id))?.id || 'P1' });
  return o;
}
function runScenario(k) {
  S.demo.scenario = k;
  logActivity('sim', `${T('Scenario', 'سيناريو')}: ${SCENARIOS().find(([x]) => x === k)[2]}`);
  switch (k) {
    case 'prematch':
      S.ops = defaultOpsState(); S.overloaded = []; S.closedRoutes = []; S.svcStatus = {};
      trigger('phase', 'prematch'); return;
    case 'busy': { const p = S.setup ? nearestPickup().id : 'P1'; if (!S.overloaded.includes(p)) trigger('overload', p); trigger('crowd', 'up'); return; }
    case 'vendorpause':
      if (!vendorPaused('v1')) S.ops.pausedVendors.push('v1');
      logActivity('vendor', `${L(vendor('v1').name)} ${T('paused', 'متوقف')}`);
      toast(T(`${L(vendor('v1').name)} paused new orders (simulated).`, `${L(vendor('v1').name)} أوقف الطلبات الجديدة (محاكاة).`), 'warn', 4500);
      break;
    case 'goaloffer': trigger('goal'); return;
    case 'halftime':
      trigger('halftime');
      for (let i = 0; i < 5; i++) S.opsOrders.push(makeOpsOrder());
      break;
    case 'delayed': { const o = demoOrder(); o.delay = 10; logActivity('vendor', `${o.id}: ${T('kitchen reported a delay', 'المطبخ أبلغ عن تأخير')}`); save(); checkEtaChange(o); go('track/' + o.id); break; }
    case 'reject': { const o = demoOrder(); const tk = o.tasks.find((x) => x.st < 2) || o.tasks[0]; vendorAction(o, tk.vid, 'reject', 'vendor'); go('track/' + o.id); break; }
    case 'unavailable': { const o = demoOrder(); S.role = 'fan'; go('track/' + o.id); trigger('soldout', o.items[0].id); return; }
    case 'facility':
      S.svcStatus.wc1 = 'unavailable';
      S.tasks.unshift({ id: uid('tk'), kind: 'service', where: 'wc1', by: 'sim', at: Date.now(), minute: S.match.minute, status: 'open', team: null, note: T('Water supply issue (simulated)', 'مشكلة في المياه (محاكاة)') });
      toast(T('Restrooms · North-West marked unavailable (simulated).', 'دورات مياه الشمال الغربي غير متاحة (محاكاة).'), 'warn', 4500);
      break;
  }
  commit();
}
function advanceDemoOrders() {
  let n = 0;
  allOpsOrders().forEach((o) => { if (!isFinal(o) && !o.issue && advanceOrder(o, 'sim')) n++; });
  toast(T(`${n} order(s) moved one step (simulated).`, `تم تقديم ${n} طلب خطوة واحدة (محاكاة).`), 'info');
  commit();
}
function renderDemo() {
  const root = document.getElementById('demo-root');
  if (!DEMO_OPEN || !S.user || !S.setup) { root.innerHTML = ''; return; }
  const c = isConcert();
  const btn = (act, arg, emoji, label, on) => `<button class="demo-btn ${on ? 'on' : ''}" data-act="${act}" data-arg="${arg}"><span>${emoji}</span>${label}</button>`;
  root.innerHTML = `<div class="demo-panel" role="dialog" aria-label="${T('Demo controls', 'أدوات العرض')}">
    <div class="row between"><b>${icon('flask')} ${T('Demo Controls', 'أدوات العرض')}</b><button class="icon-btn sm" data-act="openDemo" aria-label="${T('Close', 'إغلاق')}">${icon('x')}</button></div>
    <small class="muted">${S.ops.cancelled ? t('ev.cancelled') : phaseLabel()} · ${S.match.minute}' · ${S.match.home}-${S.match.away} · ${T('everything here is simulated', 'كل ما هنا محاكاة')}</small>
    <h3 class="demo-h">${T('Scenarios', 'السيناريوهات')}</h3>
    <div class="demo-grid">${SCENARIOS().map(([k, e, l]) => btn('scenario', k, e, l, S.demo.scenario === k)).join('')}</div>
    <h3 class="demo-h">${T('Clock & orders', 'الوقت والطلبات')}</h3>
    <div class="demo-grid">
      ${btn('trigger', 'advance', '⏭️', T('Advance clock', 'تقديم الوقت'))}
      ${btn('trigger', 'goal', c ? '🎤' : '⚽', c ? T('Hit song', 'أغنية مميزة') : T('Home goal', 'هدف للمضيف'))}
      ${c ? '' : btn('trigger', 'goal:away', '🥅', T('Away goal', 'هدف للضيف'))}
      ${btn('trigger', 'final', '🏁', T('Full time', 'نهاية المباراة'))}
      ${btn('advanceOrders', '', '➡️', T('Advance orders', 'تقديم الطلبات'))}
      ${btn('toggleAutopilot', '', S.demo.autopilot ? '🤖' : '✋', S.demo.autopilot ? T('Autopilot on', 'تشغيل تلقائي') : T('Autopilot off', 'تشغيل يدوي'), S.demo.autopilot)}
      ${btn('trigger', 'closure', '🚧', S.closedRoutes.length ? T('Reopen route', 'فتح الممر') : T('Route closure', 'إغلاق ممر'))}
      ${btn('trigger', 'drop77', '🔥', T("77' merch drop", 'إصدار الدقيقة 77'))}
      ${btn('startTour', '', '✨', T('Product tour', 'جولة المنتج'))}
    </div>
    <h3 class="demo-h">${T('Demo role', 'الدور التجريبي')}</h3>
    <div class="row gap-xs wrap">${ROLES().map(([k, l]) => `<button class="chip sm ${S.role === k ? 'on' : ''}" data-act="setRole" data-arg="${k}">${l}</button>`).join('')}</div>
    <small class="muted xs">${T('Not access control — production checks roles on the server.', 'ليس نظام صلاحيات — النظام الفعلي يتحقق من الأدوار في الخادم.')}</small>
    <div class="row gap wrap mt-s">${EVENTS.map((e) => `<button class="chip sm ${currentEvent().id === e.id ? 'on' : ''}" data-act="switchEvent" data-arg="${e.id}">${e.type === 'concert' ? '🎤' : '⚽'} ${L(e.title)}</button>`).join('')}</div>
    <div class="row gap wrap mt-s"><span class="muted small">${T('Speed', 'السرعة')}</span>${[0.5, 1, 2, 4].map((sp) => `<button class="chip sm ${S.simSpeed === sp ? 'on' : ''}" data-act="setSpeed" data-arg="${sp}">${sp}×</button>`).join('')}</div>
    <div class="row gap wrap mt-s"><button class="btn btn-ghost btn-sm" data-act="askResetEvent">${icon('refresh')} ${T('Reset event', 'إعادة الحدث')}</button><button class="btn btn-danger btn-sm" data-act="askResetAll">${T('Reset all demo data', 'مسح كل البيانات')}</button></div>
  </div>`;
}
A.scenario = (k) => runScenario(k);
A.advanceOrders = () => advanceDemoOrders();
A.toggleAutopilot = () => { S.demo.autopilot = !S.demo.autopilot; logActivity('sim', S.demo.autopilot ? T('Autopilot on', 'التشغيل التلقائي مفعل') : T('Autopilot off', 'التشغيل التلقائي متوقف')); commit(); };

/* ---------- Product Tour ---------- */
const TOUR = [
  { t: { en: 'Fan picks event, section & seat', ar: 'المشجع يختار الحدث والقسم والمقعد' }, b: { en: 'Setup personalises everything: route, pickup points, offers and the timeline.', ar: 'الإعداد يخصص كل شيء: المسار ونقاط الاستلام والعروض والمخطط الزمني.' },
    run: () => { S.role = 'fan'; SETUP = null; go('setup'); } },
  { t: { en: 'Matchday Companion guides the next action', ar: 'رفيق المباراة يرشد للخطوة التالية' }, b: { en: 'Home shows the event, seat, crowd, waits and one or two useful actions for this moment.', ar: 'الرئيسية تعرض الحدث والمقعد والكثافة والانتظار وإجراءً أو اثنين مفيدين لهذه اللحظة.' },
    run: () => { S.role = 'fan'; go('home'); } },
  { t: { en: 'Fan places a pickup or delivery order', ar: 'المشجع يطلب استلاماً أو توصيلاً' }, b: { en: 'We added a burger, fries and a drink. Review and confirm.', ar: 'أضفنا برجر وبطاطس ومشروب. راجع وأكّد.' },
    run: () => { S.role = 'fan'; S.cart.items = { b1: 1, f2: 1, d4: 1 }; S.cart.type = 'pickup'; S.cart.dest = bestPickup().id; save(); go('summary'); } },
  { t: { en: 'Venue Operator receives and prepares it', ar: 'مشغّل المكان يستلم ويحضّر' }, b: { en: 'The order is split across vendors by stock, prep time, location and workload — one handoff for the fan.', ar: 'يتوزع الطلب على البائعين حسب المخزون ووقت التحضير والموقع والضغط — تسليم واحد للمشجع.' },
    run: () => { if (!activeOrder()) { const items = [{ id: 'b1', qty: 1, by: 'me' }, { id: 'f2', qty: 1, by: 'me' }, { id: 'd4', qty: 1, by: 'me' }]; placeOrder({ items, type: 'pickup', dest: bestPickup().id }); S.cart.items = {}; } S.role = 'operator'; OPS.dist = null; save(); go('ops/distribution'); } },
  { t: { en: 'A live event changes the experience', ar: 'حدث مباشر يغيّر التجربة' }, b: { en: 'A goal triggers celebrations, a goal-time offer, crowd surges and updated estimates.', ar: 'الهدف يطلق الاحتفال وعرض الهدف وارتفاع الكثافة وتحديث التقديرات.' },
    run: () => { S.role = 'fan'; go('home'); setTimeout(() => trigger('goal'), 400); } },
  { t: { en: 'Fan earns rewards and explores Club Shop', ar: 'المشجع يكسب المكافآت ويتصفح المتجر' }, b: { en: 'Points, badges and drops connect food, play and merchandise.', ar: 'النقاط والأوسمة والإصدارات تربط الطعام واللعب والمنتجات.' },
    run: () => { S.role = 'fan'; go('shop'); } },
  { t: { en: 'Club / Partner sees offers and engagement', ar: 'النادي/الشريك يرى العروض والتفاعل' }, b: { en: 'Create a matchday offer, preview it in the Companion and track simulated results.', ar: 'أنشئ عرضاً، عاينه في رفيق المباراة وتابع النتائج المحاكاة.' },
    run: () => { S.role = 'partner'; save(); go('partner/results'); } },
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
window.addEventListener('hashchange', () => {
  closeSheetSilently();
  if (route().name !== 'map') MAPSTATE.route = false;
  // a link into another role's workspace switches the role
  if (route().name === 'ops' && S.role !== 'operator') S.role = 'operator';
  if (route().name === 'partner' && S.role !== 'partner') S.role = 'partner';
  if (route().name === 'vendor' && S.role !== 'vendor') S.role = 'vendor';
  if (route().name === 'admin' && S.role !== 'admin') S.role = 'admin';
  if (FAN_ROUTES.includes(route().name) && S.role !== 'fan') S.role = 'fan';
  rerender(); document.getElementById('main')?.focus({ preventScroll: true }); });
const FAN_ROUTES = ['home', 'explore', 'guide', 'menu', 'summary', 'track', 'orders', 'group', 'play', 'shop', 'profile', 'support'];
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', rerender);

/* ---------- boot ---------- */
function boot() {
  const splash = document.getElementById('splash');
  nativeInit();
  rerender();
  startSim();
  setTimeout(() => { splash.classList.add('out'); setTimeout(() => splash.remove(), 500); }, motionReduced() ? 300 : 1500);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
