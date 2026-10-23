(function(){
  // эмодзи-замок на весь гайд (как DUDE! в Hermes Dashboard): 3 раунда, в каждом сетка 3×3 и один свой эмодзи по порядку.
  // Верно или нет - не видно до последнего тапа. Ошибка - тряска и пауза 0с → 5с → 30с → 1м → 2м…; вход помнится на устройстве 30 дней.
  // Замок клиентский: от случайных глаз, не от того, кто откроет исходник.
  var KEY = [0x1F64F, 0x1F44B, 0x1F49B].map(function(c){ return String.fromCodePoint(c); });
  var POOL = ['👍','👌','✌️','🤞','🙌','👏','🤝','✋','🤙','💪','🫶','🤟','👊','🖐️','☝️','🤘','❤️','🧡','💚','💙','💜','🤍','💖','💗','✨','⭐','🌟','🔥','🌈','☀️','🌸','🍀','🙂','😊','🤗','😎'];
  var UNLOCK = 'ainative-unlocked', FAILS = 'ainative-lock-fails', LOCKOUT = 'ainative-lockout';
  var DAYS = 30, DELAYS = [0, 5, 30, 60, 120, 120, 600], DELAY_MAX = 3600;
  var root = document.documentElement;
  function ls(k, v){ try { if (v === undefined) return Number(localStorage.getItem(k) || 0); localStorage.setItem(k, String(v)); } catch (e) { return 0; } }
  if (Date.now() - ls(UNLOCK) < DAYS * 864e5) return;
  root.classList.add('ain-locked');

  var css = 'html.ain-locked body>*:not(.ainLock){display:none!important}'
    + '.ainLock{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg,#f6f1e6);color:var(--ink,#231e14);font-family:var(--f-body,sans-serif)}'
    + '.ainLock .box{width:100%;max-width:340px;text-align:center}'
    + '.ainLock .badge{width:56px;height:56px;margin:0 auto 16px;border-radius:18px;display:grid;place-items:center;background:var(--card,#faf6ee);border:1px solid var(--line,#e2d7bf);color:var(--acc,#14703a);transition:transform .3s}'
    + '.ainLock .badge svg{width:26px;height:26px}'
    + '.ainLock .title{display:block;font-family:var(--f-display,sans-serif);font-size:1.25rem;font-weight:600;letter-spacing:-.01em}'
    + '.ainLock .hint{margin-top:6px;color:var(--mut,#6f6650);font-size:.95rem;min-height:1.4em}'
    + '.ainLock .dots{display:flex;gap:10px;justify-content:center;margin:18px 0 20px}'
    + '.ainLock .dots i{width:10px;height:10px;border-radius:50%;background:var(--line-strong,#cdbd97);transition:background .2s,transform .2s}'
    + '.ainLock .dots i.pick{background:var(--ink,#231e14);transform:scale(1.15)}'
    + '.ainLock .dots i.on{background:var(--acc,#14703a)}'
    + '.ainLock .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}'
    + '.ainLock .cell{aspect-ratio:1;font-size:2rem;line-height:1;border-radius:16px;border:1px solid var(--line,#e2d7bf);background:var(--card,#faf6ee);cursor:pointer;transition:transform .12s,background .2s,border-color .2s;-webkit-tap-highlight-color:transparent}'
    + '.ainLock .cell:hover{border-color:var(--line-strong,#cdbd97)}'
    + '.ainLock .cell:active{transform:scale(.92)}'
    + '.ainLock .cell.pick{border-color:var(--ink,#231e14)}'
    + '.ainLock .cell:disabled{cursor:default;opacity:.45}'
    + '.ainLock.enter .cell{animation:ainIn .35s both;animation-delay:calc(var(--i)*35ms)}'
    + '.ainLock.shake .grid,.ainLock.shake .dots{animation:ainShake .45s}'
    + '.ainLock.open .badge{transform:scale(1.12)}'
    + '.ainLock.open .grid{opacity:0;transform:scale(.96);transition:opacity .4s,transform .4s}'
    + '.ainLock.bye{opacity:0;transition:opacity .4s}'
    + '@keyframes ainIn{from{opacity:0;transform:translateY(8px) scale(.9)}}'
    + '@keyframes ainShake{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}'
    + '@media (prefers-reduced-motion:reduce){.ainLock *{animation:none!important;transition:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ICON_CLOSED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var ICON_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.8-1.2"/></svg>';
  var step = 0, bad = false, grid = [], prev = [], el, cdTimer = null, busy = false;

  function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // сетка: свой эмодзи раунда + 8 чужих (не из ключа и не из прошлой сетки)
  function makeGrid(){
    var others = POOL.filter(function(e){ return KEY.indexOf(e) < 0 && prev.indexOf(e) < 0; });
    grid = shuffle([KEY[step]].concat(shuffle(others).slice(0, 8)));
    prev = grid;
  }
  function left(){ return Math.max(0, ls(LOCKOUT) - Date.now()); }
  function fmt(ms){ var t = Math.ceil(ms / 1000); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
  function render(cls){
    var cd = left();
    el.className = 'ainLock' + (cls ? ' ' + cls : '');
    el.innerHTML = '<div class="box"><div class="badge">' + ICON_CLOSED + '</div>'
      + '<b class="title">' + (cd ? 'Не то' : 'AI Native') + '</b>'
      + '<div class="hint">' + (cd ? 'Попробуй снова через <b class="cd">' + fmt(cd) + '</b>' : 'Найди свой · ' + step + ' из ' + KEY.length) + '</div>'
      + '<div class="dots">' + KEY.map(function(_, i){ return '<i class="' + (i < step ? 'pick' : '') + '"></i>'; }).join('') + '</div>'
      + '<div class="grid">' + grid.map(function(e, i){ return '<button type="button" class="cell" style="--i:' + i + '" data-i="' + i + '"' + (cd ? ' disabled' : '') + '>' + e + '</button>'; }).join('') + '</div></div>';
    if (cd && !cdTimer) cdTimer = setInterval(function(){
      var l = left(), c = el.querySelector('.cd');
      if (!l) { clearInterval(cdTimer); cdTimer = null; return render('enter'); }
      if (c) c.textContent = fmt(l);
    }, 1000);
  }
  function pick(i){
    if (busy || left()) return;
    if (grid[i] !== KEY[step]) bad = true;
    el.querySelectorAll('.cell')[i].classList.add('pick');
    el.querySelectorAll('.dots i')[step].classList.add('pick');
    step++;
    if (navigator.vibrate) navigator.vibrate(8);
    busy = true;
    if (step < KEY.length) return setTimeout(function(){ busy = false; makeGrid(); render('enter'); }, 260);
    if (bad) {
      var f = ls(FAILS) + 1; ls(FAILS, f);
      ls(LOCKOUT, Date.now() + (DELAYS[f - 1] != null ? DELAYS[f - 1] : DELAY_MAX) * 1000);
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      el.classList.add('shake');
      return setTimeout(function(){ busy = false; step = 0; bad = false; prev = []; makeGrid(); render(left() ? '' : 'enter'); }, 600);
    }
    ls(FAILS, 0); ls(UNLOCK, Date.now());
    setTimeout(function(){
      el.classList.add('open');
      el.querySelector('.badge').innerHTML = ICON_OPEN;
      el.querySelectorAll('.dots i').forEach(function(d){ d.classList.add('on'); });
      el.querySelector('.title').textContent = 'Открыто';
      el.querySelector('.hint').textContent = 'Добро пожаловать';
    }, 200);
    setTimeout(function(){ root.classList.remove('ain-locked'); el.classList.add('bye'); }, 900);
    setTimeout(function(){ el.remove(); }, 1300);
  }
  function mount(){
    el = document.createElement('div');
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Вход в гайд AI Native');
    document.body.appendChild(el);
    el.addEventListener('click', function(e){ var b = e.target.closest('.cell'); if (b) pick(+b.dataset.i); });
    makeGrid(); render('enter');
  }
  document.body ? mount() : document.addEventListener('DOMContentLoaded', mount);
})();
