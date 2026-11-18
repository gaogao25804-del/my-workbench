/* ==========================================================
   画布 · 外观工作台（desk-skin.js）
   - 五个风格预设，点一下整块画布换气质
   - 圆角 / 阴影 / 悬停浮起 / 字号 / 留白……逐项滑杆，实时生效
   - 作用范围可切到「只改选中的这张」，单卡单独定制
   - 底下留一个能随便写 CSS 的口子，写什么算什么
   ========================================================== */
(function () {
  'use strict';

  var SKEY = 'wb.desk.skin.v1';

  /* ---------------- 参数表 ---------------- */
  var GROUPS = [
    {
      id: 'card', t: '卡片', items: [
        { k: '--dk-r', t: '圆角', type: 'rng', min: 0, max: 36, step: 1, unit: 'px', def: 10, one: 1 },
        { k: 'shadow', t: '阴影浓度', type: 'rng', min: 0, max: 2.5, step: .05, unit: '', def: 1, one: 1 },
        { k: 'lift', t: '悬停浮起', type: 'rng', min: 0, max: 20, step: 1, unit: 'px', def: 0 },
        { k: 'scale', t: '悬停放大', type: 'rng', min: 1, max: 1.06, step: .002, unit: '', def: 1 },
        { k: 'dur', t: '过渡时长', type: 'rng', min: 0, max: 600, step: 10, unit: 'ms', def: 200 },
        { k: 'opacity', t: '不透明度', type: 'rng', min: .3, max: 1, step: .02, unit: '', def: 1, one: 1 },
        { k: '--dk-win', t: '卡片底色', type: 'clr', def: '#ffffff', one: 1 },
        { k: '--dk-bd-win', t: '边框颜色', type: 'clr', def: '#e5e5e5' }
      ]
    },
    {
      id: 'head', t: '标题栏', items: [
        { k: '--dk-win-h', t: '底色', type: 'clr', def: '#f7f7f9', one: 1 },
        { k: '--dk-head-h', t: '高度', type: 'rng', min: 26, max: 56, step: 1, unit: 'px', def: 34 },
        { k: '--dk-head-fs', t: '标题字号', type: 'rng', min: 10, max: 16, step: .5, unit: 'px', def: 12.5 },
        { k: '--dk-tx', t: '文字颜色', type: 'clr', def: '#1d1d1f', one: 1 }
      ]
    },
    {
      id: 'bodyg', t: '正文', items: [
        { k: '--dk-doc-fs', t: '字号', type: 'rng', min: 11, max: 20, step: .5, unit: 'px', def: 14, one: 1 },
        { k: '--dk-doc-lh', t: '行高', type: 'rng', min: 1.3, max: 2.4, step: .05, unit: '', def: 1.75, one: 1 },
        { k: '--dk-pad-y', t: '上下留白', type: 'rng', min: 8, max: 64, step: 2, unit: 'px', def: 30 },
        { k: '--dk-pad-x', t: '左右留白', type: 'rng', min: 8, max: 64, step: 2, unit: 'px', def: 34 }
      ]
    },
    {
      id: 'cv', t: '画布', items: [
        { k: '--dk-canvas', t: '底色', type: 'clr', def: '#ececf0' },
        { k: '--dk-grid', t: '网格颜色', type: 'clr', def: '#f3f3f5' },
        { k: '--dk-grid-s', t: '网格密度', type: 'rng', min: 12, max: 64, step: 4, unit: 'px', def: 24 },
        { k: 'gridOn', t: '显示网格', type: 'sw', def: true }
      ]
    }
  ];

  var ALLVARS = [
    '--dk-r', '--dk-bd-win', '--dk-win', '--dk-win-h', '--dk-tx',
    '--dk-canvas', '--dk-grid', '--dk-grid-s',
    '--dk-doc-fs', '--dk-doc-lh', '--dk-pad-y', '--dk-pad-x',
    '--dk-head-h', '--dk-head-fs',
    '--dk-lift', '--dk-hover-s', '--dk-fx',
    '--dk-shadow', '--dk-shadow-h', '--dk-shadow-a'
  ];

  var PRESETS = {
    native: {
      label: '原生', vars: {}, c: {},
      fx: { lift: 0, scale: 1, dur: 200, shadow: 1 }
    },
    card: {
      label: '卡片微交互',
      vars: {
        '--dk-r': '18px', '--dk-head-h': '38px', '--dk-head-fs': '13px',
        '--dk-doc-fs': '14.5px', '--dk-doc-lh': '1.85',
        '--dk-pad-y': '26px', '--dk-pad-x': '28px', '--dk-grid-s': '28px'
      },
      c: {
        light: {
          '--dk-canvas': '#f4f1ec', '--dk-win': '#ffffff', '--dk-win-h': '#ffffff',
          '--dk-tx': '#1f1f24', '--dk-bd-win': 'rgba(0,0,0,0)', '--dk-grid': 'rgba(120,105,85,.055)'
        },
        dark: {
          '--dk-canvas': '#131315', '--dk-win': '#1e1e22', '--dk-win-h': '#232328',
          '--dk-tx': '#f2f2f5', '--dk-bd-win': 'rgba(255,255,255,0)', '--dk-grid': 'rgba(255,255,255,.04)'
        }
      },
      fx: { lift: 8, scale: 1.007, dur: 220, shadow: 1.15 }
    },
    glass: {
      label: '玻璃',
      vars: {
        '--dk-r': '20px', '--dk-head-h': '38px', '--dk-head-fs': '13px',
        '--dk-doc-fs': '14.5px', '--dk-doc-lh': '1.85',
        '--dk-pad-y': '26px', '--dk-pad-x': '30px', '--dk-grid-s': '26px'
      },
      c: {
        light: {
          '--dk-canvas': '#e6ecf6', '--dk-win': 'rgba(255,255,255,.62)',
          '--dk-win-h': 'rgba(255,255,255,.34)', '--dk-tx': '#1a1c22',
          '--dk-bd-win': 'rgba(255,255,255,.7)', '--dk-grid': 'rgba(60,80,120,.06)'
        },
        dark: {
          '--dk-canvas': '#0f1116', '--dk-win': 'rgba(32,34,42,.62)',
          '--dk-win-h': 'rgba(255,255,255,.06)', '--dk-tx': '#f0f2f8',
          '--dk-bd-win': 'rgba(255,255,255,.16)', '--dk-grid': 'rgba(255,255,255,.045)'
        }
      },
      fx: { lift: 8, scale: 1.008, dur: 260, shadow: 1.2 }
    },
    line: {
      label: '极简线框',
      vars: {
        '--dk-r': '6px', '--dk-head-h': '32px', '--dk-head-fs': '12px',
        '--dk-doc-fs': '14px', '--dk-doc-lh': '1.72',
        '--dk-pad-y': '22px', '--dk-pad-x': '26px', '--dk-grid-s': '32px'
      },
      c: {
        light: {
          '--dk-canvas': '#f7f7f8', '--dk-win': '#ffffff', '--dk-win-h': '#fafafa',
          '--dk-tx': '#17171a', '--dk-bd-win': 'rgba(0,0,0,.17)', '--dk-grid': 'rgba(0,0,0,.035)'
        },
        dark: {
          '--dk-canvas': '#101012', '--dk-win': '#191919', '--dk-win-h': '#1f1f1f',
          '--dk-tx': '#f4f4f5', '--dk-bd-win': 'rgba(255,255,255,.2)', '--dk-grid': 'rgba(255,255,255,.04)'
        }
      },
      fx: { lift: 2, scale: 1, dur: 160, shadow: 0 }
    },
    paper: {
      label: '纸感',
      vars: {
        '--dk-r': '14px', '--dk-head-h': '36px', '--dk-head-fs': '12.5px',
        '--dk-doc-fs': '14px', '--dk-doc-lh': '1.9',
        '--dk-pad-y': '28px', '--dk-pad-x': '30px', '--dk-grid-s': '30px'
      },
      c: {
        light: {
          '--dk-canvas': '#e9e1d3', '--dk-win': '#fdfaf3', '--dk-win-h': '#f7f1e4',
          '--dk-tx': '#2f2a24', '--dk-bd-win': 'rgba(90,70,40,.14)', '--dk-grid': 'rgba(120,95,60,.05)'
        },
        dark: {
          '--dk-canvas': '#181512', '--dk-win': '#221d18', '--dk-win-h': '#2a241d',
          '--dk-tx': '#f3ece0', '--dk-bd-win': 'rgba(255,240,215,.15)', '--dk-grid': 'rgba(255,240,215,.04)'
        }
      },
      fx: { lift: 4, scale: 1.004, dur: 220, shadow: .85 }
    }
  };

  var SNIPS = [
    { t: '卡片', c: '.dk-win {\n  \n}' },
    { t: '悬停态', c: '.dk-win:hover {\n  \n}' },
    { t: '标题栏', c: '.dk-win-h {\n  \n}' },
    { t: '标题文字', c: '.dk-win-t {\n  \n}' },
    { t: '正文', c: '.dk-doc {\n  \n}' },
    { t: '画布', c: '.dk-canvas {\n  \n}' },
    { t: '这一张', c: '' }   /* 运行时替换成具体 id */
  ];

  var X_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';

  var skin = load();
  var scope = 'all';
  var panel = null, cssTag = null, saveT = null, toastT = null;

  /* ---------------- 基础 ---------------- */
  function D() { return window.DESK || null; }

  function baseSkin() {
    return {
      preset: 'native', lift: 0, scale: 1, dur: 200, shadow: 1, gridOn: true,
      vars: {}, c: { light: {}, dark: {} }, css: ''
    };
  }

  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { s = null; }
    var b = baseSkin();
    if (!s || typeof s !== 'object') return b;
    Object.keys(b).forEach(function (k) { if (s[k] == null) s[k] = b[k]; });
    s.vars = s.vars && typeof s.vars === 'object' ? s.vars : {};
    s.c = s.c && typeof s.c === 'object' ? s.c : { light: {}, dark: {} };
    s.c.light = s.c.light || {};
    s.c.dark = s.c.dark || {};
    return s;
  }

  function saveSoon() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      try { localStorage.setItem(SKEY, JSON.stringify(skin)); } catch (e) {}
    }, 240);
  }

  function theme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function cssVar(el, k) {
    if (!el) return '';
    return getComputedStyle(el).getPropertyValue(k).trim();
  }

  function num(v, def) {
    var n = parseFloat(v);
    return isNaN(n) ? def : n;
  }

  function fmt(n, unit) {
    var s = String(Math.round(n * 1000) / 1000);
    return unit ? s + unit : s;
  }

  function h2(n) {
    n = Math.max(0, Math.min(255, Math.round(n)));
    return (n < 16 ? '0' : '') + n.toString(16);
  }

  /* 颜色统一转 #rrggbb：带 alpha 的按当前主题底色压一下，显示起来才不跑偏 */
  function toHex(v) {
    v = String(v || '').trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
      return v.length === 4
        ? '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]
        : v;
    }
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s\/]+([\d.]+))?\s*\)/i.exec(v);
    if (!m) return theme() === 'dark' ? '#1f1f22' : '#ffffff';
    var r = +m[1], g = +m[2], b = +m[3];
    var a = m[4] == null ? 1 : +m[4];
    if (a < 1) {
      var bg = theme() === 'dark' ? [18, 18, 20] : [255, 255, 255];
      r = r * a + bg[0] * (1 - a);
      g = g * a + bg[1] * (1 - a);
      b = b * a + bg[2] * (1 - a);
    }
    return '#' + h2(r) + h2(g) + h2(b);
  }

  /* 阴影跟着浓度和主题算，一处改全都跟着变 */
  function shadowOf(t, k) {
    if (k == null) k = 1;
    if (k <= .02) return 'none';
    var dk = t === 'dark';
    var a1 = (dk ? .40 : .05) * Math.min(k, 1.25);
    var a2 = (dk ? .70 : .14) * k;
    var y2 = Math.round(8 + 5 * k);
    var bl = Math.round(24 + 16 * k);
    var sp = -Math.round(8 + 3 * k);
    return '0 1px 2px rgba(0,0,0,' + a1.toFixed(3) + '), 0 ' + y2 + 'px ' + bl +
      'px ' + sp + 'px rgba(0,0,0,' + a2.toFixed(3) + ')';
  }

  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove('is-on'); }, 2400);
  }

  /* ---------------- 当前选中的卡片 ---------------- */
  function curWin() {
    var d = D();
    if (!d) return null;
    var ws = d.wins(), best = null;
    Object.keys(ws).forEach(function (id) {
      var el = d.elOf(ws[id]);
      if (el && el.classList.contains('is-active')) best = ws[id];
    });
    return best;
  }

  /* ---------------- 应用 ---------------- */
  function applySkin() {
    var st = document.documentElement.style;

    ALLVARS.forEach(function (v) { st.removeProperty(v); });

    Object.keys(skin.vars).forEach(function (k) {
      if (skin.vars[k] != null && skin.vars[k] !== '') st.setProperty(k, skin.vars[k]);
    });

    var colors = skin.c[theme()] || {};
    Object.keys(colors).forEach(function (k) {
      if (colors[k]) st.setProperty(k, colors[k]);
    });

    st.setProperty('--dk-lift', (num(skin.lift, 0)) + 'px');
    st.setProperty('--dk-hover-s', num(skin.scale, 1));
    st.setProperty('--dk-fx', Math.max(0, num(skin.dur, 200)) + 'ms');
    st.setProperty('--dk-shadow', shadowOf(theme(), num(skin.shadow, 1)));
    st.setProperty('--dk-shadow-h', shadowOf(theme(), num(skin.shadow, 1) * 2));
    st.setProperty('--dk-shadow-a', shadowOf(theme(), num(skin.shadow, 1) * 1.7));

    document.documentElement.setAttribute('data-skin', skin.preset === 'native' ? '' : skin.preset);
    if (document.body) document.body.setAttribute('data-grid', skin.gridOn === false ? 'off' : 'on');

    if (cssTag) cssTag.textContent = skin.css || '';
  }

  /* 单张卡片：把值写到这个元素的内联变量上，子元素照样继承 */
  function paintWin(st) {
    var d = D();
    if (!st) return;
    var el = d ? d.elOf(st) : null;
    if (!el) return;

    ALLVARS.forEach(function (v) { el.style.removeProperty(v); });
    el.style.removeProperty('opacity');

    var s = st.sk || {};
    Object.keys(s).forEach(function (k) {
      if (k.charAt(0) === '-' && s[k] != null && s[k] !== '') el.style.setProperty(k, s[k]);
    });
    if (s.shadow != null) {
      el.style.setProperty('--dk-shadow', shadowOf(theme(), s.shadow));
      el.style.setProperty('--dk-shadow-h', shadowOf(theme(), s.shadow * 2));
    }
    if (s.opacity != null && s.opacity < 1) el.style.opacity = s.opacity;
  }
  window.DESKPaint = paintWin;

  /* ---------------- 取值 ---------------- */
  function itemOf(k) {
    var found = null;
    GROUPS.forEach(function (g) {
      g.items.forEach(function (it) { if (it.k === k) found = it; });
    });
    return found;
  }

  function curVal(it) {
    var k = it.k;

    if (scope === 'one') {
      var st = curWin();
      if (st) {
        if (st.sk && st.sk[k] != null) return st.sk[k];
        if (k === 'shadow') return num(skin.shadow, 1) * (st.sk && st.sk.shadow != null ? 1 : 1);
        if (k === 'opacity') return 1;
        if (k.charAt(0) === '-') {
          var el = D() ? D().elOf(st) : null;
          var v = cssVar(el, k);
          if (v) return v;
        }
      }
      return it.def;
    }

    if (it.type === 'sw') return skin[k] !== false;
    if (it.type === 'clr') {
      var c = (skin.c[theme()] || {})[k];
      if (c) return c;
      var rootV = cssVar(document.documentElement, k);
      return rootV || it.def;
    }
    if (k === 'shadow' || k === 'lift' || k === 'scale' || k === 'dur') return num(skin[k], it.def);
    if (k.charAt(0) === '-') {
      if (skin.vars[k] != null) return skin.vars[k];
      var rv = cssVar(document.documentElement, k);
      return rv || it.def;
    }
    return it.def;
  }

  function setVal(it, v) {
    var k = it.k;

    if (scope === 'one') {
      var st = curWin();
      if (!st) { toast('先点一张卡片，再调这一张'); return false; }
      st.sk = st.sk || {};
      if (it.type === 'rng' && it.unit) v = v + it.unit;
      st.sk[k] = v;
      paintWin(st);
      if (D()) D().save();
      return true;
    }

    if (it.type === 'sw') {
      skin[k] = !!v;
    } else if (it.type === 'clr') {
      skin.c[theme()][k] = v;
    } else if (k.charAt(0) === '-') {
      skin.vars[k] = it.unit ? v + it.unit : v;
    } else {
      skin[k] = v;
    }
    applySkin();
    saveSoon();
    return true;
  }

  /* ---------------- 面板 ---------------- */
  function ctrlHTML(it) {
    var v = curVal(it);
    var lab = '<span class="sk-l">' + it.t + '<em></em></span>';

    if (it.type === 'rng') {
      var n = num(v, it.def);
      return '<label class="sk-r"><span class="sk-l">' + it.t +
        '<em>' + fmt(n, it.unit) + '</em></span>' +
        '<input type="range" data-k="' + it.k + '" min="' + it.min + '" max="' + it.max +
        '" step="' + it.step + '" value="' + n + '"></label>';
    }
    if (it.type === 'clr') {
      var hex = toHex(v);
      return '<label class="sk-r is-c"><span class="sk-l">' + it.t +
        '<em>' + hex + '</em></span>' +
        '<input type="color" data-k="' + it.k + '" value="' + hex + '"></label>';
    }
    if (it.type === 'sw') {
      return '<label class="sk-r is-s"><span class="sk-l">' + it.t + '</span>' +
        '<input type="checkbox" data-k="' + it.k + '"' + (v ? ' checked' : '') + '>' +
        '<i class="sw2"></i></label>';
    }
    return lab;
  }

  function buildPanel() {
    var html = '';

    html += '<div class="sk-hd"><div class="grow2"><b>外观</b>' +
      '<i>卡片微交互 · 每一项都能改</i></div>' +
      '<button class="sk-x" type="button" data-a="close" title="收起">' + X_SVG + '</button></div>';

    html += '<div class="sk-bd">';

    /* 预设 */
    html += '<div class="sk-g"><div class="sk-gt">风格预设</div><div class="sk-pres">' +
      Object.keys(PRESETS).map(function (k) {
        return '<button type="button" class="sk-p' + (skin.preset === k ? ' is-on' : '') +
          '" data-p="' + k + '"><i class="sw sw-' + k + '"></i>' + PRESETS[k].label + '</button>';
      }).join('') + '</div></div>';

    /* 范围 */
    var one = scope === 'one';
    var st = curWin();
    html += '<div class="sk-g"><div class="sk-gt">改哪儿</div><div class="sk-sc">' +
      '<button type="button" data-s="all" class="' + (one ? '' : 'is-on') + '">全部卡片</button>' +
      '<button type="button" data-s="one" class="' + (one ? 'is-on' : '') + '">只改选中的这张</button>' +
      '</div><div class="sk-note' + (one && !st ? ' is-warn' : '') + '">' +
      (one
        ? (st ? '正在改：' + esc(st.name) : '还没选中卡片，先点一张（标题栏变橙框那个）')
        : '改的是整块画布的默认值，已有的单卡设置不会被覆盖')
      + '</div></div>';

    /* 分组 */
    GROUPS.forEach(function (g) {
      var items = g.items.filter(function (it) { return !one || it.one; });
      if (!items.length) return;
      html += '<div class="sk-g"><div class="sk-gt">' + g.t + '</div>' +
        items.map(ctrlHTML).join('') + '</div>';
    });

    /* 单卡专属：改名 + 清除 */
    if (one) {
      html += '<div class="sk-g"><div class="sk-gt">这张卡片</div>' +
        '<label class="sk-r is-t"><span class="sk-l">标题</span>' +
        '<input type="text" data-rename value="' + esc(st ? st.name : '') + '" placeholder="先选一张卡片"></label>' +
        '<div style="padding:6px 0 2px"><button type="button" class="sk-p" data-a="clearOne" ' +
        'style="width:100%;justify-content:center">清掉这张的单独设置</button></div></div>';
    }

    /* 自定义 CSS */
    html += '<div class="sk-g"><div class="sk-gt">自己写 CSS</div>' +
      '<div class="sk-tags">' +
      SNIPS.map(function (s, i) { return '<button type="button" data-snip="' + i + '">+' + s.t + '</button>'; }).join('') +
      '</div>' +
      '<textarea class="sk-css" spellcheck="false" placeholder="' + esc('.dk-win {\n  /* 直接写，只影响这块画布 */\n}') + '">' + esc(skin.css || '') + '</textarea>' +
      '<div class="sk-csshint">写得比变量更狠就加 <code>!important</code>；单张卡片用 <code>.dk-win[data-id="wxxx"]</code> 点名。</div>' +
      '</div>';

    html += '</div>';

    html += '<div class="sk-ft">' +
      '<button type="button" data-a="reset" class="is-danger">恢复默认</button>' +
      '<button type="button" data-a="copy">复制这套</button>' +
      '<button type="button" data-a="paste">粘贴一套</button>' +
      '</div>';

    panel.innerHTML = html;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function refresh() {
    buildPanel();
  }

  /* ---------------- 事件 ---------------- */
  function onInput(e) {
    var t = e.target;

    if (t.classList && t.classList.contains('sk-css')) {
      skin.css = t.value;
      if (cssTag) cssTag.textContent = skin.css;
      saveSoon();
      return;
    }

    var k = t.getAttribute && t.getAttribute('data-k');
    if (!k) return;
    var it = itemOf(k);
    if (!it) return;

    var v;
    if (it.type === 'sw') v = t.checked;
    else if (it.type === 'clr') v = t.value;
    else v = parseFloat(t.value);

    if (!setVal(it, v)) return;

    var em = t.parentNode.querySelector('.sk-l em');
    if (em) em.textContent = it.type === 'clr' ? t.value : fmt(v, it.unit || '');
  }

  function onClick(e) {
    var b = e.target.closest('button');
    if (!b) return;

    var p = b.getAttribute('data-p');
    if (p) { applyPreset(p); return; }

    var s = b.getAttribute('data-s');
    if (s) { scope = s === 'one' ? 'one' : 'all'; refresh(); return; }

    var sn = b.getAttribute('data-snip');
    if (sn != null) { insertSnip(+sn); return; }

    var a = b.getAttribute('data-a');
    if (a === 'close') { close(); return; }
    if (a === 'reset') { doReset(); return; }
    if (a === 'copy') { doCopy(); return; }
    if (a === 'paste') { doPaste(); return; }
    if (a === 'clearOne') { clearOne(); return; }
  }

  function onRename(e) {
    var t = e.target;
    if (!t.hasAttribute || !t.hasAttribute('data-rename')) return;
    var st = curWin();
    if (!st) return;
    st.name = t.value.trim() || st.name;
    var d = D();
    if (d && d.rename) d.rename(st);
    if (d) d.save();
  }

  function applyPreset(name) {
    var p = PRESETS[name];
    if (!p) return;

    skin.preset = name;
    skin.vars = {};
    skin.c = { light: {}, dark: {} };
    Object.keys(p.vars || {}).forEach(function (k) {
      skin.vars[k] = p.vars[k];
    });
    ['light', 'dark'].forEach(function (t) {
      var src = (p.c && p.c[t]) || {};
      Object.keys(src).forEach(function (k) { skin.c[t][k] = src[k]; });
    });
    skin.lift = p.fx.lift;
    skin.scale = p.fx.scale;
    skin.dur = p.fx.dur;
    skin.shadow = p.fx.shadow;

    applySkin();
    saveSoon();
    refresh();
    toast('外观换成「' + p.label + '」');
  }

  function doReset() {
    skin = baseSkin();
    applySkin();
    saveSoon();
    refresh();
    toast('已回到默认外观（单卡的单独设置还留着）');
  }

  function clearOne() {
    var st = curWin();
    if (!st) { toast('先点一张卡片'); return; }
    st.sk = null;
    paintWin(st);
    if (D()) D().save();
    refresh();
    toast('这张卡片的单独设置清掉了');
  }

  function doCopy() {
    var txt = JSON.stringify(skin, null, 2);
    function done() { toast('已经复制，粘到别处就能用'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt); done(); });
    } else {
      fallbackCopy(txt); done();
    }
  }

  function fallbackCopy(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  function doPaste() {
    var txt = window.prompt('把之前复制的那段外观 JSON 粘进来：');
    if (!txt) return;
    try {
      var o = JSON.parse(txt);
      if (!o || typeof o !== 'object') throw new Error('不是一个对象');
      var b = baseSkin();
      Object.keys(b).forEach(function (k) { if (o[k] == null) o[k] = b[k]; });
      o.vars = o.vars || {};
      o.c = o.c || { light: {}, dark: {} };
      o.c.light = o.c.light || {};
      o.c.dark = o.c.dark || {};
      skin = o;
      applySkin();
      saveSoon();
      refresh();
      toast('外观已导入');
    } catch (err) {
      toast('这段不太对：' + ((err && err.message) || err), 3200);
    }
  }

  function insertSnip(i) {
    var s = SNIPS[i];
    if (!s) return;
    var txt = s.c;
    if (!txt) {
      var st = curWin();
      txt = '.dk-win[data-id="' + (st ? st.id : 'wxxx') + '"] {\n  \n}';
    }
    var ta = panel.querySelector('.sk-css');
    if (!ta) return;
    var a = ta.selectionStart, b = ta.selectionEnd;
    ta.value = ta.value.slice(0, a) + txt + ta.value.slice(b);
    var nl = txt.indexOf('\n');
    var pos = a + (nl >= 0 ? nl + 3 : txt.length);
    ta.selectionStart = ta.selectionEnd = pos;
    ta.focus();
    skin.css = ta.value;
    if (cssTag) cssTag.textContent = skin.css;
    saveSoon();
  }

  function open() {
    if (!panel) return;
    panel.classList.add('is-on');
    panel.setAttribute('aria-hidden', 'false');
    refresh();
  }

  function close() {
    if (!panel) return;
    panel.classList.remove('is-on');
    panel.setAttribute('aria-hidden', 'true');
  }

  function toggle() {
    if (!panel) return;
    if (panel.classList.contains('is-on')) close(); else open();
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    cssTag = document.createElement('style');
    cssTag.id = 'skCustomCss';
    document.head.appendChild(cssTag);

    panel = document.createElement('aside');
    panel.className = 'sk';
    panel.id = 'skinPanel';
    panel.setAttribute('aria-hidden', 'true');
    document.body.appendChild(panel);

    buildPanel();
    applySkin();

    panel.addEventListener('input', onInput);
    panel.addEventListener('change', onInput);
    panel.addEventListener('click', onClick);
    panel.addEventListener('change', onRename);

    var btn = document.getElementById('btnSkin');
    if (btn) btn.addEventListener('click', toggle);

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-on')) close();
    });

    /* 换主题：阴影和按主题存的颜色都得重算 */
    new MutationObserver(function () {
      applySkin();
      Object.keys(D() ? D().wins() : {}).forEach(function (id) {
        var st = D().wins()[id];
        if (st.sk) paintWin(st);
      });
      if (panel.classList.contains('is-on')) refresh();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /* 点别的卡片时，如果正在改单卡，面板的显示值要跟着换 */
    var stageEl = document.getElementById('stage');
    if (stageEl) {
      stageEl.addEventListener('pointerdown', function () {
        if (scope !== 'one') return;
        setTimeout(function () { if (panel.classList.contains('is-on')) refresh(); }, 0);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
