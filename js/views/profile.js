/* GolBite — Fan Identity & Season Journey, Settings. */

function viewProfile() {
  const u = S.user;
  const v = S.visibility;
  const t = tierOf(S.points);
  const orders = S.orders;
  const challenges = [
    { label: T('Attend 5 matches', 'احضر 5 مباريات'), cur: S.season.attended, max: 5, reward: T('Season Scarf', 'وشاح الموسم') },
    { label: T('Try all 4 vendors', 'جرّب البائعين الأربعة'), cur: S.season.vendorsTried.length, max: 4, reward: '+300 ' + T('pts', 'نقطة') },
    { label: T('Collect 5 season cards', 'اجمع 5 بطاقات موسمية'), cur: S.collectibles.length, max: 5, reward: T('Champions Night card', 'بطاقة ليلة الأبطال') },
    { label: T('Own 3 merch items', 'اقتنِ 3 منتجات'), cur: S.trophies.length, max: 3, reward: T('Collector badge', 'وسام الجامع') },
  ];
  const history = S.season.history.slice(0, 8);
  const interests = [['food', T('Food deals', 'عروض الطعام')], ['merch', T('Merch drops', 'إصدارات المنتجات')], ['games', T('Games', 'الألعاب')], ['concerts', T('Concerts', 'الحفلات')], ['family', T('Family zone', 'منطقة العائلات')]];
  return `<section class="page">
    <div class="profile-head card">
      <span class="avatar xl" style="--tc:${myTeam().color}">${esc((u.name || 'F')[0].toUpperCase())}</span>
      <div class="grow"><h1 class="title sm">${v.name ? esc(u.name) : T('Hidden name', 'اسم مخفي')}</h1>
        <p class="muted">${esc(u.handle)}${v.section ? ' · ' + T('Seat', 'المقعد') + ' ' + seatLabel() : ''}</p>
        <div class="row gap wrap">${pill(L(TIERS[t].name), 'tier-' + t)}${pill(L(myTeam().name))}${pill(T('Matchday', 'الجولة') + ' ' + S.season.matchday)}</div></div>
      <button class="icon-btn" data-act="go" data-arg="settings" aria-label="${T('Settings', 'الإعدادات')}">${icon('settings')}</button>
    </div>

    <div class="glance mt">
      <div class="g-card"><span class="g-l">${icon('star')} ${T('Points', 'النقاط')}</span><b>${S.points}</b></div>
      <div class="g-card"><span class="g-l">${icon('ticket')} ${T('Matches', 'المباريات')}</span><b>${S.season.attended}</b></div>
      <div class="g-card"><span class="g-l">${icon('receipt')} ${T('Orders', 'الطلبات')}</span><b>${orders.length}</b></div>
      <div class="g-card"><span class="g-l">${icon('trophy')} ${T('Badges', 'الأوسمة')}</span><b>${S.badges.length}</b></div>
    </div>

    <div class="card mt">${tierBar()}</div>

    <div class="profile-grid mt">
      ${v.badges ? `<div class="card"><h2 class="h3">${T('Badges', 'الأوسمة')}</h2>
        <div class="badge-grid">${Object.entries(BADGES).map(([k, b]) => `<div class="badge ${S.badges.includes(k) ? 'on' : ''}"><span>${b.emoji}</span><small>${L(b.name)}</small></div>`).join('')}</div></div>` : ''}

      <div class="card"><h2 class="h3">🏆 ${T('Virtual Trophy Cabinet', 'خزانة الجوائز الافتراضية')}</h2>
        ${S.trophies.length ? `<div class="cabinet">${S.trophies.map((tr) => `<div class="trophy"><span>${merch(tr.id).emoji}</span><small>${L(merch(tr.id).name)}</small><em>${T('Digital twin', 'نسخة رقمية')}</em></div>`).join('')}</div>`
          : `<div class="empty sm">${foodTile('🧣')}<p class="muted">${T('Buy merch in Club Shop to add its digital twin here.', 'اشترِ من المتجر لإضافة النسخة الرقمية هنا.')}</p><button class="btn btn-ghost btn-sm" data-act="go" data-arg="shop">${T('Open Club Shop', 'افتح المتجر')}</button></div>`}</div>

      ${v.collectibles ? `<div class="card"><h2 class="h3">🃏 ${T('Digital collectibles', 'المقتنيات الرقمية')}</h2>
        ${S.collectibles.length ? `<div class="cards-row">${S.collectibles.map((c) => { const d = COLLECTIBLE_SERIES.find((x) => x.id === c.id); return `<div class="coll own r-${d.rarity}"><span>${d.emoji}</span><b>${L(d.name)}</b><small>MD ${c.md}</small></div>`; }).join('')}</div>`
          : `<p class="muted">${T('Earn cards by ordering twice and attending matchdays.', 'اكسب البطاقات بتكرار الطلب وحضور الجولات.')}</p>`}</div>` : ''}

      <div class="card"><h2 class="h3">${T('Season challenges', 'تحديات الموسم')}</h2>
        <ul class="challenges">${challenges.map((c) => `<li><div class="row between"><span>${c.label}</span><small class="muted">${Math.min(c.cur, c.max)}/${c.max}</small></div><div class="tier-track"><i style="width:${Math.min(100, (c.cur / c.max) * 100)}%"></i></div><small class="muted">${T('Reward', 'المكافأة')}: ${c.reward}</small></li>`).join('')}</ul></div>

      <div class="card"><h2 class="h3">${T('Season timeline', 'الخط الزمني للموسم')}</h2>
        ${history.length ? `<ol class="season-tl">${history.map((h) => `<li><i></i><div><b>${h.kind === 'match' ? T('Attended matchday', 'حضور الجولة') + ' ' + h.md + ' · ' + h.score : h.kind === 'badge' ? BADGES[h.id].emoji + ' ' + L(BADGES[h.id].name) : h.kind === 'card' ? COLLECTIBLE_SERIES.find((c) => c.id === h.id).emoji + ' ' + L(COLLECTIBLE_SERIES.find((c) => c.id === h.id).name) : h.kind === 'merch' ? merch(h.id).emoji + ' ' + L(merch(h.id).name) : ''}</b><small class="muted">${T('Matchday', 'الجولة')} ${h.md}</small></div></li>`).join('')}</ol>`
          : `<p class="muted">${T('Your milestones will appear here as you attend, order and play.', 'ستظهر إنجازاتك هنا مع الحضور والطلب واللعب.')}</p>`}</div>

      ${v.predictions ? `<div class="card"><h2 class="h3">${T('Predictions & quizzes', 'التوقعات والمسابقات')}</h2>
        <div class="kv"><span>${T('Current prediction', 'التوقع الحالي')}</span><b>${S.prediction?.locked ? predLabel(S.prediction.result) + (S.prediction.resolved ? (S.prediction.correct ? ' ✓' : ' ✗') : '') : '—'}</b></div>
        <div class="kv"><span>${T('Halftime quiz', 'مسابقة الاستراحة')}</span><b>${S.quiz.done ? S.quiz.score + '/' + QUIZ.length : '—'}</b></div>
        <div class="kv"><span>${T('Section rivalry', 'تحدي الأقسام')}</span><b>${T('Section', 'القسم')} ${S.setup.section} · ${S.rivalry[S.setup.section]}</b></div></div>` : ''}

      <div class="card"><h2 class="h3">${T('Your interests', 'اهتماماتك')}</h2>
        <p class="muted small">${T('We use these to pick offers in your Matchday Companion.', 'نستخدمها لاختيار العروض في رفيق المباراة.')}</p>
        <div class="row gap wrap">${interests.map(([k, l]) => `<button class="chip ${S.interests.includes(k) ? 'on' : ''}" data-act="toggleInterest" data-arg="${k}" aria-pressed="${S.interests.includes(k)}">${l}</button>`).join('')}</div>
        <h3 class="h3 mt">${T('Offers for you', 'عروض لك')}</h3>
        ${S.interests.includes('food') ? `<div class="kv"><span>🍔 ${L(COMBO.name)}</span><b>${sar(COMBO.price)}</b></div>` : ''}
        ${S.interests.includes('merch') ? `<div class="kv"><span>🧣 ${T('Scarf + Combo bundle', 'حزمة وشاح + كومبو')}</span><b>${sar(99)}</b></div>` : ''}
        ${S.interests.includes('games') ? `<div class="kv"><span>🏆 ${T('Double points on quiz', 'نقاط مضاعفة في المسابقة')}</span><b>2×</b></div>` : ''}
        ${S.interests.includes('concerts') ? `<div class="kv"><span>🎤 ${T('Desert Lights early entry', 'دخول مبكر لأضواء الصحراء')}</span><b>${T('Free', 'مجاني')}</b></div>` : ''}
        ${S.interests.includes('family') ? `<div class="kv"><span>👨‍👩‍👧 ${T('Family snack box', 'صندوق سناك العائلة')}</span><b>${sar(59)}</b></div>` : ''}
      </div>

      <div class="card"><h2 class="h3">${icon('eye')} ${T('Profile visibility (demo)', 'ظهور الملف (تجريبي)')}</h2>
        ${[['name', T('Show my name', 'إظهار اسمي')], ['section', T('Show my seat', 'إظهار مقعدي')], ['badges', T('Show badges', 'إظهار الأوسمة')], ['collectibles', T('Show collectibles', 'إظهار المقتنيات')], ['predictions', T('Show predictions', 'إظهار التوقعات')]].map(([k, l]) => toggleRow(l, v[k], 'toggleVis', k)).join('')}</div>
    </div>
    <div class="row gap mt"><button class="btn btn-ghost grow" data-act="go" data-arg="settings">${icon('settings')} ${T('Settings', 'الإعدادات')}</button><button class="btn btn-ghost grow" data-act="signOut">${icon('logout', 'flip')} ${T('Sign out', 'تسجيل الخروج')}</button></div>
  </section>`;
}

function toggleRow(label, on, act, arg) {
  return `<label class="toggle-row"><span>${label}</span><input type="checkbox" role="switch" ${on ? 'checked' : ''} data-change="${act}" data-arg="${arg}"/><i class="switch" aria-hidden="true"></i></label>`;
}

function viewSettings() {
  return `<section class="page narrow">
    <button class="link" data-act="go" data-arg="profile">${icon('back', 'flip')} ${T('Profile', 'الملف الشخصي')}</button>
    <h1 class="title">${T('Settings', 'الإعدادات')}</h1>
    <div class="card">
      <h2 class="h3">${icon('globe')} ${T('Language', 'اللغة')}</h2>
      <div class="seg w-full"><button class="${S.lang === 'en' ? 'on' : ''}" data-act="setLang" data-arg="en" lang="en">English</button><button class="${S.lang === 'ar' ? 'on' : ''}" data-act="setLang" data-arg="ar" lang="ar">العربية</button></div>
    </div>
    <div class="card mt">
      <h2 class="h3">${T('Event theme', 'سمة الحدث')}</h2>
      <div class="seg w-full"><button class="${S.theme === 'brand' ? 'on' : ''}" data-act="setTheme" data-arg="brand">GolBite</button><button class="${S.theme === 'team' ? 'on' : ''}" data-act="setTheme" data-arg="team">${T('Team colours', 'ألوان الفريق')}</button></div>
      <h2 class="h3 mt">${T('Demo event', 'الحدث التجريبي')}</h2>
      <div class="row gap wrap">${EVENTS.map((e) => `<button class="chip ${currentEvent().id === e.id ? 'on' : ''}" data-act="switchEvent" data-arg="${e.id}">${e.type === 'concert' ? '🎤' : '⚽'} ${L(e.title)}</button>`).join('')}</div>
    </div>
    <div class="card mt">
      <h2 class="h3">${T('Simulation speed', 'سرعة المحاكاة')}</h2>
      <div class="seg w-full">${[0.5, 1, 2, 4].map((s) => `<button class="${S.simSpeed === s ? 'on' : ''}" data-act="setSpeed" data-arg="${s}">${s}×</button>`).join('')}</div>
      ${toggleRow(T('Reduce motion', 'تقليل الحركة'), S.reducedMotion, 'toggleMotion', '')}
      ${toggleRow(T('Live match clock', 'ساعة المباراة المباشرة'), S.match.clock, 'toggleClock', '')}
    </div>
    <div class="card mt">
      <h2 class="h3">${T('Presenter', 'مقدّم العرض')}</h2>
      <div class="row gap wrap"><button class="btn btn-ghost" data-act="startTour">${icon('sparkle')} ${T('Start product tour', 'ابدأ جولة المنتج')}</button><button class="btn btn-ghost" data-act="openDemo">${icon('flask')} ${T('Demo controls', 'أدوات العرض')}</button></div>
    </div>
    <div class="card mt danger-zone">
      <h2 class="h3">${T('Reset', 'إعادة الضبط')}</h2>
      <p class="muted small">${T('Clears demo orders, points, badges, collectibles and preferences stored in this browser.', 'يمسح الطلبات والنقاط والأوسمة والمقتنيات والتفضيلات المحفوظة في هذا المتصفح.')}</p>
      <div class="row gap wrap"><button class="btn btn-ghost" data-act="askResetEvent">${icon('refresh')} ${T('Reset event only', 'إعادة الحدث فقط')}</button><button class="btn btn-danger" data-act="askResetAll">${T('Reset all demo data', 'مسح كل البيانات التجريبية')}</button></div>
    </div>
    <p class="muted small center mt">GolBite ${T('demo prototype', 'نموذج تجريبي')} · v1.0</p>
  </section>`;
}
