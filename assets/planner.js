/* ==========================================================
   内容策划 · planner.js
   一个月一张清单：六个账号这月要交什么、哪条还欠着。
   版式照参考图重排了一遍 —— 概览六块彩色小卡 / 账号进度条 /
   带圆点的清单 / 右边「这个月」+「加一条」。

   数据还是原来那一份：localStorage 的 wb.planner.v1
     { v:1, at:<时间戳>, theme:'light', months:{ '2026-11': [ 计划… ] } }
   跟卡片库（wb.cards.v1）、画布（wb.desk.v1）完全分开，
   同步时是云端文件里的第三格，谁也不覆盖谁。
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

  /* 合并进 cards.html 之后，主题、同步、顶栏按钮都归 cards.js，
     这边只管清单本身，别去抢那几件事（抢了会互相打架：主题被切两下等于没切、
     WBSync 被 init 两次、重载时把云端刚拉下来的计划又写回旧的） */
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
  function ymText(k) {
    var p = k.split('-');
    return p[0] + ' 年 ' + (parseInt(p[1], 10)) + ' 月';
  }
  function addDays(s, n) {
    var p = s.split('-');
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10) + n);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function mmdd(s) { return s ? s.slice(5, 7) + '-' + s.slice(8, 10) : ''; }

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
    var p = ym.split('-');
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 2, 1);
    return monthKey(d);
  }
  function delta(now, last) {
    if (!last && !now) return '上月也没排';
    if (!last) return '上月没排';
    if (now > last) return '比上月多 ' + (now - last) + ' 条';
    if (now < last) return '比上月少 ' + (last - now) + ' 条';
    return '跟上月一样';
  }
  function earliestLate() {
    var a = view().filter(isLate).map(function (p) { return p.due; }).sort();
    return a.length ? mmdd(a[0]) : '';
  }

  /* ---------------- 图标 ---------------- */
  var IC = {
    plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.4 3.6 7.7 12 12l8.4-4.3z"/><path d="M3.6 12.3 12 16.6l8.4-4.3"/><path d="M3.6 16.6 12 20.9l8.4-4.3"/></svg>',
    doing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.3"/><path d="M10.2 8.6 15.4 12l-5.2 3.4z"/></svg>',
    done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 12.4 9.5 17.3 19.4 6.9"/></svg>',
    late: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.4 21 19.8H3z"/><path d="M12 10.1v3.8M12 16.6v.01"/></svg>',
    week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.4" y="5.4" width="17.2" height="15.2" rx="2.6"/><path d="M8 3.4v3.6M16 3.4v3.6M3.4 10.2h17.2"/></svg>',
    rate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6.2 17.8 17.8 6.2"/><circle cx="7.9" cy="7.9" r="2.1"/><circle cx="16.1" cy="16.1" r="2.1"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7.6 16.4 16.4 7.6M9.4 7.6h7v7"/></svg>'
  };

  /* ---------------- 画画 ---------------- */
  function paintHead() {
    var c = counts();
    $('plHeadSub').textContent = ymText(ym) + ' · ' + c.all + ' 条在册 · ' +
      (c.all ? (c.all - c.done) + ' 条还没交' : '一条没排');
  }

  function paintPeople() {
    var a = list();
    $('plPeople').innerHTML = ACCTS.map(function (x) {
      var mine = a.filter(function (p) { return (p.acct || '') === x.n; });
      var open = mine.filter(function (p) { return (p.st || 'todo') !== 'done'; }).length;
      var on = acctFilter === x.n ? ' is-on' : '';
      return '<button type="button" class="pl-person' + on + '" data-acct="' + esc(x.n) + '" title="点一下只看这个账号">' +
        '<span class="pp-av" data-c="' + x.c + '">' + x.s + '</span>' +
        '<span class="pp-b"><b>' + esc(x.n) + '</b><i>' + mine.length + ' 条在册</i></span>' +
        '<span class="pp-pill' + (open ? '' : ' is-zero') + '">' + (open ? open + ' 条待办' : '全清') + '</span>' +
      '</button>';
    }).join('');
  }

  function tileHTML(o) {
    var on = (o.f && filter === o.f) ? ' is-on' : '';
    var inner =
      '<span class="pt-h"><span class="pt-ic">' + o.ic + '</span>' + o.lab + '</span>' +
      '<span class="pt-bot">' +
        '<span class="pt-v">' + o.v + '</span>' +
        '<span class="pt-s">' + o.sub + '</span>' +
      '</span>' +
      (o.f ? '<span class="pt-go">' + IC.arrow + '</span>' : '');
    if (!o.f) {
      return '<div class="pl-tile" data-k="' + o.k + '">' + inner + '</div>';
    }
    return '<button type="button" class="pl-tile' + on + '" data-k="' + o.k + '" data-f="' + o.f + '" title="点一下只看这一类">' + inner + '</button>';
  }

  function paintTiles() {
    var c = counts();
    var prevArr = monthOf(prevKey());
    if (acctFilter) prevArr = prevArr.filter(function (p) { return (p.acct || '') === acctFilter; });
    var pc = statOf(prevArr);
    var tiles = [
      { k: 'plan', lab: '本月计划', v: c.all, sub: delta(c.all, pc.all), f: 'all', ic: IC.plan },
      { k: 'doing', lab: '正在推进', v: c.doing, sub: c.all ? '占 ' + Math.round(c.doing / c.all * 100) + '%' : '还没开始', f: 'doing', ic: IC.doing },
      { k: 'done', lab: '已完成', v: c.done, sub: delta(c.done, pc.done), f: 'done', ic: IC.done },
      { k: 'late', lab: '已逾期', v: c.late, sub: c.late ? '最早 ' + earliestLate() + ' 就该交' : '一条不欠', f: 'late', ic: IC.late },
      { k: 'week', lab: '本周到期', v: c.week, sub: '接下来 7 天', f: 'week', ic: IC.week },
      { k: 'rate', lab: '完成率', v: c.rate + '%', sub: pc.all ? '上月 ' + pc.rate + '%' : '上月没排', f: '', ic: IC.rate }
    ];
    $('plTiles').innerHTML = tiles.map(tileHTML).join('');
    $('plClear').hidden = (filter === 'all' && !acctFilter);
    var lab = { all: '全部', todo: '未开始', doing: '进行中', done: '已完成', late: '逾期', week: '本周' }[filter] || '';
    var bits = [];
    if (acctFilter) bits.push('只看「' + acctFilter + '」');
    if (filter !== 'all') bits.push('只看「' + lab + '」');
    $('plSumSub').textContent = bits.length ? bits.join(' · ') : '点一张卡就只看那一类';
  }

  function paintBars() {
    var a = view();
    var map = {};
    ACCTS.forEach(function (x) { map[x.n] = { n: x.n, s: x.s, c: x.c, t: 0, d: 0, o: 0 }; });
    a.forEach(function (p) {
      var g = map[p.acct];
      if (!g) return;
      g.t++;
      if ((p.st || 'todo') === 'done') g.d++; else g.o++;
    });
    var rows = ACCTS.map(function (x) { return map[x.n]; }).filter(function (g) { return g.t > 0; });

    $('plBarsSub').textContent = rows.length
      ? rows.length + ' 个账号有活 · 共 ' + a.length + ' 条'
      : '这个月还没分账号';

    if (!rows.length) {
      $('plBars').innerHTML = '<div class="pl-empty" style="padding:22px 8px 24px">' +
        '<b>还没有能算进度的东西</b>在「加一条」里加一条、选个账号，这儿就有数了。</div>';
      return;
    }

    $('plBars').innerHTML = rows.map(function (g) {
      var pct = g.t ? Math.round(g.d / g.t * 100) : 0;
      return '<div class="pb">' +
        '<div class="pb-h">' +
          '<span class="pb-av" data-c="' + g.c + '">' + g.s + '</span>' +
          '<b class="pb-name">' + esc(g.n) + '</b>' +
          '<span class="pb-pct">' + pct + '%</span>' +
        '</div>' +
        '<div class="pb-track"><i class="pb-fill" style="width:' + pct + '%" data-p="' + pct + '"></i></div>' +
        '<div class="pb-nums">' +
          '<span>计划 <b>' + g.t + '</b></span>' +
          '<span>完成 <b>' + g.d + '</b></span>' +
          '<span>欠着 <b' + (g.o ? ' class="is-alarm"' : '') + '>' + g.o + '</b></span>' +
        '</div>' +
      '</div>';
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

  function paintChips() {
    var c = counts(), box = $('plChips');
    if (!box) return;
    var defs = [['all', '全部'], ['todo', '未开始'], ['doing', '进行中'], ['done', '已完成'], ['late', '逾期'], ['week', '本周']];
    box.innerHTML = defs.map(function (d) {
      var on = filter === d[0] ? ' is-on' : '';
      return '<button class="pl-chip' + on + '" type="button" data-f="' + d[0] + '">' +
        d[1] + '<i>' + (c[d[0]] || 0) + '</i></button>';
    }).join('');
    var sorted = $('plSorted');
    if (sorted) {
      var lab = '';
      defs.forEach(function (d) { if (d[0] === filter) lab = d[1]; });
      sorted.textContent = filter === 'all' ? '按截止日期排，没日期的垫底' : '只看「' + lab + '」';
    }
  }

  function dueText(p) {
    if (!p.due) return { t: '没定日子', cls: 'is-none' };
    var t = mmdd(p.due);
    if ((p.st || 'todo') === 'done') return { t: t + ' 交的', cls: '' };
    var now = todayStr();
    if (p.due < now) {
      var dd = Math.round((new Date(now) - new Date(p.due)) / 86400000);
      return { t: t + ' · 晚了 ' + dd + ' 天', cls: 'is-late' };
    }
    if (p.due === now) return { t: t + ' · 今天要交', cls: 'is-today' };
    var left = Math.round((new Date(p.due) - new Date(now)) / 86400000);
    return { t: t + ' · 还有 ' + left + ' 天', cls: '' };
  }

  function rowHTML(p) {
    var st = p.st || 'todo';
    var du = dueText(p);
    var cls = 'pl-item' + (st === 'done' ? ' is-done' : '');

    var opts = Object.keys(ST).map(function (k) {
      return '<option value="' + k + '"' + (k === st ? ' selected' : '') + '>' + ST[k] + '</option>';
    }).join('');

    return '<div class="' + cls + '" data-id="' + p.id + '">' +
      '<div class="pi-b">' +
        '<div class="pi-top">' +
          '<span class="pi-name" title="' + esc(p.name) + '">' + esc(p.name) + '</span>' +
          '<span class="pi-acct">' + esc(p.acct || '未分账号') + '</span>' +
        '</div>' +
        '<div class="pi-sub">' +
          '<span class="pi-due ' + du.cls + '">' + du.t + '</span>' +
          '<input class="pi-note" type="text" data-act="note" value="' + esc(p.note || '') + '" placeholder="备注…" spellcheck="false">' +
        '</div>' +
      '</div>' +
      '<span class="pi-stw">' +
        '<select class="pi-st is-' + st + '" data-act="st" title="改进度">' + opts + '</select>' +
        '<svg class="pf-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10l4 4 4-4"/></svg>' +
      '</span>' +
      '<button class="pi-del' + (armId === p.id ? ' is-armed' : '') + '" type="button" data-act="del" title="删掉这条">' +
        (armId === p.id ? '确定删?' : '✕') +
      '</button>' +
    '</div>';
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
      box.innerHTML = '<div class="pl-empty">' +
        '<b>' + (noneAll ? '这个月还没排东西' : '这个筛选下没有计划') + '</b>' +
        (noneAll ? '在「加一条」里填个名称，回车就加上了。截止日期不填也行。'
                 : '换个筛选看看，或者点上面的「全部」。') +
      '</div>';
      return;
    }
    box.innerHTML = arr.map(rowHTML).join('');
  }

  function paintNow() {
    var c = counts();
    var ring = $('plRing');
    if (ring) {
      ring.style.setProperty('--p', c.rate);
      ring.classList.toggle('is-zero', c.rate <= 0);
    }
    $('plRate').textContent = c.rate + '%';
    $('plYm').textContent = ymText(ym);

    var bits = [];
    if (c.all) {
      bits.push(c.all + ' 条在册');
      bits.push(c.done + ' 条完成');
      if (c.late) bits.push(c.late + ' 条逾期');
      if (c.todo) bits.push(c.todo + ' 条没动');
    }
    $('plNowSub').textContent = bits.length ? bits.join(' · ') : '这个月还没排东西';

    var pick = $('plPick');
    if (pick && pick.value !== ym) pick.value = ym;
    $('plToday').disabled = (ym === thisMonth());
  }

  function paintAll() {
    paintHead();
    paintPeople();
    paintTiles();
    paintBars();
    paintChips();
    paintTrack();
    paintRows();
    paintNow();
  }

  /* ---------------- 月份 ---------------- */
  function shiftMonth(n) {
    var p = ym.split('-');
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1 + n, 1);
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
    if (!name) { $('fName').focus(); toast('先写个计划名称'); return; }
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
    toast('删掉了：' + nm);
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
    if (meta) meta.setAttribute('content', t === 'dark' ? '#1c1c1e' : '#fbfbfd');
  }

  /* ---------------- 起 ---------------- */
  load();

  /* 第一次用：主题先跟着卡片库那份，之后各调各的 */
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
  $('plForm').addEventListener('submit', function (e) {
    e.preventDefault();
    addPlan();
  });

  $('plPrev').addEventListener('click', function () { shiftMonth(-1); });
  $('plNext').addEventListener('click', function () { shiftMonth(1); });
  $('plToday').addEventListener('click', function () { gotoMonth(thisMonth()); });
  $('plPick').addEventListener('change', function () {
    if (this.value) gotoMonth(this.value);
    else this.value = ym;
  });

  /* 上面那一排账号：点一下只看它，再点一下放开 */
  $('plPeople').addEventListener('click', function (e) {
    var b = e.target.closest('[data-acct]');
    if (!b) return;
    var n = b.getAttribute('data-acct');
    acctFilter = (acctFilter === n) ? '' : n;
    filter = 'all';
    armId = null;
    paintAll();
  });

  /* 六块小卡：点一下就只看那一类 */
  $('plTiles').addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]');
    if (!b) return;
    filter = b.getAttribute('data-f') || 'all';
    armId = null;
    paintTiles();
    paintChips();
    paintRows();
    paintTrack();
  });

  $('plClear').addEventListener('click', function () {
    filter = 'all';
    acctFilter = '';
    armId = null;
    paintAll();
  });

  $('plChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]');
    if (!b) return;
    filter = b.getAttribute('data-f') || 'all';
    armId = null;
    paintTiles();
    paintChips();
    paintRows();
  });

  /* 列表：改状态 / 改备注 / 删 */
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
      btn.textContent = '确定删?';
      armT = setTimeout(function () { armId = null; paintRows(); }, 3600);
      return;
    }
    clearTimeout(armT);
    delPlan(id);
  });

  /* 加一条时记住上次选的账号，下次不用重挑 */
  $('fAcct').addEventListener('change', function () {
    D.lastAcct = this.value;
    saveSoon();
  });

  var btnTheme = SHARED ? null : $('btnTheme');
  if (btnTheme) btnTheme.addEventListener('click', function () {
    D.theme = D.theme === 'dark' ? 'light' : 'dark';
    applyTheme(D.theme);
    saveSoon();
  });

  /* 切标签页时把没落盘的备注写下去 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) saveNow();
  });

  /* ---------------- 同步 ---------------- */
  /* 单页版（sites/planner/）自己管；合并进 cards.html 后由 cards.js 统一管 */
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
})();
