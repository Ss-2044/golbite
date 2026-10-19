/* GolBite — ordering: menu (food + club merchandise), item options, summary, tracking, history, help, Group Order. */

function destPicker(type, dest, actPrefix = 'cart') {
  if (type === 'delivery') {
    return `<div class="dest-row">${Object.keys(SECTIONS).map((k) => `<button class="dest ${dest === k ? 'on' : ''}" data-act="${actPrefix}Dest" data-arg="${k}" aria-pressed="${dest === k}">
      <b>${T('Section', 'القسم')} ${k}</b><small>${k === S.setup.section ? T('Your seat', 'مقعدك') + ' ' + seatLabel() : levelWord(S.crowd[k])}</small></button>`).join('')}</div>`;
  }
  return `<div class="dest-row">${PICKUPS.map((p) => { const l = pickupLoad(p.id); return `<button class="dest ${dest === p.id ? 'on' : ''}" data-act="${actPrefix}Dest" data-arg="${p.id}" aria-pressed="${dest === p.id}">
    <b>${L(p.name)}</b><small><i class="dot lvl-bg-${levelKind(l)}"></i> ${levelWord(l)} · ${mins(pickupWait(p.id))}</small></button>`; }).join('')}</div>`;
}

function ensureCartDest() {
  const c = S.cart;
  if (c.type === 'delivery' && !SECTIONS[c.dest]) c.dest = S.setup.section;
  if (c.type === 'pickup' && !pickup(c.dest)) c.dest = bestPickup().id;
}

function destText() {
  const c = S.cart;
  const where = c.type === 'delivery' ? (c.dest === S.setup.section ? T('Seat', 'المقعد') + ' ' + seatLabel() : T('Section', 'القسم') + ' ' + c.dest) : L(pickup(c.dest).name);
  const when = c.schedule === 'halftime' ? T('Ready at halftime', 'جاهز في الاستراحة') : T('As soon as possible', 'في أقرب وقت');
  return { where, when };
}

/* Stepper for a cart line. `key` is a cart key ("id" or "id~option"). */
function stepper(key, qty, act = 'Line') {
  const { id } = pkey(key);
  const m = item(id);
  return `<div class="stepper" role="group" aria-label="${esc(L(m.name))}">
    <button class="icon-btn sm" data-act="remove${act}" data-arg="${key}" aria-label="${T('Remove one', 'إزالة واحد')} ${esc(L(m.name))}" ${qty ? '' : 'disabled'}>${icon('minus')}</button>
    <output aria-live="polite">${qty}</output>
    <button class="icon-btn sm primary" data-act="add${act}" data-arg="${key}" aria-label="${T('Add one', 'إضافة واحد')} ${esc(L(m.name))}">${icon('plus')}</button></div>`;
}

function availability(m) {
  const st = S.stock[m.id];
  if (S.soldOut.includes(m.id) || st === 0) return `<span class="avail out">${T('Sold out', 'نفد')}</span>`;
  if (!itemAvailable(m.id)) return `<span class="avail out">${t('svc.paused')}</span>`;
  if (st != null && st < 15) return `<span class="avail low">${T(`Only ${st} left`, `باقي ${st} فقط`)}</span>`;
  return `<span class="avail ok">${T('Available', 'متوفر')}</span>`;
}

function menuItemRow(m, qtyFn = cartQty, act = 'Item') {
  const sold = !itemAvailable(m.id) || (act === 'Item' && !orderingStatus().open);
  const qty = qtyFn(m.id);
  const fav = S.favorites.includes(m.id);
  const alt = item(ALTERNATIVES[m.id]);
  const flash = S.flash?.item === m.id;
  const price = flash ? Math.round(m.price * (1 - S.flash.pct / 100)) : m.price;
  const addBtn = `<button class="btn btn-primary btn-sm" data-act="itemInfo" data-arg="${m.id}">${icon('plus')} ${T('Add', 'أضف')}</button>`;
  return `<article class="mrow ${sold ? 'sold' : ''} ${qty ? 'in' : ''}">
    <button class="mrow-media" data-act="itemInfo" data-arg="${m.id}" aria-label="${T('Details for', 'تفاصيل')} ${esc(L(m.name))}">${media(m)}</button>
    <div class="mrow-body">
      <div class="row between gap"><button class="mrow-name" data-act="itemInfo" data-arg="${m.id}">${L(m.name)}</button>
        <button class="icon-btn xs ${fav ? 'fav' : ''}" data-act="toggleFav" data-arg="${m.id}" aria-pressed="${fav}" aria-label="${T('Favourite', 'المفضلة')}">${icon('heart')}</button></div>
      <p class="mrow-desc">${L(m.desc)}</p>
      <div class="mrow-meta">${availability(m)}${m.cat !== 'merch' ? `<span class="muted xs">${icon('clock')} ~${mins(m.prep)}</span>` : ''}${m.opts ? `<span class="muted xs">${L(OPTION_SETS[m.opts].label)}</span>` : ''}</div>
      ${m.allergens.length ? `<p class="allergen-line"><b>${T('Allergens', 'مسببات الحساسية')}:</b> ${m.allergens.map((a) => L(ALLERGENS[a])).join('، ')}</p>` : ''}
      <div class="row between mt-xs">
        <span class="price">${flash ? `<s>${sar(m.price)}</s> ` : ''}${sar(price)}</span>
        ${sold ? (alt && itemAvailable(alt.id) && orderingStatus().open ? `<button class="btn btn-ghost btn-sm" data-act="add${act}" data-arg="${alt.id}">${T('Try', 'جرّب')} ${L(alt.name)}</button>` : `<span class="muted xs">${T('Not available', 'غير متاح')}</span>`)
          : m.opts && act === 'Item' ? (qty ? `<span class="row gap-xs"><span class="qty-badge">${qty}×</span>${addBtn}</span>` : addBtn)
          : stepper(m.id, qty, act)}
      </div>
    </div>
  </article>`;
}

function viewMenu() {
  ensureCartDest();
  const c = S.cart;
  const isMerch = S.menuCat === 'merch';
  const q = (MENUQ || '').trim().toLowerCase();
  const items = CATALOG.filter((m) => (q ? true : m.cat === S.menuCat) && (!q || [m.name.en, m.name.ar, m.desc.en, m.desc.ar].join(' ').toLowerCase().includes(q))
    && (m.cat !== 'merch' || !m.special || S.unlocked.includes(m.id) || (m.special === 'halftime' && S.match.phase === 'halftime'))
    && (m.cat === 'merch' || (S.menuDiet.every((d) => m.diet.includes(d)) && (S.menuAvoid || []).every((a) => !m.allergens.includes(a)))));
  const os = orderingStatus();
  const last = S.orders[0];
  const { where, when } = destText();
  return `<section class="page menu-page">
    <div class="page-head"><h1 class="title">${T('New order', 'طلب جديد')}</h1><button class="link" data-act="go" data-arg="group">${icon('users')} ${T('Group order', 'طلب جماعي')}</button></div>

    ${!os.open ? `<div class="notice warn" role="status">${icon('lock')}<span>${os.reason} ${T('You can still browse the menu.', 'يمكنك تصفح القائمة.')}</span></div>` : ''}
    <label class="search"><span class="sr-only">${T('Search the menu', 'ابحث في القائمة')}</span>${icon('search')}<input type="search" data-input="menuQ" value="${esc(MENUQ || '')}" placeholder="${T('Search the menu', 'ابحث في القائمة')}" autocomplete="off"/></label>
    <div class="fulfil panel">
      <div class="seg seg-lg w-full" role="group" aria-label="${T('Order type', 'نوع الطلب')}">
        <button class="${c.type === 'pickup' ? 'on' : ''}" data-act="cartType" data-arg="pickup" aria-pressed="${c.type === 'pickup'}">${icon('store')} ${T('Pickup', 'استلام')}</button>
        <button class="${c.type === 'delivery' ? 'on' : ''}" data-act="cartType" data-arg="delivery" aria-pressed="${c.type === 'delivery'}" ${S.venueCfg.fulfillment.delivery ? '' : 'disabled'}>${icon('truck')} ${T('Seat delivery', 'توصيل للمقعد')}</button></div>
      ${!S.venueCfg.fulfillment.delivery ? `<small class="muted">${T('Seat delivery is not offered at this event.', 'التوصيل للمقعد غير متاح في هذه الفعالية.')}</small>` : c.type === 'delivery' && !deliveryAllowed(c.dest) ? `<small class="lvl-busy">${T(`Seat delivery is paused for Section ${c.dest}.`, `التوصيل متوقف للقسم ${c.dest}.`)}</small>` : ''}
      <button class="fulfil-row" data-act="destSheet">${icon(c.type === 'delivery' ? 'ticket' : 'pin')}<span class="grow"><b>${where}</b><small>${when}${c.type === 'pickup' ? ' · ' + T('wait', 'انتظار') + ' ' + mins(pickupWait(c.dest)) : ''}</small></span><span class="link">${T('Change', 'تغيير')}</span></button>
      ${live('zone-warn', () => (c.type === 'pickup' && zoneWarning(c.dest)) ? `<div class="notice warn">${icon('alert')}<span>${T(`${L(pickup(c.dest).name)} is near capacity.`, `${L(pickup(c.dest).name)} قريب من السعة القصوى.`)}</span><button class="btn btn-sm btn-primary" data-act="cartDest" data-arg="${bestPickup(c.dest).id}">${T('Switch to', 'انتقل إلى')} ${L(bestPickup(c.dest).name)}</button></div>` : '')}
    </div>

    <div class="tabs cat-tabs" role="tablist" aria-label="${T('Categories', 'الأقسام')}">${MENU_CATS.map((cat) => `<button role="tab" aria-selected="${S.menuCat === cat.id}" class="tab ${S.menuCat === cat.id ? 'on' : ''}" data-act="menuCat" data-arg="${cat.id}"><span aria-hidden="true">${cat.emoji}</span> ${L(cat.name)}</button>`).join('')}</div>

    ${S.menuCat === 'burgers' || S.menuCat === 'fries' ? `<article class="combo">
      <span class="combo-img" aria-hidden="true">🍔🍟🥤</span>
      <div class="grow"><small class="eyebrow light">${T('Snack Combo of the Day', 'كومبو اليوم')}</small><b>${L(COMBO.desc)}</b>
        <span class="price">${sar(COMBO.price)} <s>${sar(COMBO.items.reduce((s, i) => s + item(i).price, 0))}</s></span></div>
      ${c.combo ? `<div class="stepper"><button class="icon-btn sm" data-act="comboRemove" aria-label="${T('Remove combo', 'إزالة الكومبو')}">${icon('minus')}</button><output>${c.combo}</output><button class="icon-btn sm primary" data-act="comboAdd" aria-label="${T('Add combo', 'إضافة كومبو')}">${icon('plus')}</button></div>` : `<button class="btn btn-orange btn-sm" data-act="comboAdd">${T('Add', 'أضف')}</button>`}
    </article>` : ''}

    ${live('menu-deal', () => (S.flash && S.menuCat === item(S.flash.item).cat ? flashCard(S.flash) : ''))}

    ${!isMerch ? `<details class="more filters-box" ${S.menuDiet.length || (S.menuAvoid || []).length ? 'open' : ''}><summary>${icon('filter')} ${T('Dietary preferences & allergens', 'التفضيلات الغذائية والحساسية')} ${icon('down')}</summary>
      <div class="row gap-xs wrap" role="group" aria-label="${T('Dietary preferences', 'التفضيلات الغذائية')}"><span class="muted xs">${T('Show only', 'اعرض فقط')}:</span>${DIETS.map((d) => `<button class="chip sm ${S.menuDiet.includes(d.id) ? 'on' : ''}" data-act="menuDiet" data-arg="${d.id}" aria-pressed="${S.menuDiet.includes(d.id)}">${L(d.name)}</button>`).join('')}</div>
      <div class="row gap-xs wrap mt-xs" role="group" aria-label="${T('Hide items containing', 'إخفاء الأصناف التي تحتوي')}"><span class="muted xs">${T('Hide items containing', 'إخفاء ما يحتوي')}:</span>${Object.keys(ALLERGENS).map((a) => `<button class="chip sm ${(S.menuAvoid || []).includes(a) ? 'on' : ''}" data-act="menuAvoid" data-arg="${a}" aria-pressed="${(S.menuAvoid || []).includes(a)}">${L(ALLERGENS[a])}</button>`).join('')}</div>
      <p class="muted xs mt-xs">${T('Allergen information is supplied by vendors (sample data). Kitchens handle common allergens; cross-contact is possible.', 'معلومات الحساسية من البائعين (بيانات نموذجية). المطابخ تتعامل مع مسببات حساسية شائعة وقد يحدث تلامس.')}</p></details>` : `<p class="muted small">${T('Club merchandise is collected with your order or delivered to your seat. Each item adds a digital twin to your Trophy Cabinet.', 'منتجات النادي تُستلم مع طلبك أو تُوصل لمقعدك. كل منتج يضيف نسخة رقمية لخزانة جوائزك.')}</p>`}

    ${(last || S.favorites.length) && !isMerch ? `<div class="quick"><span class="muted small">${T('Quick', 'سريع')}</span>
      ${last ? `<button class="chip" data-act="reorder" data-arg="${last.id}">${icon('refresh')} ${T('Reorder', 'أعد الطلب')} ${last.items.slice(0, 3).map((i) => item(i.id).emoji).join('')}</button>` : ''}
      ${S.favorites.map((f) => `<button class="chip" data-act="addItem" data-arg="${f}">${icon('heart')} ${L(item(f).name)}</button>`).join('')}</div>` : ''}

    <div class="menu-list">${items.length ? items.map((m) => menuItemRow(m)).join('') : `<div class="empty">${foodTile('🔍')}<b>${T('No items match these filters', 'لا توجد أصناف مطابقة')}</b><button class="btn btn-ghost btn-sm" data-act="clearDiet">${T('Clear filters', 'مسح الفلاتر')}</button></div>`}</div>
    <div class="cart-spacer"></div>
    ${cartBar()}
  </section>`;
}

function destSheet() {
  const c = S.cart;
  const ph = S.match.phase;
  return `<h2 class="sheet-title">${c.type === 'pickup' ? T('Pickup point', 'نقطة الاستلام') : T('Deliver to', 'التوصيل إلى')}</h2>
    ${destPicker(c.type, c.dest)}
    <h3 class="h3 mt">${T('When', 'متى')}</h3>
    <div class="seg w-full"><button class="${c.schedule === 'now' ? 'on' : ''}" data-act="cartSchedule" data-arg="now">${T('As soon as possible', 'في أقرب وقت')}</button>
      ${!['halftime', 'second', 'final'].includes(ph) ? `<button class="${c.schedule === 'halftime' ? 'on' : ''}" data-act="cartSchedule" data-arg="halftime">${icon('clock')} ${T('Ready at halftime', 'جاهز في الاستراحة')}</button>` : ''}</div>
    <button class="btn btn-primary w-full mt" data-act="closeSheet">${T('Done', 'تم')}</button>`;
}

function cartBar() {
  const n = cartCount();
  if (!n) return '';
  return `<div class="cart-bar"><div class="cart-bar-in">
    <span class="cart-n">${n}</span><span class="grow"><b>${sar(cartTotal())}</b><small>${destText().where}</small></span>
    <button class="btn btn-orange" data-act="go" data-arg="summary">${T('Review order', 'مراجعة الطلب')} ${icon('chevron', 'flip')}</button></div></div>`;
}

let SHEETOPT = null;
let MENUQ = '';
function itemInfoSheet(id) {
  const m = item(id);
  const sold = !itemAvailable(id);
  const set = m.opts ? OPTION_SETS[m.opts] : null;
  if (set && (!SHEETOPT || !set.list.some((o) => o.id === SHEETOPT))) SHEETOPT = set.list[m.opts === 'size' ? 1 : 0].id;
  const opt = set ? SHEETOPT : null;
  const key = ckey(id, opt);
  const inCart = S.cart.items[key] || 0;
  return `<div class="item-hero">${media(m, 'xl')}</div>
    <h2 class="sheet-title">${L(m.name)}</h2>
    <p class="muted">${L(m.desc)}</p>
    <div class="row between mt-s"><span class="price lg">${sar(linePrice(id, opt))}</span>${availability(m)}</div>
    ${m.allergens.length ? `<div class="allergen-box"><b>${icon('alert')} ${T('Contains allergens', 'يحتوي على مسببات حساسية')}</b><p>${m.allergens.map((a) => L(ALLERGENS[a])).join('، ')}</p></div>` : m.cat !== 'merch' ? `<p class="muted xs mt-s">${T('No major allergens listed by the vendor. This is not an allergen-free guarantee.', 'لم يذكر البائع مسببات حساسية رئيسية. هذا ليس ضماناً بخلوه منها.')}</p>` : ''}
    ${m.diet.length ? `<p class="small mt-xs">${T('Dietary', 'غذائي')}: ${m.diet.map((d) => L(DIETS.find((x) => x.id === d).name)).join('، ')}</p>` : ''}
    ${set ? `<fieldset class="opts"><legend class="h3">${L(set.label)}</legend>${set.list.map((o) => `<label class="opt ${opt === o.id ? 'on' : ''}"><input type="radio" name="opt" value="${o.id}" ${opt === o.id ? 'checked' : ''} data-change="pickOpt"/><span>${L(o.name)}</span><small>${o.add ? '+' + sar(o.add) : ''}</small></label>`).join('')}</fieldset>` : ''}
    <details class="more" ${m.cat === 'merch' ? '' : 'open'}><summary>${T('Ingredients', 'المكونات')} ${icon('down')}</summary>
      <p class="small">${L(m.ing)}</p>
      ${m.cat !== 'merch' ? `<p class="muted small mt-xs">${T('Prep time', 'وقت التحضير')} ~${mins(m.prep)}</p>` : ''}</details>
    <div class="sheet-actions">
      ${!orderingStatus().open ? `<p class="muted small">${orderingStatus().reason}</p>` : sold ? `<button class="btn btn-primary w-full" data-act="addItem" data-arg="${ALTERNATIVES[id]}">${T('Add alternative', 'أضف البديل')}: ${L(item(ALTERNATIVES[id]).name)}</button>`
        : `${inCart ? stepper(key, inCart) : ''}<button class="btn btn-orange grow sheet-add" data-act="addLine" data-arg="${key}">${icon('plus')} ${T('Add to order', 'أضف للطلب')} · ${sar(linePrice(id, opt))}</button>`}
    </div>`;
}

/* ---------- summary ---------- */
function cartItemsList() {
  const c = S.cart;
  const items = Object.entries(c.items).filter(([k]) => !S.soldOut.includes(pkey(k).id)).map(([k, qty]) => { const { id, opt } = pkey(k); return { id, opt, qty, by: 'me', price: linePrice(id, opt) }; });
  if (c.combo) COMBO.items.forEach((id) => items.push({ id, qty: c.combo, by: 'me', price: Math.round((COMBO.price / COMBO.items.length) * 100) / 100, combo: true }));
  return items;
}

function checkoutProblems() {
  const c = S.cart, probs = [];
  const os = orderingStatus();
  if (!os.open) probs.push(os.reason);
  if (c.type === 'delivery' && !deliveryAllowed(c.dest)) probs.push(T(`Seat delivery isn't available for Section ${c.dest} right now — switch to pickup.`, `التوصيل غير متاح للقسم ${c.dest} حالياً — اختر الاستلام.`));
  if (c.type === 'pickup' && !pickupAllowed(c.dest)) probs.push(T(`${L(pickup(c.dest).name)} is paused — choose another pickup point.`, `${L(pickup(c.dest).name)} متوقفة مؤقتاً — اختر نقطة أخرى.`));
  Object.keys(c.items).forEach((k) => { const { id } = pkey(k); if (!itemAvailable(id)) probs.push(`${L(item(id).name)}: ${t('err.unavailable')}`); });
  return probs;
}

function viewSummary() {
  ensureCartDest();
  const c = S.cart;
  if (!cartCount()) return `<section class="page narrow"><h1 class="title">${T('Order summary', 'ملخص الطلب')}</h1>
    <div class="empty panel">${foodTile('🛍️', 'xl')}<b>${T('Your order is empty', 'طلبك فارغ')}</b><p class="muted">${T('Add food, drinks or club merchandise.', 'أضف طعاماً أو مشروبات أو منتجات النادي.')}</p><button class="btn btn-orange" data-act="go" data-arg="menu">${T('Browse menu', 'تصفح القائمة')}</button></div></section>`;
  const items = cartItemsList();
  const preview = { items, type: c.type, dest: c.dest, stage: 'placed', status: 0, tasks: routeItems(items, c.type === 'delivery' ? SECTIONS[c.dest].angle : pickup(c.dest).angle) };
  const eta = estimate(preview);
  const voucher = S.vouchers.find((v) => items.some((i) => i.id === v.item)) || S.vouchers[0];
  const voucherApplies = voucher && items.some((i) => i.id === voucher.item);
  const discount = voucherApplies ? Math.round(item(voucher.item).price * (voucher.pct ?? 100)) / 100 : 0;
  const pb = priceBreakdown(items, c.type, discount);
  const { where, when } = destText();
  const probs = checkoutProblems();
  return `<section class="page narrow summary">
    <button class="link" data-act="go" data-arg="menu">${icon('back', 'flip')} ${T('Back to menu', 'العودة للقائمة')}</button>
    <h1 class="title">${T('Review & place order', 'مراجعة وتنفيذ الطلب')}</h1>
    <section class="panel">
      <div class="block-head"><h2 class="h3">${T('Items', 'الأصناف')} · ${cartCount()}</h2><button class="link" data-act="go" data-arg="menu">${icon('edit')} ${T('Edit cart', 'تعديل السلة')}</button></div>
      ${c.combo ? `<div class="sum-row">${foodTile('🍔')}<div class="grow"><b>${L(COMBO.name)}</b><small>${L(COMBO.desc)}</small></div><div class="stepper"><button class="icon-btn sm" data-act="comboRemove" aria-label="${T('Remove combo', 'إزالة الكومبو')}">${icon('minus')}</button><output>${c.combo}</output><button class="icon-btn sm primary" data-act="comboAdd" aria-label="${T('Add combo', 'إضافة كومبو')}">${icon('plus')}</button></div><b class="price">${sar(COMBO.price * c.combo)}</b></div>` : ''}
      ${Object.entries(c.items).map(([k, q]) => { const { id, opt } = pkey(k); const ok = itemAvailable(id); return `<div class="sum-row ${ok ? '' : 'sold'}">${media(item(id), 'sm')}<div class="grow"><b>${lineName(id, opt)}</b><small>${sar(linePrice(id, opt))} ${T('each', 'للواحد')} · ${L(vendor(routeItems([{ id, qty: 1 }], 0)[0].vid).name)}</small>
        ${ok ? '' : `<div class="notice warn mt-xs">${icon('alert')}<span>${t('err.unavailable')}</span><button class="btn btn-sm btn-primary" data-act="swapItem" data-arg="${k}">${T('Swap for', 'استبدل بـ')} ${L(item(ALTERNATIVES[id]).name)}</button></div>`}</div>
        ${stepper(k, q)}<b class="price">${sar(linePrice(id, opt) * q)}</b></div>`; }).join('')}
    </section>
    <section class="panel">
      <div class="block-head"><h2 class="h3">${c.type === 'pickup' ? t('ful.pickup') : t('ful.delivery')}</h2><button class="link" data-act="destSheet">${icon('edit')} ${T('Change', 'تغيير')}</button></div>
      <div class="seg w-full"><button class="${c.type === 'pickup' ? 'on' : ''}" data-act="cartType" data-arg="pickup" ${S.venueCfg.fulfillment.pickup ? '' : 'disabled'}>${t('ful.pickup')}</button><button class="${c.type === 'delivery' ? 'on' : ''}" data-act="cartType" data-arg="delivery" ${S.venueCfg.fulfillment.delivery ? '' : 'disabled'}>${t('ful.delivery')}</button></div>
      <div class="kv mt-s"><span>${icon(c.type === 'delivery' ? 'ticket' : 'pin')} ${T('Destination', 'الوجهة')}</span><b>${where}</b></div>
      <div class="kv"><span>${icon('clock')} ${T('Timing', 'التوقيت')}</span><b>${when}</b></div>
      <div class="kv"><span>${icon('store')} ${T('Prepared by', 'يحضّره')}</span><b>${preview.tasks.map((x) => L(vendor(x.vid).name)).join(' + ')}</b></div>
      ${c.type === 'pickup' && zoneWarning(c.dest) ? `<div class="notice warn mt-s">${icon('alert')}<span>${T('Near capacity — try', 'قريب من السعة — جرّب')} ${L(bestPickup(c.dest).name)}</span><button class="btn btn-sm btn-primary" data-act="cartDest" data-arg="${bestPickup(c.dest).id}">${T('Switch', 'تغيير')}</button></div>` : ''}
      <label class="field"><span>${icon('note')} ${T('Note for the kitchen or runner (optional)', 'ملاحظة للمطبخ أو المندوب (اختياري)')}</span><textarea data-input="cartNote" rows="2" maxlength="120" placeholder="${T('e.g. no ice, aisle seat', 'مثال: بدون ثلج، مقعد على الممر')}">${esc(c.note || '')}</textarea></label>
      <p class="muted xs">${T('Allergies: tell the vendor in your note. The vendor has not confirmed allergen-free preparation.', 'الحساسية: أخبر البائع في الملاحظة. لم يؤكد البائع التحضير الخالي من مسببات الحساسية.')}</p>
    </section>
    <section class="panel pay">
      <div class="kv"><span>${T('Subtotal', 'المجموع الفرعي')}</span><b>${sar(pb.subtotal)}</b></div>
      ${pb.fee ? `<div class="kv"><span>${T('Seat delivery fee', 'رسوم التوصيل')}</span><b>${sar(pb.fee)}</b></div>` : ''}
      ${pb.service ? `<div class="kv"><span>${T('Service fee', 'رسوم الخدمة')}</span><b>${sar(pb.service)}</b></div>` : ''}
      ${voucherApplies ? `<div class="kv ok"><span>🎁 ${L(voucher.label)}</span><b>−${sar(discount)}</b></div>` : voucher ? `<div class="notice info mt-xs">🎁 <span>${L(voucher.label)} — ${T('add the item to use it.', 'أضف الصنف لاستخدامه.')}</span><button class="btn btn-sm btn-ghost" data-act="addItem" data-arg="${voucher.item}">${T('Add', 'أضف')}</button></div>` : ''}
      <div class="kv total"><span>${T('Total', 'الإجمالي')}</span><b>${sar(pb.total)}</b></div>
      <div class="kv muted"><span>${T(`Includes VAT ${Math.round(S.venueCfg.vatRate * 100)}%`, `يشمل ضريبة القيمة المضافة ${Math.round(S.venueCfg.vatRate * 100)}%`)}</span><span>${sar(pb.vat)}</span></div>
      <div class="kv"><span>${icon('clock')} ${T('Estimated wait', 'الانتظار المتوقع')}</span><b>${c.schedule === 'halftime' ? T('At halftime', 'في الاستراحة') : '~' + mins(eta)} ${dataBadge('demo')}</b></div>
      <div class="pay-box"><b>${icon('lock')} ${T('Payment', 'الدفع')}</b><p class="small">${t('demo.noCharge')}</p><small class="muted">${T('Production: Apple Pay / cards through a licensed payment provider, handled server-side. Phone verification would happen at this step.', 'في النسخة الفعلية: Apple Pay أو البطاقات عبر مزود دفع مرخص من الخادم، ويتم التحقق برقم الجوال في هذه الخطوة.')}</small></div>
      ${probs.length ? `<div class="notice warn mt-s" role="alert">${icon('alert')}<span>${probs.map(esc).join('<br/>')}</span></div>` : ''}
      <div class="sticky-cta"><button class="btn btn-orange btn-lg w-full" data-act="placeOrder" ${probs.length ? 'disabled' : ''}>${T('Place demo order', 'نفّذ الطلب التجريبي')} · ${sar(pb.total)}</button></div>
    </section>
  </section>`;
}

/* ---------- tracking ---------- */
function demoQR(code) {
  let cells = '';
  let x = +code * 7919;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { x = (x * 1103515245 + 12345) % 2147483648; const corner = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3); if (corner ? (r % 2 === 0 || c % 2 === 0) : x % 3 === 0) cells += `<rect x="${c}" y="${r}" width="1" height="1"/>`; }
  return `<svg class="qr" viewBox="-1 -1 11 11" role="img" aria-label="${T('Demo collection code', 'رمز استلام تجريبي')}"><rect x="-1" y="-1" width="11" height="11" fill="#fff"/><g fill="#0D2131">${cells}</g></svg>`;
}

function viewTrack(id) {
  const o = S.orders.find((x) => x.id === id) || S.orders[0];
  if (!o) return `<section class="page narrow"><div class="empty panel">${foodTile('🧾', 'xl')}<b>${T('Order not found', 'الطلب غير موجود')}</b><button class="btn btn-primary" data-act="go" data-arg="orders">${T('View orders', 'عرض الطلبات')}</button></div></section>`;
  return `<section class="page">
    <button class="link" data-act="go" data-arg="orders">${icon('back', 'flip')} ${T('My orders', 'طلباتي')}</button>
    <div class="page-head"><h1 class="title">${T('Order', 'الطلب')} ${o.id}</h1><span class="row gap-xs">${pill(o.type === 'delivery' ? t('ful.delivery') : t('ful.pickup'), 'brand')}${dataBadge('demo')}</span></div>
    <div class="map-layout">
      <div class="stack">
        ${live('track-main', () => trackCard(o))}
        <div class="panel">${stadiumMap({ id: 'track-map', compact: true })}</div>
      </div>
      <div class="map-side">
        ${live('track-handoff', () => handoffCard(o))}
        <details class="panel more" open>
          <summary class="h3">${T('Receipt', 'الإيصال')} · ${sar(o.total)} ${icon('down')}</summary>
          ${receiptBody(o)}
        </details>
        <div class="row gap wrap">
          <button class="btn btn-ghost grow" data-act="orderHelp" data-arg="${o.id}">${icon('help')} ${T('Get help with this order', 'مساعدة بخصوص الطلب')}</button>
          ${['placed', 'accepted'].includes(o.stage) ? `<button class="btn btn-ghost danger" data-act="fanCancel" data-arg="${o.id}">${t('act.cancel')}</button>` : ''}
        </div>
      </div>
    </div>
  </section>`;
}

function receiptBody(o) {
  return `${o.items.filter((i) => !i.combo).map((i) => `<div class="kv"><span>${item(i.id).emoji} ${i.qty}× ${lineName(i.id, i.opt)}${i.by && i.by !== 'me' ? ` <small class="muted">· ${esc(i.by)}</small>` : ''}</span><b>${sar((i.price ?? linePrice(i.id, i.opt)) * i.qty)}</b></div>`).join('')}
    ${o.items.some((i) => i.combo) ? `<div class="kv"><span>🍔🍟🥤 ${o.items.find((i) => i.combo).qty}× ${L(COMBO.name)}</span><b>${sar(COMBO.price * o.items.find((i) => i.combo).qty)}</b></div>` : ''}
    ${o.fee ? `<div class="kv"><span>${T('Seat delivery fee', 'رسوم التوصيل')}</span><b>${sar(o.fee)}</b></div>` : ''}
    ${o.discount ? `<div class="kv ok"><span>🎁 ${T('Discount', 'خصم')}</span><b>−${sar(o.discount)}</b></div>` : ''}
    ${o.refund ? `<div class="kv ok"><span>${T('Refund (simulated)', 'استرداد (محاكاة)')}</span><b>−${sar(o.refund)}</b></div>` : ''}
    <div class="kv total"><span>${T('Total', 'الإجمالي')}</span><b>${sar(o.total - (o.refund || 0))}</b></div>
    ${o.vat ? `<div class="kv muted"><span>${T('Includes VAT', 'يشمل الضريبة')}</span><span>${sar(o.vat)}</span></div>` : ''}
    ${o.note ? `<div class="kv"><span>${icon('note')} ${T('Your note', 'ملاحظتك')}</span><b>${esc(L(o.note))}</b></div>` : ''}
    <p class="muted xs">${T('Simulated payment — no charge was made.', 'دفع محاكاة — لم يتم خصم أي مبلغ.')}</p>`;
}

function trackCard(o) {
  const eta = estimate(o);
  const waitingHT = o.schedule === 'halftime' && o.stage === 'placed' && !['halftime', 'second', 'final'].includes(S.match.phase) && !(S.match.phase === 'kickoff' && S.match.minute >= 38);
  const last = (o.history || [])[o.history.length - 1];
  return `<div class="panel track-card st-${o.status}">
    <div class="row between">
      <div><small class="muted">${isFinal(o) ? stageLabel(o.stage) : T('Estimated', 'المتوقع')}</small>
        <div class="eta">${o.stage === 'cancelled' ? '✕' : isFinal(o) ? '✓' : waitingHT ? T('Halftime', 'الاستراحة') : '~' + mins(eta)}</div></div>
      <span class="status-chip st-${o.status}">${stageLabel(o.stage)}</span>
    </div>
    ${recoveryPanel(o)}
    ${o.hold === 'vendor_paused' ? `<div class="notice warn mt-s">${icon('alert')}<span>${T('A vendor has paused orders. Your order keeps its place and resumes when they reopen.', 'أوقف أحد البائعين الطلبات مؤقتاً. طلبك يحتفظ بمكانه ويستأنف عند إعادة الفتح.')}</span></div>` : ''}
    ${o.etaNote && S.simTick - o.etaNote.tick < 30 ? `<div class="notice info mt-s">${icon('clock')}<span>${T(`Estimate changed from ~${o.etaNote.from} to ~${o.etaNote.to} min: ${o.etaNote.why}.`, `تغيّر الوقت المتوقع من ~${o.etaNote.from} إلى ~${o.etaNote.to} د: ${o.etaNote.why}.`)}</span></div>` : ''}
    ${waitingHT ? `<div class="notice info mt-s">${icon('clock')}<span>${T('Scheduled — kitchens start just before halftime.', 'مجدول — يبدأ التحضير قبل الاستراحة بقليل.')}</span></div>` : ''}
    ${orderSteps(o)}
    ${last ? `<p class="muted xs mt-s">${T('Last update', 'آخر تحديث')}: ${stageLabel(last.stage)} · ${actorLabel(last.by)} · ${last.minute < 0 ? T('pre-match', 'قبل البداية') : last.minute + "'"}${S.demo.autopilot && !isFinal(o) ? ' · ' + T('progress is simulated automatically', 'التقدم محاكاة تلقائياً') : ''}</p>` : ''}
    <div class="vendor-split">
      <small class="muted">${o.tasks.length > 1 ? T(`Prepared by ${o.tasks.length} kitchens, handed over together`, `يُحضَّر في ${o.tasks.length} مطابخ ويُسلَّم معاً`) : T('Prepared by', 'يحضّره')}</small>
      ${o.tasks.map((x) => `<span class="vs-chip ${x.st >= 2 ? 'ok' : ''} ${x.rejected ? 'bad' : ''}">${vendor(x.vid).emoji} ${L(vendor(x.vid).name)} · ${TASK_LABEL(x)}</span>`).join('')}
    </div>
  </div>`;
}

function handoffCard(o) {
  if (o.stage === 'cancelled') {
    return `<div class="panel handoff"><h2 class="h3">${icon('x')} ${T('Order cancelled', 'تم إلغاء الطلب')}</h2><p class="muted small">${T('In production, any refund would be issued by the payment provider. This demo moved no money.', 'في النسخة الفعلية يصدر الاسترداد عبر مزود الدفع. هذا العرض لم يحرك أي أموال.')}</p>
      <button class="btn btn-primary mt-s" data-act="reorder" data-arg="${o.id}">${icon('refresh')} ${T('Order again', 'اطلب مجدداً')}</button></div>`;
  }
  if (isFinal(o)) {
    return `<div class="panel handoff done"><h2 class="h3">${icon('check')} ${T('Enjoy your order!', 'بالعافية!')}</h2><p class="muted small">${T('Demo points were added to your profile.', 'أضيفت نقاط تجريبية إلى ملفك.')}</p>
      <div class="row gap mt-s"><button class="btn btn-primary grow" data-act="reorder" data-arg="${o.id}">${icon('refresh')} ${T('Order again', 'اطلب مجدداً')}</button></div></div>`;
  }
  if (o.type === 'pickup') {
    const p = pickup(o.dest);
    const ready = o.stage === 'ready';
    return `<div class="panel handoff">
      <h2 class="h3">${icon('store')} ${T('Pickup', 'الاستلام')} · ${L(p.name)}</h2>
      <p class="small"><b>${T('Next', 'التالي')}:</b> ${ready ? T('Go to the pickup point now and show your code.', 'توجّه لنقطة الاستلام الآن وأظهر الرمز.') : T('Wait until the status says Ready — we will notify you.', 'انتظر حتى تصبح الحالة جاهز — سننبهك.')}</p>
      <div class="code-box">${demoQR(o.code)}<div><small>${T('Demo collection code', 'رمز استلام تجريبي')}</small><b>${o.code}</b></div></div>
      <ol class="directions"><li>${T(`Walk to ${L(p.name)} (~${mins(walkMins(planRoute(SECTIONS[S.setup.section].angle, p.angle).len))})`, `امشِ إلى ${L(p.name)} (~${mins(walkMins(planRoute(SECTIONS[S.setup.section].angle, p.angle).len))})`)}</li>
        <li>${T('Use the GolBite lane and show the code', 'استخدم مسار GolBite وأظهر الرمز')}</li><li>${T('All vendors’ items are bagged together', 'أصناف كل البائعين في كيس واحد')}</li></ol>
      ${zoneWarning(o.dest) && !ready ? `<div class="notice warn">${icon('alert')}<span>${T('This pickup is busy.', 'نقطة الاستلام مزدحمة.')}</span><button class="btn btn-sm btn-primary" data-act="movePickup" data-arg="${o.id}">${T('Move to', 'انقل إلى')} ${L(bestPickup(o.dest).name)}</button></div>` : ''}
      ${ready ? `<button class="btn btn-orange w-full mt-s" data-act="collected" data-arg="${o.id}">${icon('check')} ${t('act.collect')}</button>` : ''}
    </div>`;
  }
  return `<div class="panel handoff">
    <h2 class="h3">${icon('truck')} ${t('ful.delivery')}</h2>
    <p class="small"><b>${T('Next', 'التالي')}:</b> ${o.stage === 'dispatched' ? T('Your runner is on the way — stay in your seat.', 'المندوب في الطريق — ابقَ في مقعدك.') : T('The runner leaves once everything is ready.', 'ينطلق المندوب عند جاهزية كل الأصناف.')}</p>
    <div class="kv"><span>${T('Runner', 'المندوب')}</span><b>${o.runner || T('Being assigned', 'جارٍ التعيين')}</b></div>
    <div class="kv"><span>${T('Destination', 'الوجهة')}</span><b>${o.dest === S.setup.section ? seatLabel() : T('Section', 'القسم') + ' ' + o.dest}</b></div>
    <p class="muted small">${T('Keep your phone handy. The runner will call out your order number at your row.', 'احتفظ بجوالك قريباً. سينادي المندوب رقم طلبك عند صفك.')}</p>
  </div>`;
}

/* ---------- history ---------- */
function viewOrders() {
  const act = S.orders.filter((o) => !isFinal(o));
  const past = S.orders.filter((o) => isFinal(o));
  if (!S.orders.length) {
    return `<section class="page narrow"><h1 class="title">${T('My orders', 'طلباتي')}</h1>
      <div class="empty panel">${foodTile('🧾', 'xl')}<b>${T('No orders yet', 'لا توجد طلبات بعد')}</b><p class="muted">${T('Your matchday orders will appear here.', 'ستظهر طلباتك هنا.')}</p>
      <div class="row gap center"><button class="btn btn-orange" data-act="go" data-arg="menu">${T('Start an order', 'ابدأ طلباً')}</button><button class="btn btn-ghost" data-act="go" data-arg="group">${T('Group order', 'طلب جماعي')}</button></div></div></section>`;
  }
  const row = (o) => `<button class="order-row" data-act="go" data-arg="track/${o.id}">
    <span class="or-emoji" aria-hidden="true">${o.items.slice(0, 3).map((i) => item(i.id).emoji).join('')}</span>
    <span class="grow"><b>${o.id}${o.group ? ' · ' + T('Group', 'جماعي') : ''}</b><small>${o.items.reduce((s, i) => s + i.qty, 0)} ${T('items', 'أصناف')} · ${o.type === 'delivery' ? t('ful.delivery') : L(pickup(o.dest)?.name)} · ${new Date(o.created).toLocaleTimeString(S.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</small>
      ${!isFinal(o) ? orderSteps(o, true) : ''}</span>
    <span class="or-side"><b>${sar(o.total)}</b><span class="status-chip sm st-${o.status}">${stageLabel(o.stage)}</span></span></button>`;
  return `<section class="page narrow">
    <div class="page-head"><h1 class="title">${T('My orders', 'طلباتي')}</h1><button class="btn btn-orange btn-sm" data-act="go" data-arg="menu">${icon('plus')} ${T('New order', 'طلب جديد')}</button></div>
    ${live('orders-active', () => S.orders.some((o) => !isFinal(o)) ? `<h2 class="section-label">${T('Active', 'النشطة')}</h2><div class="list">${S.orders.filter((o) => !isFinal(o)).map(row).join('')}</div>` : '')}
    ${past.length ? `<h2 class="section-label">${T('History', 'السجل')}</h2><div class="list">${past.map((o) => `<div class="order-wrap">${row(o)}<button class="btn btn-ghost btn-sm reorder-btn" data-act="reorder" data-arg="${o.id}">${icon('refresh')} ${T('Reorder', 'أعد الطلب')}</button></div>`).join('')}</div>` : ''}
  </section>`;
}

/* ---------- Group Order ---------- */
function viewGroup() {
  const g = S.group;
  if (!g) {
    return `<section class="page narrow">
      <h1 class="title">${T('Group order', 'طلب جماعي')}</h1>
      <div class="feature-hero panel">${foodTile('👥', 'xl')}<div><b>${T('Order together, collect once', 'اطلبوا معاً واستلموا مرة واحدة')}</b><p class="muted small">${T('Everyone adds their own items. One pickup or seat delivery, one confirmation.', 'كل شخص يضيف أصنافه. استلام أو توصيل واحد وتأكيد واحد.')}</p></div></div>
      <div class="panel"><h2 class="h3">${T('Start a group', 'ابدأ مجموعة')}</h2>
        <p class="muted small">${T('You become the group leader and confirm the final order.', 'ستكون قائد المجموعة وتؤكد الطلب النهائي.')}</p>
        <button class="btn btn-orange w-full mt-s" data-act="groupCreate">${icon('plus')} ${T('Create group order', 'إنشاء طلب جماعي')}</button></div>
      <form class="panel" data-submit="groupJoin"><h2 class="h3">${T('Join with a code', 'انضم برمز')}</h2>
        <label class="field"><span>${T('Join code', 'رمز الانضمام')}</span><input name="code" maxlength="8" placeholder="GB-4F2K" autocomplete="off" style="text-transform:uppercase"/></label>
        <button class="btn btn-ghost w-full mt-s" type="submit">${T('Join group', 'انضم للمجموعة')}</button></form>
    </section>`;
  }
  const leader = g.leader === g.me;
  const total = orderTotal(g.items);
  const mineQty = (id) => g.items.filter((i) => i.by === g.me && i.id === id).reduce((s, i) => s + i.qty, 0);
  const cat = S.menuCat === 'merch' ? 'burgers' : S.menuCat;
  return `<section class="page">
    <div class="page-head"><h1 class="title">${T('Group order', 'طلب جماعي')}</h1><button class="link danger" data-act="groupLeave">${T(leader ? 'Cancel group' : 'Leave group', leader ? 'إلغاء المجموعة' : 'مغادرة المجموعة')}</button></div>
    <div class="map-layout">
      <div class="stack">
        <div class="panel code-share">
          <div><small>${T('Demo group code (not shareable yet)', 'رمز المجموعة التجريبي (غير قابل للمشاركة بعد)')}</small><b class="join-code">${g.code}</b></div>
          <button class="btn btn-glass btn-sm" data-act="copyCode">${icon('copy')} ${T('Copy', 'نسخ')}</button>
        </div>
        <div class="panel">
          <div class="block-head"><h2 class="h3">${T('Members', 'الأعضاء')} (${g.members.length})</h2>${leader && g.members.length < 4 ? `<button class="btn btn-ghost btn-sm" data-act="groupInvite">${icon('plus')} ${T('Add simulated participants', 'أضف مشاركين افتراضيين')}</button>` : ''}</div>
          <p class="muted xs">${T('Single-device demo: participants other than you are simulated. Nobody else has joined, and invite links need a backend.', 'تجربة على جهاز واحد: المشاركون غيرك افتراضيون. لم ينضم أحد فعلياً، وروابط الدعوة تحتاج خادماً.')}</p>
          ${live('group-members', () => `<ul class="members">${S.group ? S.group.members.map((mname) => { const its = S.group.items.filter((i) => i.by === mname); return `<li><span class="avatar">${esc(mname[0])}</span><span class="grow"><b>${esc(mname)}${mname === S.group.leader ? ' · ' + T('Leader', 'القائد') : ''}${mname === S.group.me ? ' (' + T('you', 'أنت') + ')' : ''}</b><small>${its.reduce((s, i) => s + i.qty, 0)} ${T('items', 'أصناف')}</small></span><b>${sar(orderTotal(its))}</b></li>`; }).join('') : ''}</ul>`)}
        </div>
        <div class="panel">
          <h2 class="h3">${T('Add your items', 'أضف أصنافك')}</h2>
          <div class="tabs" role="tablist">${MENU_CATS.filter((c) => c.id !== 'merch').map((c) => `<button role="tab" aria-selected="${cat === c.id}" class="tab ${cat === c.id ? 'on' : ''}" data-act="menuCat" data-arg="${c.id}">${c.emoji} ${L(c.name)}</button>`).join('')}</div>
          <div class="menu-list mt-s">${MENU.filter((m) => m.cat === cat).map((m) => menuItemRow(m, mineQty, 'Group')).join('')}</div>
        </div>
      </div>
      <div class="map-side">
        ${live('group-items', () => { const gg = S.group; if (!gg) return ''; return `<div class="panel"><h2 class="h3">${T('Group basket', 'سلة المجموعة')}</h2>
          ${gg.items.length ? gg.items.map((i) => `<div class="kv"><span>${item(i.id).emoji} ${i.qty}× ${L(item(i.id).name)} <small class="muted">· ${esc(i.by)}</small></span><b>${sar(item(i.id).price * i.qty)}</b></div>`).join('') : `<p class="muted small">${T('No items yet — be the first to add.', 'لا توجد أصناف بعد — كن أول من يضيف.')}</p>`}
          <div class="kv total"><span>${T('Running total', 'الإجمالي الحالي')}</span><b>${sar(orderTotal(gg.items))}</b></div>
          ${gg.items.length ? `<div class="split"><b>${T('Bill split (demo)', 'تقسيم الفاتورة (تجريبي)')}</b>
            <div class="seg w-full mt-xs"><button class="${gg.split !== 'equal' ? 'on' : ''}" data-act="groupSplit" data-arg="items">${T('By items', 'حسب الأصناف')}</button><button class="${gg.split === 'equal' ? 'on' : ''}" data-act="groupSplit" data-arg="equal">${T('Equally', 'بالتساوي')}</button></div>
            ${gg.members.map((n) => `<div class="kv"><span>${esc(n)}</span><b>${sar(gg.split === 'equal' ? Math.round(orderTotal(gg.items) / gg.members.length * 100) / 100 : orderTotal(gg.items.filter((i) => i.by === n)))}</b></div>`).join('')}
            <small class="muted">${T('Shares are shown for reference — one simulated payment covers the whole order.', 'الحصص للعرض فقط — دفعة محاكاة واحدة تغطي الطلب كاملاً.')}</small></div>` : ''}</div>`; })}
        <div class="panel">
          <h2 class="h3">${T('Where should we get it?', 'أين نستلم؟')}</h2>
          <div class="seg w-full"><button class="${g.type === 'pickup' ? 'on' : ''}" data-act="groupType" data-arg="pickup" ${leader ? '' : 'disabled'}>${T('Pickup', 'استلام')}</button><button class="${g.type === 'delivery' ? 'on' : ''}" data-act="groupType" data-arg="delivery" ${leader ? '' : 'disabled'}>${T('Seat delivery', 'توصيل')}</button></div>
          <div class="mt-s ${leader ? '' : 'disabled-area'}">${destPicker(g.type, g.dest, 'group')}</div>
          ${leader ? `<button class="btn btn-orange btn-lg w-full mt" data-act="groupConfirm" ${g.items.length ? '' : 'disabled'}>${T('Review & confirm', 'مراجعة وتأكيد')} · ${sar(total)}</button>`
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
