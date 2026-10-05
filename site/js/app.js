(function () {
  'use strict';

  // Wrap each module's content and add an "On this page" menu (shown on wide screens)
  document.querySelectorAll('.module').forEach(function (mod) {
    var main = document.createElement('div');
    main.className = 'module-main';
    while (mod.firstChild) main.appendChild(mod.firstChild);
    mod.appendChild(main);

    var heads = main.querySelectorAll(':scope > h2, :scope > .exercise > h3');
    if (!heads.length) return;

    var toc = document.createElement('nav');
    toc.className = 'toc';
    toc.setAttribute('aria-label', 'On this page');
    var title = document.createElement('p');
    title.className = 'toc-title';
    title.textContent = 'On this page';
    var list = document.createElement('ol');

    heads.forEach(function (h, i) {
      h.id = h.id || mod.closest('.page').dataset.page + '-s' + (i + 1);
      var a = document.createElement('a');
      a.href = '#' + mod.closest('.page').dataset.page; // keeps the tab route intact
      a.dataset.target = h.id;
      a.textContent = h.textContent;
      var li = document.createElement('li');
      li.appendChild(a);
      list.appendChild(li);
    });

    toc.appendChild(title);
    toc.appendChild(list);
    mod.appendChild(toc);
  });

  document.addEventListener('click', function (e) {
    var link = e.target.closest('.toc a');
    if (!link) return;
    e.preventDefault();
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(link.dataset.target).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  function updateToc() {
    var page = document.querySelector('.page:not([hidden])');
    var links = page ? page.querySelectorAll('.toc a') : [];
    if (!links.length) return;
    var offset = document.querySelector('.site-header').offsetHeight + 40;
    var current = links[0];
    links.forEach(function (a) {
      if (document.getElementById(a.dataset.target).getBoundingClientRect().top <= offset) current = a;
    });
    // At the bottom of the page, highlight the last section
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = links[links.length - 1];
    links.forEach(function (a) { a.classList.toggle('active', a === current); });
  }

  var tocTicking = false;
  window.addEventListener('scroll', function () {
    if (tocTicking) return;
    tocTicking = true;
    requestAnimationFrame(function () { updateToc(); tocTicking = false; });
  }, { passive: true });

  // Print-only header with the UM logo at the start of each page/module
  document.querySelectorAll('.page').forEach(function (page) {
    var band = document.createElement('div');
    band.className = 'print-brand';
    band.setAttribute('aria-hidden', 'true');
    band.innerHTML = '<img src="img/um-logo.png" alt="" width="753" height="240">' +
      '<span>Workshop: Gemini AI in Academic Writing<br><small>Dr Firdaus Sahran · Fakulti Sains Komputer &amp; Teknologi Maklumat</small></span>';
    page.insertBefore(band, page.firstChild);
  });

  var pages = document.querySelectorAll('.page');
  var tabs = document.querySelectorAll('.tab-list a');
  var baseTitle = 'Workshop: Gemini AI in Academic Writing';

  function currentRoute() {
    var hash = window.location.hash.replace('#', '');
    return document.querySelector('[data-page="' + hash + '"]') ? hash : 'home';
  }

  function render() {
    var route = currentRoute();
    var active;

    pages.forEach(function (page) {
      var match = page.dataset.page === route;
      page.hidden = !match;
      if (match) active = page;
    });

    tabs.forEach(function (tab) {
      tab.setAttribute('aria-selected', tab.dataset.route === route ? 'true' : 'false');
      if (tab.dataset.route === route) {
        tab.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    });

    var heading = active.querySelector('h1');
    document.title = route === 'home' ? baseTitle : heading.textContent + ' · ' + baseTitle;
    window.scrollTo(0, 0);
    updateToc();
  }

  window.addEventListener('hashchange', function () {
    render();
    document.getElementById('main').focus({ preventScroll: true });
  });
  render();

  // Print buttons: "this page" prints the open tab; "full workbook" prints every page
  var printIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';

  function addPrintBar(target, thisLabel) {
    var bar = document.createElement('div');
    bar.className = 'print-bar';
    bar.innerHTML =
      (thisLabel ? '<button type="button" class="print-btn" data-print="page">' + printIcon + thisLabel + '</button>' : '') +
      '<button type="button" class="print-btn" data-print="all">' + printIcon + 'Print full workbook</button>';
    target.appendChild(bar);
  }

  document.querySelectorAll('.module-head').forEach(function (head) {
    addPrintBar(head, 'Print this module');
  });
  addPrintBar(document.querySelector('.hero .hero-main'), null);

  // Printing (as 16:9 slides) is handled in js/slides.js

  // Next-token prediction demo (Module 1.2). Probabilities are illustrative.
  (function () {
    var demo = document.getElementById('nt-demo');
    if (!demo) return;
    var prompt = ['Previous', ' studies', ' have', ' shown', ' that'];
    var steps = [
      [[' AI', 31], [' students', 24], [' the', 14], [' feedback', 9], [' there', 5]],
      [[' tools', 38], [' can', 21], [' models', 17], [' has', 8], [' use', 5]],
      [[' can', 45], [' may', 22], [' help', 12], [' are', 8], [' improve', 6]],
      [[' improve', 36], [' help', 25], [' support', 15], [' enhance', 12], [' reduce', 4]],
      [[' writing', 29], [' the', 23], [' students', 19], [' academic', 14], [' clarity', 5]],
      [[' clarity', 27], [' quality', 26], [' skills', 20], [' performance', 11], [' outcomes', 6]],
      [['.', 62], [' and', 21], [',', 9], [' among', 4], [' for', 2]]
    ];
    var textEl = document.getElementById('nt-text');
    var barsEl = document.getElementById('nt-bars');
    var labelEl = document.getElementById('nt-cand-label');
    var stepEl = document.getElementById('nt-step');
    var nextBtn = document.getElementById('nt-next');
    var step = 0;

    function chip(word, cls) {
      var s = document.createElement('span');
      s.className = 'tok ' + cls;
      s.textContent = word;
      return s;
    }

    function drawText() {
      textEl.innerHTML = '';
      prompt.forEach(function (w) { textEl.appendChild(chip(w, 'tok-prompt')); });
      for (var i = 0; i < step; i++) {
        textEl.appendChild(chip(steps[i][0][0], 'c' + ((i % 5) + 1) + (i === step - 1 ? ' new' : '')));
      }
    }

    function drawBars(chosen) {
      barsEl.innerHTML = '';
      if (step >= steps.length) {
        labelEl.textContent = 'Finished';
        var done = document.createElement('li');
        done.innerHTML = '<p class="nt-done">Sentence complete: 7 tokens predicted one at a time, with no fact-checking at any step.</p>';
        done.style.display = 'block';
        barsEl.appendChild(done);
        return;
      }
      labelEl.textContent = 'Candidates for token ' + (step + 1) + ' (top 5)';
      steps[step].forEach(function (c, i) {
        var li = document.createElement('li');
        if (chosen && i === 0) li.className = 'chosen';
        li.innerHTML = '<span class="nt-word"></span><span class="nt-track"><span class="nt-fill" style="width:0"></span></span><span class="nt-pct">' + c[1] + '%</span>';
        li.querySelector('.nt-word').textContent = '"' + c[0] + '"';
        barsEl.appendChild(li);
        var fill = li.querySelector('.nt-fill');
        requestAnimationFrame(function () { fill.style.width = c[1] + '%'; });
      });
    }

    function update() {
      drawText();
      drawBars(false);
      stepEl.textContent = 'Step ' + Math.min(step + 1, steps.length) + ' of ' + steps.length;
      nextBtn.disabled = step >= steps.length;
      if (step >= steps.length) stepEl.textContent = 'Done';
    }

    nextBtn.addEventListener('click', function () {
      if (step >= steps.length) return;
      // Highlight the chosen candidate briefly, then append it to the text
      drawBars(true);
      nextBtn.disabled = true;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(function () { step++; update(); }, reduce ? 0 : 450);
    });
    document.getElementById('nt-reset').addEventListener('click', function () { step = 0; update(); });
    update();
  })();

  // Copy-to-clipboard for prompt templates
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;
    var text = btn.closest('.prompt').querySelector('pre').textContent;

    var done = function () {
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 1600);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { /* ignore */ }
      document.body.removeChild(ta);
    }
  });
})();
