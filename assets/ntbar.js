/* ==========================================================
   选中文字浮出的工具条（画布 / 卡片库共用）
   加粗 · 字色 · 荧光笔 · 清格式
   只要选中的字落在 .dk-note 里就出条，飘在卡片外面不挡字
   ========================================================== */
(function () {
  'use strict';

  var bar = document.getElementById('noteBar');
  if (!bar) return;

  /* 字色用 CSS 变量存，深浅两套自动换 */
  var FG = { r: '--fg-red', o: '--fg-orange', g: '--fg-green', b: '--fg-blue', p: '--fg-purple' };
  /* execCommand 不认 var()，会直接吞掉。先写一个没人用的占位色，再改成变量 */
  var SENT = {
    r: 'rgb(1, 2, 3)', o: 'rgb(4, 5, 6)', g: 'rgb(7, 8, 9)',
    b: 'rgb(10, 11, 12)', p: 'rgb(13, 14, 15)'
  };
  function norm(c) { return String(c || '').replace(/\s+/g, '').toLowerCase(); }

  /* 把占位色换成 var(--fg-*)，没换到的（浏览器拆成了别的结构）就按色系兜底 */
  function retag(host, key) {
    var css = 'var(' + FG[key] + ')';
    var want = norm(SENT[key]);
    Array.prototype.forEach.call(host.querySelectorAll('span[style], font[color]'), function (el) {
      var cur = norm(el.style && el.style.color);
      if (!cur && el.tagName === 'FONT') cur = norm(el.getAttribute('color'));
      if (cur === want) {
        if (el.tagName === 'FONT') {
          var sp = document.createElement('span');
          sp.textContent = el.textContent;
          el.replaceWith(sp);
          el = sp;
        }
        el.style.color = css;
      }
    });
  }

  /* 恢复默认颜色：把这堆变量色摘掉，别的样式（加粗、荧光笔）别动 */
  function stripFg(host) {
    Array.prototype.forEach.call(host.querySelectorAll('span[style]'), function (el) {
      if (/var\(--fg-/.test(String(el.style.color || ''))) {
        el.style.color = '';
        if (!el.getAttribute('style')) el.removeAttribute('style');
        if (el.tagName === 'SPAN' && !el.getAttribute('style') && !el.className) {
          var p = el.parentNode;
          while (el.firstChild) p.insertBefore(el.firstChild, el);
          p.removeChild(el);
        }
      }
    });
  }

  var ed = null, range = null;

  function edOfSel() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var n = sel.anchorNode || sel.focusNode;
    var el = n && (n.nodeType === 1 ? n : n.parentElement);
    if (!el || !el.closest) return null;
    /* 画布是 .dk-note，卡片库是大标题 / 正文这两块 */
    return el.closest('.dk-note, .cd-name, .cd-body');
  }
  function hide() { bar.hidden = true; }

  /* 颜色写成 var(--fg-*)，深浅两套跟着主题换，不用烧死在字上 */
  function colorOf(key) {
    var v = FG[key];
    return v ? 'var(' + v + ')' : '';
  }

  /* 摆位置：一律飘在卡片外侧——上面放得下就放上面，否则放卡片下面 */
  function place() {
    if (!ed || !range) { hide(); return; }
    var r = range.getBoundingClientRect();
    if (!r || (!r.width && !r.height)) { hide(); return; }

    bar.hidden = false;
    var bw = bar.offsetWidth || 230;
    var bh = bar.offsetHeight || 34;
    var cx = r.left + r.width / 2;
    var x = Math.max(bw / 2 + 10, Math.min(window.innerWidth - bw / 2 - 10, cx));
    var wrap = ed.closest('.dk-win') || ed.closest('.cd-card');
    var wr = wrap ? wrap.getBoundingClientRect() : null;

    /* 卡片贴着顶栏的时候，上面那条位置会正好压住分组标题条，翻到卡片下面去 */
    var y, above = false;
    var roomUp = wr ? wr.top - bh - 10 : 0;
    if (wr && roomUp >= 160) { y = roomUp; above = true; }
    else if (wr && wr.bottom + bh + 12 <= window.innerHeight) y = wr.bottom + 8;
    else if (wr && roomUp >= 52) { y = roomUp; above = true; }
    else y = 52;
    bar.setAttribute('data-side', above ? 'top' : 'bottom');

    /* 选区在视口外就别飘着 */
    if (r.bottom < 0 || r.top > window.innerHeight) { hide(); return; }

    /* 水平方向别飘出卡片 */
    if (wr && wr.width > bw + 24) {
      x = Math.max(wr.left + bw / 2 + 6, Math.min(wr.right - bw / 2 - 6, x));
    }
    bar.style.left = Math.round(x) + 'px';
    bar.style.top = Math.round(y) + 'px';
  }

  document.addEventListener('selectionchange', function () {
    var host = edOfSel();
    var sel = window.getSelection();
    var ok = host && host.getAttribute('contenteditable') !== 'false' &&
      sel && !sel.isCollapsed && String(sel).trim();
    if (!ok) { ed = host || null; hide(); return; }
    ed = host;
    try { range = sel.getRangeAt(0).cloneRange(); } catch (e) { range = null; }
    place();
  });

  /* 页面一滚，位置就变了，跟着挪，不然会压在别的东西上 */
  window.addEventListener('scroll', function () { if (!bar.hidden) place(); }, true);
  window.addEventListener('resize', function () { if (!bar.hidden) place(); });

  /* 按在工具条上不能把输入框里的选区抢走 */
  bar.addEventListener('mousedown', function (e) { e.preventDefault(); });

  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-nt2]');
    if (!btn || !ed) return;
    var k = btn.getAttribute('data-nt2');
    var host = ed;
    /* 让 execCommand 写 style 不写 <font>，这样颜色能写成 CSS 变量 */
    try { document.execCommand('styleWithCSS', false, true); } catch (e0) {}
    try { host.focus({ preventScroll: true }); } catch (err) { host.focus(); }
    if (range) {
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(range);
      s = null;
    }

    if (k === 'b') {
      document.execCommand('bold');
    } else if (k === 'clear') {
      if (window.Mark) window.Mark.clearInSel();
      try { document.execCommand('hiliteColor', false, 'transparent'); } catch (e2) {}
      document.execCommand('removeFormat');
      stripFg(host);
    } else if (k.indexOf('fg:') === 0) {
      var key = k.slice(3);
      if (key === 'd') {
        stripFg(host);
      } else if (SENT[key]) {
        try { document.execCommand('foreColor', false, SENT[key]); } catch (e4) {}
        /* 选中的字已经被包进 span 了，把占位色换成变量 */
        retag(host, key);
      }
    } else if (k.indexOf('hl:') === 0) {
      var rgb = 'rgb(' + k.slice(3) + ')';
      var done = false;
      try { done = document.execCommand('hiliteColor', false, rgb); } catch (e5) { done = false; }
      if (!done) { try { document.execCommand('backColor', false, rgb); } catch (e6) {} }
    } else if (k.indexOf('mk:') === 0) {
      /* 手绘标记：包一层 span，交给 mark.js 画；再点一次同一支笔就取消 */
      if (window.Mark) window.Mark.toggle(k.slice(3));
    }

    /* 让页面知道内容变了，好存 */
    try { host.dispatchEvent(new Event('input', { bubbles: true })); } catch (e7) {}

    setTimeout(function () {
      var s2 = window.getSelection();
      if (s2 && s2.rangeCount && !s2.isCollapsed) {
        try { range = s2.getRangeAt(0).cloneRange(); } catch (e8) {}
      }
    }, 0);
  });

  /* 回车换段的时候把工具条收掉，别赖在屏幕上 */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });
})();
