/* GolBite — Venue admin: event setup with a validation checklist, service status, integration boundaries,
   business report and audit log. Settings are stored in this browser only (demo). */

const ADMIN_NAV = [
  ['setup', 'edit', { en: 'Event setup', ar: 'إعداد الفعالية' }],
  ['services', 'grid', { en: 'Services', ar: 'الخدمات' }],
  ['integrations', 'layers', { en: 'Integrations', ar: 'التكاملات' }],
  ['report', 'chart', { en: 'Business report', ar: 'تقرير الأعمال' }],
  ['activity', 'note', { en: 'Activity log', ar: 'سجل النشاط' }],
];

function viewAdmin(tab) {
  tab = ADMIN_NAV.some(([k]) => k === tab) ? tab : 'setup';
  const body = { setup: adminSetup, services: adminServices, integrations: adminIntegrations, report: adminReport, activity: adminActivity }[tab]();
  return `<section class="page wide ws">
    <div class="ws-head">
      <div><small class="eyebrow">${T('Venue admin', 'إدارة الملعب')}</small><h1 class="title">${L(ADMIN_NAV.find(([k]) => k === tab)[2])}</h1></div>
      <div class="ws-context">${pill(L(currentEvent().title))}${S.venueCfg.published ? `<span class="st-chip s3">${T('Published', 'منشورة')}</span>` : `<span class="st-chip overdue">${T('Draft', 'مسودة')}</span>`}${dataBadge('demo')}</div>
    </div>
    ${body}
  </section>`;
}

/* Each check: [ok, label]. Publishing is blocked until all pass. */
function setupChecks(cfg = S.venueCfg) {
  const g = EVENT_GUIDE[currentEvent().id];
  const date = cfg.date || g.date;
  return [
    [!!(cfg.eventName || L(currentEvent().title)).trim(), T('Event name is set', 'اسم الفعالية محدد')],
    [/^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date + 'T12:00:00')), T('Valid event date', 'تاريخ صالح للفعالية')],
    [/^\d{2}:\d{2}$/.test(cfg.start || g.start), T('Start time is set', 'وقت البداية محدد')],
    [cfg.fulfillment.pickup || cfg.fulfillment.delivery, T('At least one fulfilment method', 'طريقة تسليم واحدة على الأقل')],
    [!cfg.fulfillment.delivery || cfg.deliverySections.length > 0, T('Delivery has at least one section', 'التوصيل يشمل قسماً واحداً على الأقل')],
    [!cfg.fulfillment.pickup || PICKUPS.length > 0, T('Pickup points configured', 'نقاط الاستلام مُعدّة')],
    [VENDORS.every((v) => vendorCap(v.id) > 0), T('Every vendor has a capacity', 'لكل بائع سعة محددة')],
    [cfg.cutoffMinute >= 46 && cfg.cutoffMinute <= 90, T('Last-order cutoff between 46\' and 90\'', 'آخر موعد للطلب بين الدقيقة 46 و90')],
    [cfg.deliveryFee >= 0 && cfg.serviceFee >= 0, T('Fees are zero or more', 'الرسوم صفر أو أكثر')],
    [!!(cfg.escalation?.name || '').trim(), T('Escalation contact is set', 'جهة التصعيد محددة')],
  ];
}

function adminSetup() {
  const cfg = S.venueCfg, g = EVENT_GUIDE[currentEvent().id];
  const checks = setupChecks();
  const ok = checks.every(([c]) => c);
  return `<div class="ws-split">
    <form class="panel" data-submit="adminSetup" novalidate>
      <h2 class="h3">${T('Event details', 'تفاصيل الفعالية')}</h2>
      <label class="field"><span>${T('Event name', 'اسم الفعالية')}</span><input name="eventName" maxlength="60" value="${esc(cfg.eventName || L(currentEvent().title))}"/></label>
      <div class="row gap wrap">
        <label class="field grow"><span>${T('Date', 'التاريخ')}</span><input type="date" name="date" value="${esc(cfg.date || g.date)}"/></label>
        <label class="field grow"><span>${T('Start time', 'وقت البداية')}</span><input type="time" name="start" value="${esc(cfg.start || g.start)}"/></label>
      </div>
      <h2 class="h3 mt">${T('Fulfilment', 'طرق التسليم')}</h2>
      <label class="check"><input type="checkbox" name="pickup" ${cfg.fulfillment.pickup ? 'checked' : ''}/> ${t('ful.pickup')}</label>
      <label class="check"><input type="checkbox" name="delivery" ${cfg.fulfillment.delivery ? 'checked' : ''}/> ${t('ful.delivery')}</label>
      <fieldset class="field"><legend>${T('Delivery sections', 'أقسام التوصيل')}</legend><div class="row gap wrap">${Object.keys(SECTIONS).map((k) => `<label class="check"><input type="checkbox" name="sec-${k}" ${cfg.deliverySections.includes(k) ? 'checked' : ''}/> ${T('Section', 'القسم')} ${k}</label>`).join('')}</div></fieldset>
      <div class="row gap wrap">
        <label class="field grow"><span>${T('Delivery fee (SAR)', 'رسوم التوصيل (ر.س)')}</span><input type="number" name="deliveryFee" min="0" max="50" step="1" value="${cfg.deliveryFee}"/></label>
        <label class="field grow"><span>${T('Service fee (SAR)', 'رسوم الخدمة (ر.س)')}</span><input type="number" name="serviceFee" min="0" max="20" step="1" value="${cfg.serviceFee}"/></label>
        <label class="field grow"><span>${T('Last orders (minute)', 'آخر طلب (دقيقة)')}</span><input type="number" name="cutoffMinute" min="46" max="90" value="${cfg.cutoffMinute}"/></label>
      </div>
      <h2 class="h3 mt">${T('Escalation', 'التصعيد')}</h2>
      <div class="row gap wrap">
        <label class="field grow"><span>${T('Contact (role)', 'جهة الاتصال (الدور)')}</span><input name="escName" maxlength="40" value="${esc(cfg.escalation?.name || '')}"/></label>
        <label class="field grow"><span>${T('Channel', 'القناة')}</span><input name="escChannel" maxlength="40" value="${esc(cfg.escalation?.channel || '')}"/></label>
      </div>
      <p class="muted xs">${T('Prices include 15% VAT. Vendor capacity is set in Event-day controls or by each vendor.', 'الأسعار شاملة ضريبة 15%. سعة البائعين تُضبط من تحكم يوم الفعالية أو من كل بائع.')}</p>
      <button class="btn btn-primary mt" type="submit">${T('Save setup', 'حفظ الإعداد')}</button>
    </form>
    <aside class="panel">
      <h2 class="h3">${T('Ready to publish?', 'جاهزة للنشر؟')}</h2>
      <ul class="checklist">${checks.map(([c, l]) => `<li class="${c ? 'ok' : 'bad'}">${icon(c ? 'check' : 'x')}<span>${l}</span></li>`).join('')}</ul>
      ${cfg.published ? `<button class="btn btn-ghost w-full mt" data-act="adminPublish">${T('Unpublish (closes fan ordering)', 'إلغاء النشر (يغلق طلب المشجعين)')}</button>`
        : `<button class="btn btn-orange w-full mt" data-act="adminPublish" ${ok ? '' : 'disabled'}>${T('Publish event', 'نشر الفعالية')}</button>${ok ? '' : `<p class="field-error">${T('Fix the items marked ✗ to publish.', 'أصلح البنود المعلّمة ✗ للنشر.')}</p>`}`}
      <p class="muted xs mt-s">${T('Publishing makes the event and ordering available to fans in this demo.', 'النشر يجعل الفعالية والطلب متاحين للمشجعين في هذا العرض.')}</p>
    </aside>
  </div>`;
}

function adminServices() {
  const groups = SERVICE_CATS.map((c) => ({ c, list: DIRECTORY.filter((e) => e.cat === c.id) })).filter((g) => g.list.length);
  return `<section class="panel">
    <div class="block-head"><h2 class="h3">${T('Directory & service status', 'الدليل وحالة الخدمات')}</h2><small class="muted">${T('What fans see in Explore', 'ما يراه المشجعون في الاستكشاف')}</small></div>
    ${live('admin-svc', () => `<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>${T('Service', 'الخدمة')}</th><th>${T('Category', 'الفئة')}</th><th>${T('Status', 'الحالة')}</th><th>${T('Data', 'البيانات')}</th><th></th></tr></thead><tbody>
      ${groups.map(({ c, list }) => list.map((e) => { const st = dirStatus(e); const togglable = e.status !== 'not_configured' && !['food', 'merch', 'pickup'].includes(e.cat); return `<tr>
        <td data-l="${T('Service', 'الخدمة')}">${c.icon} ${dirName(e)}</td><td data-l="${T('Category', 'الفئة')}">${L(c.name)}</td><td data-l="${T('Status', 'الحالة')}">${statusChip(st)}</td>
        <td data-l="${T('Data', 'البيانات')}">${dataBadge(e.status === 'not_configured' ? 'unavailable' : e.cat === 'pickup' || e.cat === 'food' ? 'demo' : 'scheduled')}</td>
        <td data-l="">${togglable ? `<button class="btn btn-sm ${S.svcStatus[e.id] === 'unavailable' ? 'btn-primary' : 'btn-ghost'}" data-act="svcToggle" data-arg="${e.id}">${S.svcStatus[e.id] === 'unavailable' ? T('Restore', 'استعادة') : T('Mark unavailable', 'غير متاح')}</button>` : e.cat === 'food' || e.cat === 'merch' || e.cat === 'pickup' ? `<button class="link" data-act="go" data-arg="ops/control">${T('Event-day controls', 'تحكم يوم الفعالية')}</button>` : ''}</td></tr>`; }).join('')).join('')}</tbody></table></div>`)}
  </section>`;
}

function adminIntegrations() {
  return `<section class="panel">
    <p class="muted small">${T('This static build has no live integrations. Each capability below states what it uses today and what production needs.', 'هذه النسخة الثابتة بدون تكاملات مباشرة. كل قدرة أدناه توضح ما تستخدمه اليوم وما يحتاجه الإنتاج.')}</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${T('Capability', 'القدرة')}</th><th>${T('Status', 'الحالة')}</th><th>${T('Notes', 'ملاحظات')}</th></tr></thead><tbody>
      ${INTEGRATIONS.map((i) => `<tr><td data-l="${T('Capability', 'القدرة')}"><b>${L(i.name)}</b></td><td data-l="${T('Status', 'الحالة')}"><span class="st-chip ${i.mode === 'none' ? 'overdue' : 's1'}">${integrationLabel(i.mode)}</span></td><td data-l="${T('Notes', 'ملاحظات')}" class="small">${L(i.note)}</td></tr>`).join('')}
    </tbody></table></div>
  </section>`;
}

/* Business report from the demo ledger of closed orders. */
function businessReport() {
  const cfg = S.venueCfg;
  const rows = S.ledger || [];
  const sum = (f) => rows.reduce((s, l) => s + f(l), 0);
  const gross = sum((l) => l.gross);
  const discounts = sum((l) => l.discount);
  const refunds = sum((l) => l.refund);
  const fees = sum((l) => (l.stage === 'cancelled' ? 0 : l.fees));
  const net = gross - discounts - refunds + fees;                     // amount collected after refunds (simulated)
  const vat = net - net / (1 + cfg.vatRate);
  const itemNet = Math.max(0, gross - discounts - refunds) / (1 + cfg.vatRate);
  const commission = itemNet * cfg.platformRate;
  const platform = commission + fees / (1 + cfg.vatRate);
  const byVendor = VENDORS.map((v) => {
    const g = sum((l) => (l.byVendor[v.id] || 0) * (l.stage === 'cancelled' ? 0 : 1));
    const share = gross ? g / gross : 0;
    const exVat = Math.max(0, g - (discounts + sum((l) => (l.stage === 'cancelled' ? 0 : l.refund))) * share) / (1 + cfg.vatRate);
    return { v, gross: g, amount: exVat * (1 - cfg.platformRate) };
  });
  return { n: rows.length, completed: rows.filter((l) => l.stage !== 'cancelled').length, cancelled: rows.filter((l) => l.stage === 'cancelled').length, gross, discounts, refunds, fees, net, vat, commission, platform, byVendor };
}
function adminReport() {
  return live('admin-report', () => {
    const r = businessReport();
    const line = (l, v, def) => `<div class="kv"><span>${l}<small class="muted block">${def}</small></span><b>${sar(Math.round(v * 100) / 100)}</b></div>`;
    return `<div class="notice">${icon('alert')}<span>${T(`Simulated figures from ${r.n} closed order(s) in this demo session (${r.completed} completed, ${r.cancelled} cancelled). No money has moved and no payouts are made.`, `أرقام محاكاة من ${r.n} طلب مغلق في جلسة العرض (${r.completed} مكتمل، ${r.cancelled} ملغي). لم تتحرك أي أموال ولا يتم صرف أي مستحقات.`)}</span></div>
    <div class="ws-grid two mt-s">
      <section class="panel">
        <h2 class="h3">${T('Summary', 'الملخص')}</h2>
        ${line(T('Gross item sales', 'إجمالي مبيعات الأصناف'), r.gross, T('menu prices × quantity, incl. VAT', 'سعر القائمة × الكمية، شامل الضريبة'))}
        ${line(T('Discounts', 'الخصومات'), -r.discounts, T('offer vouchers applied', 'قسائم العروض المستخدمة'))}
        ${line(T('Refunds (simulated)', 'المبالغ المستردة (محاكاة)'), -r.refunds, T('cancelled orders and removed items', 'الطلبات الملغاة والأصناف المحذوفة'))}
        ${line(T('Fees', 'الرسوم'), r.fees, T('delivery and service fees', 'رسوم التوصيل والخدمة'))}
        ${line(T('Net collected', 'صافي المحصّل'), r.net, T('gross − discounts − refunds + fees', 'الإجمالي − الخصومات − الاسترداد + الرسوم'))}
        ${line(T('VAT included', 'الضريبة المضمّنة'), r.vat, T(`${Math.round(S.venueCfg.vatRate * 100)}% of net, included in prices`, `${Math.round(S.venueCfg.vatRate * 100)}% من الصافي، مضمّنة في الأسعار`))}
        ${line(T('Platform revenue', 'إيراد المنصة'), r.platform, T(`${Math.round(S.venueCfg.platformRate * 100)}% commission on item sales ex-VAT + fees ex-VAT`, `عمولة ${Math.round(S.venueCfg.platformRate * 100)}% على المبيعات بدون ضريبة + الرسوم بدون ضريبة`))}
      </section>
      <section class="panel">
        <h2 class="h3">${T('By vendor', 'حسب البائع')}</h2>
        <table class="tbl compact"><thead><tr><th>${T('Vendor', 'البائع')}</th><th>${T('Gross sales', 'إجمالي المبيعات')}</th><th>${T('Vendor amount', 'مستحق البائع')}</th></tr></thead><tbody>
          ${r.byVendor.map(({ v, gross, amount }) => `<tr><td data-l="${T('Vendor', 'البائع')}">${v.emoji} ${L(v.name)}</td><td data-l="${T('Gross sales', 'إجمالي المبيعات')}">${sar(Math.round(gross * 100) / 100)}</td><td data-l="${T('Vendor amount', 'مستحق البائع')}">${sar(Math.round(amount * 100) / 100)}</td></tr>`).join('')}</tbody></table>
        <p class="muted xs mt-s">${T('Vendor amount = item sales after discounts and refunds, excluding VAT, minus platform commission. Calculated for reporting only — not paid out.', 'مستحق البائع = المبيعات بعد الخصومات والاسترداد، بدون الضريبة، ناقص عمولة المنصة. للتقرير فقط — لا يُصرف.')}</p>
      </section>
    </div>`;
  });
}

function adminActivity() {
  return `<section class="panel">${live('admin-activity', () => activityList(80))}</section>`;
}

const ADMIN_ACTIONS = {
  adminPublish: () => {
    if (!S.venueCfg.published && !setupChecks().every(([c]) => c)) { toast(T('Complete the checklist before publishing.', 'أكمل قائمة التحقق قبل النشر.'), 'error'); return; }
    S.venueCfg.published = !S.venueCfg.published;
    logActivity('admin', S.venueCfg.published ? T('Event published', 'نُشرت الفعالية') : T('Event unpublished', 'أُلغي نشر الفعالية'));
    commit();
  },
};
const ADMIN_CHANGES = {};
const ADMIN_SUBMITS = {
  adminSetup: (form) => {
    const cfg = JSON.parse(JSON.stringify(S.venueCfg));
    cfg.eventName = form.eventName.value.trim() || null;
    cfg.date = form.date.value || null;
    cfg.start = form.start.value || null;
    cfg.fulfillment = { pickup: form.pickup.checked, delivery: form.delivery.checked };
    cfg.deliverySections = Object.keys(SECTIONS).filter((k) => form['sec-' + k].checked);
    cfg.deliveryFee = Math.max(0, +form.deliveryFee.value || 0);
    cfg.serviceFee = Math.max(0, +form.serviceFee.value || 0);
    cfg.cutoffMinute = +form.cutoffMinute.value || 0;
    cfg.escalation = { name: form.escName.value.trim(), channel: form.escChannel.value.trim() };
    const failed = setupChecks(cfg).filter(([c]) => !c);
    if (failed.length) {
      // keep a published event valid: refuse to save a setup that would break it
      if (S.venueCfg.published) { toast(T('Not saved: ', 'لم يُحفظ: ') + failed[0][1], 'error', 5000); return; }
      toast(T('Saved as draft. Fix the checklist before publishing.', 'حُفظ كمسودة. أصلح قائمة التحقق قبل النشر.'), 'warn');
    } else toast(T('Event setup saved.', 'تم حفظ إعداد الفعالية.'), 'success');
    S.venueCfg = cfg;
    if (!cfg.fulfillment.delivery && S.cart.type === 'delivery') { S.cart.type = 'pickup'; S.cart.dest = null; }
    logActivity('admin', T('Event setup updated', 'تم تحديث إعداد الفعالية'));
    commit();
  },
};
