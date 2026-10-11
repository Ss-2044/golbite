/* GolBite — Club Shop: merchandise, drops, mystery box, lottery, bundles and the simulated bag. */

function specialState(m) {
  switch (m.special) {
    case 'drop77': return S.unlocked.includes('x77') ? 'open' : T("Unlocks at 77'", 'يُفتح في الدقيقة 77');
    case 'gold': return tierOf(S.points) === 'gold' ? 'open' : T('Gold tier only', 'للفئة الذهبية فقط');
    case 'stadium': return S.unlocked.includes('xstad') ? 'open' : T('Stadium-wide goal', 'هدف الملعب الجماعي');
    case 'red': return S.unlocked.includes('xred') ? 'open' : T('Revealed on a red card', 'يظهر عند البطاقة الحمراء');
    case 'prediction': return S.unlocked.includes('xpred') ? 'open' : T('Correct prediction', 'توقع صحيح');
    case 'halftime': return S.match.phase === 'halftime' ? 'open' : T('Halftime only', 'في الاستراحة فقط');
    default: return 'open';
  }
}

function productCard(m) {
  const st = specialState(m);
  const open = st === 'open';
  const owned = S.trophies.some((t) => t.id === m.id);
  return `<article class="product ${open ? '' : 'locked'}">
    <button class="product-img" data-act="${open ? 'merchInfo' : 'lockedInfo'}" data-arg="${m.id}" aria-label="${esc(L(m.name))}"><span>${open ? m.emoji : '🔒'}</span>
      ${m.special && open ? `<em class="drop-tag">${T('Limited', 'محدود')}</em>` : ''}${owned ? `<em class="own-tag">${icon('check')}</em>` : ''}</button>
    <div class="product-body"><b>${L(m.name)}</b><small class="muted">${open ? sar(m.price) : st}</small></div>
    ${open ? `<button class="icon-btn sm primary add-btn" data-act="bagAdd" data-arg="${m.id}" aria-label="${T('Add to bag', 'أضف للحقيبة')} ${esc(L(m.name))}">${icon('plus')}</button>` : ''}
  </article>`;
}

let MYSTERY = null;
let LOTTO = null;
function viewShop() {
  const specials = MERCH.filter((m) => m.special);
  const core = MERCH.filter((m) => !m.special);
  const tc = myTeam();
  return `<section class="page">
    <div class="row between"><h1 class="title">${T('Club Shop', 'متجر النادي')}</h1>
      <button class="btn btn-ghost btn-sm bag-btn" data-act="openBag">${icon('bag')} ${T('Bag', 'الحقيبة')} <span class="count">${bagCount()}</span></button></div>
    <div class="hero hero-sm" style="--tc:${tc.color}">${stadiumArt()}<div class="hero-in">
      <span class="pill pill-glass">${L(tc.name)}</span><h2 class="hero-title sm">${T('Matchday drops & stadium exclusives', 'إصدارات يوم المباراة وحصريات الملعب')}</h2>
      ${live('stadium-unlock', () => `<div class="unlock"><div class="row between"><small>✨ ${T('Stadium-Wide Unlock', 'الهدف الجماعي للملعب')}</small><b>${Math.floor(S.stadiumUnlock)}%</b></div><div class="tier-track light"><i style="width:${S.stadiumUnlock}%"></i></div><small>${T('Every order and purchase in the stadium moves the meter.', 'كل طلب وشراء في الملعب يحرك المؤشر.')}</small></div>`)}
    </div></div>

    <h2 class="h2 mt">${T('Drops & specials', 'الإصدارات والعروض الخاصة')}</h2>
    ${live('specials', () => `<div class="hscroll">${specials.map(productCard).join('')}</div>`)}

    <div class="play-grid mt">
      <div class="card fun">
        <h2 class="h3">🎁 ${T('Mystery Box', 'الصندوق الغامض')}</h2>
        <p class="muted small">${T('SAR 79 — one random item, at least SAR 89 value.', '79 ر.س — قطعة عشوائية بقيمة 89 ر.س على الأقل.')}</p>
        <div class="mystery ${MYSTERY ? 'open' : ''}">${MYSTERY ? `<span class="reveal">${merch(MYSTERY).emoji}</span><b>${L(merch(MYSTERY).name)}</b>` : '<span class="box">🎁</span>'}</div>
        <button class="btn btn-primary w-full" data-act="mystery">${MYSTERY ? T('Open another', 'افتح آخر') : T('Reveal (demo)', 'اكشف (تجريبي)')}</button>
      </div>
      <div class="card fun">
        <h2 class="h3">🎰 ${T('Merch Lottery', 'سحب المنتجات')}</h2>
        <p class="muted small">${T('Spend 100 points for a spin.', 'استخدم 100 نقطة للسحب.')}</p>
        <div class="lotto ${LOTTO?.spinning ? 'spin' : ''}">${['🧣', '🧢', '👕', '⚽', '🚩'].map((e, i) => `<span class="${LOTTO && !LOTTO.spinning && LOTTO.idx === i ? 'win' : ''}">${e}</span>`).join('')}</div>
        <button class="btn btn-primary w-full" data-act="lotto" ${S.points < 100 || LOTTO?.spinning ? 'disabled' : ''}>${S.points < 100 ? T('Need 100 points', 'تحتاج 100 نقطة') : T('Spin', 'اسحب')}</button>
      </div>
      <div class="card fun">
        <h2 class="h3">💺 ${T('Lucky Seat Giveaway', 'جائزة المقعد المحظوظ')}</h2>
        <p class="muted small">${T('A random seat wins a signed jersey each half.', 'مقعد عشوائي يفوز بقميص موقّع كل شوط.')}</p>
        ${S.luckySeat ? `<div class="notice ${S.luckySeat === seatLabel() ? 'ok' : 'info'}">${S.luckySeat === seatLabel() ? '🎉 ' + T('Your seat won! Collect at the Club Store.', 'مقعدك فاز! استلم من متجر النادي.') : T('Winning seat:', 'المقعد الفائز:') + ' <b>' + S.luckySeat + '</b>'}</div>` : ''}
        <button class="btn btn-ghost w-full mt-s" data-act="luckySeat">${T('Draw now (demo)', 'اسحب الآن (تجريبي)')}</button>
      </div>
      <div class="card fun">
        <h2 class="h3">⚔️ ${T('Team Rivalry Challenge', 'تحدي الجماهير')}</h2>
        ${isConcert() ? `<p class="muted small">${T('Section shirts sold tonight', 'القمصان المباعة لكل قسم الليلة')}</p>` : ''}
        ${live('rival-shop', () => { const ev = currentEvent(); const h = 3400 + S.rivalry.A, a = 3100 + S.rivalry.B; return ev.away ? `<div class="vs"><div><b>${TEAMS[ev.home].short}</b><span>${h}</span></div><div class="vs-bar"><i style="width:${(h / (h + a)) * 100}%;background:${TEAMS[ev.home].color}"></i></div><div><b>${TEAMS[ev.away].short}</b><span>${a}</span></div></div><small class="muted">${T('Jerseys sold by each fan base today', 'القمصان المباعة لكل جمهور اليوم')}</small>` : `<div class="vs"><div><b>A</b><span>${S.rivalry.A}</span></div><div class="vs-bar"><i style="width:55%"></i></div><div><b>B</b><span>${S.rivalry.B}</span></div></div>`; })}
      </div>
    </div>

    <h2 class="h2 mt">${T('Snack + merch bundles', 'حزم الطعام + المنتجات')}</h2>
    <div class="list">${BUNDLES.map((b) => `<article class="combo"><span class="combo-img">${b.emoji}</span><div class="grow"><b>${L(b.name)}</b><span class="price">${sar(b.price)}</span></div><button class="btn btn-primary btn-sm" data-act="bundleAdd" data-arg="${b.id}">${T('Add', 'أضف')}</button></article>`).join('')}</div>

    <h2 class="h2 mt">${T('Official merchandise', 'المنتجات الرسمية')}</h2>
    <div class="product-grid">${core.map(productCard).join('')}</div>
    <p class="muted small mt">${T('Every purchase includes a digital twin collectible in your Trophy Cabinet.', 'كل عملية شراء تتضمن نسخة رقمية في خزانة الجوائز.')}</p>
  </section>`;
}

function merchInfoSheet(id) {
  const m = merch(id);
  return `<div class="item-hero big">${foodTile(m.emoji, 'xl')}</div>
    <h2 class="sheet-title">${L(m.name)}</h2><p class="muted">${L(m.desc)}</p>
    <div class="kv"><span>${T('Price', 'السعر')}</span><b>${sar(m.price)}</b></div>
    ${m.sizes ? `<div class="row gap wrap mt-s" role="group" aria-label="${T('Size', 'المقاس')}">${['S', 'M', 'L', 'XL'].map((s) => `<button class="chip ${(S.size || 'M') === s ? 'on' : ''}" data-act="pickSize" data-arg="${s}">${s}</button>`).join('')}</div>` : ''}
    <div class="notice info mt">${icon('sparkle')}<span>${T('Includes a digital twin for your Trophy Cabinet.', 'يتضمن نسخة رقمية لخزانة جوائزك.')}</span></div>
    <div class="notice mt-s">${icon('star')}<span>${T('Loyalty tier price: Silver −5%, Gold −10% (demo).', 'سعر الولاء: فضي −5%، ذهبي −10% (تجريبي).')}</span></div>
    <button class="btn btn-orange btn-lg w-full mt" data-act="bagAdd" data-arg="${id}" autofocus>${icon('bag')} ${T('Add to bag', 'أضف للحقيبة')}</button>`;
}

function bagDiscount() { return tierOf(S.points) === 'gold' ? 0.1 : tierOf(S.points) === 'silver' ? 0.05 : 0; }
function bagSheet() {
  const entries = Object.entries(S.bag);
  if (!entries.length) return `<div class="empty">${foodTile('🛍️', 'xl')}<b>${T('Your bag is empty', 'حقيبتك فارغة')}</b><button class="btn btn-primary" data-act="closeSheet">${T('Keep shopping', 'تابع التسوق')}</button></div>`;
  const sub = entries.reduce((s, [id, q]) => s + merch(id).price * q, 0);
  const disc = Math.round(sub * bagDiscount());
  return `<h2 class="sheet-title">${T('Your bag', 'حقيبتك')}</h2>
    ${entries.map(([id, q]) => `<div class="sum-row">${foodTile(merch(id).emoji)}<div class="grow"><b>${L(merch(id).name)}</b><small>${sar(merch(id).price)}</small></div>
      <div class="stepper"><button class="icon-btn sm" data-act="bagRemove" data-arg="${id}" aria-label="${T('Remove one', 'إزالة واحد')}">${icon('minus')}</button><output>${q}</output><button class="icon-btn sm primary" data-act="bagAdd" data-arg="${id}" aria-label="${T('Add one', 'إضافة واحد')}">${icon('plus')}</button></div></div>`).join('')}
    <div class="kv"><span>${T('Subtotal', 'المجموع الفرعي')}</span><b>${sar(sub)}</b></div>
    ${disc ? `<div class="kv ok"><span>${L(TIERS[tierOf(S.points)].name)} ${T('member price', 'سعر العضوية')}</span><b>−${sar(disc)}</b></div>` : ''}
    <div class="kv total"><span>${T('Total', 'الإجمالي')}</span><b>${sar(sub - disc)}</b></div>
    <h3 class="h3 mt">${T('Collect', 'الاستلام')}</h3>
    <div class="seg w-full"><button class="${(S.bagMode || 'store') === 'store' ? 'on' : ''}" data-act="bagMode" data-arg="store">${T('Club Store, Gate 1', 'متجر النادي، البوابة 1')}</button><button class="${S.bagMode === 'seat' ? 'on' : ''}" data-act="bagMode" data-arg="seat">${T('Seat delivery', 'توصيل للمقعد')}</button></div>
    <p class="muted small mt-s">${T('Demo purchase — no payment is taken.', 'شراء تجريبي — لن يتم الدفع.')}</p>
    <button class="btn btn-orange btn-lg w-full" data-act="checkout">${T('Complete purchase', 'إتمام الشراء')} · ${sar(sub - disc)}</button>`;
}
