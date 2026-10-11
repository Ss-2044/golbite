/* GolBite — Club & Partner Hub: create offers, preview in the Companion, campaign results. */

let DRAFT = null;
let PARTNER_TAB = 'create';
function draftOffer() {
  if (!DRAFT) DRAFT = { title: '', sponsor: SPONSORS[0], image: '🥤', moment: 'goal', minute: 60, sections: ['A', 'B', 'C'], minutes: 5, discount: 25, tone: 'sponsor' };
  return DRAFT;
}

function viewPartner() {
  const tabs = [['create', T('Create offer', 'إنشاء عرض'), 'plus'], ['results', T('Campaign results', 'نتائج الحملات'), 'chart']];
  return `<section class="page wide">
    <small class="eyebrow">${T('Club / Partner', 'النادي / الشريك')}</small>
    <h1 class="title">${T('Partner Hub', 'مركز الشركاء')}</h1>
    <p class="muted">${T('Placeholder partners and simulated engagement data.', 'شركاء افتراضيون وبيانات تفاعل محاكاة.')}</p>
    <div class="tabs mt-s" role="tablist">${tabs.map(([k, l, ic]) => `<button role="tab" aria-selected="${PARTNER_TAB === k}" class="tab ${PARTNER_TAB === k ? 'on' : ''}" data-act="partnerTab" data-arg="${k}">${icon(ic)} ${l}</button>`).join('')}</div>
    <div class="mt-s">${PARTNER_TAB === 'create' ? partnerCreate() : partnerResults()}</div>
  </section>`;
}

function partnerCreate() {
  const d = draftOffer();
  return `<div class="ops-layout">
    <form class="card" data-submit="publishOffer" novalidate>
      <h2 class="h3">${T('New matchday offer', 'عرض جديد ليوم المباراة')}</h2>
      <label class="field"><span>${T('Offer title', 'عنوان العرض')}</span><input name="title" data-input="draftTitle" value="${esc(d.title)}" maxlength="48" placeholder="${T('e.g. Goal-time Fizz 2-for-1', 'مثال: مشروبات الهدف اثنان بسعر واحد')}" required/></label>
      <p class="field-error" id="offer-error" hidden>${T('Please add a title.', 'الرجاء إضافة عنوان.')}</p>
      <div class="row gap"><label class="field grow"><span>${T('Partner', 'الشريك')}</span><select data-change="draftSponsor">${[...SPONSORS, 'Falcon Grill', myTeam().name.en].map((s) => `<option ${d.sponsor === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
        <label class="field"><span>${T('Discount %', 'الخصم %')}</span><input type="number" min="5" max="100" step="5" value="${d.discount}" data-input="draftDiscount"/></label></div>
      <span class="field-label">${T('Image', 'الصورة')}</span>
      <div class="row gap wrap">${OFFER_IMAGES.map((e) => `<button type="button" class="img-pick ${d.image === e ? 'on' : ''}" data-act="draftImage" data-arg="${e}" aria-pressed="${d.image === e}">${e}</button>`).join('')}</div>
      <span class="field-label mt-s">${T('Event moment', 'لحظة الحدث')}</span>
      <div class="row gap wrap">${OFFER_MOMENTS.map((m) => `<button type="button" class="chip ${d.moment === m.id ? 'on' : ''}" data-act="draftMoment" data-arg="${m.id}">${L(m.name)}</button>`).join('')}</div>
      ${d.moment === 'minute' ? `<label class="field mt-s"><span>${T('Match minute', 'دقيقة المباراة')}</span><input type="number" min="1" max="90" value="${d.minute}" data-input="draftMinute"/></label>` : ''}
      <span class="field-label mt-s">${T('Eligible sections', 'الأقسام المؤهلة')}</span>
      <div class="row gap wrap">${Object.keys(SECTIONS).map((k) => `<button type="button" class="chip ${d.sections.includes(k) ? 'on' : ''}" data-act="draftSection" data-arg="${k}" aria-pressed="${d.sections.includes(k)}">${T('Section', 'القسم')} ${k}</button>`).join('')}</div>
      <label class="field mt-s"><span>${T('Countdown (minutes)', 'العد التنازلي (دقائق)')}</span><input type="range" min="1" max="20" value="${d.minutes}" data-input="draftMinutes"/><small class="muted" id="minutes-out">${d.minutes} ${T('min', 'د')}</small></label>
      <div class="seg w-full mt-s"><button type="button" class="${d.tone === 'sponsor' ? 'on' : ''}" data-act="draftTone" data-arg="sponsor">${T('Sponsor moment', 'لحظة الراعي')}</button><button type="button" class="${d.tone === 'team' ? 'on' : ''}" data-act="draftTone" data-arg="team">${T('Team offer', 'عرض الفريق')}</button></div>
      <button class="btn btn-orange btn-lg w-full mt" type="submit">${icon('megaphone')} ${T('Schedule offer', 'جدولة العرض')}</button>
    </form>
    <aside>
      <div class="card"><h2 class="h3">${icon('eye')} ${T('Fan preview', 'معاينة المشجع')}</h2>
        <div class="phone"><div class="phone-in">
          <div class="phone-hero">${stadiumArt()}<b>${esc(L(currentEvent().title))}</b></div>
          <small class="muted">${sunMark(14, 'brand-sun')} ${T('Matchday Companion', 'رفيق المباراة')}</small>
          <div id="offer-preview">${offerCard({ ...d, title: { en: d.title || T('Your offer title', 'عنوان عرضك'), ar: d.title || 'عنوان عرضك' } }, true)}</div>
          <small class="muted">${T('Shows', 'يظهر')}: ${L(OFFER_MOMENTS.find((m) => m.id === d.moment).name)}${d.moment === 'minute' ? ' ' + d.minute + "'" : ''} · ${d.sections.join(', ')}</small>
        </div></div>
      </div>
      <div class="card mt"><h2 class="h3">${T('Sample sponsor moments', 'لحظات رعاة نموذجية')}</h2>
        ${S.offers.map((o) => `<div class="kv"><span>${o.image} ${esc(L(o.title))}<br/><small class="muted">${esc(o.sponsor)} · ${L(OFFER_MOMENTS.find((m) => m.id === o.moment)?.name)}</small></span>
          <span class="row gap">${live('ol-' + o.id, () => pill(offerLive(o) ? T('Live', 'مباشر') : T('Scheduled', 'مجدول'), offerLive(o) ? 'calm' : ''), 'span')}
          <button class="btn btn-ghost btn-sm" data-act="previewOffer" data-arg="${o.id}">${T('Preview', 'معاينة')}</button></span></div>`).join('')}
      </div>
    </aside>
  </div>`;
}

function partnerResults() {
  return live('partner-results', () => {
    const tot = S.offers.reduce((a, o) => ({ v: a.v + o.views, r: a.r + o.redemptions, o: a.o + o.orders }), { v: 0, r: 0, o: 0 });
    const maxV = Math.max(...S.offers.map((o) => o.views));
    const byPhase = {};
    PHASES.forEach((p) => (byPhase[p] = S.offers.reduce((s, o) => s + ((o.byMoment || {})[p] || 0), 0) + { arrival: 40, prematch: 120, kickoff: 90, halftime: 210, second: 110, final: 30 }[p]));
    const maxP = Math.max(...Object.values(byPhase));
    const sec = { A: 0, B: 0, C: 0 };
    S.offers.forEach((o) => o.sections.forEach((k) => (sec[k] += o.redemptions / o.sections.length)));
    const maxS = Math.max(...Object.values(sec), 1);
    return `<div class="kpis">${statCard(T('Views', 'المشاهدات'), tot.v.toLocaleString('en-US'))}${statCard(T('Redemptions', 'الاستخدامات'), tot.r.toLocaleString('en-US'))}${statCard(T('Related orders', 'طلبات مرتبطة'), tot.o.toLocaleString('en-US'))}${statCard(T('Redemption rate', 'معدل الاستخدام'), ((tot.r / Math.max(1, tot.v)) * 100).toFixed(1) + '%')}</div>
    <div class="play-grid mt">
      <div class="card"><h2 class="h3">${T('By offer', 'حسب العرض')}</h2>
        <table class="tbl"><thead><tr><th>${T('Offer', 'العرض')}</th><th>${T('Views', 'مشاهدات')}</th><th>${T('Redeemed', 'استخدام')}</th><th>${T('Orders', 'طلبات')}</th></tr></thead>
        <tbody>${S.offers.map((o) => `<tr><td>${o.image} ${esc(L(o.title))}${offerLive(o) ? ' ' + pill(T('Live', 'مباشر'), 'calm') : ''}</td><td><span class="cell-bar"><i style="width:${(o.views / maxV) * 100}%"></i></span>${o.views}</td><td>${o.redemptions}</td><td>${o.orders}</td></tr>`).join('')}</tbody></table></div>
      <div class="card"><h2 class="h3">${T('Engagement by event moment', 'التفاعل حسب لحظة الحدث')}</h2>
        <div class="vbars">${PHASES.map((p) => `<div class="vbar ${S.match.phase === p ? 'now' : ''}"><i style="height:${(byPhase[p] / maxP) * 100}%"></i><small>${phaseLabel(p)}</small><b>${byPhase[p]}</b></div>`).join('')}</div></div>
      <div class="card"><h2 class="h3">${T('Redemptions by section', 'الاستخدام حسب القسم')}</h2>
        <ul class="zone-list">${Object.entries(sec).map(([k, v]) => `<li><span>${T('Section', 'القسم')} ${k}</span><span class="bar"><i style="width:${(v / maxS) * 100}%;background:var(--orange)"></i></span><b>${Math.round(v)}</b></li>`).join('')}</ul></div>
    </div>`;
  });
}
