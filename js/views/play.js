/* GolBite — Play: predictions, quiz, rivalries, quests, mini-game, loyalty. */

function tierBar() {
  const t = tierOf(S.points);
  const tier = TIERS[t];
  const pct = tier.next ? ((S.points - tier.min) / (tier.next - tier.min)) * 100 : 100;
  return `<div class="tier">
    <div class="row between"><b style="color:${tier.color}">${icon('star')} ${L(tier.name)}</b><small class="muted">${tier.next ? `${tier.next - S.points} ${T('pts to', 'نقطة حتى')} ${L(TIERS[t === 'bronze' ? 'silver' : 'gold'].name)}` : T('Top tier reached', 'وصلت لأعلى فئة')}</small></div>
    <div class="tier-track"><i style="width:${clamp(pct, 2, 100)}%"></i></div>
    <div class="tier-steps">${['bronze', 'silver', 'gold'].map((k) => `<span class="${S.points >= TIERS[k].min ? 'on' : ''}">${L(TIERS[k].name)}</span>`).join('')}</div>
  </div>`;
}

let MINI = { taps: 0, until: 0, done: false };

function viewPlay() {
  const ev = currentEvent();
  const concert = isConcert();
  const p = S.prediction || {};
  const quests = [
    { id: 'snack', done: S.quests.snack, label: T('Order a snack', 'اطلب سناك'), pts: 50 },
    { id: 'scarf', done: S.quests.scarf, label: T('Collect a scarf', 'اقتنِ وشاحاً'), pts: 100 },
    { id: 'quiz', done: S.quiz.done, label: T('Finish the halftime quiz', 'أكمل مسابقة الاستراحة'), pts: 60 },
    { id: 'seat', done: S.quests.seat, label: T('Find your seat with GolBite', 'اعثر على مقعدك مع GolBite'), pts: 30 },
    { id: 'vendors', done: S.season.vendorsTried.length >= 2, label: T('Try 2 different vendors', 'جرّب بائعَين مختلفين'), pts: 80, prog: `${Math.min(2, S.season.vendorsTried.length)}/2` },
  ];
  return `<section class="page">
    <h1 class="title">${T('Play', 'العب')}</h1>
    <p class="muted">${T('Optional matchday games. All scores, points and prizes are simulated demo data.', 'ألعاب اختيارية. كل النتائج والنقاط والجوائز بيانات تجريبية.')}</p>
    <div class="card">${tierBar()}<div class="row gap wrap mt-s">${S.badges.map((b) => `<span class="badge-chip" title="${esc(L(BADGES[b].name))}">${BADGES[b].emoji} ${L(BADGES[b].name)}</span>`).join('') || `<small class="muted">${T('Earn badges by ordering, playing and attending.', 'اكسب الأوسمة بالطلب واللعب والحضور.')}</small>`}</div></div>

    <div class="play-grid mt">
      <div class="card">
        <h2 class="h3">${icon('volume')} ${T('Crowd Volume Meter', 'مقياس صوت الجماهير')}</h2>
        ${live('volume', () => { const v = Math.round(S.match.intensity); return `<div class="meter" aria-label="${v}%">${Array.from({ length: 20 }, (_, i) => `<i class="${i < v / 5 ? 'on' : ''} ${i >= 15 ? 'hot' : ''}" style="height:${20 + i * 4}%"></i>`).join('')}</div><div class="row between"><small class="muted">${T('Stadium noise', 'ضجيج الملعب')}</small><b>${v} dB*</b></div>`; })}
        <button class="btn btn-primary w-full mt-s" data-act="makeNoise">📣 ${T('Make noise', 'اصنع ضجيجاً')}</button>
      </div>

      <div class="card">
        <h2 class="h3">${icon('trophy')} ${T('Predict & Win', 'توقع واربح')}</h2>
        ${p.resolved ? `<div class="notice ${p.correct ? 'ok' : 'info'}">${p.correct ? '🎉 ' + T('Correct! +200 points and Oracle Edition unlocked.', 'صحيح! +200 نقطة وفتح إصدار المتنبئ.') : T('Not this time — try again next match.', 'ليس هذه المرة — حاول في المباراة القادمة.')}</div>` : p.locked ? `<div class="notice ok">${icon('lock')} <span>${T('Locked:', 'تم التثبيت:')} <b>${predLabel(p.result)}</b> · ${item(p.snack)?.emoji || ''} ${L(item(p.snack)?.name)}</span></div><p class="muted small">${T('Resolves at the final whistle.', 'تُحسم مع صافرة النهاية.')}</p>` : `
          <p class="muted small">${concert ? T('Guess the encore song mood and the featured snack.', 'خمّن أجواء فقرة الختام والسناك المميز.') : T('Guess the result and today’s featured snack.', 'خمّن النتيجة والسناك المميز اليوم.')}</p>
          <div class="seg w-full">${['home', 'draw', 'away'].map((r) => `<button class="${p.result === r ? 'on' : ''}" data-act="predict" data-arg="result:${r}">${predLabel(r)}</button>`).join('')}</div>
          <div class="row gap wrap mt-s">${['f2', 'b3', 's3', 'd4'].map((id) => `<button class="chip ${p.snack === id ? 'on' : ''}" data-act="predict" data-arg="snack:${id}">${item(id).emoji} ${L(item(id).name)}</button>`).join('')}</div>
          <button class="btn btn-orange w-full mt-s" data-act="lockPrediction" ${p.result && p.snack ? '' : 'disabled'}>${T('Lock prediction', 'ثبّت التوقع')}</button>`}
      </div>

      <div class="card">
        <h2 class="h3">🧠 ${T('Halftime Quiz', 'مسابقة الاستراحة')}</h2>
        ${S.quiz.done ? `<p><b>${S.quiz.score}/${QUIZ.length}</b> ${T('correct', 'صحيحة')}</p>` : `<p class="muted small">${T('3 quick questions. 100 points each.', '3 أسئلة سريعة. 100 نقطة لكل سؤال.')}</p>`}
        <ol class="board">${[...QUIZ_BOARD, ...(S.quiz.done ? [{ name: T('You', 'أنت'), pts: S.quiz.score * 100, me: true }] : [])].sort((a, b) => b.pts - a.pts).map((r) => `<li class="${r.me ? 'me' : ''}"><span>${esc(r.name)}</span><b>${r.pts}</b></li>`).join('')}</ol>
        ${S.quiz.done ? '' : `<button class="btn btn-primary w-full" data-act="startQuiz">${T('Start quiz', 'ابدأ المسابقة')}</button>`}
      </div>

      <div class="card">
        <h2 class="h3">⚔️ ${T('Section Rivalry', 'تحدي الأقسام')}</h2>
        ${live('rivalry', () => { const max = Math.max(...Object.values(S.rivalry)); return `<ul class="rival">${Object.entries(S.rivalry).map(([k, v]) => `<li class="${k === S.setup.section ? 'me' : ''}"><span>${T('Section', 'القسم')} ${k}</span><span class="bar"><i style="width:${(v / max) * 100}%"></i></span><b>${v}</b></li>`).join('')}</ul>`; })}
        <button class="btn btn-ghost w-full mt-s" data-act="cheer">📣 ${T(`Cheer for Section ${S.setup.section}`, `شجّع القسم ${S.setup.section}`)}</button>
      </div>

      <div class="card">
        <h2 class="h3">💺 ${T('Seat vs Seat', 'مقعد ضد مقعد')}</h2>
        <ol class="board">${seatBoard().map((r) => `<li class="${r.me ? 'me' : ''}"><span>${esc(r.name)} <small class="muted">${r.seat}</small></span><b>${r.pts}</b></li>`).join('')}</ol>
      </div>

      <div class="card">
        <h2 class="h3">🔓 ${T('Goal Unlock', 'افتح الهدف')}</h2>
        ${live('mini', miniGame)}
      </div>

      <div class="card">
        <h2 class="h3">🧭 ${T('Fan Quests', 'مهام المشجع')}</h2>
        <ul class="quests">${quests.map((q) => `<li class="${q.done ? 'done' : ''}"><i>${q.done ? icon('check') : ''}</i><span class="grow">${q.label}${q.prog ? ` <small class="muted">${q.prog}</small>` : ''}</span><b>+${q.pts}</b></li>`).join('')}</ul>
      </div>

      <div class="card">
        <h2 class="h3">⚽ ${T('Goal moments', 'لحظات الهدف')}</h2>
        <div class="kv"><span>🥇 ${T('Golden Goal Freebie', 'هدية الهدف الذهبي')}</span><b>${S.vouchers.length ? T('Ready to use', 'جاهزة') : T('First goal unlocks', 'أول هدف يفتحها')}</b></div>
        <div class="kv"><span>🍀 ${T('Lucky Goal Minute', 'دقيقة الهدف المحظوظة')}</span><b>${T('Seat-matched prize', 'جائزة حسب المقعد')}</b></div>
        <div class="kv"><span>🎆 ${T('Victory Snack Fireworks', 'ألعاب النصر')}</span><b>${S.match.won ? T('Unlocked', 'مفتوحة') : T('On a home win', 'عند فوز صاحب الأرض')}</b></div>
        ${S.vouchers.map((v) => `<div class="notice ok mt-s">🎁 <span>${L(v.label)}</span><button class="btn btn-sm btn-primary" data-act="addItem" data-arg="${v.item}">${T('Use', 'استخدم')}</button></div>`).join('')}
      </div>
    </div>

    <div class="card mt">
      <h2 class="h3">🃏 ${T('Season collectible series', 'سلسلة مقتنيات الموسم')}</h2>
      <p class="muted small">${T('One new card per matchday, plus rewards for repeat orders.', 'بطاقة جديدة كل جولة، ومكافآت لتكرار الطلب.')}</p>
      <div class="cards-row">${COLLECTIBLE_SERIES.map((c) => { const own = S.collectibles.some((x) => x.id === c.id); return `<div class="coll ${own ? 'own' : ''} r-${c.rarity}"><span>${own ? c.emoji : '❔'}</span><b>${own ? L(c.name) : T('Locked', 'مقفلة')}</b><small>${c.rarity}</small></div>`; }).join('')}</div>
    </div>
  </section>`;
}

function predLabel(r) {
  const ev = currentEvent();
  if (isConcert()) return { home: T('Upbeat', 'حماسية'), draw: T('Classic', 'كلاسيكية'), away: T('Ballad', 'هادئة') }[r];
  return { home: TEAMS[ev.home].short, draw: T('Draw', 'تعادل'), away: TEAMS[ev.away].short }[r];
}

function seatBoard() {
  const base = SEAT_NEIGHBOURS.map((n, i) => ({ name: n, seat: `${S.setup.section}-${S.setup.row}-${(+S.setup.seat + i - 2 + 30) % 30 || 30}`, pts: 120 + ((i * 97) % 400) }));
  base.push({ name: T('You', 'أنت'), seat: seatLabel(), pts: S.points, me: true });
  return base.sort((a, b) => b.pts - a.pts);
}

function miniGame() {
  const now = Date.now();
  if (MINI.done) return `<div class="notice ok">🎉 ${T('Unlocked! +80 points.', 'تم الفتح! +80 نقطة.')}</div>`;
  const running = MINI.until > now;
  const left = running ? Math.ceil((MINI.until - now) / 1000) : 5;
  return `<p class="muted small">${T('Tap the ball 12 times in 6 seconds to unlock a reward.', 'اضغط الكرة 12 مرة خلال 6 ثوانٍ لفتح مكافأة.')}</p>
    <div class="mini"><button class="mini-ball" data-act="miniTap" aria-label="${T('Tap ball', 'اضغط الكرة')}">⚽</button>
    <div><b>${MINI.taps}/12</b><small class="muted">${running ? left + 's' : T('Tap to start', 'اضغط للبدء')}</small></div></div>
    <div class="tier-track"><i style="width:${(MINI.taps / 12) * 100}%"></i></div>`;
}

let QUIZSTATE = { i: 0, score: 0, picked: null };
function quizSheet() {
  const q = QUIZ[QUIZSTATE.i];
  if (!q) {
    return `<div class="center"><div class="celeb-emoji">🧠</div><h2 class="sheet-title">${QUIZSTATE.score}/${QUIZ.length}</h2><p class="muted">${T('Quiz complete!', 'انتهت المسابقة!')}</p><button class="btn btn-primary w-full" data-act="closeSheet">${T('Done', 'تم')}</button></div>`;
  }
  return `<small class="muted">${T('Question', 'السؤال')} ${QUIZSTATE.i + 1}/${QUIZ.length}</small>
    <h2 class="sheet-title">${L(q.q)}</h2>
    <div class="list">${q.a.map((a, i) => {
      const picked = QUIZSTATE.picked;
      const cls = picked == null ? '' : i === q.c ? 'correct' : i === picked ? 'wrong' : '';
      return `<button class="choice ${cls}" data-act="quizAnswer" data-arg="${i}" ${picked != null ? 'disabled' : ''}>${L(a)}</button>`;
    }).join('')}</div>
    ${QUIZSTATE.picked != null ? `<button class="btn btn-primary w-full mt" data-act="quizNext" autofocus>${T('Next', 'التالي')}</button>` : ''}`;
}
