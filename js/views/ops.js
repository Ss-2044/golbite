/* GolBite — Venue Operations: Smart Fulfillment Network console. */

let OPS = { tab: 'board', group: 'status' };
const OPS_STATUS = () => [T('Received', 'مستلم'), T('Preparing', 'قيد التحضير'), T('Ready', 'جاهز'), T('Handed over', 'تم التسليم')];

function allOpsOrders() {
  return [...S.orders.filter((o) => o.eventId === currentEvent().id || !o.eventId).map((o) => ({ ...o, fan: S.user?.name || 'Fan', mine: true })), ...S.opsOrders];
}

function viewOps() {
  const tabs = [['board', T('Orders', 'الطلبات'), 'receipt'], ['network', T('Fulfillment', 'التوزيع'), 'route'], ['venue', T('Venue', 'المكان'), 'map'], ['stock', T('Inventory', 'المخزون'), 'store']];
  return `<section class="page wide">
    <div class="row between wrap gap"><div><small class="eyebrow">${T('Venue Operator', 'مشغّل المكان')}</small><h1 class="title">${T('Operations', 'العمليات')}</h1></div>
      ${live('ops-phase', () => `<div class="row gap">${pill(phaseLabel(), 'brand')}${pill(S.match.phase === 'arrival' || S.match.phase === 'prematch' ? T('Kickoff in', 'البداية بعد') + ' ' + -S.match.minute + 'm' : S.match.minute + "'")}</div>`)}</div>
    ${live('ops-kpi', opsKpis)}
    <div class="ops-layout mt">
      <div>
        <div class="tabs" role="tablist">${tabs.map(([k, l, ic]) => `<button role="tab" aria-selected="${OPS.tab === k}" class="tab ${OPS.tab === k ? 'on' : ''}" data-act="opsTab" data-arg="${k}">${icon(ic)} ${l}</button>`).join('')}</div>
        <div class="mt-s">${OPS.tab === 'board' ? opsBoard() : OPS.tab === 'network' ? opsNetwork() : OPS.tab === 'venue' ? opsVenue() : opsStock()}</div>
      </div>
      <aside class="ops-side">${live('ops-alerts', opsAlerts)}</aside>
    </div>
  </section>`;
}

function opsKpis() {
  const all = allOpsOrders();
  const done = all.filter((o) => o.status >= 3).length + 214;
  const activeN = all.filter((o) => o.status < 3).length;
  const avg = (all.filter((o) => o.status < 3).reduce((s, o) => s + estimate(o), 0) / Math.max(1, activeN)) || 4;
  const pop = {};
  all.forEach((o) => o.items.forEach((i) => (pop[i.id] = (pop[i.id] || 0) + i.qty)));
  const top = Object.entries(pop).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `<div class="kpis">
    ${statCard(T('Active orders', 'طلبات نشطة'), activeN)}
    ${statCard(T('Avg wait', 'متوسط الانتظار'), mins(avg), avg > 10 ? 'busy' : avg > 6 ? 'mid' : 'calm')}
    ${statCard(T('Completed today', 'مكتملة اليوم'), done)}
    ${statCard(T('Order volume / hr', 'حجم الطلبات/ساعة'), 380 + Math.round(S.crowd.P1 * 2))}
    <div class="stat"><span class="stat-l">${T('Popular now', 'الأكثر طلباً')}</span><b class="stat-v">${top.map(([id]) => item(id).emoji).join(' ') || '—'}</b></div>
  </div>`;
}

function opsOrderCard(o) {
  const st = Math.min(...o.tasks.map((t) => t.st));
  const next = st < 3 ? OPS_STATUS()[Math.min(3, st + 1)] : null;
  return `<article class="ops-order ${o.mine ? 'mine' : ''} ${o.issue ? 'issue' : ''}">
    <div class="row between"><b>${o.id}</b>${o.mine ? pill(T('Demo fan', 'المشجع التجريبي'), 'brand') : `<small class="muted">${esc(o.fan)}</small>`}</div>
    <small class="muted">${o.type === 'delivery' ? '🚚 ' + T('Seat', 'مقعد') + ' ' + o.dest + (o.runner ? ' · ' + o.runner : '') : '🏪 ' + L(pickup(o.dest)?.name)}${o.schedule === 'halftime' ? ' · ⏱ HT' : ''}</small>
    <div class="ops-items">${o.items.map((i) => `<span>${item(i.id).emoji}${i.qty > 1 ? '×' + i.qty : ''}</span>`).join('')}</div>
    <div class="row gap wrap">${o.tasks.map((t) => `<span class="vs-chip ${t.st >= 2 ? 'ok' : ''}" title="${esc(L(REASONS[t.reason]))}">${vendor(t.vid).emoji} ${OPS_STATUS()[t.st]}</span>`).join('')}</div>
    ${next ? `<button class="btn btn-primary btn-sm w-full mt-xs" data-act="opsAdvance" data-arg="${o.id}">${T('Mark', 'تحديد')} ${next}</button>` : ''}
  </article>`;
}

function opsBoard() {
  const groups = [['status', T('Status', 'الحالة')], ['vendor', T('Vendor', 'البائع')], ['pickup', T('Pickup point', 'نقطة الاستلام')]];
  return `<div class="row gap wrap mb"><span class="muted">${T('Group by', 'تجميع حسب')}:</span>${groups.map(([k, l]) => `<button class="chip ${OPS.group === k ? 'on' : ''}" data-act="opsGroup" data-arg="${k}">${l}</button>`).join('')}</div>
    ${live('ops-board', () => {
      const all = allOpsOrders();
      let cols;
      if (OPS.group === 'status') cols = OPS_STATUS().map((l, i) => [l, all.filter((o) => Math.min(...o.tasks.map((t) => t.st)) === i)]);
      else if (OPS.group === 'vendor') cols = VENDORS.map((v) => [`${v.emoji} ${L(v.name)}`, all.filter((o) => o.status < 3 && o.tasks.some((t) => t.vid === v.id))]);
      else cols = [...PICKUPS.map((p) => [L(p.name), all.filter((o) => o.status < 3 && o.type === 'pickup' && o.dest === p.id)]), [T('Seat delivery', 'توصيل للمقعد'), all.filter((o) => o.status < 3 && o.type === 'delivery')]];
      return `<div class="board-cols">${cols.map(([l, list]) => `<div class="board-col"><h3>${l} <span class="count">${list.length}</span></h3>${list.slice(0, 8).map(opsOrderCard).join('') || `<p class="muted small">${T('Nothing here', 'لا شيء هنا')}</p>`}</div>`).join('')}</div>`;
    })}`;
}

function opsNetwork() {
  return live('ops-net', () => {
    const mine = S.orders.find((o) => o.status < 3) || S.orders[0];
    return `<div class="card">
      <h2 class="h3">${icon('route')} ${T('Smart Fulfillment Network', 'شبكة التوزيع الذكية')}</h2>
      <p class="muted small">${T('Each item is routed to the best vendor by stock, prep time, location and workload. The fan still sees one combined order.', 'كل صنف يوجَّه لأفضل بائع حسب المخزون ووقت التحضير والموقع وضغط العمل. والمشجع يرى طلباً واحداً.')}</p>
      ${mine ? `<div class="net">
        <div class="net-col"><small class="muted">${T('Fan order', 'طلب المشجع')}</small><div class="net-node fan"><b>${mine.id}</b><small>${mine.items.map((i) => item(i.id).emoji).join(' ')}</small></div></div>
        <div class="net-col">${mine.tasks.map((t) => `<div class="net-node"><b>${vendor(t.vid).emoji} ${L(vendor(t.vid).name)}</b><small>${t.items.map((i) => item(i.id).emoji + '×' + i.qty).join(' ')} · ${L(REASONS[t.reason])}</small><small>${OPS_STATUS()[t.st]} · ${T('load', 'الضغط')} ${Math.round(S.vendorLoad[t.vid])}%</small>
          ${t.st < 2 ? `<div class="row gap mt-xs"><button class="btn btn-ghost btn-sm" data-act="opsReroute" data-arg="${mine.id}:${t.vid}">${T('Reroute', 'إعادة توجيه')}</button><button class="btn btn-ghost btn-sm" data-act="opsUnavailable" data-arg="${t.items[0].id}">${T('Item unavailable', 'الصنف غير متوفر')}</button></div>` : ''}</div>`).join('')}</div>
        <div class="net-col"><small class="muted">${T('Handoff', 'التسليم')}</small><div class="net-node fan"><b>${mine.type === 'delivery' ? '🚚 ' + mine.runner : '🏪 ' + L(pickup(mine.dest).name)}</b><small>~${mins(estimate(mine))}</small>
          ${mine.type === 'pickup' && mine.status < 3 ? `<button class="btn btn-ghost btn-sm mt-xs" data-act="movePickup" data-arg="${mine.id}">${T('Move to', 'نقل إلى')} ${L(bestPickup(mine.dest).name)}</button>` : ''}
          ${mine.type === 'delivery' && mine.status < 3 ? `<button class="btn btn-ghost btn-sm mt-xs" data-act="opsRunner" data-arg="${mine.id}">${T('Reassign runner', 'تغيير المندوب')}</button>` : ''}</div></div>
      </div>` : `<div class="empty sm">${foodTile('🧾')}<p class="muted">${T('Place an order as the fan to see it routed here.', 'اطلب كمشجع لترى توزيعه هنا.')}</p><button class="btn btn-ghost btn-sm" data-act="roleGo" data-arg="fan:menu">${T('Switch to fan & order', 'انتقل للمشجع واطلب')}</button></div>`}
    </div>
    <div class="card mt"><h2 class="h3">${T('Vendor workload', 'ضغط عمل البائعين')}</h2>
      <ul class="zone-list">${VENDORS.map((v) => `<li><span>${v.emoji} ${L(v.name)}</span><span class="bar"><i class="lvl-bg-${levelKind(S.vendorLoad[v.id])}" style="width:${S.vendorLoad[v.id]}%"></i></span><b>${Math.round(S.vendorLoad[v.id])}%</b></li>`).join('')}</ul></div>
    <div class="card mt"><h2 class="h3">${T('Runners', 'المندوبون')}</h2>
      <ul class="members">${RUNNERS.map((r, i) => { const o = allOpsOrders().find((x) => x.runner === r && x.status < 3); return `<li><span class="avatar">${r[0]}</span><span class="grow"><b>${r}</b><small>${o ? T('Delivering', 'يوصّل') + ' ' + o.id + ' → ' + o.dest : T('Available', 'متاح')}</small></span>${pill(o ? T('Busy', 'مشغول') : T('Free', 'متاح'), o ? 'mid' : 'calm')}</li>`; }).join('')}</ul></div>`;
  });
}

function opsVenue() {
  return `<div class="map-layout">
    <div class="card">${stadiumMap({ id: 'ops-map', detailed: true, facilities: true })}</div>
    <div class="map-side">
      <div class="card"><h2 class="h3">${T('Venue controls', 'التحكم بالمكان')}</h2>
        <button class="btn ${S.closedRoutes.length ? 'btn-danger' : 'btn-ghost'} w-full" data-act="trigger" data-arg="closure">🚧 ${S.closedRoutes.length ? T('Reopen concourse route', 'إعادة فتح الممر') : T('Close a concourse route', 'إغلاق جزء من الممر')}</button>
        <h3 class="h3 mt">${T('Pickup capacity', 'سعة نقاط الاستلام')}</h3>
        ${live('ops-pickups', () => PICKUPS.map((p) => `<div class="kv"><span>${L(p.name)} <small class="lvl-${levelKind(pickupLoad(p.id))}">${levelWord(pickupLoad(p.id))} · ${Math.round(pickupLoad(p.id))}%</small></span>
          <button class="btn btn-sm ${S.overloaded.includes(p.id) ? 'btn-danger' : 'btn-ghost'}" data-act="trigger" data-arg="overload:${p.id}">${S.overloaded.includes(p.id) ? T('Clear', 'إلغاء') : T('Overload', 'تحميل زائد')}</button></div>`).join(''))}
      </div>
      <div class="card">${live('ops-demand', () => `<h2 class="h3">${T('Demand by section', 'الطلب حسب القسم')}</h2>
        <ul class="zone-list">${['A', 'B', 'C'].map((k) => { const n = allOpsOrders().filter((o) => o.status < 3 && (o.dest === k || (o.type === 'pickup' && angDist(pickup(o.dest).angle, SECTIONS[k].angle) < 60))).length; return `<li><span>${T('Section', 'القسم')} ${k}</span><span class="bar"><i class="lvl-bg-${levelKind(S.crowd[k])}" style="width:${S.crowd[k]}%"></i></span><b>${n}</b></li>`; }).join('')}</ul>`)}</div>
      <div class="card">${mapLegend(true)}</div>
    </div></div>`;
}

function opsStock() {
  return `<div class="card"><h2 class="h3">${T('Inventory', 'المخزون')}</h2>
    <p class="muted small">${T('Mark an item sold out — fans immediately see alternatives and active orders are flagged.', 'حدد صنفاً كنافد — يرى المشجعون البدائل فوراً وتُنبَّه الطلبات النشطة.')}</p>
    <div class="stock-list">${MENU.map((m) => { const sold = S.soldOut.includes(m.id); const stock = sold ? 0 : 20 + ((m.id.charCodeAt(1) * 37) % 140); return `<div class="stock ${sold ? 'sold' : ''}"><span>${m.emoji}</span><span class="grow"><b>${L(m.name)}</b><small class="muted">${sold ? T('Sold out', 'نفد') : stock + ' ' + T('in stock', 'متوفر')} ${stock && stock < 40 ? '· ' + T('Low', 'منخفض') : ''}</small></span>
      <button class="btn btn-sm ${sold ? 'btn-primary' : 'btn-ghost'}" data-act="opsToggleStock" data-arg="${m.id}">${sold ? T('Restock', 'إعادة التوفير') : T('Mark sold out', 'تحديد كنافد')}</button></div>`; }).join('')}</div></div>`;
}

function opsAlerts() {
  const list = S.alerts.slice(0, 10);
  const ic = { order: '🧾', capacity: '⚠️', route: '🚧', stock: '📦', goal: '⚽', merch: '🔥', help: '🆘' };
  return `<div class="card"><h2 class="h3">${icon('bell')} ${T('Alerts', 'التنبيهات')}</h2>
    ${list.length ? `<ul class="alerts">${list.map((a) => `<li class="al-${a.kind}"><span>${ic[a.kind] || '•'}</span><div><b>${esc(L(a.text))}</b><small class="muted">${a.minute != null ? (a.minute < 0 ? T('pre-match', 'قبل المباراة') : a.minute + "'") : ''}</small></div></li>`).join('')}</ul>` : `<p class="muted small">${T('All clear. Alerts appear here for delays, capacity and handoffs.', 'لا توجد تنبيهات. ستظهر هنا تنبيهات التأخير والسعة والتسليم.')}</p>`}
  </div>
  <div class="card mt"><h2 class="h3">${T('Pickup points', 'نقاط الاستلام')}</h2>
    ${PICKUPS.map((p) => `<div class="kv"><span>${L(p.name)}</span><b class="lvl-${levelKind(pickupLoad(p.id))}">${mins(pickupWait(p.id))}</b></div>`).join('')}</div>`;
}
