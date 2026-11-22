/* Co-author network, built in the browser from _data/publications.yml.
   Adding a paper to the publication list updates this graph automatically.
   The layout is computed once (no animation) with a seeded force simulation,
   so it looks the same on every visit. */
(function () {
  var root = document.querySelector('.netmap');
  if (!root) return;
  var me = root.getAttribute('data-me');
  var pubs;
  try { pubs = JSON.parse(root.querySelector('.netmap__data').textContent); } catch (e) { return; }

  // ---- build graph ---------------------------------------------------------
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
  var links = Object.keys(edges).map(function (k) { return edges[k]; });
  var count = document.getElementById('coauthor-count');
  if (count) count.textContent = String(list.length - 1);

  // ---- seeded force layout (computed synchronously) -----------------------
  var W = 900, H = 560, cx = W / 2, cy = H / 2;
  var seed = 7;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  list.sort(function (x, y) { return y.withMe - x.withMe || x.id.localeCompare(y.id); });
  list.forEach(function (n, i) {
    if (n.id === me) { n.x = cx; n.y = cy; return; }
    var ang = (i / list.length) * Math.PI * 2;
    var rad = 150 + rand() * 90;
    n.x = cx + Math.cos(ang) * rad; n.y = cy + Math.sin(ang) * rad * 0.8;
  });
  function r(n) { return n.id === me ? 18 : 6 + Math.sqrt(n.withMe) * 4; }
  var byId = {}; list.forEach(function (n) { byId[n.id] = n; n.vx = 0; n.vy = 0; });
  for (var it = 0; it < 500; it++) {
    var alpha = 1 - it / 500;
    // repulsion
    for (var i2 = 0; i2 < list.length; i2++) {
      for (var j2 = i2 + 1; j2 < list.length; j2++) {
        var p1 = list[i2], p2 = list[j2];
        var dx = p2.x - p1.x, dy = p2.y - p1.y, d2 = dx * dx + dy * dy + 0.01;
        var f = 2600 / d2;
        var d = Math.sqrt(d2);
        var minD = r(p1) + r(p2) + 46;
        if (d < minD) f += (minD - d) * 0.25;
        var fx = dx / d * f, fy = dy / d * f;
        p1.vx -= fx; p1.vy -= fy; p2.vx += fx; p2.vy += fy;
      }
    }
    // springs
    links.forEach(function (l) {
      var s = byId[l.a], t = byId[l.b];
      var dx = t.x - s.x, dy = t.y - s.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var target = (s.id === me || t.id === me) ? 170 - Math.min(l.w, 5) * 14 : 120;
      var k = 0.02 * (1 + Math.min(l.w, 4) * 0.2);
      var f = (d - target) * k;
      var fx = dx / d * f, fy = dy / d * f;
      s.vx += fx; s.vy += fy; t.vx -= fx; t.vy -= fy;
    });
    list.forEach(function (n) {
      if (n.id === me) { n.x = cx; n.y = cy; n.vx = n.vy = 0; return; }
      n.vx += (cx - n.x) * 0.004; n.vy += (cy - n.y) * 0.006;
      n.x += n.vx * alpha * 0.6; n.y += n.vy * alpha * 0.6;
      n.vx *= 0.5; n.vy *= 0.5;
      n.x = Math.max(70, Math.min(W - 70, n.x));
      n.y = Math.max(30, Math.min(H - 30, n.y));
    });
  }

  // fit the layout to the drawing area (keep "me" at the centre)
  var mdx = 1, mdy = 1;
  list.forEach(function (n) { mdx = Math.max(mdx, Math.abs(n.x - cx)); mdy = Math.max(mdy, Math.abs(n.y - cy)); });
  var sx = (W / 2 - 85) / mdx, sy = (H / 2 - 40) / mdy;
  list.forEach(function (n) { n.x = cx + (n.x - cx) * sx; n.y = cy + (n.y - cy) * sy; });

  // ---- render ---------------------------------------------------------------
  var svg = root.querySelector('.netmap__svg');
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }
  var gLinks = el('g', { 'class': 'netmap__links' });
  var gNodes = el('g', { 'class': 'netmap__nodes' });
  links.forEach(function (l) {
    var s = byId[l.a], t = byId[l.b];
    l.el = el('line', { x1: s.x, y1: s.y, x2: t.x, y2: t.y, 'stroke-width': Math.min(1 + l.w * 0.8, 5),
      'class': 'netmap__link' + ((s.id === me || t.id === me) ? ' netmap__link--me' : '') }, gLinks);
  });
  list.forEach(function (n) {
    var g = el('g', { 'class': 'netmap__node' + (n.id === me ? ' netmap__node--me' : ''), tabindex: n.id === me ? -1 : 0,
      role: 'button', 'aria-label': n.id + (n.id === me ? '' : ', ' + n.withMe + ' shared ' + (n.withMe === 1 ? 'paper' : 'papers')),
      transform: 'translate(' + n.x.toFixed(1) + ',' + n.y.toFixed(1) + ')' }, gNodes);
    el('circle', { r: r(n) }, g);
    var t = el('text', { y: r(n) + 13, 'text-anchor': 'middle' }, g);
    t.textContent = n.id;
    n.el = g;
    if (n.id !== me) {
      g.addEventListener('mouseenter', function () { highlight(n); });
      g.addEventListener('mouseleave', function () { highlight(selected); });
      g.addEventListener('click', function () { select(n); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(n); } });
    }
  });

  var selected = null;
  function highlight(n) {
    root.classList.toggle('is-focus', !!n);
    list.forEach(function (m) { m.el.classList.remove('is-on'); });
    links.forEach(function (l) { l.el.classList.remove('is-on'); });
    if (!n) return;
    n.el.classList.add('is-on'); byId[me].el.classList.add('is-on');
    links.forEach(function (l) {
      if (l.a === n.id || l.b === n.id) {
        l.el.classList.add('is-on');
        byId[l.a].el.classList.add('is-on'); byId[l.b].el.classList.add('is-on');
      }
    });
  }
  var panel = root.querySelector('.netmap__panel');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function select(n) {
    selected = n; highlight(n);
    var shared = n.papers.filter(function (p) { return (p.authors || []).indexOf(me) !== -1; });
    var html = '<h3 class="netmap__name">' + esc(n.id) + '</h3><p class="netmap__count">' + shared.length + ' shared ' +
      (shared.length === 1 ? 'publication' : 'publications') + '</p><ul class="netmap__papers">';
    shared.forEach(function (p) {
      var href = p.doi ? 'https://doi.org/' + p.doi : (p.url || (p.arxiv ? 'https://arxiv.org/abs/' + p.arxiv : ''));
      html += '<li>' + (href ? '<a href="' + esc(href) + '">' + esc(p.title) + '</a>' : esc(p.title)) +
        ' <span class="netmap__venue">' + esc(p.venue_short || '') + (p.year && String(p.venue_short || '').indexOf(String(p.year)) === -1 ? ', ' + p.year : '') + '</span></li>';
    });
    panel.innerHTML = html + '</ul>';
  }

  // accessible list
  var ul = root.querySelector('.netmap__list');
  list.filter(function (n) { return n.id !== me; })
    .sort(function (x, y) { return y.withMe - x.withMe || x.id.localeCompare(y.id); })
    .forEach(function (n) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = n.id + ' (' + n.withMe + ')';
      b.addEventListener('click', function () { select(n); });
      li.appendChild(b); ul.appendChild(li);
    });
})();
