/* ==========================================================
   排期日历 · calendar.js
   这一页只是「看」——数据从策划台那一份读，一个字段都不改。

   数据：localStorage 的 wb.planner.v1（跟 cards.html / planner.js 同一份）
     { v:1, at, months:{ '2026-11': [ {id,name,acct,due,st,note,ct} ] } }
   UI 状态（看哪个月、点了哪天、筛了谁）存在 wb.cal.v1，跟策划数据互不干扰。

   页面上认这些钩子：
     #mPrev #mNext #mToday #mNow #kpis #dayTitle #dayBody #daySum
     #strip #whoList #whoSum #noDue #grid #btnTheme
   ========================================================== */
(function () {
  'use strict';

  var PK = 'wb.planner.v1';      /* 策划数据（只读） */
  var CK = 'wb.cards.v1';        /* 主题跟卡片库共用一个 */
  var UK = 'wb.cal.v1';          /* 这一页自己的 UI 状态 */

  var ACCTS = [
    { n: '数码大号', c: 'a' },
    { n: '数码小号', c: 'b' },
    { n: '理想账号', c: 'c' },
    { n: '丹姐账号', c: 'd' },
    { n: '洗车账号', c: 'e' },
    { n: '临时项目', c: 'f' }
  ];
  var WK = ['一', '二', '三', '四', '五', '六', '日'];
  var ST = { todo: '未开始', doing: '进行中', done: '已完成' };

  var D = null;
  var S = { ym: '', sel: '', who: '' };

  function $(id) { return document.getElementById(id); }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function monthKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1); }
  function thisMonth() { return monthKey(new Date()); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function addDays(s, n) {
    var p = s.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2] + n);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function shiftMonth(ym, n) {
    var p = ym.split('-');
    var d = new Date(+p[0], +p[1] - 1 + n, 1);
    return monthKey(d);
  }
  function dayOf(ds) { return +ds.slice(8, 10); }
  function wdOf(ds) {
    var p = ds.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return WK[(d.getDay() + 6) % 7];
  }
  function acctColor(name) {
    for (var i = 0; i < ACCTS.length; i++) if (ACCTS[i].n === name) return ACCTS[i].c;
    return 'a';
  }

  /* ---------------- 数据 ---------------- */
  function load() {
    try { D = JSON.parse(localStorage.getItem(PK) || 'null'); } catch (e) { D = null; }
    if (!D || typeof D !== 'object') D = { v: 1, months: {} };
    if (!D.months || typeof D.months !== 'object') D.months = {};
  }
  function monthOf(ym) {
    var a = D.months[ym];
    return Array.isArray(a) ? a : [];
  }
  function isLate(p) {
    return (p.st || 'todo') !== 'done' && !!p.due && p.due < todayStr();
  }
  function isDone(p) { return (p.st || 'todo') === 'done'; }

  function saveUI() {
    try { localStorage.setItem(UK, JSON.stringify(S)); } catch (e) {}
  }
  function loadUI() {
    var u = null;
    try { u = JSON.parse(localStorage.getItem(UK) || 'null'); } catch (e) {}
    if (u && typeof u === 'object') {
      if (/^\d{4}-\d{2}$/.test(u.ym || '')) S.ym = u.ym;
      if (/^\d{4}-\d{2}-\d{2}$/.test(u.sel || '')) S.sel = u.sel;
      if (typeof u.who === 'string') S.who = u.who;
    }
    var h = (location.hash || '').replace('#', '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(h)) { S.sel = h; S.ym = h.slice(0, 7); }
    if (!S.ym) S.ym = thisMonth();
  }

  /* ---------------- 主题 ---------------- */
  function readTheme() {
    var t = '';
    try {
      var c = JSON.parse(localStorage.getItem(CK) || 'null');
      if (c && c.theme) t = c.theme;
    } catch (e) {}
    if (!t) {
      try {
        var d = JSON.parse(localStorage.getItem('wb.desk.v1') || 'null');
        if (d && d.theme) t = d.theme;
      } catch (e) {}
    }
    return t === 'dark' ? 'dark' : 'light';
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#1c1c1e' : '#f0eeec');
  }
  function toggleTheme() {
    var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(t);
    try {
      var c = JSON.parse(localStorage.getItem(CK) || 'null');
      if (!c || typeof c !== 'object' || !Array.isArray(c.wins)) c = null;
      if (c) { c.theme = t; localStorage.setItem(CK, JSON.stringify(c)); }
    } catch (e) {}
  }

  /* ---------------- 渲染：三块数字 ---------------- */
  function paintKpis() {
    var box = $('kpis');
    if (!box) return;
    var cur = monthOf(S.ym);
    var prev = monthOf(shiftMonth(S.ym, -1));
    var done = cur.filter(isDone).length;
    var late = cur.filter(isLate).length;
    var diff = cur.length - prev.length;
    var rate = cur.length ? Math.round(done / cur.length * 100) : 0;

    var delta = '';
    if (prev.length || cur.length) {
      var txt = diff > 0 ? '+' + diff : (diff < 0 ? String(diff) : '0');
      delta = '<i' + (diff === 0 ? ' class="is-quiet"' : '') + '>' + txt + '</i>';
    }

    box.innerHTML =
      '<div class="cl-kpi"><span>这个月排了</span><div><b>' + cur.length + '<em>条</em></b>' + delta + '</div></div>' +
      '<div class="cl-kpi"><span>已经做完</span><div><b>' + done + '<em>条</em></b><i' +
        (rate === 100 && cur.length ? '' : ' class="is-quiet"') + '>' + rate + '%</i></div></div>' +
      '<div class="cl-kpi"><span>压着没动</span><div><b' + (late ? ' class="is-bad"' : '') + '>' +
        late + '<em>条</em></b></div></div>';
  }

  /* ---------------- 渲染：选中那天 ---------------- */
  function paintDay() {
    var t = $('dayTitle'), b = $('dayBody'), s = $('daySum');
    if (!t || !b) return;
    var ds = S.sel;
    t.textContent = ds.slice(5, 7) + '/' + ds.slice(8, 10) + ' 周' + wdOf(ds);

    var list = monthOf(ds.slice(0, 7)).filter(function (p) {
      return p.due === ds && (!S.who || (p.acct || '') === S.who);
    }).sort(function (a, c) { return (a.ct || 0) - (c.ct || 0); });

    if (!list.length) {
      b.innerHTML = '<a class="cl-day-e" href="cards.html">+ 这天排一条</a>';
      if (s) s.textContent = '0 条';
      return;
    }

    b.innerHTML = list.map(function (p) {
      var st = p.st || 'todo';
      var late = isLate(p);
      var tag = esc(p.acct || '');
      var em = late ? '<em class="is-late">晚 ' + daysLate(p.due) + ' 天</em>'
        : (st === 'doing' ? '<em class="is-doing">在做</em>'
          : (st === 'done' ? '<em>做完了</em>' : ''));
      return '<div class="cl-dr' + (st === 'done' ? ' is-done' : '') + '" data-c="' + acctColor(p.acct) + '">' +
        '<i></i><div><b title="' + esc(p.name) + '">' + esc(p.name) + '</b>' +
        (tag || p.note ? '<span>' + tag + (p.note ? (tag ? ' · ' : '') + esc(p.note) : '') + '</span>' : '') +
        '</div>' + em + '</div>';
    }).join('');

    var dn = list.filter(isDone).length;
    var ln = list.filter(isLate).length;
    if (s) s.textContent = list.length + ' 条' + (dn ? ' · 完 ' + dn : '') + (ln ? ' · 晚 ' + ln : '');
  }
  function daysLate(due) {
    var a = new Date(due.replace(/-/g, '/'));
    var b = new Date(todayStr().replace(/-/g, '/'));
    return Math.max(1, Math.round((b - a) / 86400000));
  }

  /* ---------------- 渲染：接下来几天 ---------------- */
  function paintStrip() {
    var box = $('strip');
    if (!box) return;
    var start = (S.ym === thisMonth()) ? todayStr() : S.ym + '-01';
    var picks = [], d = start, i = 0;

    for (i = 0; i < 62 && picks.length < 5; i++) {
      if (d.slice(0, 7) !== S.ym) break;
      var ps = monthOf(d.slice(0, 7)).filter(function (p) {
        return p.due === d && (!S.who || (p.acct || '') === S.who);
      });
      if (ps.length) picks.push({ d: d, ps: ps });
      d = addDays(d, 1);
    }
    /* 排不满就接着往后补空日子，别在左边塞空卡 */
    d = picks.length ? addDays(picks[picks.length - 1].d, 1) : start;
    for (i = 0; i < 40 && picks.length < 5; i++) {
      if (d.slice(0, 7) === S.ym) picks.push({ d: d, ps: [] });
      d = addDays(d, 1);
    }
    picks.sort(function (a, b) { return a.d < b.d ? -1 : 1; });

    box.innerHTML = picks.map(function (o) {
      var dots = {};
      o.ps.forEach(function (p) { dots[acctColor(p.acct)] = 1; });
      var dotHtml = Object.keys(dots).map(function (c) {
        return '<i data-c="' + c + '"></i>';
      }).join('');
      return '<button class="cl-sc' + (o.d === S.sel ? ' is-on' : '') + (o.ps.length ? '' : ' is-empty') +
        '" type="button" data-d="' + o.d + '">' +
        '<span class="cl-sc-d"><b>' + o.d.slice(5, 7) + '/' + o.d.slice(8, 10) + '</b>周' + wdOf(o.d) + '</span>' +
        '<span class="cl-sc-n">' + o.ps.length + '<em>条</em></span>' +
        '<span class="cl-sc-dots">' + dotHtml + '</span></button>';
    }).join('');
  }

  /* ---------------- 渲染：账号列 ---------------- */
  function paintWho() {
    var box = $('whoList');
    if (!box) return;
    var cur = monthOf(S.ym);
    var sum = $('whoSum'), nd = $('noDue');
    if (sum) sum.textContent = cur.length;
    if (nd) {
      nd.textContent = cur.filter(function (p) { return !p.due; }).length;
    }

    var html = '<button class="cl-wh' + (S.who ? '' : ' is-on') + '" type="button" data-who="">' +
      '<i></i><b>全部</b><em>' + cur.length + '</em></button>';

    html += ACCTS.map(function (a) {
      var n = cur.filter(function (p) { return (p.acct || '') === a.n; }).length;
      return '<button class="cl-wh' + (S.who === a.n ? ' is-on' : '') + '" type="button" data-who="' + esc(a.n) + '" data-c="' + a.c + '">' +
        '<i></i><b>' + esc(a.n) + '</b><em>' + n + '</em></button>';
    }).join('');

    box.innerHTML = html;
  }

  /* ---------------- 渲染：月历 ---------------- */
  function paintGrid() {
    var box = $('grid');
    if (!box) return;
    var p = S.ym.split('-');
    var y = +p[0], m = +p[1];
    var first = new Date(y, m - 1, 1);
    var lead = (first.getDay() + 6) % 7;
    var days = new Date(y, m, 0).getDate();
    var total = Math.ceil((lead + days) / 7) * 7;
    var month = monthOf(S.ym);
    var byDay = {};
    month.forEach(function (it) {
      if (!it.due) return;
      if (S.who && (it.acct || '') !== S.who) return;
      (byDay[it.due] = byDay[it.due] || []).push(it);
    });

    var today = todayStr(), html = '';
    for (var i = 0; i < total; i++) {
      var dn = i - lead + 1;
      var inMonth = dn >= 1 && dn <= days;
      var ds = inMonth ? (S.ym + '-' + pad2(dn)) : '';
      var list = (ds && byDay[ds]) ? byDay[ds] : [];
      var cls = 'cl-cell';
      if (!inMonth) cls += ' is-dim';
      if (ds === today) cls += ' is-today';
      if (ds === S.sel) cls += ' is-sel';

      var head = '<span class="cl-dn"><u>' + (inMonth ? dn : (dn < 1 ? new Date(y, m - 1, dn).getDate() : dn - days)) + '</u>' +
        (list.length ? '<i>' + list.length + '</i>' : '') + '</span>';

      var body = '';
      if (list.length) {
        var shown = list.slice(0, 3);
        body = '<span class="cl-chips">' + shown.map(function (it) {
          return '<i class="cl-chip' + (isDone(it) ? ' is-done' : '') + '" data-c="' + acctColor(it.acct) +
            '" title="' + esc(it.name) + '">' + esc(it.name) + '</i>';
        }).join('') +
          (list.length > 3 ? '<i class="cl-more">+' + (list.length - 3) + '</i>' : '') +
          '</span><span class="cl-dots">' + list.slice(0, 4).map(function (it) {
            return '<u data-c="' + acctColor(it.acct) + '" title="' + esc(it.name) + '"></u>';
          }).join('') + '</span>';
      }
      html += '<div class="' + cls + '" data-d="' + ds + '">' + head + body + '</div>';
    }
    box.innerHTML = html;
  }

  function paintHead() {
    var y = S.ym.split('-');
    if ($('mNow')) $('mNow').textContent = (+y[1]) + ' 月 ' + y[0];
  }

  /* ---------------- 一把刷 ---------------- */
  function paint() {
    paintHead();
    paintKpis();
    paintDay();
    paintStrip();
    paintWho();
    paintGrid();
  }

  function pick(ds) {
    if (!ds) return;
    S.sel = ds;
    if (ds.slice(0, 7) !== S.ym) S.ym = ds.slice(0, 7);
    saveUI();
    try { history.replaceState(null, '', '#' + ds); } catch (e) {}
    paint();
  }
  function gotoMonth(ym) {
    S.ym = ym;
    var keep = S.sel.slice(0, 7) === ym ? S.sel : ym + '-01';
    S.sel = keep;
    saveUI();
    try { history.replaceState(null, '', '#' + keep); } catch (e) {}
    paint();
  }

  /* ---------------- 事件 ---------------- */
  document.addEventListener('click', function (e) {
    var cell = e.target.closest('.cl-cell');
    if (cell) { if (cell.getAttribute('data-d')) pick(cell.getAttribute('data-d')); return; }

    var sc = e.target.closest('.cl-sc');
    if (sc) { pick(sc.getAttribute('data-d')); return; }

    var wh = e.target.closest('.cl-wh');
    if (wh) {
      var w = wh.getAttribute('data-who') || '';
      S.who = (S.who === w) ? '' : w;
      saveUI();
      paint();
      return;
    }

    if (e.target.closest('#btnTheme')) { toggleTheme(); return; }
    if (e.target.closest('#mPrev')) { gotoMonth(shiftMonth(S.ym, -1)); return; }
    if (e.target.closest('#mNext')) { gotoMonth(shiftMonth(S.ym, 1)); return; }
    if (e.target.closest('#mToday')) { pick(todayStr()); return; }
  });

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowLeft') { gotoMonth(shiftMonth(S.ym, -1)); }
    else if (k === 'ArrowRight') { gotoMonth(shiftMonth(S.ym, 1)); }
    else if (k === 't' || k === 'T') { pick(todayStr()); }
    else if (k === 'Escape' && S.who) { S.who = ''; saveUI(); paint(); }
    else return;
    e.preventDefault();
  });

  /* ---------- 从云端补数据 ----------
     这一页只读不写，但"只读本地"会让新设备打开就是空的（策划台还没拉过）。
     所以自己取一次 desk-data.json 的 plans 那格，比左边新就铺进本地。
     永远不往云端写，改不了任何计划。 */
  var pulling = false;
  var lastPull = 0;

  function pullPlans(force) {
    if (pulling) return;
    if (!force && Date.now() - lastPull < 60000) return;
    pulling = true;
    lastPull = Date.now();

    fetch('desk-data.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        pulling = false;
        if (!d || !d.plans || typeof d.plans !== 'object') return;

        var rpat = d.pat || d.at || 0;
        var cur = null;
        try { cur = JSON.parse(localStorage.getItem(PK) || 'null'); } catch (e) { cur = null; }
        if (!cur || typeof cur !== 'object') cur = { v: 1, at: 0, months: {} };
        if (!(rpat > (cur.at || 0) + 800)) return;   /* 本地更新就别覆盖 */

        cur.months = d.plans;
        cur.at = rpat;
        cur.v = 1;
        try { localStorage.setItem(PK, JSON.stringify(cur)); } catch (e) { return; }

        var before = JSON.stringify(D && D.months);
        load();
        if (JSON.stringify(D.months) !== before) paint();
      })
      .catch(function () { pulling = false; });
  }

  /* 别的页面改了策划，切回来别拿旧的 */
  window.addEventListener('focus', function () {
    var before = JSON.stringify(D && D.months);
    load();
    if (JSON.stringify(D.months) !== before) paint();
    pullPlans(false);
  });
  window.addEventListener('pageshow', function (ev) {
    if (!ev.persisted) return;
    load();
    paint();
  });

  /* ---------------- 起 ---------------- */
  applyTheme(readTheme());
  load();
  loadUI();
  if (!S.sel || S.sel.slice(0, 7) !== S.ym) {
    S.sel = (S.ym === thisMonth()) ? todayStr() : (S.ym + '-01');
  }
  paint();
  pullPlans(true);
})();
