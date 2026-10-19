/* GolBite — Club & Partner Hub: campaign results (one consistent dataset) and a guided offer builder. */

const PARTNER_NAV = [
  ['results', 'chart', { en: 'Campaign results', ar: 'نتائج الحملات' }],
  ['create', 'plusCircle', { en: 'Create offer', ar: 'إنشاء عرض' }],
];
let DRAFT = null;
function draftOffer() {
  if (!DRAFT) DRAFT = { step: 0, title: '', sponsor: SPONSORS[0], image: '🥤', reward: 'discount', discount: 25, items: ['d2'], moment: 'halftime', minute: 60, sections: ['A', 'B', 'C'], minutes: 10, limit: 200, tone: 'sponsor', errors: {} };
  return DRAFT;
}
const IMAGE_ITEM = { '🥤': 'd2', '🍔': 'b1', '🍟': 'f1', '☕': 'd3', '🍿': 's2', '🧣': 'm3', '⚽': 'm6', '🎁': 's4' };
const momentName = (id) => L(OFFER_MOMENTS.find((m) => m.id === id)?.name);
const offerStatus = (of) => (['paused', 'ended', 'draft'].includes(of.status) ? of.status : offerLive(of) ? 'live' : 'scheduled');
const OFFER_STATUS = () => ({ draft: T('Draft', 'مسودة'), scheduled: T('Scheduled', 'مجدول'), live: T('Live (demo)', 'مباشر (تجريبي)'), paused: T('Paused', 'متوقف'), ended: T('Ended', 'منتهي') });
const offerStatusChip = (of) => { const st = offerStatus(of); return `<span class="st-chip ${st === 'live' ? 's3' : st === 'paused' ? 'overdue' : st === 'ended' ? 'blocked' : 's1'}">${OFFER_STATUS()[st]}</span>`; };
const offerItems = (of) => of.items || [of.item];
const METRIC_DEFS = () => [
  [T('Views', 'المشاهدات'), T('Times the offer card was shown to an eligible fan.', 'عدد مرات ظهور بطاقة العرض لمشجع مؤهل.')],
  [T('Redemptions', 'الاستخدامات'), T('Times a fan added the offer to their order.', 'عدد مرات إضافة المشجع للعرض إلى طلبه.')],
  [T('Related orders', 'طلبات مرتبطة'), T('Placed orders that used the offer voucher.', 'الطلبات المنفذة التي استخدمت قسيمة العرض.')],
  [T('Usage rate', 'معدل الاستخدام'), T('Redemptions ÷ views.', 'الاستخدامات ÷ المشاهدات.')],
];

function viewPartner(tab) {
  tab = PARTNER_NAV.some(([k]) => k === tab) ? tab : 'results';
  return `<section class="page wide ws">
    <div class="ws-head">
      <div><small class="eyebrow">${T('Club / Partner Hub', 'مركز النادي والشركاء')}</small><h1 class="title">${L(PARTNER_NAV.find(([k]) => k === tab)[2])}</h1></div>
      <div class="ws-context">${pill(L(currentEvent().title))}${pill(T('Matchday', 'الجولة') + ' ' + S.season.matchday, 'brand')}${dataBadge('demo')}<span class="muted xs">${T('Simulated campaign data — no real measurement is connected', 'بيانات حملات محاكاة — لا يوجد قياس فعلي متصل')}</span></div>
    </div>
    ${tab === 'create' ? partnerCreate() : partnerResults()}
  </section>`;
}

/* ---------- results ---------- */
function partnerResults() {
  return live('partner-results', () => {
    const rows = S.offers.map((of) => ({ of, t: offerTotals(of) }));
    const tot = rows.reduce((a, { t }) => ({ v: a.v + t.v, r: a.r + t.r, o: a.o + t.o }), { v: 0, r: 0, o: 0 });
    const rate = (r, v) => (v ? ((r / v) * 100).toFixed(1) + '%' : '—');
    const byPhase = PHASES.map((p) => ({ p, r: S.offers.reduce((s, of) => s + (of.m?.[p]?.r || 0), 0) }));
    const maxP = Math.max(1, ...byPhase.map((x) => x.r));
    const bySec = ['A', 'B', 'C'].map((k) => ({ k, r: S.offers.reduce((s, of) => s + (of.s?.[k] || 0), 0) }));
    const maxS = Math.max(1, ...bySec.map((x) => x.r));
    const maxV = Math.max(1, ...rows.map(({ t }) => t.v));
    return `<div class="kpis">
      ${kpi(T('Views', 'المشاهدات'), tot.v.toLocaleString('en-US'), T('offer impressions', 'مرات ظهور العروض'))}
      ${kpi(T('Redemptions', 'الاستخدامات'), tot.r.toLocaleString('en-US'), T('offers redeemed', 'عروض مستخدمة'))}
      ${kpi(T('Related orders', 'طلبات مرتبطة'), tot.o.toLocaleString('en-US'), T('orders using an offer', 'طلبات استخدمت عرضاً'))}
      ${kpi(T('Usage rate', 'معدل الاستخدام'), rate(tot.r, tot.v), T('redemptions ÷ views', 'الاستخدامات ÷ المشاهدات'))}
    </div>
    <div class="ws-grid two">
      <section class="panel span-all">
        <div class="block-head"><h2 class="h3">${T('By offer', 'حسب العرض')}</h2><button class="btn btn-orange btn-sm" data-act="go" data-arg="partner/create">${icon('plus')} ${T('New offer', 'عرض جديد')}</button></div>
        <div class="tbl-wrap"><table class="tbl offers-tbl"><thead><tr><th>${T('Offer', 'العرض')}</th><th>${T('Moment', 'اللحظة')}</th><th>${T('Status', 'الحالة')}</th><th>${T('Views', 'المشاهدات')}</th><th>${T('Redemptions', 'الاستخدامات')}</th><th>${T('Orders', 'الطلبات')}</th><th>${T('Usage', 'الاستخدام')}</th><th></th></tr></thead>
        <tbody>${rows.map(({ of, t }) => `<tr>
          <td data-l="${T('Offer', 'العرض')}"><span class="offer-cell"><span class="oc-img">${of.image}</span><span><b>${esc(L(of.title))}</b><small class="muted block">${esc(of.sponsor)}</small></span></span></td>
          <td data-l="${T('Moment', 'اللحظة')}">${momentName(of.moment)}${of.moment === 'minute' ? ' ' + of.minute + "'" : ''}<small class="muted block">${of.minutes} ${T('min', 'د')} · ${offerItems(of).map((i) => item(i)?.emoji || '').join('')}</small></td>
          <td data-l="${T('Status', 'الحالة')}">${offerStatusChip(of)}</td>
          <td data-l="${T('Views', 'المشاهدات')}"><span class="cell-bar"><i style="width:${(t.v / maxV) * 100}%"></i></span>${t.v.toLocaleString('en-US')}</td>
          <td data-l="${T('Redemptions', 'الاستخدامات')}">${t.r}${of.limit ? `<small class="muted"> / ${of.limit}</small>` : ''}</td>
          <td data-l="${T('Orders', 'الطلبات')}">${t.o}</td>
          <td data-l="${T('Usage', 'الاستخدام')}">${rate(t.r, t.v)}</td>
          <td data-l=""><div class="row gap-xs wrap"><button class="btn btn-ghost btn-sm" data-act="previewOffer" data-arg="${of.id}">${icon('eye')} ${T('Preview', 'معاينة')}</button>
            ${offerStatus(of) !== 'ended' ? `<button class="btn btn-ghost btn-sm" data-act="offerPause" data-arg="${of.id}">${of.status === 'paused' ? T('Resume', 'استئناف') : T('Pause', 'إيقاف')}</button><button class="btn btn-ghost btn-sm" data-act="offerEdit" data-arg="${of.id}">${icon('edit')} ${T('Edit', 'تعديل')}</button><button class="btn btn-ghost btn-sm danger" data-act="offerEnd" data-arg="${of.id}">${T('End', 'إنهاء')}</button>` : ''}</div></td></tr>`).join('')}
          <tr class="tot-row"><td data-l="">${T('Total', 'المجموع')}</td><td></td><td></td><td data-l="${T('Views', 'المشاهدات')}">${tot.v.toLocaleString('en-US')}</td><td data-l="${T('Redemptions', 'الاستخدامات')}">${tot.r}</td><td data-l="${T('Orders', 'الطلبات')}">${tot.o}</td><td data-l="${T('Usage', 'الاستخدام')}">${rate(tot.r, tot.v)}</td><td></td></tr></tbody></table></div>
      </section>
      <section class="panel">
        <div class="block-head"><h2 class="h3">${T('Redemptions by match moment', 'الاستخدامات حسب لحظة المباراة')}</h2><small class="muted">${T('Total', 'المجموع')} ${tot.r}</small></div>
        <div class="vbars">${byPhase.map(({ p, r }) => `<div class="vbar ${S.match.phase === p ? 'now' : ''}"><b>${r}</b><i style="height:${(r / maxP) * 100}%"></i><small>${phaseLabel(p)}</small></div>`).join('')}</div>
      </section>
      <section class="panel span-all">
        <div class="block-head"><h2 class="h3">${T('Metric definitions', 'تعريف المقاييس')}</h2>${dataBadge('demo')}</div>
        <dl class="defs">${METRIC_DEFS().map(([k, d]) => `<div><dt>${k}</dt><dd>${d}</dd></div>`).join('')}</dl>
        <p class="muted xs">${T('All figures are generated by the simulation. Real measurement needs a connected analytics integration and consent rules.', 'كل الأرقام من المحاكاة. القياس الفعلي يحتاج تكامل تحليلات متصل وقواعد موافقة.')}</p>
      </section>
      <section class="panel">
        <div class="block-head"><h2 class="h3">${T('Redemptions by section', 'الاستخدامات حسب القسم')}</h2><small class="muted">${T('Total', 'المجموع')} ${tot.r}</small></div>
        <ul class="zone-list">${bySec.map(({ k, r }) => `<li><span>${T('Section', 'القسم')} ${k}</span><span class="bar"><i style="width:${(r / maxS) * 100}%;background:var(--orange)"></i></span><b>${r}</b></li>`).join('')}</ul>
      </section>
    </div>`;
  });
}

/* ---------- guided offer builder ---------- */
const STEPS = () => [T('Offer', 'العرض'), T('Audience & trigger', 'الجمهور والتوقيت'), T('Duration', 'المدة'), T('Review', 'المراجعة')];

function previewOfferObj(d) {
  return { ...d, item: d.items[0] || IMAGE_ITEM[d.image] || 'd2', discount: d.reward === 'free' ? 100 : d.discount, title: { en: d.title || T('Your offer title', 'عنوان عرضك'), ar: d.title || 'عنوان عرضك' } };
}

function partnerCreate() {
  const d = draftOffer();
  const err = (k) => (d.errors[k] ? `<p class="field-error">${d.errors[k]}</p>` : '');
  let body = '';
  if (d.step === 0) {
    body = `<label class="field"><span>${T('Offer title', 'عنوان العرض')} *</span><input name="title" data-input="draftTitle" value="${esc(d.title)}" maxlength="48" placeholder="${T('e.g. Goal-time fries 30% off', 'مثال: بطاطس الهدف بخصم 30%')}" aria-invalid="${!!d.errors.title}"/></label>${err('title')}
      <label class="field"><span>${T('Partner', 'الشريك')}</span><select data-change="draftSponsor">${[...SPONSORS, 'Falcon Grill', myTeam().name.en].map((s) => `<option ${d.sponsor === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
      <span class="field-label">${T('Image', 'الصورة')}</span>
      <div class="row gap-xs wrap">${OFFER_IMAGES.map((e) => `<button type="button" class="img-pick ${d.image === e ? 'on' : ''}" data-act="draftImage" data-arg="${e}" aria-pressed="${d.image === e}" aria-label="${e}">${e}</button>`).join('')}</div>
      <span class="field-label">${T('Reward', 'المكافأة')}</span>
      <div class="seg w-full"><button type="button" class="${d.reward === 'discount' ? 'on' : ''}" data-act="draftSet" data-arg="reward:discount">${T('Discount', 'خصم')}</button><button type="button" class="${d.reward === 'free' ? 'on' : ''}" data-act="draftSet" data-arg="reward:free">${T('Free item', 'صنف مجاني')}</button></div>
      ${d.reward === 'discount' ? `<label class="field"><span>${T('Discount', 'الخصم')}: <b id="disc-out">${d.discount}%</b></span><input type="range" min="5" max="90" step="5" value="${d.discount}" data-input="draftDiscount"/></label>` : ''}
      <span class="field-label">${T('Eligible products', 'المنتجات المؤهلة')} *</span>
      <div class="row gap-xs wrap">${CATALOG.filter((m) => !m.special).map((m) => `<button type="button" class="chip sm ${d.items.includes(m.id) ? 'on' : ''}" data-act="draftItem" data-arg="${m.id}" aria-pressed="${d.items.includes(m.id)}">${m.emoji} ${L(m.name)}</button>`).join('')}</div>${err('items')}
      <span class="field-label">${T('Style', 'النوع')}</span>
      <div class="seg w-full"><button type="button" class="${d.tone === 'sponsor' ? 'on' : ''}" data-act="draftSet" data-arg="tone:sponsor">${T('Sponsor moment', 'لحظة الراعي')}</button><button type="button" class="${d.tone === 'team' ? 'on' : ''}" data-act="draftSet" data-arg="tone:team">${T('Team offer', 'عرض الفريق')}</button></div>`;
  } else if (d.step === 1) {
    body = `<span class="field-label">${T('Eligible sections', 'الأقسام المؤهلة')} *</span>
      <div class="row gap-xs wrap">${Object.keys(SECTIONS).map((k) => `<button type="button" class="chip ${d.sections.includes(k) ? 'on' : ''}" data-act="draftSection" data-arg="${k}" aria-pressed="${d.sections.includes(k)}">${T('Section', 'القسم')} ${k}</button>`).join('')}</div>${err('sections')}
      <span class="field-label">${T('Match moment / trigger', 'لحظة المباراة / المحفّز')}</span>
      <div class="moment-grid">${OFFER_MOMENTS.map((m) => `<button type="button" class="moment-opt ${d.moment === m.id ? 'on' : ''}" data-act="draftMoment" data-arg="${m.id}" aria-pressed="${d.moment === m.id}">${L(m.name)}</button>`).join('')}</div>
      ${d.moment === 'minute' ? `<label class="field"><span>${T('Match minute', 'دقيقة المباراة')}</span><input type="number" min="1" max="90" value="${d.minute}" data-input="draftMinute" aria-invalid="${!!d.errors.minute}"/></label>${err('minute')}` : ''}`;
  } else if (d.step === 2) {
    body = `<label class="field"><span>${T('Runs for', 'المدة')}: <b id="minutes-out">${d.minutes} ${T('min', 'د')}</b></span><input type="range" min="1" max="30" value="${d.minutes}" data-input="draftMinutes"/></label>
      <label class="field"><span>${T('Redemption limit (0 = no limit)', 'حد الاستخدام (0 = بلا حد)')}</span><input type="number" min="0" max="5000" value="${d.limit}" data-input="draftLimit" aria-invalid="${!!d.errors.limit}"/></label>${err('limit')}
      <div class="kv mt-s"><span>${T('Starts', 'يبدأ')}</span><b>${d.moment === 'minute' ? T(`At ${d.minute}'`, `في الدقيقة ${d.minute}`) : momentName(d.moment)}</b></div>
      <div class="kv"><span>${T('Ends', 'ينتهي')}</span><b>${d.moment === 'minute' ? T(`At ${Math.min(90, +d.minute + d.minutes)}'`, `في الدقيقة ${Math.min(90, +d.minute + d.minutes)}`) : T(`${d.minutes} min after it starts`, `بعد ${d.minutes} د من البداية`)}</b></div>
      <p class="muted small mt-s">${T('Fans see a live countdown on the offer card.', 'يرى المشجعون عداً تنازلياً على بطاقة العرض.')}</p>`;
  } else {
    body = `<div class="review">
      <div class="kv"><span>${T('Title', 'العنوان')}</span><b>${esc(d.title)}</b></div>
      <div class="kv"><span>${T('Partner', 'الشريك')}</span><b>${esc(d.sponsor)}</b></div>
      <div class="kv"><span>${T('Reward', 'المكافأة')}</span><b>${d.reward === 'free' ? T('Free item', 'صنف مجاني') : d.discount + '% ' + T('off', 'خصم')}</b></div>
      <div class="kv"><span>${T('Eligible products', 'المنتجات المؤهلة')}</span><b>${d.items.map((i) => L(item(i).name)).join('، ')}</b></div>
      <div class="kv"><span>${T('Redemption limit', 'حد الاستخدام')}</span><b>${+d.limit ? d.limit : T('No limit', 'بلا حد')}</b></div>
      <div class="kv"><span>${T('Sections', 'الأقسام')}</span><b>${d.sections.join('، ')}</b></div>
      <div class="kv"><span>${T('Trigger', 'المحفّز')}</span><b>${momentName(d.moment)}${d.moment === 'minute' ? ' ' + d.minute + "'" : ''}</b></div>
      <div class="kv"><span>${T('Duration', 'المدة')}</span><b>${d.minutes} ${T('min', 'د')}</b></div></div>
      <p class="muted xs mt-s">${T('Partner offers are reviewed by the venue before going live in production. Here it is scheduled immediately (demo).', 'في الإنتاج تُراجع عروض الشركاء من الملعب قبل النشر. هنا تُجدول مباشرة (تجريبي).')}</p>`;
  }
  return `<div class="ws-split builder">
    <form class="panel" data-submit="offerNext" novalidate>
      <ol class="stepper-bar">${STEPS().map((s, i) => `<li class="${i < d.step ? 'done' : i === d.step ? 'now' : ''}"><button type="button" data-act="draftStep" data-arg="${i}" ${i > d.step ? 'disabled' : ''}><i>${i < d.step ? icon('check') : i + 1}</i><span>${s}</span></button></li>`).join('')}</ol>
      <div class="builder-body">${body}</div>
      <div class="row gap mt">
        ${d.step > 0 ? `<button type="button" class="btn btn-ghost" data-act="draftStep" data-arg="${d.step - 1}">${icon('back', 'flip')} ${T('Back', 'رجوع')}</button>` : ''}
        <button type="submit" class="btn btn-orange grow">${d.step === 3 ? icon('megaphone') + ' ' + (d.editing ? T('Save changes', 'حفظ التغييرات') : T('Schedule offer', 'جدولة العرض')) : T('Continue', 'متابعة')}</button>
      </div>
    </form>
    <aside class="panel preview-panel">
      <div class="block-head"><h2 class="h3">${icon('eye')} ${T('Fan preview', 'معاينة المشجع')}</h2><small class="muted">${T('Updates as you edit', 'تتحدّث أثناء التعديل')}</small></div>
      <div class="phone"><div class="phone-in">
        <div class="phone-hero">${stadiumArt()}<b>${esc(L(currentEvent().title))}</b></div>
        <small class="muted row gap-xs">${sunMark(14, 'brand-sun')} ${T('Matchday Companion · Now', 'رفيق المباراة · الآن')}</small>
        <div id="offer-preview">${offerCard(previewOfferObj(d), true)}</div>
      </div></div>
      <p class="muted small mt-s">${T('Shown to', 'يظهر لـ')}: ${d.sections.map((k) => T('Section', 'القسم') + ' ' + k).join('، ')} · ${momentName(d.moment)}${d.moment === 'minute' ? ' ' + d.minute + "'" : ''}</p>
    </aside>
  </div>`;
}

function validateDraft(d) {
  d.errors = {};
  if (d.step === 0 && !d.title.trim()) d.errors.title = T('Add a short title fans will understand.', 'أضف عنواناً قصيراً يفهمه المشجعون.');
  if (d.step === 0 && !d.items.length) d.errors.items = T('Choose at least one eligible product.', 'اختر منتجاً مؤهلاً واحداً على الأقل.');
  if (d.step === 2 && !(+d.limit >= 0)) d.errors.limit = T('Enter 0 or a positive number.', 'أدخل 0 أو رقماً موجباً.');
  if (d.step === 1 && !d.sections.length) d.errors.sections = T('Choose at least one section.', 'اختر قسماً واحداً على الأقل.');
  if (d.step === 1 && d.moment === 'minute' && !(d.minute >= 1 && d.minute <= 90)) d.errors.minute = T('Enter a minute between 1 and 90.', 'أدخل دقيقة بين 1 و 90.');
  return !Object.keys(d.errors).length;
}

const PARTNER_ACTIONS = {
  draftItem: (id) => { const d = draftOffer(); d.items = d.items.includes(id) ? d.items.filter((x) => x !== id) : [...d.items, id]; rerender(); },
  offerPause: (id) => { const of = S.offers.find((o) => o.id === id); of.status = of.status === 'paused' ? 'scheduled' : 'paused'; logActivity('partner', `${L(of.title)}: ${OFFER_STATUS()[offerStatus(of)]}`); commit(); },
  offerEnd: (id) => { const of = S.offers.find((o) => o.id === id); confirmSheet({ title: T('End this offer?', 'إنهاء هذا العرض؟'), body: T('Fans stop seeing it immediately. Results are kept.', 'يتوقف ظهوره للمشجعين فوراً. تبقى النتائج.'), ok: T('End offer', 'إنهاء العرض'), danger: true, onOk: () => { of.status = 'ended'; logActivity('partner', `${L(of.title)}: ${OFFER_STATUS().ended}`); commit(); } }); },
  offerEdit: (id) => {
    const of = S.offers.find((o) => o.id === id);
    DRAFT = { step: 0, editing: id, title: L(of.title), sponsor: of.sponsor, image: of.image, reward: of.discount >= 100 ? 'free' : 'discount', discount: of.discount >= 100 ? 25 : of.discount, items: [...offerItems(of)], moment: of.moment, minute: of.minute || 60, sections: [...of.sections], minutes: of.minutes, limit: of.limit || 0, tone: of.tone || 'sponsor', errors: {} };
    go('partner/create');
  },
};
const PARTNER_CHANGES = {};
