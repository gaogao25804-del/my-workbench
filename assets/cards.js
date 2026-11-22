/* ==========================================================
   卡片库 · cards.js
   自己一份数据：localStorage 的 wb.cards.v1
   画布（index.html）是 wb.desk.v1，两边互不干涉 ——
   这边删一张，画布上不会少任何东西；那边怎么摆，这边也不跟着动。
   老版本两页共用一个 key，assets/store.js 负责把卡片搬过来。
   ========================================================== */
(function () {
  'use strict';

  var LKEY = 'wb.cards.v1';
  var TKEY = 'wb.cards.trash.v1';
  var SKEY = 'wb.cards.seq.v1';
  var SELKEY = 'wb.cards.sel.v1';    /* 上次开着的那张 */
  var FOLDKEY = 'wb.cards.fold.v1';  /* 哪几组是收起来的 */

  var TK = window.TK || {};
  var ORDER = window.TK_ORDER || ['sop', 'hard', 'hook'];

  var cur = null, saveT = null, toastT = null;
  var selId = null;                  /* 右栏现在摆的是哪张 */
  var fold = {};
  var findTxt = '';
  var pendingBody = null;            /* 「+」点开菜单时，等会儿要往哪块正文里插 */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plain(h) {
    return String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* 存之前把画上去的笔摘掉，只留文字和 <span data-mk> 这一层壳；
     代码块顶上那行「代码 · 复制 · ✕」也是画上去的，一起摘掉，重新打开时再补 */
  function htmlOf(el) {
    var c = el.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('.cd-cbar'), function (n) { n.remove(); });
    return (window.Mark && window.Mark.strip) ? window.Mark.strip(c) : c.innerHTML;
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
    if (!cur || !Array.isArray(cur.wins)) {
      /* 头一次用：主题先跟着画布那份，之后各调各的 */
      var dt = 'light';
      try {
        var dk = JSON.parse(localStorage.getItem('wb.desk.v1') || 'null');
        if (dk && dk.theme) dt = dk.theme;
      } catch (e) {}
      cur = { v: 3, theme: dt, wins: [], at: 0 };
    }
    return cur;
  }
  /* 云端刚覆盖了本地、正要重载：这期间的自动保存一律不写，
     否则内存里那份旧数据会把刚拉下来的卡片盖掉（换设备时最容易踩） */
  var frozen = false;

  function saveNow() {
    if (frozen) return;
    var d = desk();
    d.at = Date.now();               /* 同步时靠这个时间比谁更新 */
    try { localStorage.setItem(LKEY, JSON.stringify(d)); }
    catch (e) { toast('没存上：' + ((e && e.message) || e)); }
    if (window.WBSync) window.WBSync.pushSoon();
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
    /* 只有代码块、一条分割线的时候也别弹「想到什么写什么」的提示，那会压在块上面 */
    var blk = n.querySelector ? n.querySelector('.cd-codebox, hr') : null;
    n.setAttribute('data-empty', (t || blk) ? '0' : '1');
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

  /* 推特卡多一条作者行：头像 + 名字 + @ + 右边那个 X
     头像是拿名字头一个字生成的，没填名字就显示 X 那个标志 */
  var X_SVG = '<svg class="tw-x" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M18.9 2.2h3.5l-7.7 8.8L23.7 22h-7.1l-5.5-7.3L4.7 22H1.2l8.2-9.4L.9 2.2h7.3l5 6.7zM17.7 20h1.9L7.4 4H5.4z"/></svg>';

  function twHead(w, ph) {
    var f = w.note.f || {};
    var av = plain(f.au || '');
    return '<div class="tw-hd">' +
      '<span class="tw-av">' + (av ? esc(av.slice(0, 1).toUpperCase()) : X_SVG) + '</span>' +
      '<div class="tw-id">' +
        '<div class="tw-nm" contenteditable="true" spellcheck="false"' +
          ' data-w="' + w.id + '" data-f="au" data-ph="' + esc(ph.au || '作者名') + '">' +
          (f.au == null ? '' : f.au) + '</div>' +
        '<div class="tw-at">@<span contenteditable="true" spellcheck="false"' +
          ' data-w="' + w.id + '" data-f="at" data-ph="' + esc(ph.at || '账号') + '">' +
          (f.at == null ? '' : f.at) + '</span></div>' +
      '</div>' +
      X_SVG +
    '</div>';
  }

  /* 只有两样东西：一个大标题，一块写小字的地方
     bare=true 时不画卡片顶上那行身份信息 —— 右栏上面已经有面包屑了，别重复 */
  function cardHTML(w, bare) {
    var s = w.note.style, d = TK[s] || {}, ph = d.ph || {};
    var f = w.note.f || {};
    return '<div class="cd-card" data-tk="' + s + '" data-id="' + w.id + '">' +
      '<button class="cd-del" type="button" data-del="' + w.id + '" title="扔进回收站">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>' +
      '</button>' +
      (bare ? '' :
        '<div class="cd-meta"><span>' + esc(d.short || d.name || '卡片') + '</span>' +
          '<i>' + padNo(w.note.no) + '</i></div>') +
      (s === 'tweet' ? twHead(w, ph) : '') +
      '<div class="cd-name-wrap">' +
        '<div class="cd-name" contenteditable="true" spellcheck="false"' +
          ' data-w="' + w.id + '" data-f="name" data-ph="' + esc(ph.name || '给它起个名') + '">' +
          (f.name == null ? '' : f.name) + '</div>' +
        '<span class="cd-spark" aria-hidden="true"></span>' +
      '</div>' +
      '<div class="cd-body" contenteditable="true" spellcheck="false"' +
        ' data-w="' + w.id + '" data-f="a" data-ph="想到什么写什么……">' +
        bodyOf(f) + '</div>' +
      /* 写字的这块底下挂一个「+」：插入代码块 / 标题 / 列表 / 引用 / 分割线 */
      '<div class="cd-tools">' +
        '<button class="cd-add" type="button" data-add="1" title="插入：代码块 / 标题 / 列表 / 引用 / 分割线">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
            '<path d="M12 5.4v13.2M5.4 12h13.2"/></svg>' +
        '</button>' +
        '<span class="cd-add-hint">插入</span>' +
      '</div>' +
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

  function spMake(size) {
    var n = size || 21;
    var svg = document.createElementNS(SP_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 21 21');
    svg.setAttribute('width', n);
    svg.setAttribute('height', n);
    svg.style.margin = (-n / 2) + 'px 0 0 ' + (-n / 2) + 'px';   /* 以落点为圆心 */
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
      /* 星星跟着标题字号走：标题缩了，星星别还顶着老尺寸 */
      var fs = parseFloat(window.getComputedStyle(name).fontSize) || 21;
      var sz = Math.max(10, Math.min(21, Math.round(fs * 0.66)));
      for (var i = 0; i < n; i++) {
        var svg = spMake(sz);
        spPaint(svg);
        layer.appendChild(svg);
      }
    });
    if (!spTimer) spTimer = setInterval(spTick, 900);
  }

  /* ---------------- 树 + 右栏 ---------------- */
  function saveSel() {
    try { localStorage.setItem(SELKEY, selId || ''); } catch (e) {}
  }
  function saveFold() {
    try { localStorage.setItem(FOLDKEY, JSON.stringify(fold)); } catch (e) {}
  }
  function isCard(w) {
    return !!(w && w.kind === 'note' && w.note && TK[w.note.style]);
  }
  function cardName(w) {
    var nm = plain((w.note.f || {}).name || '');
    return nm || '(还没起名)';
  }

  function fileHTML(w) {
    return '<div class="cd-fl' + (w.id === selId ? ' is-on' : '') + '"' +
        ' data-id="' + w.id + '" data-tk="' + w.note.style + '"' +
        ' title="' + esc(cardName(w)) + '">' +
      '<span class="cd-fl-no">' + padNo(w.note.no) + '</span>' +
      '<span class="cd-fl-nm">' + esc(cardName(w)) + '</span>' +
      '<button class="cd-fl-x" type="button" data-del="' + w.id + '" title="扔进回收站">✕</button>' +
    '</div>';
  }

  function treeHTML() {
    var q = findTxt.trim().toLowerCase();
    var total = 0, hit = 0;

    var out = ORDER.map(function (s) {
      var d = TK[s];
      if (!d) return '';
      var all = cardsOf(s);
      total += all.length;
      var list = !q ? all : all.filter(function (w) {
        var f = w.note.f || {};
        var hay = [cardName(w), padNo(w.note.no), plain(bodyOf(f)),
                   plain(f.au || ''), plain(f.at || '')].join(' ').toLowerCase();
        return hay.indexOf(q) >= 0;
      });
      hit += list.length;

      var open = q ? '1' : (fold[s] ? '0' : '1');
      var files = list.length
        ? list.map(fileHTML).join('')
        : '<div class="cd-fd-empty">' + (q ? '这组没对上' : '空的，点右边 + 加一张') + '</div>';

      return '<div class="cd-fd" data-tk="' + s + '" data-open="' + open + '">' +
        '<div class="cd-fd-hd">' +
          '<button class="cd-fd-tog" type="button" data-fold="' + s + '">' +
            '<svg class="cd-car" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5.5 15.5 12 9 18.5"/></svg>' +
            '<span class="cd-dot"></span>' +
            '<span class="cd-fd-nm">' + esc(d.name) + '</span>' +
            '<i class="cd-fd-n">' + list.length + '</i>' +
          '</button>' +
          '<button class="cd-fd-add" type="button" data-new="' + s + '" title="新建一张' + esc(d.name) + '">+</button>' +
        '</div>' +
        '<div class="cd-files">' + files + '</div>' +
      '</div>';
    }).join('');

    if (!out) return '<div class="cd-tree-none">还没接上卡片类型。</div>';
    if (q && !hit) return '<div class="cd-tree-none">没找到「' + esc(findTxt.trim()) + '」。<br>换个词，或者清掉搜索框。</div>';
    return out;
  }

  function emptyPane() {
    var row = ORDER.filter(function (s) { return TK[s]; }).map(function (s) {
      return '<button type="button" data-new="' + s + '" data-tk="' + s + '">＋ ' + esc(TK[s].short || TK[s].name) + '</button>';
    }).join('');
    return '<div class="cd-pane-empty">' +
      '<b>左边点一张，或者新建一张</b>' +
      '<span>树上是四组卡，点文件夹名能收起、展开。<br>改完自动存。这些卡只在卡片库，不会跑到无限画布上去。</span>' +
      '<div class="row">' + row + '</div>' +
    '</div>';
  }

  function renderTree() {
    var box = $('cdTree');
    if (box) {
      box.innerHTML = treeHTML();
      box.scrollTop = 0;
    }
  }

  function renderPane() {
    var pane = $('cdPane');
    if (!pane) return;
    var w = selId ? findWin(selId) : null;
    if (!isCard(w)) {
      pane.innerHTML = emptyPane();
      return;
    }
    var s = w.note.style, d = TK[s] || {};
    var f = w.note.f || {};
    var n = plain(bodyOf(f)).length;
    pane.innerHTML =
      '<div class="cd-crumb">' +
        '<button class="cd-back-m" type="button" id="cdBack">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>' +
          '卡片库</button>' +
        '<b>' + esc(d.name || '卡片') + '</b>' +
        '<i>' + padNo(w.note.no) + '</i>' +
        (w.note.date ? '<span>·</span><span>' + esc(w.note.date) + '</span>' : '') +
        '<span class="grow"></span>' +
        '<span class="cd-crumb-n">' + n + ' 字</span>' +
      '</div>' +
      cardHTML(w, true);

    Array.prototype.forEach.call(pane.querySelectorAll('[data-f]'), paintField);
    hydrateBlocks(pane);                                /* 代码块顶上那行按钮是画出来的 */
    mountSparks(pane);
    if (window.Mark) window.Mark.refresh(pane, true);   /* 手绘标记按新位置重画 */
  }

  function render() {
    renumber();          /* 每次画之前先把编号排成连续的，删过的空号自动补上 */
    renderTree();
    renderPane();
    renderTrash();
    var sum = $('cdSum');
    if (sum) {
      var all = desk().wins.filter(isCard).length;
      sum.textContent = all ? ('共 ' + all + ' 张 · 和画布同一份数据') : '一张都还没有';
    }
  }

  /* 打开某一张：树里高亮它，右栏换上它 */
  function openCard(id) {
    if (!findWin(id)) return;
    selId = id;
    saveSel();
    if (window.innerWidth <= 880) document.body.classList.add('cd-reading');
    render();
    if (window.innerWidth > 880) {
      var pane = $('cdPane');
      if (pane) {
        var top = pane.getBoundingClientRect().top;
        if (top < 60) window.scrollBy({ top: top - 80, behavior: 'smooth' });
      }
    }
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
    /* 新卡就是一张白纸：标题、正文、作者全空，只在空的地方给一句浅提示（placeholder）。
       以前这里填的是示例文案，新建一张就带一段假字，还得先删干净才能用。 */
    var ff = {};
    var w = {
      id: uid(), fileId: uid(), name: d.name, kind: 'note', size: 0,
      url: '', x: 60, y: lowestY() + 40, w: 344, h: 640,
      z: 120, scroll: 0, sk: null, lock: 0,
      note: {
        style: s, html: '', no: no, date: today(),
        f: ff
      }
    };
    w.fileId = w.id;
    desk().wins.push(w);
    saveNow();

    fold[s] = 0;                    /* 新卡在本组里，这组得开着 */
    saveFold();
    selId = w.id;
    saveSel();
    findTxt = '';
    var fi = $('cdFind');
    if (fi) { fi.value = ''; fi.parentNode.classList.remove('is-full'); }

    if (window.innerWidth <= 880) document.body.classList.add('cd-reading');
    render();

    setTimeout(function () {
      var t = document.querySelector('#cdPane [data-f="name"]');
      if (!t) return;
      try { t.focus(); } catch (e) {}
      var r = document.createRange();
      r.selectNodeContents(t);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    }, 220);

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

    /* 删的正好是右栏开着的那张，就顺手挑一张别的顶上，别留个空栏目 */
    if (selId === id) {
      var rest = desk().wins.filter(isCard).sort(function (x, y) {
        return (x.note.no || 0) - (y.note.no || 0);
      });
      selId = rest.length ? rest[0].id : null;
      saveSel();
    }

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
    selId = it.id;
    saveSel();
    if (TK[it.note.style]) { fold[it.note.style] = 0; saveFold(); }
    render();
    toast('捡回来了，编号也重排好了');
  }

  function kill(id) {
    writeTrash(readTrash().filter(function (x) { return x.id !== id; }));
    renderTrash();
    toast('彻底删了，找不回来了');
  }

  /* ---------------- 文档块：+ 插入 代码块 / 标题 / 列表 / 引用 / 分割线 ----------------
     存进卡片的只有块本身：<div class="cd-codebox"><div class="cd-code">…</div></div>。
     代码块顶上那行「代码 · 复制 · ✕」是画出来的，存盘前摘掉（见 htmlOf），重画时补回来。 */
  var CODE_PH = '提示词、命令、JSON 都写这儿，换行和空格都留得住';

  function barHTML() {
    return '<div class="cd-cbar" contenteditable="false">' +
      '<span class="cd-lang">代码</span>' +
      '<span class="grow"></span>' +
      '<button class="cd-cbtn" type="button" data-cp="1" title="整块复制">复制</button>' +
      '<button class="cd-cbtn is-x" type="button" data-cdx="1" title="删掉这个代码块">✕</button>' +
    '</div>';
  }

  function hydrateBlocks(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('.cd-codebox'), function (b) {
      if (!b.querySelector('.cd-cbar')) b.insertAdjacentHTML('afterbegin', barHTML());
    });
  }

  function makeBlock(kind) {
    var el;
    if (kind === 'code') {
      el = document.createElement('div');
      el.className = 'cd-codebox';
      el.innerHTML = barHTML() + '<div class="cd-code" data-ph="' + CODE_PH + '"></div>';
      return el;
    }
    if (kind === 'h') { el = document.createElement('div'); el.className = 'cd-h'; return el; }
    if (kind === 'quo') { el = document.createElement('div'); el.className = 'cd-quo'; return el; }
    if (kind === 'ul') {
      el = document.createElement('ul');
      el.className = 'cd-ul';
      el.innerHTML = '<li><br></li>';
      return el;
    }
    return document.createElement('hr');
  }

  function hostOf(el) {
    return (el && el.closest) ? el.closest('[data-f]') : null;
  }
  /* 光标现在落哪个元素里。
     键盘事件的 target 永远是那个 contenteditable 宿主（.cd-body），
     所以不能拿 e.target 判断「人在不在代码块里」，要看选区。 */
  function caretEl() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var n = sel.getRangeAt(0).startContainer;
    return n && (n.nodeType === 1 ? n : n.parentElement);
  }
  /* 改完 DOM 通知一次存盘，走的还是正文那套（存 htmlOf、重算字数） */
  function ping(host) {
    if (host) host.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function caretRangeIn(host) {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var r = sel.getRangeAt(0);
    var n = r.commonAncestorContainer;
    n = n && (n.nodeType === 1 ? n : n.parentNode);
    return (n && host.contains(n)) ? r : null;
  }
  function placeCaret(el, atStart) {
    if (!el) return;
    try {
      var r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(!!atStart);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch (e) {}
  }

  /* 代码块里换行。
     不能用 insertText('\n')：Chrome 会把它当「回车」去劈段落，代码块就散成好几块。
     手插 \n 文本节点也不行：行尾那个换行会被编辑器吃掉。
     用原生的 insertLineBreak（就是 Shift+回车那套），插的是 <br>，光标也跟得对。 */
  function codeBreak() {
    try { return document.execCommand('insertLineBreak'); } catch (e) { return false; }
  }
  /* 一大段纯文本塞进代码块：一行一行来，中间用插入换行接上，
     这样粘一整个提示词进来也不会被拆成好几块 */
  function codeInsert(text) {
    var lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    for (var i = 0; i < lines.length; i++) {
      if (i) codeBreak();
      if (lines[i]) document.execCommand('insertText', false, lines[i]);
    }
  }

  function openAddMenu(btn) {
    var m = $('cdAddM'), card = btn.closest('.cd-card');
    if (!m || !card) return;
    pendingBody = card.querySelector('.cd-body');
    m.hidden = false;
    var r = btn.getBoundingClientRect();
    var w = m.offsetWidth || 236, h = m.offsetHeight || 200;
    var left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - w - 8));
    var top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    m.style.left = Math.round(left) + 'px';
    m.style.top = Math.round(top) + 'px';
  }
  function closeAddMenu() {
    var m = $('cdAddM');
    if (m && !m.hidden) m.hidden = true;
  }

  function insertBlock(kind) {
    var host = pendingBody;
    closeAddMenu();
    if (!host || !document.body.contains(host)) return;
    var node = makeBlock(kind);
    var after = null;

    /* 插在「现在这一段」的后面，不是插进光标里 ——
       连着点几下「+」，块才是一层一层往下排，不会一个套一个 */
    var top = null;
    var r = caretRangeIn(host);
    if (r) {
      var n = r.startContainer;
      n = n && (n.nodeType === 1 ? n : n.parentNode);
      while (n && n !== host && n.parentNode !== host) n = n.parentNode;
      if (n && n !== host && host.contains(n)) top = n;
    }
    if (top) top.parentNode.insertBefore(node, top.nextSibling);
    else host.appendChild(node);

    /* 后面没东西了，补一行空段落，不然新块贴在最后、光标没地方落 */
    var nx = node.nextSibling;
    if (!nx || (nx.nodeType === 3 && !plain(nx.nodeValue))) {
      after = document.createElement('div');
      after.appendChild(document.createElement('br'));
      node.parentNode.insertBefore(after, nx);
    } else if (nx.nodeType === 1) {
      after = nx;
    }

    var t = node;
    if (kind === 'ul') t = node.querySelector('li');
    else if (kind === 'code') t = node.querySelector('.cd-code');
    else if (kind === 'hr') t = after;
    if (t) { try { host.focus(); } catch (e) {} }
    placeCaret(t);
    ping(host);
    saveSoon();
    toast(kind === 'code' ? '代码块加好了 · 回车就是换行' : '加好了');
  }

  function copyCode(btn) {
    var box = btn.closest('.cd-codebox');
    var code = box && box.querySelector('.cd-code');
    if (!code) return;
    var txt = code.innerText || code.textContent || '';
    function ok() { toast('复制好了，粘哪都行'); }
    function bye() {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { toast('没复制上，手动选一下'); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok, bye);
    } else bye();
  }

  function removeCodeBox(btn) {
    var box = btn.closest('.cd-codebox');
    if (!box) return;
    var host = hostOf(box);
    var next = box.nextSibling;
    box.remove();
    ping(host);
    /* 光标别甩到卡片最底下：落在原来这个块的下一位，没有就回到正文末尾 */
    placeCaret(next && next.nodeType === 1 ? next : host, true);
    toast('代码块删了');
  }

  /* 标题 / 引用里回车：这一段就到此为止，另起一行普通文字 */
  function endBlock(blk) {
    var host = hostOf(blk);
    var p = document.createElement('div');
    p.appendChild(document.createElement('br'));
    var empty = !plain(blk.textContent);
    blk.parentNode.insertBefore(p, blk.nextSibling);
    if (empty) blk.remove();
    placeCaret(p);
    ping(host);
    saveSoon();
  }
  /* 列表里空着一行回车：退出列表，回到普通文字 */
  function exitList(li) {
    var ul = li.parentNode, host = hostOf(li);
    var p = document.createElement('div');
    p.appendChild(document.createElement('br'));
    if (ul && ul.tagName === 'UL') {
      ul.parentNode.insertBefore(p, ul.nextSibling);
      li.remove();
      if (!ul.children.length) ul.remove();
    } else {
      li.parentNode.insertBefore(p, li.nextSibling);
      li.remove();
    }
    placeCaret(p);
    ping(host);
    saveSoon();
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
    /* 推特卡改作者名，头像那个首字母跟着换（不重绘整张卡，光标不会掉） */
    if (kk === 'au') {
      var cw = t.closest('.cd-card');
      var av = cw && cw.querySelector('.tw-av');
      if (av) {
        var avTxt = plain(w.note.f.au);
        av.innerHTML = avTxt ? esc(avTxt.slice(0, 1).toUpperCase()) : X_SVG;
      }
    }
    if (kk === 'name') {
      /* 树里那一行的名字跟着改，别整个重画（会丢光标） */
      var fl = document.querySelector('.cd-fl[data-id="' + w.id + '"]');
      if (fl) {
        var nmEl = fl.querySelector('.cd-fl-nm');
        if (nmEl) nmEl.textContent = (w.name && w.name !== (TK[w.note.style] || {}).name) ? w.name : '(还没起名)';
        fl.setAttribute('title', plain(t.textContent) || '');
      }
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
    if (kk === 'a') {
      var cn = document.querySelector('#cdPane .cd-crumb-n');
      if (cn) cn.textContent = plain(bodyOf(w.note.f)).length + ' 字';
    }
    markLater(t.closest('.cd-card'));   /* 字挪位置了，手绘标记跟着重画 */
    saveSoon();
  });

  document.addEventListener('paste', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var txt = e.clipboardData ? e.clipboardData.getData('text/plain') : null;
    if (txt == null) return;
    var host = t.closest('[data-f]');
    if (!host) return;
    /* 粘进代码块：一律纯文本，缩进和换行照原样留着 */
    var here = caretEl() || t;
    var code = (here.closest && here.closest('.cd-code')) || null;
    if (code && host.contains(code)) {
      e.preventDefault();
      codeInsert(txt);
      return;
    }
    e.preventDefault();
    document.execCommand('insertText', false, txt);
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var host = t.closest('[data-f]');
    if (!host) return;
    var here = caretEl() || t;
    if (!host.contains(here)) here = t;

    /* 代码块里：回车就是换行、Tab 就是两个空格，别让浏览器给你套 div；
       空着的时候按退格，整块拆掉 */
    var code = here.closest('.cd-code');
    if (code) {
      if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
        e.preventDefault();
        if (codeBreak()) ping(host);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
        return;
      }
      if (e.key === 'Backspace' && !plain(code.textContent)) {
        e.preventDefault();
        removeCodeBox(code);
        return;
      }
      return;
    }

    /* 标题 / 引用：回车就出这一段；列表里空一行回车就退出列表 */
    if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
      var li = here.closest('li');
      if (li) {
        if (!plain(li.textContent)) { e.preventDefault(); exitList(li); }
        return;
      }
      var blk = here.closest('.cd-h, .cd-quo');
      if (blk) { e.preventDefault(); endBlock(blk); return; }
    }

    if (e.key !== 'Tab') return;
    e.preventDefault();
    var card = t.closest('.cd-card');
    if (!card) return;
    var fl = Array.prototype.slice.call(card.querySelectorAll('[data-f]'));
    var i = fl.indexOf(host);
    var nx = fl[i + (e.shiftKey ? -1 : 1)];
    if (nx) { try { nx.focus(); } catch (err) {} }
  });

  /* 「+」和它弹出来的菜单：按下去别把正文的光标抢走，插到哪才准 */
  document.addEventListener('mousedown', function (e) {
    if (e.target.closest && e.target.closest('[data-add], #cdAddM, .cd-cbar')) e.preventDefault();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAddMenu();
  });
  window.addEventListener('scroll', closeAddMenu, true);
  window.addEventListener('resize', closeAddMenu);

  document.addEventListener('click', function (e) {
    if (!e.target.closest || (!e.target.closest('#cdAddM') && !e.target.closest('[data-add]'))) closeAddMenu();

    var insb = e.target.closest('[data-ins]');
    if (insb) { insertBlock(insb.getAttribute('data-ins')); return; }

    var adb = e.target.closest('[data-add]');
    if (adb) { openAddMenu(adb); return; }

    var cpb = e.target.closest('[data-cp]');
    if (cpb) { copyCode(cpb); return; }

    var cxb = e.target.closest('[data-cdx]');
    if (cxb) { removeCodeBox(cxb); return; }

    var nb = e.target.closest('[data-new]');
    if (nb) { newCard(nb.getAttribute('data-new')); return; }

    var db = e.target.closest('[data-del]');
    if (db) { delCard(db.getAttribute('data-del')); return; }

    /* 树：文件夹开合 */
    var ft = e.target.closest('[data-fold]');
    if (ft) {
      var s = ft.getAttribute('data-fold');
      fold[s] = fold[s] ? 0 : 1;
      saveFold();
      var fd = ft.closest('.cd-fd');
      if (fd) fd.setAttribute('data-open', fold[s] ? '0' : '1');
      return;
    }

    /* 树：点一行文件，右栏换这张 */
    var fl = e.target.closest('.cd-fl');
    if (fl) { openCard(fl.getAttribute('data-id')); return; }

    /* 手机上从内容退回树 */
    if (e.target.closest('#cdBack')) {
      document.body.classList.remove('cd-reading');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (e.target.closest('#cdFindX')) {
      var fi = $('cdFind');
      if (fi) { fi.value = ''; fi.parentNode.classList.remove('is-full'); fi.focus(); }
      findTxt = '';
      renderTree();
      return;
    }

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
      if (dw && dw.classList.contains('is-on') && e.target.closest('.cd-split')) dw.classList.remove('is-on');
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
  /* 老数据里卡片和画布混在一个 key（wb.desk.v1），先搬到卡片库自己这份来 */
  if (window.WBStore) { try { window.WBStore.migrate(); } catch (e) {} }

  try {
    selId = localStorage.getItem(SELKEY) || null;
    var fj = JSON.parse(localStorage.getItem(FOLDKEY) || '{}');
    if (fj && typeof fj === 'object') fold = fj;
  } catch (e) { selId = null; fold = {}; }

  var findBox = $('cdFind');
  if (findBox) {
    findBox.addEventListener('input', function () {
      findTxt = findBox.value;
      findBox.parentNode.classList.toggle('is-full', !!findTxt);
      renderTree();
    });
    findBox.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      findBox.value = '';
      findTxt = '';
      findBox.parentNode.classList.remove('is-full');
      renderTree();
    });
  }

  if (selId && !findWin(selId)) selId = null;

  applyTheme(desk().theme === 'dark' ? 'dark' : 'light');
  render();

  /* 同步：和画布共用同一份数据，所以也用同一个模块 */
  var btnSync2 = $('btnSync');
  if (btnSync2 && window.WBSync) {
    btnSync2.addEventListener('click', function () { window.WBSync.panel(); });
  }
  if (window.WBSync) {
    window.WBSync.init({
      onApplied: function () { frozen = true; window.__wbReloading = 1; location.reload(); },
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

  /* 从画布切回来的时候，别拿到旧数据 */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) return;
    saveNow();
  });

  /* 给页签切换用：卡片在隐藏状态下画过一次，亮出来时位置/手绘标记要重算 */
  window.CDCards = { repaint: function () { renderPane(); } };
})();
