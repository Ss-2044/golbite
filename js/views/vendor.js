/* GolBite — Vendor console: one kitchen's order queue, menu & stock, capacity & pause, and performance.
   Scoped to the selected demo vendor. In production the vendor would sign in and only see their own data. */

const VENDOR_NAV = [
  ['queue', 'receipt', { en: 'Orders', ar: 'الطلبات' }],
  ['menu', 'store', { en: 'Menu & stock', ar: 'القائمة والمخزون' }],
  ['settings', 'settings', { en: 'Capacity & pause', ar: 'السعة والإيقاف' }],
  ['performance', 'chart', { en: 'Performance', ar: 'الأداء' }],
];
const myVendor = () => vendor(S.vendorId) || VENDORS[0];
/* Orders that contain work for this vendor, newest problems first. */
function vendorOrders(vid, includeDone = false) {
  return allOpsOrders().filter((o) => o.tasks.some((x) => x.vid === vid) && (includeDone || !isFinal(o)))
    .map((o) => ({ o, tk: o.tasks.find((x) => x.vid === vid) }));
}

function viewVendor(tab) {
  tab = VENDOR_NAV.some(([k]) => k === tab) ? tab : 'queue';
  const v = myVendor();
  const body = { queue: vendorQueue, menu: vendorMenu, settings: vendorSettings, performance: vendorPerformance }[tab]();
  return `<section class="page wide ws">
    <div class="ws-head">
      <div><small class="eyebrow">${T('Vendor console', 'لوحة البائع')}</small><h1 class="title">${v.emoji} ${L(v.name)} · ${L(VENDOR_NAV.find(([k]) => k === tab)[2])}</h1></div>
      <div class="ws-context"><label class="filter"><span>${T('Demo vendor', 'البائع التجريبي')}</span><select data-change="vendorPick">${VENDORS.map((x) => `<option value="${x.id}" ${x.id === v.id ? 'selected' : ''}>${L(x.name)}</option>`).join('')}</select></label>
        ${live('vendor-state', () => `${vendorPaused(v.id) ? `<span class="st-chip svc-paused">${t('svc.paused')}</span>` : `<span class="st-chip s3">${t('svc.open')}</span>`}<span class="muted xs">${activeTasks(v.id)}/${vendorCap(v.id)} ${T('in progress', 'قيد التنفيذ')}</span>${dataBadge('demo')}`, 'span', 'row gap-xs')}</div>
    </div>
    ${body}
  </section>`;
}

function vendorQueue() {
  const v = myVendor();
  return `<p class="mb-s">${simNote()}</p>${!orderingStatus().open ? `<div class="notice warn">${icon('lock')}<span>${orderingStatus().reason}</span></div>` : ''}
    ${live('vendor-queue', () => {
      const rows = vendorOrders(v.id);
      const col = (key, label, filter) => {
        const list = rows.filter(filter);
        return `<section class="kcol"><h2 class="h3">${label} <span class="muted">${list.length}</span></h2>${list.map(({ o, tk }) => vendorCard(o, tk, key)).join('') || `<p class="muted small">—</p>`}</section>`;
      };
      return `<div class="kanban">
        ${col('new', t('vt.new'), ({ tk }) => !tk.rejected && !tk.acc && tk.st === 0)}
        ${col('acc', t('vt.accepted'), ({ tk }) => !tk.rejected && tk.acc && tk.st === 0)}
        ${col('prep', t('vt.preparing'), ({ tk }) => !tk.rejected && tk.st === 1)}
        ${col('ready', t('vt.ready'), ({ tk }) => !tk.rejected && tk.st === 2)}
      </div>`;
    })}`;
}
function vendorCard(o, tk, key) {
  const v = myVendor();
  const late = isOverdue(o);
  const btn = (act, label, cls = 'btn-primary') => `<button class="btn btn-sm ${cls}" data-act="vendorDo" data-arg="${o.id}:${act}">${label}</button>`;
  return `<article class="kcard ${late ? 'late' : ''} ${o.issue ? 'issue' : ''}">
    <div class="row between"><b>${o.id}</b>${timeCell(o)}</div>
    <ul class="kitems">${tk.items.map((i) => `<li><b>${i.qty}×</b> ${lineName(i.id, i.opt)}${item(i.id).allergens?.length ? ` <small class="muted">(${item(i.id).allergens.map((a) => L(ALLERGENS[a])).join('، ')})</small>` : ''}</li>`).join('')}</ul>
    ${o.note ? `<p class="small">${icon('note')} ${esc(L(o.note))}</p>` : ''}
    <small class="muted">${destLabel(o)}${o.tasks.length > 1 ? ' · ' + T('shared with', 'مشترك مع') + ' ' + o.tasks.filter((x) => x.vid !== v.id).map((x) => L(vendor(x.vid).name)).join(' + ') : ''}</small>
    ${o.issue ? `<div class="notice warn mt-xs">${icon('alert')}<span>${T('Waiting for the fan to resolve an item issue.', 'بانتظار المشجع لحل مشكلة صنف.')}</span></div>` : ''}
    <div class="row gap-xs wrap mt-xs">
      ${key === 'new' ? btn('accept', t('act.accept')) + btn('reject', t('act.reject'), 'btn-ghost danger') : ''}
      ${key === 'acc' ? btn('start', t('act.start')) + btn('reject', t('act.reject'), 'btn-ghost danger') : ''}
      ${key === 'prep' ? btn('ready', t('act.ready')) : ''}
      ${key === 'ready' ? `<small class="muted">${o.type === 'delivery' ? T('Hand to runner', 'سلّم للمندوب') + ' ' + (o.runner || '—') : T('Send to', 'أرسل إلى') + ' ' + L(pickup(o.dest).name)}</small>` : ''}
    </div>
  </article>`;
}

function vendorMenu() {
  const v = myVendor();
  const items = CATALOG.filter((m) => v.cats.includes(m.cat));
  return `<section class="panel">
    <div class="block-head"><h2 class="h3">${T('Items you sell', 'الأصناف التي تبيعها')}</h2><small class="muted">${T('Availability applies venue-wide for the item', 'التوفر ينطبق على الصنف في كل الملعب')}</small></div>
    ${live('vendor-stock', () => stockTable(items))}
    <p class="muted xs mt-s">${T('Unavailable items are blocked in the fan menu immediately; open orders containing them ask the fan to choose a substitute, removal or cancellation.', 'الأصناف غير المتاحة تُمنع فوراً في قائمة المشجع؛ والطلبات المفتوحة التي تحتويها تطلب من المشجع اختيار بديل أو حذف أو إلغاء.')}</p>
  </section>`;
}

function vendorSettings() {
  const v = myVendor();
  return `<div class="ws-grid two">
    <section class="panel">
      <h2 class="h3">${T('Kitchen capacity', 'سعة المطبخ')}</h2>
      <p class="muted small">${T('How many orders you can prepare at the same time. New orders beyond this wait longer and routing prefers other vendors.', 'عدد الطلبات التي تستطيع تحضيرها في نفس الوقت. الطلبات الزائدة تنتظر أطول ويفضّل التوزيع بائعين آخرين.')}</p>
      <div class="stepper mt-s" role="group" aria-label="${T('Capacity', 'السعة')}"><button class="icon-btn" data-act="opsCap" data-arg="${v.id}:-1" aria-label="${T('Lower capacity', 'خفض السعة')}">${icon('minus')}</button><output>${vendorCap(v.id)}</output><button class="icon-btn primary" data-act="opsCap" data-arg="${v.id}:1" aria-label="${T('Raise capacity', 'رفع السعة')}">${icon('plus')}</button></div>
    </section>
    <section class="panel">
      <h2 class="h3">${T('Pause new orders', 'إيقاف الطلبات الجديدة')}</h2>
      <p class="muted small">${T('While paused, fans cannot order items only you sell, and new orders are routed to other vendors where possible. Orders already in progress stay with you.', 'أثناء الإيقاف لا يستطيع المشجعون طلب الأصناف التي تبيعها وحدك، وتُوجّه الطلبات الجديدة لبائعين آخرين إن أمكن. الطلبات الجارية تبقى لديك.')}</p>
      <button class="btn mt-s ${vendorPaused(v.id) ? 'btn-primary' : 'btn-danger'}" data-act="opsPauseVendor" data-arg="${v.id}">${vendorPaused(v.id) ? T('Resume orders', 'استئناف الطلبات') : T('Pause orders', 'إيقاف الطلبات')}</button>
    </section>
    <section class="panel span-all"><h2 class="h3">${T('Your activity', 'نشاطك')}</h2>${live('vendor-activity', () => activityList(12, ['vendor']))}</section>
  </div>`;
}

function vendorPerformance() {
  return live('vendor-perf', () => {
    const v = myVendor();
    const rows = vendorOrders(v.id, true);
    const done = rows.filter(({ tk }) => tk.st >= 2 && !tk.rejected);
    const rejected = rows.filter(({ tk }) => tk.rejected).length;
    const readyTimes = done.map(({ o }) => { const h = (o.history || []).find((x) => x.stage === 'ready'); return h ? (h.tick - o.bornTick) / 2 : null; }).filter((x) => x != null && x >= 0);
    const avg = readyTimes.length ? readyTimes.reduce((a, b) => a + b, 0) / readyTimes.length : 0;
    const sales = (S.ledger || []).filter((l) => l.stage !== 'cancelled').reduce((s, l) => s + (l.byVendor[v.id] || 0), 0);
    const late = rows.filter(({ o }) => isOverdue(o)).length;
    return `<div class="kpis">
      ${kpi(T('Prepared', 'تم تحضيرها'), done.length, T('tasks marked ready', 'مهام جاهزة'))}
      ${kpi(T('Average time to ready', 'متوسط الوقت حتى الجاهزية'), readyTimes.length ? mins(avg) : '—', T('from order placed', 'من وقت الطلب'))}
      ${kpi(T('Running late', 'متأخرة الآن'), late, T('past promised time', 'تجاوزت الوقت الموعود'), late ? 'busy' : '')}
      ${kpi(T('Rejected', 'مرفوضة'), rejected, T('this event', 'هذه الفعالية'))}
      ${kpi(T('Item sales', 'مبيعات الأصناف'), sar(sales), T('closed orders, incl. VAT', 'طلبات مغلقة، شامل الضريبة'))}
    </div>
    <p class="muted xs">${T('Simulated figures from this demo session only. No payouts are calculated or made here.', 'أرقام محاكاة من جلسة العرض هذه فقط. لا يتم حساب أو صرف أي مستحقات هنا.')}</p>`;
  });
}

const VENDOR_ACTIONS = {
  vendorDo: (a) => {
    const [id, act] = a.split(':');
    const o = findOpsOrder(id);
    if (!o) return;
    if (act === 'reject') {
      confirmSheet({ title: T(`Reject your items in ${id}?`, `رفض أصنافك في ${id}؟`), body: T('The fan will be asked to choose another vendor, remove these items or cancel.', 'سيُطلب من المشجع اختيار بائع آخر أو حذف الأصناف أو الإلغاء.'), ok: t('act.reject'), danger: true,
        onOk: () => { vendorAction(o, S.vendorId, 'reject', 'vendor'); if (o.synthetic) autoResolveSynthetic(o); commit(); } });
      return;
    }
    if (!vendorAction(o, S.vendorId, act, 'vendor')) { toast(T('That step is not allowed right now.', 'هذه الخطوة غير مسموحة الآن.'), 'error'); return; }
    commit();
  },
};
const VENDOR_CHANGES = {
  vendorPick: (v) => { S.vendorId = v; commit(); },
};
/* Sample fans resolve rejected items by moving them to another vendor (simulation). */
function autoResolveSynthetic(o) {
  const tk = o.tasks.find((x) => x.vid === o.issue?.vid);
  if (!tk) return;
  const alt = VENDORS.find((x) => x.id !== tk.vid && !vendorPaused(x.id) && tk.items.every((i) => x.cats.includes(item(i.id).cat)));
  if (alt) { Object.assign(tk, { vid: alt.id, rejected: false, acc: false, st: 0, prog: 0, reason: 'load' }); o.issue = null; logActivity('sim', `${o.id} → ${L(alt.name)}`); }
  else { cancelOrder(o, 'sim', T('No other vendor available', 'لا يوجد بائع آخر')); o.issue = null; }
}
