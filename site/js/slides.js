/* Print as slides
   Turns the open tab (or the whole workshop) into 16:9 slides just before printing.
   Each slide is 1280 x 720 CSS px, which matches the 13.333in x 7.5in print page exactly,
   so content measured on screen fits the printed page. */
(function () {
  'use strict';

  var TITLE = 'Workshop: Gemini AI in Academic Writing';
  var SPEAKER = 'Dr Firdaus Sahran · Universiti Malaya';
  var MIN_ZOOM = 0.5;
  var deck = null;

  function logoSrc() {
    var img = document.querySelector('.header-logo img');
    return img ? (img.currentSrc || img.src) : 'img/um-logo.png';
  }

  // Copy an element for a slide, without ids, buttons or other screen-only parts
  function cleanClone(el) {
    var c = el.cloneNode(true);
    c.querySelectorAll('.copy-btn, .print-bar, .nt-controls, .toc').forEach(function (x) { x.remove(); });
    if (c.removeAttribute) c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach(function (x) { x.removeAttribute('id'); });
    c.querySelectorAll('img').forEach(function (img) { img.loading = 'eager'; });
    return c;
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function overflowing(body) { return body.scrollHeight > body.clientHeight + 1; }

  // ---------- slide templates ----------
  function contentSlide(kicker, title) {
    var s = el('section', 'slide slide-content');
    var top = el('header', 'sl-top');
    top.appendChild(el('span', 'sl-kicker', kicker));
    var logo = el('img', 'sl-logo'); logo.src = logoSrc(); logo.alt = '';
    top.appendChild(logo);
    s.appendChild(top);
    var h = el('h2', 'sl-title'); h.textContent = title; s.appendChild(h);
    var body = el('div', 'sl-body'); s.appendChild(body);
    var inner = el('div', 'sl-inner'); body.appendChild(inner);
    var foot = el('footer', 'sl-foot');
    foot.appendChild(el('span', '', TITLE + ' · ' + SPEAKER));
    foot.appendChild(el('span', 'sl-num'));
    s.appendChild(foot);
    deck.appendChild(s);
    return { slide: s, body: body, inner: inner, title: title, kicker: kicker };
  }

  function titleSlide(eyebrow, heading, lead, bullets, aside) {
    var s = el('section', 'slide slide-title');
    var logo = el('img', 'st-logo'); logo.src = logoSrc(); logo.alt = '';
    var logoWrap = el('div', 'st-logo-wrap'); logoWrap.appendChild(logo); s.appendChild(logoWrap);
    var grid = el('div', 'st-grid');
    var main = el('div', 'st-main');
    main.appendChild(el('p', 'st-eyebrow', eyebrow));
    var h = el('h1', 'st-h1'); h.textContent = heading; main.appendChild(h);
    if (lead) { var p = el('p', 'st-lead'); p.textContent = lead; main.appendChild(p); }
    if (bullets && bullets.length) {
      main.appendChild(el('p', 'st-obj-label', 'Learning objectives'));
      var ul = el('ul', 'st-obj');
      bullets.forEach(function (t) { var li = el('li'); li.textContent = t; ul.appendChild(li); });
      main.appendChild(ul);
    }
    grid.appendChild(main);
    if (aside) grid.appendChild(aside);
    s.appendChild(grid);
    var foot = el('footer', 'sl-foot st-foot');
    foot.appendChild(el('span', '', TITLE + ' · ' + SPEAKER));
    foot.appendChild(el('span', 'sl-num'));
    s.appendChild(foot);
    deck.appendChild(s);
    // shrink very long objective lists so the title slide never overflows
    var z = 1;
    while (s.scrollHeight > s.clientHeight + 1 && z > 0.6) { z -= 0.05; main.style.zoom = z; }
    return { slide: s, main: main };
  }

  // Try to place a block on the title slide (e.g. a short "golden rule" callout)
  function addToTitle(t, node) {
    var wrap = el('div', 'st-extra'); wrap.appendChild(node);
    t.main.appendChild(wrap);
    if (t.slide.scrollHeight > t.slide.clientHeight + 1) { t.main.removeChild(wrap); return false; }
    return true;
  }

  // ---------- fitting content onto slides ----------
  function Flow(kicker) { this.kicker = kicker; this.cur = null; this.prev = null; }

  // If the current slide is a nearly empty "(cont.)" slide, try to fold it back into the previous one
  Flow.prototype.tidy = function () {
    var c = this.cur, p = this.prev;
    if (!c || !p || !/ \(cont\.\)$/.test(c.title)) return;
    var used = c.inner.getBoundingClientRect().height / c.body.clientHeight;
    if (used > 0.3) return;
    var moved = Array.prototype.slice.call(c.inner.children);
    var before = p.inner.style.zoom || '';
    moved.forEach(function (n) { p.inner.appendChild(n); });
    var z = parseFloat(before) || 1;
    while (overflowing(p.body) && z > 0.8) { z = Math.round((z - 0.03) * 100) / 100; p.inner.style.zoom = z; }
    if (!overflowing(p.body)) { c.slide.remove(); this.cur = p; return; }
    p.inner.style.zoom = before;                       // didn't fit: put everything back
    moved.forEach(function (n) { c.inner.appendChild(n); });
  };

  Flow.prototype.start = function (title) { this.tidy(); this.prev = null; this.cur = contentSlide(this.kicker, title); };
  Flow.prototype.finish = function () { this.tidy(); };

  Flow.prototype.add = function (node) {
    if (!this.cur) this.start('Overview');
    var body = this.cur.body, inner = this.cur.inner;
    inner.appendChild(node);
    if (!overflowing(body)) return;
    // A slide that so far holds only intro paragraphs: keep them with this block instead of
    // leaving them alone on an almost empty slide
    var others = Array.prototype.filter.call(inner.children, function (c) { return c !== node; });
    if (others.length && others.every(function (c) { return c.tagName === 'P'; })) {
      var group = el('div', 'sl-group');
      others.forEach(function (c) { group.appendChild(c); });
      inner.removeChild(node); group.appendChild(node); inner.appendChild(group);
      node = group;
    }
    if (inner.children.length > 1) {
      // First try shrinking this slide slightly, so a small leftover doesn't get a slide of its own
      var before = inner.style.zoom || '';
      var z = parseFloat(before) || 1;
      while (overflowing(body) && z > 0.86) { z = Math.round((z - 0.03) * 100) / 100; inner.style.zoom = z; }
      if (!overflowing(body)) return;
      inner.style.zoom = before;
      // Otherwise move the block to a continuation slide
      inner.removeChild(node);
      var t = this.cur.title.replace(/ \(cont\.\)$/, '') + ' (cont.)';
      this.prev = this.cur;
      this.cur = contentSlide(this.kicker, t);
      body = this.cur.body; inner = this.cur.inner;
      inner.appendChild(node);
      if (!overflowing(body)) return;
    }
    // Still too tall on its own slide: scale it down to fit
    var zz = 1;
    while (overflowing(body) && zz > MIN_ZOOM) { zz = Math.round((zz - 0.05) * 100) / 100; node.style.zoom = zz; }
  };

  // ---------- builders ----------
  function buildHome(page) {
    var hero = page.querySelector('.hero-main');
    var card = page.querySelector('.speaker-card');
    titleSlide(
      hero.querySelector('.eyebrow').textContent,
      hero.querySelector('h1').textContent,
      hero.querySelector('.lead').textContent,
      null,
      card ? cleanClone(card) : null
    );
    var f = new Flow('Workshop overview');
    f.start('At a glance');
    var strip = page.querySelector('.info-strip');
    if (strip) f.add(cleanClone(strip));
    var principle = page.querySelector('.callout-principle');
    if (principle) f.add(cleanClone(principle));
    f.start('Workshop modules');
    var grid = page.querySelector('.module-grid');
    if (grid) f.add(cleanClone(grid));
  }

  function buildModule(page) {
    var head = page.querySelector('.module-head');
    var main = page.querySelector('.module-main');
    var eyebrow = head.querySelector('.eyebrow').textContent;
    var name = head.querySelector('h1').textContent;
    var leadEl = head.querySelector('.lead');
    var objectives = main.querySelector(':scope > .objectives');
    var bullets = objectives ? Array.prototype.map.call(objectives.querySelectorAll('li'), function (li) { return li.textContent.trim(); }) : null;

    var ts = titleSlide(eyebrow, name, leadEl ? leadEl.textContent : '', bullets, null);

    var f = new Flow(eyebrow + ' · ' + name);
    var seenSection = false;
    var pending = [];          // sub-headings and intro paragraphs waiting for the block they introduce
    var afterExercise = false;
    function flush() { pending.forEach(function (n) { f.add(n); }); pending = []; }

    Array.prototype.forEach.call(main.children, function (child) {
      if (child === head || child === objectives) return;
      if (child.matches('.pager, .print-bar, .toc')) return;

      if (child.tagName === 'H2') { flush(); f.start(child.textContent); seenSection = true; return; }
      if (!seenSection && !f.cur && child.matches('.callout') && addToTitle(ts, cleanClone(child))) return;

      if (child.matches('.exercise')) {
        flush();
        var h3 = child.querySelector('h3');
        f.start(h3 ? h3.textContent : 'Hands-on exercise');
        var ex = cleanClone(child);
        var exH = ex.querySelector('h3'); if (exH) exH.remove();
        f.add(ex);
        afterExercise = true;
        return;
      }

      if (afterExercise && child.matches('.callout-principle')) {
        flush();
        f.start('Key takeaway');
        f.add(cleanClone(child));
        return;
      }

      // Keep a sub-heading and up to two short intro paragraphs with the block they introduce
      if (/^H[3-5]$/.test(child.tagName)) { flush(); pending.push(cleanClone(child)); return; }
      if (child.tagName === 'P' && !child.matches('.note')) {
        if (pending.length >= 3) flush();
        pending.push(cleanClone(child));
        return;
      }

      var node = cleanClone(child);
      if (pending.length) {
        var group = el('div', 'sl-group');
        pending.forEach(function (n) { group.appendChild(n); });
        group.appendChild(node);
        node = group; pending = [];
      }
      f.add(node);
    });
    flush();
    f.finish();
  }

  function build(all) {
    destroy();
    document.body.classList.add('printing-slides');   // fixes the base font size before measuring
    deck = el('div', 'print-deck');
    deck.setAttribute('aria-hidden', 'true');
    document.body.appendChild(deck);
    var pages = all
      ? Array.prototype.slice.call(document.querySelectorAll('.page'))
      : [document.querySelector('.page:not([hidden])') || document.querySelector('.page')];
    pages.forEach(function (page) {
      if (page.dataset.page === 'home') buildHome(page); else buildModule(page);
    });
    var nums = deck.querySelectorAll('.sl-num');
    nums.forEach(function (n, i) { n.textContent = (i + 1) + ' / ' + nums.length; });
    document.body.classList.add('printing-slides');
    return nums.length;
  }

  function destroy() {
    if (deck) deck.remove();
    deck = null;
    document.body.classList.remove('printing-slides');
  }

  // Print buttons
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.print-btn');
    if (!btn) return;
    build(btn.dataset.print === 'all');
    window.print();
  });

  // Ctrl/Cmd+P or the browser menu: print the open tab as slides
  window.addEventListener('beforeprint', function () { if (!deck) build(false); });
  window.addEventListener('afterprint', destroy);

  // For testing: window.WorkshopSlides.build(true)
  window.WorkshopSlides = { build: build, destroy: destroy };
})();
