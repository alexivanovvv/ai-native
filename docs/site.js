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

  // подсветка активного раздела во внутристраничном оглавлении (.toc)
  var links = Array.from(document.querySelectorAll('.toc a'));
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
