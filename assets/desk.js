/* ==========================================================
   自由布局工作台 · 画布核心
   - 无限画布：窗口绝对定位，画布随内容撑开
   - 拖拽 / 8 向缩放 / 层级置顶 / 最大化
   - 布局存 localStorage，文件二进制存 IndexedDB
   ========================================================== */
(function () {
  'use strict';

  var LKEY = 'wb.desk.v1';
  var MINW = 260, MINH = 150;
  var MAX_FILE = 40 * 1024 * 1024;   // 单个文件上限 40MB

  var canvas, stage, emptyEl, toastEl, saveEl, pickEl, replaceEl, dropEl;
  var wins = {};
  var zTop = 100;
  /* 本机 IndexedDB 里没有文件、这次画不出来的窗口（docx/pdf/xlsx 之类）。
     这些条目必须原样留住：用户清过缓存或换台设备打开时，它们一个都渲染不出来，
     如果就这么丢掉，下面 scheduleSave 会把少了几条的画面写回本地、再顺手推到云端，
     等于"用新设备打开一次，云端那几张卡就被删了"。2026-11-23 真实踩到过。 */
  var ghostWins = [];
  var theme = 'light';
  var saveTimer = null;
  var frozen = false;              /* 云端刚覆盖、正要重载：这期间别把旧数据写回去 */
  var pendingReplace = null;

  var ICO = { docx: 'W', xlsx: 'X', pdf: 'P', txt: 'T', web: '↗', note: '✎' };

  /* ---------------- 便签小卡片 ---------------- */
  var NT_ORDER = ['plain', 'mark', 'quote'];
  var NT_NAME = { plain: '白卡', mark: '重点卡', quote: '引用卡' };
  var NT_PH = {
    plain: '写点什么……',
    mark: '这条要记住的事……',
    quote: '别人说过的一句……'
  };

  /* 票根卡的数据在 assets/tk.js，画布和卡片库共用一份 */
  var TK_ORDER = window.TK_ORDER || ['sop', 'hard', 'hook'];
  var TK = window.TK || {};
  function ntStyle(st) {
    return (st && st.note && st.note.style) || 'plain';
  }
  function isTk(st) {
    return !!(st && st.kind === 'note' && TK[ntStyle(st)]);
  }
  function tkName(s) {
    return (TK[s] && TK[s].name) || NT_NAME[s] || '卡片';
  }
  function mdToday() {
    var d = new Date();
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  /* 编号：删掉一张之后重新排成连续的，下一张接着最大的往后发
     以前是「只增不减」，删了 001/002/003 之后新卡直接从 008 开始，中间全是空号 */
  var SEQKEY = 'wb.desk.seq.v1';
  function renumber() {
    if (window.TK_RENUM) window.TK_RENUM(wins);
  }
  function nextNo() {
    renumber();
    var n = 0;
    Object.keys(wins).forEach(function (k) {
      var v = wins[k];
      if (v.kind === 'note' && v.note && (v.note.no | 0) > n) n = v.note.no | 0;
    });
    n += 1;
    try { localStorage.setItem(SEQKEY, String(n)); } catch (e) {}
    return n;
  }
  /* 重排之后，卡上那几个 NO.xxx 得跟着改，不然屏幕上还是旧号 */
  function repaintNos() {
    Object.keys(wins).forEach(function (k) {
      var w = wins[k];
      if (!w || w.kind !== 'note' || !w.note || !w.note.no) return;
      var el = elOf(w);
      if (!el) return;
      var no = padNo(w.note.no);
      var d = TK[w.note.style] || {};
      var t = el.querySelector('.tk-no');
      if (t) t.textContent = 'NO.' + no + (d.tag ? ' · ' + d.tag : '');
      var q = el.querySelector('.tk-stub-no');
      if (q) q.textContent = no;
    });
  }
  function padNo(n) {
    var s = String(n || 1);
    while (s.length < 3) s = '0' + s;
    return s;
  }
  /* ---------------- 回收站 ---------------- */
  var TRASHKEY = 'wb.desk.trash.v1';
  function readTrash() {
    try { return JSON.parse(localStorage.getItem(TRASHKEY) || '[]') || []; } catch (e) { return []; }
  }
  function writeTrash(a) {
    try { localStorage.setItem(TRASHKEY, JSON.stringify(a.slice(0, 60))); } catch (e) {}
  }
  function pushTrash(w) {
    var a = readTrash().filter(function (x) { return x.id !== w.id; });
    a.unshift({
      id: w.id, name: w.name, kind: w.kind, size: w.size || 0,
      note: w.note ? packNote(w.note) : null,
      at: Date.now()
    });
    writeTrash(a);
  }

  function packNote(n) {
    if (!n) return null;
    var o = { style: n.style || 'plain', html: n.html || '' };
    if (n.f) {
      o.f = {};
      Object.keys(n.f).forEach(function (k) { o.f[k] = n.f[k]; });
    }
    if (n.no) o.no = n.no;
    if (n.date) o.date = n.date;
    return o;
  }
  function tkFields(st) {
    var d = TK[ntStyle(st)] || TK.sop;
    if (!st.note) st.note = { style: 'sop', html: '' };
    if (!st.note.f) st.note.f = {};
    var f = st.note.f;
    Object.keys(d.f).forEach(function (k) { if (f[k] == null) f[k] = d.f[k]; });
    return f;
  }
  function paintField(n) {
    if (!n) return;
    var t = String(n.innerText || '').replace(/\s+/g, '');
    n.setAttribute('data-empty', t ? '0' : '1');
  }

  var SVG = {
    reload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6"/><path d="M20.5 4.2V10h-5.6"/></svg>',
    max: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4.5" width="15" height="15" rx="2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6L6 18M18 6l1.6-1.6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5.5v13M5.5 12h13"/></svg>',
    nt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.6" y="5.2" width="13" height="13.6" rx="2.4"/><path d="M8.2 19.4l11.2-.6a1.6 1.6 0 0 0 1.5-1.7l-.5-8.6"/></svg>'
  };

  /* ---------------- 小工具 ---------------- */
  function $(id) { return document.getElementById(id); }
  function uid() {
    return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtSize(b) {
    b = Number(b) || 0;
    if (!b) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return Math.round(b / 1024) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function kindOf(name) {
    var m = /\.([a-z0-9]+)$/i.exec(name || '');
    var e = m ? m[1].toLowerCase() : '';
    if (e === 'docx') return 'docx';
    if (e === 'xlsx' || e === 'xls') return 'xlsx';
    if (e === 'pdf') return 'pdf';
    if (e === 'txt') return 'txt';
    return '';
  }
  function whyUnsupported(name) {
    var m = /\.([a-z0-9]+)$/i.exec(name || '');
    var e = m ? m[1].toLowerCase() : '';
    if (e === 'doc') return '「' + name + '」是 Word 97 老格式，浏览器解不开。用 Word/WPS 打开另存为 .docx 再放进来';
    if (e === 'ppt' || e === 'pptx') return '暂不支持 PPT：' + name;
    if (e === 'csv') return 'CSV 请先用 WPS 另存为 .xlsx 再放进来：' + name;
    return '不支持的格式：' + name;
  }

  var toastT = null;
  function toast(msg, ms) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, ms || 2600);
  }

  /* ---------------- IndexedDB ---------------- */
  var IDB = (function () {
    var NAME = 'wb-desk', VER = 1, p = null;
    function openDB() {
      if (p) return p;
      p = new Promise(function (res, rej) {
        if (!window.indexedDB) return rej(new Error('这个浏览器不支持 IndexedDB'));
        var r = indexedDB.open(NAME, VER);
        r.onupgradeneeded = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
        };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error || new Error('本地数据库打不开')); };
        r.onblocked = function () { rej(new Error('本地数据库被别的标签页占着，关掉其它标签页再试')); };
      });
      return p;
    }
    function run(mode, fn) {
      return openDB().then(function (db) {
        return new Promise(function (res, rej) {
          var tx, req;
          try {
            tx = db.transaction('files', mode);
            req = fn(tx.objectStore('files'));
          } catch (e) { rej(e); return; }
          tx.oncomplete = function () { res(req ? req.result : undefined); };
          tx.onerror = function () { rej(tx.error); };
          tx.onabort = function () { rej(tx.error); };
        });
      });
    }
    return {
      put: function (rec) { return run('readwrite', function (s) { return s.put(rec); }); },
      get: function (id) { return run('readonly', function (s) { return s.get(id); }); },
      del: function (id) { return run('readwrite', function (s) { return s.delete(id); }); },
      all: function () { return run('readonly', function (s) { return s.getAll(); }); }
    };
  })();

  /* ---------------- 画布尺寸 ---------------- */
  function growStage() {
    if (!canvas || !stage) return;
    var mw = canvas.clientWidth, mh = canvas.clientHeight;
    Object.keys(wins).forEach(function (id) {
      var w = wins[id];
      mw = Math.max(mw, w.x + w.w + 140);
      mh = Math.max(mh, w.y + w.h + 140);
    });
    stage.style.width = mw + 'px';
    stage.style.height = mh + 'px';
    applyMobile();
  }

  function updateEmpty() {
    if (!emptyEl) return;
    var n = Object.keys(wins).length;
    emptyEl.classList.toggle('is-hide', n > 0);
  }

  /* ---------------- 手机：把画布竖过来 ----------------
     桌面那套是按像素摆的，卡片 x 可能是一千多，手机上永远看不见。
     这里给 body 打上 dk-m，CSS 把定位改成竖向流水，再把卡片按 y 从小到大
     重新插一遍 —— 顺序已经对了就不动，免得每次 resize 都白抖一下。 */
  function applyMobile() {
    var on = window.innerWidth <= 860;
    document.body.classList.toggle('dk-m', on);
    if (!on || !stage) return;

    var kids = [];
    for (var i = 0; i < stage.children.length; i++) {
      var el = stage.children[i];
      if (el.classList && el.classList.contains('dk-win')) kids.push(el);
    }
    if (kids.length < 2) return;

    var sorted = kids.slice().sort(function (a, b) {
      var ay = parseFloat(a.style.top) || 0, by = parseFloat(b.style.top) || 0;
      if (ay !== by) return ay - by;
      return (parseFloat(a.style.left) || 0) - (parseFloat(b.style.left) || 0);
    });
    var same = sorted.every(function (el2, k) { return el2 === kids[k]; });
    if (same) return;
    sorted.forEach(function (el3) { stage.appendChild(el3); });
  }

  /* 云朵按钮上那行小字：只在本机 / 已同步 / 推不上去 */
  function paintSync(kind, text) {
    var b = document.getElementById('btnSync');
    if (!b) return;
    var i = b.querySelector('i');
    if (i && text) i.textContent = text;
    b.classList.toggle('is-ok', kind === 'ok');
    b.classList.toggle('is-err', kind === 'err');
    b.classList.toggle('is-busy', kind === 'busy');
  }

  /* ---------------- 布局保存 ---------------- */
  function snapshot() {
    var list = Object.keys(wins).map(function (id) {
      var w = wins[id];
      return {
        id: w.id, fileId: w.fileId, name: w.name, kind: w.kind, size: w.size,
        url: w.url || '',
        x: Math.round(w.x), y: Math.round(w.y),
        w: Math.round(w.w), h: Math.round(w.h),
        z: w.z, scroll: Math.round(w.scroll || 0),
        sk: w.sk || null, lock: w.lock ? 1 : 0,
        note: w.kind === 'note' ? packNote(w.note || { style: ntStyle(w) }) : null
      };
    });
    /* 本机缺文件、这次没画出来的窗口：原样带回去，别在保存时把它抹掉 */
    if (ghostWins.length) {
      var seen = {};
      list.forEach(function (w) { seen[w.id] = 1; });
      ghostWins.forEach(function (w) {
        if (!w || seen[w.id]) return;
        seen[w.id] = 1;
        list.push(w);
      });
    }
    return { v: 2, theme: theme, wins: list, at: Date.now() };
  }

  function scheduleSave() {
    if (saveEl) { saveEl.textContent = '未保存'; saveEl.classList.add('is-dirty'); }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (frozen) return;
      try {
        localStorage.setItem(LKEY, JSON.stringify(snapshot()));
        if (saveEl) { saveEl.textContent = '已保存'; saveEl.classList.remove('is-dirty'); }
        /* 有令牌的话顺手把这份推到云端，手机上才能看到 */
        if (window.WBSync) window.WBSync.pushSoon();
      } catch (e) {
        if (saveEl) saveEl.textContent = '保存失败';
        toast('布局没存上：' + ((e && e.message) || e));
      }
    }, 380);
  }

  /* ---------------- 锁定布局：把排好的一版固定住 ---------------- */
  var LOCK_KEY = 'wb.desk.lock.v1';
  var locked = false, anchor = null, prevAnchor = null;

  /* 布局指纹：谁在哪儿、多大 —— 用来判断「这一版有没有变过」 */
  function layoutKeyOf(snap) {
    return ((snap && snap.wins) || []).map(function (w) {
      return w.id + '|' + w.x + ',' + w.y + ',' + w.w + ',' + w.h;
    }).sort().join(';');
  }

  function loadLock() {
    try {
      var r = JSON.parse(localStorage.getItem(LOCK_KEY) || 'null');
      if (!r) return;
      locked = !!r.on;
      anchor = r.anchor || null;
      prevAnchor = r.prev || null;
    } catch (e) {}
  }

  function saveLock() {
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify({ on: locked, anchor: anchor, prev: prevAnchor, at: Date.now() }));
    } catch (e) {}
  }

  /* 这张卡锁没锁：整块画布锁了算锁，自己单独锁了也算 */
  function isWinLocked(st) {
    return locked || !!(st && st.lock);
  }

  function toggleWinLock(st) {
    if (locked) { toast('整块画布都锁着，先点顶栏「已锁定」解开'); return; }
    st.lock = st.lock ? 0 : 1;
    paintLock();
    scheduleSave();
    toast(st.lock ? ('这张卡锁住了 · 位置不会再动') : '这张卡解锁了，可以拖了');
  }

  function paintLock() {
    document.documentElement.setAttribute('data-locked', locked ? '1' : '0');
    Object.keys(wins).forEach(function (id) {
      var e = elOf(wins[id]);
      if (!e) return;
      var on = isWinLocked(wins[id]);
      e.classList.toggle('is-locked', on);
      var ed = e.querySelector('.dk-note');
      if (ed) ed.setAttribute('contenteditable', on ? 'false' : 'true');
      Array.prototype.forEach.call(e.querySelectorAll('[data-f]'), function (n) {
        n.setAttribute('contenteditable', on ? 'false' : 'true');
      });
    });
    var b = $('btnLock');
    if (!b) return;
    b.classList.toggle('is-on', locked);
    var lb = b.querySelector('.lbl2');
    if (lb) lb.textContent = locked ? '已锁定' : '锁定';
    b.title = locked
      ? '布局已锁定：卡片不能拖动、缩放、关掉。右键这个按钮可以回到锁定时那一版、导出备份'
      : '把当前布局固定住：锁上以后卡片不会被动到（右键看备份）';
  }

  function setLock(on) {
    if (on) {
      var cur = snapshot();
      if (!anchor || layoutKeyOf(anchor) !== layoutKeyOf(cur)) {
        prevAnchor = anchor;
        anchor = cur;
      }
      locked = true;
      saveLock();
      paintLock();
      toast('布局已锁定 · ' + cur.wins.length + ' 张卡片不会再被挪动（右键「已锁定」可回到这一版或导出备份）', 4600);
    } else {
      locked = false;
      saveLock();
      paintLock();
      toast('已解锁，卡片可以拖动、缩放了');
    }
  }

  function restoreLayout(snap, label) {
    if (!snap || !snap.wins || !snap.wins.length) { toast('还没有可恢复的布局'); return; }
    var n = 0, miss = 0;
    snap.wins.forEach(function (w) {
      var st = wins[w.id];
      if (!st) { miss++; return; }
      st.x = w.x; st.y = w.y; st.w = w.w; st.h = w.h;
      st.maxed = false; st.prev = null;
      if (w.sk) st.sk = w.sk;
      applyBox(st);
      n++;
    });
    growStage();
    scheduleSave();
    toast(n
      ? ('已回到' + label + ' · ' + n + ' 张卡片归位' + (miss ? '，另有 ' + miss + ' 张已不在画布上' : ''))
      : '那一版里的卡片现在都不在画布上了', 4200);
  }

  function exportLayout() {
    try {
      var data = { kind: 'wb-desk-layout', v: 2, at: new Date().toISOString(), layout: snapshot() };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '工作台布局-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      toast('布局备份已下载 · 换电脑或清缓存以后用它恢复');
    } catch (e) { toast('导出失败：' + ((e && e.message) || e)); }
  }

  function importLayout(file) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var d = JSON.parse(String(fr.result));
        var snap = (d && d.layout) || d;
        if (!snap || !Array.isArray(snap.wins) || !snap.wins.length) throw new Error('里面没有布局数据');
        localStorage.setItem(LKEY, JSON.stringify(snap));
        /* 备份文件要是老格式（里面混着票根卡），把卡片送回卡片库，别在画布上冒出来 */
        try {
          if (window.WBStore) { localStorage.removeItem('wb.cards.migrated.v1'); window.WBStore.migrate(); }
        } catch (e) {}
        toast('布局已导入，正在重载…');
        setTimeout(function () { location.reload(); }, 800);
      } catch (e) { toast('这个文件不是布局备份：' + ((e && e.message) || e)); }
    };
    fr.readAsText(file);
  }

  function openLockMenu() {
    var m = $('lockMenu'), b = $('btnLock');
    if (!m || !b) return;
    var t = m.querySelector('[data-lk2="toggle"]');
    if (t) t.textContent = locked ? '解锁（卡片可以拖动了）' : '锁定当前布局';
    var bk = m.querySelector('[data-lk2="back"]');
    if (bk) {
      bk.disabled = !anchor;
      bk.textContent = anchor ? ('回到锁定时那一版（' + anchor.wins.length + ' 张）') : '还没锁定过';
    }
    var pv = m.querySelector('[data-lk2="prev"]');
    if (pv) { pv.hidden = !prevAnchor; pv.disabled = !prevAnchor; }

    var r = b.getBoundingClientRect();
    m.hidden = false;
    var mw = m.offsetWidth || 216;
    m.style.left = Math.max(8, Math.min(window.innerWidth - mw - 8, r.right - mw)) + 'px';
    m.style.top = Math.round(r.bottom + 8) + 'px';
  }

  function closeLockMenu() {
    var m = $('lockMenu');
    if (m) m.hidden = true;
  }

  /* ---------------- 主题 ---------------- */
  function applyTheme(t) {
    theme = t === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#1c1c1e' : '#fbfbfd');
  }

  /* ---------------- 窗口 DOM ---------------- */
  function winHTML(st) {
    var isNote = st.kind === 'note';
    return '<div class="dk-win" data-id="' + st.id + '" data-kind="' + st.kind + '"' +
      (isNote ? ' data-nt="' + ntStyle(st) + '"' : '') +
      ' style="left:' + st.x + 'px;top:' + st.y +
      'px;width:' + st.w + 'px;height:' + st.h + 'px;z-index:' + st.z + '">' +
      '<div class="dk-win-h">' +
        '<span class="dk-ico" data-k="' + st.kind + '">' + (ICO[st.kind] || '?') + '</span>' +
        '<span class="dk-win-t" title="' + esc(st.name) + '">' + esc(st.name) + '</span>' +
        '<span class="dk-win-meta">' + metaOf(st) + '</span>' +
        '<div class="dk-win-a">' +
          '<button type="button" data-act="lock" title="单独锁住这张卡片的位置（不影响别张）">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="5" y="10.6" width="14" height="8.9" rx="2.1"/>' +
              '<path class="lk-o" d="M8.7 10.6V7.9a3.3 3.3 0 0 1 6.5-1"/>' +
              '<path class="lk-c" d="M8.7 10.6V7.9a3.3 3.3 0 0 1 6.6 0v2.7"/>' +
            '</svg></button>' +
          (isNote
            ? '<button type="button" data-act="nt" title="换一种卡片（SOP / 困难 / 开场五秒）">' + SVG.nt + '</button>'
            : '<button type="button" data-act="reload" title="重新导入这个文件的新版本">' + SVG.reload + '</button>') +
          '<button type="button" data-act="max" title="最大化 / 还原">' + SVG.max + '</button>' +
          '<button type="button" data-act="close" title="从画布移除（不动本地原文件）">' + SVG.close + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="dk-win-b"></div>' +
      ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].map(function (d) {
        return '<div class="dk-h" data-d="' + d + '"></div>';
      }).join('') +
    '</div>';
  }

  function elOf(st) {
    return stage.querySelector('.dk-win[data-id="' + st.id + '"]');
  }

  function applyBox(st) {
    var el = elOf(st);
    if (!el) return;
    el.style.left = st.x + 'px';
    el.style.top = st.y + 'px';
    el.style.width = st.w + 'px';
    el.style.height = st.h + 'px';
  }

  function raise(st) {
    if (st.z === zTop) return;
    st.z = ++zTop;
    var el = elOf(st);
    if (el) el.style.zIndex = st.z;
    Object.keys(wins).forEach(function (id) {
      var e2 = elOf(wins[id]);
      if (e2) e2.classList.toggle('is-active', id === st.id);
    });
    scheduleSave();
  }

  /* ---------------- 自动高度：只作用于新放进来的卡片，不动已有布局 ---------------- */
  var MAH_MIN = 260, MAH_MAX = 1200;

  /* 单张卡片：内容多高就给多高，超长的收到上限、窗口内滚动 */
  function soloH(contentH) {
    if (!contentH) return MAH_MIN;
    return Math.round(Math.max(190, Math.min(MAH_MAX, contentH)));
  }

  /* 读一张卡片的内容真实高度（含标题栏），测不到就沿用现在的 */
  function rawH(st) {
    var el = elOf(st);
    if (!el) return st.h;
    var head = el.querySelector('.dk-win-h');
    var box = el.querySelector('.dk-win-b');
    var headH = (head && head.offsetHeight) || 34;
    var bh = 0, i;

    if (st.kind === 'web') {
      bh = Math.max(420, st.h - headH);              /* iframe 测不到内容，给个稳的档 */
    } else if (st.kind === 'pdf') {
      var cs = box ? box.querySelectorAll('canvas') : [];
      for (i = 0; i < cs.length; i++) bh += cs[i].offsetHeight + 14;
      bh = bh ? bh + 20 : (box ? box.scrollHeight : 0);
    } else if (st.kind === 'xlsx') {
      var tb = box && box.querySelector('.dk-sheet table');
      bh = tb ? tb.getBoundingClientRect().height + 36 : 0;   /* 36 = 工作表标签栏 */
    } else {
      var inner = box && (box.querySelector('.dk-doc') || box.firstElementChild);
      bh = inner ? inner.getBoundingClientRect().height : (box ? box.scrollHeight : 0);
    }
    /* 还在解析 / 拿不到内容：保持原高度 */
    if (!bh || (box && box.querySelector('.dk-state'))) bh = st.h - headH;
    return Math.round(headH + bh + 2);
  }

  /* 跟别人的卡片压上了没有 */
  function hits(st) {
    var ids = Object.keys(wins);
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === st.id) continue;
      var b = wins[ids[i]];
      if (st.x < b.x + b.w && st.x + st.w > b.x &&
          st.y < b.y + b.h && st.y + st.h > b.y) return true;
    }
    return false;
  }

  /* 新放进来的一张卡片：高度收到刚好装下内容（只改它自己，不碰别的卡）。
     变高之后要是压住别人，就自己再挪一次，绝不推开已有的布局。 */
  function fitHeight(st) {
    if (st.maxed) return;
    var h = soloH(rawH(st));
    if (!h || Math.abs(h - st.h) < 8) return;
    st.h = h;
    if (hits(st)) {
      var pos = nextSpot(st.w, st.h, st.id);
      st.x = pos.x;
      st.y = pos.y;
    }
    applyBox(st);
    growStage();
    scheduleSave();
  }

  /* 新窗口落位：从左上往右下扫，找第一块不压住任何已有卡片的空地。
     完全按用户自己摆的位置来找空，不做任何整体重排。 */
  function nextSpot(w, h, skipId) {
    var pad = 22, gap = 16;
    var ids = Object.keys(wins).filter(function (id) { return id !== skipId; });
    if (!ids.length) return { x: pad, y: pad };

    w = Math.max(280, w || 460);
    h = Math.max(220, h || 360);

    var maxB = pad, i;
    var boxes = ids.map(function (id) { return wins[id]; });
    boxes.forEach(function (b) { maxB = Math.max(maxB, b.y + b.h); });

    function free(x, y) {
      for (var k = 0; k < boxes.length; k++) {
        var b = boxes[k];
        if (x < b.x + b.w + gap && x + w + gap > b.x &&
            y < b.y + b.h + gap && y + h + gap > b.y) return false;
      }
      return true;
    }

    var cw = Math.max(canvas.clientWidth || 0, 720);
    var step = 40, x, y;
    for (y = pad; y <= maxB + gap; y += step) {
      for (x = pad; x + w <= cw - pad; x += step) {
        if (free(x, y)) return { x: x, y: y };
      }
    }
    return { x: pad, y: maxB + gap };
  }

  /* ---------------- 内容渲染 ---------------- */
  /* ---------------- 网页 / 飞书文档窗口 ---------------- */
  function normalizeUrl(s) {
    var t = String(s || '').trim();
    if (!t) return '';
    if (!/^https?:\/\//i.test(t)) {
      if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?([\/?#].*)?$/i.test(t)) t = 'http://' + t;
      else if (/^[\w.-]+(:\d+)?([\/?#].*)?$/.test(t)) t = 'https://' + t;
      else return '';
    }
    try { new URL(t); } catch (e) { return ''; }
    return t;
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return '网页'; }
  }

  /* 飞书 / Lark 文档从链接里认出类型，标题先给个能认的名字，加载后不改 */
  function nameOfUrl(url) {
    var h = hostOf(url);
    var m = /\/(docx|docs|wiki|sheets|base|slides|mindnotes)\/([A-Za-z0-9]+)/.exec(url);
    if (m && /feishu|larksuite/.test(h)) {
      var kindMap = { docx: '文档', docs: '文档', wiki: '知识库', sheets: '表格', base: '多维表格', slides: '幻灯片', mindnotes: '思维笔记' };
      return (kindMap[m[1]] || '飞书') + ' · ' + m[2].slice(0, 8);
    }
    return h;
  }

  function webFrame(st) {
    var tip = /feishu|larksuite/.test(st.url)
      ? '飞书文档要先在分享里设成「互联网上获得链接的人可阅读」，否则这里会是空白'
      : '有些站点禁止被别的页面嵌套，空白就是被拦了';
    return '<div class="dk-web">' +
      '<div class="dk-web-bar">' +
        '<button type="button" class="dk-web-u" data-act="url" ' +
          'title="点这里换地址。想看固定的一屏：在飞书里把视图切好，复制地址栏整串（带 table= 和 view=）贴进来，以后每次打开都是这一屏">' +
          esc(hostOf(st.url)) +
        '</button>' +
        '<button type="button" data-act="open" title="在新标签页打开">在新标签打开</button>' +
      '</div>' +
      '<div class="dk-web-f">' +
        '<iframe src="' + esc(st.url) + '" referrerpolicy="no-referrer" allow="clipboard-read; clipboard-write; fullscreen"></iframe>' +
        '<div class="dk-web-load"><span class="dk-spin"></span><i>正在打开 ' + esc(hostOf(st.url)) + '</i></div>' +
        '<div class="dk-web-tip">' + esc(tip) + '</div>' +
      '</div>' +
      '</div>';
  }

  /* 点地址栏改链接：飞书切好的视图地址粘进来，下次打开就固定在这一屏 */
  function editUrl(st) {
    var el = elOf(st);
    if (!el) return;
    var u = el.querySelector('.dk-web-u');
    if (!u || u.querySelector('input')) return;
    var old = st.url;
    u.innerHTML = '<input class="dk-web-in" type="text" spellcheck="false" value="' + esc(old) + '">';
    var inp = u.querySelector('input');
    var done = false;
    inp.focus();
    inp.select();
    if (/feishu|larksuite/.test(old)) {
      toast('把浏览器地址栏那一整串贴进来（带 table= 和 view= 才会停在那一屏）', 6000);
    }

    function cancel() {
      if (done) return;
      done = true;
      u.textContent = hostOf(old);
    }
    function commit() {
      if (done) return;
      var v = normalizeUrl(inp.value);
      if (!v) { toast('这个地址不对，要 https:// 开头'); inp.focus(); return; }
      done = true;
      st.url = v;
      st.name = nameOfUrl(v);
      refreshHead(st);
      u.textContent = hostOf(v);
      u.title = v;
      renderBody(st, null);
      scheduleSave();
      toast(v === old ? '地址没变' : '地址已更新 · 以后打开就是这一页', 3200);
    }

    inp.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
    inp.addEventListener('blur', function () { setTimeout(commit, 120); });
    inp.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  }

  function addUrl(raw) {
    var url = normalizeUrl(raw);
    if (!url) { toast('这个链接不对，要 http:// 或 https:// 开头', 3800); return false; }

    var exists = Object.keys(wins).map(function (id) { return wins[id]; })
      .filter(function (w) { return w.kind === 'web' && w.url === url; })[0];
    if (exists) { raise(exists); toast('这个链接已经在画布上了'); return true; }

    var st = makeWindow({ id: 'url|' + url, name: nameOfUrl(url), kind: 'web', size: 0, url: url }, null);
    renderBody(st, null);
    scheduleSave();
    growStage();
    updateEmpty();
    if (/feishu|larksuite/.test(url) && !/[?&]view=/.test(url)) {
      toast('已放进画布 · 飞书想停在哪一屏：在新标签里把视图切好，复制地址栏整串（带 view=）点窗口上的域名贴进来', 7600);
    } else {
      toast('已放进画布 · ' + hostOf(url));
    }
    return true;
  }

  function errState(title, sub) {
    return DESKPARSE.fail(title, sub) ;
  }

  function renderBody(st, buf) {
    var el = elOf(st);
    if (!el) return;
    var box = el.querySelector('.dk-win-b');
    if (!box) return;
    if (box._pdfClean) { try { box._pdfClean(); } catch (e) {} box._pdfClean = null; }
    if (st.kind === 'note') { mountNote(st, box); return; }

    if (st.kind === 'web') {
      box.innerHTML = webFrame(st);
      var tipEl = box.querySelector('.dk-web-tip');
      var late = setTimeout(function () { if (tipEl) tipEl.classList.add('is-on'); }, 9000);
      var ld = box.querySelector('.dk-web-load');
      var fr = box.querySelector('iframe');
      var off = function () {
        clearTimeout(late);
        if (!ld) return;
        ld.classList.add('is-off');
        setTimeout(function () { if (ld.parentNode) ld.parentNode.removeChild(ld); }, 420);
      };
      if (fr) fr.addEventListener('load', off);
      setTimeout(function () { if (ld && !ld.classList.contains('is-off')) off(); }, 14000);
      return;
    }

    box.innerHTML = '<div class="dk-state"><div class="dk-spin"></div><span>正在解析…</span></div>';

    var t0 = Date.now();
    var job;
    try {
      if (st.kind === 'docx') {
        job = DESKPARSE.docx(buf).then(function (html) {
          box.innerHTML = '<div class="dk-doc">' + html + '</div>';
        });
      } else if (st.kind === 'xlsx') {
        job = DESKPARSE.xlsx(buf).then(function (sheets) {
          mountSheets(box, sheets);
        });
      } else if (st.kind === 'pdf') {
        var clean = DESKPARSE.pdf(buf, box);
        box._pdfClean = clean || null;
        job = Promise.resolve();
      } else if (st.kind === 'txt') {
        box.innerHTML = DESKPARSE.txt(buf);
        job = Promise.resolve();
      } else {
        box.innerHTML = errState('不支持的格式');
        job = Promise.resolve();
      }
    } catch (e) {
      box.innerHTML = errState('解析出错', (e && e.message) || String(e));
      job = Promise.resolve();
    }

    Promise.resolve(job).then(function () {
      var cost = Date.now() - t0;
      if (cost > 2500 && st.kind !== 'pdf') toast(st.name + ' 有点大，解析用了 ' + (cost / 1000).toFixed(1) + ' 秒');
      // 新放的卡片自动贴合内容高度
      if (st.autofit) { st.autofit = false; fitHeight(st); }
      // 恢复滚动位置
      if (st.scroll) { box.scrollTop = st.scroll; }
      box.addEventListener('scroll', function () {
        st.scroll = box.scrollTop;
        scheduleSave();
      }, { passive: true });
    }).catch(function (e) {
      box.innerHTML = errState('解析失败', (e && e.message) || String(e));
    });
  }

  function mountSheets(box, sheets) {
    var tabs = sheets.map(function (s, i) {
      return '<button type="button" class="dk-tab' + (i === 0 ? ' is-on' : '') + '" data-i="' + i +
        '" title="' + esc(s.name) + '">' + esc(s.name) + '</button>';
    }).join('');
    box.innerHTML = '<div class="dk-xls"><div class="dk-tabs">' + tabs +
      '</div><div class="dk-sheet">' + sheets[0].html + '</div></div>';
    var tabBar = box.querySelector('.dk-tabs');
    var sheetBox = box.querySelector('.dk-sheet');
    tabBar.addEventListener('click', function (e) {
      var b = e.target.closest('.dk-tab');
      if (!b) return;
      var i = +b.dataset.i;
      Array.prototype.forEach.call(tabBar.children, function (c) { c.classList.remove('is-on'); });
      b.classList.add('is-on');
      sheetBox.innerHTML = sheets[i].html;
      sheetBox.scrollTop = 0;
      sheetBox.scrollLeft = 0;
      // 宽表时让 sheet 自己滚，不带动整个窗口
      sheetBox.scrollIntoView({ block: 'nearest' });
    });
  }

  /* ---------------- 便签小卡片 ---------------- */
  function noteText(st) {
    if (isTk(st)) {
      var f0 = (st.note && st.note.f) || {}, buf = [];
      Object.keys(f0).forEach(function (k) {
        buf.push(String(f0[k] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      });
      return buf.join(' ');
    }
    var el = elOf(st);
    var ed = el && el.querySelector('.dk-note');
    if (ed) return String(ed.innerText || '');
    return String((st.note && st.note.html) || '').replace(/<[^>]+>/g, ' ');
  }

  function noteCount(st) {
    var t = noteText(st).replace(/\s+/g, '');
    return t.length;
  }

  function metaOf(st) {
    if (st.kind === 'note') {
      var n = noteCount(st);
      return n ? (n + ' 字') : '';
    }
    if (st.kind === 'web') return hostOf(st.url);
    return fmtSize(st.size);
  }

  function paintEmpty(ed) {
    if (!ed) return;
    var t = String(ed.innerText || '').replace(/\s+/g, '');
    ed.setAttribute('data-empty', t ? '0' : '1');
  }

  /* 窗口标题 = 便签正文的第一行，写什么就是什么 */
  function syncNoteName(st) {
    if (isTk(st)) {
      var fn = String(((st.note.f || {}).name) || '').replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ').trim();
      var nm2 = fn ? (fn.length > 18 ? fn.slice(0, 18) + '…' : fn) : tkName(ntStyle(st));
      if (st.name !== nm2) { st.name = nm2; refreshHead(st); }
      return;
    }
    var txt = noteText(st);
    var line = '';
    txt.split(/\n/).some(function (l) {
      if (l.replace(/\s+/g, '')) { line = l.trim(); return true; }
      return false;
    });
    var nm = line ? (line.length > 20 ? line.slice(0, 20) + '…' : line) : (NT_NAME[ntStyle(st)] || '卡片');
    if (st.name === nm) return;
    st.name = nm;
    refreshHead(st);
  }

  function mountNote(st, box) {
    if (!st.note) st.note = { style: 'plain', html: '' };
    if (isTk(st)) { mountTk(st, box); return; }
    var lockedNow = isWinLocked(st);
    box.innerHTML = '<div class="dk-note is-' + ntStyle(st) + '" spellcheck="false"' +
      ' contenteditable="' + (lockedNow ? 'false' : 'true') + '"' +
      ' data-ph="' + esc(NT_PH[ntStyle(st)]) + '">' + (st.note.html || '') + '</div>';
    var ed = box.querySelector('.dk-note');
    paintEmpty(ed);

    /* 打字就存，不用按保存 */
    ed.addEventListener('input', function () {
      st.note.html = ed.innerHTML;
      paintEmpty(ed);
      syncNoteName(st);
      var m = elOf(st) && elOf(st).querySelector('.dk-win-meta');
      if (m) m.textContent = metaOf(st);
      scheduleSave();
      queueFitNote(st);
    });
    ed.addEventListener('blur', function () {
      st.note.html = ed.innerHTML;
      scheduleSave();
    });
    /* 粘进来的东西只留纯文字，别把一堆网页样式带进来 */
    ed.addEventListener('paste', function (e) {
      if (!e.clipboardData) return;
      var t = e.clipboardData.getData('text/plain');
      if (t == null) return;
      e.preventDefault();
      document.execCommand('insertText', false, t);
    });
    ed.addEventListener('keydown', function (e) {
      e.stopPropagation();
    });

    st.autofit = false;
    if (!st.note.html) setTimeout(function () { try { ed.focus(); } catch (err) {} }, 140);
    syncNoteName(st);
    if (!st.ntManual) setTimeout(function () { autoFitNote(st); }, 180);
  }

  /* 票根卡：一块一块写，点哪块改哪块 */
  function mountTk(st, box) {
    var s = ntStyle(st), d = TK[s] || TK.sop, f = tkFields(st);
    var ph = d.ph || { name: '给它起个名', big: '一句数字', a: '写在这里……', b: '', c: '' };
    var ce = isWinLocked(st) ? 'false' : 'true';
    if (!st.note.no) st.note.no = nextNo();
    if (!st.note.date) st.note.date = mdToday();
    var no = padNo(st.note.no);

    function fld(key, cls, ph) {
      return '<div class="' + cls + '" contenteditable="' + ce + '" spellcheck="false"' +
        ' data-f="' + key + '" data-ph="' + esc(ph) + '">' + (f[key] || '') + '</div>';
    }

    box.innerHTML =
      '<div class="dk-note dk-tk" spellcheck="false">' +
        '<div class="tk-top">' +
          '<span class="tk-brand"><i></i><b>' + d.brand + '</b></span>' +
          '<span class="tk-no">NO.' + no + ' · ' + d.tag + '</span>' +
        '</div>' +
        '<div class="tk-halo">' + d.icon + '</div>' +
        fld('name', 'tk-name', ph.name) +
        '<div class="tk-quota">' +
          '<div class="tk-lab">' + d.lab + '</div>' +
          fld('big', 'tk-big', ph.big) +
        '</div>' +
        '<div class="tk-box">' +
          fld('a', 'tk-v', ph.a) +
          '<div class="tk-hr"></div>' +
          '<div class="tk-2">' +
            '<div>' + fld('b', 'tk-v', ph.b) + '</div>' +
            '<div>' + fld('c', 'tk-v', ph.c) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tk-stub">' +
          '<div class="tk-stub-l"><b>ADMIT ONE // 存档凭证</b>' + st.note.date + '</div>' +
          '<div class="tk-stub-no">' + no + '</div>' +
        '</div>' +
      '</div>';

    var root = box.querySelector('.dk-tk');
    Array.prototype.forEach.call(root.querySelectorAll('[data-f]'), paintField);

    function keyOf(t) {
      while (t && t !== root && !(t.getAttribute && t.getAttribute('data-f'))) t = t.parentElement;
      return (t && t !== root && t.getAttribute) ? t.getAttribute('data-f') : null;
    }

    root.addEventListener('input', function (e) {
      var k = keyOf(e.target);
      if (!k) return;
      f[k] = e.target.innerHTML;
      paintField(e.target);
      if (k === 'name') syncNoteName(st);
      scheduleSave();
      queueFitNote(st);
    });
    root.addEventListener('blur', function (e) {
      var k = keyOf(e.target);
      if (k) f[k] = e.target.innerHTML;
      scheduleSave();
    }, true);
    root.addEventListener('paste', function (e) {
      if (!e.clipboardData) return;
      var t = e.clipboardData.getData('text/plain');
      if (t == null) return;
      e.preventDefault();
      document.execCommand('insertText', false, t);
    });
    /* Tab 跳下一格，Shift+Tab 往回，写到一半不用摸鼠标 */
    root.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key !== 'Tab') return;
      e.preventDefault();
      var list = Array.prototype.slice.call(root.querySelectorAll('[data-f]'));
      var i = list.indexOf(e.target);
      var nx = list[i + (e.shiftKey ? -1 : 1)];
      if (nx) { try { nx.focus(); } catch (err) {} }
    });

    st.autofit = false;
    syncNoteName(st);
    if (!st.ntManual) setTimeout(function () { autoFitNote(st); }, 160);
  }

  /* 便签自己贴合内容：短了就收（不挪位置），长出来才长（压到别人就不长） */
  var ntFitT = null;
  function autoFitNote(st) {
    if (!st || st.maxed || st.ntManual || st.kind !== 'note') return;
    var el = elOf(st);
    if (!el) return;
    var ed = el.querySelector('.dk-note');
    if (!ed) return;
    var headH = isTk(st) ? 0 : ((el.querySelector('.dk-win-h') || {}).offsetHeight || 34);
    var bodyH = ed.scrollHeight;
    if (isTk(st)) {
      var rt = el.querySelector('.dk-tk');
      var last = rt && rt.lastElementChild;
      if (rt && last) {
        /* 量底栏的底边，量容器会把 flex 撑满的高度也算进来 */
        bodyH = Math.round(last.getBoundingClientRect().bottom - rt.getBoundingClientRect().top + 1);
      }
    }
    var want = Math.round(Math.min(MAH_MAX, Math.max(118, headH + bodyH + 2)));
    if (Math.abs(want - st.h) < 6) return;
    if (isTk(st) && want < st.h) return;   /* 票根卡是长条，只往长长，绝不自己缩回去 */
    if (want > st.h) {
      var ids = Object.keys(wins), hit = false, b, i;
      for (i = 0; i < ids.length; i++) {
        if (ids[i] === st.id) continue;
        b = wins[ids[i]];
        if (st.x < b.x + b.w && st.x + st.w > b.x &&
            st.y < b.y + b.h && st.y + want > b.y) { hit = true; break; }
      }
      if (hit) return;     /* 往下长会压到别人，那就不长，让它在卡片里滚 */
    }
    st.h = want;
    applyBox(st);
    growStage();
    scheduleSave();
  }

  function queueFitNote(st) {
    clearTimeout(ntFitT);
    ntFitT = setTimeout(function () { autoFitNote(st); }, 420);
  }

  /* 换样式：白卡 → 重点卡 → 引用卡 → 白卡 */
  function setNoteStyle(st, which) {
    if (!st.note) st.note = { style: 'plain', html: '' };
    var wasTk = isTk(st), willTk = !!TK[which];
    st.note.style = which;
    if (willTk) {
      if (!st.note.no) st.note.no = nextNo();
      if (!st.note.date) st.note.date = mdToday();
    }
    var el = elOf(st);
    if (el) el.setAttribute('data-nt', which);
    var box = el && el.querySelector('.dk-win-b');
    if (wasTk || willTk) {
      if (box) mountNote(st, box);
    } else if (box) {
      var ed = box.querySelector('.dk-note');
      if (ed) {
        ed.className = 'dk-note is-' + which;
        ed.setAttribute('data-ph', NT_PH[which]);
      }
    }
    if (!wasTk && !willTk && !noteCount(st)) {
      st.name = NT_NAME[which] || '卡片';
      refreshHead(st);
    }
    scheduleSave();
    toast('换成' + tkName(which) + '了');
  }

  function cycleNote(st) {
    var cur = ntStyle(st);
    if (TK[cur]) {
      setNoteStyle(st, TK_ORDER[(TK_ORDER.indexOf(cur) + 1) % TK_ORDER.length]);
    } else {
      setNoteStyle(st, NT_ORDER[(NT_ORDER.indexOf(cur) + 1) % NT_ORDER.length]);
    }
  }

  /* 新建一张便签：落在空地上，光标直接进去 */
  function newNote(style) {
    var tk = !!TK[style];
    var w = tk ? 344 : 380, h = tk ? 640 : 300;
    var pos = nextSpot(w, h);
    var note = { style: style || 'plain', html: '' };
    if (tk) { note.no = nextNo(); note.date = mdToday(); }
    var st = makeWindow({
      id: uid(), name: tkName(style), kind: 'note', size: 0, note: note
    }, { x: pos.x, y: pos.y, w: w, h: h });
    renderBody(st, null);
    growStage();
    updateEmpty();
    scheduleSave();
    var el = elOf(st);
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (locked) toast('画布锁着呢：卡片能放上来，但改不了字。点顶栏「已锁定」解开就能写', 5200);
    return st;
  }

  function refreshHead(st) {
    var el = elOf(st);
    if (!el) return;
    var t = el.querySelector('.dk-win-t');
    var ic = el.querySelector('.dk-ico');
    var m = el.querySelector('.dk-win-meta');
    if (t) { t.textContent = st.name; t.title = st.name; }
    if (ic) { ic.dataset.k = st.kind; ic.textContent = ICO[st.kind] || '?'; }
    if (m) m.textContent = metaOf(st);
  }

  /* ---------------- 新建窗口 ---------------- */
  function makeWindow(rec, box) {
    var ch = canvas.clientHeight || 640;
    var cw = canvas.clientWidth || 1200;
    var w = box ? box.w : Math.min(560, Math.max(360, Math.round(cw * 0.42)));
    var h = box ? box.h : Math.min(680, Math.max(300, Math.round(ch * 0.62)));
    var pos = (box && box.x != null) ? { x: box.x, y: box.y } : nextSpot(w, h);

    var st = {
      id: box && box.id ? box.id : uid(),
      fileId: rec.id,
      name: rec.name,
      kind: rec.kind,
      url: rec.url || '',
      size: rec.size || 0,
      note: rec.note ? packNote(rec.note) : null,
      x: pos.x, y: pos.y, w: w, h: h,
      z: ++zTop, maxed: false, prev: null, scroll: (box && box.scroll) || 0,
      sk: (box && box.sk) || null,
      lock: (box && box.lock) ? 1 : 0,
      autofit: !box && rec.kind !== 'web' && rec.kind !== 'note'
    };
    wins[st.id] = st;
    stage.insertAdjacentHTML('beforeend', winHTML(st));
    /* 新窗口上台，旧的取消高亮，保证同时只有一张是「当前卡片」 */
    Object.keys(wins).forEach(function (oid) {
      if (oid === st.id) return;
      var oe = elOf(wins[oid]);
      if (oe) oe.classList.remove('is-active');
    });
    var el = elOf(st);
    if (el) {
      if (isWinLocked(st)) el.classList.add('is-locked');
      el.classList.add('is-active');
      /* 落下来的小动画：从下方 10px 轻轻归位 */
      el.classList.add('is-in');
      el.addEventListener('animationend', function () { el.classList.remove('is-in'); }, { once: true });
      setTimeout(function () { el.classList.remove('is-in'); }, 900);
    }
    if (st.sk && window.DESKPaint) window.DESKPaint(st);
    return st;
  }

  /* ---------------- 拖拽 ---------------- */
  function startDrag(e, st, el) {
    if (isWinLocked(st)) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    var sx = e.clientX, sy = e.clientY, ox = st.x, oy = st.y;
    var moved = false;
    el.classList.add('is-drag');

    function move(ev) {
      var dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      moved = true;
      st.x = Math.max(0, ox + dx);
      st.y = Math.max(0, oy + dy);
      el.style.left = st.x + 'px';
      el.style.top = st.y + 'px';
      if (st.x + st.w + 140 > stage.offsetWidth || st.y + st.h + 140 > stage.offsetHeight) growStage();
    }
    function up() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      el.classList.remove('is-drag');
      if (moved) { growStage(); scheduleSave(); }
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }

  /* ---------------- 缩放 ---------------- */
  function startResize(e, st, el, dir) {
    if (isWinLocked(st)) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    var sx = e.clientX, sy = e.clientY;
    var o = { x: st.x, y: st.y, w: st.w, h: st.h };
    el.classList.add('is-resizing');

    function move(ev) {
      var dx = ev.clientX - sx, dy = ev.clientY - sy;
      var nx = o.x, ny = o.y, nw = o.w, nh = o.h;

      if (dir.indexOf('e') >= 0) nw = o.w + dx;
      if (dir.indexOf('s') >= 0) nh = o.h + dy;
      if (dir.indexOf('w') >= 0) { nw = o.w - dx; nx = o.x + dx; }
      if (dir.indexOf('n') >= 0) { nh = o.h - dy; ny = o.y + dy; }

      if (nw < MINW) { if (dir.indexOf('w') >= 0) nx = o.x + o.w - MINW; nw = MINW; }
      if (nh < MINH) { if (dir.indexOf('n') >= 0) ny = o.y + o.h - MINH; nh = MINH; }

      if (nx < 0) { nw += nx; nx = 0; if (nw < MINW) nw = MINW; }
      if (ny < 0) { nh += ny; ny = 0; if (nh < MINH) nh = MINH; }

      st.x = Math.round(nx); st.y = Math.round(ny);
      st.w = Math.round(nw); st.h = Math.round(nh);
      st.maxed = false;
      applyBox(st);
      if (st.w + st.x + 140 > stage.offsetWidth || st.h + st.y + 140 > stage.offsetHeight) growStage();
    }
    function up() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      el.classList.remove('is-resizing');
      /* 便签一旦被手动拉过，就不再自动收放，免得跟人抢 */
      if (st.kind === 'note') st.ntManual = 1;
      growStage();
      scheduleSave();
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }

  /* ---------------- 窗口操作 ---------------- */
  function toggleMax(st) {
    if (isWinLocked(st)) { toast('这张卡锁着，先解锁再改大小'); return; }
    var el = elOf(st);
    if (!el) return;
    if (st.maxed && st.prev) {
      st.x = st.prev.x; st.y = st.prev.y; st.w = st.prev.w; st.h = st.prev.h;
      st.maxed = false; st.prev = null;
    } else {
      st.prev = { x: st.x, y: st.y, w: st.w, h: st.h };
      st.x = Math.round(canvas.scrollLeft) + 8;
      st.y = Math.round(canvas.scrollTop) + 8;
      st.w = Math.max(MINW, canvas.clientWidth - 16);
      st.h = Math.max(MINH, canvas.clientHeight - 16);
      st.maxed = true;
    }
    applyBox(st);
    var e2 = elOf(st);
    if (e2) e2.classList.toggle('is-maxed', !!st.maxed);
    growStage();
    scheduleSave();
  }

  function closeWin(st) {
    if (isWinLocked(st)) { toast('这张卡锁着，先解锁再把卡片移走'); return; }
    var el = elOf(st);
    var shared = Object.keys(wins).some(function (id) {
      return id !== st.id && wins[id].fileId === st.fileId;
    });
    if (el) {
      var box = el.querySelector('.dk-win-b');
      if (box && box._pdfClean) { try { box._pdfClean(); } catch (e) {} }
      el.remove();
    }
    delete wins[st.id];
    if (!shared) IDB.del(st.fileId).catch(function () {});
    growStage();
    updateEmpty();
    scheduleSave();
    if (st.kind === 'note') {
      pushTrash(st);
      renumber();
      repaintNos();
      scheduleSave();
      toast('卡片放进回收站了 · 编号已经重排 · 在卡片库页面右上角能找回来', 4200);
      return;
    }
    toast(st.kind === 'web' ? '已移出画布' : '已移出画布 · 你本地的原文件没动');
  }

  function reloadWin(st) {
    if (st.kind === 'web') { renderBody(st, null); toast('已重新加载'); return; }
    pendingReplace = st.id;
    replaceEl.value = '';
    replaceEl.click();
  }

  /* ---------------- 添加文件 ---------------- */
  function addFiles(fileList) {
    var arr = Array.prototype.slice.call(fileList || []);
    if (!arr.length) return;
    var bad = [];
    arr = arr.filter(function (f) {
      if (kindOf(f.name)) return true;
      bad.push(whyUnsupported(f.name));
      return false;
    });
    if (bad.length) toast(bad[0], 4200);
    if (!arr.length) return;

    var chain = Promise.resolve();
    arr.forEach(function (f) {
      chain = chain.then(function () { return addOne(f); });
    });
    chain.then(function () { growStage(); updateEmpty(); });
  }

  function addOne(file) {
    if (file.size > MAX_FILE) {
      toast('「' + file.name + '」超过 40MB，先压缩一下再放进来', 4000);
      return Promise.resolve();
    }
    return file.arrayBuffer().then(function (buf) {
      var kind = kindOf(file.name);
      var same = Object.keys(wins).map(function (id) { return wins[id]; })
        .filter(function (w) { return w.name === file.name; });

      if (same.length) {
        var ok = window.confirm('画布里已经有「' + file.name + '」了。\n\n用新选的这个文件替换它的内容吗？（窗口位置和大小不变）');
        if (!ok) return;
        return IDB.put({ id: same[0].fileId, name: file.name, kind: kind, size: file.size, bin: buf, at: Date.now() })
          .then(function () {
            var st = same[0];
            st.kind = kind;
            st.size = file.size;
            refreshHead(st);
            renderBody(st, buf);
            scheduleSave();
            toast('已更新内容：' + file.name);
          });
      }

      var fileId = file.name + '|' + file.size + '|' + Date.now();
      return IDB.put({ id: fileId, name: file.name, kind: kind, size: file.size, bin: buf, at: Date.now() })
        .then(function () {
          var st = makeWindow({ id: fileId, name: file.name, kind: kind, size: file.size }, null);
          renderBody(st, buf);
          scheduleSave();
          growStage();
          updateEmpty();
        });
    }).catch(function (e) {
      toast('「' + file.name + '」读不进来：' + ((e && e.message) || e), 4200);
    });
  }

  /* ---------------- 恢复 ---------------- */
  function boot() {
    loadLock();
    paintLock();
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(LKEY) || 'null'); } catch (e) { raw = null; }

    var want = (raw && raw.theme) || '';
    if (!want) want = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(want);

    if (!raw || !Array.isArray(raw.wins) || !raw.wins.length) {
      updateEmpty();
      if (saveEl) saveEl.textContent = '空画布';
      return;
    }

    zTop = raw.wins.reduce(function (m, w) { return Math.max(m, w.z || 0); }, 100);

    IDB.all().then(function (recs) {
      var map = {};
      (recs || []).forEach(function (r) { map[r.id] = r; });

      var missing = 0, ok = 0;
      ghostWins = [];
      var jobs = [];
      raw.wins.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0); }).forEach(function (w) {
        var box = {
          id: w.id, x: Math.max(0, w.x | 0), y: Math.max(0, w.y | 0),
          w: Math.max(MINW, w.w | 0), h: Math.max(MINH, w.h | 0), scroll: w.scroll || 0,
          sk: w.sk || null, lock: w.lock ? 1 : 0
        };

        /* 票根卡归卡片库（cards.html）管，画布这边不画。
           assets/store.js 开页前已经把老数据里那批卡搬到 wb.cards.v1 了，这儿只是兜底 */
        if (w.kind === 'note') return;

        /* 网页 / 飞书链接窗口：不存文件，只存链接，直接按链接重建 */
        if (w.kind === 'web' && w.url) {
          var sw = makeWindow({ id: w.fileId, name: w.name, kind: 'web', size: 0, url: w.url }, box);
          sw.z = w.z || ++zTop;
          var ew = elOf(sw);
          if (ew) ew.style.zIndex = sw.z;
          ok++;
          renderBody(sw, null);
          return;
        }

        var rec = map[w.fileId];
        /* 文件不在本机：记一笔、这次不画，但数据要留着（见 ghostWins 的注释） */
        if (!rec) { missing++; ghostWins.push(w); return; }
        var st = makeWindow(rec, box);
        st.z = w.z || ++zTop;
        var el = elOf(st);
        if (el) el.style.zIndex = st.z;
        ok++;
        // 错开渲染，避免一次解析太多把页面卡住
        jobs.push(new Promise(function (res) {
          setTimeout(function () {
            renderBody(st, rec.bin);
            res();
          }, 60 * jobs.length);
        }));
      });

      // 最高层级那个设为激活
      var top = null;
      Object.keys(wins).forEach(function (id) {
        if (!top || wins[id].z > wins[top].z) top = id;
      });
      if (top) {
        var te = elOf(wins[top]);
        if (te) te.classList.add('is-active');
      }

      growStage();
      updateEmpty();
      /* 老数据里删过卡的编号是断的（比如 008 前面空了三个），开页先排成连续的 */
      renumber();
      repaintNos();
      scheduleSave();
      if (saveEl) saveEl.textContent = '已恢复';
      if (missing) {
        toast('有 ' + missing + ' 个文件在本机浏览器里找不到了（可能清过缓存），'
              + '位置给你留着，重新添加一次就好；云端那份没动', 6000);
      }
      return Promise.all(jobs);
    }).catch(function (e) {
      toast('读取本地文件失败：' + ((e && e.message) || e), 4800);
    });
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    canvas = $('canvas');
    stage = $('stage');

    /* 对外开一个小口子：外观面板要读窗口、改名字、触发保存 */
    window.DESK = {
      wins: function () { return wins; },
      elOf: elOf,
      save: scheduleSave,
      rename: function (st) { refreshHead(st); },
      active: function () {
        var best = null;
        Object.keys(wins).forEach(function (id) {
          var e = elOf(wins[id]);
          if (e && e.classList.contains('is-active')) best = wins[id];
        });
        return best;
      }
    };
    emptyEl = $('empty');
    toastEl = $('toast');
    saveEl = $('saveState');
    pickEl = $('fpick');
    replaceEl = $('freplace');
    dropEl = $('drop');

    // 顶栏
    $('btnAdd').addEventListener('click', function () { pickEl.click(); });
    $('btnTheme').addEventListener('click', function () {
      applyTheme(theme === 'dark' ? 'light' : 'dark');
      scheduleSave();
    });

    /* 锁定：点一下锁 / 解锁；右键或长按出菜单（备份与回滚） */
    var btnLock = $('btnLock'), lockMenu = $('lockMenu');
    if (btnLock) {
      btnLock.addEventListener('click', function (e) {
        e.preventDefault();
        setLock(!locked);
      });
      btnLock.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        openLockMenu();
      });
      var holdT = null;
      btnLock.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        holdT = setTimeout(function () { holdT = null; openLockMenu(); }, 480);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
        btnLock.addEventListener(t, function () { clearTimeout(holdT); });
      });
    }
    if (lockMenu) {
      lockMenu.addEventListener('click', function (e) {
        var b2 = e.target.closest('[data-lk2]');
        if (!b2 || b2.disabled) return;
        var k = b2.dataset.lk2;
        closeLockMenu();
        if (k === 'toggle') setLock(!locked);
        else if (k === 'back') restoreLayout(anchor, '锁定时那一版');
        else if (k === 'prev') restoreLayout(prevAnchor, '上一版布局');
        else if (k === 'export') exportLayout();
        else if (k === 'import') { var fj = $('fjson'); if (fj) fj.click(); }
      });
      document.addEventListener('pointerdown', function (e) {
        if (lockMenu.hidden) return;
        if (e.target.closest('#lockMenu') || e.target.closest('#btnLock')) return;
        closeLockMenu();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLockMenu();
      });
    }
    var fjson = $('fjson');
    if (fjson) {
      fjson.addEventListener('change', function () {
        if (this.files && this.files[0]) importLayout(this.files[0]);
        this.value = '';
      });
    }

    /* 新建便签卡片：弹窗三选一 */
    var noteBox = $('noteModal');
    function closeNoteModal() { if (noteBox) noteBox.classList.remove('is-on'); }
    var btnNote = $('btnNote');
    if (btnNote) {
      btnNote.addEventListener('click', function () {
        if (!noteBox) return;
        noteBox.classList.add('is-on');
      });
    }
    if (noteBox) {
      noteBox.addEventListener('click', function (e) {
        if (e.target === noteBox) { closeNoteModal(); return; }
        if (e.target.closest('[data-nm="no"]')) { closeNoteModal(); return; }
        var pk = e.target.closest('.nt-pick');
        if (pk) { closeNoteModal(); newNote(pk.dataset.nt); }
      });
    }

    /* 选中文字的浮动工具条在 assets/ntbar.js，画布和卡片库共用一份 */

    // 贴链接（飞书文档 / 任意网页）
    var linkBox = $('linkModal'), linkIn = $('linkInput');
    function openLink() {
      if (!linkBox) return;
      linkBox.classList.add('is-on');
      if (linkIn) { linkIn.value = ''; setTimeout(function () { linkIn.focus(); }, 60); }
    }
    function closeLink() { if (linkBox) linkBox.classList.remove('is-on'); }
    function submitLink() {
      if (!linkIn) return;
      if (addUrl(linkIn.value)) closeLink();
    }
    var btnLink = $('btnLink');
    if (btnLink) btnLink.addEventListener('click', openLink);
    if (linkBox) {
      linkBox.addEventListener('click', function (e) {
        if (e.target === linkBox) closeLink();
        if (e.target.closest('[data-lk="ok"]')) submitLink();
        if (e.target.closest('[data-lk="no"]')) closeLink();
      });
      if (linkIn) {
        linkIn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); submitLink(); }
          if (e.key === 'Escape') closeLink();
        });
      }
    }

    pickEl.addEventListener('change', function () {
      addFiles(this.files);
      this.value = '';
    });

    replaceEl.addEventListener('change', function () {
      var f = this.files && this.files[0];
      var st = pendingReplace ? wins[pendingReplace] : null;
      pendingReplace = null;
      if (!f || !st) return;
      var kind = kindOf(f.name);
      if (!kind) { toast(whyUnsupported(f.name), 4200); return; }
      f.arrayBuffer().then(function (buf) {
        return IDB.put({ id: st.fileId, name: f.name, kind: kind, size: f.size, bin: buf, at: Date.now() })
          .then(function () {
            st.name = f.name; st.kind = kind; st.size = f.size;
            refreshHead(st);
            renderBody(st, buf);
            scheduleSave();
            toast('已换成新版本：' + f.name);
          });
      }).catch(function (e) {
        toast('替换失败：' + ((e && e.message) || e), 4200);
      });
    });

    // 空白处点击取消激活
    canvas.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.dk-win')) return;
      Object.keys(wins).forEach(function (id) {
        var el = elOf(wins[id]);
        if (el) el.classList.remove('is-active');
      });
    });

    // 窗口交互委托
    stage.addEventListener('pointerdown', function (e) {
      var el = e.target.closest('.dk-win');
      if (!el) return;
      var st = wins[el.dataset.id];
      if (!st) return;
      raise(st);
      var hd = e.target.closest('.dk-h');
      if (hd) { startResize(e, st, el, hd.dataset.d); return; }
      if (e.target.closest('.dk-win-a')) return;
      var bar = e.target.closest('.dk-win-h') || e.target.closest('.tk-top');
      if (bar) { startDrag(e, st, el); return; }
    }, { passive: false });

    stage.addEventListener('click', function (e) {
      // 网页窗口：在新标签打开
      var ob = e.target.closest('.dk-web-bar button[data-act="open"]');
      if (ob) {
        var ow = wins[ob.closest('.dk-win').dataset.id];
        if (ow && ow.url) window.open(ow.url, '_blank', 'noopener');
        return;
      }
      var ub = e.target.closest('.dk-web-u');
      if (ub) {
        var uw = wins[ub.closest('.dk-win').dataset.id];
        if (uw) editUrl(uw);
        return;
      }
      var btn = e.target.closest('.dk-win-a button');
      if (!btn) return;
      var el = btn.closest('.dk-win');
      var st = wins[el.dataset.id];
      if (!st) return;
      var act = btn.dataset.act;
      if (act === 'lock') toggleWinLock(st);
      else if (act === 'nt') cycleNote(st);
      else if (act === 'close') closeWin(st);
      else if (act === 'max') toggleMax(st);
      else if (act === 'reload') reloadWin(st);
    });

    // 拖文件进来
    var dragDepth = 0;
    window.addEventListener('dragenter', function (e) {
      if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') < 0) return;
      e.preventDefault();
      dragDepth++;
      dropEl.classList.add('is-on');
    });
    window.addEventListener('dragover', function (e) {
      if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') < 0) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    window.addEventListener('dragleave', function (e) {
      if (e.relatedTarget) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) dropEl.classList.remove('is-on');
    });
    window.addEventListener('drop', function (e) {
      if (!e.dataTransfer) return;
      e.preventDefault();
      dragDepth = 0;
      dropEl.classList.remove('is-on');
      if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    });

    // 键盘：Esc 收起拖放遮罩
    window.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      dropEl.classList.remove('is-on');
      if (noteBox && noteBox.classList.contains('is-on')) closeNoteModal();
      hideNtBar();
    });

    window.addEventListener('resize', function () { growStage(); });

    applyMobile();   /* 先按屏幕宽度定好手机还是桌面，再画卡片 */
    /* 老数据里混着的票根卡先搬去卡片库，画布只留链接和文件 */
    if (window.WBStore) { try { window.WBStore.migrate(); } catch (e) {} }
    boot();

    /* 同步：点那个云朵开设置面板 */
    var btnSync = $('btnSync');
    if (btnSync) {
      btnSync.addEventListener('click', function () {
        if (window.WBSync) window.WBSync.panel();
      });
    }
    if (window.WBSync) {
      window.WBSync.init({
        onApplied: function () {
          /* 云端那份更新的部分已经写进 localStorage 了，刷一次让画布按新数据重建 */
          frozen = true;
          clearTimeout(saveTimer);
          location.reload();
        },
        onStatus: paintSync
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
