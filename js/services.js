/* GolBite — integration boundaries.
   Every external system the platform needs is declared here with its current connection state.
   This static build has NO live integrations: each adapter either runs a clearly labelled demo
   implementation or reports "not connected". Production replaces the adapter bodies with calls to
   authenticated server APIs — never with client-side secrets. */

const INTEGRATIONS = [
  { id: 'auth', name: { en: 'Authentication & role permissions', ar: 'تسجيل الدخول وصلاحيات الأدوار' }, mode: 'demo',
    note: { en: 'Demo entry and a client-side role switch for reviewers. Production must verify identity (e.g. phone OTP before ordering) and enforce roles server-side.', ar: 'دخول تجريبي وتبديل أدوار من الواجهة للمراجعين. الإنتاج يتطلب تحققاً من الهوية (مثل رمز الجوال قبل الطلب) وفرض الصلاحيات من الخادم.' } },
  { id: 'ticketing', name: { en: 'Ticketing & ticket wallet', ar: 'التذاكر ومحفظة التذاكر' }, mode: 'none',
    note: { en: 'Not connected. Seat details are entered manually by the fan. No tickets or entry credentials are shown.', ar: 'غير متصل. يُدخل المشجع مقعده يدوياً. لا تُعرض تذاكر أو بيانات دخول.' } },
  { id: 'maps', name: { en: 'Venue maps & accessibility data', ar: 'خرائط الملعب وبيانات الوصول' }, mode: 'demo',
    note: { en: 'Illustrative diagram only — not to scale and not for exact navigation.', ar: 'رسم توضيحي فقط — ليس بمقياس دقيق ولا يصلح للملاحة الدقيقة.' } },
  { id: 'access', name: { en: 'Venue access & gates', ar: 'أنظمة الدخول والبوابات' }, mode: 'none',
    note: { en: 'Not connected. Recommended gates come from the sample event setup.', ar: 'غير متصل. البوابات المقترحة من إعداد الفعالية النموذجي.' } },
  { id: 'pos', name: { en: 'Vendor point of sale & inventory', ar: 'نقاط البيع والمخزون' }, mode: 'demo',
    note: { en: 'Orders and stock are kept in this browser only.', ar: 'الطلبات والمخزون محفوظة في هذا المتصفح فقط.' } },
  { id: 'payments', name: { en: 'Payments, refunds & receipts', ar: 'المدفوعات والاسترداد والإيصالات' }, mode: 'demo',
    note: { en: 'Simulated. No card data is collected and no money moves. Connect a licensed provider server-side (e.g. Apple Pay via a PSP).', ar: 'محاكاة. لا نجمع بيانات بطاقات ولا تتحرك أي أموال. يُربط مزود دفع مرخص من الخادم (مثل Apple Pay عبر بوابة دفع).' } },
  { id: 'parking', name: { en: 'Parking', ar: 'المواقف' }, mode: 'none',
    note: { en: 'Not connected. Parking locations are scheduled sample information, without live capacity.', ar: 'غير متصل. مواقع المواقف معلومات نموذجية مجدولة بدون سعة مباشرة.' } },
  { id: 'transport', name: { en: 'Public transport & shuttles', ar: 'النقل العام والحافلات' }, mode: 'none',
    note: { en: 'Not connected. Schedules shown are samples, not live departures.', ar: 'غير متصل. الجداول المعروضة نموذجية وليست مواعيد مباشرة.' } },
  { id: 'matchFeed', name: { en: 'Match / event feed', ar: 'بيانات المباراة المباشرة' }, mode: 'demo',
    note: { en: 'Score and clock are simulated and controlled from Demo Controls.', ar: 'النتيجة والوقت محاكاة ويُتحكم بها من أدوات العرض.' } },
  { id: 'notifications', name: { en: 'Notifications', ar: 'الإشعارات' }, mode: 'demo',
    note: { en: 'In-app messages; local device notifications in the iOS build. No push server.', ar: 'رسائل داخل التطبيق، وإشعارات محلية في نسخة iOS. لا يوجد خادم إشعارات.' } },
  { id: 'support', name: { en: 'Support & ticketing desk', ar: 'الدعم والبلاغات' }, mode: 'demo',
    note: { en: 'Requests are stored locally; nobody receives them.', ar: 'البلاغات تُحفظ محلياً ولا يستلمها أحد.' } },
  { id: 'analytics', name: { en: 'Campaign tracking & analytics', ar: 'تتبع الحملات والتحليلات' }, mode: 'demo',
    note: { en: 'Campaign and business figures are simulated sample data.', ar: 'أرقام الحملات والأعمال بيانات نموذجية محاكاة.' } },
];
const integration = (id) => INTEGRATIONS.find((i) => i.id === id);
const integrationLabel = (mode) => ({ live: T('Connected', 'متصل'), demo: T('Demo implementation', 'تنفيذ تجريبي'), none: T('Not connected', 'غير متصل') }[mode]);

/* Adapters. Each returns a Promise so production code can swap in real network calls. */
const Services = {
  payments: {
    /* Demo: always "succeeds" without charging. */
    authorize(amount) { return Promise.resolve({ ok: true, simulated: true, ref: 'DEMO-' + uid() , amount }); },
    refund(orderId, amount) { return Promise.resolve({ ok: true, simulated: true, orderId, amount }); },
  },
  support: {
    submit(req) { return Promise.resolve({ ok: true, simulated: true, id: req.id }); },
  },
  ticketing: { getSeat() { return Promise.resolve(null); } },            // not connected → manual seat entry
  parking: { availability() { return Promise.resolve(null); } },        // no live capacity
  transport: { departures() { return Promise.resolve(null); } },        // no live departures
  matchFeed: { current() { return Promise.resolve({ simulated: true, ...S.match }); } },
};
