/* GolBite — Venue operations console: overview, event-day controls, orders, distribution, stock & pickup,
   facility tasks and map. Everything here runs on simulated sample data; every change is written to the
   activity log with the acting role. The role switch is a demo convenience, not access control. */

let OPS = { filters: { stage: 'all', vendor: 'all', dest: 'all', section: 'all', urgency: 'all' }, sel: null, dist: null, stockCat: 'all' };
const OPS_NAV = [
  ['overview', 'chart', { en: 'Overview', ar: 'نظرة عامة' }],
  ['control', 'settings', { en: 'Event-day controls', ar: 'تحكم يوم الفعالية' }],
  ['orders', 'receipt', { en: 'Orders', ar: 'الطلبات' }],
  ['distribution', 'route', { en: 'Distribution', ar: 'التوزيع' }],
  ['inventory', 'store', { en: 'Stock & pickup', ar: 'المخزون والاستلام' }],
  ['facilities', 'alert', { en: 'Facility tasks', ar: 'مهام المرافق' }],
  ['map', 'map', { en: 'Map', ar: 'الخريطة' }],
];
const ALL_STAGES = ['placed', 'accepted', 'preparing', 'ready', 'dispatched', 'collected', 'delivered', 'cancelled'];

function allOpsOrders() {
  return [...S.orders.filter((o) => o.eventId === currentEvent().id || !o.eventId).map((o) => Object.assign(o, { fan: S.user?.name || T('Fan', 'مشجع'), mine: true })), ...S.opsOrders];
}
const findOpsOrder = (id) => S.orders.find((x) => x.id === id) || S.opsOrders.find((x) => x.id === id);
function orderSection(o) {
  if (o.type === 'delivery') return o.dest;
  const a = pickup(o.dest).angle;
  return Object.values(SECTIONS).sort((x, y) => angDist(x.angle, a) - angDist(y.angle, a))[0].id;
}
const destLabel = (o) => (o.type === 'delivery' ? `${t('ful.delivery')} · ${T('Section', 'القسم')} ${o.dest}` : L(pickup(o.dest)?.name));
const timeCell = (o) => `<span class="time-cell ${isOverdue(o) ? 'late' : ''}"><b>${elapsedMin(o)}</b>/${promisedMin(o)} ${T('min', 'د')}</span>`;
function urgencyChip(o) {
  if (isFinal(o)) return '';
  if (isBlocked(o)) return `<span class="st-chip blocked">${T('Blocked', 'متوقف')}</span>`;
  if (isUnassigned(o)) return `<span class="st-chip overdue">${T('No runner', 'بلا مندوب')}</span>`;
  if (isOverdue(o)) return `<span class="st-chip overdue">${T('Overdue', 'متأخر')}</span>`;
  return '';
}
const stChip = (o) => `<span class="st-chip ${o.stage === 'cancelled' ? 'blocked' : 's' + o.status}">${stageLabel(o.stage)}</span>`;
const simNote = () => `<span class="muted xs">${S.demo.autopilot ? T('Simulated kitchens and runners also move orders forward (autopilot).', 'المطابخ والمندوبون المحاكون يحركون الطلبات أيضاً (تشغيل تلقائي).') : T('Autopilot off — orders only move when staff act.', 'التشغيل التلقائي متوقف — الطلبات تتحرك فقط بإجراء الفريق.')}</span>`;

function viewOps(tab) {
  tab = OPS_NAV.some(([k]) => k === tab) ? tab : 'overview';
  const body = { overview: opsOverview, control: opsControl, orders: opsOrders, distribution: opsDistribution, inventory: opsInventory, facilities: opsFacilities, map: opsMap }[tab]();
  return `<section class="page wide ws">
    <div class="ws-head">
      <div><small class="eyebrow">${T('Venue operations', 'تشغيل الملعب')}</small><h1 class="title">${L(OPS_NAV.find(([k]) => k === tab)[2])}</h1></div>
      ${live('ops-context', () => `<div class="ws-context">${pill(L(currentEvent().title))}<span class="st-chip ev-${eventStatus()}">${t('ev.' + eventStatus())}${S.match.minute >= 0 && !S.ops.cancelled ? ` · ${S.match.minute}'` : ''}</span>${orderingStatus().open ? `<span class="st-chip s3">${T('Ordering open', 'الطلب مفتوح')}</span>` : `<span class="st-chip blocked">${T('Ordering closed', 'الطلب مغلق')}</span>`}${dataBadge('demo')}</div>`)}
    </div>
    ${body}
  </section>`;
}

/* ---------- overview ---------- */
function opsOverview() {
  return live('ops-overview', () => {
    const all = allOpsOrders();
    const active = all.filter((o) => !isFinal(o));
    const attention = active.filter(needsAttention);
    const avg = active.length ? active.reduce((s, o) => s + estimate(o), 0) / active.length : 0;
    const placed = Object.values(S.opsStats.byPhase).reduce((a, b) => a + b, 0);
    const openTasks = S.tasks.filter((x) => x.status !== 'resolved');
    const paused = S.ops.pausedVendors.length + S.ops.pausedPickups.length + S.ops.pausedZones.length;
    return `<div class="kpis">
      ${kpi(T('Active orders', 'طلبات نشطة'), active.length, T('not yet handed over', 'لم تُسلّم بعد'))}
      ${kpi(T('Average estimate', 'متوسط الوقت المتوقع'), mins(avg), T('remaining, active orders', 'المتبقي للطلبات النشطة'), avg > 10 ? 'busy' : avg > 6 ? 'mid' : 'calm')}
      <button class="kpi ${attention.length ? 'kpi-alert' : ''}" data-act="opsFilter" data-arg="urgency:attention"><span class="kpi-l">${T('Needs attention', 'تحتاج متابعة')}</span><b class="kpi-v">${attention.length}</b><small>${T('overdue, blocked or no runner', 'متأخرة أو متوقفة أو بلا مندوب')} ${icon('chevron', 'flip')}</small></button>
      ${kpi(T('Completed', 'مكتملة'), S.opsStats.completed, T('collected or delivered', 'مستلمة أو موصلة'))}
      ${kpi(T('Cancelled', 'ملغاة'), S.opsStats.cancelled || 0, T('this event', 'هذه الفعالية'))}
      ${kpi(T('Orders placed', 'طلبات مستلمة'), placed, T('completed + cancelled + active', 'مكتملة + ملغاة + نشطة'))}
    </div>
    <div class="ws-grid">
      <section class="panel span-2">
        <div class="block-head"><h2 class="h3">${icon('alert')} ${T('Issues', 'المشكلات')}</h2><button class="link" data-act="opsFilter" data-arg="urgency:attention">${T('All orders needing attention', 'كل الطلبات التي تحتاج متابعة')} ${icon('chevron', 'flip')}</button></div>
        ${!orderingStatus().open ? `<div class="notice warn">${icon('lock')}<span>${orderingStatus().reason}</span><button class="btn btn-sm btn-primary" data-act="go" data-arg="ops/control">${T('Controls', 'التحكم')}</button></div>` : ''}
        ${paused ? `<div class="notice info">${icon('alert')}<span>${T(`${paused} service(s) paused`, `${paused} خدمة متوقفة مؤقتاً`)}: ${[...S.ops.pausedVendors.map((v) => L(vendor(v).name)), ...S.ops.pausedPickups.map((p) => L(pickup(p).name)), ...S.ops.pausedZones.map((z) => T('Delivery', 'توصيل') + ' ' + z)].join('، ')}</span></div>` : ''}
        ${openTasks.length ? `<div class="notice info">${icon('alert')}<span>${T(`${openTasks.length} open facility task(s)`, `${openTasks.length} مهمة مرافق مفتوحة`)}</span><button class="btn btn-sm btn-ghost" data-act="go" data-arg="ops/facilities">${T('Open', 'فتح')}</button></div>` : ''}
        ${attention.length ? `<div class="att-list">${attention.slice(0, 5).map((o) => `<div class="att"><b>${o.id}</b>${urgencyChip(o)}<span class="muted small grow">${destLabel(o)} · ${orderOwner(o)}</span>${timeCell(o)}<button class="btn btn-primary btn-sm" data-act="opsOpen" data-arg="${o.id}">${T('Open', 'فتح')}</button></div>`).join('')}</div>`
          : `<p class="muted small">${T('No order issues right now.', 'لا توجد مشكلات في الطلبات حالياً.')}</p>`}
      </section>
      <section class="panel">
        <div class="block-head"><h2 class="h3">${T('Vendor workload', 'ضغط عمل البائعين')}</h2><small class="muted">${T('active tasks ÷ capacity', 'المهام النشطة ÷ السعة')}</small></div>
        <ul class="zone-list">${VENDORS.map((v) => `<li><span>${v.emoji} ${L(v.name)}${vendorPaused(v.id) ? ` <span class="st-chip svc-paused">${t('svc.paused')}</span>` : ''}</span><span class="bar"><i class="lvl-bg-${levelKind(S.vendorLoad[v.id])}" style="width:${S.vendorLoad[v.id]}%"></i></span><b>${activeTasks(v.id)}/${vendorCap(v.id)}</b></li>`).join('')}</ul>
      </section>
      <section class="panel">
        <div class="block-head"><h2 class="h3">${T('Pickup points', 'نقاط الاستلام')}</h2><button class="link" data-act="go" data-arg="ops/inventory">${T('Manage', 'إدارة')} ${icon('chevron', 'flip')}</button></div>
        <table class="tbl compact"><thead><tr><th>${T('Point', 'النقطة')}</th><th>${T('Load', 'الحمل')}</th><th>${T('Ready', 'جاهزة')}</th><th>${T('Wait', 'الانتظار')}</th></tr></thead>
          <tbody>${PICKUPS.map((p) => `<tr><td>${L(p.name)}${!pickupAllowed(p.id) ? ` <span class="st-chip svc-paused">${t('svc.paused')}</span>` : ''}</td><td><span class="lvl-${levelKind(pickupLoad(p.id))}">${Math.round(pickupLoad(p.id))}%</span></td><td>${all.filter((o) => o.type === 'pickup' && o.dest === p.id && o.stage === 'ready').length}</td><td>${mins(pickupWait(p.id))}</td></tr>`).join('')}</tbody></table>
      </section>
      <section class="panel span-2">
        <div class="block-head"><h2 class="h3">${T('Latest activity', 'آخر النشاطات')}</h2><button class="link" data-act="go" data-arg="ops/control">${T('Full log', 'السجل الكامل')} ${icon('chevron', 'flip')}</button></div>
        ${activityList(6)}
      </section>
    </div>`;
  });
}
function kpi(label, value, sub, kind = '') {
  return `<div class="kpi ${kind ? 'kpi-' + kind : ''}"><span class="kpi-l">${label}</span><b class="kpi-v">${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
}
function activityList(n = 30, roles) {
  const list = S.activity.filter((a) => !roles || roles.includes(a.role)).slice(0, n);
  if (!list.length) return `<p class="muted small">${T('No activity yet.', 'لا يوجد نشاط بعد.')}</p>`;
  return `<ol class="activity">${list.map((a) => `<li><span class="act-role r-${a.role}">${actorLabel(a.role)}</span><span class="grow">${esc(a.text)}</span><small class="muted">${a.minute < 0 ? T('pre', 'قبل') : a.minute + "'"}</small></li>`).join('')}</ol>`;
}

/* ---------- event-day controls ---------- */
function opsControl() {
  const ops = S.ops, cfg = S.venueCfg, es = eventStatus();
  const tog = (on, act, arg, labelOn, labelOff) => `<button class="btn btn-sm ${on ? 'btn-ghost' : 'btn-danger'}" data-act="${act}" data-arg="${arg}" aria-pressed="${!on}">${on ? labelOn : labelOff}</button>`;
  return `<div class="ws-grid two">
    <section class="panel">
      <h2 class="h3">${icon('bag')} ${T('Ordering', 'الطلب')}</h2>
      <div class="kv"><span>${T('Food & merch ordering', 'طلب الطعام والمنتجات')}</span>${ops.ordering ? `<button class="btn btn-sm btn-danger" data-act="opsOrdering">${T('Close ordering', 'إغلاق الطلب')}</button>` : `<button class="btn btn-sm btn-primary" data-act="opsOrdering">${T('Open ordering', 'فتح الطلب')}</button>`}</div>
      <p class="small ${orderingStatus().open ? 'lvl-calm' : 'lvl-busy'}">${orderingStatus().open ? T('Fans can order now.', 'يمكن للمشجعين الطلب الآن.') : orderingStatus().reason}</p>
      <label class="field"><span>${T('Last-order cutoff (match minute)', 'آخر موعد للطلب (دقيقة المباراة)')}</span><input type="number" min="46" max="90" value="${cfg.cutoffMinute}" data-change="opsCutoff"/></label>
      <h3 class="h3 mt">${T('Event phase', 'مرحلة الفعالية')}</h3>
      <div class="row gap-xs wrap" role="group" aria-label="${T('Event phase', 'مرحلة الفعالية')}">${['scheduled', 'live', 'halftime', 'post', 'cancelled'].map((p) => `<button class="chip ${es === p ? 'on' : ''} ${p === 'cancelled' ? 'danger' : ''}" data-act="opsPhase" data-arg="${p}" aria-pressed="${es === p}">${t('ev.' + p)}</button>`).join('')}</div>
      <p class="muted xs mt-xs">${T('Phase changes drive the fan home screen, ordering rules and the simulated match clock.', 'تغيير المرحلة يؤثر على واجهة المشجع وقواعد الطلب وساعة المباراة المحاكاة.')}</p>
    </section>
    <section class="panel">
      <h2 class="h3">${icon('megaphone')} ${T('Official notice', 'إعلان رسمي')}</h2>
      ${ops.notice ? `${noticeCard(ops.notice)}<button class="btn btn-ghost btn-sm mt-s" data-act="opsClearNotice">${icon('x')} ${T('Remove notice', 'إزالة الإعلان')}</button>` : `<p class="muted small">${T('No notice is published.', 'لا يوجد إعلان منشور.')}</p>`}
      <form class="mt-s" data-submit="opsNotice" novalidate>
        <label class="field"><span>${T('Message to fans', 'رسالة للمشجعين')}</span><textarea name="text" rows="2" maxlength="180" required placeholder="${T('e.g. Gate 3 queue is long — Gate 1 is quicker.', 'مثال: طابور البوابة 3 طويل — البوابة 1 أسرع.')}"></textarea></label>
        <label class="field"><span>${T('Level', 'المستوى')}</span><select name="level"><option value="info">${T('Information', 'معلومة')}</option><option value="warn">${T('Important', 'مهم')}</option><option value="urgent">${T('Urgent', 'عاجل')}</option></select></label>
        <p class="muted xs">${T('Shown on fan Home, Event guide and Help. This demo does not send push or emergency alerts — use the venue’s official emergency systems for safety messages.', 'يظهر في واجهة المشجع ودليل الفعالية والمساعدة. هذا العرض لا يرسل إشعارات أو تنبيهات طوارئ — استخدم أنظمة الطوارئ الرسمية للملعب لرسائل السلامة.')}</p>
        <button class="btn btn-orange mt-s" type="submit">${T('Publish notice', 'نشر الإعلان')}</button>
      </form>
    </section>
    <section class="panel">
      <h2 class="h3">${icon('store')} ${T('Vendors · pause & capacity', 'البائعون · الإيقاف والسعة')}</h2>
      ${VENDORS.map((v) => `<div class="ctl-row"><span class="grow"><b>${v.emoji} ${L(v.name)}</b><small class="muted block">${activeTasks(v.id)} ${T('active tasks', 'مهام نشطة')}</small></span>
        <div class="stepper" role="group" aria-label="${T('Capacity', 'السعة')} ${esc(L(v.name))}"><button class="icon-btn sm" data-act="opsCap" data-arg="${v.id}:-1" aria-label="${T('Lower capacity', 'خفض السعة')}">${icon('minus')}</button><output>${vendorCap(v.id)}</output><button class="icon-btn sm primary" data-act="opsCap" data-arg="${v.id}:1" aria-label="${T('Raise capacity', 'رفع السعة')}">${icon('plus')}</button></div>
        ${tog(!vendorPaused(v.id), 'opsPauseVendor', v.id, T('Pause', 'إيقاف'), T('Resume', 'استئناف'))}</div>`).join('')}
      <p class="muted xs">${T('Capacity = orders a kitchen prepares at once. It drives estimates and routing.', 'السعة = عدد الطلبات التي يحضرها المطبخ في نفس الوقت، وتؤثر على التقديرات والتوزيع.')}</p>
    </section>
    <section class="panel">
      <h2 class="h3">${icon('pin')} ${T('Pickup points & delivery zones', 'نقاط الاستلام ومناطق التوصيل')}</h2>
      ${PICKUPS.map((p) => `<div class="ctl-row"><span class="grow"><b>${L(p.name)}</b></span>${tog(!S.ops.pausedPickups.includes(p.id), 'opsPausePickup', p.id, T('Pause', 'إيقاف'), T('Resume', 'استئناف'))}</div>`).join('')}
      ${cfg.fulfillment.delivery ? cfg.deliverySections.map((k) => `<div class="ctl-row"><span class="grow"><b>${t('ful.delivery')} · ${T('Section', 'القسم')} ${k}</b></span>${tog(!S.ops.pausedZones.includes(k), 'opsPauseZone', k, T('Pause', 'إيقاف'), T('Resume', 'استئناف'))}</div>`).join('') : `<p class="muted small">${T('Seat delivery is not configured for this event (Venue admin → Event setup).', 'التوصيل للمقعد غير مفعّل لهذه الفعالية (إدارة الملعب ← إعداد الفعالية).')}</p>`}
    </section>
    <section class="panel span-all">
      <div class="block-head"><h2 class="h3">${T('Activity log', 'سجل النشاط')}</h2><small class="muted">${T('Who did what, by role', 'من فعل ماذا حسب الدور')}</small></div>
      ${live('ops-activity', () => activityList(30))}
    </section>
  </div>`;
}

/* ---------- orders ---------- */
function filteredOps() {
  const f = OPS.filters;
  return allOpsOrders().filter((o) => {
    if (f.stage === 'active' ? isFinal(o) : f.stage !== 'all' && o.stage !== f.stage) return false;
    if (f.vendor !== 'all' && !o.tasks.some((x) => x.vid === f.vendor)) return false;
    if (f.section !== 'all' && orderSection(o) !== f.section) return false;
    if (f.dest !== 'all' && (f.dest === 'delivery' ? o.type !== 'delivery' : o.dest !== f.dest)) return false;
    if (f.urgency === 'attention' && !needsAttention(o)) return false;
    if (f.urgency === 'overdue' && !isOverdue(o)) return false;
    if (f.urgency === 'blocked' && !isBlocked(o)) return false;
    return true;
  }).sort((a, b) => (isFinal(a) - isFinal(b)) || (needsAttention(b) - needsAttention(a)) || (elapsedMin(b) - elapsedMin(a)));
}

function opsOrders() {
  const f = OPS.filters;
  const sel = (key, opts) => `<label class="filter"><span>${opts.label}</span><select data-change="opsFilterSel" data-arg="${key}">${opts.list.map(([v, l]) => `<option value="${v}" ${f[key] === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
  const active = Object.entries(f).filter(([, v]) => v !== 'all').length;
  return `<div class="filters panel flat">
      ${sel('stage', { label: T('Status', 'الحالة'), list: [['all', T('All', 'الكل')], ['active', T('Active', 'النشطة')], ...ALL_STAGES.map((s) => [s, stageLabel(s)])] })}
      ${sel('vendor', { label: T('Vendor', 'البائع'), list: [['all', T('All', 'الكل')], ...VENDORS.map((v) => [v.id, L(v.name)])] })}
      ${sel('dest', { label: T('Destination', 'الوجهة'), list: [['all', T('All', 'الكل')], ...PICKUPS.map((p) => [p.id, L(p.name)]), ['delivery', t('ful.delivery')]] })}
      ${sel('section', { label: T('Section', 'القسم'), list: [['all', T('All', 'الكل')], ...Object.keys(SECTIONS).map((k) => [k, k])] })}
      ${sel('urgency', { label: T('Urgency', 'الأولوية'), list: [['all', T('All', 'الكل')], ['attention', T('Needs attention', 'تحتاج متابعة')], ['overdue', T('Overdue', 'متأخرة')], ['blocked', T('Blocked', 'متوقفة')]] })}
      ${active ? `<button class="btn btn-ghost btn-sm" data-act="opsClearFilters">${icon('x')} ${T('Clear', 'مسح')} (${active})</button>` : ''}
    </div>
    <p class="mb-s">${simNote()}</p>
    <div class="ws-split">
      <div class="panel tbl-wrap">${live('ops-table', () => {
        const list = filteredOps();
        if (!list.length) return `<div class="empty sm">${foodTile('🔍')}<p class="muted small">${T('No orders match these filters.', 'لا توجد طلبات مطابقة.')}</p></div>`;
        return `<div class="muted xs tbl-count">${list.length} ${T('orders', 'طلب')}</div>
        <table class="tbl orders-tbl"><thead><tr><th>${T('Order', 'الطلب')}</th><th>${T('Items', 'الأصناف')}</th><th>${T('Destination', 'الوجهة')}</th><th>${T('Elapsed / promised', 'المنقضي / الموعود')}</th><th>${T('Owner', 'المسؤول')}</th><th>${T('Status', 'الحالة')}</th><th>${T('Next action', 'الإجراء التالي')}</th></tr></thead>
        <tbody>${list.slice(0, 24).map((o) => `<tr class="${OPS.sel === o.id ? 'sel' : ''} ${needsAttention(o) ? 'att-row' : ''} ${o.mine ? 'mine' : ''}" data-act="opsOpen" data-arg="${o.id}" tabindex="0" role="button" aria-label="${o.id}">
          <td data-l="${T('Order', 'الطلب')}"><b>${o.id}</b>${o.mine ? ` <span class="st-chip mine">${T('Demo fan', 'المشجع')}</span>` : ''}<small class="muted block">${esc(o.fan || '')}</small></td>
          <td data-l="${T('Items', 'الأصناف')}" class="emoji-cell">${o.items.map((i) => `${item(i.id).emoji}${i.qty > 1 ? '×' + i.qty : ''}`).join(' ')}</td>
          <td data-l="${T('Destination', 'الوجهة')}">${destLabel(o)}</td>
          <td data-l="${T('Elapsed / promised', 'المنقضي / الموعود')}">${timeCell(o)}</td>
          <td data-l="${T('Owner', 'المسؤول')}" class="small">${orderOwner(o)}</td>
          <td data-l="${T('Status', 'الحالة')}">${stChip(o)} ${urgencyChip(o)}</td>
          <td data-l="">${nextActionLabel(o) && !o.issue ? `<button class="btn btn-primary btn-sm" data-act="opsAdvance" data-arg="${o.id}">${nextActionLabel(o)}</button>` : '<span class="muted small">—</span>'}</td></tr>`).join('')}</tbody></table>`;
      })}</div>
      <aside class="panel detail desktop-only">${live('ops-detail', () => (OPS.sel && findOpsOrder(OPS.sel) ? opsDetail(findOpsOrder(OPS.sel)) : `<div class="empty sm">${icon('receipt')}<p class="muted small">${T('Select an order to see notes, history and actions.', 'اختر طلباً لعرض الملاحظات والسجل والإجراءات.')}</p></div>`))}</aside>
    </div>`;
}

function opsDetail(o) {
  const flow = flowOf(o);
  const idx = flow.indexOf(o.stage);
  const blockedWhy = o.issue?.kind === 'soldout' ? T(`${L(item(o.issue.item).name)} became unavailable — waiting for the fan to choose a substitute, removal or cancellation.`, `${L(item(o.issue.item).name)} أصبح غير متاح — بانتظار اختيار المشجع (بديل أو حذف أو إلغاء).`)
    : o.issue?.kind === 'rejected' ? T(`${L(vendor(o.issue.vid).name)} rejected its items — waiting for the fan's choice.`, `${L(vendor(o.issue.vid).name)} رفض أصنافه — بانتظار قرار المشجع.`)
    : o.tasks.some((x) => vendorPaused(x.vid) && x.st < 2) ? T('A vendor on this order is paused. Resume it or reroute the items.', 'أحد بائعي هذا الطلب متوقف. استأنفه أو أعد توجيه الأصناف.') : '';
  return `<div class="detail-in">
    <div class="row between"><h2 class="h2">${o.id}</h2>${stChip(o)}</div>
    ${urgencyChip(o) ? `<div class="mt-xs">${urgencyChip(o)} <span class="muted small">${blockedWhy || (isUnassigned(o) ? T('Assign a runner.', 'عيّن مندوباً.') : T('Past the promised time — prioritise or reroute.', 'تجاوز الوقت الموعود — أعطه أولوية أو أعد توجيهه.'))}</span></div>` : ''}
    <div class="ostrip n${flow.length}">${flow.map((s, i) => `<span class="${o.stage === 'cancelled' ? '' : i < idx ? 'done' : i === idx ? 'now' : ''}">${stageLabel(s)}</span>`).join('')}</div>
    <div class="kv"><span>${T('Fan', 'المشجع')}</span><b>${esc(o.fan || '')}</b></div>
    <div class="kv"><span>${T('Destination', 'الوجهة')}</span><b>${destLabel(o)}</b></div>
    <div class="kv"><span>${T('Elapsed / promised', 'المنقضي / الموعود')}</span><b>${timeCell(o)}</b></div>
    <div class="kv"><span>${T('Current owner', 'المسؤول الحالي')}</span><b>${orderOwner(o)}</b></div>
    <h3 class="h3 mt-s">${T('Items by vendor', 'الأصناف حسب البائع')}</h3>
    ${o.tasks.map((x) => `<div class="vendor-task"><b>${vendor(x.vid).emoji} ${L(vendor(x.vid).name)}</b><span class="st-chip ${x.rejected ? 'blocked' : 's' + Math.min(3, x.st)}">${TASK_LABEL(x)}</span><small class="muted block">${x.items.map((i) => `${i.qty}× ${lineName(i.id, i.opt)}`).join('، ')} · ${L(REASONS[x.reason])}</small>
      ${x.st < 2 && !isFinal(o) ? `<div class="row gap-xs mt-xs wrap"><button class="btn btn-ghost btn-sm" data-act="opsReroute" data-arg="${o.id}:${x.vid}">${icon('swap')} ${T('Reroute', 'إعادة توجيه')}</button><button class="btn btn-ghost btn-sm" data-act="opsUnavailable" data-arg="${x.items[0].id}">${T('Mark item unavailable', 'الصنف غير متوفر')}</button></div>` : ''}</div>`).join('')}
    <h3 class="h3 mt-s">${icon('note')} ${T('Notes', 'الملاحظات')}</h3>
    <p class="small">${o.note ? esc(L(o.note)) : `<span class="muted">${T('No notes from the fan.', 'لا توجد ملاحظات من المشجع.')}</span>`}</p>
    <h3 class="h3 mt-s">${icon('store')} ${T('Handoff', 'التسليم')}</h3>
    <p class="small">${o.type === 'delivery' ? T(`Runner ${o.runner || '—'} delivers to Section ${o.dest}.`, `المندوب ${o.runner || '—'} يوصّل إلى القسم ${o.dest}.`) : T(`Bag all items together at ${L(pickup(o.dest).name)}. Check pickup code ${o.code || '—'}.`, `اجمع كل الأصناف في كيس واحد في ${L(pickup(o.dest).name)}. تحقق من رمز الاستلام ${o.code || '—'}.`)}</p>
    <h3 class="h3 mt-s">${T('History', 'السجل')}</h3>
    <ol class="history">${(o.history || []).map((h) => `<li><b>${stageLabel(h.stage)}</b> <span class="muted small">${actorLabel(h.by)} · ${h.minute < 0 ? T('pre-match', 'قبل المباراة') : h.minute + "'"}${h.note ? ' · ' + esc(h.note) : ''}</span></li>`).join('') || `<li class="muted small">—</li>`}</ol>
    <div class="detail-actions">
      ${nextActionLabel(o) && !o.issue ? `<button class="btn btn-orange" data-act="opsAdvance" data-arg="${o.id}">${nextActionLabel(o)}</button>` : ''}
      ${o.type === 'pickup' && !isFinal(o) ? `<button class="btn btn-ghost btn-sm" data-act="movePickup" data-arg="${o.id}">${icon('swap')} ${T('Move to another pickup point', 'نقل لنقطة استلام أخرى')}</button>` : ''}
      ${o.type === 'delivery' && !isFinal(o) ? `<button class="btn btn-ghost btn-sm" data-act="opsRunner" data-arg="${o.id}">${icon('user')} ${o.runner ? T('Reassign runner', 'تغيير المندوب') : T('Assign runner', 'تعيين مندوب')}</button>` : ''}
      ${!isFinal(o) ? `<button class="btn btn-ghost btn-sm danger" data-act="opsCancel" data-arg="${o.id}">${t('act.cancel')}</button>` : ''}
    </div>
    ${o.mine ? '' : `<p class="muted xs mt-s">${T('Simulated order from a sample fan.', 'طلب محاكى من مشجع نموذجي.')}</p>`}
  </div>`;
}

/* ---------- distribution & runners ---------- */
function opsDistribution() {
  return live('ops-net', () => {
    const active = allOpsOrders().filter((o) => !isFinal(o));
    const o = (OPS.dist && findOpsOrder(OPS.dist)) || active.find((x) => x.mine) || active.find((x) => x.tasks.length > 1) || active[0];
    return `<div class="ws-split">
      <div class="stack">
        <section class="panel">
          <div class="block-head"><h2 class="h3">${icon('route')} ${T('How orders are split', 'كيف تُوزع الطلبات')}</h2></div>
          <p class="muted small">${T('Each item goes to an open vendor that sells it, scored by prep time, active tasks vs capacity and distance to the handoff point. The fan sees one order and one handoff.', 'كل صنف يذهب لبائع مفتوح يبيعه، حسب وقت التحضير والمهام النشطة مقابل السعة والمسافة لنقطة التسليم. والمشجع يرى طلباً واحداً وتسليماً واحداً.')}</p>
          <div class="row gap-xs wrap mt-s" role="group" aria-label="${T('Active orders', 'الطلبات النشطة')}">${active.slice(0, 10).map((x) => `<button class="chip sm ${o && o.id === x.id ? 'on' : ''}" data-act="opsDist" data-arg="${x.id}">${x.id}${x.mine ? ' ★' : ''}${x.tasks.length > 1 ? ` · ${x.tasks.length}` : ''}</button>`).join('')}</div>
          ${o ? `<div class="net">
            <div class="net-col"><small class="muted">${T('Fan order', 'طلب المشجع')}</small><div class="net-node fan"><b>${o.id}</b><small>${o.items.map((i) => item(i.id).emoji).join(' ')} · ${esc(o.fan || '')}</small><small>${stChip(o)}</small></div></div>
            <div class="net-col"><small class="muted">${T('Vendor assignments', 'توزيع البائعين')}</small>${o.tasks.map((x) => `<div class="net-node"><b>${vendor(x.vid).emoji} ${L(vendor(x.vid).name)}</b><small>${x.items.map((i) => item(i.id).emoji + '×' + i.qty).join(' ')} · ${L(REASONS[x.reason])}</small><small><span class="st-chip ${x.rejected ? 'blocked' : 's' + Math.min(3, x.st)}">${TASK_LABEL(x)}</span> · ${activeTasks(x.vid)}/${vendorCap(x.vid)}</small>
              ${x.st < 2 ? `<div class="row gap-xs mt-xs wrap"><button class="btn btn-ghost btn-sm" data-act="opsReroute" data-arg="${o.id}:${x.vid}">${icon('swap')} ${T('Reroute', 'إعادة توجيه')}</button></div>` : ''}</div>`).join('')}</div>
            <div class="net-col"><small class="muted">${T('Handoff & estimate', 'التسليم والوقت')}</small><div class="net-node fan"><b>${o.type === 'delivery' ? '🚚 ' + (o.runner || T('No runner', 'بلا مندوب')) : '🏪 ' + L(pickup(o.dest).name)}</b><small>~${mins(estimate(o))} · ${T('promised', 'الموعود')} ${promisedMin(o)} ${T('min', 'د')}</small>
              ${o.type === 'pickup' ? `<button class="btn btn-glass btn-sm mt-xs" data-act="movePickup" data-arg="${o.id}">${T('Move pickup point', 'نقل نقطة الاستلام')}</button>` : `<button class="btn btn-glass btn-sm mt-xs" data-act="opsRunner" data-arg="${o.id}">${T('Reassign runner', 'تغيير المندوب')}</button>`}</div></div>
          </div>` : `<div class="empty sm">${foodTile('🧾')}<p class="muted small">${T('No active orders.', 'لا توجد طلبات نشطة.')}</p></div>`}
        </section>
      </div>
      <div class="stack">
        <section class="panel"><h2 class="h3">${T('Runners', 'المندوبون')} ${dataBadge('demo')}</h2>
          <ul class="members">${RUNNERS.map((r) => { const ro = allOpsOrders().find((x) => x.runner === r && !isFinal(x) && x.type === 'delivery' && x.stage === 'dispatched'); return `<li><span class="avatar">${r[0]}</span><span class="grow"><b>${r}</b><small>${ro ? T('Delivering', 'يوصّل') + ' ' + ro.id + ' → ' + T('Section', 'القسم') + ' ' + ro.dest : T('Available', 'متاح')}</small></span><span class="st-chip ${ro ? 's1' : 's3'}">${ro ? T('Busy', 'مشغول') : T('Free', 'متاح')}</span></li>`; }).join('')}</ul></section>
      </div>
    </div>`;
  });
}

/* ---------- stock & pickup points ---------- */
function stockTable(items) {
  return `<table class="tbl compact stock-tbl"><thead><tr><th>${T('Item', 'الصنف')}</th><th>${T('Stock', 'المخزون')}</th><th>${T('Status', 'الحالة')}</th><th>${T('Update', 'تحديث')}</th></tr></thead><tbody>
    ${items.map((m) => { const q = S.stock[m.id] ?? 0; const sold = S.soldOut.includes(m.id) || q === 0; return `<tr class="${sold ? 'row-out' : ''}">
      <td data-l="${T('Item', 'الصنف')}">${m.emoji} ${L(m.name)}</td>
      <td data-l="${T('Stock', 'المخزون')}"><b>${q}</b></td>
      <td data-l="${T('Status', 'الحالة')}">${sold ? `<span class="st-chip blocked">${T('Unavailable', 'غير متاح')}</span>` : q < 15 ? `<span class="st-chip overdue">${T('Low', 'منخفض')}</span>` : `<span class="st-chip s3">${T('Available', 'متاح')}</span>`}</td>
      <td data-l=""><div class="row gap-xs"><button class="icon-btn sm" data-act="opsStock" data-arg="${m.id}:-10" aria-label="${T('Remove 10', 'إنقاص 10')}">${icon('minus')}</button><button class="icon-btn sm" data-act="opsStock" data-arg="${m.id}:10" aria-label="${T('Add 10', 'إضافة 10')}">${icon('plus')}</button>
        <button class="btn btn-sm ${sold ? 'btn-primary' : 'btn-ghost'}" data-act="opsToggleStock" data-arg="${m.id}">${sold ? T('Make available', 'إتاحة') : T('Mark unavailable', 'غير متاح')}</button></div></td></tr>`; }).join('')}</tbody></table>`;
}
function opsInventory() {
  const cats = [['all', T('All', 'الكل')], ...MENU_CATS.map((c) => [c.id, L(c.name)])];
  return `<div class="ws-split">
    <section class="panel">
      <div class="block-head"><h2 class="h3">${T('Stock', 'المخزون')} ${dataBadge('demo')}</h2><small class="muted">${T('Low below 15', 'منخفض أقل من 15')}</small></div>
      <div class="tabs sm">${cats.map(([k, l]) => `<button class="tab ${OPS.stockCat === k ? 'on' : ''}" data-act="opsStockCat" data-arg="${k}">${l}</button>`).join('')}</div>
      ${live('ops-stock', () => stockTable(CATALOG.filter((m) => OPS.stockCat === 'all' || m.cat === OPS.stockCat)))}
    </section>
    <section class="panel">
      <div class="block-head"><h2 class="h3">${T('Pickup points', 'نقاط الاستلام')}</h2></div>
      ${live('ops-points', () => PICKUPS.map((p) => { const l = pickupLoad(p.id); const off = !pickupAllowed(p.id); const n = allOpsOrders().filter((o) => !isFinal(o) && o.type === 'pickup' && o.dest === p.id).length; return `<div class="point ${l >= 80 ? 'over' : ''}">
        <div class="row between"><b>${L(p.name)}</b>${off ? `<span class="st-chip svc-paused">${t('svc.paused')}</span>` : `<span class="st-chip ${l >= 80 ? 'blocked' : l >= 50 ? 'overdue' : 's3'}">${l >= 80 ? T('Over capacity', 'تجاوز السعة') : levelWord(l)}</span>`}</div>
        <div class="bar mt-xs"><i class="lvl-bg-${levelKind(l)}" style="width:${l}%"></i></div>
        <div class="point-stats"><span>${T('Load', 'الحمل')} <b>${Math.round(l)}%</b></span><span>${T('Wait', 'الانتظار')} <b>${mins(pickupWait(p.id))}</b></span><span>${T('Orders', 'طلبات')} <b>${n}</b></span></div>
        <div class="row gap-xs wrap mt-xs"><button class="btn btn-sm ${off ? 'btn-primary' : 'btn-ghost'}" data-act="opsPausePickup" data-arg="${p.id}">${off ? T('Resume', 'استئناف') : T('Pause new orders', 'إيقاف الطلبات الجديدة')}</button></div>
      </div>`; }).join(''))}
    </section>
  </div>`;
}

/* ---------- facility tasks & service status ---------- */
const TASK_STATUS = () => ({ open: T('Reported', 'مُبلّغ'), assigned: T('Assigned', 'مُسند'), resolved: T('Resolved', 'تم الحل') });
const facilityChoices = () => DIRECTORY.filter((e) => !['food', 'merch', 'pickup', 'travel'].includes(e.cat) && e.status !== 'not_configured');
function taskWhere(x) {
  if (x.where?.startsWith('sec-')) return T('Section', 'القسم') + ' ' + x.where.slice(4);
  const e = DIRECTORY.find((d) => d.id === x.where);
  return e ? dirName(e) : esc(x.where || '—');
}
function opsFacilities() {
  return `<div class="ws-split">
    <section class="panel">
      <div class="block-head"><h2 class="h3">${T('Tasks', 'المهام')}</h2>${dataBadge('demo')}</div>
      ${live('ops-tasks', () => S.tasks.length ? `<ul class="task-list">${S.tasks.map((x) => `<li class="task ${x.status}">
        <div class="row between wrap gap-xs"><b>${x.kind === 'facility' ? '🚻' : x.kind === 'assist' ? '♿' : x.kind === 'lost' ? '🎒' : '🛠️'} ${taskWhere(x)}</b><span class="st-chip ${x.status === 'resolved' ? 's3' : x.status === 'assigned' ? 's1' : 'overdue'}">${TASK_STATUS()[x.status]}</span></div>
        <small class="muted">${L((ISSUE_TYPES.find((i) => i.id === x.kind) || {}).name) || L(SUPPORT_KINDS[x.kind]?.name) || ''} · ${T('reported by', 'أبلغ عنه')} ${actorLabel(x.by)} · ${x.minute < 0 ? T('pre-match', 'قبل المباراة') : x.minute + "'"}</small>
        ${x.note ? `<p class="small">${esc(x.note)}</p>` : ''}
        ${x.status !== 'resolved' ? `<div class="row gap-xs wrap mt-xs"><label class="filter"><span>${T('Team', 'الفريق')}</span><select data-change="taskTeam" data-arg="${x.id}"><option value="">${T('Unassigned', 'غير مُسند')}</option>${TEAMS_STAFF.map((tm) => `<option value="${tm.id}" ${x.team === tm.id ? 'selected' : ''}>${L(tm.name)}</option>`).join('')}</select></label>
          <button class="btn btn-primary btn-sm" data-act="taskResolve" data-arg="${x.id}">${icon('check')} ${T('Resolve', 'تم الحل')}</button></div>` : `<small class="muted">${x.team ? L(TEAMS_STAFF.find((tm) => tm.id === x.team).name) : ''}</small>`}
      </li>`).join('')}</ul>` : `<p class="muted small">${T('No tasks. Fan reports from Help appear here.', 'لا توجد مهام. بلاغات المشجعين من صفحة المساعدة تظهر هنا.')}</p>`)}
      <form class="mt" data-submit="taskReport" novalidate>
        <h3 class="h3">${T('Report a task', 'إبلاغ عن مهمة')}</h3>
        <div class="row gap wrap">
          <label class="field grow"><span>${T('Where', 'المكان')}</span><select name="where">${facilityChoices().map((e) => `<option value="${e.id}">${dirName(e)}</option>`).join('')}</select></label>
          <label class="field grow"><span>${T('Type', 'النوع')}</span><select name="kind">${ISSUE_TYPES.map((i) => `<option value="${i.id}">${L(i.name)}</option>`).join('')}</select></label>
        </div>
        <label class="field"><span>${T('Note (optional)', 'ملاحظة (اختياري)')}</span><input name="note" maxlength="120"/></label>
        <button class="btn btn-orange mt-s" type="submit">${T('Create task', 'إنشاء مهمة')}</button>
      </form>
    </section>
    <section class="panel">
      <div class="block-head"><h2 class="h3">${T('Service status', 'حالة الخدمات')}</h2><small class="muted">${T('Shown to fans in Explore', 'يظهر للمشجعين في الاستكشاف')}</small></div>
      ${live('ops-svc', () => facilityChoices().map((e) => { const st = dirStatus(e); return `<div class="ctl-row"><span class="grow"><b>${dirName(e)}</b></span>${statusChip(st)}
        <button class="btn btn-sm ${S.svcStatus[e.id] === 'unavailable' ? 'btn-primary' : 'btn-ghost'}" data-act="svcToggle" data-arg="${e.id}">${S.svcStatus[e.id] === 'unavailable' ? T('Restore', 'استعادة') : T('Mark unavailable', 'غير متاح')}</button></div>`; }).join(''))}
    </section>
  </div>`;
}

/* ---------- map ---------- */
function opsMap() {
  return `<div class="ws-split wide-left">
    <div class="panel map-card">${stadiumMap({ id: 'ops-map', detailed: true, facilities: true, ops: true })}${mapLegend(true)}</div>
    <div class="stack">
      <section class="panel"><h2 class="h3">${T('Simulation', 'المحاكاة')} ${dataBadge('demo')}</h2>
        <div class="ctrl-grid">
          <button class="btn ${S.closedRoutes.length ? 'btn-danger' : 'btn-ghost'}" data-act="trigger" data-arg="closure">🚧 ${S.closedRoutes.length ? T('Reopen route', 'فتح الممر') : T('Close a route', 'إغلاق ممر')}</button>
          <button class="btn btn-ghost" data-act="trigger" data-arg="crowd:up">📈 ${T('Crowd surge', 'ارتفاع الكثافة')}</button>
          <button class="btn btn-ghost" data-act="trigger" data-arg="crowd:down">📉 ${T('Crowd eases', 'انخفاض الكثافة')}</button>
          <button class="btn btn-ghost" data-act="toggleHeat">${icon('layers')} ${S.heatmap ? T('Hide crowd', 'إخفاء الكثافة') : T('Show crowd', 'إظهار الكثافة')}</button>
        </div></section>
      <section class="panel">${live('ops-demand', () => { const act = allOpsOrders().filter((o) => !isFinal(o)); return `<h2 class="h3">${T('Demand by area', 'الطلب حسب المنطقة')}</h2>
        <ul class="zone-list">${['A', 'B', 'C'].map((k) => `<li><span>${T('Section', 'القسم')} ${k}</span><span class="bar"><i class="lvl-bg-${levelKind(S.crowd[k])}" style="width:${S.crowd[k]}%"></i></span><b>${act.filter((o) => orderSection(o) === k).length} ${T('orders', 'طلب')}</b></li>`).join('')}
        ${PICKUPS.map((p) => `<li><span>${L(p.name)}</span><span class="bar"><i class="lvl-bg-${levelKind(pickupLoad(p.id))}" style="width:${pickupLoad(p.id)}%"></i></span><b>${Math.round(pickupLoad(p.id))}%</b></li>`).join('')}</ul>
        <p class="muted xs mt-s">${T('Illustrative diagram with simulated crowd levels — not a live venue map.', 'رسم توضيحي بكثافة محاكاة — ليس خريطة مباشرة للملعب.')}</p>`; })}</section>
    </div>
  </div>`;
}

/* ---------- actions ---------- */
function toggleIn(list, v) { return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]; }
const OPS_ACTIONS = {
  opsFilter: (a) => { const [k, v] = a.split(':'); OPS.filters = { stage: 'all', vendor: 'all', dest: 'all', section: 'all', urgency: 'all', [k]: v }; go('ops/orders'); },
  opsClearFilters: () => { OPS.filters = { stage: 'all', vendor: 'all', dest: 'all', section: 'all', urgency: 'all' }; rerender(); },
  opsOpen: (id) => {
    OPS.sel = id;
    if (window.innerWidth < 1280 || route().arg !== 'orders') openSheet(() => (findOpsOrder(id) ? opsDetail(findOpsOrder(id)) : ''), { live: true, label: id });
    rerender();
  },
  opsDist: (id) => { OPS.dist = id; rerender(); },
  opsAdvance: (id) => {
    const o = findOpsOrder(id);
    if (!o || o.issue || !advanceOrder(o, S.role)) { toast(T('That step is not allowed for this order.', 'هذه الخطوة غير مسموحة لهذا الطلب.'), 'error'); return; }
    toast(`${o.id} → ${stageLabel(o.stage)}`, 'success', 1800);
    commit();
  },
  opsStockCat: (c) => { OPS.stockCat = c; rerender(); },
  opsStock: (a) => {
    const [id, d] = a.split(':');
    S.stock[id] = Math.max(0, (S.stock[id] || 0) + +d);
    if (S.stock[id] > 0 && S.soldOut.includes(id)) S.soldOut = S.soldOut.filter((x) => x !== id);
    if (S.stock[id] === 0 && !S.soldOut.includes(id)) S.soldOut.push(id);
    logActivity(S.role, `${L(item(id).name)}: ${T('stock', 'المخزون')} ${S.stock[id]}`);
    commit();
  },
  opsToggleStock: (id) => {
    if (S.soldOut.includes(id) || S.stock[id] === 0) { S.soldOut = S.soldOut.filter((x) => x !== id); S.stock[id] = Math.max(S.stock[id] || 0, 40); logActivity(S.role, `${L(item(id).name)} ${T('available again', 'متاح مجدداً')}`); toast(T('Item available again', 'الصنف متاح مجدداً'), 'success'); commit(); }
    else { logActivity(S.role, `${L(item(id).name)} ${T('marked unavailable', 'غير متاح')}`); trigger('soldout', id); }
  },
  opsUnavailable: (id) => { logActivity(S.role, `${L(item(id).name)} ${T('marked unavailable', 'غير متاح')}`); trigger('soldout', id); },
  opsReroute: (a) => {
    const [oid, vid] = a.split(':');
    const o = findOpsOrder(oid);
    const tk = o.tasks.find((x) => x.vid === vid);
    const alt = VENDORS.filter((v) => v.id !== vid && !vendorPaused(v.id) && tk.items.every((i) => v.cats.includes(item(i.id).cat))).sort((a, b) => activeTasks(a.id) / vendorCap(a.id) - activeTasks(b.id) / vendorCap(b.id))[0];
    if (!alt) { toast(T('No other open vendor can make these items.', 'لا يوجد بائع مفتوح آخر لهذه الأصناف.'), 'warn'); return; }
    const ex = o.tasks.find((x) => x.vid === alt.id);
    if (ex) { ex.items.push(...tk.items); o.tasks = o.tasks.filter((x) => x !== tk); } else Object.assign(tk, { vid: alt.id, reason: 'load', st: 0, acc: false, prog: 0, rejected: false });
    if (o.issue?.kind === 'rejected' && o.issue.vid === vid) o.issue = null;
    logActivity(S.role, `${oid}: ${L(vendor(vid).name)} → ${L(alt.name)}`);
    toast(T(`Rerouted to ${L(alt.name)}`, `أعيد التوجيه إلى ${L(alt.name)}`), 'success');
    commit();
  },
  opsRunner: (id) => {
    const o = findOpsOrder(id);
    const busy = new Set(allOpsOrders().filter((x) => !isFinal(x) && x.type === 'delivery' && x !== o).map((x) => x.runner));
    o.runner = RUNNERS.find((r) => r !== o.runner && !busy.has(r)) || RUNNERS.find((r) => r !== o.runner);
    logActivity(S.role, `${id}: ${T('runner', 'المندوب')} ${o.runner}`);
    toast(T(`${id} assigned to ${o.runner}`, `تم تعيين ${o.runner} للطلب ${id}`), 'success');
    commit();
  },
  opsCancel: (id) => {
    const o = findOpsOrder(id);
    confirmSheet({ title: T(`Cancel ${id}?`, `إلغاء ${id}؟`), body: T('The fan is told the order was cancelled by the venue. In this demo no refund is processed.', 'سيُبلّغ المشجع بأن الملعب ألغى الطلب. في هذا العرض لا تتم معالجة أي استرداد.'), ok: t('act.cancel'), danger: true,
      onOk: () => { cancelOrder(o, S.role, T('Cancelled by venue', 'ألغاه الملعب')); o.issue = null; commit(); } });
  },
  opsOrdering: () => { S.ops.ordering = !S.ops.ordering; logActivity(S.role, S.ops.ordering ? T('Ordering opened', 'تم فتح الطلب') : T('Ordering closed', 'تم إغلاق الطلب')); commit(); },
  opsPhase: (p) => {
    if (p === 'cancelled') {
      if (S.ops.cancelled) return;
      confirmSheet({ title: T('Cancel this event?', 'إلغاء هذه الفعالية؟'), body: T('Ordering closes, open orders are cancelled and fans see a cancellation notice. You can undo this in the demo.', 'يُغلق الطلب وتُلغى الطلبات المفتوحة ويرى المشجعون إعلان الإلغاء. يمكن التراجع في العرض التجريبي.'), ok: T('Cancel event', 'إلغاء الفعالية'), danger: true,
        onOk: () => {
          S.ops.cancelled = true;
          allOpsOrders().filter((o) => !isFinal(o)).forEach((o) => { cancelOrder(o, S.role, T('Event cancelled', 'أُلغيت الفعالية')); o.issue = null; });
          S.ops.notice = { text: T('This event has been cancelled. Please follow official venue channels for updates.', 'تم إلغاء هذه الفعالية. يرجى متابعة القنوات الرسمية للملعب للتحديثات.'), level: 'urgent', by: S.role, minute: S.match.minute, at: Date.now() };
          logActivity(S.role, T('Event cancelled', 'تم إلغاء الفعالية'));
          commit();
        } });
      return;
    }
    if (S.ops.cancelled) { S.ops.cancelled = false; if (S.ops.notice?.level === 'urgent') S.ops.notice = null; logActivity(S.role, T('Event cancellation undone', 'تم التراجع عن الإلغاء')); }
    logActivity(S.role, `${T('Phase', 'المرحلة')} → ${t('ev.' + p)}`);
    if (p === 'scheduled') trigger('phase', 'prematch');
    else if (p === 'live') trigger('phase', S.match.phase === 'halftime' || S.match.minute >= 45 ? 'second' : 'kickoff');
    else if (p === 'halftime') trigger('halftime');
    else if (p === 'post') trigger('final');
  },
  opsClearNotice: () => { S.ops.notice = null; logActivity(S.role, T('Notice removed', 'أزيل الإعلان')); commit(); },
  opsPauseVendor: (vid) => { S.ops.pausedVendors = toggleIn(S.ops.pausedVendors, vid); logActivity(S.role, `${L(vendor(vid).name)} ${vendorPaused(vid) ? T('paused', 'متوقف') : T('resumed', 'استؤنف')}`); commit(); },
  opsPausePickup: (pid) => { S.ops.pausedPickups = toggleIn(S.ops.pausedPickups, pid); logActivity(S.role, `${L(pickup(pid).name)} ${S.ops.pausedPickups.includes(pid) ? T('paused', 'متوقف') : T('resumed', 'استؤنف')}`); if (S.cart.dest === pid) S.cart.dest = null; commit(); },
  opsPauseZone: (k) => { S.ops.pausedZones = toggleIn(S.ops.pausedZones, k); logActivity(S.role, `${t('ful.delivery')} ${k} ${S.ops.pausedZones.includes(k) ? T('paused', 'متوقف') : T('resumed', 'استؤنف')}`); commit(); },
  opsCap: (a) => { const [vid, d] = a.split(':'); S.venueCfg.capacity[vid] = clamp(vendorCap(vid) + +d, 1, 30); logActivity(S.role, `${L(vendor(vid).name)}: ${T('capacity', 'السعة')} ${vendorCap(vid)}`); commit(); },
  taskResolve: (id) => { const x = S.tasks.find((k) => k.id === id); x.status = 'resolved'; if (x.kind !== 'assist' && x.kind !== 'lost' && S.svcStatus[x.where] === 'unavailable') delete S.svcStatus[x.where]; logActivity(S.role, `${T('Task resolved', 'تم حل المهمة')}: ${taskWhere(x)}`); commit(); },
  svcToggle: (id) => {
    const e = DIRECTORY.find((d) => d.id === id);
    if (S.svcStatus[id] === 'unavailable') { delete S.svcStatus[id]; logActivity(S.role, `${dirName(e)} ${T('restored', 'تمت استعادته')}`); }
    else { S.svcStatus[id] = 'unavailable'; logActivity(S.role, `${dirName(e)} ${T('marked unavailable', 'غير متاح')}`); }
    commit();
  },
};
const OPS_CHANGES = {
  opsFilterSel: (v, el) => { OPS.filters[el.dataset.arg] = v; rerender(); },
  opsCutoff: (v) => { S.venueCfg.cutoffMinute = clamp(+v || 80, 46, 90); logActivity(S.role, `${T('Last orders at', 'آخر طلب عند')} ${S.venueCfg.cutoffMinute}'`); commit(); },
  taskTeam: (v, el) => { const x = S.tasks.find((k) => k.id === el.dataset.arg); x.team = v || null; x.status = v ? 'assigned' : 'open'; logActivity(S.role, `${taskWhere(x)} → ${v ? L(TEAMS_STAFF.find((tm) => tm.id === v).name) : T('unassigned', 'غير مُسند')}`); commit(); },
};
const OPS_SUBMITS = {
  opsNotice: (form) => {
    const text = form.text.value.trim();
    if (!text) { form.text.setAttribute('aria-invalid', 'true'); form.text.focus(); toast(T('Write the notice first.', 'اكتب الإعلان أولاً.'), 'error'); return; }
    S.ops.notice = { text: text.slice(0, 180), level: form.level.value, by: S.role, minute: S.match.minute, at: Date.now() };
    logActivity(S.role, `${T('Notice published', 'نُشر إعلان')}: ${text.slice(0, 60)}`);
    commit(); toast(T('Notice published to fans (in-app only).', 'نُشر الإعلان للمشجعين (داخل التطبيق فقط).'), 'success');
  },
  taskReport: (form) => {
    const kind = form.kind.value;
    S.tasks.unshift({ id: uid('tk'), kind, where: form.where.value, by: S.role, at: Date.now(), minute: S.match.minute, status: 'open', team: null, note: form.note.value.trim().slice(0, 120) });
    if (kind === 'service') S.svcStatus[form.where.value] = 'unavailable';
    logActivity(S.role, `${T('Task reported', 'بلاغ مهمة')}: ${taskWhere(S.tasks[0])}`);
    commit();
  },
};
