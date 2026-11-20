/* ==========================================================
   卡片库背景 · grid-bg.js
   照 magicui 的 FlickeringGrid 改的原生版：
   网格线由 CSS 画（清晰、不吃 JS），这里只用 canvas 让格子里
   偶尔亮一小块、亮完自己淡下去。颜色跟深浅主题走。
   ========================================================== */
(function () {
  'use strict';

  var host = document.querySelector('.cd-bg');
  if (!host) return;
  var cv = host.querySelector('canvas');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var CELL = 40;            /* 跟 CSS 里的 --cd-cell 一致 */
  var PAD = 1;              /* 方块比格子缩一点，不压网格线 */
  var SPAWN = 0.013;        /* 每秒每格被点亮的概率 */
  var SPAWN_MAX = 26;       /* 大屏封顶，别整屏都在跳 */
  var LIFE_MIN = 1.5;
  var LIFE_MAX = 2.8;

  var dpr = 1, W = 0, H = 0, cols = 0, rows = 0;
  var live = [];            /* 正亮着的方块 */
  var rgb = '15, 23, 42';
  var opMax = 0.085;
  var spawnAcc = 0;
  var raf = 0;
  var last = 0;
  var running = false;
  var reduced = false;

  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function readTheme() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    rgb = dark ? '255, 255, 255' : '15, 23, 42';
    opMax = dark ? 0.06 : 0.055;
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = host.clientWidth || window.innerWidth || 0;
    H = host.clientHeight || window.innerHeight || 0;
    if (!W || !H) return;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / CELL);
    rows = Math.ceil(H / CELL);
    live.length = 0;        /* 尺寸变了，旧位置没意义 */
    spawnAcc = 0;
    if (!running) drawOnce();
  }

  function blocks() {
    return cols * rows;
  }

  function make(i, j) {
    return {
      i: i, j: j,
      t: 0,
      life: LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN),
      k: 0.42 + Math.random() * 0.58      /* 有的亮有的浅 */
    };
  }

  /* 这一格以及它周围八格有没有正亮着的？有就别点亮，
     免得三块并成一片抹布 */
  function crowded(i, j) {
    for (var n = 0; n < live.length; n++) {
      var c = live[n];
      if (Math.abs(c.i - i) <= 1 && Math.abs(c.j - j) <= 1) return true;
    }
    return false;
  }

  function spawn() {
    for (var tryN = 0; tryN < 4; tryN++) {
      var i = (Math.random() * cols) | 0;
      var j = (Math.random() * rows) | 0;
      if (crowded(i, j)) continue;
      live.push(make(i, j));
      return;
    }
  }

  function paint() {
    for (var n = 0; n < live.length; n++) {
      var c = live[n];
      var p = c.t / c.life;
      var a = opMax * c.k * Math.sin(Math.PI * (p > 1 ? 1 : p));
      if (a <= 0.004) continue;
      ctx.fillStyle = 'rgba(' + rgb + ',' + a.toFixed(3) + ')';
      ctx.fillRect(c.i * CELL + PAD, c.j * CELL + PAD, CELL - PAD * 2, CELL - PAD * 2);
    }
  }

  function drawOnce() {
    ctx.clearRect(0, 0, W, H);
    paint();
  }

  function frame(now) {
    raf = window.requestAnimationFrame(frame);
    if (!last) last = now;
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;           /* 切后台回来别一口气补上百帧 */

    var rate = Math.min(SPAWN_MAX, blocks() * SPAWN);
    spawnAcc += rate * dt;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      spawn();
    }

    ctx.clearRect(0, 0, W, H);
    var keep = 0;
    for (var n = 0; n < live.length; n++) {
      var c = live[n];
      c.t += dt;
      if (c.t >= c.life) continue;    /* 活到头就扔掉 */
      live[keep++] = c;
    }
    live.length = keep;
    paint();
  }

  function start() {
    if (running || reduced) return;
    running = true;
    last = 0;
    raf = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  readTheme();
  resize();
  start();

  var rt = 0;
  window.addEventListener('resize', function () {
    if (rt) clearTimeout(rt);
    rt = setTimeout(resize, 160);
  }, false);

  /* 主题一换，方块颜色跟着换 */
  if (window.MutationObserver) {
    new MutationObserver(function () {
      readTheme();
      if (!running) drawOnce();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* 切到别的标签页就别烧电 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  }, false);
})();
