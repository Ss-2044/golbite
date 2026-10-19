/* GolBite — Explore the stadium (directory + map) and the Event guide (before, during and after the visit). */

/* ---------- directory helpers ---------- */
function dirName(e) {
  if (e.cat === 'food' || e.cat === 'merch') return L(vendor(e.ref).name);
  if (e.cat === 'pickup') return L(pickup(e.ref).name);
  if (e.cat === 'gate') return L(GATES.find((g) => g.id === e.ref).name);
  return L(e.name);
}
/* open | closed | paused | unavailable | not_configured — only from configured data and staff overrides. */
function dirStatus(e) {
  if (e.status === 'not_configured') return 'not_configured';
  if (S.svcStatus[e.id] === 'unavailable') return 'unavailable';
  if ((e.cat === 'food' || e.cat === 'merch') && vendorPaused(e.ref)) return 'paused';
  if (e.cat === 'pickup' && S.ops.pausedPickups.includes(e.ref)) return 'paused';
  if (S.ops.cancelled && e.cat !== 'gate' && e.cat !== 'travel') return 'closed';
  const ph = S.match.phase;
  if (ph === 'final' && e.hours === 'doors-end') return 'closed';
  return 'open';
}
function dirHours(e) {
  const g = EVENT_GUIDE[currentEvent().id];
  if (!e.hours) return '—';
  const until = { 'doors-end': T('until the final whistle', 'حتى صافرة النهاية'), 'doors-end+30': T('until 30 min after the end', 'حتى 30 دقيقة بعد النهاية'), 'doors-end+60': T('until 60 min after the end', 'حتى 60 دقيقة بعد النهاية') }[e.hours];
  return `${T('From', 'من')} ${fmtTime(g.doors)} ${until}`;
}
function dirWait(e) {
  if (e.cat === 'pickup') return mins(pickupWait(e.ref));
  if (e.cat === 'food' || e.cat === 'merch') return mins(1 + vendorQueueMin(e.ref) * 2);
  return null;
}
const statusChip = (st) => `<span class="st-chip svc-${st}">${t('svc.' + st)}</span>`;

/* Plain-language route from the fan's section to an angle on the concourse. */
function routeSteps(toAngle, label) {
  const sec = SECTIONS[S.setup.section];
  const r = planRoute(sec.angle, toAngle);
  const steps = [
    T(`Leave Section ${sec.id} by the nearest stairway or lift to the concourse.`, `اخرج من القسم ${sec.id} عبر أقرب درج أو مصعد إلى الممر.`),
    T(`Walk ${r.dir > 0 ? 'clockwise' : 'anticlockwise'} along the concourse for about ${Math.round(r.len)} m.`, `امشِ ${r.dir > 0 ? 'باتجاه عقارب الساعة' : 'عكس عقارب الساعة'} في الممر حوالي ${Math.round(r.len)} م.`),
  ];
  if (r.detour) steps.push(T('A concourse segment is closed — this route goes around it.', 'جزء من الممر مغلق — هذا المسار يتجنبه.'));
  if (r.blocked) steps.push(T('No open route is available right now. Ask a steward.', 'لا يوجد مسار مفتوح حالياً. اسأل أحد المنظمين.'));
  steps.push(T(`${label} is on your ${r.dir > 0 ? 'right' : 'left'}, signposted.`, `${label} على ${r.dir > 0 ? 'يمينك' : 'يسارك'} مع لوحات إرشادية.`));
  return { steps, mins: walkMins(r.len, S.setup.section), len: r.len, detour: r.detour, blocked: r.blocked };
}

let EXPLORE = { q: '', cat: 'all', sel: null };
function exploreList() {
  const q = EXPLORE.q.trim().toLowerCase();
  return DIRECTORY.filter((e) => (EXPLORE.cat === 'all' || e.cat === EXPLORE.cat) && (!q || (dirName(e) + ' ' + (e.name ? e.name.en + ' ' + e.name.ar : '') + ' ' + Object.values(SERVICE_CATS.find((c) => c.id === e.cat).name).join(' ')).toLowerCase().includes(q)));
}

function viewExplore() {
  const detailed = S.mapMode === 'detailed';
  const sel = EXPLORE.sel && DIRECTORY.find((e) => e.id === EXPLORE.sel);
  return `<section class="page explore">
    <div class="page-head"><div><h1 class="title">${T('Explore the stadium', 'استكشف الملعب')}</h1><p class="muted small">${L(currentEvent().venue)} · ${T('Section', 'القسم')} ${S.setup.section}</p></div>
      <div class="seg" role="group" aria-label="${T('Map detail', 'تفاصيل الخريطة')}">
        <button class="${!detailed ? 'on' : ''}" data-act="mapMode" data-arg="simple" aria-pressed="${!detailed}">${T('Simple', 'مبسطة')}</button>
        <button class="${detailed ? 'on' : ''}" data-act="mapMode" data-arg="detailed" aria-pressed="${detailed}">${T('Detailed', 'مفصلة')}</button></div></div>
    <label class="search"><span class="sr-only">${T('Search services', 'ابحث عن خدمة')}</span>${icon('search')}<input type="search" data-input="exploreQ" value="${esc(EXPLORE.q)}" placeholder="${T('Search: prayer room, water, pickup…', 'ابحث: مصلى، مياه، استلام…')}" autocomplete="off"/></label>
    <div class="tabs cat-tabs" role="tablist" aria-label="${T('Service categories', 'فئات الخدمات')}">
      <button role="tab" aria-selected="${EXPLORE.cat === 'all'}" class="tab ${EXPLORE.cat === 'all' ? 'on' : ''}" data-act="exploreCat" data-arg="all">${T('All', 'الكل')}</button>
      ${SERVICE_CATS.map((c) => `<button role="tab" aria-selected="${EXPLORE.cat === c.id}" class="tab ${EXPLORE.cat === c.id ? 'on' : ''}" data-act="exploreCat" data-arg="${c.id}"><span aria-hidden="true">${c.icon}</span> ${L(c.name)}</button>`).join('')}
    </div>
    <div class="map-layout">
      <div class="panel map-card">${stadiumMap({ id: 'explore-map', detailed, facilities: true, cat: EXPLORE.cat, highlight: sel?.id, routeTo: sel && dirStatus(sel) === 'open' ? sel.angle : null })}${mapLegend(detailed)}</div>
      <div class="map-side">
        ${sel ? `<div class="panel">${dirDetail(sel)}</div>` : ''}
        <div class="panel dir-panel">
          <div class="block-head"><h2 class="h3">${T('Services', 'الخدمات')}</h2>${live('dir-count', () => `<small class="muted">${exploreList().length}</small>`, 'span')}</div>
          ${live('dir-list', () => { const list = exploreList(); return list.length ? `<ul class="dir-list">${list.map((e) => { const st = dirStatus(e); const w = st === 'open' ? dirWait(e) : null; return `<li><button class="dir-row ${EXPLORE.sel === e.id ? 'sel' : ''}" data-act="dirSelect" data-arg="${e.id}">
            <span class="dir-ic" aria-hidden="true">${SERVICE_CATS.find((c) => c.id === e.cat).icon}</span>
            <span class="grow"><b>${dirName(e)}</b><small>${st === 'open' && e.angle != null && e.cat !== 'travel' ? '~' + mins(routeSteps(e.angle, '').mins) + ' ' + T('walk', 'مشياً') : ''}${w ? ' · ' + T('wait', 'انتظار') + ' ' + w : ''}${e.stepFree ? ' · ♿' : ''}</small></span>
            ${statusChip(st)}</button></li>`; }).join('')}</ul>` : `<div class="empty sm">${icon('search')}<p class="muted small">${T('No services match. Try another word or category.', 'لا توجد خدمات مطابقة. جرّب كلمة أو فئة أخرى.')}</p></div>`; })}
          <p class="muted xs mt-s">${dataBadge('demo')} ${T('Locations, hours and waits come from the sample venue setup.', 'المواقع والأوقات والانتظار من إعداد الملعب النموذجي.')}</p>
        </div>
      </div>
    </div>
  </section>`;
}

function dirDetail(e) {
  const st = dirStatus(e);
  const name = dirName(e);
  const cat = SERVICE_CATS.find((c) => c.id === e.cat);
  if (st === 'not_configured') {
    return `<h2 class="h3">${cat.icon} ${name}</h2><div class="notice">${icon('help')}<span>${t('svc.not_configured')}. ${T('The venue has not set up this service for this event.', 'لم يُعدّ الملعب هذه الخدمة لهذه الفعالية.')}</span></div>`;
  }
  if (e.link === 'guide') {
    return `<h2 class="h3">${cat.icon} ${name}</h2><p class="muted small">${T('Parking areas, shuttles and pickup zones are in the event guide (scheduled sample information, no live capacity).', 'المواقف والحافلات ومناطق النزول في دليل الفعالية (معلومات مجدولة نموذجية بدون سعة مباشرة).')}</p><button class="btn btn-primary mt-s" data-act="go" data-arg="guide/leave">${T('Open event guide', 'افتح دليل الفعالية')}</button>`;
  }
  const r = routeSteps(e.angle, name);
  return `<div class="row between"><h2 class="h3">${cat.icon} ${name}</h2>${statusChip(st)}</div>
    ${st !== 'open' ? `<div class="notice warn">${icon('alert')}<span>${st === 'paused' ? T('Temporarily paused by the venue.', 'متوقف مؤقتاً من الملعب.') : st === 'closed' ? T('Closed at this time.', 'مغلق في هذا الوقت.') : T('Reported unavailable by venue staff. Try the nearest alternative below.', 'أبلغ فريق الملعب أنه غير متاح. جرّب أقرب بديل أدناه.')}</span></div>` : ''}
    <div class="kv"><span>${icon('clock')} ${T('Hours', 'الأوقات')}</span><b>${dirHours(e)}</b></div>
    ${dirWait(e) && st === 'open' ? `<div class="kv"><span>${icon('users')} ${T('Estimated wait', 'الانتظار المتوقع')}</span><b>${dirWait(e)} ${dataBadge('demo')}</b></div>` : ''}
    <div class="kv"><span>♿ ${T('Accessibility', 'إمكانية الوصول')}</span><b>${e.stepFree ? T('Step-free route', 'مسار بدون درج') : T('Stairs on route — use Gate 1 lift', 'يوجد درج — استخدم مصعد البوابة 1')}</b></div>
    <h3 class="h3 mt-s">${icon('route')} ${T('Directions from your seat', 'الاتجاهات من مقعدك')} · ~${mins(r.mins)}</h3>
    <ol class="directions">${r.steps.map((x) => `<li>${x}</li>`).join('')}</ol>
    ${st !== 'open' ? altSuggestion(e) : ''}
    <div class="row gap wrap">
      ${e.cat === 'pickup' && st === 'open' ? `<button class="btn btn-orange btn-sm" data-act="choosePickup" data-arg="${e.ref}">${T('Use for pickup', 'استخدمها للاستلام')}</button>` : ''}
      ${(e.cat === 'food' || e.cat === 'merch') && st === 'open' ? `<button class="btn btn-orange btn-sm" data-act="menuFor" data-arg="${e.cat === 'merch' ? 'merch' : vendor(e.ref).cats[0]}">${T('See menu', 'عرض القائمة')}</button>` : ''}
      <button class="btn btn-ghost btn-sm" data-act="go" data-arg="support">${icon('help')} ${T('Report a problem here', 'أبلغ عن مشكلة هنا')}</button>
      <button class="btn btn-ghost btn-sm" data-act="dirSelect" data-arg="">${icon('x')} ${T('Clear', 'إلغاء')}</button>
    </div>`;
}
function altSuggestion(e) {
  const sec = SECTIONS[S.setup.section];
  const alt = DIRECTORY.filter((x) => x.cat === e.cat && x.id !== e.id && dirStatus(x) === 'open').sort((a, b) => angDist(a.angle, sec.angle) - angDist(b.angle, sec.angle))[0];
  return alt ? `<div class="notice info">${icon('route')}<span>${T('Nearest open alternative:', 'أقرب بديل مفتوح:')} <b>${dirName(alt)}</b></span><button class="btn btn-sm btn-primary" data-act="dirSelect" data-arg="${alt.id}">${T('Show', 'اعرض')}</button></div>` : '';
}
function dirSheet(id) {
  const e = DIRECTORY.find((x) => x.id === id);
  return e ? dirDetail(e) : '';
}

/* ---------- event guide ---------- */
const GUIDE_TABS = () => [['before', T('Before', 'قبل الوصول')], ['arrive', T('Arrival', 'الوصول')], ['leave', T('Leaving', 'المغادرة')]];
function viewGuide(tab) {
  tab = GUIDE_TABS().some(([k]) => k === tab) ? tab : (S.match.phase === 'final' ? 'leave' : 'before');
  const ev = currentEvent();
  const g = EVENT_GUIDE[ev.id];
  const es = eventStatus();
  const cfg = S.venueCfg;
  return `<section class="page narrow guide">
    <div class="panel guide-head">
      <div class="row between wrap gap"><small class="eyebrow">${T('Event guide', 'دليل الفعالية')}</small><span class="row gap-xs">${statusEvent(es)}${dataBadge('demo')}</span></div>
      <h1 class="title sm">${esc(cfg.eventName || L(ev.title))}</h1>
      <div class="kv"><span>${icon('ticket')} ${T('Date', 'التاريخ')}</span><b>${fmtDate(cfg.date || g.date)}</b></div>
      <div class="kv"><span>${icon('clock')} ${T('Doors · Start', 'الأبواب · البداية')}</span><b>${fmtTime(g.doors)} · ${fmtTime(cfg.start || g.start)}</b></div>
      <div class="kv"><span>${icon('pin')} ${T('Venue', 'الملعب')}</span><b>${L(ev.venue)}</b></div>
      <button class="btn btn-ghost btn-sm mt-s" data-act="go" data-arg="setup">${icon('edit')} ${T('Change event or seat', 'تغيير الفعالية أو المقعد')}</button>
    </div>
    ${S.ops.notice ? noticeCard(S.ops.notice) : ''}
    <div class="tabs" role="tablist">${GUIDE_TABS().map(([k, l]) => `<a role="tab" href="#/guide/${k}" aria-selected="${tab === k}" class="tab ${tab === k ? 'on' : ''}">${l}</a>`).join('')}</div>
    ${tab === 'before' ? guideBefore(g) : tab === 'arrive' ? guideArrive(g) : guideLeave(g)}
  </section>`;
}
function statusEvent(es) { return `<span class="st-chip ev-${es}">${t('ev.' + es)}</span>`; }
function noticeCard(n) {
  return `<div class="notice-card lvl-${n.level}" role="status"><b>${icon('megaphone')} ${T('Official venue notice', 'إعلان رسمي من الملعب')}</b><p>${esc(n.text)}</p><small class="muted">${T('Published by', 'نشره')} ${actorLabel(n.by)} · ${n.minute != null ? (n.minute < 0 ? T('pre-match', 'قبل البداية') : n.minute + "'") : ''} · ${dataBadge('demo')}</small></div>`;
}
function guideBefore(g) {
  const sec = S.setup.section;
  const rec = g.recommendedGateBy[sec];
  return `<section class="panel"><h2 class="h3">${icon('clock')} ${T('Official schedule', 'الجدول الرسمي')} ${dataBadge('scheduled')}</h2>
      <ul class="schedule">${EVENT_SCHEDULE.map((x) => `<li><b>${x.at === 0 ? T('Start', 'البداية') : x.at < 0 ? `−${Math.abs(x.at)} ${T('min', 'د')}` : `+${x.at} ${T('min', 'د')}`}</b><span>${L(x.label)}</span></li>`).join('')}</ul></section>
    <section class="panel"><h2 class="h3">${icon('route')} ${T('Getting there', 'الوصول إلى الملعب')}</h2><p class="small">${L(ARRIVAL_INFO.directions)}</p></section>
    <section class="panel"><div class="block-head"><h2 class="h3">🅿️ ${T('Parking', 'المواقف')}</h2>${dataBadge('scheduled')}</div>
      ${ARRIVAL_INFO.parking.map((p) => `<div class="kv"><span><b>${L(p.name)}</b><small class="muted block">${L(p.notes)}</small></span><b>${p.gate}</b></div>`).join('')}
      <p class="muted xs">${T('Live parking availability is not connected — no capacity is shown.', 'توفر المواقف المباشر غير متصل — لا تُعرض السعة.')}</p></section>
    <section class="panel"><div class="block-head"><h2 class="h3">🚌 ${T('Public transport & shuttles', 'النقل العام والحافلات')}</h2>${dataBadge('scheduled')}</div>
      ${ARRIVAL_INFO.transport.map((p) => `<div class="kv"><span><b>${L(p.name)}</b><small class="muted block">${L(p.notes)}</small></span></div>`).join('')}
      <p class="muted xs">${T('Live departures are not connected.', 'مواعيد الانطلاق المباشرة غير متصلة.')}</p></section>
    <section class="panel"><h2 class="h3">${icon('ticket')} ${T('Your ticket', 'تذكرتك')}</h2>
      <div class="notice">${icon('lock')}<span>${T('Ticket wallet not connected. Use your official ticket app at the gate. GolBite does not show tickets or entry codes.', 'محفظة التذاكر غير متصلة. استخدم تطبيق التذاكر الرسمي عند البوابة. GolBite لا يعرض تذاكر أو رموز دخول.')}</span></div>
      <div class="kv mt-s"><span>${T('Your seat (entered by you)', 'مقعدك (أدخلته بنفسك)')}</span><b>${seatLabel()}</b></div>
      <div class="kv"><span>${T('Suggested gate for Section', 'البوابة المقترحة للقسم')} ${sec}</span><b>${rec} ${dataBadge('demo')}</b></div></section>`;
}
function guideArrive(g) {
  return `<section class="panel"><h2 class="h3">🚪 ${T('Gates & entry rules', 'البوابات وقواعد الدخول')}</h2>
      <div class="row gap-xs wrap mb">${g.gates.map((id) => `<button class="chip ${S.setup.gate === id ? 'on' : ''}" data-act="setGate" data-arg="${id}">${L(GATES.find((x) => x.id === id).name)}</button>`).join('')}</div>
      <ul class="rules">${ARRIVAL_INFO.entryRules.map((r) => `<li>${L(r)}</li>`).join('')}</ul></section>
    <section class="panel"><h2 class="h3">♿ ${T('Accessible arrival', 'الوصول لذوي الإعاقة')}</h2><p class="small">${L(ARRIVAL_INFO.accessible)}</p>
      <button class="btn btn-ghost btn-sm mt-s" data-act="exploreGo" data-arg="access">${T('Show accessible facilities', 'اعرض مرافق ذوي الإعاقة')}</button></section>
    <section class="panel"><h2 class="h3">${icon('route')} ${T('Find your seat', 'اعثر على مقعدك')}</h2>
      <p class="small">${T(`Section ${S.setup.section}, row ${S.setup.row}, seat ${S.setup.seat}.`, `القسم ${S.setup.section}، الصف ${S.setup.row}، المقعد ${S.setup.seat}.`)}</p>
      <div class="row gap wrap mt-s"><button class="btn btn-orange btn-sm" data-act="findSeat" data-arg="${S.setup.section}">${T('Route to my seat', 'المسار إلى مقعدي')}</button><button class="btn btn-ghost btn-sm" data-act="go" data-arg="setup">${T('Correct my seat', 'تعديل المقعد')}</button></div></section>`;
}
function guideLeave() {
  const sec = SECTIONS[S.setup.section];
  const exits = DIRECTORY.filter((e) => e.exit).sort((a, b) => angDist(a.angle, sec.angle) - angDist(b.angle, sec.angle));
  return `<section class="panel"><h2 class="h3">🚪 ${T('Exit routes', 'مسارات الخروج')}</h2>
      ${exits.map((e) => `<div class="kv"><span><b>${dirName(e)}</b><small class="muted block">~${mins(routeSteps(e.angle, '').mins)} ${T('walk', 'مشياً')}${e.stepFree ? ' · ♿ ' + T('step-free', 'بدون درج') : ''}</small></span><button class="btn btn-ghost btn-sm" data-act="exploreItem" data-arg="${e.id}">${T('Directions', 'الاتجاهات')}</button></div>`).join('')}
      <p class="muted xs">${T('Follow steward instructions and official announcements when leaving.', 'اتبع تعليمات المنظمين والإعلانات الرسمية عند المغادرة.')}</p></section>
    <section class="panel"><h2 class="h3">🅿️ ${T('Where I parked', 'أين أوقفت سيارتي')}</h2>
      ${S.savedCar ? `<div class="kv"><span>${L(ARRIVAL_INFO.parking.find((p) => p.id === S.savedCar.zone)?.name)}</span><b>${esc(S.savedCar.note || '')}</b></div><button class="btn btn-ghost btn-sm" data-act="clearCar">${T('Forget saved location', 'احذف الموقع المحفوظ')}</button>`
        : `<p class="muted small">${T('Optional. Saved only on this device, and only if you choose to.', 'اختياري. يُحفظ على هذا الجهاز فقط وبموافقتك.')}</p>
        <form class="row gap wrap mt-s" data-submit="saveCar"><label class="field grow"><span>${T('Parking area', 'منطقة المواقف')}</span><select name="zone">${ARRIVAL_INFO.parking.map((p) => `<option value="${p.id}">${L(p.name)}</option>`).join('')}</select></label>
        <label class="field grow"><span>${T('Note (row, pillar…)', 'ملاحظة (الصف، العمود…)')}</span><input name="note" maxlength="40"/></label><button class="btn btn-primary" type="submit">${T('Save', 'حفظ')}</button></form>`}</section>
    <section class="panel"><h2 class="h3">🚌 ${T('Getting home', 'العودة')} ${dataBadge('scheduled')}</h2>
      ${ARRIVAL_INFO.transport.map((p) => `<div class="kv"><span><b>${L(p.name)}</b><small class="muted block">${L(p.notes)}</small></span></div>`).join('')}</section>
    <section class="panel"><h2 class="h3">${icon('help')} ${T('Lost property & support', 'المفقودات والدعم')}</h2><p class="small">${L(ARRIVAL_INFO.lostProperty)}</p>
      <div class="row gap wrap mt-s"><button class="btn btn-ghost btn-sm" data-act="supportStart" data-arg="lost">${T('Report lost property', 'أبلغ عن مفقودات')}</button><button class="btn btn-ghost btn-sm" data-act="go" data-arg="profile/orders">${T('Receipts', 'الإيصالات')}</button></div></section>
    ${S.match.phase === 'final' ? feedbackPanel() : ''}`;
}
function feedbackPanel() {
  if (S.feedback) return `<section class="panel"><h2 class="h3">⭐ ${T('Thanks for your feedback', 'شكراً لتقييمك')}</h2><p class="muted small">${'★'.repeat(S.feedback.stars)}${'☆'.repeat(5 - S.feedback.stars)} · ${T('Saved on this device (demo).', 'محفوظ على هذا الجهاز (تجريبي).')}</p></section>`;
  return `<section class="panel"><h2 class="h3">⭐ ${T('How was your visit?', 'كيف كانت زيارتك؟')}</h2>
    <div class="stars" role="group" aria-label="${T('Rating', 'التقييم')}">${[1, 2, 3, 4, 5].map((n) => `<button class="star" data-act="rateVisit" data-arg="${n}" aria-label="${n}">★</button>`).join('')}</div></section>`;
}
