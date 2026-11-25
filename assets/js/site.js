/* Site behaviour: navigation, theme, profile drawer, landing menu, quiet motion
   (reveal on scroll, counters, bars, rotating keyword) and publication filters.
   Everything degrades to static content without JavaScript, and motion is
   skipped when the visitor asks the system to reduce it. */
(function () {
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  // ---- top navigation on small screens --------------------------------------
  var navBtn = $('.nav-toggle'), nav = $('#site-nav');
  if (navBtn && nav) {
    navBtn.addEventListener('click', function () {
      var open = navBtn.getAttribute('aria-expanded') === 'true';
      navBtn.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
  }

  // ---- light / dark theme ---------------------------------------------------
  var themeBtn = $('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      if (!reduce) {
        root.classList.add('theme-anim');
        setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
      }
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // ---- profile sidebar as a drawer on small screens -------------------------
  var rail = $('#rail'), railBtn = $('.rail-toggle');
  function setRail(open) {
    if (!rail) return;
    rail.classList.toggle('is-open', open);
    doc.body.classList.toggle('rail-open', open);
    if (railBtn) railBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      var c = $('.rail__close', rail);
      if (c) setTimeout(function () { c.focus(); }, 50);
      revealRail();
    } else if (railBtn) {
      railBtn.focus();
    }
  }
  if (railBtn) railBtn.addEventListener('click', function () { setRail(!rail.classList.contains('is-open')); });
  $$('.rail__close, [data-close-rail]').forEach(function (b) { b.addEventListener('click', function () { setRail(false); }); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && rail && rail.classList.contains('is-open')) setRail(false);
  });

  // ---- landing menu ---------------------------------------------------------
  var lBtn = $('.landing__menu'), lNav = $('#landing-nav');
  function setLanding(open) {
    lBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      lNav.hidden = false;
      requestAnimationFrame(function () { lNav.classList.add('is-open'); });
      var first = $('a', lNav); if (first) first.focus();
    } else {
      lNav.classList.remove('is-open');
      setTimeout(function () { lNav.hidden = true; }, reduce ? 0 : 300);
    }
  }
  if (lBtn && lNav) {
    lBtn.addEventListener('click', function () { setLanding(lBtn.getAttribute('aria-expanded') !== 'true'); });
    lNav.addEventListener('click', function (e) { if (e.target === lNav || e.target.closest('a')) setLanding(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lBtn.getAttribute('aria-expanded') === 'true') { setLanding(false); lBtn.focus(); }
    });
  }

  // ---- landing: show the photo briefly, glide down, then put it away -----------
  // Once the visitor reaches the page, the cover is removed so scrolling up stops
  // at the top bar. The arrow button in the top bar is the only way back to it.
  var landing = $('.landing'), pageTop = $('#page'), coverBtn = $('.cover-btn');
  if (landing && pageTop) {
    var armed = true;
    var jump = function (y) { window.scrollTo({ top: y, behavior: 'instant' }); };
    var hideCover = function () {
      if (landing.classList.contains('is-gone')) return;
      var y = window.pageYOffset, h = pageTop.getBoundingClientRect().top + y;
      landing.classList.add('is-gone');
      jump(Math.max(0, y - h));
      if (coverBtn) coverBtn.hidden = false;
    };
    var watchCover = function () {
      if (landing.classList.contains('is-gone')) return;
      var t = pageTop.getBoundingClientRect().top;
      if (!armed) { if (t > 40) armed = true; return; }
      if (t <= 1) hideCover();
    };
    window.addEventListener('scroll', watchCover, { passive: true });
    if (window.location.hash) { requestAnimationFrame(function () { requestAnimationFrame(hideCover); }); }
    if (coverBtn) {
      coverBtn.addEventListener('click', function () {
        var y = window.pageYOffset;
        armed = false;
        landing.classList.remove('is-gone');
        coverBtn.hidden = true;
        jump(y + landing.offsetHeight);
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        if (lBtn) lBtn.focus({ preventScroll: true });
      });
    }
    if (!window.location.hash && !reduce) {
      var cancelled = false, cancel = function () { cancelled = true; };
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
        window.addEventListener(ev, cancel, { once: true, passive: true });
      });
      setTimeout(function () {
        if (cancelled || window.pageYOffset > 10 || landing.classList.contains('is-gone')) return;
        if (lBtn && lBtn.getAttribute('aria-expanded') === 'true') return;
        window.scrollTo({ top: pageTop.getBoundingClientRect().top + window.pageYOffset, behavior: 'smooth' });
      }, 2600);
    }
  }

  // ---- reveal on scroll (only for content below the fold) -------------------
  function groupIndex(el) {
    var g = el.parentElement && el.parentElement.closest('.reveal-group');
    return g ? $$('.reveal', g).indexOf(el) : 0;
  }
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, i = Math.max(0, groupIndex(el)), delay = i * 90;
        el.style.transitionDelay = delay + 'ms';
        el.classList.remove('reveal--wait');
        setTimeout(function () { el.style.transitionDelay = ''; }, 700 + delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    $$('.reveal').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.94) {
        el.classList.add('reveal--wait');
        io.observe(el);
      }
    });
  }

  // ---- counters --------------------------------------------------------------
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(end)) return;
    var t0 = null, dur = 1100;
    function tick(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = $$('[data-count]');
  if (counters.length && hasIO && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) {
      el.textContent = '0' + (el.getAttribute('data-suffix') || '');
      cio.observe(el);
    });
  }

  // ---- publication-type bars in the sidebar --------------------------------
  var barsDone = false;
  function revealRail() {
    if (barsDone) return;
    barsDone = true;
    $$('.bars').forEach(function (b) {
      setTimeout(function () { b.classList.remove('is-wait'); }, 120);
    });
  }
  if (!reduce) {
    $$('.bars').forEach(function (b) { b.classList.add('is-wait'); });
    if (rail && getComputedStyle(rail).visibility !== 'hidden') {
      requestAnimationFrame(function () { requestAnimationFrame(revealRail); });
    }
  }

  // ---- rotating keyword -----------------------------------------------------
  $$('.rotator').forEach(function (r) {
    var words = (r.getAttribute('data-words') || '').split('|').filter(Boolean);
    var w = $('.rotator__word', r);
    if (!w || words.length < 2 || reduce) return;
    var i = 0, paused = false;
    r.addEventListener('mouseenter', function () { paused = true; });
    r.addEventListener('mouseleave', function () { paused = false; });
    setInterval(function () {
      if (paused || doc.hidden) return;
      w.classList.add('is-out');
      setTimeout(function () {
        i = (i + 1) % words.length;
        w.textContent = words[i];
        w.classList.remove('is-out');
      }, 360);
    }, 3200);
  });

  // ---- copy email --------------------------------------------------------------
  $$('[data-copy]').forEach(function (b) {
    var label = b.querySelector('.reach__copy'), original = label ? label.textContent : '';
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy');
      var status = b.parentNode.querySelector('.mailrow__status');
      function done(ok) {
        b.classList.toggle('is-done', ok);
        var msg = ok ? (b.getAttribute('data-copied') || 'Copied') : 'Select the text to copy it';
        if (status) status.textContent = msg;
        if (label) label.textContent = ok ? 'Copied ' + text : text;
        setTimeout(function () {
          b.classList.remove('is-done');
          if (status) status.textContent = '';
          if (label) label.textContent = original;
        }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
    });
  });

  // ---- "Get in touch" menu: close on outside click or Escape -------------------
  $$('.reach').forEach(function (d) {
    doc.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && d.open) { d.open = false; $('summary', d).focus(); }
    });
  });

  // ---- photo strip viewer -------------------------------------------------------
  var pd = $('#photodialog');
  if (pd && typeof pd.showModal === 'function') {
    var shots = $$('.strip__item:not([aria-hidden]) .strip__btn'), cur = 0;
    var pImg = $('img', pd), pCap = $('figcaption', pd);
    var show = function (i) {
      cur = (i + shots.length) % shots.length;
      var b = shots[cur];
      pImg.src = b.getAttribute('data-full');
      pImg.alt = b.getAttribute('data-caption') || '';
      pCap.textContent = b.getAttribute('data-caption') || '';
    };
    $$('.strip__btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var full = b.getAttribute('data-full');
        var i = shots.map(function (x) { return x.getAttribute('data-full'); }).indexOf(full);
        show(i < 0 ? 0 : i);
        if (!pd.open) pd.showModal();
      });
    });
    $('.photodialog__prev, .photodialog__nav--prev', pd).addEventListener('click', function () { show(cur - 1); });
    $('.photodialog__nav--next', pd).addEventListener('click', function () { show(cur + 1); });
    $('.photodialog__close', pd).addEventListener('click', function () { pd.close(); });
    pd.addEventListener('click', function (e) { if (e.target === pd) pd.close(); });
    pd.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  // ---- reading progress and back-to-top ---------------------------------------
  var bar = $('.progress__bar'), ring = $('.rail__ring-bar'), totop = $('.totop'), page = $('#page'), ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.pageYOffset;
    var h = root.scrollHeight - window.innerHeight;
    var f = (h > 0 ? Math.min(1, y / h) : 0).toFixed(4);
    if (bar) bar.style.transform = 'scaleX(' + f + ')';
    if (ring) ring.style.strokeDasharray = f + ' 1';
    if (totop) totop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  if (totop) {
    totop.addEventListener('click', function () {
      var top = page && $('.landing') ? page.getBoundingClientRect().top + window.pageYOffset : 0;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  // ---- footer: total visits (GoatCounter) and my local time with an awake/asleep icon ----
  var svg = function (d, filled) {
    return '<svg class="site-foot__ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="' + d + '"' +
      (filled ? ' fill="currentColor" stroke="none"' : ' fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"') + '/></svg>';
  };
  var EYE = 'M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z';
  var MOON = 'M13 9.6A5.5 5.5 0 0 1 6.4 3a5.5 5.5 0 1 0 6.6 6.6z';
  var visits = $('.site-foot__visits');
  if (visits && window.fetch) {
    fetch(visits.getAttribute('data-goat') + '/counter/TOTAL.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || d.count == null) return;
        visits.innerHTML = svg(EYE) + '<span>' + String(d.count).replace(/\s/g, ',') + '</span>';
        visits.title = 'Visits to this site';
        visits.setAttribute('aria-label', d.count + ' visits');
        visits.hidden = false;
      })
      .catch(function () {});
  }
  var clock = $('.site-foot__clock');
  if (clock && window.Intl) {
    var tz = clock.getAttribute('data-tz') || 'Asia/Kolkata';
    var wake = parseInt(clock.getAttribute('data-wake'), 10), sleep = parseInt(clock.getAttribute('data-sleep'), 10);
    if (isNaN(wake)) wake = 7; if (isNaN(sleep)) sleep = 23;
    var fmt, hfmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
      hfmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' });
    } catch (e) { fmt = null; }
    if (fmt) {
      var tick = function () {
        var now = new Date(), h = parseInt(hfmt.format(now), 10) % 24;
        var asleep = sleep > wake ? (h >= sleep || h < wake) : (h >= sleep && h < wake);
        var t = fmt.format(now).replace(/\s?([ap])\.?m\.?$/i, function (m, x) { return ' ' + x.toLowerCase() + 'm'; });
        clock.classList.toggle('is-asleep', asleep);
        clock.innerHTML = (asleep ? svg(MOON, true) : '<span class="site-foot__dot" aria-hidden="true"></span>') + '<span>' + t + '</span>';
        var label = 'My local time: ' + t + (asleep ? ' (probably asleep, I\u2019ll reply later)' : ' (likely available)');
        clock.title = label; clock.setAttribute('aria-label', label);
        // the same status as a small light beside my name in the sidebar
        $$('[data-presence]').forEach(function (p) {
          var tip = asleep ? 'Probably asleep \u00b7 ' + t + ' my time' : 'Likely available \u00b7 ' + t + ' my time';
          p.classList.toggle('is-asleep', asleep);
          p.title = tip; p.setAttribute('aria-label', tip);
          p.hidden = false;
        });
      };
      tick(); clock.hidden = false;
      setInterval(tick, 30000);
    }
  }

  // ---- publication filters: type, theme and free-text search ------------------
  var tools = $('.pubtools');
  if (tools) {
    tools.hidden = false;
    var items = $$('.pub'), groups = $$('.year-group'), none = $('.pubs__none');
    var q = $('#pub-q'), status = $('.pubtools__status [role="status"]'), clear = $('.pubtools__clear');
    var typeBtns = $$('.filter button', tools), topicBtns = $$('.topics button', tools);
    var texts = items.map(function (li) { return li.textContent.toLowerCase().replace(/\s+/g, ' '); });
    var known = topicBtns.map(function (b) { return b.getAttribute('data-topic'); });
    var types = typeBtns.map(function (b) { return b.getAttribute('data-filter'); });
    var params = new URLSearchParams(window.location.search);
    var state = {
      type: types.indexOf(params.get('type')) > -1 ? params.get('type') : 'all',
      topic: known.indexOf(params.get('topic')) > -1 ? params.get('topic') : '',
      q: params.get('q') || ''
    };
    if (q) q.value = state.q;

    var apply = function () {
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
      items.forEach(function (li, i) {
        var topics = ' ' + (li.getAttribute('data-topics') || '') + ' ';
        var ok = (state.type === 'all' || li.getAttribute('data-type') === state.type) &&
          (!state.topic || topics.indexOf(' ' + state.topic + ' ') > -1) &&
          words.every(function (w) { return texts[i].indexOf(w) > -1; });
        if (ok && li.hidden && !reduce) {
          li.classList.remove('pub--in'); void li.offsetWidth; li.classList.add('pub--in');
        }
        li.hidden = !ok;
        if (ok) shown++;
      });
      groups.forEach(function (g) {
        var vis = $$('.pub:not([hidden])', g);
        g.hidden = !vis.length;
        $$('.pub', g).forEach(function (li) { li.classList.toggle('is-first', li === vis[0]); });
      });
      typeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === state.type)); });
      topicBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-topic') === state.topic)); });
      var filtered = state.type !== 'all' || !!state.topic || words.length > 0;
      if (status) status.textContent = filtered ? 'Showing ' + shown + ' of ' + items.length : items.length + ' publications';
      if (clear) clear.hidden = !filtered;
      if (none) none.hidden = shown !== 0;
      var p = new URLSearchParams();
      if (state.type !== 'all') p.set('type', state.type);
      if (state.topic) p.set('topic', state.topic);
      if (state.q) p.set('q', state.q);
      var qs = p.toString();
      try { history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash); } catch (e) {}
    };
    typeBtns.forEach(function (b) {
      b.addEventListener('click', function () { state.type = b.getAttribute('data-filter'); apply(); });
    });
    topicBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-topic');
        state.topic = state.topic === k ? '' : k; apply();
      });
    });
    var timer;
    if (q) q.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.q = q.value.trim(); apply(); }, 140);
    });
    if (clear) clear.addEventListener('click', function () {
      state = { type: 'all', topic: '', q: '' };
      if (q) q.value = '';
      apply();
    });
    apply();
  }
})();
