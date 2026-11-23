/* ==========================================================
   内容策划 · planner.js
   一屏一个月的活：上面一排账号进度、一排阶段，下面左边清单右边写卡。

   数据还是那一份：localStorage 的 wb.planner.v1
     { v:1, at:<时间戳>, theme:'light', lastAcct:'…', months:{ '2026-11': [ 计划… ] } }
   跟卡片库（wb.cards.v1）、画布（wb.desk.v1）分开存；
   同步时是云端文件里的第三格，谁也不覆盖谁。

   页面上认这些钩子（改版式别动它们）：
     #plTiles  #plBars  #plRows  #plForm  #plNew  #plNewTog
     #plYm #plYr #plNowSub #plPrev #plNext #plToday #plPick
     #plClear #plSumSub #plTrackFill #fName #fAcct #fDue #fNote #fSt #plAdd
     行：.pl-item[data-id]，内部 [data-act="st"|"note"|"del"]
   ========================================================== */
(function () {
  'use strict';

  var PK = 'wb.planner.v1';
  var ACCTS = [
    { n: '数码大号', s: '大', c: 'a' },
    { n: '数码小号', s: '小', c: 'b' },
    { n: '理想账号', s: '理', c: 'c' },
    { n: '丹姐账号', s: '丹', c: 'd' },
    { n: '洗车账号', s: '洗', c: 'e' },
    { n: '临时项目', s: '临', c: 'f' }
  ];
  var ST = { todo: '未开始', doing: '进行中', done: '已完成' };
  var STAGES = [
    { k: 'todo', n: '未开始' },
    { k: 'doing', n: '进行中' },
    { k: 'done', n: '已完成' },
    { k: 'late', n: '逾期' }
  ];

  /* 合并进 cards.html 之后，主题、同步、顶栏按钮都归 cards.js，
     这边只管清单本身 */
  var SHARED = !!window.CDSHARED;

  var D = null;
  var ym = '';            /* 当前看的月份 'YYYY-MM' */
  var filter = 'all';     /* all / todo / doing / done / late / week */
  var acctFilter = '';    /* 空 = 六个账号一起看 */
  var frozen = false;     /* 云端刚覆盖、正要重载：别再往回写 */
  var saveT = null, toastT = null, armT = null, armId = null;

  function $(id) { return document.getElementById(id); }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function monthKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1); }
  function thisMonth() { return monthKey(new Date()); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function ymNum(k) { return parseInt(k.split('-')[1], 10); }
  function ymYear(k) { return k.split('-')[0]; }
  function addDays(s, n) {
    var p = s.split('-');
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10) + n);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function mmdd(s) { return s ? s.slice(5, 7) + '/' + s.slice(8, 10) : ''; }

  function toast(msg) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove('is-on'); }, 2400);
  }

  /* ---------------- 数据 ---------------- */
  function load() {
    try { D = JSON.parse(localStorage.getItem(PK) || 'null'); } catch (e) { D = null; }
    if (!D || typeof D !== 'object') D = { v: 1, at: 0, months: {} };
    if (!D.months || typeof D.months !== 'object') D.months = {};
    return D;
  }
  function saveNow() {
    if (frozen || window.__wbReloading) return;   /* 正在按云端数据重载，别再往回写 */
    D.at = Date.now();
    try { localStorage.setItem(PK, JSON.stringify(D)); }
    catch (e) { toast('没存上：' + ((e && e.message) || e)); }
    if (window.WBSync) window.WBSync.pushSoon();
  }
  function saveSoon() {
    clearTimeout(saveT);
    saveT = setTimeout(saveNow, 420);
  }
  function list() {
    if (!D.months[ym]) D.months[ym] = [];
    return D.months[ym];
  }
  function monthOf(k) {
    var a = D.months[k];
    return Array.isArray(a) ? a : [];
  }
  /* 只取当前账号那一份；没选账号就是全部 */
  function view() {
    var a = list();
    if (!acctFilter) return a;
    return a.filter(function (p) { return (p.acct || '') === acctFilter; });
  }
  /* 截止日期在前，没日期的垫底；同一天按加进来的先后 */
  function sortOf(arr) {
    return arr.slice().sort(function (a, b) {
      var x = a.due || '', y = b.due || '';
      if (x && !y) return -1;
      if (!x && y) return 1;
      if (x !== y) return x < y ? -1 : 1;
      return (a.ct || 0) - (b.ct || 0);
    });
  }

  /* ---------------- 算法 ---------------- */
  function isLate(p) {
    return (p.st || 'todo') !== 'done' && !!p.due && p.due < todayStr();
  }
  function isWeek(p) {
    var t = todayStr();
    return (p.st || 'todo') !== 'done' && !!p.due && p.due >= t && p.due <= addDays(t, 7);
  }
  function counts() {
    var a = view();
    var c = { all: a.length, todo: 0, doing: 0, done: 0, late: 0, week: 0 };
    a.forEach(function (p) {
      var st = p.st || 'todo';
      c[st] = (c[st] || 0) + 1;
      if (isLate(p)) c.late++;
      if (isWeek(p)) c.week++;
    });
    c.rate = c.all ? Math.round(c.done / c.all * 100) : 0;
    return c;
  }
  function statOf(arr) {
    var s = { all: arr.length, done: 0, doing: 0, todo: 0, rate: 0 };
    arr.forEach(function (p) { var st = p.st || 'todo'; s[st] = (s[st] || 0) + 1; });
    s.rate = s.all ? Math.round(s.done / s.all * 100) : 0;
    return s;
  }
  function prevKey() {
    var d = new Date(parseInt(ymYear(ym), 10), ymNum(ym) - 2, 1);
    return monthKey(d);
  }
  /* 环比只用箭头 + 数字，不写句子 */
  function dOf(now, last) {
    if (!last) return '';
    if (now > last) return '↑' + (now - last);
    if (now < last) return '↓' + (last - now);
    return '';
  }

  /* ---------------- 画画 ---------------- */
  function paintHead() {
    var y = $('plYr');
    if (y) y.textContent = ymYear(ym);
    var m = $('plYm');
    if (m) m.textContent = ymNum(ym) + ' 月';
  }

  /* 一排账号：交到什么程度，点一下就只看它 */
  function paintTiles() {
    var all = list();
    var tAll = 0, tDone = 0;
    var cards = ACCTS.map(function (x) {
      var mine = all.filter(function (p) { return (p.acct || '') === x.n; });
      var d = mine.filter(function (p) { return (p.st || 'todo') === 'done'; }).length;
      var pct = mine.length ? Math.round(d / mine.length * 100) : 0;
      tAll += mine.length; tDone += d;
      var on = acctFilter === x.n ? ' is-on' : '';
      return '<button type="button" class="lf-kpi-c' + on + '" data-acct="' + esc(x.n) + '"' +
        ' aria-pressed="' + (acctFilter === x.n ? 'true' : 'false') + '"' +
        ' title="' + esc(x.n) + ' · 完成 ' + d + ' / ' + mine.length + '">' +
        '<span class="lf-kpi-h"><i class="lf-dot" data-c="' + x.c + '"></i>' + esc(x.n) + '</span>' +
        '<b class="lf-kpi-v' + (mine.length ? '' : ' is-void') + '">' +
          (mine.length ? pct + '<em>%</em>' : '—') +
        '</b>' +
        '<span class="lf-kpi-bar"><i style="width:' + pct + '%"></i></span>' +
        '<span class="lf-kpi-f">' + d + ' / ' + mine.length + '</span>' +
      '</button>';
    });

    var rate = tAll ? Math.round(tDone / tAll * 100) : 0;
    cards.push('<div class="lf-kpi-c is-accent">' +
      '<span class="lf-kpi-h">完成率</span>' +
      '<b class="lf-kpi-v"><span id="plRate">' + rate + '</span><em>%</em></b>' +
      '<span class="lf-kpi-bar"><i style="width:' + rate + '%"></i></span>' +
      '<span class="lf-kpi-f">' + tDone + ' / ' + tAll + '</span>' +
    '</div>');

    var box = $('plTiles');
    if (box) box.innerHTML = cards.join('');
  }

  /* 一排阶段：未开始 / 进行中 / 已完成 / 逾期（黑的）。点一下只看那一档 */
  function paintBars() {
    var a = view();
    var n = { todo: 0, doing: 0, done: 0, late: 0 };
    a.forEach(function (p) {
      n[p.st || 'todo'] = (n[p.st || 'todo'] || 0) + 1;
      if (isLate(p)) n.late++;
    });
    var all = a.length || 1;

    var box = $('plBars');
    if (!box) return;
    box.innerHTML = STAGES.map(function (s) {
      var v = n[s.k] || 0;
      var pct = Math.round(v / all * 100);
      var on = filter === s.k ? ' is-on' : '';
      var bk = s.k === 'late' ? ' is-black' : '';
      return '<button type="button" class="lf-pa' + on + bk + '" data-f="' + s.k + '"' +
        ' aria-pressed="' + (filter === s.k ? 'true' : 'false') + '" title="只看' + s.n + '">' +
        '<span class="lf-pa-h"><span class="lf-pa-n"><i class="lf-pa-d"></i>' + s.n + '</span>' +
          '<i>' + pct + '%</i></span>' +
        '<span class="lf-pa-bar"><b style="width:' + pct + '%"></b></span>' +
        '<span class="lf-pa-v">' + v + '<em>条</em></span>' +
      '</button>';
    }).join('');
  }

  function paintTrack() {
    var c = counts();
    var fill = $('plTrackFill');
    if (fill) {
      fill.style.width = c.rate + '%';
      fill.setAttribute('data-p', c.rate);
    }
  }

  /* 有筛选就在标题后面挂一个小 pill，没有就空着 */
  function paintFilterTag() {
    var lab = { all: '', todo: '未开始', doing: '进行中', done: '已完成', late: '逾期', week: '本周' }[filter] || '';
    var bits = [];
    if (acctFilter) bits.push(acctFilter);
    if (lab) bits.push(lab);
    var tag = $('plSumSub');
    if (tag) {
      tag.textContent = bits.join(' · ');
      tag.classList.toggle('is-on', bits.length > 0);
    }
    var clr = $('plClear');
    if (clr) clr.hidden = (filter === 'all' && !acctFilter);
  }

  /* 日期在左，只有「晚几天 / 还有几天」这种相对话 */
  function relText(p) {
    if (!p.due) return { t: '', cls: 'is-none' };
    if ((p.st || 'todo') === 'done') return { t: '', cls: '' };
    var now = todayStr();
    if (p.due < now) {
      var dd = Math.round((new Date(now) - new Date(p.due)) / 86400000);
      return { t: '晚 ' + dd + ' 天', cls: 'is-late' };
    }
    if (p.due === now) return { t: '今天', cls: 'is-today' };
    var left = Math.round((new Date(p.due) - new Date(now)) / 86400000);
    return { t: '还有 ' + left + ' 天', cls: '' };
  }

  function rowHTML(p) {
    var st = p.st || 'todo';
    var rel = relText(p);
    var opts = Object.keys(ST).map(function (k) {
      return '<option value="' + k + '"' + (k === st ? ' selected' : '') + '>' + ST[k] + '</option>';
    }).join('');

    return '<div class="pl-item' + (st === 'done' ? ' is-done' : '') + '" data-id="' + p.id + '">' +
      '<span class="lr-d' + (p.due ? '' : ' is-none') + '">' + (p.due ? mmdd(p.due) : '—') + '</span>' +
      '<div class="lr-b">' +
        '<div class="lr-1">' +
          '<span class="lr-n" title="' + esc(p.name) + '">' + esc(p.name) + '</span>' +
          '<i class="lr-a" data-c="' + (acctColor(p.acct)) + '">' + esc(p.acct || '未分') + '</i>' +
        '</div>' +
        '<div class="lr-2">' +
          (rel.t ? '<span class="lr-t ' + rel.cls + '">' + rel.t + '</span>' : '') +
          '<input class="lr-note" type="text" data-act="note" value="' + esc(p.note || '') +
            '" placeholder="备注" spellcheck="false" aria-label="备注">' +
        '</div>' +
      '</div>' +
      '<span class="lr-stw">' +
        '<select class="lr-st is-' + st + '" data-act="st" aria-label="进度">' + opts + '</select>' +
      '</span>' +
      '<button class="lr-x' + (armId === p.id ? ' is-armed' : '') + '" type="button" data-act="del"' +
        ' title="删掉这条" aria-label="删掉">' + (armId === p.id ? '删?' : '✕') + '</button>' +
    '</div>';
  }

  function acctColor(n) {
    for (var i = 0; i < ACCTS.length; i++) if (ACCTS[i].n === n) return ACCTS[i].c;
    return 'g';
  }

  function paintRows() {
    var box = $('plRows');
    if (!box) return;
    var arr = sortOf(view()).filter(function (p) {
      var st = p.st || 'todo';
      if (filter === 'all') return true;
      if (filter === 'late') return isLate(p);
      if (filter === 'week') return isWeek(p);
      return st === filter;
    });

    if (!arr.length) {
      var noneAll = !view().length;
      box.innerHTML = '<div class="lf-empty">' + (noneAll ? '这月还没排' : '这一档没有') + '</div>';
      return;
    }
    box.innerHTML = arr.map(rowHTML).join('');
  }

  function paintNow() {
    var c = counts();
    var rate = $('plRate');
    if (rate) rate.textContent = c.rate;
    var sub = $('plNowSub');
    if (sub) sub.textContent = c.all ? ((c.all - c.done) + ' 条没交') : '';

    var pick = $('plPick');
    if (pick && pick.value !== ym) pick.value = ym;
    var today = $('plToday');
    if (today) today.disabled = (ym === thisMonth());
  }

  function paintAll() {
    paintHead();
    paintTiles();
    paintBars();
    paintFilterTag();
    paintTrack();
    paintRows();
    paintNow();
    /* 数据变了：日历视图挂在同一页，让它自己重画（没监听就什么也不发生） */
    try { document.dispatchEvent(new CustomEvent('wb:plans')); } catch (e) {}
  }

  /* ---------------- 月份 ---------------- */
  function shiftMonth(n) {
    var d = new Date(parseInt(ymYear(ym), 10), ymNum(ym) - 1 + n, 1);
    ym = monthKey(d);
    paintAll();
  }
  function gotoMonth(k) {
    if (!/^\d{4}-\d{2}$/.test(k || '')) return;
    ym = k;
    filter = 'all';
    paintAll();
  }

  /* ---------------- 增删改 ---------------- */
  function addPlan() {
    var name = ($('fName').value || '').trim();
    if (!name) { $('fName').focus(); toast('先写个名称'); return; }
    var p = {
      id: uid(),
      name: name,
      acct: $('fAcct').value || ACCTS[0].n,
      due: $('fDue').value || '',
      note: ($('fNote').value || '').trim(),
      st: $('fSt').value || 'todo',
      ct: Date.now()
    };
    list().push(p);
    saveNow();
    $('fName').value = '';
    $('fNote').value = '';
    $('fSt').value = 'todo';
    filter = 'all';
    if (acctFilter && acctFilter !== p.acct) acctFilter = '';
    paintAll();
    $('fName').focus();
    toast('加上了 · ' + p.acct);
  }

  function delPlan(id) {
    var a = list(), i = -1;
    for (var k = 0; k < a.length; k++) if (a[k].id === id) { i = k; break; }
    if (i < 0) return;
    var nm = a[i].name;
    a.splice(i, 1);
    saveNow();
    armId = null;
    paintAll();
    toast('删了：' + nm);
  }

  function find(id) {
    var m = list();
    for (var i = 0; i < m.length; i++) if (m[i].id === id) return m[i];
    return null;
  }

  /* ---------------- 主题 ---------------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#141416' : '#f0eeec');
  }

  /* ---------------- 起 ---------------- */
  load();

  if (!SHARED) {
    if (!D.theme) {
      try {
        var c0 = JSON.parse(localStorage.getItem('wb.cards.v1') || 'null');
        if (c0 && c0.theme) D.theme = c0.theme;
        else {
          var k0 = JSON.parse(localStorage.getItem('wb.desk.v1') || 'null');
          if (k0 && k0.theme) D.theme = k0.theme;
        }
      } catch (e) {}
    }
    applyTheme(D.theme === 'dark' ? 'dark' : 'light');
  }

  ym = thisMonth();

  /* 账号下拉 */
  (function () {
    var sel = $('fAcct');
    if (!sel) return;
    sel.innerHTML = ACCTS.map(function (a) {
      return '<option value="' + esc(a.n) + '">' + esc(a.n) + '</option>';
    }).join('');
    if (D.lastAcct && ACCTS.some(function (a) { return a.n === D.lastAcct; })) sel.value = D.lastAcct;
  })();

  paintAll();

  /* ---------------- 事件 ---------------- */
  /* 「加一条」：平时收成一行，点开才出表单 */
  var newBox = $('plNew'), newTog = $('plNewTog');
  function newOpen(open) {
    if (!newBox) return;
    newBox.classList.toggle('is-open', open);
    if (newTog) newTog.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) setTimeout(function () { var f = $('fName'); if (f) f.focus(); }, 40);
  }
  if (newTog) newTog.addEventListener('click', function () {
    newOpen(!newBox.classList.contains('is-open'));
  });

  /* 顶栏那颗黑按钮：展开表单，滚到能看见 */
  var addTop = $('plAddTop');
  if (addTop) addTop.addEventListener('click', function () {
    newOpen(true);
    if (newBox) newBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  if ($('plForm')) $('plForm').addEventListener('submit', function (e) {
    e.preventDefault();
    addPlan();
  });

  if ($('plPrev')) $('plPrev').addEventListener('click', function () { shiftMonth(-1); });
  if ($('plNext')) $('plNext').addEventListener('click', function () { shiftMonth(1); });
  if ($('plToday')) $('plToday').addEventListener('click', function () { gotoMonth(thisMonth()); });
  if ($('plPick')) $('plPick').addEventListener('change', function () {
    if (this.value) gotoMonth(this.value);
    else this.value = ym;
  });

  /* 账号卡：点一下只看它，再点一下放开 */
  if ($('plTiles')) $('plTiles').addEventListener('click', function (e) {
    var b = e.target.closest('[data-acct]');
    if (!b) return;
    var n = b.getAttribute('data-acct');
    acctFilter = (acctFilter === n) ? '' : n;
    filter = 'all';
    armId = null;
    paintAll();
  });

  /* 阶段卡：点一下只看那一档 */
  if ($('plBars')) $('plBars').addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]');
    if (!b) return;
    var f = b.getAttribute('data-f') || 'all';
    filter = (filter === f) ? 'all' : f;
    armId = null;
    paintBars();
    paintFilterTag();
    paintRows();
    paintTrack();
  });

  if ($('plClear')) $('plClear').addEventListener('click', function () {
    filter = 'all';
    acctFilter = '';
    armId = null;
    paintAll();
  });

  /* 列表：改状态 / 改备注 / 删（点两下） */
  if ($('plRows')) {
    $('plRows').addEventListener('change', function (e) {
      var sel = e.target.closest('[data-act="st"]');
      if (!sel) return;
      var row = sel.closest('.pl-item');
      var p = row && find(row.dataset.id);
      if (!p) return;
      p.st = ST[sel.value] ? sel.value : 'todo';
      p.ut = Date.now();
      saveNow();
      paintAll();
    });

    $('plRows').addEventListener('input', function (e) {
      var inp = e.target.closest('[data-act="note"]');
      if (!inp) return;
      var row = inp.closest('.pl-item');
      var p = row && find(row.dataset.id);
      if (!p) return;
      p.note = inp.value;
      p.ut = Date.now();
      saveSoon();          /* 不重画，光标留在原地 */
    });

    $('plRows').addEventListener('blur', function (e) {
      var inp = e.target.closest && e.target.closest('[data-act="note"]');
      if (inp) saveNow();
    }, true);

    $('plRows').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act="del"]');
      if (!btn) return;
      var row = btn.closest('.pl-item');
      var id = row && row.dataset.id;
      if (!id) return;
      if (armId !== id) {
        armId = id;
        clearTimeout(armT);
        btn.classList.add('is-armed');
        btn.textContent = '删?';
        armT = setTimeout(function () { armId = null; paintRows(); }, 3600);
        return;
      }
      clearTimeout(armT);
      delPlan(id);
    });
  }

  /* 加一条时记住上次选的账号 */
  if ($('fAcct')) $('fAcct').addEventListener('change', function () {
    D.lastAcct = this.value;
    saveSoon();
  });

  var btnTheme = SHARED ? null : $('btnTheme');
  if (btnTheme) btnTheme.addEventListener('click', function () {
    D.theme = D.theme === 'dark' ? 'light' : 'dark';
    applyTheme(D.theme);
    saveSoon();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) saveNow();
  });

  /* ---------------- 同步 ---------------- */
  var btnSync = SHARED ? null : $('btnSync');
  if (btnSync && window.WBSync) {
    btnSync.addEventListener('click', function () { window.WBSync.panel(); });
  }
  if (!SHARED && window.WBSync) {
    window.WBSync.init({
      onApplied: function () { frozen = true; clearTimeout(saveT); location.reload(); },
      onStatus: function (kind, text) {
        var b = $('btnSync');
        if (!b) return;
        var i = b.querySelector('i');
        if (i && text) i.textContent = text;
        b.classList.toggle('is-ok', kind === 'ok');
        b.classList.toggle('is-err', kind === 'err');
        b.classList.toggle('is-busy', kind === 'busy');
      }
    });
  }

  /* ---------------- 对外接口（日历整合用，只暴露这三件事） ----------------
     日历只管看和定位，改数据一律回到上面这些原有流程，不另开写入口。 */
  function monthOfPlan(id) {
    for (var k in D.months) {
      if (!Object.prototype.hasOwnProperty.call(D.months, k)) continue;
      var a = D.months[k];
      if (!Array.isArray(a)) continue;
      for (var i = 0; i < a.length; i++) if (a[i].id === id) return k;
    }
    return '';
  }

  window.WBPlanner = {
    getYm: function () { return ym; },

    /* 翻月：日历里按 ←/→ 或点跨月的日子时用，最终走这里 */
    goto: function (k) {
      if (!/^\d{4}-\d{2}$/.test(k || '')) return;
      gotoMonth(k);
    },

    /* 定位一条计划：跳到它那个月、清掉筛选、滚到那行、闪一下、光标进备注框 */
    focus: function (id) {
      if (!id) return false;
      var mk = monthOfPlan(id);
      if (!mk) { toast('这条计划找不到了'); return false; }
      ym = mk;
      filter = 'all';
      acctFilter = '';
      armId = null;
      paintAll();

      var rows = document.querySelectorAll('#plRows .pl-item');
      var row = null;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].getAttribute('data-id') === id) { row = rows[i]; break; }
      }
      if (!row) return true;

      try { row.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      catch (e) { try { row.scrollIntoView(); } catch (e2) {} }
      row.classList.add('is-focus');
      setTimeout(function () { row.classList.remove('is-focus'); }, 1800);

      var inp = row.querySelector('[data-act="note"]');
      if (inp) setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 320);
      return true;
    },

    /* 打开「加一条」，截止日预填日历点的那天 */
    add: function (due) {
      newOpen(true);
      var f = $('fDue');
      if (f && /^\d{4}-\d{2}-\d{2}$/.test(due || '')) f.value = due;
      var box = $('plNew');
      if (box) { try { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }
      var n = $('fName');
      if (n) setTimeout(function () { try { n.focus(); } catch (e) {} }, 90);
    }
  };
})();
