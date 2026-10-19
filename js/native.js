/* GolBite — native bridge. Inside the iOS app (Capacitor) it uses real device features;
   in a browser every call quietly falls back to the web behaviour, so the same code runs everywhere. */

const NATIVE = !!window.Capacitor?.isNativePlatform?.();
const NP = () => window.Capacitor?.Plugins || {};
let notifyAllowed = null;

function nativeInit() {
  if (!NATIVE) return;
  document.documentElement.classList.add('native');
  NP().StatusBar?.setStyle?.({ style: 'LIGHT' }).catch(() => {});
  NP().SplashScreen?.hide?.().catch(() => {});
  NP().LocalNotifications?.checkPermissions?.().then((p) => (notifyAllowed = p.display === 'granted')).catch(() => {});
}

/* Ask for notification permission at a meaningful moment (first order), not on launch. */
async function ensureNotifyPermission() {
  if (!NATIVE || notifyAllowed !== null && notifyAllowed) return notifyAllowed;
  try {
    const p = await NP().LocalNotifications.requestPermissions();
    notifyAllowed = p.display === 'granted';
  } catch (e) { notifyAllowed = false; }
  return notifyAllowed;
}

/* Numeric id per order so a scheduled "ready" alert can be replaced. */
const notifId = (key) => Math.abs([...String(key)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 2000000000;

function nativeNotify(title, body, key = Date.now(), at = null) {
  if (!NATIVE || !notifyAllowed) return;
  const n = { id: notifId(key), title, body };
  if (at) n.schedule = { at: new Date(at), allowWhileIdle: true };
  NP().LocalNotifications.schedule({ notifications: [n] }).catch(() => {});
}
function nativeCancel(key) {
  if (!NATIVE) return;
  NP().LocalNotifications?.cancel?.({ notifications: [{ id: notifId(key) }] }).catch(() => {});
}

/* Schedule the "ready" alert when an order is placed, so it still arrives if the app is in the background. */
function scheduleReadyAlert(o) {
  if (!NATIVE) return;
  ensureNotifyPermission().then((ok) => {
    if (!ok) return;
    const ticks = 3 + Math.max(...o.tasks.map((tk) => tk.need)) + (o.schedule === 'halftime' ? 40 : 0);
    const at = Date.now() + (ticks * 1000) / S.simSpeed;
    const [title, body] = readyText(o);
    nativeNotify(title, body, o.id + ':ready', at);
  });
}
function readyText(o) {
  return o.type === 'delivery'
    ? [T('Your order is on the way', 'طلبك في الطريق'), T(`${o.runner} is bringing ${o.id} to seat ${seatLabel()}.`, `${o.runner} يوصل الطلب ${o.id} إلى المقعد ${seatLabel()}.`)]
    : [T('Your order is ready', 'طلبك جاهز'), T(`Collect ${o.id} at ${L(pickup(o.dest).name)} · code ${o.code}`, `استلم ${o.id} من ${L(pickup(o.dest).name)} · الرمز ${o.code}`)];
}
/* Called by the engine when an order changes status while the app is open. */
function nativeOrderStatus(o) {
  if (!NATIVE) return;
  if (o.stage === 'ready' || o.stage === 'dispatched') { nativeCancel(o.id + ':ready'); nativeNotify(...readyText(o), o.id + ':' + o.stage); haptic('success'); }
  if (isFinal(o)) nativeCancel(o.id + ':ready');
}

function haptic(kind = 'light') {
  if (!NATIVE) return;
  const H = NP().Haptics;
  if (!H) return;
  if (kind === 'success' || kind === 'warning' || kind === 'error') H.notification({ type: kind.toUpperCase() }).catch(() => {});
  else H.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }).catch(() => {});
}

/* Location: native GPS in the app, browser geolocation on the web. Resolves true/false. */
function getLocation(timeout = 7000) {
  if (NATIVE && NP().Geolocation) {
    return NP().Geolocation.requestPermissions()
      .then(() => NP().Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout }))
      .then(() => true, () => false);
  }
  return new Promise((res) => {
    if (!navigator.geolocation) return res(false);
    navigator.geolocation.getCurrentPosition(() => res(true), () => res(false), { timeout });
  });
}
