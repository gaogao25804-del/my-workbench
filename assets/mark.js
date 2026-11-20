/* ==========================================================
   手绘重点标记 · mark.js
   选中一段字 → 工具条上点一下（高亮 / 下划线 / 方框 / 圈 / 划线），
   画出来的是手画的毛边线；再点同一支笔就把标记取消。

   两条铁律，改之前先看：
   1. 笔画是 SVG，由库插在「被标记的 span」旁边，存数据前必须摘掉，
      不然它会跟着 innerHTML 一起存进 note.f，越存越多，字也越长越乱。
   2. 存下来的只有 <span class="mk" data-mk="类型">文字</span>，
      重画全靠它，所以别把这个 span 的类名改掉。
   ========================================================== */
(function () {
  'use strict';

  var RN = window.RoughNotation;
  if (!RN) return;

  var live = new WeakMap();   /* span -> 画出来的那条标注 */
  var born = new WeakMap();   /* span -> 什么时候画上去的 */
  var TYPES = {
    highlight: 1, underline: 1, box: 1, circle: 1,
    'strike-through': 1, bracket: 1, 'crossed-off': 1
  };

  function plain(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

  /* 主题色是 hex，高亮要半透明，转一下 */
  function rgba(c, a) {
    c = String(c || '').trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (m) {
      var h = m[1];
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' +
        parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
    }
    m = /^rgba?\(([^)]+)\)$/i.exec(c);
    if (m) {
      var p = m[1].split(',');
      return 'rgba(' + p[0].trim() + ',' + p[1].trim() + ',' + p[2].trim() + ',' + a + ')';
    }
    return c;
  }

  function cardOf(el) {
    return (el && el.closest && el.closest('.cd-card, .dk-win')) || document.body;
  }

  /* 颜色跟着卡片主题走：高亮是半透明的色块，其余是实色线 */
  function colorFor(span, type) {
    var cs = getComputedStyle(cardOf(span));
    var base = (cs.getPropertyValue('--c2') || '').trim() ||
      (cs.getPropertyValue('--c') || '').trim() || '#38cdab';
    return type === 'highlight' ? rgba(base, .5) : base;
  }

  function draw(span, animate) {
    var type = span.getAttribute('data-mk');
    if (!TYPES[type] || !plain(span.textContent)) return null;
    var hl = type === 'highlight';
    var a = RN.annotate(span, {
      type: type,
      color: colorFor(span, type),
      strokeWidth: hl ? 3.1 : (type === 'underline' ? 2 : 1.7),
      animationDuration: animate ? 620 : 0,
      iterations: 2,
      padding: hl ? 4 : 3,
      multiline: true
    });
    live.set(span, a);
    born.set(span, Date.now());
    try { a.show(); } catch (e) { return null; }
    return a;
  }

  function clear(span) {
    var a = live.get(span);
    if (!a) return;
    try { a.remove(); } catch (e) {}
    live.delete(span);
  }

  /* 文字动了、窗口变了、换主题了，都得按新位置重画一遍（不然线还停在老地方） */
  function refresh(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('[data-mk]'), function (sp) {
      if (!plain(sp.textContent)) { clear(sp); return; }
      if (live.has(sp) && Date.now() - (born.get(sp) || 0) < 900) return;  /* 刚画完，别打断动画 */
      clear(sp);
      draw(sp, false);
    });
  }

  function unwrap(span) {
    clear(span);
    var p = span.parentNode;
    if (!p) return;
    while (span.firstChild) p.insertBefore(span.firstChild, span);
    p.removeChild(span);
  }

  /* 把选区包成 <span data-mk>，包不住了就返回 null */
  function wrapRange(range, type) {
    var frag;
    try { frag = range.extractContents(); } catch (e) { return null; }
    if (!frag) return null;

    /* 选区里夹着旧的笔画 / 旧的标记，先拆干净，别套娃 */
    Array.prototype.forEach.call(frag.querySelectorAll('svg'), function (s) { s.remove(); });
    Array.prototype.forEach.call(frag.querySelectorAll('[data-mk]'), function (s) {
      var p = s.parentNode;
      if (!p) return;
      while (s.firstChild) p.insertBefore(s.firstChild, s);
      p.removeChild(s);
    });

    var span = document.createElement('span');
    span.className = 'mk';
    span.setAttribute('data-mk', type);
    span.appendChild(frag);
    try { range.insertNode(span); } catch (e) { return null; }
    return span;
  }

  function toggle(type) {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    var range = sel.getRangeAt(0);
    if (range.collapsed) return false;

    /* 选中整段已经在同类标记里 → 再点一次就是取消 */
    var na = sel.anchorNode, nf = sel.focusNode;
    var ea = na && (na.nodeType === 1 ? na : na.parentElement);
    var ef = nf && (nf.nodeType === 1 ? nf : nf.parentElement);
    var sa = ea && ea.closest ? ea.closest('[data-mk]') : null;
    var sf = ef && ef.closest ? ef.closest('[data-mk]') : null;
    if (sa && sa === sf && sa.getAttribute('data-mk') === type) {
      unwrap(sa);
      return true;
    }

    var span = wrapRange(range, type);
    if (!span) return false;

    /* 标记完把选中态收掉，不然整块还带着蓝色的选区 */
    try {
      var r = document.createRange();
      r.selectNodeContents(span);
      r.collapse(false);
      sel.removeAllRanges();
    } catch (e) {}

    draw(span, true);
    return true;
  }

  /* 存盘前调一下：克隆一份、摘掉笔画，别污染原文 */
  function strip(node) {
    if (!node) return '';
    var c = node.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('svg'), function (s) { s.remove(); });
    Array.prototype.forEach.call(c.querySelectorAll('[data-mk]'), function (sp) {
      if (sp.style && sp.style.position === 'relative') {
        sp.style.removeProperty('position');
        if (!sp.getAttribute('style')) sp.removeAttribute('style');
      }
    });
    return c.innerHTML;
  }

  /* 工具条的「清」：把选中范围里画过的笔全摘掉（范围外的别动） */
  function clearInSel() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return 0;
    var range = sel.getRangeAt(0);
    var host = range.commonAncestorContainer;
    host = host && (host.nodeType === 1 ? host : host.parentElement);
    var scope = (host && host.closest && host.closest('.cd-name, .cd-body, .dk-note')) || document;
    var n = 0;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-mk]'), function (sp) {
      if (range.intersectsNode ? range.intersectsNode(sp) : true) { unwrap(sp); n++; }
    });
    return n;
  }

  window.Mark = {
    toggle: toggle,
    refresh: refresh,
    strip: strip,
    draw: draw,
    clear: clear,
    clearInSel: clearInSel
  };
})();
