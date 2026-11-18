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

  var ed = null, range = null;

  function edOfSel() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var n = sel.anchorNode;
    var el = n && (n.nodeType === 1 ? n : n.parentElement);
    return el && el.closest ? el.closest('.dk-note') : null;
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
    var wrap = ed.closest('.dk-win');
    var wr = wrap ? wrap.getBoundingClientRect() : null;

    var y, above = false;
    if (wr && wr.top - bh - 10 >= 52) { y = wr.top - bh - 10; above = true; }
    else if (wr && wr.bottom + bh + 12 <= window.innerHeight) y = wr.bottom + 8;
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
      try { document.execCommand('hiliteColor', false, 'transparent'); } catch (e2) {}
      try { document.execCommand('foreColor', false, 'currentColor'); } catch (e3) {}
      document.execCommand('removeFormat');
    } else if (k.indexOf('fg:') === 0) {
      var key = k.slice(3);
      var c = key === 'd' ? 'currentColor' : colorOf(key);
      if (!c) return;
      try { document.execCommand('foreColor', false, c); } catch (e4) {}
    } else if (k.indexOf('hl:') === 0) {
      var rgb = 'rgb(' + k.slice(3) + ')';
      var done = false;
      try { done = document.execCommand('hiliteColor', false, rgb); } catch (e5) { done = false; }
      if (!done) { try { document.execCommand('backColor', false, rgb); } catch (e6) {} }
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
