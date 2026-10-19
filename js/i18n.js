/* GolBite — shared vocabulary. Status names, roles, labels and errors are defined once here so
   every screen uses the same wording in Arabic and English. Long, screen-specific copy stays inline via T(en, ar). */

const TERMS = {
  // order lifecycle
  'st.placed': { en: 'Placed', ar: 'تم الطلب' },
  'st.accepted': { en: 'Accepted', ar: 'تم القبول' },
  'st.preparing': { en: 'Preparing', ar: 'قيد التحضير' },
  'st.ready': { en: 'Ready', ar: 'جاهز' },
  'st.dispatched': { en: 'On the way', ar: 'في الطريق' },
  'st.delivered': { en: 'Delivered', ar: 'تم التوصيل' },
  'st.collected': { en: 'Collected', ar: 'تم الاستلام' },
  'st.cancelled': { en: 'Cancelled', ar: 'ملغي' },
  // vendor task states
  'vt.new': { en: 'New', ar: 'جديد' },
  'vt.accepted': { en: 'Accepted', ar: 'مقبول' },
  'vt.preparing': { en: 'Preparing', ar: 'قيد التحضير' },
  'vt.ready': { en: 'Ready', ar: 'جاهز' },
  'vt.handed': { en: 'Handed over', ar: 'تم التسليم' },
  'vt.rejected': { en: 'Rejected', ar: 'مرفوض' },
  // order actions
  'act.accept': { en: 'Accept', ar: 'قبول' },
  'act.start': { en: 'Start preparing', ar: 'ابدأ التحضير' },
  'act.ready': { en: 'Mark ready', ar: 'تحديد كجاهز' },
  'act.collect': { en: 'Confirm collected', ar: 'تأكيد الاستلام' },
  'act.dispatch': { en: 'Dispatch runner', ar: 'إرسال المندوب' },
  'act.deliver': { en: 'Confirm delivered', ar: 'تأكيد التوصيل' },
  'act.cancel': { en: 'Cancel order', ar: 'إلغاء الطلب' },
  'act.reject': { en: 'Reject', ar: 'رفض' },
  // roles
  'role.fan': { en: 'Fan', ar: 'مشجع' },
  'role.operator': { en: 'Operator', ar: 'المشغّل' },
  'role.vendor': { en: 'Vendor', ar: 'البائع' },
  'role.partner': { en: 'Partner', ar: 'الشريك' },
  'role.admin': { en: 'Venue admin', ar: 'إدارة الملعب' },
  'role.sim': { en: 'Simulation', ar: 'المحاكاة' },
  // data provenance
  'data.live': { en: 'Live', ar: 'مباشر' },
  'data.scheduled': { en: 'Scheduled', ar: 'مجدول' },
  'data.demo': { en: 'Demo', ar: 'تجريبي' },
  'data.unavailable': { en: 'Unavailable', ar: 'غير متاح' },
  // service status
  'svc.open': { en: 'Open', ar: 'مفتوح' },
  'svc.closed': { en: 'Closed', ar: 'مغلق' },
  'svc.paused': { en: 'Paused', ar: 'متوقف مؤقتاً' },
  'svc.unavailable': { en: 'Unavailable', ar: 'غير متاح' },
  'svc.not_configured': { en: 'Not offered at this venue', ar: 'غير متوفر في هذا الملعب' },
  // event status
  'ev.scheduled': { en: 'Scheduled', ar: 'مجدول' },
  'ev.live': { en: 'Live', ar: 'جارٍ الآن' },
  'ev.halftime': { en: 'Halftime', ar: 'الاستراحة' },
  'ev.post': { en: 'Ended', ar: 'انتهى' },
  'ev.cancelled': { en: 'Cancelled', ar: 'ملغي' },
  // fulfillment
  'ful.pickup': { en: 'Pickup', ar: 'استلام' },
  'ful.delivery': { en: 'Seat delivery', ar: 'توصيل للمقعد' },
  // common
  'demo.mode': { en: 'Demo mode', ar: 'وضع تجريبي' },
  'demo.simulated': { en: 'Simulated', ar: 'محاكاة' },
  'demo.noCharge': { en: 'Demo payment — no charge is made and no card details are collected.', ar: 'دفع تجريبي — لا يتم خصم أي مبلغ ولا نجمع بيانات بطاقات.' },
  'demo.notReal': { en: 'Demo only — no real request, refund or payment is processed.', ar: 'تجريبي فقط — لا تتم معالجة أي طلب أو استرداد أو دفع حقيقي.' },
  'err.orderingClosed': { en: 'Ordering is closed by the venue right now.', ar: 'الطلب مغلق من الملعب حالياً.' },
  'err.unavailable': { en: 'This item is unavailable.', ar: 'هذا الصنف غير متاح.' },
};

function t(key) { return L(TERMS[key]) || key; }

/* Small badge that states where a piece of information comes from. */
function dataBadge(kind = 'demo') {
  return `<span class="data-badge d-${kind}" title="${esc(t('data.' + kind))}">${t('data.' + kind)}</span>`;
}

/* Dates and times formatted for the active language (Gregorian, Latin digits for clarity). */
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(S.lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtTime(hhmm) {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(S.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { hour: 'numeric', minute: '2-digit' });
}
