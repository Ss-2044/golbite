/* GolBite — venue & event configuration (DEMO SAMPLE DATA).
   In production these records come from the venue configuration service (see js/services.js).
   Nothing here is live: every value is a sample the venue admin can edit in Venue Admin → Event setup. */

/* Data provenance labels shown next to information. "live" is only used when a real integration supplies it. */
const DATA_LABELS = ['live', 'scheduled', 'demo', 'unavailable'];

/* Event guide per event (sample). Dates/times are local Riyadh time. */
const EVENT_GUIDE = {
  e1: { date: '2026-10-24', doors: '18:30', start: '21:00', gates: ['G1', 'G2', 'G3'], recommendedGateBy: { A: 'G2', B: 'G2', C: 'G3' } },
  e2: { date: '2026-10-25', doors: '19:00', start: '21:00', gates: ['G1', 'G2', 'G3'], recommendedGateBy: { A: 'G2', B: 'G3', C: 'G3' } },
  e3: { date: '2026-10-31', doors: '19:30', start: '21:30', gates: ['G1', 'G3'], recommendedGateBy: { A: 'G1', B: 'G3', C: 'G3' } },
};

const ARRIVAL_INFO = {
  directions: { en: 'Follow venue signage from the main road to the gate shown on your ticket. Allow extra time on derby days.', ar: 'اتبع لوحات الملعب من الطريق الرئيسي إلى البوابة المحددة في تذكرتك. خصص وقتاً إضافياً في أيام الديربي.' },
  parking: [
    { id: 'pk1', name: { en: 'Parking P-North', ar: 'مواقف الشمال P' }, gate: 'G2', notes: { en: 'General parking · 10 min walk to Gate 2', ar: 'مواقف عامة · 10 دقائق مشياً للبوابة 2' } },
    { id: 'pk2', name: { en: 'Parking P-South (accessible bays)', ar: 'مواقف الجنوب P (مواقف ذوي الإعاقة)' }, gate: 'G3', notes: { en: 'Accessible bays nearest Gate 3', ar: 'مواقف ذوي الإعاقة الأقرب للبوابة 3' } },
  ],
  transport: [
    { id: 'tr1', name: { en: 'Shuttle bus — Metro station', ar: 'حافلة ترددية — محطة المترو' }, notes: { en: 'Scheduled every 15 min from 2 hours before start (sample schedule).', ar: 'كل 15 دقيقة قبل البداية بساعتين (جدول نموذجي).' } },
    { id: 'tr2', name: { en: 'Ride-hailing pickup zone', ar: 'منطقة سيارات الأجرة والتطبيقات' }, notes: { en: 'Next to Gate 1 drop-off lane.', ar: 'بجانب مسار النزول عند البوابة 1.' } },
  ],
  entryRules: [
    { en: 'Bring your ticket and ID. Bag checks at every gate.', ar: 'أحضر تذكرتك وهويتك. يوجد تفتيش للحقائب عند كل بوابة.' },
    { en: 'No glass, flares, laser pointers or large banners without approval.', ar: 'يُمنع الزجاج والألعاب النارية وأقلام الليزر واللافتات الكبيرة دون موافقة.' },
    { en: 'Gates close to re-entry 30 minutes after the start.', ar: 'لا يُسمح بإعادة الدخول بعد 30 دقيقة من البداية.' },
  ],
  accessible: { en: 'Step-free entry at Gates 1 and 3. Lifts to all stands. Accessible parking at P-South. Ask guest services for wheelchair assistance.', ar: 'دخول بدون درج من البوابتين 1 و3. مصاعد لكل المدرجات. مواقف ذوي الإعاقة في مواقف الجنوب. اطلب من خدمة الزوار المساعدة بالكرسي المتحرك.' },
  lostProperty: { en: 'Lost property desk at Guest Services (Gate 1) during the event; afterwards via the venue support line.', ar: 'مكتب المفقودات في خدمة الزوار (البوابة 1) أثناء الفعالية، وبعدها عبر خط دعم الملعب.' },
};

/* Official schedule items: minutes relative to start. */
const EVENT_SCHEDULE = [
  { at: -150, label: { en: 'Doors open · food & merch counters open', ar: 'فتح الأبواب · فتح أكشاك الطعام والمتجر' } },
  { at: -45, label: { en: 'Fan zone activities', ar: 'فعاليات منطقة المشجعين' } },
  { at: 0, label: { en: 'Kick-off', ar: 'صافرة البداية' } },
  { at: 45, label: { en: 'Halftime (15 min)', ar: 'الاستراحة (15 دقيقة)' } },
  { at: 90, label: { en: 'Final whistle · exit routes open', ar: 'صافرة النهاية · فتح مسارات الخروج' } },
];

/* Explore directory categories. */
const SERVICE_CATS = [
  { id: 'food', icon: '🍔', name: { en: 'Food & drinks', ar: 'طعام ومشروبات' } },
  { id: 'pickup', icon: '🛍️', name: { en: 'Pickup points', ar: 'نقاط الاستلام' } },
  { id: 'merch', icon: '🧣', name: { en: 'Club merchandise', ar: 'منتجات النادي' } },
  { id: 'gate', icon: '🚪', name: { en: 'Entrances & exits', ar: 'المداخل والمخارج' } },
  { id: 'restroom', icon: '🚻', name: { en: 'Restrooms', ar: 'دورات المياه' } },
  { id: 'prayer', icon: '🕌', name: { en: 'Prayer rooms', ar: 'المصليات' } },
  { id: 'firstaid', icon: '⛑️', name: { en: 'First aid', ar: 'الإسعافات الأولية' } },
  { id: 'access', icon: '♿', name: { en: 'Accessible facilities', ar: 'مرافق ذوي الإعاقة' } },
  { id: 'water', icon: '💧', name: { en: 'Water refill', ar: 'تعبئة المياه' } },
  { id: 'guest', icon: 'ℹ️', name: { en: 'Guest services', ar: 'خدمة الزوار' } },
  { id: 'family', icon: '👨‍👩‍👧', name: { en: 'Family facilities', ar: 'مرافق العائلات' } },
  { id: 'charging', icon: '🔌', name: { en: 'Charging points', ar: 'نقاط الشحن' } },
  { id: 'travel', icon: '🚌', name: { en: 'Parking & transport', ar: 'المواقف والمواصلات' } },
];

/* Directory entries. `angle` places the point on the illustrative concourse ring.
   status: open | closed | not_configured. Availability can be overridden at runtime by venue staff. */
const DIRECTORY = [
  ...[['v1', 288], ['v2', 340], ['v3', 68], ['v4', 205]].map(([id, a]) => ({ id: 'svc-' + id, cat: 'food', ref: id, angle: a, hours: 'doors-end', stepFree: true })),
  { id: 'svc-v5', cat: 'merch', ref: 'v5', angle: 168, hours: 'doors-end+30', stepFree: true },
  ...['P1', 'P2', 'P3'].map((p) => ({ id: 'svc-' + p, cat: 'pickup', ref: p, angle: PICKUPS.find((x) => x.id === p).angle, hours: 'doors-end', stepFree: true })),
  { id: 'gate-G1', cat: 'gate', ref: 'G1', angle: 180, hours: 'doors-end+60', stepFree: true, exit: true },
  { id: 'gate-G2', cat: 'gate', ref: 'G2', angle: 315, hours: 'doors-end+60', stepFree: false, exit: true },
  { id: 'gate-G3', cat: 'gate', ref: 'G3', angle: 45, hours: 'doors-end+60', stepFree: true, exit: true },
  { id: 'wc1', cat: 'restroom', angle: 232, name: { en: 'Restrooms · North-West', ar: 'دورات مياه · الشمال الغربي' }, hours: 'doors-end+30', stepFree: true },
  { id: 'wc2', cat: 'restroom', angle: 30, name: { en: 'Restrooms · East', ar: 'دورات مياه · الشرق' }, hours: 'doors-end+30', stepFree: false },
  { id: 'wc3', cat: 'restroom', angle: 128, name: { en: 'Restrooms · South', ar: 'دورات مياه · الجنوب' }, hours: 'doors-end+30', stepFree: true },
  { id: 'pr1', cat: 'prayer', angle: 142, name: { en: 'Prayer room · South (men)', ar: 'مصلى · الجنوب (رجال)' }, hours: 'doors-end+30', stepFree: true },
  { id: 'pr2', cat: 'prayer', angle: 325, name: { en: 'Prayer room · North-East (women)', ar: 'مصلى · الشمال الشرقي (نساء)' }, hours: 'doors-end+30', stepFree: true },
  { id: 'fa1', cat: 'firstaid', angle: 160, name: { en: 'First aid · Main stand', ar: 'إسعافات · المدرج الرئيسي' }, hours: 'doors-end+60', stepFree: true },
  { id: 'fa2', cat: 'firstaid', angle: 300, name: { en: 'First aid · North', ar: 'إسعافات · الشمال' }, hours: 'doors-end+60', stepFree: true },
  { id: 'ac1', cat: 'access', angle: 175, name: { en: 'Lift & step-free route · Gate 1', ar: 'مصعد ومسار بدون درج · البوابة 1' }, hours: 'doors-end+60', stepFree: true },
  { id: 'ac2', cat: 'access', angle: 120, name: { en: 'Accessible restroom · South', ar: 'دورة مياه لذوي الإعاقة · الجنوب' }, hours: 'doors-end+30', stepFree: true },
  { id: 'wt1', cat: 'water', angle: 255, name: { en: 'Water refill · North concourse', ar: 'تعبئة مياه · ممر الشمال' }, hours: 'doors-end', stepFree: true },
  { id: 'wt2', cat: 'water', angle: 95, name: { en: 'Water refill · South concourse', ar: 'تعبئة مياه · ممر الجنوب' }, hours: 'doors-end', stepFree: true },
  { id: 'gs1', cat: 'guest', angle: 190, name: { en: 'Guest services & lost property', ar: 'خدمة الزوار والمفقودات' }, hours: 'doors-end+60', stepFree: true },
  { id: 'fm1', cat: 'family', angle: 150, name: { en: 'Family room & baby change', ar: 'غرفة العائلات وتغيير الحفاضات' }, hours: 'doors-end', stepFree: true },
  { id: 'ch1', cat: 'charging', angle: 0, name: { en: 'Phone charging', ar: 'شحن الجوالات' }, status: 'not_configured' },
  { id: 'tv1', cat: 'travel', angle: 200, name: { en: 'Parking & transport info', ar: 'معلومات المواقف والمواصلات' }, hours: 'doors-end+60', stepFree: true, link: 'guide' },
];

/* Default venue/event setup the Venue Admin can edit. */
function defaultVenueConfig() {
  return {
    published: true,
    eventName: null,              // null → use the event title
    date: null, start: null,
    languages: ['ar', 'en'],
    fulfillment: { pickup: true, delivery: true },
    deliverySections: ['A', 'B', 'C'],
    deliveryFee: 5,
    serviceFee: 0,
    vatRate: 0.15,                // prices include VAT (KSA)
    platformRate: 0.08,           // platform commission used in the business report (sample)
    cutoffMinute: 80,             // no new food orders after this match minute
    capacity: { v1: 10, v2: 10, v3: 12, v4: 8, v5: 8 },
    escalation: { name: 'Duty manager (sample)', channel: 'Radio channel 3 (sample)' },
    sections: ['A', 'B', 'C'],
    gates: ['G1', 'G2', 'G3'],
    dataStatus: { map: 'demo', waits: 'demo', menu: 'demo', parking: 'scheduled', transport: 'scheduled', matchFeed: 'demo' },
  };
}

/* Event-day operational state. */
function defaultOpsState() {
  return {
    ordering: true,
    pausedVendors: [],
    pausedPickups: [],
    pausedZones: [],              // seat-delivery sections paused
    notice: null,                 // { text, level, by, at }
    cancelled: false,
  };
}

const TEAMS_STAFF = [
  { id: 'clean', name: { en: 'Cleaning', ar: 'النظافة' } },
  { id: 'maint', name: { en: 'Maintenance', ar: 'الصيانة' } },
  { id: 'guest', name: { en: 'Guest services', ar: 'خدمة الزوار' } },
  { id: 'fnb', name: { en: 'Food & beverage', ar: 'الأغذية والمشروبات' } },
];
const ISSUE_TYPES = [
  { id: 'cleaning', name: { en: 'Cleaning', ar: 'نظافة' }, team: 'clean' },
  { id: 'maintenance', name: { en: 'Maintenance', ar: 'صيانة' }, team: 'maint' },
  { id: 'service', name: { en: 'Service unavailable', ar: 'خدمة غير متاحة' }, team: 'guest' },
];
