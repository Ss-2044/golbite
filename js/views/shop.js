/* GolBite — Club Shop: merchandise, timed drops, bundles and matchday experiences. Uses the same cart as food. */

function specialState(m) {
  const mm = S.match;
  switch (m.special) {
    case 'drop77':
      if (S.unlocked.includes('x77')) return 'open';
      if (mm.phase === 'second' || mm.phase === 'kickoff') return T(`Drops in ${Math.max(1, 77 - mm.minute)} min`, `يُطرح بعد ${Math.max(1, 77 - mm.minute)} د`);
      return T("Drops at 77'", 'يُطرح في الدقيقة 77');
    case 'gold': return tierOf(S.points) === 'gold' ? 'open' : T('Gold tier only', 'للفئة الذهبية فقط');
    case 'stadium': return S.unlocked.includes('xstad') ? 'open' : T(`Stadium goal ${Math.floor(S.stadiumUnlock)}%`, `هدف الملعب ${Math.floor(S.stadiumUnlock)}%`);
    case 'red': return S.unlocked.includes('xred') ? 'open' : T('Revealed on a red card', 'يظهر عند البطاقة الحمراء');
    case 'prediction': return S.unlocked.includes('xpred') ? 'open' : T('Correct prediction', 'توقع صحيح');
    case 'halftime': return S.match.phase === 'halftime' ? 'open' : T('Halftime only', 'في الاستراحة فقط');
    default: return 'open';
  }
}

function productCard(m) {
  const st = specialState(m);
  const open = st === 'open';
  const sold = S.soldOut.includes(m.id);
  const owned = S.trophies.some((t) => t.id === m.id);
  const inCart = cartQty(m.id);
  return `<article class="product ${open ? '' : 'locked'} ${sold ? 'sold' : ''}">
    <button class="product-media" data-act="${open ? 'itemInfo' : 'lockedInfo'}" data-arg="${m.id}" aria-label="${esc(L(m.name))}">
      ${open ? media(m, 'fill') : `<span class="media fill locked-media">${icon('lock')}</span>`}
      ${m.special && open ? `<em class="tag tag-drop">${T('Limited', 'محدود')}</em>` : ''}${owned ? `<em class="tag tag-own">${icon('check')}</em>` : ''}</button>
    <div class="product-body">
      <b>${L(m.name)}</b>
      ${open ? `<span class="price">${sar(m.price)}</span>` : `<small class="muted">${st}</small>`}
    </div>
    ${open && !sold ? `<button class="btn btn-orange btn-sm product-add" data-act="${m.opts ? 'itemInfo' : 'addItem'}" data-arg="${m.id}" aria-label="${T('Add to order', 'أضف للطلب')} ${esc(L(m.name))}">${inCart ? `${inCart}× ` : ''}${icon('plus')}</button>` : sold ? `<span class="avail out product-add">${T('Sold out', 'نفد')}</span>` : ''}
  </article>`;
}

let MYSTERY = null;
let LOTTO = null;
function viewShop() {
  const drop = merch('x77');
  const dropState = specialState(drop);
  // "All" keeps the grid shoppable: locked drops (except the headline 77' drop) live under "Limited drops".
  const list = MERCH_ITEMS.filter((m) => S.shopCat === 'all' ? (!m.special || m.id === 'x77' || specialState(m) === 'open') : m.group === S.shopCat);
  const owned = S.trophies;
  return `<section class="page shop">
    <div class="page-head"><h1 class="title">${T('Club Shop', 'متجر النادي')}</h1>
      <button class="btn btn-ghost btn-sm" data-act="go" data-arg="summary">${icon('bag')} ${T('Cart', 'السلة')} <span class="count">${cartCount()}</span></button></div>

    <div class="hero shop-hero">${stadiumArt()}<div class="hero-in">
      <div class="row between"><span class="pill pill-glass">${icon('sparkle')} ${T('Matchday drop', 'إصدار يوم المباراة')}</span>${live('drop-state', () => `<span class="live-chip ${specialState(drop) === 'open' ? '' : 'idle'}">${specialState(drop) === 'open' ? T('LIVE NOW', 'متاح الآن') : specialState(drop)}</span>`, 'span')}</div>
      <div class="shop-hero-main">
        <span class="hero-product" aria-hidden="true">${drop.emoji}</span>
        <div><h2 class="hero-title sm">${L(drop.name)}</h2><p class="hero-sub">${L(drop.desc)}</p>
          <div class="row gap mt-s wrap"><b class="hero-price">${sar(drop.price)}</b>
            ${dropState === 'open' ? `<button class="btn btn-orange" data-act="addItem" data-arg="x77">${icon('plus')} ${T('Add to order', 'أضف للطلب')}</button>` : `<button class="btn btn-glass" data-act="lockedInfo" data-arg="x77">${icon('bell')} ${T('Remind me', 'ذكّرني')}</button>`}</div></div>
      </div>
      ${live('stadium-unlock', () => `<div class="unlock">${sunProgress(S.stadiumUnlock, 34, 'light')}<div class="grow"><small>${T('Stadium-wide unlock: Golden Scarf', 'الهدف الجماعي: الوشاح الذهبي')}</small><b>${Math.floor(S.stadiumUnlock)}%</b></div></div>`)}
    </div></div>

    <div class="tabs" role="tablist" aria-label="${T('Shop categories', 'أقسام المتجر')}">${SHOP_CATS.map((c) => `<button role="tab" aria-selected="${S.shopCat === c.id}" class="tab ${S.shopCat === c.id ? 'on' : ''}" data-act="shopCat" data-arg="${c.id}">${L(c.name)}</button>`).join('')}</div>
    ${live('products', () => `<div class="product-grid">${list.map(productCard).join('')}</div>`)}
    <p class="muted xs">${T('Merchandise is added to your food order: collect it at your pickup point or get it delivered to your seat. Every item includes a digital twin.', 'تُضاف المنتجات إلى طلبك: استلمها من نقطة الاستلام أو تُوصل لمقعدك. كل منتج يشمل نسخة رقمية.')}</p>

    <section class="block">
      <div class="block-head"><h2 class="h2">${T('Snack + merch bundles', 'حزم الطعام + المنتجات')}</h2></div>
      <div class="bundle-row">${BUNDLES.map((b) => `<article class="bundle"><span class="bundle-img" aria-hidden="true">${b.emoji}</span><div class="grow"><b>${L(b.name)}</b><span class="price">${sar(b.price)}</span></div><button class="btn btn-orange btn-sm" data-act="bundleAdd" data-arg="${b.id}">${T('Add', 'أضف')}</button></article>`).join('')}</div>
    </section>

    <section class="block">
      <div class="block-head"><h2 class="h2">${T('Your digital collectibles', 'مقتنياتك الرقمية')}</h2><button class="link" data-act="go" data-arg="profile/rewards">${T('Trophy cabinet', 'خزانة الجوائز')} ${icon('chevron', 'flip')}</button></div>
      ${owned.length ? `<div class="cards-row">${owned.map((t) => `<div class="coll own"><span>${merch(t.id).emoji}</span><b>${L(merch(t.id).name)}</b><small>${T('Digital twin', 'نسخة رقمية')}</small></div>`).join('')}</div>`
        : `<p class="muted small">${T('Buy any item to unlock its digital twin.', 'اشترِ أي منتج لفتح نسخته الرقمية.')}</p>`}
    </section>

    <details class="block more panel flat">
      <summary class="h3">${icon('gift')} ${T('Matchday experiences', 'تجارب يوم المباراة')} <small class="muted">${T('Mystery box · lottery · lucky seat · rivalry', 'الصندوق الغامض · السحب · المقعد المحظوظ · التحدي')}</small> ${icon('down')}</summary>
      <div class="play-grid mt-s">
        <div class="panel fun">
          <h3 class="h3">🎁 ${T('Mystery Box', 'الصندوق الغامض')}</h3>
          <p class="muted small">${T('One random item, at least SAR 89 value (demo).', 'قطعة عشوائية بقيمة 89 ر.س على الأقل (تجريبي).')}</p>
          <div class="mystery ${MYSTERY ? 'open' : ''}">${MYSTERY ? `<span class="reveal">${merch(MYSTERY).emoji}</span><b>${L(merch(MYSTERY).name)}</b>` : '<span class="box">🎁</span>'}</div>
          <button class="btn btn-primary w-full" data-act="mystery">${MYSTERY ? T('Open another', 'افتح آخر') : T('Reveal', 'اكشف')}</button>
        </div>
        <div class="panel fun">
          <h3 class="h3">🎰 ${T('Merch Lottery', 'سحب المنتجات')}</h3>
          <p class="muted small">${T('Spend 100 points for a spin.', 'استخدم 100 نقطة للسحب.')}</p>
          <div class="lotto ${LOTTO?.spinning ? 'spin' : ''}">${['🧣', '🧢', '👕', '⚽', '🚩'].map((e, i) => `<span class="${LOTTO && !LOTTO.spinning && LOTTO.idx === i ? 'win' : ''}">${e}</span>`).join('')}</div>
          <button class="btn btn-primary w-full" data-act="lotto" ${S.points < 100 || LOTTO?.spinning ? 'disabled' : ''}>${S.points < 100 ? T('Need 100 points', 'تحتاج 100 نقطة') : T('Spin', 'اسحب')}</button>
        </div>
        <div class="panel fun">
          <h3 class="h3">💺 ${T('Lucky Seat Giveaway', 'جائزة المقعد المحظوظ')}</h3>
          <p class="muted small">${T('A random seat wins a signed jersey each half.', 'مقعد عشوائي يفوز بقميص موقّع كل شوط.')}</p>
          ${S.luckySeat ? `<div class="notice ${S.luckySeat === seatLabel() ? 'ok' : 'info'}">${S.luckySeat === seatLabel() ? '🎉 ' + T('Your seat won! Collect at the Club Store.', 'مقعدك فاز! استلم من متجر النادي.') : T('Winning seat:', 'المقعد الفائز:') + ' <b>' + S.luckySeat + '</b>'}</div>` : ''}
          <button class="btn btn-ghost w-full mt-s" data-act="luckySeat">${T('Draw now', 'اسحب الآن')}</button>
        </div>
        <div class="panel fun">
          <h3 class="h3">⚔️ ${T('Team Rivalry Challenge', 'تحدي الجماهير')}</h3>
          ${live('rival-shop', () => { const ev = currentEvent(); const h = 3400 + S.rivalry.A, a = 3100 + S.rivalry.B; return ev.away ? `<div class="vs"><div><b>${TEAMS[ev.home].short}</b><span>${h}</span></div><div class="vs-bar"><i style="width:${(h / (h + a)) * 100}%;background:${TEAMS[ev.home].color}"></i></div><div><b>${TEAMS[ev.away].short}</b><span>${a}</span></div></div><small class="muted">${T('Jerseys sold by each fan base today', 'القمصان المباعة لكل جمهور اليوم')}</small>` : `<div class="vs"><div><b>A</b><span>${S.rivalry.A}</span></div><div class="vs-bar"><i style="width:55%"></i></div><div><b>B</b><span>${S.rivalry.B}</span></div></div>`; })}
        </div>
      </div>
    </details>
  </section>`;
}
