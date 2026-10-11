/* GolBite — Fan Identity & Season Journey (tabbed), Settings. */

const PROFILE_TABS = () => [
  ['overview', T('Overview', 'نظرة عامة')],
  ['rewards', T('Rewards', 'المكافآت')],
  ['season', T('Season', 'الموسم')],
  ['orders', T('Orders', 'الطلبات')],
  ['privacy', T('Preferences', 'التفضيلات')],
];

function viewProfile(tab) {
  tab = PROFILE_TABS().some(([k]) => k === tab) ? tab : 'overview';
  const u = S.user;
  const v = S.visibility;
  const t = tierOf(S.points);
  return `<section class="page profile">
    <div class="profile-head">
      <span class="avatar xl" style="--tc:${myTeam().color}">${esc((u.name || 'F')[0].toUpperCase())}</span>
      <div class="grow"><h1 class="title sm">${v.name ? esc(u.name) : T('Hidden name', 'اسم مخفي')}</h1>
        <p class="muted small">${esc(u.handle)}</p>
        <div class="row gap-xs wrap mt-xs">${pill(L(TIERS[t].name), 'tier-' + t)}${pill(L(myTeam().name))}${v.section ? pill(T('Seat', 'المقعد') + ' ' + seatLabel()) : ''}</div></div>
      <button class="icon-btn" data-act="go" data-arg="settings" aria-label="${T('Settings', 'الإعدادات')}">${icon('settings')}</button>
    </div>
    <div class="facts">
      <div class="fact"><span>${icon('star')} ${T('Points', 'النقاط')}</span><b>${S.points}</b></div>
      <div class="fact"><span>${icon('ticket')} ${T('Matches', 'المباريات')}</span><b>${S.season.attended}</b></div>
      <div class="fact"><span>${icon('receipt')} ${T('Orders', 'الطلبات')}</span><b>${S.orders.length}</b></div>
      <div class="fact"><span>${icon('trophy')} ${T('Badges', 'الأوسمة')}</span><b>${S.badges.length}</b></div>
    </div>
    <div class="tabs" role="tablist">${PROFILE_TABS().map(([k, l]) => `<a role="tab" href="#/profile/${k}" aria-selected="${tab === k}" class="tab ${tab === k ? 'on' : ''}">${l}</a>`).join('')}</div>
    ${{ overview: profileOverview, rewards: profileRewards, season: profileSeason, orders: profileOrders, privacy: profilePrivacy }[tab]()}
  </section>`;
}

function profileOverview() {
  const t = tierOf(S.points);
  const tier = TIERS[t];
  const pct = tier.next ? ((S.points - tier.min) / (tier.next - tier.min)) * 100 : 100;
  const interests = [['food', T('Food deals', 'عروض الطعام')], ['merch', T('Merch drops', 'إصدارات المنتجات')], ['games', T('Games', 'الألعاب')], ['concerts', T('Concerts', 'الحفلات')], ['family', T('Family zone', 'منطقة العائلات')]];
  return `<div class="profile-grid">
    <section class="panel loyalty">
      <div class="row gap">${sunProgress(pct, 64)}<div class="grow"><small class="eyebrow">${T('Loyalty', 'الولاء')}</small><h2 class="h2" style="color:${tier.color}">${L(tier.name)}</h2>
        <p class="muted small">${tier.next ? T(`${tier.next - S.points} points to ${L(TIERS[t === 'bronze' ? 'silver' : 'gold'].name)}`, `${tier.next - S.points} نقطة حتى ${L(TIERS[t === 'bronze' ? 'silver' : 'gold'].name)}`) : T('Top tier reached', 'وصلت لأعلى فئة')}</p></div></div>
      <div class="tier-steps mt-s">${['bronze', 'silver', 'gold'].map((k) => `<span class="${S.points >= TIERS[k].min ? 'on' : ''}">${L(TIERS[k].name)}</span>`).join('')}</div>
    </section>
    <section class="panel">
      <h2 class="h3">${T('Matchday', 'يوم المباراة')}</h2>
      <div class="kv"><span>${T('Event', 'الحدث')}</span><b>${L(currentEvent().title)}</b></div>
      <div class="kv"><span>${T('Venue', 'الملعب')}</span><b>${L(currentEvent().venue)}</b></div>
      <div class="kv"><span>${T('Seat', 'المقعد')}</span><b>${seatLabel()} · ${S.setup.gate}</b></div>
      <button class="btn btn-ghost btn-sm mt-s" data-act="go" data-arg="setup">${icon('edit')} ${T('Change event or seat', 'تغيير الحدث أو المقعد')}</button>
    </section>
    <section class="panel">
      <h2 class="h3">${T('Offers for you', 'عروض لك')}</h2>
      <div class="row gap-xs wrap">${interests.map(([k, l]) => `<button class="chip sm ${S.interests.includes(k) ? 'on' : ''}" data-act="toggleInterest" data-arg="${k}" aria-pressed="${S.interests.includes(k)}">${l}</button>`).join('')}</div>
      <div class="mt-s">
        ${S.interests.includes('food') ? `<div class="kv"><span>🍔 ${L(COMBO.name)}</span><b>${sar(COMBO.price)}</b></div>` : ''}
        ${S.interests.includes('merch') ? `<div class="kv"><span>🧣 ${L(BUNDLES[0].name)}</span><b>${sar(BUNDLES[0].price)}</b></div>` : ''}
        ${S.interests.includes('games') ? `<div class="kv"><span>🏆 ${T('Double points on the halftime quiz', 'نقاط مضاعفة في مسابقة الاستراحة')}</span><b>2×</b></div>` : ''}
        ${S.interests.includes('concerts') ? `<div class="kv"><span>🎤 ${T('Desert Lights early entry', 'دخول مبكر لأضواء الصحراء')}</span><b>${T('Free', 'مجاني')}</b></div>` : ''}
        ${S.interests.includes('family') ? `<div class="kv"><span>👨‍👩‍👧 ${T('Family snack box', 'صندوق سناك العائلة')}</span><b>${sar(59)}</b></div>` : ''}
        ${!S.interests.length ? `<p class="muted small">${T('Pick interests to personalise offers.', 'اختر اهتماماتك لتخصيص العروض.')}</p>` : ''}
      </div>
    </section>
  </div>`;
}

function profileRewards() {
  const v = S.visibility;
  return `<div class="profile-grid">
    ${v.badges ? `<section class="panel"><h2 class="h3">${T('Badges', 'الأوسمة')} · ${S.badges.length}/${Object.keys(BADGES).length}</h2>
      <div class="badge-grid">${Object.entries(BADGES).map(([k, b]) => `<div class="badge ${S.badges.includes(k) ? 'on' : ''}"><span>${b.emoji}</span><small>${L(b.name)}</small></div>`).join('')}</div></section>` : ''}
    <section class="panel"><h2 class="h3">🏆 ${T('Virtual Trophy Cabinet', 'خزانة الجوائز الافتراضية')}</h2>
      ${S.trophies.length ? `<div class="cabinet">${S.trophies.map((tr) => `<div class="trophy"><span>${merch(tr.id).emoji}</span><small>${L(merch(tr.id).name)}</small><em>${T('Digital twin', 'نسخة رقمية')}</em></div>`).join('')}</div>`
        : `<div class="empty sm">${foodTile('🧣')}<p class="muted small">${T('Buy merchandise to add its digital twin here.', 'اشترِ منتجاً لإضافة نسخته الرقمية هنا.')}</p><button class="btn btn-ghost btn-sm" data-act="go" data-arg="shop">${T('Open Club Shop', 'افتح المتجر')}</button></div>`}</section>
    ${v.collectibles ? `<section class="panel span-2"><h2 class="h3">🃏 ${T('Season collectible series', 'سلسلة مقتنيات الموسم')} · ${S.collectibles.length}/${COLLECTIBLE_SERIES.length}</h2>
      <div class="cards-row">${COLLECTIBLE_SERIES.map((c) => { const own = S.collectibles.find((x) => x.id === c.id); return `<div class="coll ${own ? 'own' : ''} r-${c.rarity}"><span>${own ? c.emoji : '❔'}</span><b>${own ? L(c.name) : T('Locked', 'مقفلة')}</b><small>${own ? 'MD ' + own.md : c.rarity}</small></div>`; }).join('')}</div></section>` : ''}
  </div>`;
}

function profileSeason() {
  const challenges = [
    { label: T('Attend 5 matches', 'احضر 5 مباريات'), cur: S.season.attended, max: 5, reward: T('Season Scarf', 'وشاح الموسم') },
    { label: T('Try every vendor', 'جرّب كل البائعين'), cur: S.season.vendorsTried.length, max: VENDORS.length, reward: '+300 ' + T('pts', 'نقطة') },
    { label: T('Collect 5 season cards', 'اجمع 5 بطاقات موسمية'), cur: S.collectibles.length, max: 5, reward: T('Champions Night card', 'بطاقة ليلة الأبطال') },
    { label: T('Own 3 merch items', 'اقتنِ 3 منتجات'), cur: S.trophies.length, max: 3, reward: T('Collector badge', 'وسام الجامع') },
  ];
  const history = S.season.history.slice(0, 10);
  const v = S.visibility;
  return `<div class="profile-grid">
    <section class="panel"><h2 class="h3">${T('Season challenges', 'تحديات الموسم')}</h2>
      <ul class="challenges">${challenges.map((c) => `<li><div class="row between"><span>${c.label}</span><small class="muted">${Math.min(c.cur, c.max)}/${c.max}</small></div><div class="tier-track"><i style="width:${Math.min(100, (c.cur / c.max) * 100)}%"></i></div><small class="muted">${T('Reward', 'المكافأة')}: ${c.reward}</small></li>`).join('')}</ul></section>
    <section class="panel"><h2 class="h3">${T('Season timeline', 'الخط الزمني للموسم')}</h2>
      ${history.length ? `<ol class="season-tl">${history.map((h) => `<li><i></i><div><b>${h.kind === 'match' ? T('Attended matchday', 'حضور الجولة') + ' ' + h.md + ' · ' + h.score : h.kind === 'badge' ? BADGES[h.id].emoji + ' ' + L(BADGES[h.id].name) : h.kind === 'card' ? COLLECTIBLE_SERIES.find((c) => c.id === h.id).emoji + ' ' + L(COLLECTIBLE_SERIES.find((c) => c.id === h.id).name) : h.kind === 'merch' ? merch(h.id).emoji + ' ' + L(merch(h.id).name) : ''}</b><small class="muted">${T('Matchday', 'الجولة')} ${h.md}</small></div></li>`).join('')}</ol>`
        : `<p class="muted small">${T('Milestones appear here as you attend, order and play.', 'تظهر الإنجازات هنا مع الحضور والطلب واللعب.')}</p>`}</section>
    ${v.predictions ? `<section class="panel"><h2 class="h3">${T('Predictions & quizzes', 'التوقعات والمسابقات')}</h2>
      <div class="kv"><span>${T('Current prediction', 'التوقع الحالي')}</span><b>${S.prediction?.locked ? predLabel(S.prediction.result) + (S.prediction.resolved ? (S.prediction.correct ? ' ✓' : ' ✗') : '') : '—'}</b></div>
      <div class="kv"><span>${T('Halftime quiz', 'مسابقة الاستراحة')}</span><b>${S.quiz.done ? S.quiz.score + '/' + QUIZ.length : '—'}</b></div>
      <div class="kv"><span>${T('Section rivalry', 'تحدي الأقسام')}</span><b>${T('Section', 'القسم')} ${S.setup.section} · ${S.rivalry[S.setup.section]}</b></div></section>` : ''}
  </div>`;
}

function profileOrders() {
  if (!S.orders.length) return `<div class="empty panel">${foodTile('🧾', 'xl')}<b>${T('No orders yet', 'لا توجد طلبات بعد')}</b><button class="btn btn-orange" data-act="go" data-arg="menu">${T('Start an order', 'ابدأ طلباً')}</button></div>`;
  const spent = S.orders.reduce((s, o) => s + o.total, 0);
  return `<section class="panel">
    <div class="block-head"><h2 class="h3">${T('Order history', 'سجل الطلبات')}</h2><span class="muted small">${S.orders.length} · ${sar(spent)}</span></div>
    ${S.orders.map((o) => `<button class="kv kv-btn" data-act="go" data-arg="track/${o.id}"><span>${o.items.slice(0, 3).map((i) => item(i.id).emoji).join('')} <b>${o.id}</b> <small class="muted">${L(EVENTS.find((e) => e.id === o.eventId)?.title)}</small></span><span class="row gap-xs"><span class="status-chip sm st-${o.status}">${statusLabels(o)[o.status]}</span><b>${sar(o.total)}</b></span></button>`).join('')}
  </section>`;
}

function profilePrivacy() {
  const v = S.visibility;
  return `<div class="profile-grid">
    <section class="panel"><h2 class="h3">${icon('eye')} ${T('What others see (demo)', 'ما يراه الآخرون (تجريبي)')}</h2>
      ${[['name', T('Show my name', 'إظهار اسمي')], ['section', T('Show my seat', 'إظهار مقعدي')], ['badges', T('Show badges', 'إظهار الأوسمة')], ['collectibles', T('Show collectibles', 'إظهار المقتنيات')], ['predictions', T('Show predictions', 'إظهار التوقعات')]].map(([k, l]) => toggleRow(l, v[k], 'toggleVis', k)).join('')}</section>
    <section class="panel"><h2 class="h3">${icon('settings')} ${T('App', 'التطبيق')}</h2>
      <p class="muted small">${T('Language, event, simulation speed, motion and reset live in Settings.', 'اللغة والحدث وسرعة المحاكاة والحركة وإعادة الضبط في الإعدادات.')}</p>
      <div class="row gap mt-s wrap"><button class="btn btn-ghost" data-act="go" data-arg="settings">${icon('settings')} ${T('Open settings', 'افتح الإعدادات')}</button><button class="btn btn-ghost" data-act="signOut">${icon('logout', 'flip')} ${T('Sign out', 'تسجيل الخروج')}</button></div></section>
  </div>`;
}

function toggleRow(label, on, act, arg) {
  return `<label class="toggle-row"><span>${label}</span><input type="checkbox" role="switch" ${on ? 'checked' : ''} data-change="${act}" data-arg="${arg}"/><i class="switch" aria-hidden="true"></i></label>`;
}

function viewSettings() {
  return `<section class="page narrow settings">
    <button class="link" data-act="go" data-arg="profile">${icon('back', 'flip')} ${T('Profile', 'الملف الشخصي')}</button>
    <h1 class="title">${T('Settings', 'الإعدادات')}</h1>
    <section class="panel">
      <h2 class="h3">${icon('globe')} ${T('Language', 'اللغة')}</h2>
      <div class="seg w-full"><button class="${S.lang === 'ar' ? 'on' : ''}" data-act="setLang" data-arg="ar" lang="ar">العربية</button><button class="${S.lang === 'en' ? 'on' : ''}" data-act="setLang" data-arg="en" lang="en">English</button></div>
    </section>
    <section class="panel">
      <h2 class="h3">${icon('ticket')} ${T('Event', 'الحدث')}</h2>
      <div class="list">${EVENTS.map((e) => `<button class="choice ${currentEvent().id === e.id ? 'on' : ''}" data-act="switchEvent" data-arg="${e.id}" aria-pressed="${currentEvent().id === e.id}">${foodTile(e.type === 'concert' ? '🎤' : '⚽')}<span class="grow"><b>${L(e.title)}</b><small>${L(e.venue)}</small></span>${currentEvent().id === e.id ? icon('check') : ''}</button>`).join('')}</div>
      <h3 class="h3 mt">${T('Event theme', 'سمة الحدث')}</h3>
      <div class="seg w-full"><button class="${S.theme === 'brand' ? 'on' : ''}" data-act="setTheme" data-arg="brand">GolBite</button><button class="${S.theme === 'team' ? 'on' : ''}" data-act="setTheme" data-arg="team">${T('Team colours', 'ألوان الفريق')}</button></div>
    </section>
    <section class="panel">
      <h2 class="h3">${icon('timer')} ${T('Simulation', 'المحاكاة')}</h2>
      <div class="seg w-full" role="group" aria-label="${T('Simulation speed', 'سرعة المحاكاة')}">${[0.5, 1, 2, 4].map((s) => `<button class="${S.simSpeed === s ? 'on' : ''}" data-act="setSpeed" data-arg="${s}">${s}×</button>`).join('')}</div>
      ${toggleRow(T('Reduce motion', 'تقليل الحركة'), S.reducedMotion, 'toggleMotion', '')}
      ${toggleRow(T('Live match clock', 'ساعة المباراة المباشرة'), S.match.clock, 'toggleClock', '')}
    </section>
    <section class="panel">
      <h2 class="h3">${icon('sparkle')} ${T('Presenter', 'مقدّم العرض')}</h2>
      <div class="row gap wrap"><button class="btn btn-ghost" data-act="startTour">${icon('sparkle')} ${T('Start product tour', 'ابدأ جولة المنتج')}</button><button class="btn btn-ghost" data-act="openDemo">${icon('flask')} ${T('Demo controls', 'أدوات العرض')}</button></div>
    </section>
    <section class="panel danger-zone">
      <h2 class="h3">${icon('refresh')} ${T('Reset', 'إعادة الضبط')}</h2>
      <p class="muted small">${T('Reset the event to start the match again, or clear all demo data stored in this browser.', 'أعد ضبط الحدث لبدء المباراة من جديد، أو امسح كل البيانات التجريبية المحفوظة في هذا المتصفح.')}</p>
      <div class="row gap wrap mt-s"><button class="btn btn-ghost" data-act="askResetEvent">${T('Reset event', 'إعادة الحدث')}</button><button class="btn btn-danger" data-act="askResetAll">${T('Clear all demo data', 'مسح كل البيانات')}</button></div>
    </section>
    <p class="muted xs center">GolBite ${T('demo prototype', 'نموذج تجريبي')} · v1.1 · ${T('All match, order and campaign figures are simulated.', 'كل أرقام المباريات والطلبات والحملات محاكاة.')}</p>
  </section>`;
}
