/* ==========================================================
   卡片库 · cards.js
   跟画布（index.html）共用同一份数据：localStorage 的 wb.desk.v1
   这里只挑 kind=note 且 style 是 sop/hard/hook 的卡片，按编号排开
   ========================================================== */
(function () {
  'use strict';

  var LKEY = 'wb.desk.v1';
  var TKEY = 'wb.desk.trash.v1';
  var SKEY = 'wb.desk.seq.v1';

  var TK = window.TK || {};
  var ORDER = window.TK_ORDER || ['sop', 'hard', 'hook'];

  var cur = null, saveT = null, toastT = null;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plain(h) {
    return String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* 存之前把画上去的笔摘掉，只留文字和 <span data-mk> 这一层壳 */
  function htmlOf(el) {
    return (window.Mark && window.Mark.strip) ? window.Mark.strip(el) : el.innerHTML;
  }

  var markT = null;
  function markLater(root, force) {
    if (!window.Mark) return;
    clearTimeout(markT);
    markT = setTimeout(function () { window.Mark.refresh(root || document, force); }, 240);
  }
  function padNo(n) {
    var s = String(n || 1);
    while (s.length < 3) s = '0' + s;
    return s;
  }
  function today() {
    var d = new Date();
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function stamp(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    function p2(n) { return n < 10 ? '0' + n : '' + n; }
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  }
  function uid() {
    return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function toast(msg) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  }

  /* ---------------- 数据 ---------------- */
  function desk() {
    if (cur) return cur;
    try { cur = JSON.parse(localStorage.getItem(LKEY) || 'null'); } catch (e) { cur = null; }
    if (!cur || !Array.isArray(cur.wins)) cur = { v: 2, theme: 'light', wins: [] };
    return cur;
  }
  function saveNow() {
    try { localStorage.setItem(LKEY, JSON.stringify(desk())); }
    catch (e) { toast('没存上：' + ((e && e.message) || e)); }
  }
  function saveSoon() {
    clearTimeout(saveT);
    saveT = setTimeout(saveNow, 280);
  }
  function findWin(id) {
    var list = desk().wins;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function cardsOf(s) {
    return desk().wins.filter(function (w) {
      return w && w.kind === 'note' && w.note && w.note.style === s;
    }).sort(function (a, b) { return (a.note.no || 0) - (b.note.no || 0); });
  }
  /* 删一张就重排成连续号，不留空；下一张接着最大的往后发 */
  function renumber() {
    if (window.TK_RENUM) window.TK_RENUM(desk().wins);
  }
  function nextNo() {
    renumber();
    var n = 0;
    desk().wins.forEach(function (w) {
      if (w.kind === 'note' && w.note && (w.note.no | 0) > n) n = w.note.no | 0;
    });
    n += 1;
    try { localStorage.setItem(SKEY, String(n)); } catch (e) {}
    return n;
  }
  function lowestY() {
    var y = 0;
    desk().wins.forEach(function (w) {
      var b = (w.y | 0) + (w.h | 0);
      if (b > y) y = b;
    });
    return y;
  }

  function readTrash() {
    try { return JSON.parse(localStorage.getItem(TKEY) || '[]') || []; } catch (e) { return []; }
  }
  function writeTrash(a) {
    try { localStorage.setItem(TKEY, JSON.stringify(a.slice(0, 60))); } catch (e) {}
  }

  /* ---------------- 渲染 ---------------- */
  function paintField(n) {
    if (!n) return;
    var t = plain(n.textContent);
    n.setAttribute('data-empty', t ? '0' : '1');
  }

  function fld(w, k, cls, ph) {
    var f = w.note.f || {};
    return '<div class="' + cls + '" contenteditable="true" spellcheck="false"' +
      ' data-w="' + w.id + '" data-f="' + k + '" data-ph="' + esc(ph) + '">' +
      (f[k] == null ? '' : f[k]) + '</div>';
  }

  /* 老数据里正文分在 a / b / c 三块，现在合成一整块显示 */
  function bodyOf(f) {
    f = f || {};
    return [f.a, f.b, f.c].filter(function (x) {
      return x && plain(x);
    }).join('<br>');
  }

  /* 只有两样东西：一个大标题，一块写小字的地方 */
  function cardHTML(w) {
    var s = w.note.style, d = TK[s] || {}, ph = d.ph || {};
    var f = w.note.f || {};
    return '<div class="cd-card" data-tk="' + s + '" data-id="' + w.id + '">' +
      '<button class="cd-del" type="button" data-del="' + w.id + '" title="扔进回收站">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>' +
      '</button>' +
      '<div class="cd-meta"><span>' + esc(d.short || d.name || '卡片') + '</span>' +
        '<i>' + padNo(w.note.no) + '</i></div>' +
      '<div class="cd-name-wrap">' +
        '<div class="cd-name" contenteditable="true" spellcheck="false"' +
          ' data-w="' + w.id + '" data-f="name" data-ph="' + esc(ph.name || '给它起个名') + '">' +
          (f.name == null ? '' : f.name) + '</div>' +
        '<span class="cd-spark" aria-hidden="true"></span>' +
      '</div>' +
      '<div class="cd-body" contenteditable="true" spellcheck="false"' +
        ' data-w="' + w.id + '" data-f="a" data-ph="想到什么写什么……">' +
        bodyOf(f) + '</div>' +
    '</div>';
  }

  /* ---------------- 大标题上撒的那把星星 ----------------
     照着 sparkles-text 那个组件的效果搬过来的：位置随机、大小随机、
     0.8 秒一次呼吸（透明度 0→1→0、缩放 0→s→0、转角 75→120→150），
     每颗星自己一条命，几秒后换个地方重新亮，看起来就是一直有星星在闪。 */
  var SP_PATH = 'M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845' +
    'L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 ' +
    '16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 ' +
    '20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 ' +
    '14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 ' +
    '20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 ' +
    '13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 ' +
    '10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 ' +
    '8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z';
  var SP_NS = 'http://www.w3.org/2000/svg';
  var spTimer = null;

  function spRand(a, b) { return a + Math.random() * (b - a); }

  function spMake() {
    var svg = document.createElementNS(SP_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 21 21');
    svg.setAttribute('width', '21');
    svg.setAttribute('height', '21');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(SP_NS, 'path');
    p.setAttribute('d', SP_PATH);
    svg.appendChild(p);
    return svg;
  }

  /* 给一颗星重新摇一次骰子：位置、大小、颜色、快慢、活多久 */
  function spPaint(svg) {
    svg.setAttribute('class', 'cd-sp ' + (Math.random() > 0.5 ? 'a' : 'b'));
    svg.style.left = spRand(0, 100).toFixed(2) + '%';
    svg.style.top = spRand(0, 100).toFixed(2) + '%';
    svg.style.setProperty('--s', spRand(0.34, 0.86).toFixed(2));
    svg.style.animationDelay = '-' + spRand(0, 2).toFixed(2) + 's';
    svg.style.animationDuration = spRand(0.72, 1.05).toFixed(2) + 's';
    svg.setAttribute('data-die', String(Date.now() + spRand(4200, 13000)));
  }

  function spTick() {
    var all = document.querySelectorAll('.cd-spark .cd-sp');
    if (!all.length) { clearInterval(spTimer); spTimer = null; return; }
    var now = Date.now();
    Array.prototype.forEach.call(all, function (svg) {
      if (now >= (+svg.getAttribute('data-die') || 0)) spPaint(svg);
    });
  }

  function mountSparks(root) {
    var wraps = (root && root.classList && root.classList.contains('cd-name-wrap'))
      ? [root]
      : (root || document).querySelectorAll('.cd-name-wrap');
    Array.prototype.forEach.call(wraps, function (wrap) {
      var layer = wrap.querySelector('.cd-spark');
      var name = wrap.querySelector('.cd-name');
      if (!layer || !name) return;
      if (layer.getAttribute('data-on') === '1') return;   /* 已经撒过了，别每敲一个字重画一遍 */
      var txt = plain(name.textContent);
      if (!txt) return;                                    /* 空标题不放星星 */
      layer.setAttribute('data-on', '1');
      var n = Math.max(12, Math.min(20, Math.round(txt.length * 1.5)));
      for (var i = 0; i < n; i++) {
        var svg = spMake();
        spPaint(svg);
        layer.appendChild(svg);
      }
    });
    if (!spTimer) spTimer = setInterval(spTick, 900);
  }

  function render() {
    renumber();          /* 每次画之前先把编号排成连续的，删过的空号自动补上 */
    ORDER.forEach(function (s) {
      if (!TK[s]) return;
      var sec = document.querySelector('.cd-sec[data-tk="' + s + '"]');
      if (!sec) return;
      var list = cardsOf(s);
      var grid = sec.querySelector('.cd-grid');
      var cnt = sec.querySelector('.cd-cnt');
      if (cnt) cnt.textContent = list.length ? list.length + ' 张' : '';
      grid.classList.toggle('is-empty', !list.length);
      grid.innerHTML = list.map(cardHTML).join('');
      Array.prototype.forEach.call(grid.querySelectorAll('[data-f]'), paintField);
      mountSparks(grid);
      if (window.Mark) window.Mark.refresh(grid, true);   /* 手绘标记按新位置重画 */
    });
    renderTrash();
  }

  function renderTrash() {
    var a = readTrash();
    var n = $('trashN');
    if (n) {
      n.textContent = a.length || '';
      n.setAttribute('data-n', String(a.length));
    }
    var list = $('dwList');
    if (!list) return;
    if (!a.length) {
      list.innerHTML = '<div class="cd-dw-empty">回收站是空的。<br>删掉的卡片会先来这儿，不会直接没。</div>';
      return;
    }
    list.innerHTML = a.map(function (it) {
      var st = (it.note && it.note.style) || 'plain';
      var nm = it.name || (TK[st] ? TK[st].name : '卡片');
      var no = it.note && it.note.no ? ('NO.' + padNo(it.note.no)) : '';
      return '<div class="cd-dw-item" data-tk="' + st + '" data-id="' + it.id + '">' +
        '<i>' + (TK[st] ? TK[st].brand : '卡') + '</i>' +
        '<span class="t"><b>' + esc(nm) + '</b>' +
          '<span>' + [no, stamp(it.at)].filter(Boolean).join(' · ') + '</span></span>' +
        '<button type="button" data-act="back">捡回来</button>' +
        '<button type="button" data-act="kill">彻底删</button>' +
      '</div>';
    }).join('');
  }

  /* ---------------- 增删 ---------------- */
  function newCard(s) {
    var d = TK[s];
    if (!d) return;
    var no = nextNo();
    var w = {
      id: uid(), fileId: uid(), name: d.name, kind: 'note', size: 0,
      url: '', x: 60, y: lowestY() + 40, w: 344, h: 640,
      z: 120, scroll: 0, sk: null, lock: 0,
      note: {
        style: s, html: '', no: no, date: today(),
        f: { name: d.f.name, big: '', a: d.f.a, b: '', c: '' }
      }
    };
    w.fileId = w.id;
    desk().wins.push(w);
    saveNow();
    render();
    var el = document.querySelector('.cd-card[data-id="' + w.id + '"]');
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(function () {
        var t = el.querySelector('[data-f="name"]');
        if (t) {
          try { t.focus(); } catch (e) {}
          var r = document.createRange();
          r.selectNodeContents(t);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }, 260);
    }
    toast('新加了一张 ' + d.name + ' · NO.' + padNo(no));
  }

  function delCard(id) {
    var w = findWin(id);
    if (!w) return;
    var a = readTrash().filter(function (x) { return x.id !== id; });
    a.unshift({
      id: w.id, name: w.name, kind: w.kind,
      note: w.note || { style: 'plain' },
      at: Date.now()
    });
    writeTrash(a);

    var list = desk().wins;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { list.splice(i, 1); break; }
    }
    renumber();          /* 删掉这张，后面的号往前顶，不留空号 */
    saveNow();
    render();
    toast('扔进回收站了 · 编号已重排 · 右上角能捡回来');
  }

  function restore(id) {
    var a = readTrash(), i = -1;
    for (var k = 0; k < a.length; k++) if (a[k].id === id) { i = k; break; }
    if (i < 0) return;
    var it = a[i];
    a.splice(i, 1);
    writeTrash(a);

    it.note = it.note || { style: 'sop', f: {} };
    desk().wins.push({
      id: it.id, fileId: it.id, name: it.name, kind: 'note', size: 0,
      url: '', x: 60, y: lowestY() + 40, w: 344, h: 640,
      z: 120, scroll: 0, sk: null, lock: 0, note: it.note
    });
    renumber();          /* 捡回来的按原编号插回队里，后面的顺延，不留空号 */
    saveNow();
    render();
    toast('捡回来了，编号也重排好了');
  }

  function kill(id) {
    writeTrash(readTrash().filter(function (x) { return x.id !== id; }));
    renderTrash();
    toast('彻底删了，找不回来了');
  }

  /* ---------------- 交互 ---------------- */
  function keyOf(t) {
    while (t && t.nodeType === 1 && !t.getAttribute('data-f')) t = t.parentElement;
    return (t && t.getAttribute && t.getAttribute('data-f')) ? t.getAttribute('data-f') : null;
  }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute || !t.getAttribute('data-f')) return;
    var w = findWin(t.getAttribute('data-w'));
    if (!w) return;
    if (!w.note.f) w.note.f = {};
    var kk = t.getAttribute('data-f');
    w.note.f[kk] = htmlOf(t);
    /* 正文只有一块了，老的 b / c 跟着并进来，别在画布上重复一遍 */
    if (kk === 'a') { w.note.f.b = ''; w.note.f.c = ''; }
    if (t.getAttribute('data-f') === 'name') {
      var nm = plain(t.innerHTML);
      w.name = nm ? (nm.length > 18 ? nm.slice(0, 18) + '…' : nm) : (TK[w.note.style] || {}).name || '卡片';
    }
    paintField(t);
    if (kk === 'name') {
      var wrap = t.closest('.cd-name-wrap');
      if (wrap) {
        var lyr = wrap.querySelector('.cd-spark');
        if (plain(t.textContent)) {
          mountSparks(wrap);   /* 空标题开始打字了，星星跟着亮起来 */
        } else if (lyr) {
          lyr.innerHTML = '';  /* 删光了就别让星星飘在空地上 */
          lyr.removeAttribute('data-on');
        }
      }
    }
    markLater(t.closest('.cd-card'));   /* 字挪位置了，手绘标记跟着重画 */
    saveSoon();
  });

  document.addEventListener('paste', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute || !t.getAttribute('data-f')) return;
    if (!e.clipboardData) return;
    var txt = e.clipboardData.getData('text/plain');
    if (txt == null) return;
    e.preventDefault();
    document.execCommand('insertText', false, txt);
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute || !t.getAttribute('data-f')) return;
    if (e.key !== 'Tab') return;
    e.preventDefault();
    var card = t.closest('.cd-card');
    if (!card) return;
    var list = Array.prototype.slice.call(card.querySelectorAll('[data-f]'));
    var i = list.indexOf(t);
    var nx = list[i + (e.shiftKey ? -1 : 1)];
    if (nx) { try { nx.focus(); } catch (err) {} }
  });

  document.addEventListener('click', function (e) {
    var nb = e.target.closest('[data-new]');
    if (nb) { newCard(nb.getAttribute('data-new')); return; }

    var db = e.target.closest('[data-del]');
    if (db) { delCard(db.getAttribute('data-del')); return; }

    var ab = e.target.closest('[data-act="back"]');
    if (ab) { restore(ab.closest('.cd-dw-item').getAttribute('data-id')); return; }

    var kb = e.target.closest('[data-act="kill"]');
    if (kb) { kill(kb.closest('.cd-dw-item').getAttribute('data-id')); return; }

    if (e.target.closest('#dwClose')) { $('drawer').classList.remove('is-on'); return; }
    if (e.target.closest('#btnTrash')) {
      $('drawer').classList.toggle('is-on');
      return;
    }
    if (e.target.closest('#dwEmpty')) {
      if (!readTrash().length) { toast('回收站本来就是空的'); return; }
      if (!window.confirm('回收站里 ' + readTrash().length + ' 张全删掉？删了就找不回来了。')) return;
      writeTrash([]);
      renderTrash();
      toast('清空了');
      return;
    }
    if (e.target.closest('#btnTheme')) { toggleTheme(); return; }

    /* 抽屉里剩下的点击不要再往下走 */
    if (e.target.closest('#drawer')) return;

    /* 点空白把抽屉收起来 */
    if (!e.target.closest('.cd-card') && !e.target.closest('.cd-del')) {
      var dw = $('drawer');
      if (dw && dw.classList.contains('is-on') && e.target.closest('.cd-wrap')) dw.classList.remove('is-on');
    }
  });

  /* ---------------- 主题 ---------------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#1c1c1e' : '#fbfbfd');
  }
  function toggleTheme() {
    var t = desk().theme === 'dark' ? 'light' : 'dark';
    desk().theme = t;
    applyTheme(t);
    markLater(document, true);   /* 换主题了，手绘标记的颜色跟着换一版 */
    saveNow();
  }

  /* ---------------- 起 ---------------- */
  applyTheme(desk().theme === 'dark' ? 'dark' : 'light');
  render();

  /* 从画布切回来的时候，别拿到旧数据 */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) return;
    saveNow();
  });
})();
