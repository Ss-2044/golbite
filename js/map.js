/* GolBite Stadium Digital Twin — stylised, interactive SVG map. */

function arcSector(a1, a2, r1x, r1y, r2x, r2y) {
  const span = norm(a2 - a1);
  const large = span > 180 ? 1 : 0;
  const p1 = ptAt(a1, r2x, r2y), p2 = ptAt(a2, r2x, r2y), p3 = ptAt(a2, r1x, r1y), p4 = ptAt(a1, r1x, r1y);
  return `M${p1.x} ${p1.y} A${r2x} ${r2y} 0 ${large} 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${r1x} ${r1y} 0 ${large} 0 ${p4.x} ${p4.y}Z`;
}
function arcLine(a1, a2, rx = GEO.rx, ry = GEO.ry) {
  const span = norm(a2 - a1);
  const p1 = ptAt(a1, rx, ry), p2 = ptAt(a2, rx, ry);
  return `M${p1.x} ${p1.y} A${rx} ${ry} 0 ${span > 180 ? 1 : 0} 1 ${p2.x} ${p2.y}`;
}
const HEAT = { calm: '#22A06B', mid: '#F5B94A', busy: '#E5484D' };
const SECTION_SPANS = { A: [228, 312], B: [318, 42], C: [48, 132] };

/* Where is the user's active order on the map right now? */
function orderMarkerPos(o) {
  const v = vendor(o.tasks[0].vid);
  const dA = destAngle(o);
  if (o.status < 2) return { p: ptAt(v.angle), label: T('Preparing', 'قيد التحضير') };
  if (o.status >= 3) return null;
  if (o.type === 'pickup') return { p: ptAt(dA), label: T('Ready', 'جاهز') };
  const r = planRoute(v.angle, dA);
  const f = clamp((o.handoff || 0) / 10, 0, 1);
  const idx = Math.min(r.pts.length - 1, Math.floor(f * (r.pts.length - 1)));
  return { p: r.pts[idx], label: T('On the way', 'في الطريق'), route: r };
}

function stadiumMap(opts = {}) {
  const id = opts.id || 'map';
  const detailed = opts.detailed ?? S.mapMode === 'detailed';
  const sec = S.setup?.section;
  const concert = isConcert();
  const team = myTeam().color;

  // stands
  const stands = Object.entries(SECTION_SPANS).map(([k, [a1, a2]]) => {
    const mine = k === sec;
    const fill = mine ? 'var(--map-mine)' : 'var(--map-stand)';
    return `<g class="map-hit" data-act="mapInfo" data-arg="sec:${k}" tabindex="0" role="button" aria-label="${esc(L(SECTIONS[k].name))}">
      <path d="${arcSector(a1, a2, 112, 78, 160, 113)}" fill="${fill}" stroke="var(--map-line)" stroke-width="1.2"/>
      <text x="${ptAt(SECTIONS[k].angle, 136, 96).x}" y="${ptAt(SECTIONS[k].angle, 136, 96).y + 4}" class="map-sec ${mine ? 'mine' : ''}">${k}</text></g>`;
  }).join('');
  const westStand = `<path d="${arcSector(138, 222, 112, 78, 160, 113)}" fill="var(--map-stand2)" stroke="var(--map-line)" stroke-width="1.2"/>
    <text x="${ptAt(180, 136, 96).x}" y="${ptAt(180, 136, 96).y + 3}" class="map-small" transform="rotate(-90 ${ptAt(180, 136, 96).x} ${ptAt(180, 136, 96).y})">${T('MAIN', 'الرئيسي')}</text>`;

  // seats (detailed)
  let seats = '';
  if (detailed) {
    Object.entries(SECTION_SPANS).forEach(([k, [a1, a2]]) => {
      const span = norm(a2 - a1);
      for (let r = 0; r < 4; r++) for (let i = 0; i <= 14; i++) {
        const p = ptAt(a1 + (span * i) / 14, 118 + r * 11, 82 + r * 8);
        seats += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="1.3" fill="var(--map-seat)"/>`;
      }
    });
  }

  // pitch or stage
  const field = concert
    ? `<rect x="150" y="118" width="100" height="64" rx="8" fill="#20334A"/><rect x="165" y="105" width="70" height="20" rx="4" fill="${team}"/><text x="200" y="158" class="map-label light">${T('STAGE', 'المسرح')}</text>`
    : `<rect x="128" y="104" width="144" height="92" rx="6" fill="#178A55"/><rect x="128" y="104" width="144" height="92" rx="6" fill="none" stroke="#fff" stroke-opacity=".6"/>
       <line x1="200" y1="104" x2="200" y2="196" stroke="#fff" stroke-opacity=".6"/><circle cx="200" cy="150" r="14" fill="none" stroke="#fff" stroke-opacity=".6"/>
       <rect x="128" y="132" width="16" height="36" fill="none" stroke="#fff" stroke-opacity=".6"/><rect x="256" y="132" width="16" height="36" fill="none" stroke="#fff" stroke-opacity=".6"/>`;

  // gates
  const gates = GATES.map((g) => {
    const p = ptAt(g.angle, 196, 143);
    return `<g class="map-hit" data-act="mapInfo" data-arg="gate:${g.id}" tabindex="0" role="button" aria-label="${esc(L(g.name))}">
      <rect x="${p.x - 11}" y="${p.y - 7}" width="22" height="14" rx="4" fill="var(--navy)"/><text x="${p.x}" y="${p.y + 3}" class="map-label light">${g.id}</text></g>`;
  }).join('');

  // vendors
  const vendors = VENDORS.map((v) => {
    const p = ptAt(v.angle, 176, 127);
    return `<g class="map-hit" data-act="mapInfo" data-arg="ven:${v.id}" tabindex="0" role="button" aria-label="${esc(L(v.name))}">
      <rect x="${p.x - 9}" y="${p.y - 9}" width="18" height="18" rx="5" fill="var(--map-card)" stroke="var(--orange)" stroke-width="1.4"/>
      <text x="${p.x}" y="${p.y + 4}" class="map-emoji">${v.emoji}</text></g>`;
  }).join('');

  // facilities
  const facilities = (detailed || opts.facilities) ? FACILITIES.map((f) => {
    const p = ptAt(f.angle, 188, 137);
    return `<g class="map-hit" data-act="mapInfo" data-arg="fac:${f.kind}" tabindex="0" role="button" aria-label="${esc(L(FACILITY_LABELS[f.kind]))}">
      <circle cx="${p.x}" cy="${p.y}" r="6.5" fill="var(--map-card)" stroke="var(--map-line)"/><text x="${p.x}" y="${p.y + 3}" class="map-emoji sm">${FACILITY_LABELS[f.kind].icon}</text></g>`;
  }).join('') : '';

  // accessible route (detailed): step-free ring on the inner concourse
  const access = detailed ? `<ellipse cx="${GEO.cx}" cy="${GEO.cy}" rx="166" ry="119" fill="none" stroke="#3B82F6" stroke-width="1.4" stroke-dasharray="1 4" stroke-linecap="round" opacity=".9"/>` : '';

  // route to seat
  let routeSvg = '';
  if (opts.route && S.setup) {
    const gate = GATES.find((g) => g.id === (S.setup.gate || 'G1'));
    const r = routeToSeat(gate.angle, opts.routeSection || S.setup.section);
    const d = polyPath(r.pts);
    routeSvg = `<path d="${d}" class="route-line ${r.detour ? 'detour' : ''}" fill="none"/>
      <path d="${d}" class="route-dash" fill="none"/>
      ${motionReduced() ? '' : `<circle r="5" fill="var(--orange)" stroke="#fff" stroke-width="2"><animateMotion dur="4s" repeatCount="indefinite" path="${d}"/></circle>`}`;
  }

  // dynamic layers (heat, pickups, closures, order marker) refresh each tick
  const dyn = () => {
    let out = '';
    if (S.heatmap) {
      out += Object.entries(SECTION_SPANS).map(([k, [a1, a2]]) => `<path d="${arcLine(a1, a2)}" stroke="${HEAT[levelKind(S.crowd[k])]}" stroke-width="12" fill="none" opacity=".45" stroke-linecap="round"/>`).join('');
    }
    out += S.closedRoutes.map((c) => {
      const mid = ptAt(norm(c.from + norm(c.to - c.from) / 2));
      return `<path d="${arcLine(c.from, c.to)}" stroke="#E5484D" stroke-width="14" fill="none" stroke-dasharray="4 3"/>
        <g><circle cx="${mid.x}" cy="${mid.y}" r="8" fill="#E5484D"/><text x="${mid.x}" y="${mid.y + 3.5}" class="map-label light">✕</text></g>`;
    }).join('');
    out += PICKUPS.map((p) => {
      const pos = ptAt(p.angle);
      const load = pickupLoad(p.id);
      const c = HEAT[levelKind(load)];
      return `<g class="map-hit" data-act="mapInfo" data-arg="pick:${p.id}" tabindex="0" role="button" aria-label="${esc(L(p.name))} · ${levelWord(load)}">
        ${S.heatmap ? `<circle cx="${pos.x}" cy="${pos.y}" r="${10 + load / 9}" fill="${c}" opacity=".25"/>` : ''}
        <circle cx="${pos.x}" cy="${pos.y}" r="9" fill="${c}" stroke="#fff" stroke-width="2"/>
        <text x="${pos.x}" y="${pos.y + 3.5}" class="map-label light">P${p.id.slice(1)}</text></g>`;
    }).join('');
    return out;
  };
  const ord = () => {
    const o = opts.order !== false ? activeOrder() : null;
    const mk = o && orderMarkerPos(o);
    if (!mk) return '';
    let out = '';
    if (mk.route) out += `<path d="${polyPath(mk.route.pts)}" fill="none" stroke="var(--orange)" stroke-width="2.5" stroke-dasharray="2 4" stroke-linecap="round"/>`;
    out += `<g class="order-marker" transform="translate(${mk.p.x.toFixed(1)} ${mk.p.y.toFixed(1)})"><circle r="14" class="pulse-ring"/><circle r="9" fill="var(--orange)" stroke="#fff" stroke-width="2"/><text y="3" class="map-emoji sm">🛍️</text>
      <g transform="translate(0 -20)"><rect x="-26" y="-8" width="52" height="14" rx="7" fill="var(--orange)"/><text y="2.5" class="map-label light">${mk.label}</text></g></g>`;
    return out;
  };

  // fan location
  let you = '';
  if (sec) {
    const p = ptAt(SECTIONS[sec].angle, 128, 90);
    you = `<g class="you-marker" transform="translate(${p.x} ${p.y})"><circle r="11" class="pulse-ring blue"/><circle r="6" fill="#2F80ED" stroke="#fff" stroke-width="2.5"/></g>
      <g transform="translate(${p.x} ${p.y - 18})"><rect x="-22" y="-8" width="44" height="14" rx="7" fill="#2F80ED"/><text y="2.5" class="map-label light">${T('You', 'أنت')}</text></g>`;
  }

  return `<div class="map-wrap ${opts.compact ? 'compact' : ''}">
    <svg class="stadium-map" viewBox="-8 -6 416 312" role="img" aria-label="${T('Stadium map', 'خريطة الملعب')}" direction="ltr">
      <ellipse cx="200" cy="150" rx="198" ry="146" fill="var(--map-outer)"/>
      <ellipse cx="${GEO.cx}" cy="${GEO.cy}" rx="${GEO.rx}" ry="${GEO.ry}" fill="none" stroke="var(--map-concourse)" stroke-width="18"/>
      ${access}
      ${stands}${westStand}${seats}${field}
      ${live(id + '-dyn', dyn, 'g')}
      ${routeSvg}
      ${gates}${vendors}${facilities}${you}
      ${live(id + '-ord', ord, 'g')}
    </svg>
  </div>`;
}

function mapLegend(detailed) {
  const items = [
    [`<i class="lg-dot" style="background:#2F80ED"></i>`, T('You', 'أنت')],
    [`<i class="lg-dot" style="background:${HEAT.calm}"></i>`, T('Calm', 'هادئ')],
    [`<i class="lg-dot" style="background:${HEAT.mid}"></i>`, T('Moderate', 'متوسط')],
    [`<i class="lg-dot" style="background:${HEAT.busy}"></i>`, T('Busy', 'مزدحم')],
    ['<b class="lg-p">P</b>', T('Pickup point', 'نقطة استلام')],
    ['<b class="lg-v">🍔</b>', T('Food stall', 'كشك طعام')],
    ['<b class="lg-g">G</b>', T('Gate / exit', 'بوابة / مخرج')],
    ['<i class="lg-dot" style="background:var(--orange)"></i>', T('Your order', 'طلبك')],
  ];
  if (detailed) {
    items.push(['🚻', T('Restrooms', 'دورات المياه')], ['⛑️', T('First aid', 'إسعاف')], ['🕌', T('Prayer room', 'مصلى')], ['ℹ️', T('Info', 'معلومات')],
      ['<i class="lg-line"></i>', T('Step-free route', 'مسار بدون درج')], ['<i class="lg-line red"></i>', T('Closed route', 'ممر مغلق')]);
  }
  return `<ul class="legend" aria-label="${T('Map legend', 'دليل الخريطة')}">${items.map(([k, v]) => `<li>${k}<span>${v}</span></li>`).join('')}</ul>`;
}

function mapInfoSheet(arg) {
  const [kind, id] = arg.split(':');
  const sec = S.setup ? SECTIONS[S.setup.section] : SECTIONS.A;
  let title = '', body = '', actions = '';
  if (kind === 'pick') {
    const p = pickup(id);
    const r = planRoute(sec.angle, p.angle);
    const load = pickupLoad(id);
    title = L(p.name);
    body = `<div class="stat-grid">
      ${statCard(T('Queue', 'الطابور'), levelWord(load), levelKind(load))}
      ${statCard(T('Wait', 'الانتظار'), mins(pickupWait(id)))}
      ${statCard(T('Walk', 'المشي'), mins(walkMins(r.len, S.setup?.section)))}
    </div>
    ${zoneWarning(id) ? `<div class="notice warn mt">${icon('alert')}<span>${T('This zone is near capacity. Suggested alternative:', 'هذه المنطقة قريبة من سعتها القصوى. البديل المقترح:')} <b>${L(bestPickup(id).name)}</b></span></div>` : ''}`;
    actions = `<button class="btn btn-primary grow" data-act="choosePickup" data-arg="${id}">${T('Use for pickup', 'استخدمها للاستلام')}</button>`;
  } else if (kind === 'sec') {
    const s = SECTIONS[id];
    title = L(s.name);
    body = `<div class="stat-grid">${statCard(T('Crowd', 'الكثافة'), levelWord(S.crowd[id]), levelKind(S.crowd[id]))}${statCard(T('Delivery', 'التوصيل'), T('Available', 'متاح'))}${statCard(T('Nearest pickup', 'أقرب استلام'), L(PICKUPS.slice().sort((a, b) => angDist(a.angle, s.angle) - angDist(b.angle, s.angle))[0].name))}</div>`;
    actions = `<button class="btn btn-primary grow" data-act="findSeat" data-arg="${id}">${icon('route')} ${T('Route here', 'المسار إلى هنا')}</button>`;
  } else if (kind === 'ven') {
    const v = vendor(id);
    title = `${v.emoji} ${L(v.name)}`;
    body = `<p class="muted">${v.cats.map((c) => L(MENU_CATS.find((x) => x.id === c).name)).join(' · ')}</p>
      <div class="stat-grid">${statCard(T('Workload', 'ضغط العمل'), Math.round(S.vendorLoad[id]) + '%', levelKind(S.vendorLoad[id]))}${statCard(T('Walk', 'المشي'), mins(walkMins(planRoute(sec.angle, v.angle).len)))}</div>`;
    actions = `<button class="btn btn-primary grow" data-act="go" data-arg="menu">${T('Order from menu', 'اطلب من القائمة')}</button>`;
  } else if (kind === 'gate') {
    const g = GATES.find((x) => x.id === id);
    title = L(g.name);
    body = `<p class="muted">${T('Entrance and exit. Step-free access and bag check.', 'مدخل ومخرج. وصول بدون درج وتفتيش الحقائب.')}</p>`;
    actions = `<button class="btn btn-primary grow" data-act="setGate" data-arg="${id}">${T('I am entering here', 'سأدخل من هنا')}</button>`;
  } else if (kind === 'fac') {
    const f = FACILITY_LABELS[id];
    const near = FACILITIES.filter((x) => x.kind === id).sort((a, b) => angDist(a.angle, sec.angle) - angDist(b.angle, sec.angle))[0];
    title = `${f.icon} ${L(f)}`;
    body = `<p class="muted">${T('Nearest to your section', 'الأقرب لقسمك')}: ${mins(walkMins(planRoute(sec.angle, near.angle).len))} ${T('walk', 'مشياً')}. ${T('Step-free access available.', 'وصول بدون درج متاح.')}</p>`;
  }
  return `<h2 class="sheet-title">${title}</h2>${body}<div class="row gap mt">${actions}<button class="btn btn-ghost grow" data-act="closeSheet">${T('Close', 'إغلاق')}</button></div>`;
}

function statCard(label, value, kind = '') {
  return `<div class="stat ${kind ? 'stat-' + kind : ''}"><span class="stat-l">${label}</span><b class="stat-v">${value}</b></div>`;
}
