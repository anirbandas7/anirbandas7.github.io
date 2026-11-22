(function () {
  var root = document.documentElement;

  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
  }

  // Light / dark theme (follows the system setting until the visitor chooses)
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      if (!current) {
        current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // Publication type filter
  var filter = document.querySelector('.filter');
  if (filter) {
    filter.hidden = false;
    var buttons = filter.querySelectorAll('button');
    var items = document.querySelectorAll('.pub');
    var groups = document.querySelectorAll('.year-group');
    filter.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      var type = btn.getAttribute('data-filter');
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      items.forEach(function (li) {
        li.hidden = !(type === 'all' || li.getAttribute('data-type') === type);
      });
      groups.forEach(function (g) {
        g.hidden = g.querySelectorAll('.pub:not([hidden])').length === 0;
      });
    });
  }
})();
