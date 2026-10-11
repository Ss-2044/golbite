/* GolBite — Venue Control Center: overview, orders, smart distribution & runners, inventory & handoff points, map operations. */

let OPS = { filters: { status: 'all', vendor: 'all', section: 'all', pickup: 'all', urgency: 'all' }, sel: null, dist: null, stockCat: 'all' };
const OPS_STATUS = () => [T('Received', 'مستلم'), T('Preparing', 'قيد التحضير'), T('Ready', 'جاهز'), T('Handed over', 'تم التسليم')];
const OPS_NAV = [
  ['overview', 'chart', { en: 'Overview', ar: 'نظرة عامة' }],
  ['orders', 'receipt', { en: 'Orders', ar: 'الطلبات' }],
  ['distribution', 'route', { en: 'Distribution', ar: 'التوزيع' }],
  ['inventory', 'store', { en: 'Stock & pickup', ar: 'المخزون والاستلام' }],
  ['map', 'map', { en: 'Map', ar: 'الخريطة' }],
];

function allOpsOrders() {
  return [...S.orders.filter((o) => o.eventId === currentEvent().id || !o.eventId).map((o) => Object.assign(o, { fan: S.user?.name || 'Fan', mine: true })), ...S.opsOrders];
}
const findOpsOrder = (id) => S.orders.find((x) => x.id === id) || S.opsOrders.find((x) => x.id === id);
const opsStage = (o) => Math.min(...o.tasks.map((t) => t.st));
function orderSection(o) {
  if (o.type === 'delivery') return o.dest;
  const a = pickup(o.dest).angle;
  return Object.values(SECTIONS).sort((x, y) => angDist(x.angle, a) - angDist(y.angle, a))[0].id;
}
const destLabel = (o) => (o.type === 'delivery' ? `${T('Seat delivery', 'توصيل')} · ${T('Section', 'القسم')} ${o.dest}` : L(pickup(o.dest)?.name));
const timeCell = (o) => `<span class="time-cell ${isOverdue(o) ? 'late' : ''}"><b>${elapsedMin(o)}</b>/${promisedMin(o)} ${T('min', 'د')}</span>`;
function urgencyChip(o) {
  if (o.status >= 3) return '';
  if (isBlocked(o)) return `<span class="st-chip blocked">${T('Blocked', 'متوقف')}</span>`;
  if (isOverdue(o)) return `<span class="st-chip overdue">${T('Overdue', 'متأخر')}</span>`;
  return '';
}
const stChip = (o) => `<span class="st-chip s${opsStage(o)}">${OPS_STATUS()[Math.min(3, opsStage(o))]}</span>`;

function viewOps(tab) {
  tab = OPS_NAV.some(([k]) => k === tab) ? tab : 'overview';
  const body = { overview: opsOverview, orders: opsOrders, distribution: opsDistribution, inventory: opsInventory, map: opsMap }[tab]();
  return `<section class="page wide ws">
    <div class="ws-head">
      <div><small class="eyebrow">${T('Venue Control Center', 'مركز التحكم بالملعب')}</small><h1 class="title">${L(OPS_NAV.find(([k]) => k === tab)[2])}</h1></div>
      ${live('ops-context', () => `<div class="ws-context">${pill(L(currentEvent().title))}${pill(phaseLabel() + (S.match.minute >= 0 ? ` · ${S.match.minute}'` : ''), 'brand')}<span class="muted xs">${T('This match · simulated data', 'هذه المباراة · بيانات محاكاة')}</span></div>`)}
    </div>
    ${body}
  </section>`;
}

/* ---------- overview ---------- */
function opsOverview() {
  return live('ops-overview', () => {
    const all = allOpsOrders();
    const active = all.filter((o) => o.status < 3);
    const attention = active.filter(needsAttention);
    const avg = active.length ? active.reduce((s, o) => s + estimate(o), 0) / active.length : 0;
    const placed = Object.values(S.opsStats.byPhase).reduce((a, b) => a + b, 0);
    const maxP = Math.max(1, ...PHASES.map((p) => S.opsStats.byPhase[p] || 0));
    const busyPickups = PICKUPS.slice().sort((a, b) => pickupLoad(b.id) - pickupLoad(a.id));
    const busySections = ['A', 'B', 'C'].map((k) => ({ k, crowd: S.crowd[k], n: active.filter((o) => orderSection(o) === k).length })).sort((a, b) => b.crowd - a.crowd);
    return `<div class="kpis">
      ${kpi(T('Active orders', 'طلبات نشطة'), active.length, T('in progress now', 'قيد التنفيذ الآن'))}
      ${kpi(T('Average wait', 'متوسط الانتظار'), mins(avg), T('estimated, active orders', 'تقديري للطلبات النشطة'), avg > 10 ? 'busy' : avg > 6 ? 'mid' : 'calm')}
      ${kpi(T('Completed', 'مكتملة'), S.opsStats.completed, T('this match', 'هذه المباراة'))}
      <button class="kpi ${attention.length ? 'kpi-alert' : ''}" data-act="opsFilter" data-arg="urgency:attention"><span class="kpi-l">${T('Needs attention', 'تحتاج متابعة')}</span><b class="kpi-v">${attention.length}</b><small>${T('overdue or blocked', 'متأخرة أو متوقفة')} ${icon('chevron', 'flip')}</small></button>
      ${kpi(T('Orders placed', 'طلبات مستلمة'), placed, T('= completed + active', '= مكتملة + نشطة'))}
    </div>
    <div class="ws-grid">
      <section class="panel">
        <div class="block-head"><h2 class="h3">${T('Vendor workload', 'ضغط عمل البائعين')}</h2><small class="muted">${T('% of kitchen capacity', '% من سعة المطبخ')}</small></div>
        <ul class="zone-list">${VENDORS.map((v) => `<li><span>${v.emoji} ${L(v.name)}</span><span class="bar"><i class="lvl-bg-${levelKind(S.vendorLoad[v.id])}" style="width:${S.vendorLoad[v.id]}%"></i></span><b>${Math.round(S.vendorLoad[v.id])}%</b></li>`).join('')}</ul>
      </section>
      <section class="panel">
        <div class="block-head"><h2 class="h3">${T('Pickup points', 'نقاط الاستلام')}</h2><button class="link" data-act="go" data-arg="ops/inventory">${T('Manage', 'إدارة')} ${icon('chevron', 'flip')}</button></div>
        <table class="tbl compact"><thead><tr><th>${T('Point', 'النقطة')}</th><th>${T('Load', 'الحمل')}</th><th>${T('Queue', 'الطابور')}</th><th>${T('Wait', 'الانتظار')}</th></tr></thead>
          <tbody>${busyPickups.map((p) => `<tr><td>${L(p.name)}</td><td><span class="lvl-${levelKind(pickupLoad(p.id))}">${Math.round(pickupLoad(p.id))}%</span></td><td>${Math.round(pickupLoad(p.id) / 3)}</td><td>${mins(pickupWait(p.id))}</td></tr>`).join('')}</tbody></table>
      </section>
      <section class="panel">
        <div class="block-head"><h2 class="h3">${T('Busy sections', 'الأقسام المزدحمة')}</h2></div>
        <table class="tbl compact"><thead><tr><th>${T('Section', 'القسم')}</th><th>${T('Crowd', 'الكثافة')}</th><th>${T('Active orders', 'طلبات نشطة')}</th></tr></thead>
          <tbody>${busySections.map((s) => `<tr><td>${s.k}</td><td><span class="lvl-${levelKind(s.crowd)}">${levelWord(s.crowd)}</span></td><td>${s.n}</td></tr>`).join('')}</tbody></table>
      </section>
      <section class="panel">
        <div class="block-head"><h2 class="h3">${T('Orders by match moment', 'الطلبات حسب لحظة المباراة')}</h2><small class="muted">${T('Total', 'المجموع')} ${placed}</small></div>
        <div class="vbars">${PHASES.map((p) => `<div class="vbar ${S.match.phase === p ? 'now' : ''}"><b>${S.opsStats.byPhase[p] || 0}</b><i style="height:${((S.opsStats.byPhase[p] || 0) / maxP) * 100}%"></i><small>${phaseLabel(p)}</small></div>`).join('')}</div>
      </section>
      <section class="panel span-2">
        <div class="block-head"><h2 class="h3">${icon('alert')} ${T('Needs attention', 'تحتاج متابعة')}</h2><button class="link" data-act="opsFilter" data-arg="urgency:attention">${T('View all', 'عرض الكل')} ${icon('chevron', 'flip')}</button></div>
        ${attention.length ? `<div class="att-list">${attention.slice(0, 5).map((o) => `<div class="att"><b>${o.id}</b>${urgencyChip(o)}<span class="muted small grow">${destLabel(o)} · ${orderOwner(o)}</span>${timeCell(o)}<button class="btn btn-primary btn-sm" data-act="opsOpen" data-arg="${o.id}">${T('Open', 'فتح')}</button></div>`).join('')}</div>`
          : `<p class="muted small">${T('All orders are on time.', 'كل الطلبات في وقتها.')}</p>`}
      </section>
    </div>`;
  });
}
function kpi(label, value, sub, kind = '') {
  return `<div class="kpi ${kind ? 'kpi-' + kind : ''}"><span class="kpi-l">${label}</span><b class="kpi-v">${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
}

/* ---------- orders ---------- */
function filteredOps() {
  const f = OPS.filters;
  return allOpsOrders().filter((o) => {
    const st = opsStage(o);
    if (f.status === 'active' ? o.status >= 3 : f.status !== 'all' && String(Math.min(3, st)) !== f.status) return false;
    if (f.vendor !== 'all' && !o.tasks.some((t) => t.vid === f.vendor)) return false;
    if (f.section !== 'all' && orderSection(o) !== f.section) return false;
    if (f.pickup !== 'all' && (f.pickup === 'delivery' ? o.type !== 'delivery' : o.dest !== f.pickup)) return false;
    if (f.urgency === 'attention' && !needsAttention(o)) return false;
    if (f.urgency === 'overdue' && !isOverdue(o)) return false;
    if (f.urgency === 'blocked' && !isBlocked(o)) return false;
    return true;
  }).sort((a, b) => (needsAttention(b) - needsAttention(a)) || (a.status - b.status) || (elapsedMin(b) - elapsedMin(a)));
}

function opsOrders() {
  const f = OPS.filters;
  const sel = (key, opts) => `<label class="filter"><span>${opts.label}</span><select data-change="opsFilterSel" data-arg="${key}">${opts.list.map(([v, l]) => `<option value="${v}" ${f[key] === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
  const active = Object.entries(f).filter(([, v]) => v !== 'all').length;
  return `<div class="filters panel flat">
      ${sel('status', { label: T('Status', 'الحالة'), list: [['all', T('All', 'الكل')], ['active', T('Active', 'النشطة')], ...OPS_STATUS().map((l, i) => [String(i), l])] })}
      ${sel('vendor', { label: T('Vendor', 'البائع'), list: [['all', T('All', 'الكل')], ...VENDORS.map((v) => [v.id, L(v.name)])] })}
      ${sel('section', { label: T('Section', 'القسم'), list: [['all', T('All', 'الكل')], ...Object.keys(SECTIONS).map((k) => [k, k])] })}
      ${sel('pickup', { label: T('Handoff', 'التسليم'), list: [['all', T('All', 'الكل')], ...PICKUPS.map((p) => [p.id, L(p.name)]), ['delivery', T('Seat delivery', 'توصيل للمقعد')]] })}
      ${sel('urgency', { label: T('Urgency', 'الأولوية'), list: [['all', T('All', 'الكل')], ['attention', T('Needs attention', 'تحتاج متابعة')], ['overdue', T('Overdue', 'متأخرة')], ['blocked', T('Blocked', 'متوقفة')]] })}
      ${active ? `<button class="btn btn-ghost btn-sm" data-act="opsClearFilters">${icon('x')} ${T('Clear', 'مسح')} (${active})</button>` : ''}
    </div>
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
          <td data-l="">${nextActionLabel(o) && o.status < 3 ? `<button class="btn btn-primary btn-sm" data-act="opsAdvance" data-arg="${o.id}">${nextActionLabel(o)}</button>` : '<span class="muted small">—</span>'}</td></tr>`).join('')}</tbody></table>`;
      })}</div>
      <aside class="panel detail desktop-only">${live('ops-detail', () => (OPS.sel && findOpsOrder(OPS.sel) ? opsDetail(findOpsOrder(OPS.sel)) : `<div class="empty sm">${icon('receipt')}<p class="muted small">${T('Select an order to see notes, handoff instructions and actions.', 'اختر طلباً لعرض الملاحظات وتعليمات التسليم والإجراءات.')}</p></div>`))}</aside>
    </div>`;
}

function opsDetail(o) {
  const st = opsStage(o);
  return `<div class="detail-in">
    <div class="row between"><h2 class="h2">${o.id}</h2>${stChip(o)}</div>
    ${urgencyChip(o) ? `<div class="mt-xs">${urgencyChip(o)} <span class="muted small">${isBlocked(o) ? T('Item unavailable — offer the fan an alternative or reroute.', 'صنف غير متوفر — اقترح بديلاً أو أعد التوجيه.') : T('Past the promised time — prioritise or reroute.', 'تجاوز الوقت الموعود — أعطه أولوية أو أعد التوجيه.')}</span></div>` : ''}
    <div class="ostrip">${OPS_STATUS().map((l, i) => `<span class="${i < Math.min(3, st) ? 'done' : i === Math.min(3, st) ? 'now' : ''}">${l}</span>`).join('')}</div>
    <div class="kv"><span>${T('Fan', 'المشجع')}</span><b>${esc(o.fan || '')}</b></div>
    <div class="kv"><span>${T('Destination', 'الوجهة')}</span><b>${destLabel(o)}</b></div>
    <div class="kv"><span>${T('Elapsed / promised', 'المنقضي / الموعود')}</span><b>${timeCell(o)}</b></div>
    <div class="kv"><span>${T('Current owner', 'المسؤول الحالي')}</span><b>${orderOwner(o)}</b></div>
    <h3 class="h3 mt-s">${T('Items by vendor', 'الأصناف حسب البائع')}</h3>
    ${o.tasks.map((t) => `<div class="vendor-task"><b>${vendor(t.vid).emoji} ${L(vendor(t.vid).name)}</b><span class="st-chip s${t.st}">${OPS_STATUS()[t.st]}</span><small class="muted block">${t.items.map((i) => `${i.qty}× ${lineName(i.id, i.opt)}`).join('، ')} · ${L(REASONS[t.reason])}</small>
      ${t.st < 2 && o.mine ? `<button class="btn btn-ghost btn-sm mt-xs" data-act="opsReroute" data-arg="${o.id}:${t.vid}">${icon('swap')} ${T('Reroute', 'إعادة توجيه')}</button>` : ''}</div>`).join('')}
    <h3 class="h3 mt-s">${icon('note')} ${T('Notes', 'الملاحظات')}</h3>
    <p class="small">${o.note ? esc(L(o.note)) : `<span class="muted">${T('No notes from the fan.', 'لا توجد ملاحظات من المشجع.')}</span>`}</p>
    <h3 class="h3 mt-s">${icon('store')} ${T('Handoff', 'التسليم')}</h3>
    <p class="small">${o.type === 'delivery' ? T(`Runner ${o.runner} delivers to Section ${o.dest}. Call out ${o.id} at the row.`, `المندوب ${o.runner} يوصّل إلى القسم ${o.dest}. نادِ ${o.id} عند الصف.`) : T(`Bag all vendors' items together at ${L(pickup(o.dest).name)}. Check pickup code ${o.code || '—'}.`, `اجمع أصناف كل البائعين في كيس واحد في ${L(pickup(o.dest).name)}. تحقق من رمز الاستلام ${o.code || '—'}.`)}</p>
    <div class="detail-actions">
      ${nextActionLabel(o) && o.status < 3 ? `<button class="btn btn-orange" data-act="opsAdvance" data-arg="${o.id}">${nextActionLabel(o)}</button>` : ''}
      ${o.type === 'pickup' && o.status < 3 ? `<button class="btn btn-ghost btn-sm" data-act="movePickup" data-arg="${o.id}">${icon('swap')} ${T('Move to', 'نقل إلى')} ${L(bestPickup(o.dest).name)}</button>` : ''}
      ${o.type === 'delivery' && o.status < 3 ? `<button class="btn btn-ghost btn-sm" data-act="opsRunner" data-arg="${o.id}">${icon('user')} ${T('Reassign runner', 'تغيير المندوب')}</button>` : ''}
    </div>
  </div>`;
}

/* ---------- smart distribution & runners ---------- */
function opsDistribution() {
  return live('ops-net', () => {
    const active = allOpsOrders().filter((o) => o.status < 3);
    const o = (OPS.dist && findOpsOrder(OPS.dist)) || active.find((x) => x.mine) || active.find((x) => x.tasks.length > 1) || active[0];
    return `<div class="ws-split">
      <div class="stack">
        <section class="panel">
          <div class="block-head"><h2 class="h3">${icon('route')} ${T('Smart Fulfillment Network', 'شبكة التوزيع الذكية')}</h2></div>
          <p class="muted small">${T('Each item goes to the best vendor by stock, prep time, distance and workload. The fan always sees one combined order and one handoff.', 'كل صنف يذهب لأفضل بائع حسب المخزون ووقت التحضير والمسافة والضغط. والمشجع يرى طلباً واحداً وتسليماً واحداً.')}</p>
          <div class="row gap-xs wrap mt-s" role="group" aria-label="${T('Active orders', 'الطلبات النشطة')}">${active.slice(0, 10).map((x) => `<button class="chip sm ${o && o.id === x.id ? 'on' : ''}" data-act="opsDist" data-arg="${x.id}">${x.id}${x.mine ? ' ★' : ''}${x.tasks.length > 1 ? ` · ${x.tasks.length}` : ''}</button>`).join('')}</div>
          ${o ? `<div class="net">
            <div class="net-col"><small class="muted">${T('Fan order', 'طلب المشجع')}</small><div class="net-node fan"><b>${o.id}</b><small>${o.items.map((i) => item(i.id).emoji).join(' ')} · ${esc(o.fan || '')}</small></div></div>
            <div class="net-col"><small class="muted">${T('Vendor assignments', 'توزيع البائعين')}</small>${o.tasks.map((t) => `<div class="net-node"><b>${vendor(t.vid).emoji} ${L(vendor(t.vid).name)}</b><small>${t.items.map((i) => item(i.id).emoji + '×' + i.qty).join(' ')} · ${L(REASONS[t.reason])}</small><small><span class="st-chip s${t.st}">${OPS_STATUS()[t.st]}</span> · ${T('load', 'الضغط')} ${Math.round(S.vendorLoad[t.vid])}%</small>
              ${t.st < 2 ? `<div class="row gap-xs mt-xs wrap"><button class="btn btn-ghost btn-sm" data-act="opsReroute" data-arg="${o.id}:${t.vid}">${icon('swap')} ${T('Reroute', 'إعادة توجيه')}</button><button class="btn btn-ghost btn-sm" data-act="opsUnavailable" data-arg="${t.items[0].id}">${T('Mark unavailable', 'غير متوفر')}</button></div>` : ''}</div>`).join('')}</div>
            <div class="net-col"><small class="muted">${T('Handoff & ETA', 'التسليم والوقت')}</small><div class="net-node fan"><b>${o.type === 'delivery' ? '🚚 ' + o.runner : '🏪 ' + L(pickup(o.dest).name)}</b><small>${T('Updated ETA', 'الوقت المحدّث')} ~${mins(estimate(o))} · ${T('promised', 'الموعود')} ${promisedMin(o)} ${T('min', 'د')}</small>
              ${o.type === 'pickup' ? `<button class="btn btn-glass btn-sm mt-xs" data-act="movePickup" data-arg="${o.id}">${T('Move to', 'نقل إلى')} ${L(bestPickup(o.dest).name)}</button>` : `<button class="btn btn-glass btn-sm mt-xs" data-act="opsRunner" data-arg="${o.id}">${T('Reassign runner', 'تغيير المندوب')}</button>`}</div></div>
          </div>` : `<div class="empty sm">${foodTile('🧾')}<p class="muted small">${T('No active orders.', 'لا توجد طلبات نشطة.')}</p></div>`}
        </section>
      </div>
      <div class="stack">
        <section class="panel"><h2 class="h3">${T('Runners', 'المندوبون')}</h2>
          <ul class="members">${RUNNERS.map((r) => { const ro = allOpsOrders().find((x) => x.runner === r && x.status < 3 && x.type === 'delivery'); return `<li><span class="avatar">${r[0]}</span><span class="grow"><b>${r}</b><small>${ro ? T('Delivering', 'يوصّل') + ' ' + ro.id + ' → ' + T('Section', 'القسم') + ' ' + ro.dest : T('Available', 'متاح')}</small></span><span class="st-chip ${ro ? 's1' : 's3'}">${ro ? T('Busy', 'مشغول') : T('Free', 'متاح')}</span></li>`; }).join('')}</ul></section>
        <section class="panel"><h2 class="h3">${T('Vendor workload', 'ضغط عمل البائعين')}</h2>
          <ul class="zone-list">${VENDORS.map((v) => `<li><span>${v.emoji} ${L(v.name)}</span><span class="bar"><i class="lvl-bg-${levelKind(S.vendorLoad[v.id])}" style="width:${S.vendorLoad[v.id]}%"></i></span><b>${Math.round(S.vendorLoad[v.id])}%</b></li>`).join('')}</ul></section>
      </div>
    </div>`;
  });
}

/* ---------- inventory & handoff points ---------- */
function opsInventory() {
  const cats = [['all', T('All', 'الكل')], ...MENU_CATS.map((c) => [c.id, L(c.name)])];
  return `<div class="ws-split">
    <section class="panel">
      <div class="block-head"><h2 class="h3">${T('Inventory', 'المخزون')}</h2><small class="muted">${T('Low below 15', 'منخفض أقل من 15')}</small></div>
      <div class="tabs sm">${cats.map(([k, l]) => `<button class="tab ${OPS.stockCat === k ? 'on' : ''}" data-act="opsStockCat" data-arg="${k}">${l}</button>`).join('')}</div>
      ${live('ops-stock', () => `<table class="tbl compact stock-tbl"><thead><tr><th>${T('Item', 'الصنف')}</th><th>${T('Stock', 'المخزون')}</th><th>${T('Status', 'الحالة')}</th><th>${T('Update', 'تحديث')}</th></tr></thead><tbody>
        ${CATALOG.filter((m) => OPS.stockCat === 'all' || m.cat === OPS.stockCat).map((m) => { const q = S.stock[m.id] ?? 0; const sold = S.soldOut.includes(m.id) || q === 0; return `<tr class="${sold ? 'row-out' : ''}">
          <td data-l="${T('Item', 'الصنف')}">${m.emoji} ${L(m.name)}</td>
          <td data-l="${T('Stock', 'المخزون')}"><b>${q}</b></td>
          <td data-l="${T('Status', 'الحالة')}">${sold ? `<span class="st-chip blocked">${T('Sold out', 'نفد')}</span>` : q < 15 ? `<span class="st-chip overdue">${T('Low', 'منخفض')}</span>` : `<span class="st-chip s3">${T('OK', 'متوفر')}</span>`}</td>
          <td data-l=""><div class="row gap-xs"><button class="icon-btn sm" data-act="opsStock" data-arg="${m.id}:-10" aria-label="${T('Remove 10', 'إنقاص 10')}">${icon('minus')}</button><button class="icon-btn sm" data-act="opsStock" data-arg="${m.id}:10" aria-label="${T('Add 10', 'إضافة 10')}">${icon('plus')}</button>
            <button class="btn btn-sm ${sold ? 'btn-primary' : 'btn-ghost'}" data-act="opsToggleStock" data-arg="${m.id}">${sold ? T('Restock', 'إعادة توفير') : T('Sold out', 'نفد')}</button></div></td></tr>`; }).join('')}</tbody></table>`)}
    </section>
    <section class="panel">
      <div class="block-head"><h2 class="h3">${T('Handoff points', 'نقاط التسليم')}</h2><small class="muted">${T('Capacity and queue', 'السعة والطابور')}</small></div>
      ${live('ops-points', () => PICKUPS.map((p) => { const l = pickupLoad(p.id); const alt = bestPickup(p.id); const n = allOpsOrders().filter((o) => o.status < 3 && o.type === 'pickup' && o.dest === p.id).length; return `<div class="point ${l >= 80 ? 'over' : ''}">
        <div class="row between"><b>${L(p.name)}</b><span class="st-chip ${l >= 80 ? 'blocked' : l >= 50 ? 'overdue' : 's3'}">${l >= 80 ? T('Over capacity', 'تجاوز السعة') : levelWord(l)}</span></div>
        <div class="bar mt-xs"><i class="lvl-bg-${levelKind(l)}" style="width:${l}%"></i></div>
        <div class="point-stats"><span>${T('Load', 'الحمل')} <b>${Math.round(l)}%</b></span><span>${T('Queue', 'الطابور')} <b>${Math.round(l / 3)}</b></span><span>${T('Wait', 'الانتظار')} <b>${mins(pickupWait(p.id))}</b></span><span>${T('Orders', 'طلبات')} <b>${n}</b></span></div>
        ${l >= 80 ? `<div class="notice warn mt-xs">${icon('alert')}<span>${T(`Suggest ${L(alt.name)} (${mins(pickupWait(alt.id))})`, `اقترح ${L(alt.name)} (${mins(pickupWait(alt.id))})`)}</span></div>` : ''}
        <button class="btn btn-sm ${S.overloaded.includes(p.id) ? 'btn-primary' : 'btn-ghost'} mt-xs" data-act="trigger" data-arg="overload:${p.id}">${S.overloaded.includes(p.id) ? T('Reopen to new orders', 'إعادة الاستقبال') : T('Simulate overload', 'محاكاة ازدحام')}</button>
      </div>`; }).join(''))}
    </section>
  </div>`;
}

/* ---------- map operations ---------- */
function opsMap() {
  return `<div class="ws-split wide-left">
    <div class="panel map-card">${stadiumMap({ id: 'ops-map', detailed: true, facilities: true, ops: true })}${mapLegend(true)}</div>
    <div class="stack">
      <section class="panel"><h2 class="h3">${T('Simulation controls', 'أدوات المحاكاة')}</h2>
        <div class="ctrl-grid">
          <button class="btn ${S.closedRoutes.length ? 'btn-danger' : 'btn-ghost'}" data-act="trigger" data-arg="closure">🚧 ${S.closedRoutes.length ? T('Reopen route', 'فتح الممر') : T('Close a route', 'إغلاق ممر')}</button>
          <button class="btn btn-ghost" data-act="trigger" data-arg="crowd:up">📈 ${T('Crowd surge', 'ارتفاع الكثافة')}</button>
          <button class="btn btn-ghost" data-act="trigger" data-arg="crowd:down">📉 ${T('Crowd eases', 'انخفاض الكثافة')}</button>
          <button class="btn btn-ghost" data-act="toggleHeat">${icon('layers')} ${S.heatmap ? T('Hide crowd', 'إخفاء الكثافة') : T('Show crowd', 'إظهار الكثافة')}</button>
        </div></section>
      <section class="panel">${live('ops-demand', () => { const act = allOpsOrders().filter((o) => o.status < 3); return `<h2 class="h3">${T('Live demand', 'الطلب المباشر')}</h2>
        <ul class="zone-list">${['A', 'B', 'C'].map((k) => `<li><span>${T('Section', 'القسم')} ${k}</span><span class="bar"><i class="lvl-bg-${levelKind(S.crowd[k])}" style="width:${S.crowd[k]}%"></i></span><b>${act.filter((o) => orderSection(o) === k).length} ${T('orders', 'طلب')}</b></li>`).join('')}
        ${PICKUPS.map((p) => `<li><span>${L(p.name)}</span><span class="bar"><i class="lvl-bg-${levelKind(pickupLoad(p.id))}" style="width:${pickupLoad(p.id)}%"></i></span><b>${Math.round(pickupLoad(p.id))}%</b></li>`).join('')}</ul>
        <p class="muted xs mt-s">${T('Orange dots are active orders; dashed lines are seat deliveries in progress.', 'النقاط البرتقالية طلبات نشطة، والخطوط المتقطعة توصيلات جارية.')}</p>`; })}</section>
    </div>
  </div>`;
}
