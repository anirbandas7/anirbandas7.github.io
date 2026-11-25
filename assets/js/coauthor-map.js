/* Co-author network, drawn in the browser from _data/publications.yml (embedded
   in every page as #pub-data). Adding a paper updates it automatically.
   The layout is computed once with a seeded force simulation, so it looks the
   same on every visit. A compact view sits in the sidebar; the expand button
   (or a click on a co-author) opens the full view with names and shared papers. */
(function () {
  var dataEl = document.getElementById('pub-data');
  if (!dataEl) return;
  var pubs;
  try { pubs = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function buildGraph(me) {
    var nodes = {}, edges = {};
    function node(name) {
      if (!nodes[name]) nodes[name] = { id: name, papers: [], withMe: 0 };
      return nodes[name];
    }
    pubs.forEach(function (p) {
      var authors = (p.authors || []).filter(function (a, i, arr) { return a && arr.indexOf(a) === i; });
      var hasMe = authors.indexOf(me) !== -1;
      authors.forEach(function (a) {
        var n = node(a);
        n.papers.push(p);
        if (hasMe && a !== me) n.withMe += 1;
      });
      for (var i = 0; i < authors.length; i++) {
        for (var j = i + 1; j < authors.length; j++) {
          var k = [authors[i], authors[j]].sort().join('||');
          edges[k] = edges[k] || { a: authors[i], b: authors[j], w: 0 };
          edges[k].w += 1;
        }
      }
    });
    var list = Object.keys(nodes).map(function (k) { return nodes[k]; });
    var byId = {};
    list.forEach(function (n) { byId[n.id] = n; });
    return { list: list, links: Object.keys(edges).map(function (k) { return edges[k]; }), byId: byId };
  }

  // Seeded force layout in a reference frame 900 units wide, then fitted to W x H.
  function layout(g, me, W, H, pad) {
    var RW = 900, RH = Math.round(900 * H / W), cx = RW / 2, cy = RH / 2;
    var list = g.list, byId = g.byId, seed = 7;
    function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function r(n) { return n.id === me ? 18 : 6 + Math.sqrt(n.withMe) * 4; }
    list.sort(function (x, y) { return y.withMe - x.withMe || x.id.localeCompare(y.id); });
    list.forEach(function (n, i) {
      n.vx = 0; n.vy = 0;
      if (n.id === me) { n.x = cx; n.y = cy; return; }
      var ang = (i / list.length) * Math.PI * 2, rad = 150 + rand() * 90;
      n.x = cx + Math.cos(ang) * rad; n.y = cy + Math.sin(ang) * rad * 0.8;
    });
    for (var it = 0; it < 500; it++) {
      var alpha = 1 - it / 500;
      for (var i = 0; i < list.length; i++) {
        for (var j = i + 1; j < list.length; j++) {
          var p1 = list[i], p2 = list[j];
          var dx = p2.x - p1.x, dy = p2.y - p1.y, d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2);
          var f = 2600 / d2, minD = r(p1) + r(p2) + 46;
          if (d < minD) f += (minD - d) * 0.25;
          var fx = dx / d * f, fy = dy / d * f;
          p1.vx -= fx; p1.vy -= fy; p2.vx += fx; p2.vy += fy;
        }
      }
      g.links.forEach(function (l) {
        var s = byId[l.a], t = byId[l.b];
        var dx = t.x - s.x, dy = t.y - s.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        var target = (s.id === me || t.id === me) ? 170 - Math.min(l.w, 5) * 14 : 120;
        var f = (d - target) * 0.02 * (1 + Math.min(l.w, 4) * 0.2);
        var fx = dx / d * f, fy = dy / d * f;
        s.vx += fx; s.vy += fy; t.vx -= fx; t.vy -= fy;
      });
      list.forEach(function (n) {
        if (n.id === me) { n.x = cx; n.y = cy; n.vx = n.vy = 0; return; }
        n.vx += (cx - n.x) * 0.004; n.vy += (cy - n.y) * 0.006;
        n.x += n.vx * alpha * 0.6; n.y += n.vy * alpha * 0.6;
        n.vx *= 0.5; n.vy *= 0.5;
        n.x = Math.max(70, Math.min(RW - 70, n.x));
        n.y = Math.max(30, Math.min(RH - 30, n.y));
      });
    }
    var mdx = 1, mdy = 1;
    list.forEach(function (n) { mdx = Math.max(mdx, Math.abs(n.x - cx)); mdy = Math.max(mdy, Math.abs(n.y - cy)); });
    var sx = (W / 2 - pad[0]) / mdx, sy = (H / 2 - pad[1]) / mdy;
    list.forEach(function (n) { n.x = W / 2 + (n.x - cx) * sx; n.y = H / 2 + (n.y - cy) * sy; });
  }

  function draw(root, opts) {
    var me = root.getAttribute('data-me');
    var svg = root.querySelector('.netmap__svg');
    var vb = (svg.getAttribute('viewBox') || '0 0 900 560').split(/[\s,]+/);
    var W = +vb[2], H = +vb[3], mini = !!opts.mini;
    var g = buildGraph(me);
    layout(g, me, W, H, mini ? [14, 14] : [85, 32]);
    function r(n) {
      if (mini) return n.id === me ? 9 : 3.4 + Math.sqrt(n.withMe) * 2.2;
      return n.id === me ? 18 : 6 + Math.sqrt(n.withMe) * 4;
    }
    function el(name, attrs, parent) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(e);
      return e;
    }
    svg.textContent = '';
    var gLinks = el('g', { 'class': 'netmap__links' });
    var gNodes = el('g', { 'class': 'netmap__nodes' });

    // draw-in order: from the centre outwards
    var order = g.list.slice().sort(function (a, b) {
      return Math.hypot(a.x - W / 2, a.y - H / 2) - Math.hypot(b.x - W / 2, b.y - H / 2);
    });
    order.forEach(function (n, i) { n.delay = i * (mini ? 30 : 24); });

    g.links.forEach(function (l) {
      var s = g.byId[l.a], t = g.byId[l.b];
      var sw = mini ? Math.min(0.7 + l.w * 0.5, 3) : Math.min(1 + l.w * 0.8, 5);
      l.el = el('line', { x1: s.x.toFixed(1), y1: s.y.toFixed(1), x2: t.x.toFixed(1), y2: t.y.toFixed(1), 'stroke-width': sw,
        'class': 'netmap__link' + ((s.id === me || t.id === me) ? ' netmap__link--me' : '') }, gLinks);
      l.el.style.setProperty('--d', Math.max(s.delay, t.delay) + 'ms');
    });
    g.list.forEach(function (n) {
      var isMe = n.id === me;
      var attrs = { 'class': 'netmap__node' + (isMe ? ' netmap__node--me' : ''),
        transform: 'translate(' + n.x.toFixed(1) + ',' + n.y.toFixed(1) + ')' };
      if (!mini && !isMe) {
        attrs.tabindex = 0; attrs.role = 'button';
        attrs['aria-label'] = n.id + ', ' + n.withMe + ' shared ' + (n.withMe === 1 ? 'paper' : 'papers');
      }
      var node = el('g', attrs, gNodes);
      node.style.setProperty('--d', n.delay + 'ms');
      el('circle', { r: r(n).toFixed(1) }, node);
      if (!mini) {
        var t = el('text', { y: (r(n) + 13).toFixed(1), 'text-anchor': 'middle' }, node);
        t.textContent = n.id;
      }
      n.el = node;
    });

    var selected = null;
    function highlight(n) {
      root.classList.toggle('is-focus', !!n);
      g.list.forEach(function (m) { m.el.classList.remove('is-on'); });
      g.links.forEach(function (l) { l.el.classList.remove('is-on'); });
      if (!n) return;
      n.el.classList.add('is-on');
      g.links.forEach(function (l) {
        if (l.a === n.id || l.b === n.id) {
          l.el.classList.add('is-on');
          g.byId[l.a].el.classList.add('is-on'); g.byId[l.b].el.classList.add('is-on');
        }
      });
    }

    var tip = root.querySelector('.netmap__tip');
    function showTip(n) {
      if (!tip) return;
      var box = svg.getBoundingClientRect(), k = box.width / W;
      var x = Math.max(70, Math.min(box.width - 70, n.x * k));
      tip.innerHTML = '<strong>' + esc(n.id) + '</strong>' + (n.id === me ? '' :
        '<span>' + n.withMe + ' shared ' + (n.withMe === 1 ? 'paper' : 'papers') + '</span>');
      tip.style.left = x + 'px';
      tip.style.top = (n.y * k - r(n) * k) + 'px';
      tip.hidden = false;
    }
    function hideTip() { if (tip) tip.hidden = true; }

    var panel = root.querySelector('.netmap__panel');
    function select(n) {
      selected = n; highlight(n);
      if (!panel) return;
      var shared = n.papers.filter(function (p) { return (p.authors || []).indexOf(me) !== -1; });
      var html = '<h3 class="netmap__name">' + esc(n.id) + '</h3><p class="netmap__count">' + shared.length + ' shared ' +
        (shared.length === 1 ? 'publication' : 'publications') + '</p><ul class="netmap__papers">';
      shared.forEach(function (p, i) {
        var href = p.doi ? 'https://doi.org/' + p.doi : (p.url || (p.arxiv ? 'https://arxiv.org/abs/' + p.arxiv : ''));
        var vs = String(p.venue_short || '');
        html += '<li style="animation-delay:' + (i * 50) + 'ms">' + (href ? '<a href="' + esc(href) + '">' + esc(p.title) + '</a>' : esc(p.title)) +
          ' <span class="netmap__venue">' + esc(vs) + (p.year && vs.indexOf(String(p.year)) === -1 ? (vs ? ', ' : '') + p.year : '') + '</span></li>';
      });
      panel.innerHTML = html + '</ul>';
    }

    g.list.forEach(function (n) {
      var node = n.el, isMe = n.id === me;
      if (mini) {
        node.addEventListener('mouseenter', function () { if (!isMe) highlight(n); showTip(n); });
        node.addEventListener('mouseleave', function () { highlight(null); hideTip(); });
        if (!isMe) node.addEventListener('click', function () { hideTip(); if (opts.onPick) opts.onPick(n.id); });
      } else if (!isMe) {
        node.addEventListener('mouseenter', function () { highlight(n); });
        node.addEventListener('mouseleave', function () { highlight(selected); });
        node.addEventListener('click', function () { select(n); });
        node.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(n); }
        });
      }
    });

    var ul = root.querySelector('.netmap__list');
    if (ul) {
      ul.textContent = '';
      g.list.filter(function (n) { return n.id !== me; })
        .sort(function (x, y) { return y.withMe - x.withMe || x.id.localeCompare(y.id); })
        .forEach(function (n) {
          var li = document.createElement('li'), b = document.createElement('button');
          b.type = 'button';
          b.textContent = n.id + ' (' + n.withMe + ')';
          b.addEventListener('click', function () { select(n); });
          li.appendChild(b); ul.appendChild(li);
        });
    }

    function play() {
      if (reduce) return;
      root.classList.add('is-pre');
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('is-pre'); }); });
      var last = order.length ? order[order.length - 1].delay : 0;
      setTimeout(function () {
        g.list.forEach(function (n) { n.el.style.removeProperty('--d'); });
        g.links.forEach(function (l) { l.el.style.removeProperty('--d'); });
      }, last + 900);
    }

    return {
      play: play,
      select: function (name) { if (g.byId[name] && name !== me) select(g.byId[name]); }
    };
  }

  // ---- full view in a dialog -----------------------------------------------------
  var dlg = document.getElementById('netdialog');
  var fullRoot = dlg && dlg.querySelector('.netmap--full');
  var full = null;
  function openFull(name) {
    if (!dlg || !fullRoot) return;
    var first = !full;
    if (first) full = draw(fullRoot, { mini: false });
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute('open', '');
    if (first) full.play();
    if (name) full.select(name);
  }
  function closeFull() {
    if (!dlg) return;
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-open-network]')) openFull();
    else if (e.target.closest('[data-close-network]')) closeFull();
  });
  if (dlg) dlg.addEventListener('click', function (e) { if (e.target === dlg) closeFull(); });

  // ---- compact view(s) in the sidebar ------------------------------------------
  Array.prototype.forEach.call(document.querySelectorAll('.netmap--mini'), function (root) {
    if (!reduce) root.classList.add('is-pre');
    var api = draw(root, { mini: true, onPick: openFull });
    if (reduce) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { api.play(); io.disconnect(); } });
      }, { threshold: 0.3 });
      io.observe(root);
    } else {
      api.play();
    }
  });
  // ---- Publications page: carry the network from the sidebar to the right column ----
  // The section glides from where it sits in the sidebar to its slot beside the list
  // (FLIP: measure, move in the DOM, then animate from the old spot to the new one).
  var slot = document.querySelector('[data-net-slot]');
  var sec = document.querySelector('.rail__sec--net');
  if (slot && sec) {
    var home = document.createComment('network home');
    sec.parentNode.insertBefore(home, sec);
    var wide = window.matchMedia('(min-width: 75rem)');
    var place = function (animate) {
      var target = wide.matches ? slot : home.parentNode;
      if (sec.parentNode === target) return;
      var a = sec.getBoundingClientRect();
      if (target === slot) slot.appendChild(sec); else home.parentNode.insertBefore(sec, home.nextSibling);
      if (!animate || reduce || !a.width) return;
      var b = sec.getBoundingClientRect();
      // if the sidebar copy was scrolled out of view, start from just inside the bottom of the screen
      var top = Math.min(Math.max(a.top, 0), window.innerHeight - a.height * 0.5);
      var s = a.width / b.width;
      sec.classList.add('is-moving');
      sec.style.transformOrigin = '0 0';
      sec.style.transition = 'none';
      sec.style.opacity = '0.35';
      sec.style.transform = 'translate(' + (a.left - b.left) + 'px,' + (top - b.top) + 'px) scale(' + s + ')';
      sec.getBoundingClientRect();
      sec.style.transition = 'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease';
      sec.style.transform = '';
      sec.style.opacity = '';
      var done = function (e) {
        if (e && e.propertyName !== 'transform') return;
        sec.classList.remove('is-moving');
        sec.style.transition = ''; sec.style.transformOrigin = '';
        sec.removeEventListener('transitionend', done);
      };
      sec.addEventListener('transitionend', done);
    };
    var start = function () { requestAnimationFrame(function () { setTimeout(function () { place(true); }, 350); }); };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
    var onChange = function () { place(false); };
    if (wide.addEventListener) wide.addEventListener('change', onChange); else if (wide.addListener) wide.addListener(onChange);
  }
})();
