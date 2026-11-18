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
  var theme = 'light';
  var saveTimer = null;
  var pendingReplace = null;

  var ICO = { docx: 'W', xlsx: 'X', pdf: 'P', txt: 'T', web: '↗' };

  var SVG = {
    reload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6"/><path d="M20.5 4.2V10h-5.6"/></svg>',
    max: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4.5" width="15" height="15" rx="2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6L6 18M18 6l1.6-1.6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5.5v13M5.5 12h13"/></svg>'
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
  }

  function updateEmpty() {
    if (!emptyEl) return;
    var n = Object.keys(wins).length;
    emptyEl.classList.toggle('is-hide', n > 0);
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
        sk: w.sk || null
      };
    });
    return { v: 2, theme: theme, wins: list, at: Date.now() };
  }

  function scheduleSave() {
    if (saveEl) { saveEl.textContent = '未保存'; saveEl.classList.add('is-dirty'); }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(LKEY, JSON.stringify(snapshot()));
        if (saveEl) { saveEl.textContent = '已保存'; saveEl.classList.remove('is-dirty'); }
      } catch (e) {
        if (saveEl) saveEl.textContent = '保存失败';
        toast('布局没存上：' + ((e && e.message) || e));
      }
    }, 380);
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
    return '<div class="dk-win" data-id="' + st.id + '" style="left:' + st.x + 'px;top:' + st.y +
      'px;width:' + st.w + 'px;height:' + st.h + 'px;z-index:' + st.z + '">' +
      '<div class="dk-win-h">' +
        '<span class="dk-ico" data-k="' + st.kind + '">' + (ICO[st.kind] || '?') + '</span>' +
        '<span class="dk-win-t" title="' + esc(st.name) + '">' + esc(st.name) + '</span>' +
        '<span class="dk-win-meta">' + (st.kind === 'web' ? hostOf(st.url) : fmtSize(st.size)) + '</span>' +
        '<div class="dk-win-a">' +
          '<button type="button" data-act="reload" title="重新导入这个文件的新版本">' + SVG.reload + '</button>' +
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
        '<span class="dk-web-u" title="' + esc(st.url) + '">' + esc(hostOf(st.url)) + '</span>' +
        '<button type="button" data-act="open" title="在新标签页打开">在新标签打开</button>' +
      '</div>' +
      '<div class="dk-web-f">' +
        '<iframe src="' + esc(st.url) + '" referrerpolicy="no-referrer" allow="clipboard-read; clipboard-write; fullscreen"></iframe>' +
        '<div class="dk-web-tip">' + esc(tip) + '</div>' +
      '</div>' +
      '</div>';
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
    toast('已放进画布 · ' + hostOf(url));
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
    if (st.kind === 'web') {
      box.innerHTML = webFrame(st);
      var tipEl = box.querySelector('.dk-web-tip');
      var late = setTimeout(function () { if (tipEl) tipEl.classList.add('is-on'); }, 9000);
      var fr = box.querySelector('iframe');
      if (fr) fr.addEventListener('load', function () { clearTimeout(late); });
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

  function refreshHead(st) {
    var el = elOf(st);
    if (!el) return;
    var t = el.querySelector('.dk-win-t');
    var ic = el.querySelector('.dk-ico');
    var m = el.querySelector('.dk-win-meta');
    if (t) { t.textContent = st.name; t.title = st.name; }
    if (ic) { ic.dataset.k = st.kind; ic.textContent = ICO[st.kind] || '?'; }
    if (m) m.textContent = st.kind === 'web' ? hostOf(st.url) : fmtSize(st.size);
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
      x: pos.x, y: pos.y, w: w, h: h,
      z: ++zTop, maxed: false, prev: null, scroll: (box && box.scroll) || 0,
      sk: (box && box.sk) || null,
      autofit: !box && rec.kind !== 'web'
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
      growStage();
      scheduleSave();
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }

  /* ---------------- 窗口操作 ---------------- */
  function toggleMax(st) {
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
      var jobs = [];
      raw.wins.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0); }).forEach(function (w) {
        var box = {
          id: w.id, x: Math.max(0, w.x | 0), y: Math.max(0, w.y | 0),
          w: Math.max(MINW, w.w | 0), h: Math.max(MINH, w.h | 0), scroll: w.scroll || 0,
          sk: w.sk || null
        };

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
        if (!rec) { missing++; return; }
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
      if (saveEl) saveEl.textContent = '已恢复';
      if (missing) {
        toast('有 ' + missing + ' 个文件在本机浏览器里找不到了（可能清过缓存），重新添加一次就行', 5200);
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
      var bar = e.target.closest('.dk-win-h');
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
      var btn = e.target.closest('.dk-win-a button');
      if (!btn) return;
      var el = btn.closest('.dk-win');
      var st = wins[el.dataset.id];
      if (!st) return;
      var act = btn.dataset.act;
      if (act === 'close') closeWin(st);
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
      if (e.key === 'Escape') dropEl.classList.remove('is-on');
    });

    window.addEventListener('resize', function () { growStage(); });

    boot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
