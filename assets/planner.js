/* ==========================================================
   内容策划 · planner.js
   一个月一张清单，五个账号这月要交什么、哪条还欠着。

   数据自己一份：localStorage 的 wb.planner.v1
     { v:1, at:<时间戳>, theme:'light', months:{ '2026-11': [ 计划… ] } }
   跟卡片库（wb.cards.v1）、画布（wb.desk.v1）完全分开，
   同步时是云端文件里的第三格，谁也不覆盖谁。
   ========================================================== */
(function () {
  'use strict';

  var PK = 'wb.planner.v1';
  var ACCTS = ['数码大号', '数码小号', '理想账号', '丹姐账号', '洗车账号', '临时项目'];
  var ST = { todo: '未开始', doing: '进行中', done: '已完成' };

  var D = null;
  var ym = '';            /* 当前看的月份 'YYYY-MM' */
  var filter = 'all';     /* all / todo / doing / done */
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
    if (frozen) return;
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
  /* 截止日期在前，没日期的垫底；同一天按加进来的先后 */
  function sorted() {
    return list().slice().sort(function (a, b) {
      var x = a.due || '', y = b.due || '';
      if (x && !y) return -1;
      if (!x && y) return 1;
      if (x !== y) return x < y ? -1 : 1;
      return (a.ct || 0) - (b.ct || 0);
    });
  }

  /* ---------------- 画画 ---------------- */
  function counts() {
    var a = list(), c = { all: a.length, todo: 0, doing: 0, done: 0 };
    a.forEach(function (p) { c[p.st || 'todo'] = (c[p.st || 'todo'] || 0) + 1; });
    return c;
  }

  function paintStats() {
    var c = counts();
    $('pTotal').textContent = c.all;
    $('pDoing').textContent = c.doing;
    $('pDone').textContent = c.done;
  }

  function paintChips() {
    var c = counts(), box = $('plChips');
    var defs = [['all', '全部'], ['todo', '未开始'], ['doing', '进行中'], ['done', '已完成']];
    box.innerHTML = defs.map(function (d) {
      var on = filter === d[0] ? ' is-on' : '';
      return '<button class="pl-chip' + on + '" type="button" data-f="' + d[0] + '">' +
        d[1] + '<i>' + (c[d[0]] || 0) + '</i></button>';
    }).join('');
  }

  function dueText(p) {
    if (!p.due) return { t: '没日期', cls: 'is-none' };
    var d = p.due.split('-');
    var t = d[1] + '-' + d[2];
    if (p.st === 'done') return { t: t, cls: '' };
    var now = todayStr();
    if (p.due < now) return { t: t, cls: 'is-late' };
    if (p.due === now) return { t: t + ' 今天', cls: 'is-today' };
    return { t: t, cls: '' };
  }

  function rowHTML(p) {
    var st = p.st || 'todo';
    var du = dueText(p);
    var cls = ['pl-row'];
    if (st === 'done') cls.push('is-done');

    var opts = Object.keys(ST).map(function (k) {
      return '<option value="' + k + '"' + (k === st ? ' selected' : '') + '>' + ST[k] + '</option>';
    }).join('');

    return '<div class="' + cls.join(' ') + '" data-id="' + p.id + '">' +
      '<select class="pl-st-sel is-' + st + '" data-act="st" title="改进度">' + opts + '</select>' +
      '<div class="pl-name" title="' + esc(p.name) + '">' + esc(p.name) + '</div>' +
      '<div class="pl-acct" title="' + esc(p.acct || '') + '">' + esc(p.acct || '未分账号') + '</div>' +
      '<div class="pl-due ' + du.cls + '">' + du.t + '</div>' +
      '<input class="pl-note" type="text" data-act="note" value="' + esc(p.note || '') + '" placeholder="备注…" spellcheck="false">' +
      '<button class="pl-del' + (armId === p.id ? ' is-armed' : '') + '" type="button" data-act="del" title="删掉这条">' +
        (armId === p.id ? '确定删?' : '✕') + '</button>' +
    '</div>';
  }

  function paintRows() {
    var box = $('plRows');
    var arr = sorted().filter(function (p) {
      return filter === 'all' || (p.st || 'todo') === filter;
    });

    if (!arr.length) {
      box.innerHTML = '<div class="pl-empty">' +
        '<b>' + (list().length ? '这个筛选下没有计划' : '这个月还没排东西') + '</b>' +
        (list().length ? '换个筛选看看，或者切回「全部」。'
                       : '在上面填个名称，回车就加上了。截止日期不填也行，会排在最后。') +
      '</div>';
      return;
    }
    box.innerHTML = arr.map(rowHTML).join('');
  }

  function paintAll() {
    $('plYm').textContent = ymText(ym);
    var pick = $('plPick');
    if (pick && pick.value !== ym) pick.value = ym;
    $('plToday').disabled = (ym === thisMonth());
    paintStats();
    paintChips();
    paintRows();
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
    paintAll();
  }

  /* ---------------- 增删改 ---------------- */
  function addPlan() {
    var name = ($('fName').value || '').trim();
    if (!name) { $('fName').focus(); toast('先写个计划名称'); return; }
    var p = {
      id: uid(),
      name: name,
      acct: $('fAcct').value || ACCTS[0],
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
  if (!D.theme) {
    try {
      var c = JSON.parse(localStorage.getItem('wb.cards.v1') || 'null');
      if (c && c.theme) D.theme = c.theme;
      else {
        var k = JSON.parse(localStorage.getItem('wb.desk.v1') || 'null');
        if (k && k.theme) D.theme = k.theme;
      }
    } catch (e) {}
  }
  applyTheme(D.theme === 'dark' ? 'dark' : 'light');

  ym = thisMonth();

  /* 账号下拉 */
  (function () {
    var sel = $('fAcct');
    if (!sel) return;
    sel.innerHTML = ACCTS.map(function (a) {
      return '<option value="' + esc(a) + '">' + esc(a) + '</option>';
    }).join('');
    if (D.lastAcct && ACCTS.indexOf(D.lastAcct) >= 0) sel.value = D.lastAcct;
  })();

  paintAll();

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

  $('plChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]');
    if (!b) return;
    filter = b.dataset.f;
    paintChips();
    paintRows();
  });

  /* 列表：改状态 / 改备注 / 删 */
  $('plRows').addEventListener('change', function (e) {
    var sel = e.target.closest('[data-act="st"]');
    if (!sel) return;
    var row = sel.closest('.pl-row');
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
    var row = inp.closest('.pl-row');
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
    var row = btn.closest('.pl-row');
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

  $('btnTheme').addEventListener('click', function () {
    D.theme = D.theme === 'dark' ? 'light' : 'dark';
    applyTheme(D.theme);
    saveSoon();
  });

  /* 切标签页时把没落盘的备注写下去 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) saveNow();
  });

  /* ---------------- 同步 ---------------- */
  var btnSync = $('btnSync');
  if (btnSync && window.WBSync) {
    btnSync.addEventListener('click', function () { window.WBSync.panel(); });
  }
  if (window.WBSync) {
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
