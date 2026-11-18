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
  function nextNo() {
    var n = 0;
    try { n = parseInt(localStorage.getItem(SKEY), 10) || 0; } catch (e) {}
    desk().wins.forEach(function (w) {
      if (w.kind === 'note' && w.note && (w.note.no | 0) > n) n = w.note.no | 0;
    });
    readTrash().forEach(function (w) {
      if (w.note && (w.note.no | 0) > n) n = w.note.no | 0;
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

  function cardHTML(w) {
    var s = w.note.style, d = TK[s], no = padNo(w.note.no);
    return '<div class="dk-win cd-card" data-kind="note" data-nt="' + s + '" data-id="' + w.id + '">' +
      '<button class="cd-del" type="button" data-del="' + w.id + '" title="扔进回收站">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>' +
      '</button>' +
      '<div class="dk-win-b"><div class="dk-note dk-tk">' +
        '<div class="tk-top">' +
          '<span class="tk-brand"><i></i><b>' + d.brand + '</b></span>' +
          '<span class="tk-no">NO.' + no + ' · ' + d.tag + '</span>' +
        '</div>' +
        '<div class="tk-halo">' + d.icon + '</div>' +
        fld(w, 'name', 'tk-name', '给它起个名') +
        '<div class="tk-quota">' +
          '<div class="tk-lab">' + d.lab + '</div>' +
          fld(w, 'big', 'tk-big', '一句数字') +
        '</div>' +
        '<div class="tk-box">' +
          '<div class="tk-k">' + d.k1 + '</div>' +
          fld(w, 'a', 'tk-v', '写在这里……') +
          '<div class="tk-hr"></div>' +
          '<div class="tk-2">' +
            '<div><div class="tk-k">' + d.k2 + '</div>' + fld(w, 'b', 'tk-v', '') + '</div>' +
            '<div><div class="tk-k">' + d.k3 + '</div>' + fld(w, 'c', 'tk-v', '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tk-stub">' +
          '<div class="tk-stub-l"><b>ADMIT ONE // 存档凭证</b>' + (w.note.date || '') + '</div>' +
          '<div class="tk-stub-no">' + no + '</div>' +
        '</div>' +
      '</div></div></div>';
  }

  function render() {
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
      url: '', x: 60, y: lowestY() + 40, w: 344, h: 470,
      z: 120, scroll: 0, sk: null, lock: 0,
      note: {
        style: s, html: '', no: no, date: today(),
        f: { name: d.f.name, big: d.f.big, a: d.f.a, b: d.f.b, c: d.f.c }
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
    saveNow();
    render();
    toast('扔进回收站了 · 右上角能捡回来');
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
      url: '', x: 60, y: lowestY() + 40, w: 344, h: 470,
      z: 120, scroll: 0, sk: null, lock: 0, note: it.note
    });
    saveNow();
    render();
    toast('捡回来了，回画布也能看到');
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
    w.note.f[t.getAttribute('data-f')] = t.innerHTML;
    if (t.getAttribute('data-f') === 'name') {
      var nm = plain(t.innerHTML);
      w.name = nm ? (nm.length > 18 ? nm.slice(0, 18) + '…' : nm) : (TK[w.note.style] || {}).name || '卡片';
    }
    paintField(t);
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
