/* GolBite — ordering: menu, item details, summary, tracking, history, help, Group Order. */

function destPicker(type, dest, actPrefix = 'cart') {
  if (type === 'delivery') {
    return `<div class="dest-row">${Object.keys(SECTIONS).map((k) => `<button class="dest ${dest === k ? 'on' : ''}" data-act="${actPrefix}Dest" data-arg="${k}" aria-pressed="${dest === k}">
      <b>${T('Section', 'القسم')} ${k}</b><small>${k === S.setup.section ? T('Your seat', 'مقعدك') + ' ' + seatLabel() : levelWord(S.crowd[k])}</small></button>`).join('')}</div>`;
  }
  return `<div class="dest-row">${PICKUPS.map((p) => { const l = pickupLoad(p.id); return `<button class="dest ${dest === p.id ? 'on' : ''}" data-act="${actPrefix}Dest" data-arg="${p.id}" aria-pressed="${dest === p.id}">
    <b>${L(p.name)}</b><small class="lvl-${levelKind(l)}">${levelWord(l)} · ${mins(pickupWait(p.id))}</small></button>`; }).join('')}</div>`;
}

function ensureCartDest() {
  const c = S.cart;
  if (c.type === 'delivery' && !SECTIONS[c.dest]) c.dest = S.setup.section;
  if (c.type === 'pickup' && !pickup(c.dest)) c.dest = bestPickup().id;
}

function stepper(id, qty, act = 'Item') {
  const m = item(id);
  return `<div class="stepper" role="group" aria-label="${esc(L(m.name))}">
    <button class="icon-btn sm" data-act="remove${act}" data-arg="${id}" aria-label="${T('Remove one', 'إزالة واحد')} ${esc(L(m.name))}" ${qty ? '' : 'disabled'}>${icon('minus')}</button>
    <output aria-live="polite">${qty}</output>
    <button class="icon-btn sm primary" data-act="add${act}" data-arg="${id}" aria-label="${T('Add one', 'إضافة واحد')} ${esc(L(m.name))}">${icon('plus')}</button></div>`;
}

function menuItemRow(m, qtyMap = S.cart.items, act = 'Item') {
  const sold = S.soldOut.includes(m.id);
  const qty = qtyMap[m.id] || 0;
  const fav = S.favorites.includes(m.id);
  const alt = item(ALTERNATIVES[m.id]);
  const flash = S.flash?.item === m.id;
  return `<article class="menu-item ${sold ? 'sold' : ''} ${qty ? 'in' : ''}">
    <button class="mi-tap" data-act="itemInfo" data-arg="${m.id}" aria-label="${T('Details for', 'تفاصيل')} ${esc(L(m.name))}">${foodTile(m.emoji)}</button>
    <div class="grow mi-body">
      <div class="row between"><b>${L(m.name)}</b><button class="icon-btn xs ${fav ? 'fav' : ''}" data-act="toggleFav" data-arg="${m.id}" aria-pressed="${fav}" aria-label="${T('Favourite', 'المفضلة')}">${icon('heart')}</button></div>
      <p>${L(m.desc)}</p>
      <div class="row gap wrap mi-tags">${m.diet.map((d) => pill(L(DIETS.find((x) => x.id === d).name))).join('')}${m.allergens.length ? pill(T('Contains', 'يحتوي') + ': ' + m.allergens.map((a) => L(ALLERGENS[a])).join(', '), 'muted') : ''}</div>
      <div class="row between mt-xs">
        <span class="price">${flash ? `<s>${sar(m.price)}</s> ` : ''}${sar(flash ? Math.round(m.price * (1 - S.flash.pct / 100)) : m.price)}</span>
        ${sold ? `<span class="row gap"><span class="pill pill-busy">${T('Sold out', 'نفد')}</span><button class="btn btn-ghost btn-sm" data-act="add${act}" data-arg="${alt.id}">${T('Try', 'جرّب')} ${alt.emoji} ${L(alt.name)}</button></span>` : stepper(m.id, qty, act)}
      </div>
    </div>
  </article>`;
}

function viewMenu() {
  ensureCartDest();
  const c = S.cart;
  const items = MENU.filter((m) => m.cat === S.menuCat && S.menuDiet.every((d) => m.diet.includes(d)));
  const last = S.orders[0];
  const overloaded = c.type === 'pickup' && zoneWarning(c.dest);
  const ph = S.match.phase;
  return `<section class="page">
    <div class="row between"><h1 class="title">${T('New order', 'طلب جديد')}</h1><button class="link" data-act="go" data-arg="group">${icon('users')} ${T('Group Order', 'طلب جماعي')}</button></div>
    <div class="seg seg-lg w-full" role="group" aria-label="${T('Order type', 'نوع الطلب')}">
      <button class="${c.type === 'pickup' ? 'on' : ''}" data-act="cartType" data-arg="pickup" aria-pressed="${c.type === 'pickup'}">${icon('store')} ${T('Pickup', 'استلام')}</button>
      <button class="${c.type === 'delivery' ? 'on' : ''}" data-act="cartType" data-arg="delivery" aria-pressed="${c.type === 'delivery'}">${icon('truck')} ${T('Seat delivery', 'توصيل للمقعد')}</button></div>
    <h2 class="h3 mt">${c.type === 'pickup' ? T('Pickup point', 'نقطة الاستلام') : T('Deliver to', 'التوصيل إلى')}</h2>
    ${live('dest', () => destPicker(c.type, c.dest))}
    ${live('zone-warn', () => (c.type === 'pickup' && zoneWarning(c.dest)) ? `<div class="notice warn mt-s">${icon('alert')}<span>${T(`${L(pickup(c.dest).name)} is near capacity.`, `${L(pickup(c.dest).name)} قريب من السعة القصوى.`)}</span><button class="btn btn-sm btn-primary" data-act="cartDest" data-arg="${bestPickup(c.dest).id}">${T('Switch to', 'انتقل إلى')} ${L(bestPickup(c.dest).name)}</button></div>` : '')}
    <div class="row gap wrap mt-s">
      <span class="muted">${T('When', 'متى')}:</span>
      <button class="chip ${c.schedule === 'now' ? 'on' : ''}" data-act="cartSchedule" data-arg="now">${T('As soon as possible', 'في أقرب وقت')}</button>
      ${ph !== 'halftime' && ph !== 'second' && ph !== 'final' ? `<button class="chip ${c.schedule === 'halftime' ? 'on' : ''}" data-act="cartSchedule" data-arg="halftime">${icon('clock')} ${isConcert() ? T('Ready at intermission', 'جاهز في الاستراحة') : T('Ready at halftime', 'جاهز في الاستراحة')}</button>` : ''}
    </div>

    ${ph === 'kickoff' && S.match.minute >= 30 ? `<div class="notice info mt">${icon('bell')}<span>${T('Halftime is close — schedule now and skip the rush.', 'الاستراحة قريبة — جدول طلبك الآن وتجنب الزحمة.')}</span></div>` : ''}

    <article class="combo mt">
      <span class="combo-img">🍔🍟🥤</span>
      <div class="grow"><small class="offer-tag">${T('Snack Combo of the Day', 'كومبو اليوم')}</small><b>${L(COMBO.desc)}</b>
        <span class="price">${sar(COMBO.price)} <s class="muted">${sar(COMBO.items.reduce((s, i) => s + item(i).price, 0))}</s></span></div>
      ${c.combo ? `<div class="stepper"><button class="icon-btn sm" data-act="comboRemove" aria-label="${T('Remove combo', 'إزالة الكومبو')}">${icon('minus')}</button><output>${c.combo}</output><button class="icon-btn sm primary" data-act="comboAdd" aria-label="${T('Add combo', 'إضافة كومبو')}">${icon('plus')}</button></div>` : `<button class="btn btn-primary btn-sm" data-act="comboAdd">${T('Add', 'أضف')}</button>`}
    </article>

    ${live('flash-menu', () => (S.flash ? flashCard(S.flash) : ''))}
    ${live('menu-offers', () => liveOffersForFan().slice(0, 1).map((o) => offerCard(o)).join(''))}

    ${last ? `<div class="quick mt"><span class="muted">${T('Quick reorder', 'إعادة طلب سريعة')}</span><button class="chip" data-act="reorder" data-arg="${last.id}">${icon('refresh')} ${last.items.map((i) => item(i.id).emoji).join('')} ${sar(last.total)}</button>
      ${S.favorites.map((f) => `<button class="chip" data-act="addItem" data-arg="${f}">${icon('heart')} ${item(f).emoji} ${L(item(f).name)}</button>`).join('')}</div>` : S.favorites.length ? `<div class="quick mt"><span class="muted">${T('Favourites', 'المفضلة')}</span>${S.favorites.map((f) => `<button class="chip" data-act="addItem" data-arg="${f}">${item(f).emoji} ${L(item(f).name)}</button>`).join('')}</div>` : ''}

    <div class="tabs mt" role="tablist">${MENU_CATS.map((cat) => `<button role="tab" aria-selected="${S.menuCat === cat.id}" class="tab ${S.menuCat === cat.id ? 'on' : ''}" data-act="menuCat" data-arg="${cat.id}">${cat.emoji} ${L(cat.name)}</button>`).join('')}</div>
    <div class="row gap wrap mt-s" aria-label="${T('Dietary filters', 'فلاتر غذائية')}">${DIETS.map((d) => `<button class="chip ${S.menuDiet.includes(d.id) ? 'on' : ''}" data-act="menuDiet" data-arg="${d.id}" aria-pressed="${S.menuDiet.includes(d.id)}">${L(d.name)}</button>`).join('')}</div>
    <div class="menu-list mt-s">${items.length ? items.map((m) => menuItemRow(m)).join('') : `<div class="empty">${foodTile('🔍')}<b>${T('No items match these filters', 'لا توجد أصناف مطابقة')}</b><button class="btn btn-ghost btn-sm" data-act="clearDiet">${T('Clear filters', 'مسح الفلاتر')}</button></div>`}</div>
    <div class="cart-spacer"></div>
    ${cartBar()}
  </section>`;
}

function cartBar() {
  const n = cartCount();
  if (!n) return '';
  return `<div class="cart-bar"><div class="cart-bar-in">
    <span class="cart-n">${n}</span><span class="grow"><b>${sar(cartTotal())}</b><small>${S.cart.type === 'delivery' ? T('Seat delivery', 'توصيل للمقعد') : L(pickup(S.cart.dest)?.name)}</small></span>
    <button class="btn btn-orange" data-act="go" data-arg="summary">${T('Review order', 'مراجعة الطلب')} ${icon('chevron', 'flip')}</button></div></div>`;
}

function itemInfoSheet(id) {
  const m = item(id);
  const sold = S.soldOut.includes(id);
  return `<div class="item-hero">${foodTile(m.emoji, 'xl')}</div>
    <h2 class="sheet-title">${L(m.name)}</h2>
    <p class="muted">${L(m.desc)}</p>
    <div class="kv"><span>${T('Price', 'السعر')}</span><b>${sar(m.price)}</b></div>
    <div class="kv"><span>${T('Availability', 'التوفر')}</span><b class="${sold ? 'lvl-busy' : 'lvl-calm'}">${sold ? T('Sold out', 'نفد') : T('Available', 'متوفر')}</b></div>
    <div class="kv"><span>${T('Prep time', 'وقت التحضير')}</span><b>~${mins(m.prep)}</b></div>
    <h3 class="h3 mt">${T('Ingredients', 'المكونات')}</h3><p>${L(m.ing)}</p>
    <h3 class="h3 mt">${T('Allergens', 'مسببات الحساسية')}</h3>
    <p>${m.allergens.length ? m.allergens.map((a) => pill(L(ALLERGENS[a]), 'warn')).join(' ') : T('No major allergens', 'لا توجد مسببات حساسية رئيسية')}</p>
    <div class="row between mt">${sold ? `<button class="btn btn-primary grow" data-act="addItem" data-arg="${ALTERNATIVES[id]}">${T('Add alternative', 'أضف البديل')}: ${L(item(ALTERNATIVES[id]).name)}</button>` : `${stepper(id, S.cart.items[id] || 0)}<button class="btn btn-primary" data-act="closeSheet">${T('Done', 'تم')}</button>`}</div>`;
}

/* ---------- summary ---------- */
function viewSummary() {
  ensureCartDest();
  const c = S.cart;
  const n = cartCount();
  if (!n) return `<section class="page narrow"><h1 class="title">${T('Order summary', 'ملخص الطلب')}</h1>
    <div class="empty card">${foodTile('🛍️', 'xl')}<b>${T('Your order is empty', 'طلبك فارغ')}</b><p class="muted">${T('Add something tasty from the menu.', 'أضف شيئاً لذيذاً من القائمة.')}</p><button class="btn btn-primary" data-act="go" data-arg="menu">${T('Browse menu', 'تصفح القائمة')}</button></div></section>`;
  const items = cartItemsList();
  const preview = { items, type: c.type, dest: c.dest, status: 0, handoff: 0, tasks: routeItems(items, c.type === 'delivery' ? SECTIONS[c.dest].angle : pickup(c.dest).angle) };
  const eta = estimate(preview) + (c.type === 'delivery' ? 0 : 0);
  const voucher = S.vouchers.find((v) => items.some((i) => i.id === v.item)) || S.vouchers[0];
  const voucherApplies = voucher && items.some((i) => i.id === voucher.item);
  const subtotal = cartTotal();
  const fee = c.type === 'delivery' ? 5 : 0;
  const discount = voucherApplies ? Math.round(item(voucher.item).price * (voucher.pct ?? 100)) / 100 : 0;
  return `<section class="page narrow">
    <button class="link" data-act="go" data-arg="menu">${icon('back', 'flip')} ${T('Back to menu', 'العودة للقائمة')}</button>
    <h1 class="title">${T('Order summary', 'ملخص الطلب')}</h1>
    <div class="card">
      ${c.combo ? `<div class="sum-row">${foodTile('🍔')}<div class="grow"><b>${L(COMBO.name)}</b><small>${L(COMBO.desc)}</small></div><div class="stepper"><button class="icon-btn sm" data-act="comboRemove" aria-label="${T('Remove combo', 'إزالة الكومبو')}">${icon('minus')}</button><output>${c.combo}</output><button class="icon-btn sm primary" data-act="comboAdd" aria-label="${T('Add combo', 'إضافة كومبو')}">${icon('plus')}</button></div><b class="price">${sar(COMBO.price * c.combo)}</b></div>` : ''}
      ${Object.entries(c.items).map(([id, q]) => `<div class="sum-row ${S.soldOut.includes(id) ? 'sold' : ''}">${foodTile(item(id).emoji)}<div class="grow"><b>${L(item(id).name)}</b><small>${sar(item(id).price)} ${T('each', 'للواحد')}</small>
        ${S.soldOut.includes(id) ? `<div class="notice warn mt-xs">${icon('alert')}<span>${T('Sold out.', 'نفد.')}</span><button class="btn btn-sm btn-primary" data-act="swapItem" data-arg="${id}">${T('Swap for', 'استبدل بـ')} ${L(item(ALTERNATIVES[id]).name)}</button></div>` : ''}</div>
        ${stepper(id, q)}<b class="price">${sar(item(id).price * q)}</b></div>`).join('')}
    </div>
    <div class="card mt">
      <h2 class="h3">${T('Order type', 'نوع الطلب')}</h2>
      <div class="seg w-full"><button class="${c.type === 'pickup' ? 'on' : ''}" data-act="cartType" data-arg="pickup">${T('Pickup', 'استلام')}</button><button class="${c.type === 'delivery' ? 'on' : ''}" data-act="cartType" data-arg="delivery">${T('Seat delivery', 'توصيل للمقعد')}</button></div>
      <h2 class="h3 mt">${c.type === 'pickup' ? T('Pickup point', 'نقطة الاستلام') : T('Destination', 'الوجهة')}</h2>
      ${destPicker(c.type, c.dest)}
      ${c.type === 'pickup' && zoneWarning(c.dest) ? `<div class="notice warn mt-s">${icon('alert')}<span>${T('Near capacity — try', 'قريب من السعة — جرّب')} ${L(bestPickup(c.dest).name)}</span><button class="btn btn-sm btn-primary" data-act="cartDest" data-arg="${bestPickup(c.dest).id}">${T('Switch', 'تغيير')}</button></div>` : ''}
      <div class="kv mt"><span>${T('Timing', 'التوقيت')}</span><b>${c.schedule === 'halftime' ? T('Ready at halftime', 'جاهز في الاستراحة') : T('As soon as possible', 'في أقرب وقت')}</b></div>
    </div>
    <div class="card mt">
      <div class="kv"><span>${T('Subtotal', 'المجموع الفرعي')}</span><b>${sar(subtotal)}</b></div>
      ${fee ? `<div class="kv"><span>${T('Seat delivery fee', 'رسوم التوصيل')}</span><b>${sar(fee)}</b></div>` : ''}
      ${voucherApplies ? `<div class="kv ok"><span>🎁 ${L(voucher.label)}</span><b>−${sar(discount)}</b></div>` : voucher ? `<div class="notice info mt-xs">🎁 <span>${L(voucher.label)} — ${T('add the item to use it.', 'أضف الصنف لاستخدامه.')}</span><button class="btn btn-sm btn-ghost" data-act="addItem" data-arg="${voucher.item}">${T('Add', 'أضف')}</button></div>` : ''}
      <div class="kv total"><span>${T('Total', 'الإجمالي')}</span><b>${sar(subtotal + fee - discount)}</b></div>
      <div class="kv"><span>${icon('clock')} ${T('Estimated wait', 'الانتظار المتوقع')}</span><b>${c.schedule === 'halftime' ? T('At halftime', 'في الاستراحة') : '~' + mins(eta)}</b></div>
      <div class="kv"><span>${icon('store')} ${T('Prepared by', 'يحضّره')}</span><b>${preview.tasks.length} ${T(preview.tasks.length > 1 ? 'kitchens · one handoff' : 'kitchen', preview.tasks.length > 1 ? 'مطابخ · تسليم واحد' : 'مطبخ')}</b></div>
      <p class="muted small">${T('Demo payment — nothing will be charged. Pay at handoff.', 'دفع تجريبي — لن يتم خصم أي مبلغ.')}</p>
      <button class="btn btn-orange btn-lg w-full" data-act="placeOrder">${T('Confirm order', 'تأكيد الطلب')} · ${sar(subtotal + fee - discount)}</button>
    </div>
  </section>`;
}

function cartItemsList() {
  const c = S.cart;
  const items = Object.entries(c.items).filter(([id]) => !S.soldOut.includes(id)).map(([id, qty]) => ({ id, qty, by: 'me' }));
  if (c.combo) {
    COMBO.items.forEach((id) => {
      const price = Math.round((COMBO.price / COMBO.items.length) * 100) / 100;
      items.push({ id, qty: c.combo, by: 'me', price, combo: true });
    });
  }
  return items;
}

/* ---------- tracking ---------- */
function viewTrack(id) {
  const o = S.orders.find((x) => x.id === id) || S.orders[0];
  if (!o) return `<section class="page narrow"><div class="empty card">${foodTile('🧾', 'xl')}<b>${T('Order not found', 'الطلب غير موجود')}</b><button class="btn btn-primary" data-act="go" data-arg="orders">${T('View orders', 'عرض الطلبات')}</button></div></section>`;
  return `<section class="page">
    <button class="link" data-act="go" data-arg="orders">${icon('back', 'flip')} ${T('Orders', 'الطلبات')}</button>
    <div class="row between"><h1 class="title">${T('Order', 'الطلب')} ${o.id}</h1>${pill(o.type === 'delivery' ? T('Seat delivery', 'توصيل') : T('Pickup', 'استلام'), 'brand')}</div>
    <div class="map-layout">
      <div>
        ${live('track-main', () => trackCard(o))}
        <div class="card mt">${stadiumMap({ id: 'track-map', compact: true })}</div>
      </div>
      <div class="map-side">
        ${live('track-handoff', () => handoffCard(o))}
        <div class="card">
          <h2 class="h3">${T('Items', 'الأصناف')}</h2>
          ${o.items.filter((i) => !i.combo).map((i) => `<div class="kv"><span>${item(i.id).emoji} ${i.qty}× ${L(item(i.id).name)}${i.by && i.by !== 'me' ? ` <small class="muted">· ${esc(i.by)}</small>` : ''}</span><b>${sar((i.price ?? item(i.id).price) * i.qty)}</b></div>`).join('')}
          ${o.items.some((i) => i.combo) ? `<div class="kv"><span>🍔🍟🥤 ${o.items.find((i) => i.combo).qty}× ${L(COMBO.name)}</span><b>${sar(COMBO.price * o.items.find((i) => i.combo).qty)}</b></div>` : ''}
          ${o.type === 'delivery' ? `<div class="kv"><span>${T('Seat delivery fee', 'رسوم التوصيل')}</span><b>${sar(5)}</b></div>` : ''}
          ${o.discount ? `<div class="kv ok"><span>🎁 ${T('Reward', 'مكافأة')}</span><b>−${sar(o.discount)}</b></div>` : ''}
          <div class="kv total"><span>${T('Total', 'الإجمالي')}</span><b>${sar(o.total)}</b></div>
        </div>
        <button class="btn btn-ghost w-full" data-act="orderHelp" data-arg="${o.id}">${icon('help')} ${T('Get help with this order', 'مساعدة بخصوص الطلب')}</button>
      </div>
    </div>
  </section>`;
}

function trackCard(o) {
  const labels = statusLabels(o);
  const eta = estimate(o);
  const waitingHT = o.schedule === 'halftime' && o.status === 0 && !['halftime', 'second', 'final'].includes(S.match.phase) && !(S.match.phase === 'kickoff' && S.match.minute >= 38);
  return `<div class="card track-card">
    <div class="row between">
      <div><small class="muted">${o.status >= 3 ? T('Delivered', 'تم التسليم') : T('Estimated', 'المتوقع')}</small>
        <div class="eta">${o.status >= 3 ? '✓' : waitingHT ? T('Halftime', 'الاستراحة') : '~' + mins(eta)}</div></div>
      <span class="status-pill st-${o.status}">${labels[o.status]}</span>
    </div>
    ${o.issue?.kind === 'soldout' && o.status < 2 ? `<div class="notice warn mt-s">${icon('alert')}<span>${T(`${L(item(o.issue.item).name)} sold out at the kitchen.`, `نفد ${L(item(o.issue.item).name)} في المطبخ.`)}</span><button class="btn btn-sm btn-primary" data-act="acceptAlt" data-arg="${o.id}">${T('Swap for', 'استبدل بـ')} ${L(item(ALTERNATIVES[o.issue.item]).name)}</button></div>` : ''}
    ${waitingHT ? `<div class="notice info mt-s">${icon('clock')}<span>${T('Scheduled — kitchens start preparing just before halftime.', 'مجدول — يبدأ التحضير قبل الاستراحة بقليل.')}</span></div>` : ''}
    <ol class="track-steps">${labels.map((l, i) => `<li class="${i < o.status ? 'done' : i === o.status ? 'now' : ''}"><i>${i < o.status ? icon('check') : ''}</i><span>${l}</span></li>`).join('')}</ol>
    <div class="vendor-split">
      <small class="muted">${o.tasks.length > 1 ? T(`Prepared by ${o.tasks.length} kitchens, handed over together`, `يُحضَّر في ${o.tasks.length} مطابخ ويُسلَّم معاً`) : T('Prepared by', 'يحضّره')}</small>
      ${o.tasks.map((t) => `<span class="vs-chip ${t.st >= 2 ? 'ok' : ''}">${vendor(t.vid).emoji} ${L(vendor(t.vid).name)} ${t.st >= 2 ? '✓' : ''}</span>`).join('')}
    </div>
  </div>`;
}

function handoffCard(o) {
  if (o.status >= 3) {
    return `<div class="card handoff done"><h2 class="h3">${icon('check')} ${T('Enjoy your order!', 'بالعافية!')}</h2><p class="muted">${T('Points have been added to your profile.', 'تمت إضافة النقاط إلى ملفك.')}</p>
      <div class="row gap"><button class="btn btn-primary grow" data-act="reorder" data-arg="${o.id}">${icon('refresh')} ${T('Order again', 'اطلب مجدداً')}</button><button class="btn btn-ghost grow" data-act="go" data-arg="play">${T('Play & earn', 'العب واربح')}</button></div></div>`;
  }
  if (o.type === 'pickup') {
    const p = pickup(o.dest);
    return `<div class="card handoff">
      <h2 class="h3">${icon('store')} ${T('Pickup handoff', 'تعليمات الاستلام')}</h2>
      <div class="code-box"><small>${T('Show this code', 'أظهر هذا الرمز')}</small><b>${o.code}</b></div>
      <ol class="directions"><li>${T(`Go to ${L(p.name)} (${mins(walkMins(planRoute(SECTIONS[S.setup.section].angle, p.angle).len))} walk)`, `اذهب إلى ${L(p.name)} (${mins(walkMins(planRoute(SECTIONS[S.setup.section].angle, p.angle).len))} مشياً)`)}</li>
        <li>${T('Use the GolBite express lane', 'استخدم مسار GolBite السريع')}</li><li>${T('Show your code — everything is bagged together', 'أظهر الرمز — كل شيء في كيس واحد')}</li></ol>
      ${zoneWarning(o.dest) && o.status < 2 ? `<div class="notice warn">${icon('alert')}<span>${T('This pickup is busy.', 'نقطة الاستلام مزدحمة.')}</span><button class="btn btn-sm btn-primary" data-act="movePickup" data-arg="${o.id}">${T('Move to', 'انقل إلى')} ${L(bestPickup(o.dest).name)}</button></div>` : ''}
      ${o.status === 2 ? `<button class="btn btn-orange w-full" data-act="collected" data-arg="${o.id}">${icon('check')} ${T("I've collected it", 'استلمت الطلب')}</button>` : ''}
    </div>`;
  }
  return `<div class="card handoff">
    <h2 class="h3">${icon('truck')} ${T('Seat delivery', 'التوصيل للمقعد')}</h2>
    <div class="kv"><span>${T('Runner', 'المندوب')}</span><b>${o.runner}</b></div>
    <div class="kv"><span>${T('Destination', 'الوجهة')}</span><b>${o.dest === S.setup.section ? seatLabel() : T('Section', 'القسم') + ' ' + o.dest}</b></div>
    <p class="muted small">${T('Stay in your seat and keep your phone handy. Your runner will call out your order number.', 'ابقَ في مقعدك واحتفظ بجوالك قريباً. سينادي المندوب رقم طلبك.')}</p>
  </div>`;
}

function orderHelpSheet(id) {
  const o = S.orders.find((x) => x.id === id);
  return `<h2 class="sheet-title">${T('Order help', 'مساعدة الطلب')} · ${o.id}</h2>
    <p class="muted">${T('What went wrong? We will fix it right away.', 'ما المشكلة؟ سنعالجها فوراً.')}</p>
    <div class="list">
      <button class="choice" data-act="helpResolve" data-arg="${id}:delayed">${foodTile('⏱️')}<span class="grow"><b>${T('My order is delayed', 'طلبي متأخر')}</b><small>${T('We will prioritise it and add 50 points.', 'سنعطيه أولوية ونضيف 50 نقطة.')}</small></span></button>
      <button class="choice" data-act="helpResolve" data-arg="${id}:missing">${foodTile('❓')}<span class="grow"><b>${T('Something is missing', 'صنف ناقص')}</b><small>${T('We will send the missing item at no cost.', 'سنرسل الصنف الناقص مجاناً.')}</small></span></button>
      <button class="choice" data-act="helpResolve" data-arg="${id}:wrong">${foodTile('🔄')}<span class="grow"><b>${T('Incorrect item', 'صنف خاطئ')}</b><small>${T('We will replace it with priority.', 'سنستبدله بأولوية.')}</small></span></button>
    </div>`;
}

/* ---------- history ---------- */
function viewOrders() {
  const act = S.orders.filter((o) => o.status < 3);
  const past = S.orders.filter((o) => o.status >= 3);
  if (!S.orders.length) {
    return `<section class="page narrow"><h1 class="title">${T('Orders', 'الطلبات')}</h1>
      <div class="empty card">${foodTile('🧾', 'xl')}<b>${T('No orders yet', 'لا توجد طلبات بعد')}</b><p class="muted">${T('Your matchday orders will appear here — skip the queue with pickup or seat delivery.', 'ستظهر طلباتك هنا — تجاوز الطابور بالاستلام أو التوصيل للمقعد.')}</p>
      <div class="row gap center"><button class="btn btn-primary" data-act="go" data-arg="menu">${T('Start an order', 'ابدأ طلباً')}</button><button class="btn btn-ghost" data-act="go" data-arg="group">${T('Group Order', 'طلب جماعي')}</button></div></div></section>`;
  }
  const row = (o) => `<button class="order-row" data-act="go" data-arg="track/${o.id}">
    <span class="or-emoji">${o.items.slice(0, 3).map((i) => item(i.id).emoji).join('')}</span>
    <span class="grow"><b>${o.id}${o.group ? ' · ' + T('Group', 'جماعي') : ''}</b><small>${o.items.reduce((s, i) => s + i.qty, 0)} ${T('items', 'أصناف')} · ${o.type === 'delivery' ? T('Delivery', 'توصيل') : L(pickup(o.dest)?.name)} · ${new Date(o.created).toLocaleTimeString(S.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</small></span>
    <span class="or-side"><b>${sar(o.total)}</b><span class="status-pill sm st-${o.status}">${statusLabels(o)[o.status]}</span></span></button>`;
  return `<section class="page narrow">
    <div class="row between"><h1 class="title">${T('Orders', 'الطلبات')}</h1><button class="btn btn-primary btn-sm" data-act="go" data-arg="menu">${icon('plus')} ${T('New', 'جديد')}</button></div>
    ${live('orders-active', () => act.length ? `<h2 class="h3">${T('Active', 'النشطة')}</h2><div class="list">${S.orders.filter((o) => o.status < 3).map(row).join('')}</div>` : '')}
    ${past.length ? `<h2 class="h3 mt">${T('History', 'السجل')}</h2><div class="list">${past.map((o) => `<div class="order-wrap">${row(o)}<button class="btn btn-ghost btn-sm reorder-btn" data-act="reorder" data-arg="${o.id}">${icon('refresh')} ${T('Reorder', 'أعد الطلب')}</button></div>`).join('')}</div>` : ''}
  </section>`;
}

/* ---------- Group Order ---------- */
function viewGroup() {
  const g = S.group;
  if (!g) {
    return `<section class="page narrow">
      <h1 class="title">${T('Group Order', 'طلب جماعي')}</h1>
      <div class="feature-hero card">${foodTile('👥', 'xl')}<div><b>${T('Order together, collect once', 'اطلبوا معاً واستلموا مرة واحدة')}</b><p class="muted">${T('Everyone adds their own items. One pickup or seat delivery, one confirmation.', 'كل شخص يضيف أصنافه. استلام أو توصيل واحد وتأكيد واحد.')}</p></div></div>
      <div class="card mt"><h2 class="h3">${T('Start a group', 'ابدأ مجموعة')}</h2>
        <p class="muted small">${T('You become the group leader and confirm the final order.', 'ستكون قائد المجموعة وتؤكد الطلب النهائي.')}</p>
        <button class="btn btn-primary w-full" data-act="groupCreate">${icon('plus')} ${T('Create Group Order', 'إنشاء طلب جماعي')}</button></div>
      <form class="card mt" data-submit="groupJoin"><h2 class="h3">${T('Join with a code', 'انضم برمز')}</h2>
        <label class="field"><span>${T('Join code', 'رمز الانضمام')}</span><input name="code" maxlength="8" placeholder="GB-4F2K" autocomplete="off" style="text-transform:uppercase"/></label>
        <button class="btn btn-ghost w-full" type="submit">${T('Join group', 'انضم للمجموعة')}</button></form>
    </section>`;
  }
  const leader = g.leader === g.me;
  const total = orderTotal(g.items);
  const byPerson = g.members.map((mname) => ({ name: mname, sum: orderTotal(g.items.filter((i) => i.by === mname)), n: g.items.filter((i) => i.by === mname).reduce((s, i) => s + i.qty, 0) }));
  const mine = {};
  g.items.filter((i) => i.by === g.me).forEach((i) => (mine[i.id] = (mine[i.id] || 0) + i.qty));
  return `<section class="page">
    <div class="row between"><h1 class="title">${T('Group Order', 'طلب جماعي')}</h1><button class="link danger" data-act="groupLeave">${T(leader ? 'Cancel group' : 'Leave group', leader ? 'إلغاء المجموعة' : 'مغادرة المجموعة')}</button></div>
    <div class="map-layout">
      <div>
        <div class="card code-share">
          <div><small class="muted">${T('Share this join code', 'شارك رمز الانضمام')}</small><b class="join-code">${g.code}</b></div>
          <button class="btn btn-ghost btn-sm" data-act="copyCode">${icon('copy')} ${T('Copy', 'نسخ')}</button>
        </div>
        <div class="card mt">
          <div class="row between"><h2 class="h3">${T('Members', 'الأعضاء')} (${g.members.length})</h2>${leader && g.members.length < 4 ? `<button class="btn btn-ghost btn-sm" data-act="groupInvite">${icon('plus')} ${T('Simulate friends joining', 'محاكاة انضمام الأصدقاء')}</button>` : ''}</div>
          ${live('group-members', () => `<ul class="members">${S.group ? S.group.members.map((mname) => { const b = { sum: orderTotal(S.group.items.filter((i) => i.by === mname)), n: S.group.items.filter((i) => i.by === mname).reduce((s, i) => s + i.qty, 0) }; return `<li><span class="avatar">${esc(mname[0])}</span><span class="grow"><b>${esc(mname)}${mname === S.group.leader ? ' · ' + T('Leader', 'القائد') : ''}${mname === S.group.me ? ' (' + T('you', 'أنت') + ')' : ''}</b><small>${b.n} ${T('items', 'أصناف')}</small></span><b>${sar(b.sum)}</b></li>`; }).join('') : ''}</ul>`)}
        </div>
        <div class="card mt">
          <h2 class="h3">${T('Add your items', 'أضف أصنافك')}</h2>
          <div class="tabs" role="tablist">${MENU_CATS.map((cat) => `<button role="tab" aria-selected="${S.menuCat === cat.id}" class="tab ${S.menuCat === cat.id ? 'on' : ''}" data-act="menuCat" data-arg="${cat.id}">${cat.emoji} ${L(cat.name)}</button>`).join('')}</div>
          <div class="menu-list mt-s">${MENU.filter((m) => m.cat === S.menuCat).map((m) => menuItemRow(m, mine, 'Group')).join('')}</div>
        </div>
      </div>
      <div class="map-side">
        ${live('group-items', () => { const gg = S.group; if (!gg) return ''; return `<div class="card"><h2 class="h3">${T('Group basket', 'سلة المجموعة')}</h2>
          ${gg.items.length ? gg.items.map((i) => `<div class="kv"><span>${item(i.id).emoji} ${i.qty}× ${L(item(i.id).name)} <small class="muted">· ${esc(i.by)}</small></span><b>${sar(item(i.id).price * i.qty)}</b></div>`).join('') : `<p class="muted">${T('No items yet — be the first to add.', 'لا توجد أصناف بعد — كن أول من يضيف.')}</p>`}
          <div class="kv total"><span>${T('Running total', 'الإجمالي الحالي')}</span><b>${sar(orderTotal(gg.items))}</b></div></div>`; })}
        <div class="card">
          <h2 class="h3">${T('Where should we get it?', 'أين نستلم؟')}</h2>
          <div class="seg w-full"><button class="${g.type === 'pickup' ? 'on' : ''}" data-act="groupType" data-arg="pickup" ${leader ? '' : 'disabled'}>${T('Pickup', 'استلام')}</button><button class="${g.type === 'delivery' ? 'on' : ''}" data-act="groupType" data-arg="delivery" ${leader ? '' : 'disabled'}>${T('Seat delivery', 'توصيل')}</button></div>
          <div class="mt-s ${leader ? '' : 'disabled-area'}">${destPicker(g.type, g.dest, 'group')}</div>
          ${leader ? `<button class="btn btn-orange btn-lg w-full mt" data-act="groupConfirm" ${g.items.length ? '' : 'disabled'}>${T('Review & confirm group order', 'مراجعة وتأكيد الطلب الجماعي')} · ${sar(total)}</button>`
            : `<div class="notice info mt">${icon('clock')}<span>${T(`Waiting for ${g.leader} to confirm.`, `بانتظار تأكيد ${g.leader}.`)}</span></div><button class="btn btn-ghost w-full mt-s" data-act="groupLeaderConfirm" ${g.items.length ? '' : 'disabled'}>${T('Simulate leader confirming', 'محاكاة تأكيد القائد')}</button>`}
        </div>
      </div>
    </div>
  </section>`;
}

function groupConfirmSheet() {
  const g = S.group;
  const by = {};
  g.items.forEach((i) => (by[i.by] = (by[i.by] || 0) + item(i.id).price * i.qty));
  return `<h2 class="sheet-title">${T('Confirm group order', 'تأكيد الطلب الجماعي')}</h2>
    ${Object.entries(by).map(([n, s]) => `<div class="kv"><span>${esc(n)}</span><b>${sar(s)}</b></div>`).join('')}
    <div class="kv"><span>${g.type === 'pickup' ? T('Pickup', 'الاستلام') : T('Delivery', 'التوصيل')}</span><b>${g.type === 'pickup' ? L(pickup(g.dest).name) : T('Section', 'القسم') + ' ' + g.dest}</b></div>
    <div class="kv total"><span>${T('Total', 'الإجمالي')}</span><b>${sar(orderTotal(g.items))}</b></div>
    <button class="btn btn-orange btn-lg w-full mt" data-act="groupPlace" autofocus>${T('Place group order', 'تنفيذ الطلب الجماعي')}</button>`;
}
