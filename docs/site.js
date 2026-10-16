(function(){
  // переключатель темы (light / auto / dark), общий для всех страниц
  var root = document.documentElement, box = document.getElementById('theme');
  if (box) {
    function apply(t){
      if(t==='auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
      localStorage.setItem('ainative-theme', t);
      box.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b.dataset.t===t); });
    }
    box.addEventListener('click', function(e){ if(e.target.dataset.t) apply(e.target.dataset.t); });
    apply(localStorage.getItem('ainative-theme') || 'auto');
  }

  // боковое меню: подпункты-якоря текущей страницы + бургер на узких экранах
  var nav = document.querySelector('.topnav');
  if (nav) {
    var active = nav.querySelector('.navlinks a.active');
    var secs = Array.from(document.querySelectorAll('main section[id]')).filter(function(x){ return x.querySelector('.sec-head h2'); });
    if (active && secs.length > 1) {
      var sub = document.createElement('div'); sub.className = 'navsub';
      secs.forEach(function(x){
        var a = document.createElement('a'); a.href = '#' + x.id;
        a.textContent = x.querySelector('.sec-head h2').textContent.trim();
        sub.appendChild(a);
      });
      active.insertAdjacentElement('afterend', sub);
    }
    var tg = document.createElement('button');
    tg.className = 'navtoggle'; tg.type = 'button'; tg.setAttribute('aria-label', 'Меню'); tg.setAttribute('aria-expanded', 'false');
    tg.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    var th = nav.querySelector('.theme');
    th ? th.parentNode.insertBefore(tg, th) : nav.querySelector('.topnav-inner').appendChild(tg);
    nav.classList.add('js');
    function setOpen(v){ nav.classList.toggle('open', v); tg.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    tg.addEventListener('click', function(){ setOpen(!nav.classList.contains('open')); });
    nav.querySelectorAll('.navlinks a').forEach(function(a){ a.addEventListener('click', function(){ setOpen(false); }); });
  }

  // поиск по всем страницам: кнопка в меню, ⌘K / Ctrl+K / «/»; индекс строится при первом открытии (fetch страниц сайта)
  var PAGES = [
    ['index.html','Интро'], ['ai-native-in-brief.html','Суть'], ['ai-native-principles.html','Принципы'],
    ['ai-native-personal-ai-os.html','Personal OS'], ['ai-native-knowledge-base-guide.html','Знания + Инструменты'],
    ['ai-native-prompts.html','Промпты'], ['ai-native-memo.html','Памятка'], ['faq.html','Вопросы и ответы'],
    ['ai-recorders.html','AI-рекордеры'], ['projects.html','Проекты'], ['about.html','Об авторе']
  ];
  var norm = function(t){ return (t||'').toLowerCase().replace(/ё/g,'е'); };
  var esc = function(t){ return t.replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var idx = null, loading = null;
  function buildIndex(){
    if (loading) return loading;
    loading = Promise.all(PAGES.map(function(p){
      return fetch(p[0]).then(function(r){ return r.ok ? r.text() : ''; }).catch(function(){ return ''; }).then(function(html){
        if (!html) return [];
        var d = new DOMParser().parseFromString(html, 'text/html'), out = [];
        d.querySelectorAll('script,style,header.topnav,.foot,.qn').forEach(function(x){ x.remove(); });
        d.body.querySelectorAll('*').forEach(function(x){ x.append(' '); }); // пробел между ячейками и блоками, чтобы слова не слипались
        var items = d.querySelectorAll('[data-search]');
        var secs = items.length ? items : d.querySelectorAll('main section[id]');
        secs.forEach(function(x){
          var h = x.querySelector('summary, .sec-head h2, h2, h3');
          var title = h ? h.textContent.trim() : p[1];
          var text = x.textContent.replace(/\s+/g,' ').trim();
          var topic = items.length && x.closest('section') ? x.closest('section').querySelector('.sec-head h2') : null;
          out.push({url:p[0] + '#' + x.id, page:p[1], title:title, text:text, n:norm(title + ' ' + text + ' ' + (topic ? topic.textContent : '')), nt:norm(title)});
        });
        var h1 = d.querySelector('h1'), lead = d.querySelector('.sub');
        var body = out.length ? '' : (d.querySelector('main') || d.body).textContent.replace(/\s+/g,' ').trim();
        out.unshift({url:p[0], page:p[1], title:(h1 ? h1.textContent.trim() : p[1]), text:(lead ? lead.textContent.trim() + ' ' : '') + body,
                     n:norm(p[1] + ' ' + (h1 ? h1.textContent : '') + ' ' + body), nt:norm(p[1] + ' ' + (h1 ? h1.textContent : '')), top:1});
        return out;
      });
    })).then(function(all){ idx = [].concat.apply([], all); return idx; });
    return loading;
  }
  function snippet(e, words){
    var t = e.text, nt = norm(t), at = -1;
    words.forEach(function(w){ var i = nt.indexOf(w); if (i >= 0 && (at < 0 || i < at)) at = i; });
    var from = Math.max(0, at - 50), s = (from ? '…' : '') + t.slice(from, from + 160) + (t.length > from + 160 ? '…' : '');
    var out = esc(s);
    words.forEach(function(w){
      if (w.length < 2) return;
      var re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/е/g,'[её]') + '[a-zа-яё]*)', 'gi');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }
  function search(q){
    // грубый учёт окончаний: «безопасность» найдёт и «безопасности»
    var words = norm(q).split(/\s+/).filter(Boolean).map(function(w){ return w.length > 6 ? w.slice(0, -2) : w.length > 4 ? w.slice(0, -1) : w; });
    if (!words.length) return [];
    var res = idx.filter(function(e){ return words.every(function(w){ return e.n.indexOf(w) >= 0; }); }).map(function(e){
      var sc = 0; words.forEach(function(w){ if (e.nt.indexOf(w) >= 0) sc += 5; sc += Math.min(5, e.n.split(w).length - 1); });
      if (e.top) sc -= 3;
      return {e:e, s:sc};
    }).sort(function(a,b){ return b.s - a.s; });
    return res.slice(0, 12).map(function(r){ return {e:r.e, html:snippet(r.e, words)}; });
  }

  var sx = document.createElement('div');
  sx.id = 'sx'; sx.hidden = true;
  sx.innerHTML = '<div class="sx-dim"></div><div class="sx-box" role="dialog" aria-label="Поиск по материалам">'
    + '<div class="sx-in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
    + '<input type="search" placeholder="Поиск: скиллы, база знаний, Obsidian, промпты…" autocomplete="off" spellcheck="false"><button type="button" class="sx-x" aria-label="Закрыть">Esc</button></div>'
    + '<div class="sx-res"></div></div>';
  document.body.appendChild(sx);
  var sxIn = sx.querySelector('input'), sxRes = sx.querySelector('.sx-res'), sel = 0;
  var HINTS = ['с чего начать', 'Claude Code', 'база знаний', 'скиллы', 'безопасность', 'промпт', 'агент'];
  function renderHints(){
    sxRes.innerHTML = '<div class="sx-hint">Попробуйте: ' + HINTS.map(function(h){ return '<button type="button">' + h + '</button>'; }).join('') + '</div>';
  }
  function render(){
    var q = sxIn.value.trim();
    if (!q) { renderHints(); return; }
    if (!idx) { sxRes.innerHTML = '<div class="sx-empty">Загружаю материалы…</div>'; buildIndex().then(render); return; }
    if (!idx.length) { sxRes.innerHTML = '<div class="sx-empty">Поиск работает на сайте — откройте страницу через браузер по адресу, а не как файл.</div>'; return; }
    var r = search(q); sel = 0;
    sxRes.innerHTML = r.length ? r.map(function(x, i){
      return '<a class="sx-item' + (i ? '' : ' on') + '" href="' + x.e.url + '"><span class="sx-pg">' + esc(x.e.page) + '</span>'
        + '<b>' + esc(x.e.title) + '</b><span class="sx-sn">' + x.html + '</span></a>';
    }).join('') : '<div class="sx-empty">Ничего не нашлось. Загляните в <a href="faq.html">вопросы и ответы</a> или попробуйте другое слово.</div>';
  }
  function move(d){
    var it = sxRes.querySelectorAll('.sx-item'); if (!it.length) return;
    it[sel].classList.remove('on'); sel = (sel + d + it.length) % it.length; it[sel].classList.add('on');
    it[sel].scrollIntoView({block:'nearest'});
  }
  function openSearch(){ sx.hidden = false; document.documentElement.classList.add('sx-open'); sxIn.focus(); sxIn.select(); render(); buildIndex(); }
  function closeSearch(){ sx.hidden = true; document.documentElement.classList.remove('sx-open'); }
  sxIn.addEventListener('input', render);
  sxIn.addEventListener('keydown', function(e){
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { var a = sxRes.querySelector('.sx-item.on'); if (a) { e.preventDefault(); a.click(); } }
  });
  sx.addEventListener('click', function(e){
    if (e.target.classList.contains('sx-dim') || e.target.classList.contains('sx-x')) closeSearch();
    var h = e.target.closest('.sx-hint button'); if (h) { sxIn.value = h.textContent; sxIn.focus(); render(); }
    if (e.target.closest('.sx-item')) closeSearch();
  });
  document.addEventListener('keydown', function(e){
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); sx.hidden ? openSearch() : closeSearch(); }
    else if (e.key === '/' && sx.hidden && !e.target.closest('input,textarea,[contenteditable]')) { e.preventDefault(); openSearch(); }
    else if (e.key === 'Escape' && !sx.hidden) closeSearch();
  });
  if (nav) {
    var sb = document.createElement('button');
    sb.type = 'button'; sb.className = 'searchbtn'; sb.setAttribute('aria-label', 'Поиск');
    var mac = /Mac|iPhone|iPad/.test(navigator.platform);
    sb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>Поиск</span><kbd>' + (mac ? '⌘K' : 'Ctrl K') + '</kbd>';
    nav.querySelector('.brandmark').insertAdjacentElement('afterend', sb);
    sb.addEventListener('click', openSearch);
  }

  // раскрыть <details>, если на него ведёт якорь (вопросы из поиска)
  function openHash(){
    var t = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t && t.tagName === 'DETAILS') { t.open = true; t.closest('section') && t.closest('section').classList.add('lit'); }
  }
  addEventListener('hashchange', openHash); openHash();

  // плавное появление секций при скролле
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('lit'); io.unobserve(e.target); } });
  }, {threshold:.12});
  document.querySelectorAll('section').forEach(function(x){ io.observe(x); });

  // индикатор прочтения сверху
  var bar = document.getElementById('readbar');
  if (bar) {
    function upd(){
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max * 100) : 0) + '%';
    }
    addEventListener('scroll', upd, {passive:true}); upd();
  }

  // подсветка активного раздела во внутристраничном оглавлении (.toc) и в подпунктах бокового меню
  var links = Array.from(document.querySelectorAll('.toc a, .topnav .navsub a'));
  if (links.length) {
    var spy = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        var id = '#' + e.target.id;
        links.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href') === id); });
      });
    }, {rootMargin:'-20% 0px -70% 0px'});
    document.querySelectorAll('section[id]').forEach(function(x){ spy.observe(x); });
  }

  // копирование текста из .prompt-блоков (может быть несколько на странице)
  document.querySelectorAll('.prompt .copy').forEach(function(btn){
    btn.addEventListener('click', function(){
      var pre = btn.closest('.prompt').querySelector('pre');
      navigator.clipboard.writeText(pre.textContent).then(function(){
        var was = btn.textContent;
        btn.textContent = 'Скопировано ✓'; btn.classList.add('ok');
        setTimeout(function(){ btn.textContent = was; btn.classList.remove('ok'); }, 2000);
      });
    });
  });
})();
