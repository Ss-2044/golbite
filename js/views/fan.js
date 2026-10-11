/* GolBite — fan core screens: sign-in, setup, Matchday Companion home, stadium map. */

function viewSignin() {
  return `<section class="auth">
    <div class="auth-hero">${stadiumArt()}<div class="auth-hero-in"><img src="assets/logo-light.png" alt="GolBite" class="auth-logo"/>
      <p>${T('Your matchday companion — find your seat, order without the queue, and collect rewards.', 'رفيقك في يوم المباراة — اعثر على مقعدك، اطلب بدون طابور، واجمع المكافآت.')}</p></div></div>
    <form class="card auth-card" data-submit="signin" novalidate>
      <h1 class="title">${T('Sign in', 'تسجيل الدخول')}</h1>
      <p class="muted">${T('Demo only — any email, phone or username works.', 'تجريبي فقط — أي بريد أو جوال أو اسم مستخدم يعمل.')}</p>
      <label class="field"><span>${T('Email, phone or username', 'البريد أو الجوال أو اسم المستخدم')}</span>
        <input name="handle" autocomplete="username" required placeholder="${T('e.g. fan@golbite.sa or 05XXXXXXXX', 'مثال: fan@golbite.sa أو 05XXXXXXXX')}" /></label>
      <p class="field-error" id="signin-error" hidden>${T('Please enter something to continue.', 'الرجاء إدخال قيمة للمتابعة.')}</p>
      <button class="btn btn-primary btn-lg w-full" type="submit">${T('Continue', 'متابعة')}</button>
      <button class="btn btn-ghost w-full mt-s" type="button" data-act="quickDemo">${icon('bolt')} ${T('Quick demo as Sara', 'تجربة سريعة باسم سارة')}</button>
    </form>
  </section>`;
}

/* ---------- setup ---------- */
let SETUP = null;
function setupDraft() {
  if (!SETUP) SETUP = S.setup ? { ...S.setup } : { eventId: 'e1', teamId: 'hilal', section: null, row: 8, seat: 14, arrival: '19:00', gate: 'G1', locationMode: null, step: 0 };
  return SETUP;
}
function viewSetup() {
  const d = setupDraft();
  const ev = EVENTS.find((e) => e.id === d.eventId);
  const teams = ev.away ? [ev.home, ev.away] : [ev.home];
  if (!teams.includes(d.teamId)) d.teamId = ev.home;
  const steps = [T('Event', 'الحدث'), T('Location', 'الموقع'), T('Seat', 'المقعد')];
  let body = '';
  if (d.step === 0) {
    body = `<h2 class="h2">${T('Choose your event', 'اختر الحدث')}</h2>
    <div class="list">${EVENTS.map((e) => `<button class="choice ${d.eventId === e.id ? 'on' : ''}" data-act="setupSet" data-arg="eventId:${e.id}" aria-pressed="${d.eventId === e.id}">
      ${foodTile(e.type === 'concert' ? '🎤' : '⚽')}<span class="grow"><b>${L(e.title)}</b><small>${L(e.venue)} · ${e.time}</small></span>${d.eventId === e.id ? icon('check') : ''}</button>`).join('')}</div>
    <h2 class="h2 mt">${ev.type === 'concert' ? T('Your vibe', 'أجواؤك') : T('Your team', 'فريقك')}</h2>
    <div class="row gap wrap">${teams.map((t) => `<button class="chip-lg ${d.teamId === t ? 'on' : ''}" style="--tc:${TEAMS[t].color}" data-act="setupSet" data-arg="teamId:${t}" aria-pressed="${d.teamId === t}"><i class="team-dot"></i>${L(TEAMS[t].name)}</button>`).join('')}</div>
    <h2 class="h2 mt">${T('Arrival time', 'وقت الوصول')}</h2>
    <div class="row gap wrap">${['18:30', '19:00', '19:30', '20:00'].map((a) => `<button class="chip-lg ${d.arrival === a ? 'on' : ''}" data-act="setupSet" data-arg="arrival:${a}">${a}</button>`).join('')}</div>`;
  } else if (d.step === 1) {
    body = `<h2 class="h2">${T('Where are you?', 'أين أنت؟')}</h2>
    <p class="muted">${T('Share your location to auto-detect the nearest gate, or choose a section manually.', 'شارك موقعك لتحديد أقرب بوابة تلقائياً، أو اختر القسم يدوياً.')}</p>
    <button class="btn btn-primary w-full mt-s" data-act="requestLocation">${icon('pin')} ${T('Use my location', 'استخدم موقعي')}</button>
    <div id="loc-status">${d.locationMode === 'gps' ? `<div class="notice ok mt-s">${icon('check')}<span>${T('Location found near Gate 1. Pick your section below to confirm.', 'تم تحديد موقعك قرب البوابة 1. اختر قسمك للتأكيد.')}</span></div>` : d.locationMode === 'denied' ? `<div class="notice warn mt-s">${icon('alert')}<span>${T('Location unavailable — no problem. Choose your section manually.', 'الموقع غير متاح — لا مشكلة. اختر قسمك يدوياً.')}</span></div>` : ''}</div>
    <h2 class="h2 mt">${T('Stadium section', 'قسم الملعب')}</h2>
    <div class="sec-pick">${Object.values(SECTIONS).map((s) => `<button class="sec-btn ${d.section === s.id ? 'on' : ''}" data-act="setupSet" data-arg="section:${s.id}" aria-pressed="${d.section === s.id}"><b>${s.id}</b><small>${L(s.name).split('·')[1] || ''}</small></button>`).join('')}</div>
    <h2 class="h2 mt">${T('Entry gate', 'بوابة الدخول')}</h2>
    <div class="row gap wrap">${GATES.map((g) => `<button class="chip-lg ${d.gate === g.id ? 'on' : ''}" data-act="setupSet" data-arg="gate:${g.id}">${L(g.name)}</button>`).join('')}</div>`;
  } else {
    body = `<h2 class="h2">${T('Your seat', 'مقعدك')}</h2>
    <div class="seat-pick">
      <label class="field"><span>${T('Row', 'الصف')}</span><select data-change="setupRow">${Array.from({ length: 20 }, (_, i) => `<option ${d.row == i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></label>
      <label class="field"><span>${T('Seat', 'المقعد')}</span><select data-change="setupSeat">${Array.from({ length: 30 }, (_, i) => `<option ${d.seat == i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></label>
    </div>
    <div class="ticket mt">
      <div><small>${T('Event', 'الحدث')}</small><b>${L(ev.title)}</b></div>
      <div class="ticket-grid"><div><small>${T('Section', 'القسم')}</small><b>${d.section}</b></div><div><small>${T('Row', 'الصف')}</small><b>${d.row}</b></div><div><small>${T('Seat', 'المقعد')}</small><b>${d.seat}</b></div><div><small>${T('Gate', 'البوابة')}</small><b>${d.gate}</b></div></div>
    </div>`;
  }
  const canNext = d.step !== 1 || d.section;
  return `<section class="page narrow">
    <div class="steps" aria-label="${T('Setup progress', 'تقدم الإعداد')}">${steps.map((s, i) => `<span class="step ${i <= d.step ? 'on' : ''}">${i + 1}. ${s}</span>`).join('')}</div>
    <h1 class="title">${T('Set up your matchday', 'جهّز يوم مباراتك')}</h1>
    <div class="card">${body}</div>
    <div class="row gap mt sticky-actions">
      ${d.step > 0 ? `<button class="btn btn-ghost" data-act="setupStep" data-arg="-1">${icon('back', 'flip')} ${T('Back', 'رجوع')}</button>` : ''}
      <button class="btn btn-primary grow" data-act="${d.step === 2 ? 'setupDone' : 'setupStep'}" data-arg="1" ${canNext ? '' : 'disabled aria-disabled="true"'}>${d.step === 2 ? T("Let's go", 'لننطلق') : T('Next', 'التالي')}</button>
    </div>
    ${d.step === 1 && !d.section ? `<p class="muted center mt-s">${T('Select a section to continue.', 'اختر قسماً للمتابعة.')}</p>` : ''}
  </section>`;
}

/* ---------- companion logic ---------- */
function companionMoments() {
  const p = S.match.phase;
  const o = activeOrder();
  const sec = S.setup.section;
  const near = nearestPickup();
  const best = bestPickup();
  const busy = pickupLoad(near.id) >= 70;
  const cards = [];
  const concert = isConcert();
  if (o) {
    cards.push({ id: 'active', kind: 'order', icon: 'truck', title: T('Your order is in progress', 'طلبك قيد التنفيذ'),
      body: o.type === 'delivery' ? T(`Delivering to seat ${seatLabel()}`, `التوصيل إلى المقعد ${seatLabel()}`) : T(`Pickup at ${L(pickup(o.dest).name)} · code ${o.code}`, `الاستلام من ${L(pickup(o.dest).name)} · الرمز ${o.code}`),
      cta: { act: 'go', arg: 'track/' + o.id, label: T('Track order', 'تتبع الطلب') } });
  }
  if (S.closedRoutes.length) {
    cards.push({ id: 'closure', kind: 'warn', icon: 'alert', title: T('Route closed — new path ready', 'ممر مغلق — مسار جديد جاهز'),
      body: T('Part of the concourse is closed. We rerouted you around it.', 'جزء من الممر مغلق. أعدنا توجيهك حوله.'), cta: { act: 'findSeat', arg: sec, label: T('View new route', 'عرض المسار الجديد') } });
  }
  if (p === 'arrival' || p === 'prematch') {
    if (!S.quests.seat) cards.push({ id: 'route', kind: 'route', icon: 'route', title: T(`Route to Section ${sec}`, `المسار إلى القسم ${sec}`),
      body: T(`${mins(walkMins(routeToSeat(GATES.find((g) => g.id === S.setup.gate).angle, sec).len, sec))} walk from ${S.setup.gate}. Step-free access available.`, `${mins(walkMins(routeToSeat(GATES.find((g) => g.id === S.setup.gate).angle, sec).len, sec))} مشياً من ${S.setup.gate}. وصول بدون درج متاح.`),
      cta: { act: 'findSeat', arg: sec, label: T('Find my seat', 'اعثر على مقعدي') } });
    if (!o) cards.push({ id: 'ahead', kind: 'food', icon: 'bolt', title: concert ? T('Order before the headliner', 'اطلب قبل العرض الرئيسي') : T('Order ahead of kickoff', 'اطلب قبل صافرة البداية'),
      body: T(`Queues at ${L(near.name)} are ${levelWord(pickupLoad(near.id)).toLowerCase()} now — about ${mins(pickupWait(near.id))}.`, `الطابور في ${L(near.name)} ${levelWord(pickupLoad(near.id))} الآن — حوالي ${mins(pickupWait(near.id))}.`),
      cta: { act: 'go', arg: 'menu', label: T('Start an order', 'ابدأ طلباً') } });
  }
  if (p === 'kickoff') {
    cards.push({ id: 'preorder', kind: 'food', icon: 'clock', title: T('Beat the halftime rush', 'تجنّب زحمة الاستراحة'),
      body: T('Pre-order now and collect at the whistle — or start a Group Order with your friends.', 'اطلب مسبقاً واستلم مع الصافرة — أو ابدأ طلباً جماعياً مع أصدقائك.'),
      cta: { act: 'preorderHalftime', label: T('Pre-order for halftime', 'اطلب مسبقاً للاستراحة') }, cta2: { act: 'go', arg: 'group', label: T('Group Order', 'طلب جماعي') } });
  }
  if (p === 'halftime' || busy) {
    cards.push({ id: 'calm', kind: 'warn', icon: 'map', title: T('Busy right now — calmer pickup nearby', 'ازدحام الآن — استلام أهدأ قريب'),
      body: T(`${L(best.name)}: ~${mins(pickupWait(best.id))} vs ${mins(pickupWait(near.id))} at ${L(near.name)}.`, `${L(best.name)}: ~${mins(pickupWait(best.id))} مقابل ${mins(pickupWait(near.id))} في ${L(near.name)}.`),
      cta: { act: 'choosePickup', arg: best.id, label: T(`Use ${L(best.name)}`, `استخدم ${L(best.name)}`) } });
  }
  if (p === 'second') {
    cards.push({ id: 'play', kind: 'play', icon: 'trophy', title: T('Lock your prediction', 'ثبّت توقعك'),
      body: T('Predict the result before the final whistle for 200 bonus points.', 'توقع النتيجة قبل صافرة النهاية واربح 200 نقطة.'), cta: { act: 'go', arg: 'play', label: T('Open Play', 'افتح الألعاب') } });
  }
  if (p === 'final') {
    const mine = S.orders.filter((x) => x.eventId === currentEvent().id);
    cards.push({ id: 'summary', kind: 'reward', icon: 'star', title: T('Your matchday summary', 'ملخص يومك'),
      body: T(`${mine.length} order(s) · ${S.points} points · ${S.collectibles.length} collectible(s). Exit via ${S.setup.gate} — ${levelWord(S.crowd[sec]).toLowerCase()} now.`, `${mine.length} طلب · ${S.points} نقطة · ${S.collectibles.length} مقتنيات. اخرج عبر ${S.setup.gate} — ${levelWord(S.crowd[sec])} الآن.`),
      cta: { act: 'go', arg: 'profile', label: T('See rewards', 'شاهد المكافآت') } });
  }
  return cards.filter((c) => !S.dismissed.includes(c.id)).slice(0, 3);
}


function liveOffersForFan() {
  const sec = S.setup?.section;
  return S.offers.filter((of) => offerLive(of) && of.sections.includes(sec));
}

function offerCountdown(of) {
  const total = (of.minutes || 5) * 60;
  const left = of.endsAt && of.endsAt > Date.now() ? Math.round((of.endsAt - Date.now()) / 1000) : Math.round(total - ((Date.now() / 1000) % total));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

function offerCard(of, preview = false) {
  const it = item(of.item || 'd2');
  return `<article class="offer ${of.tone === 'sponsor' ? 'sponsor' : 'team'}">
    <span class="offer-media" style="--tint:${CAT_TINT[it?.cat] || '#FEF1E6'}" aria-hidden="true"><i>${of.image}</i>${of.discount ? `<em>−${of.discount}%</em>` : ''}</span>
    <div class="offer-body">
      <small class="eyebrow">${of.tone === 'sponsor' ? T('Sponsor moment', 'لحظة الراعي') : T('Team offer', 'عرض الفريق')} · ${esc(of.sponsor)}</small>
      <b>${esc(L(of.title))}</b>
      <small class="muted row gap-xs">${icon('timer')} ${offerCountdown(of)} ${T('left', 'متبقية')}</small>
    </div>
    ${preview ? `<span class="btn btn-orange btn-sm" aria-hidden="true">${T('Redeem', 'استخدم')}</span>` : `<button class="btn btn-orange btn-sm" data-act="redeemOffer" data-arg="${of.id}">${T('Redeem', 'استخدم')}</button>`}
  </article>`;
}

function flashCard(fl) {
  const it = item(fl.item);
  const left = Math.max(0, Math.round((fl.until - Date.now()) / 1000));
  return `<article class="offer flash">
    <span class="offer-media" style="--tint:${CAT_TINT[it.cat]}" aria-hidden="true"><i>${it.emoji}</i><em>−${fl.pct}%</em></span>
    <div class="offer-body"><small class="eyebrow">${T('Flash crowd deal', 'عرض الزحام الخاطف')} · ${L(pickup(fl.zone).name)}</small>
      <b>${L(it.name)}</b><small class="muted row gap-xs">${icon('timer')} ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} · ${T('calmer pickup', 'استلام أهدأ')}</small></div>
    <button class="btn btn-orange btn-sm" data-act="addItem" data-arg="${it.id}">${T('Add', 'أضف')}</button>
  </article>`;
}

function statusLabels(o) {
  return [T('Received', 'تم الاستلام'), T('Preparing', 'قيد التحضير'), o.type === 'delivery' ? T('On the way', 'في الطريق') : T('Ready', 'جاهز'), T('Completed', 'مكتمل')];
}

/* Order progress uses a segmented bar (never the match timeline style). */
function orderSteps(o, compact = false) {
  const labels = statusLabels(o);
  return `<div class="osteps ${compact ? 'compact' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${o.status}" aria-valuetext="${labels[o.status]}">
    ${labels.map((l, i) => `<div class="ostep ${i < o.status ? 'done' : i === o.status ? 'now' : ''}"><i></i>${compact ? '' : `<span>${l}</span>`}</div>`).join('')}
  </div>`;
}

function clockText() {
  const m = S.match;
  if (m.phase === 'arrival' || m.phase === 'prematch') return T(`Starts in ${-m.minute} min`, `يبدأ بعد ${-m.minute} د`);
  if (m.phase === 'halftime' || m.phase === 'final') return phaseLabel();
  return `${m.minute}'`;
}
function isLive() { return ['kickoff', 'second'].includes(S.match.phase); }

function matchHeader() {
  const ev = currentEvent();
  const m = S.match;
  if (isConcert()) {
    return `<div class="fixture concert"><b class="fx-title">${esc(L(ev.title))}</b><span class="fx-clock">${clockText()}</span></div>`;
  }
  const crest = (t) => `<span class="crest" style="--tc:${TEAMS[t].color}">${TEAMS[t].short}</span>`;
  return `<div class="fixture">
    <div class="fx-team">${crest(ev.home)}<b>${L(TEAMS[ev.home].name)}</b></div>
    <div class="fx-mid"><b class="fx-score" aria-label="${T('Score', 'النتيجة')} ${m.home} - ${m.away}"><span>${m.home}</span><i>–</i><span>${m.away}</span></b>
      <span class="fx-clock">${clockText()}${m.redCard ? ' · 🟥' : ''}</span></div>
    <div class="fx-team">${crest(ev.away)}<b>${L(TEAMS[ev.away].name)}</b></div>
  </div>`;
}

function liveChip() {
  const m = S.match;
  if (isLive()) return `<span class="live-chip"><i></i>${T('LIVE', 'مباشر')} · ${m.minute}'</span>`;
  return `<span class="live-chip idle">${phaseLabel()}</span>`;
}

/* The match timeline: navy track with a sunburst on the current moment. */
function timeline() {
  const idx = PHASES.indexOf(S.match.phase);
  return `<ol class="mline" aria-label="${T('Match timeline', 'سير المباراة')}">${PHASES.map((p, i) => `<li class="${i < idx ? 'done' : i === idx ? 'now' : ''}" ${i === idx ? 'aria-current="step"' : ''}>
    <span class="mdot">${i === idx ? sunMark(22, 'brand-sun') : '<i></i>'}</span><span class="mlabel">${phaseLabel(p)}</span></li>`).join('')}</ol>`;
}

function primaryOrderBlock() {
  const o = activeOrder();
  if (o) {
    const waitingHT = o.schedule === 'halftime' && o.status === 0 && !['halftime', 'second', 'final'].includes(S.match.phase);
    return `<div class="primary-card order-live">
      <div class="row between"><div><small class="eyebrow">${T('Your order', 'طلبك')} · ${o.id}</small>
        <h2 class="h2">${statusLabels(o)[o.status]}</h2></div>
        <div class="eta-box"><b>${waitingHT ? T('HT', 'استراحة') : '~' + mins(estimate(o))}</b><small>${T('estimate', 'متوقع')}</small></div></div>
      ${orderSteps(o)}
      <div class="row between mt-s wrap gap">
        <span class="muted small row gap-xs">${icon(o.type === 'delivery' ? 'truck' : 'pin')} ${o.type === 'delivery' ? T('To seat', 'إلى المقعد') + ' ' + seatLabel() : L(pickup(o.dest).name) + ' · ' + T('code', 'الرمز') + ' ' + o.code}</span>
        <button class="btn btn-orange" data-act="go" data-arg="track/${o.id}">${T('Track order', 'تتبع الطلب')} ${icon('chevron', 'flip')}</button>
      </div>
    </div>`;
  }
  const near = nearestPickup();
  return `<div class="primary-card order-cta-card">
    <div class="grow"><h2 class="h2">${T('Hungry? Skip the queue', 'جوعان؟ اطلب بدون طابور')}</h2>
      <p class="muted small">${T('Food, drinks and club merchandise', 'طعام ومشروبات ومنتجات النادي')} · ${L(near.name)} ~${mins(pickupWait(near.id))}</p></div>
    <button class="btn btn-orange btn-lg" data-act="go" data-arg="menu">${icon('bag')} ${T('Order now', 'اطلب الآن')}</button>
  </div>`;
}

function nowSection() {
  const all = companionMoments().filter((c) => c.id !== 'active');
  const [top, ...rest] = all;
  const card = (c) => `<article class="moment moment-${c.kind}">
    <span class="moment-ic">${icon(c.icon)}</span>
    <div class="grow"><b>${c.title}</b><p>${c.body}</p>
      <div class="row gap wrap mt-xs"><button class="btn btn-primary btn-sm" data-act="${c.cta.act}" data-arg="${c.cta.arg || ''}">${c.cta.label}</button>
      ${c.cta2 ? `<button class="btn btn-ghost btn-sm" data-act="${c.cta2.act}" data-arg="${c.cta2.arg || ''}">${c.cta2.label}</button>` : ''}</div></div>
    <button class="icon-btn xs" data-act="dismissMoment" data-arg="${c.id}" aria-label="${T('Dismiss', 'إخفاء')}">${icon('x')}</button>
  </article>`;
  if (!top) return `<p class="muted small">${T('All set — enjoy the match. We will nudge you when something useful comes up.', 'كل شيء جاهز — استمتع بالمباراة. سننبهك عند وجود شيء مفيد.')}</p>`;
  return card(top) + (rest.length ? `<details class="more"><summary>${rest.length === 1 ? T('1 more suggestion', 'اقتراح آخر') : T(`${rest.length} more suggestions`, `${rest.length} اقتراحات أخرى`)} ${icon('down')}</summary>${rest.map(card).join('')}</details>` : '');
}

function viewHome() {
  const ev = currentEvent();
  const sec = S.setup.section;
  const near = nearestPickup();
  return `<section class="page home ${S.match.intensity > 80 ? 'heat' : ''}">
    <div class="hero hero-match h-hero">
      ${stadiumArt()}
      <div class="hero-in">
        <div class="row between"><span class="pill pill-glass venue">${icon('pin')}<span>${esc(L(ev.venue))}</span></span>${live('live-chip', liveChip, 'span')}</div>
        <div>
          <p class="hero-sub">${esc(L(ev.league))}</p>
          ${live('score', matchHeader)}
        </div>
        <div class="seat-strip">
          <span class="seat-chip">${icon('ticket')}<span><b>${T('Section', 'القسم')} ${sec}</b> · ${T('Row', 'صف')} ${S.setup.row} · ${T('Seat', 'مقعد')} ${S.setup.seat}</span></span>
          <button class="btn btn-glass btn-sm" data-act="findSeat" data-arg="${sec}">${icon('route')} ${T('Find my seat', 'اعثر على مقعدي')}</button>
        </div>
      </div>
    </div>

    <div class="h-primary">${live('primary', primaryOrderBlock)}</div>

    <div class="h-facts facts">${live('facts', () => `
      <div class="fact"><span>${icon('clock')} ${T('Pickup wait', 'انتظار الاستلام')}</span><b>${mins(pickupWait(near.id))}</b><small>${L(near.name)}</small></div>
      <div class="fact"><span>${icon('users')} ${T('Crowd', 'الكثافة')}</span><b class="lvl-${levelKind(S.crowd[sec])}">${levelWord(S.crowd[sec])}</b><small>${T('Section', 'القسم')} ${sec}</small></div>
      <button class="fact" data-act="go" data-arg="profile"><span>${icon('star')} ${T('Points', 'النقاط')}</span><b>${S.points}</b><small>${L(TIERS[tierOf(S.points)].name)}</small></button>`)}
    </div>

    <section class="h-now block">
      <div class="block-head"><h2 class="h2">${sunMark(20, 'brand-sun')} ${T('Now', 'الآن')}</h2>${live('phase-pill', () => pill(phaseLabel(), 'brand'), 'span')}</div>
      ${live('companion', nowSection)}
    </section>

    <section class="h-match block tinted">
      <div class="block-head"><h2 class="h3">${T('Match timeline', 'سير المباراة')}</h2>${live('mclock', () => `<span class="muted small">${clockText()}</span>`, 'span')}</div>
      ${live('timeline', timeline)}
    </section>

    <div class="h-offer">${live('offers', () => { const fl = S.flash; const of = liveOffersForFan()[0]; return fl ? flashCard(fl) : of ? offerCard(of) : ''; })}</div>

    <section class="h-map block panel">
      <div class="block-head"><h2 class="h2">${T('Stadium map', 'خريطة الملعب')}</h2><button class="link" data-act="go" data-arg="map">${T('Open full map', 'افتح الخريطة')} ${icon('chevron', 'flip')}</button></div>
      ${stadiumMap({ id: 'home-map', compact: true })}
      ${live('pickups', () => `<div class="pickup-row">${PICKUPS.map((p) => { const l = pickupLoad(p.id); return `<button class="pickup-chip" data-act="mapInfo" data-arg="pick:${p.id}"><i class="dot lvl-bg-${levelKind(l)}"></i><span><b>${L(p.name)}</b><small>${levelWord(l)} · ${mins(pickupWait(p.id))}</small></span></button>`; }).join('')}</div>`)}
    </section>

    <nav class="h-explore explore" aria-label="${T('Explore', 'استكشف')}">
      <button class="tile" data-act="go" data-arg="group">${icon('users')}<b>${T('Group order', 'طلب جماعي')}</b><small>${S.group ? T('Code', 'الرمز') + ' ' + S.group.code : T('Order together', 'اطلبوا معاً')}</small></button>
      <button class="tile" data-act="go" data-arg="play">${icon('trophy')}<b>${T('Play', 'العب')}</b><small>${T('Optional games', 'ألعاب اختيارية')}</small></button>
      <button class="tile" data-act="go" data-arg="shop">${icon('shirt')}<b>${T('Club Shop', 'متجر النادي')}</b><small>${S.unlocked.includes('x77') ? T("77' drop live", 'إصدار 77 متاح') : T('Jerseys & more', 'قمصان والمزيد')}</small></button>
    </nav>
  </section>`;
}

/* ---------- full map ---------- */
let MAPSTATE = { route: false, section: null };
function viewMap() {
  const detailed = S.mapMode === 'detailed';
  const sec = MAPSTATE.section || S.setup.section;
  const gate = GATES.find((g) => g.id === S.setup.gate);
  const r = routeToSeat(gate.angle, sec);
  return `<section class="page">
    <div class="page-head"><h1 class="title">${T('Stadium map', 'خريطة الملعب')}</h1>
      <div class="seg" role="group" aria-label="${T('Map detail', 'تفاصيل الخريطة')}">
        <button class="${!detailed ? 'on' : ''}" data-act="mapMode" data-arg="simple" aria-pressed="${!detailed}">${T('Simple', 'مبسطة')}</button>
        <button class="${detailed ? 'on' : ''}" data-act="mapMode" data-arg="detailed" aria-pressed="${detailed}">${T('Detailed', 'مفصلة')}</button></div></div>
    <div class="toolbar">
      <button class="chip ${S.heatmap ? 'on' : ''}" data-act="toggleHeat" aria-pressed="${S.heatmap}">${icon('layers')} ${T('Crowd levels', 'مستوى الزحام')}</button>
      <span class="toolbar-sep"></span>
      <span class="muted small">${T('Route to', 'المسار إلى')}</span>
      ${Object.keys(SECTIONS).map((k) => `<button class="chip ${MAPSTATE.route && sec === k ? 'on' : ''}" data-act="findSeat" data-arg="${k}" aria-pressed="${MAPSTATE.route && sec === k}">${T('Section', 'القسم')} ${k}${k === S.setup.section ? ' · ' + T('mine', 'قسمي') : ''}</button>`).join('')}
    </div>
    <div class="map-layout">
      <div class="panel map-card">${stadiumMap({ id: 'full-map', route: MAPSTATE.route, routeSection: sec, detailed, facilities: true })}${mapLegend(detailed)}</div>
      <div class="map-side">
        ${MAPSTATE.route ? `<div class="panel route-card ${r.detour ? 'detour' : ''}">
          <h2 class="h3">${icon('route')} ${T('Route to Section', 'المسار إلى القسم')} ${sec}</h2>
          <div class="kpi-row">${statCard(T('From', 'من'), gate.id)}${statCard(T('Walk', 'المشي'), mins(walkMins(r.len, sec)))}${statCard(T('Distance', 'المسافة'), Math.round(r.len) + (S.lang === 'ar' ? ' م' : ' m'))}</div>
          ${r.detour ? `<div class="notice warn mt-s">${icon('alert')}<span>${T('Detour active: a concourse segment is closed.', 'مسار بديل: جزء من الممر مغلق.')}</span></div>` : ''}
          <ol class="directions">
            <li>${T(`Enter at ${L(gate.name)}`, `ادخل من ${L(gate.name)}`)}</li>
            <li>${T(`Follow the concourse ${r.dir > 0 ? 'clockwise' : 'anticlockwise'}`, `اتبع الممر ${r.dir > 0 ? 'باتجاه عقارب الساعة' : 'عكس عقارب الساعة'}`)}</li>
            <li>${T(`Take stairway ${sec}${S.setup.row > 10 ? '2' : '1'} — lift available`, `خذ الدرج ${sec}${S.setup.row > 10 ? '2' : '1'} — يتوفر مصعد`)}</li>
            <li>${T(`Row ${S.setup.row}, seat ${S.setup.seat}`, `الصف ${S.setup.row}، المقعد ${S.setup.seat}`)}</li>
          </ol>
          <button class="btn btn-orange w-full" data-act="arrivedSeat">${icon('check')} ${T("I'm in my seat", 'وصلت لمقعدي')}</button>
        </div>` : `<div class="panel"><h2 class="h3">${icon('route')} ${T('Navigate', 'التنقل')}</h2><p class="muted small">${T('Pick a section above to see a walking route from your gate.', 'اختر قسماً من الأعلى لعرض مسار المشي من بوابتك.')}</p>
          <button class="btn btn-orange w-full mt-s" data-act="findSeat" data-arg="${S.setup.section}">${T('Route to my seat', 'المسار إلى مقعدي')}</button></div>`}
        <div class="panel">${live('map-zones', () => `<h2 class="h3">${T('Live conditions', 'الحالة المباشرة')}</h2>
          <ul class="zone-list">${['A', 'B', 'C'].map((k) => `<li><span>${T('Section', 'القسم')} ${k}</span><span class="bar"><i class="lvl-bg-${levelKind(S.crowd[k])}" style="width:${S.crowd[k]}%"></i></span><b>${levelWord(S.crowd[k])}</b></li>`).join('')}
          ${PICKUPS.map((p) => `<li><span>${L(p.name)}</span><span class="bar"><i class="lvl-bg-${levelKind(pickupLoad(p.id))}" style="width:${pickupLoad(p.id)}%"></i></span><b>${mins(pickupWait(p.id))}</b></li>`).join('')}</ul>`)}
        </div>
        <div class="panel flat"><h2 class="h3">${icon('pin')} ${T('My location', 'موقعي')}</h2>
          <p class="muted small">${S.setup.locationMode === 'gps' ? T('Located near your gate.', 'تم تحديد موقعك قرب بوابتك.') : T('Location sharing is off — your section is set manually.', 'مشاركة الموقع متوقفة — قسمك محدد يدوياً.')}</p>
          <div class="row gap wrap mt-xs">${Object.keys(SECTIONS).map((k) => `<button class="chip ${S.setup.section === k ? 'on' : ''}" data-act="setSection" data-arg="${k}">${T('I am in', 'أنا في')} ${k}</button>`).join('')}</div></div>
      </div>
    </div>
  </section>`;
}
