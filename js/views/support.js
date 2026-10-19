/* GolBite — support and service recovery. Every outcome here is simulated: nothing is sent to a real
   support desk and no refund or payment is processed (see Services.support / Services.payments). */

const SUPPORT_KINDS = {
  late: { icon: '⏱️', name: { en: 'My order is late', ar: 'طلبي متأخر' } },
  wrong: { icon: '🔄', name: { en: 'Incorrect item', ar: 'صنف خاطئ' } },
  missing: { icon: '❓', name: { en: 'Something is missing', ar: 'صنف ناقص' } },
  notcollected: { icon: '🛍️', name: { en: "I couldn't collect my order", ar: 'لم أستطع استلام طلبي' } },
  cancel: { icon: '✖️', name: { en: 'Cancel my order', ar: 'إلغاء طلبي' } },
  facility: { icon: '🚻', name: { en: 'A facility is unavailable or dirty', ar: 'مرفق غير متاح أو غير نظيف' } },
  assist: { icon: '♿', name: { en: 'I need assistance', ar: 'أحتاج مساعدة' } },
  lost: { icon: '🎒', name: { en: 'Lost property', ar: 'مفقودات' } },
};

function viewSupport() {
  const recent = S.orders.slice(0, 4);
  return `<section class="page narrow support">
    <h1 class="title">${T('Help & support', 'المساعدة والدعم')}</h1>
    <div class="notice">${icon('help')}<span>${t('demo.notReal')}</span></div>
    ${S.ops.notice ? noticeCard(S.ops.notice) : ''}
    <section class="panel safety">
      <h2 class="h3">⛑️ ${T('Emergency or safety concern', 'طوارئ أو مخاوف أمنية')}</h2>
      <p class="small">${T('Go to the nearest steward or first-aid point and follow official venue announcements. GolBite does not replace the venue’s emergency process.', 'توجّه لأقرب منظم أو نقطة إسعاف واتبع إعلانات الملعب الرسمية. GolBite لا يحل محل إجراءات الطوارئ في الملعب.')}</p>
      <button class="btn btn-ghost btn-sm mt-s" data-act="exploreGo" data-arg="firstaid">${T('Show first-aid points', 'اعرض نقاط الإسعاف')}</button>
    </section>
    ${recent.length ? `<section class="panel"><h2 class="h3">${icon('receipt')} ${T('Help with an order', 'مساعدة بخصوص طلب')}</h2>
      ${recent.map((o) => `<button class="kv kv-btn" data-act="orderHelp" data-arg="${o.id}"><span>${o.items.slice(0, 3).map((i) => item(i.id).emoji).join('')} <b>${o.id}</b></span><span class="row gap-xs"><span class="status-chip sm st-${o.status}">${stageLabel(o.stage)}</span>${icon('chevron', 'flip')}</span></button>`).join('')}</section>` : ''}
    <section class="panel"><h2 class="h3">${icon('pin')} ${T('At the venue', 'في الملعب')}</h2>
      <div class="list">${['facility', 'assist', 'lost'].map((k) => `<button class="choice" data-act="supportStart" data-arg="${k}">${foodTile(SUPPORT_KINDS[k].icon)}<span class="grow"><b>${L(SUPPORT_KINDS[k].name)}</b></span>${icon('chevron', 'flip')}</button>`).join('')}</div></section>
    <section class="panel"><h2 class="h3">${T('My requests', 'طلباتي')}</h2>
      ${S.support.length ? S.support.map((r) => `<div class="req"><div class="row between"><b>${SUPPORT_KINDS[r.kind].icon} ${L(SUPPORT_KINDS[r.kind].name)}${r.orderId ? ' · ' + r.orderId : ''}</b><span class="st-chip ${r.status === 'resolved' ? 's3' : 's1'}">${r.status === 'resolved' ? T('Resolved (demo)', 'تم الحل (تجريبي)') : T('Received (demo)', 'مستلم (تجريبي)')}</span></div><p class="small">${esc(L(r.outcome))}</p><small class="muted">${T('Next', 'التالي')}: ${esc(L(r.next))}</small></div>`).join('')
        : `<p class="muted small">${T('No requests yet.', 'لا توجد طلبات بعد.')}</p>`}</section>
  </section>`;
}

/* Order-specific help: shows only the options that make sense for the order's current stage. */
function orderHelpSheet(id) {
  const o = S.orders.find((x) => x.id === id);
  const canCancel = ['placed', 'accepted'].includes(o.stage);
  const opts = [];
  if (!isFinal(o)) opts.push('late');
  if (isFinal(o) && o.stage !== 'cancelled') opts.push('wrong', 'missing');
  if (o.type === 'pickup' && o.stage === 'ready') opts.push('notcollected');
  if (canCancel) opts.push('cancel');
  return `<h2 class="sheet-title">${T('Order help', 'مساعدة الطلب')} · ${o.id}</h2>
    <p class="muted small">${T('Current status', 'الحالة الحالية')}: <b>${stageLabel(o.stage)}</b>. ${!canCancel && !isFinal(o) ? T('The kitchen has started, so cancellation goes through support.', 'بدأ المطبخ التحضير، لذا يتم الإلغاء عبر الدعم.') : ''}</p>
    <div class="list mt-s">${opts.map((k) => `<button class="choice" data-act="helpResolve" data-arg="${id}:${k}">${foodTile(SUPPORT_KINDS[k].icon)}<span class="grow"><b>${L(SUPPORT_KINDS[k].name)}</b></span></button>`).join('') || `<p class="muted small">${T('This order is closed. Contact guest services for anything else.', 'هذا الطلب مغلق. تواصل مع خدمة الزوار لأي شيء آخر.')}</p>`}</div>
    <p class="muted xs mt">${t('demo.notReal')}</p>`;
}

function supportSheet(kind) {
  const facilities = DIRECTORY.filter((e) => !['food', 'merch', 'pickup', 'travel', 'charging'].includes(e.cat));
  return `<h2 class="sheet-title">${SUPPORT_KINDS[kind].icon} ${L(SUPPORT_KINDS[kind].name)}</h2>
    <form data-submit="supportSubmit" novalidate>
      <input type="hidden" name="kind" value="${kind}"/>
      ${kind === 'facility' ? `<label class="field"><span>${T('Which facility?', 'أي مرفق؟')}</span><select name="where">${facilities.map((e) => `<option value="${e.id}">${dirName(e)}</option>`).join('')}</select></label>` : ''}
      ${kind === 'assist' ? `<label class="field"><span>${T('What do you need?', 'ماذا تحتاج؟')}</span><select name="need"><option>${T('Wheelchair assistance', 'مساعدة بالكرسي المتحرك')}</option><option>${T('Help finding my seat', 'مساعدة في إيجاد مقعدي')}</option><option>${T('Lost child / family member', 'طفل أو فرد مفقود')}</option></select></label>` : ''}
      <label class="field"><span>${T('Details (optional)', 'تفاصيل (اختياري)')}</span><textarea name="text" rows="2" maxlength="160"></textarea></label>
      <p class="muted xs mt-s">${T('We only use your seat and these details for this request.', 'نستخدم مقعدك وهذه التفاصيل لهذا الطلب فقط.')} ${t('demo.notReal')}</p>
      <button class="btn btn-orange w-full mt" type="submit">${T('Send request (demo)', 'إرسال الطلب (تجريبي)')}</button>
    </form>`;
}

/* Recovery panel shown on the tracking screen when something went wrong after ordering. */
function recoveryPanel(o) {
  if (!o.issue || isFinal(o)) return '';
  if (o.issue.kind === 'soldout') {
    const bad = item(o.issue.item), alt = item(ALTERNATIVES[o.issue.item]);
    return `<div class="recovery">
      <b>${icon('alert')} ${T(`${L(bad.name)} became unavailable after you ordered.`, `أصبح ${L(bad.name)} غير متاح بعد طلبك.`)}</b>
      <p class="small">${T('Choose what happens next. The rest of your order keeps its place in the queue.', 'اختر ما يحدث بعد ذلك. بقية طلبك تحتفظ بمكانها في الطابور.')}</p>
      <div class="row gap wrap">
        ${alt && itemAvailable(alt.id) ? `<button class="btn btn-primary btn-sm" data-act="recover" data-arg="${o.id}:sub">${T('Swap for', 'استبدل بـ')} ${L(alt.name)}</button>` : ''}
        ${o.items.length > 1 ? `<button class="btn btn-ghost btn-sm" data-act="recover" data-arg="${o.id}:remove">${T('Remove it (demo refund)', 'احذفه (استرداد تجريبي)')}</button>` : ''}
        <button class="btn btn-ghost btn-sm danger" data-act="recover" data-arg="${o.id}:cancel">${t('act.cancel')}</button>
      </div></div>`;
  }
  if (o.issue.kind === 'rejected') {
    const v = vendor(o.issue.vid);
    const tk = o.tasks.find((x) => x.vid === o.issue.vid);
    const alt = VENDORS.find((x) => x.id !== v.id && !vendorPaused(x.id) && tk.items.every((i) => x.cats.includes(item(i.id).cat)));
    return `<div class="recovery">
      <b>${icon('alert')} ${T(`${L(v.name)} can't complete part of your order.`, `${L(v.name)} لا يستطيع إكمال جزء من طلبك.`)}</b>
      <p class="small">${tk.items.map((i) => `${i.qty}× ${lineName(i.id, i.opt)}`).join('، ')}</p>
      <div class="row gap wrap">
        ${alt ? `<button class="btn btn-primary btn-sm" data-act="recover" data-arg="${o.id}:reroute">${T('Send to', 'أرسله إلى')} ${L(alt.name)}</button>` : ''}
        ${o.tasks.length > 1 ? `<button class="btn btn-ghost btn-sm" data-act="recover" data-arg="${o.id}:dropvendor">${T('Remove those items (demo refund)', 'احذف هذه الأصناف (استرداد تجريبي)')}</button>` : ''}
        <button class="btn btn-ghost btn-sm danger" data-act="recover" data-arg="${o.id}:cancel">${t('act.cancel')}</button>
      </div></div>`;
  }
  return '';
}

/* Simulated outcome for a support request. Updates the demo order where it makes sense and always says
   what happens next. Nothing leaves this browser. */
function resolveSupport(kind, o, where) {
  const R = (en, ar) => ({ en, ar });
  switch (kind) {
    case 'late':
      if (o && !isFinal(o)) { o.priority = true; o.delay = 0; o.tasks.forEach((tk) => (tk.need = Math.max(1, tk.need - 3))); }
      return { status: 'received', outcome: R('The kitchen was asked to prioritise your order (simulated).', 'طُلب من المطبخ إعطاء طلبك أولوية (محاكاة).'), next: R('Watch the estimate on your tracking screen. If it is still late, contact the pickup desk.', 'تابع الوقت المتوقع في صفحة التتبع. إذا استمر التأخير تواصل مع مكتب الاستلام.') };
    case 'wrong':
    case 'missing':
      return { status: 'received', outcome: R('A replacement at no charge has been requested (simulated). No real refund or payment is processed.', 'تم طلب بديل بدون تكلفة (محاكاة). لا تتم معالجة أي استرداد أو دفع حقيقي.'), next: R(`Show order ${o ? o.id : ''} and code ${o ? o.code : ''} at the pickup desk.`, `أظهر الطلب ${o ? o.id : ''} والرمز ${o ? o.code : ''} في مكتب الاستلام.`) };
    case 'notcollected':
      if (o && o.stage === 'ready') { o.stageTick = S.simTick; o.uncollectedNotice = false; }
      return { status: 'resolved', outcome: R('Your order will be held for another 15 minutes (simulated).', 'سيتم الاحتفاظ بطلبك 15 دقيقة إضافية (محاكاة).'), next: R('Collect it at the same pickup point with your code.', 'استلمه من نفس نقطة الاستلام برمزك.') };
    case 'facility': {
      const e = DIRECTORY.find((x) => x.id === where);
      return { status: 'received', outcome: R(`Reported to the venue facilities team${e ? ': ' + dirName(e) : ''} (demo task).`, `تم الإبلاغ لفريق المرافق${e ? ': ' + dirName(e) : ''} (مهمة تجريبية).`), next: R('Use the nearest open alternative shown in Explore.', 'استخدم أقرب بديل مفتوح في صفحة الاستكشاف.') };
    }
    case 'assist':
      return { status: 'received', outcome: R('Your request is logged for guest services (demo). In this prototype nobody is dispatched.', 'تم تسجيل طلبك لخدمة الزوار (تجريبي). في هذا النموذج لا يتم إرسال أحد.'), next: R('For urgent help, speak to the nearest steward.', 'للمساعدة العاجلة تحدث مع أقرب منظم.') };
    case 'lost':
      return { status: 'received', outcome: R('Lost-property report saved on this device (demo).', 'تم حفظ بلاغ المفقودات على هذا الجهاز (تجريبي).'), next: R('Visit the guest services desk with a description of the item.', 'توجّه لمكتب خدمة الزوار مع وصف للغرض.') };
    default:
      return { status: 'received', outcome: R('Request recorded (demo).', 'تم تسجيل الطلب (تجريبي).'), next: R('—', '—') };
  }
}
