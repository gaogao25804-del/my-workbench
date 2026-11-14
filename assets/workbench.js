/* ============================================================
   个人工作台 · 应用逻辑
   数据源：feishu-data.json / library-data.json / 文案/
   文案与视频为本地静态清单（含本地文件路径）
   ============================================================ */
'use strict';

/* ---------------- 图标 ---------------- */
const ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 10v10.5h13V10"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  book: '<path d="M4 4.5h6a2.5 2.5 0 0 1 2.5 2.5v12.5a2.2 2.2 0 0 0-2.2-2.2H4z"/><path d="M20 4.5h-6a2.5 2.5 0 0 0-2.5 2.5v12.5a2.2 2.2 0 0 1 2.2-2.2H20z"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevL: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  chevR: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.4 6.4"/><path d="M20 5v6h-6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 19.5h16"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  inbox: '<path d="M3 12.5 5.5 5.5h13L21 12.5v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/><path d="M3 12.5h5l1.5 2.5h5l1.5-2.5h5"/>',
  pixel: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
  image: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M3 16.5 8 12l4 3.5 3-2.5 6 5"/>',
  palette: '<path d="M12 21a9 9 0 1 1 9-9c0 2.2-1.8 3.5-3.8 3.5H15a2 2 0 0 0-1.6 3.2c.4.5.6 1 .6 1.3 0 .6-.9 1-2 1z"/><circle cx="7.6" cy="10.2" r=".9"/><circle cx="10.5" cy="7" r=".9"/><circle cx="14.5" cy="7" r=".9"/><circle cx="17.4" cy="10" r=".9"/>',
  pen: '<path d="M15.7 3.3a2.2 2.2 0 0 1 3.1 3.1L7.4 17.8l-4.4 1.3 1.3-4.4z"/><path d="M13.5 5.5 18.5 10.5"/>',
  eraser: '<path d="M9 20.5h11"/><path d="M4.5 15.8 12.7 7.6a1.8 1.8 0 0 1 2.6 0l3.6 3.6a1.8 1.8 0 0 1 0 2.6l-6.4 6.4H7l-2.5-2.5a1.8 1.8 0 0 1 0-2.6z"/><path d="M9.5 10.8 15.7 17"/>',
  line: '<path d="M4 20 20 4"/>',
  rect: '<rect x="4" y="6.5" width="16" height="11" rx="1.5"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6"/>',
  undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h9a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="M15 7l5 5-5 5"/><path d="M20 12h-9a5 5 0 0 0 0 10h3"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/>',
  mic: '<rect x="9" y="2.8" width="6" height="10.4" rx="3"/><path d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0"/><path d="M12 17.6V21"/><path d="M8.6 21h6.8"/>',
  bolt: '<path d="M13.2 2.6 5.4 13.4h5.2L10.2 21.4 18.6 10.2h-5.4z"/>',
  chart: '<path d="M4 20.2h16"/><rect x="5.4" y="11" width="3.4" height="6.2" rx="1"/><rect x="10.3" y="6.6" width="3.4" height="10.6" rx="1"/><rect x="15.2" y="13.4" width="3.4" height="3.8" rx="1"/>'
};

function ic(name, cls) {
  return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICON_PATHS[name] || '') + '</svg>';
}

/* ---------------- 页面配置 ---------------- */
const PAGES = {
  home:    { title: '主页',       desc: '工作台概览 · 数据来自飞书本地快照' },
  tasks:   { title: '任务与日历', desc: '飞书任务月历视图 · 支持筛选与分页', actions: ['refresh'] },
  library: { title: '图书馆',     desc: '藏书浏览 · 搜索与分页查看书摘和思考' },
  koubo:   { title: '口播工坊',   desc: '自己写 · 自己改 · 定稿得你自己点' },
  wenan:   { title: '成品文案',   desc: '完整成片 · 分段 + 画面 + 口播' },
  pixel:   { title: '像素工坊',   desc: '图片转像素风 · 去背导出透明 PNG' },
  draw:    { title: '画板',       desc: '随手画 · 导出 PNG / JPG 到本地' },
  report:  { title: '战报',       desc: '每月视频数据 · 大盘 / 明细 / TOP10' },
  radar:   { title: '今日雷达',   desc: '每天抓一遍 · 一天存一份 · 挑一条直接开稿' }
};

const PAGE_SIZE = { task: 20 };

/* ---------------- 全局状态 ---------------- */
const st = {
  tab: 'home',
  group: 'create',
  feishu: null,
  library: null,
  report: null,
  radar: null,
  radarDays: null,
  dayCache: {},
  wechat: null,
  drafts: null,
  wenan: null,
  load: { feishu: 'idle', library: 'idle', report: 'idle', radar: 'idle', drafts: 'idle', wenan: 'idle' },
  err: { feishu: '', library: '', report: '', radar: '', drafts: '', wenan: '' },
  cal: { cursor: null, selected: null, taskTab: 'all', taskCat: 'all', page: 1 },
  lib: { q: '', page: 1 },
  pixel: {
    src: '', name: '', img: null, out: null,
    size: 160, colors: 28, punch: 42, dither: 'none', outline: true, tol: 30, knock: true, scale: 4, preset: '',
    pw: 0, ph: 0, outW: 0, outH: 0, sigSrc: '', sigCfg: ''
  }
};

/* ---------------- 基础工具 ---------------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function pad2(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function parseDate(s) {
  const p = String(s || '').slice(0, 10).split('-').map(Number);
  if (p.length < 3 || !p[0]) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}
function fmtMD(s) {
  const d = parseDate(s);
  return d ? (d.getMonth() + 1) + '月' + d.getDate() + '日' : '';
}
function fmtDateTime(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d.getTime())) return String(s);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

/* 分类配色：与日历里的柔和卡片对应，同一分类始终同色 */
const CAT_TONES = {
  '剪辑': 0, '剪辑＋发布': 1, '剪辑+发布': 1, '发布': 2,
  '整理': 3, '拍摄': 4, 'AI': 5, '学习': 5,
  '看书': 1, '文案': 1, '其他': 6
};
function catTone(name) {
  const k = String(name || '其他');
  if (CAT_TONES[k] != null) return CAT_TONES[k];
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) % 997;
  return h % 6;
}
/* 日历格子窄，长分类名在卡片里用简写 */
const CAT_SHORT = { '剪辑＋发布': '剪辑+发', '剪辑+发布': '剪辑+发', '收集素材': '素材' };
function catShort(name) {
  const k = String(name || '其他');
  return CAT_SHORT[k] || k;
}

function toast(msg, type) {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(function () {
    el.style.transition = 'opacity .2s';
    el.style.opacity = '0';
    setTimeout(function () { el.remove(); }, 220);
  }, 2200);
}

async function fetchJSON(url) {
  const r = await fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now());
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

/* ---------------- 数据加载 ---------------- */
async function loadFeishu(showToast) {
  if (st.load.feishu === 'loading') return;
  st.load.feishu = 'loading';
  st.err.feishu = '';
  renderView(true);
  try {
    st.feishu = await fetchJSON('feishu-data.json');
    st.load.feishu = 'ready';
  } catch (e) {
    st.load.feishu = 'error';
    st.err.feishu = e.message || '加载失败';
  }
  updateChrome();
  renderView(true);
  if (showToast) {
    if (st.load.feishu === 'ready') toast('数据已刷新', 'ok');
    else toast('刷新失败：' + st.err.feishu, 'err');
  }
}

async function loadLibrary() {
  if (st.load.library === 'loading' || st.load.library === 'ready') return;
  st.load.library = 'loading';
  st.err.library = '';
  renderView(true);
  try {
    st.library = await fetchJSON('library-data.json');
    st.load.library = 'ready';
  } catch (e) {
    st.load.library = 'error';
    st.err.library = e.message || '加载失败';
  }
  updateChrome();
  renderView(true);
}

async function loadReport() {
  if (st.load.report === 'loading' || st.load.report === 'ready') return;
  st.load.report = 'loading';
  st.err.report = '';
  renderView(true);
  try {
    st.report = await fetchJSON('content/report/index.json');
    st.load.report = 'ready';
  } catch (e) {
    st.load.report = 'error';
    st.err.report = e.message || '加载失败';
  }
  updateChrome();
  renderView(true);
}

async function loadRadar() {
  if (st.load.radar === 'loading' || st.load.radar === 'ready') return;
  st.load.radar = 'loading';
  st.err.radar = '';
  renderView(true);
  try {
    st.radar = await fetchJSON('radar-data.json');
    st.load.radar = 'ready';
  } catch (e) {
    st.load.radar = 'error';
    st.err.radar = e.message || '加载失败';
  }
  // 存档清单：读不到就只显示今天，不影响主流程
  try {
    st.radarDays = await fetchJSON('content/radar/index.json');
  } catch (e) {
    st.radarDays = null;
  }
  updateChrome();
  renderView(true);
}

async function loadDrafts() {
  if (st.load.drafts === 'loading' || st.load.drafts === 'ready') return;
  st.load.drafts = 'loading';
  st.err.drafts = '';
  renderView(true);
  try {
    st.drafts = await fetchJSON('content/drafts/index.json');
    st.load.drafts = 'ready';
  } catch (e) {
    st.load.drafts = 'error';
    st.err.drafts = e.message || '加载失败';
  }
  // 公众号源：读不到不影响稿子列表
  try {
    st.wechat = await fetchJSON('wechat-feed.json');
  } catch (e) {
    st.wechat = null;
  }
  updateChrome();
  renderView(true);
}

/* ---------------- 飞书数据统计 ---------------- */
function feishuInfo() {
  const f = st.feishu || {};
  const tasks = (f.tasks && f.tasks.all) || [];
  const events = (f.calendar && f.calendar.events) || [];
  const dates = tasks.map(function (t) {
    return (t.completed_at || t.due || '').slice(0, 10);
  }).filter(Boolean).sort();
  return {
    total: tasks.length,
    completed: tasks.filter(function (t) { return t.status === 'completed'; }).length,
    pending: tasks.filter(function (t) { return t.status !== 'completed'; }).length,
    events: events.length,
    earliest: dates[0] || '',
    latest: dates[dates.length - 1] || '',
    updated: f.updated_at || '',
    tasks: tasks,
    eventsList: events
  };
}

/* ---------------- 通用片段 ---------------- */
function pagerHtml(scope, page, pageSize, total) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(page, totalPages);
  if (totalPages <= 1) {
    return '<div class="pager"><span class="pager-info">共 ' + total + ' 条</span></div>';
  }
  let s = Math.max(1, cur - 2), e = Math.min(totalPages, s + 4);
  s = Math.max(1, e - 4);
  let nums = '';
  for (let i = s; i <= e; i++) {
    nums += '<button class="pager-btn' + (i === cur ? ' active' : '') + '" data-page-scope="' + scope + '" data-page="' + i + '">' + i + '</button>';
  }
  return '<div class="pager">' +
    '<span class="pager-info">共 ' + total + ' 条 · 第 ' + cur + '/' + totalPages + ' 页</span>' +
    '<button class="pager-btn" data-page-scope="' + scope + '" data-page="1"' + (cur <= 1 ? ' disabled' : '') + '>首页</button>' +
    '<button class="pager-btn" data-page-scope="' + scope + '" data-page="' + (cur - 1) + '"' + (cur <= 1 ? ' disabled' : '') + '>上一页</button>' +
    nums +
    '<button class="pager-btn" data-page-scope="' + scope + '" data-page="' + (cur + 1) + '"' + (cur >= totalPages ? ' disabled' : '') + '>下一页</button>' +
    '<button class="pager-btn" data-page-scope="' + scope + '" data-page="' + totalPages + '"' + (cur >= totalPages ? ' disabled' : '') + '>末页</button>' +
    '</div>';
}

function stateHtml(type, title, desc, actionLabel, actionAttr) {
  const icon = type === 'error' ? '⚠' : type === 'loading' ? '' : '○';
  return '<div class="state">' +
    (type === 'loading' ? '<div class="spinner"></div>' : '<div class="state-icon">' + icon + '</div>') +
    '<strong>' + esc(title) + '</strong>' +
    (desc ? '<div>' + esc(desc) + '</div>' : '') +
    (actionLabel ? '<button class="btn btn-sm" ' + actionAttr + '>' + esc(actionLabel) + '</button>' : '') +
    '</div>';
}

/* ---------------- 主页 ---------------- */
function renderHome() {
  const cards = [
    { go: 'radar', icon: 'bolt', title: '今日雷达', desc: '每天 10:20 抓一遍 · 挑一条开稿' },
    { go: 'koubo', icon: 'mic', title: '口播工坊', desc: '自己写 · 自己定稿' },
    { go: 'wenan', icon: 'file', title: '成品文案', desc: '完整成片 · 照骨架抄' },
    { go: 'report', icon: 'chart', title: '战报', desc: '每月视频数据 · 大盘 / 明细 / TOP10' },
    { go: 'tasks', icon: 'calendar', title: '任务与日历', desc: '飞书任务月历' },
    { go: 'library', icon: 'book', title: '图书馆', desc: '藏书与书摘' },
    { go: 'pixel', icon: 'pixel', title: '像素工坊', desc: '图片转像素' },
    { go: 'draw', icon: 'pen', title: '画板', desc: '随手画 · 导出图片' }
  ];
  return '<div class="hm-grid">' + cards.map(function (c) {
    return '<button class="hm-card" type="button" data-go="' + c.go + '">' +
      '<span class="hm-ico">' + ic(c.icon) + '</span>' +
      '<span class="hm-txt"><b>' + esc(c.title) + '</b><span>' + esc(c.desc) + '</span></span>' +
      '<span class="hm-go">\u2197</span>' +
    '</button>';
  }).join('') + '</div>';
}

/* ---------------- 首页 Runway Hero（Hero 30 风格复刻） ----------------
   透视跑道 + 数字火苗：今日目标定得越高，火苗长得越高、跑道跑得越快。 */
const RW = { goal: 10, min: 3, max: 20, raf: 0, ro: null, stats: null };

/* 从飞书快照里算出真实的工作台数字：累计完成、有记录的天数、最近 7 天 */
function rwStats() {
  const list = (st.feishu && st.feishu.tasks && st.feishu.tasks.all) || [];
  const seen = {};
  let total = 0, first = '', last = '';
  list.forEach(function (t) {
    if (!t.completed_at) return;
    const d = String(t.completed_at).slice(0, 10);
    total++;
    seen[d] = 1;
    if (!first || d < first) first = d;
    if (d > last) last = d;
  });
  let last7 = 0;
  if (last) {
    const end = parseDate(last);
    list.forEach(function (t) {
      if (!t.completed_at) return;
      const d = parseDate(String(t.completed_at).slice(0, 10));
      if (d && (end - d) / 86400000 <= 6) last7++;
    });
  }
  return { total: total, days: Object.keys(seen).length, last7: last7, first: first, last: last };
}

function rwMonthDay(s) {
  const d = parseDate(s);
  return d ? (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日' : '—';
}

function rwSync() {
  const gEl = document.getElementById('rwGoal');
  if (gEl) gEl.textContent = RW.goal + ' 项';
}

function rwStop() {
  if (RW.raf) cancelAnimationFrame(RW.raf);
  RW.raf = 0;
  if (RW.ro) { RW.ro.disconnect(); RW.ro = null; }
}

function mountRunway() {
  rwStop();
  const cv = document.getElementById('rwCanvas');
  const host = document.getElementById('rwHero');
  if (!cv || !host || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  let W = 1, H = 1;

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, host.clientWidth);
    H = Math.max(1, host.clientHeight);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();

  const range = document.getElementById('rwGoalRange');
  if (range) {
    range.value = String(RW.goal);
    range.addEventListener('input', function () {
      RW.goal = Number(range.value) || 10;
      rwSync();
    });
  }
  rwSync();

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLS = 13, ROWS = 11;

  function frame(ts) {
    const t = (ts || 0) / 1000;
    const heatN = Math.max(0, Math.min(1, (RW.goal - RW.min) / (RW.max - RW.min)));
    const flow = reduce ? 0.45 : ((t * (0.12 + heatN * 0.85)) % 1);

    const cx = W * 0.5;
    const hy = H * 0.44;                // 地平线
    const baseY = H * 1.02;             // 最近处落点

    ctx.clearRect(0, 0, W, H);

    /* 地平线光带 */
    const lg = ctx.createLinearGradient(cx - W * 0.46, 0, cx + W * 0.46, 0);
    lg.addColorStop(0, 'rgba(255,106,47,0)');
    lg.addColorStop(0.5, 'rgba(255,158,104,.7)');
    lg.addColorStop(1, 'rgba(255,106,47,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, hy - 1, W, 2);

    /* 跑道边线：从地平线向两侧张开 */
    ctx.strokeStyle = 'rgba(255,106,47,.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.06, hy);
    ctx.lineTo(cx - W * 0.54, baseY);
    ctx.moveTo(cx + W * 0.06, hy);
    ctx.lineTo(cx + W * 0.54, baseY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let r = 0; r < ROWS; r++) {
      const zf = (r + flow) / ROWS;             // 0 远处 → 1 近处
      const yy0 = hy + (baseY - hy) * Math.pow(zf, 2.2);
      const sc = Math.pow(zf, 1.9);
      if (Math.pow(zf, 1.9) < 0.02) continue;

      /* 地面横线 */
      ctx.fillStyle = 'rgba(255,106,47,' + (0.05 + 0.1 * sc).toFixed(3) + ')';
      ctx.fillRect(0, Math.round(yy0), W, 1);

      const fs = 5 + sc * H * 0.062;
      ctx.font = '700 ' + fs.toFixed(1) + 'px ui-monospace, SFMono-Regular, Consolas, monospace';
      const step = fs * 0.92;
      const alpha = 0.1 + 0.9 * Math.pow(zf, 1.9);

      for (let c = 0; c < COLS; c++) {
        const u = (c / (COLS - 1)) * 2 - 1;
        const x = cx + u * W * (0.07 + 0.47 * zf);
        /* 中央通道留白：文案区正中的数字压暗，让火苗集中在两侧 */
        const k = Math.abs(u) >= 0.85 ? 1 : 0.34 + 0.66 * (Math.abs(u) / 0.85);
        const nail = (Math.sin(c * 3.1 + 1.2) + 1) / 2;
        /* 火苗摆动：每列高度随时间轻微起伏，避免整排像静止的表格 */
        const flick = reduce ? 1 : 0.86 + 0.14 * Math.sin(t * (1.4 + c * 0.33) + c * 2.2);
        const stackN = Math.round((1.4 + heatN * 6.4) * (0.5 + nail * 1.0) * flick);
        for (let j = 0; j < stackN; j++) {
          const yy = yy0 - j * step;
          if (yy < -fs * 1.4) break;
          /* 火苗向上进入文案带时逐渐熄灭，越往下越亮 */
          const vr = (yy - H * 0.54) / (H * 0.2);
          const vf = vr <= 0 ? 0 : vr >= 1 ? 1 : vr * vr;
          const a2 = alpha * (1 - (j / (stackN + 1.5)) * 0.55) * (k + (1 - k) * vf);
          if (a2 <= 0.03) continue;
          const dg = Math.floor(t * (2.5 + heatN * 7) + c * 37 + r * 11 + j * 5) % 10;
          ctx.fillStyle = (j === 0 && zf > 0.45)
            ? 'rgba(255,226,190,' + a2.toFixed(3) + ')'
            : 'rgba(255,' + Math.round(126 + 46 * sc) + ',72,' + a2.toFixed(3) + ')';
          ctx.fillText(String(dg), x, yy);
        }
      }
    }

    if (!reduce) RW.raf = requestAnimationFrame(frame);
  }

  if (reduce) frame(0);
  else RW.raf = requestAnimationFrame(frame);

  if (window.ResizeObserver) {
    RW.ro = new ResizeObserver(function () { size(); });
    RW.ro.observe(host);
  }
}

function syncCard(info) {
  const loading = st.load.feishu === 'loading';
  const error = st.load.feishu === 'error';
  const badge = loading
    ? '<span class="badge"><span class="dot"></span>读取中</span>'
    : error
      ? '<span class="badge err"><span class="dot"></span>加载失败</span>'
      : '<span class="badge ok"><span class="dot"></span>已同步</span>';

  return '<div class="card">' +
    '<div class="card-head"><div class="card-title">飞书同步</div>' +
      '<div class="card-head-actions">' + badge +
        '<button class="btn btn-sm" data-action="refresh"' + (loading ? ' disabled' : '') + '>刷新数据</button>' +
      '</div></div>' +
    '<div class="card-body">' +
      '<div class="sync-state"><span style="font-size:13px;font-weight:600;">' +
        (loading ? '正在读取快照…' : error ? '未能读取数据文件' : '任务数据已载入') +
      '</span></div>' +
      '<div class="sync-row" style="margin-top:10px;">' +
        '<div class="sync-item"><div class="k">最近同步</div><div class="v">' + esc(info.updated || '—') + '</div></div>' +
        '<div class="sync-item"><div class="k">任务条目</div><div class="v">' + (st.feishu ? info.total + ' 条' : '—') + '</div></div>' +
        '<div class="sync-item"><div class="k">已完成</div><div class="v">' + (st.feishu ? info.completed + ' 条' : '—') + '</div></div>' +
        '<div class="sync-item"><div class="k">日程事件</div><div class="v">' + (st.feishu ? info.events + ' 条' : '—') + '</div></div>' +
      '</div>' +
      '<div class="sync-note">在线版读取的是本地同步脚本生成的快照文件；如需拉取最新飞书数据，请在本机运行同步脚本后再刷新。</div>' +
    '</div></div>';
}

/* ---------------- 任务与日历 ---------------- */
function ensureCalState() {
  const info = feishuInfo();
  if (!st.cal.cursor) {
    const base = parseDate(info.latest) || new Date();
    st.cal.cursor = new Date(base.getFullYear(), base.getMonth(), 1);
    st.cal.selected = base;
  }
}

function calCells() {
  const cur = st.cal.cursor;
  const y = cur.getFullYear(), m = cur.getMonth();
  const start = (new Date(y, m, 1).getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const prevDim = new Date(y, m, 0).getDate();
  const info = feishuInfo();
  const cells = [];

  for (let i = 0; i < 42; i++) {
    let d, other = false;
    if (i < start) {
      d = new Date(y, m - 1, prevDim - start + 1 + i);
      other = true;
    } else if (i >= start + dim) {
      d = new Date(y, m + 1, i - start - dim + 1);
      other = true;
    } else {
      d = new Date(y, m, i - start + 1);
    }
    const ds = fmtDate(d);
    const dayTasks = info.tasks.filter(function (t) {
      const c = (t.completed_at || '').slice(0, 10);
      const u = (t.due || '').slice(0, 10);
      return c === ds || u === ds;
    });
    const dayEvents = info.eventsList.filter(function (e) {
      const ed = (e.date || e.start || '').slice(0, 10);
      return ed === ds;
    });
    cells.push({ date: d, ds: ds, other: other, tasks: dayTasks, events: dayEvents });
  }
  return cells;
}

function renderTasksPage() {
  if (st.load.feishu === 'loading') return stateHtml('loading', '正在读取任务数据');
  if (st.load.feishu === 'error') return stateHtml('error', '飞书数据加载失败', st.err.feishu, '重试', 'data-action="retry-feishu"');
  if (!st.feishu) return stateHtml('empty', '暂无任务数据');

  ensureCalState();
  const info = feishuInfo();
  const cells = calCells();
  const todayStr = fmtDate(new Date());
  const selStr = fmtDate(st.cal.selected);

  let selCell = cells.filter(function (c) { return c.ds === selStr; })[0] || null;
  if (!selCell) {
    const first = cells.filter(function (c) { return !c.other; })[0];
    selCell = first || cells[0];
    st.cal.selected = selCell.date;
  }

  const weekdays = [['MON', '一'], ['TUE', '二'], ['WED', '三'], ['THU', '四'], ['FRI', '五'], ['SAT', '六'], ['SUN', '日']];

  // 本月概览：只统计落在当前月份的格子
  const monthCells = cells.filter(function (c) { return !c.other; });
  let mTasks = 0, mDone = 0, mEvents = 0;
  monthCells.forEach(function (c) {
    mTasks += c.tasks.length;
    mEvents += c.events.length;
    c.tasks.forEach(function (t) { if (t.status === 'completed') mDone++; });
  });

  const calHtml = '<div class="card cal-card">' +
    '<div class="cal-head">' +
      '<div class="cal-head-main">' +
        '<div class="cal-kicker">Schedule · Month</div>' +
        '<div class="cal-monthbig">' + st.cal.cursor.getFullYear() + ' 年 ' + (st.cal.cursor.getMonth() + 1) + ' 月</div>' +
        '<div class="cal-meta"><span>本月 <b>' + mTasks + '</b> 项</span><i></i><span>完成 <b>' + mDone + '</b></span><i></i><span>日程 <b>' + mEvents + '</b></span></div>' +
      '</div>' +
      '<div class="cal-nav">' +
        '<button class="cal-arrow" data-cal="prev" aria-label="上个月">' + ic('chevL') + '</button>' +
        '<button class="cal-today" data-cal="today">今天</button>' +
        '<button class="cal-arrow" data-cal="next" aria-label="下个月">' + ic('chevR') + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="cal-weekdays">' + weekdays.map(function (w, i) {
      return '<div' + (i > 4 ? ' class="wk"' : '') + '><span>' + w[0] + '</span><i>' + w[1] + '</i></div>';
    }).join('') + '</div>' +
    '<div class="cal-grid">' +
      cells.map(function (c) {
        const isToday = c.ds === todayStr;
        const isSel = c.ds === fmtDate(st.cal.selected);
        const total = c.tasks.length + c.events.length;
        // 按分类聚合，避免每格塞入被截断的长标题
        const grouped = {};
        c.tasks.forEach(function (t) {
          const k = t.category || '其他';
          grouped[k] = (grouped[k] || 0) + 1;
        });
        const groups = Object.keys(grouped).map(function (k) {
          return { label: k, n: grouped[k], ev: false };
        }).sort(function (a, b) { return b.n - a.n; });
        if (c.events.length) groups.push({ label: '日程', n: c.events.length, ev: true });

        const shown = groups.slice(0, 3);
        const marks = shown.map(function (g) {
          return '<span class="cal-chip t' + (g.ev ? 6 : catTone(g.label)) + '">' +
            '<em>' + esc(catShort(g.label)) + '</em><b>' + g.n + '</b></span>';
        }).join('');
        const more = groups.length > 3 ? '<span class="cal-more">+' + (groups.length - 3) + ' 类</span>' : '';
        const weekend = c.date.getDay() === 5 || c.date.getDay() === 6;
        return '<div class="cal-cell' + (c.other ? ' other' : '') + (weekend ? ' weekend' : '') +
          (isSel ? ' selected' : '') + (isToday ? ' today' : '') +
          '" data-date="' + c.ds + '">' +
          '<div class="cal-top"><span class="cal-daynum">' + c.date.getDate() + '</span>' +
          (isToday ? '<span class="cal-flag">今天</span>' : '') + '</div>' +
          (total ? '<div class="cal-marks">' + marks + more + '</div>' : '') +
        '</div>';
      }).join('') +
    '</div></div>';

  const dayTasks = selCell.tasks.slice().sort(function (a, b) {
    return String(a.completed_at || a.due || '').localeCompare(String(b.completed_at || b.due || ''));
  });
  const doneTasks = dayTasks.filter(function (t) { return t.status === 'completed'; });
  const pendTasks = dayTasks.filter(function (t) { return t.status !== 'completed'; });
  const wd = ['日', '一', '二', '三', '四', '五', '六'][selCell.date.getDay()];

  // 任务与日程合成一条按时间排序的日程流
  const agenda = dayTasks.map(function (t) {
    const raw = String(t.completed_at || t.due || '');
    const done = t.status === 'completed';
    return {
      sort: raw.slice(0, 16) || '0',
      time: raw.slice(11, 16) || '—',
      kind: done ? 'DONE' : 'TODO',
      state: done ? '已完成' : '待办',
      cat: t.category || '其他',
      tone: catTone(t.category),
      title: t.summary || '—'
    };
  }).concat(selCell.events.map(function (e) {
    const d = e.start ? new Date(e.start) : null;
    const ok = d && !isNaN(d.getTime());
    const hm = ok ? pad2(d.getHours()) + ':' + pad2(d.getMinutes()) : '';
    return {
      sort: '0' + hm,
      time: hm || '全天',
      kind: 'EVENT',
      state: '日程',
      cat: '日程',
      tone: 6,
      title: e.summary || '—'
    };
  })).sort(function (a, b) { return String(a.sort).localeCompare(String(b.sort)); });

  const dayTotal = dayTasks.length + selCell.events.length;
  let dayPill = '';
  if (dayTotal) {
    if (!dayTasks.length) dayPill = '<span class="day-pill ev">日程 ' + selCell.events.length + '</span>';
    else if (!pendTasks.length) dayPill = '<span class="day-pill ok">全部完成</span>';
    else dayPill = '<span class="day-pill">' + pendTasks.length + ' 项待办</span>';
  }

  // 当日分类分布，放在面板底部压住留白
  const dCats = {};
  agenda.forEach(function (a) {
    if (!dCats[a.cat]) dCats[a.cat] = { n: 0, tone: a.tone };
    dCats[a.cat].n++;
  });
  const dayLegend = Object.keys(dCats).sort(function (a, b) { return dCats[b].n - dCats[a].n; })
    .map(function (k) {
      return '<span class="day-legend t' + dCats[k].tone + '"><i></i>' + esc(k) + ' <b>' + dCats[k].n + '</b></span>';
    }).join('');

  const dayHtml = '<div class="card day-panel">' +
    '<div class="day-head">' +
      '<div class="day-num">' + pad2(selCell.date.getDate()) + '</div>' +
      '<div class="day-head-main">' +
        '<div class="day-title">周' + wd + '</div>' +
        '<div class="day-sub">' + selCell.date.getFullYear() + ' 年 ' + (selCell.date.getMonth() + 1) + ' 月 · 共 ' + dayTotal + ' 项</div>' +
      '</div>' +
      dayPill +
    '</div>' +
    '<div class="day-body">' +
      (agenda.length
        ? '<div class="day-stream">' + agenda.map(dayAgendaRow).join('') + '</div>'
        : stateHtml('empty', '当日暂无任务与日程', '点选其他日期看看')) +
    '</div>' +
    (dayLegend ? '<div class="day-foot">' + dayLegend + '</div>' : '') +
    '</div>';

  return syncCard(info) +
    '<div class="two-col">' + calHtml + dayHtml + '</div>';
}


function dayAgendaRow(x) {
  return '<div class="day-item t' + x.tone + (x.kind === 'DONE' ? ' done' : '') + '">' +
    '<div class="day-rail"><b>' + esc(x.time) + '</b><i>' + esc(x.kind) + '</i></div>' +
    '<div class="day-item-card">' +
      '<div class="day-item-head"><span class="day-cat">' + esc(x.cat) + '</span>' +
        '<span class="day-state' + (x.kind === 'DONE' ? ' ok' : x.kind === 'EVENT' ? ' ev' : '') + '">' + esc(x.state) + '</span></div>' +
      '<div class="day-item-title">' + esc(x.title) + '</div>' +
    '</div></div>';
}

/* ---------------- 图书馆 ---------------- */
const LIB_PER = 6;

/* 一张大封面卡：真实封面 + 书名 + 作者 */
function libCover(b) {
  const id = b.id || b.title;
  const title = b.title || '未命名';
  const author = b.author || '未知作者';
  const hasCover = b.cover && b.hasCover !== false;
  const face = hasCover
    ? '<img src="' + esc(b.cover) + '" alt="' + esc(title) + '" loading="lazy">'
    : '<span class="lib-cover-fallback"><b>' + esc(title) + '</b><i>' + esc(author) + '</i></span>';
  return '<button class="lib-cover" data-book="' + esc(id) + '" aria-label="' + esc(title) + '">' +
    '<span class="lib-cover-img">' + face + '</span>' +
    '<span class="lib-cover-title">' + esc(title) + '</span>' +
    '<span class="lib-cover-author">' + esc(author) + '</span>' +
    '</button>';
}

function renderLibraryPage() {
  if (st.load.library === 'loading') return stateHtml('loading', '正在读取图书数据');
  if (st.load.library === 'error') return stateHtml('error', '图书数据加载失败', st.err.library, '重试', 'data-action="retry-library"');
  const books = (st.library && st.library.books) || [];
  if (!books.length) return stateHtml('empty', '图书库为空', '请先同步飞书多维表格');

  const q = st.lib.q.toLowerCase();
  const list = books.filter(function (b) {
    if (!q) return true;
    const hay = (b.title || '') + ' ' + (b.author || '') + ' ' + (b.outline || '') + ' ' +
      (b.think || '') + ' ' + (b.summary || '') + ' ' +
      (b.chapters || []).map(function (c) { return c.k + ' ' + c.p; }).join(' ');
    return hay.toLowerCase().indexOf(q) >= 0;
  });

  /* 顶部：搜索 + 藏书总量（沿用参考图的窄搜索条） */
  const lastDate = books.reduce(function (m, b) { return b.date && b.date > m ? b.date : m; }, '');
  const top = '<div class="lib-top">' +
    '<label class="lib-search"><span class="lib-search-ico">' + ic('search') + '</span>' +
      '<input id="libSearch" type="search" placeholder="搜索书名 / 作者 / 书摘" value="' + esc(st.lib.q) + '"></label>' +
    '<div class="lib-meta"><b>' + books.length + '</b> 本藏书' + (lastDate ? ' · 最近 ' + esc(lastDate) : '') + '</div>' +
    '</div>';

  if (!list.length) {
    return '<div class="lib-room">' + top + '<div class="lib-empty">' +
      stateHtml('empty', '没有找到匹配的图书', '换个关键词试试', '清空搜索', 'data-action="clear-lib"') +
      '</div></div>';
  }

  const totalPages = Math.max(1, Math.ceil(list.length / LIB_PER));
  if (st.lib.page > totalPages) st.lib.page = 1;
  const pageList = list.slice((st.lib.page - 1) * LIB_PER, st.lib.page * LIB_PER);

  /* 右侧书摘：焦点书随 ‹ › 轮换 */
  const focusIdx = ((st.lib.focus || 0) % list.length + list.length) % list.length;
  const fb = list[focusIdx];

  const hero = '<div class="lib-hero">' +
      '<h2 class="lib-head">把这本书读下去。</h2>' +
      '<p class="lib-desc">封面、书摘、读书时写下的那点想法，<br>全在这一页里，翻一翻就能接着读。</p>' +
      '<button class="lib-cta" data-action="lib-random">随机抽一本 <i>↗</i></button>' +
    '</div>';

  const focusPanel = '<aside class="lib-focus">' +
      '<div class="lib-focus-head">' +
        '<span class="lib-ava">' + esc(String(fb.author || '书').slice(0, 1)) + '</span>' +
        '<span class="lib-focus-id"><b>' + esc(fb.author || '未知作者') + '</b><i>' + esc(fb.title || '未命名') + '</i></span>' +
        '<span class="lib-focus-nav">' +
          '<button data-lib-focus="-1" aria-label="上一条书摘">‹</button>' +
          '<button data-lib-focus="1" aria-label="下一条书摘">›</button>' +
        '</span>' +
      '</div>' +
      '<blockquote class="lib-quote">' + esc(fb.think || fb.outline || '这本书还没有写下书摘。') + '</blockquote>' +
    '</aside>';

  const rail = '<div class="lib-rail">' + pageList.map(libCover).join('') + '</div>';

  const foot = '<div class="lib-foot">' +
      '<span class="lib-tip">点一张封面 · 看这本书的书摘与思考</span>' +
      '<span class="lib-pager">' +
        '<button class="lib-arrow" data-page-scope="lib" data-page="' + (st.lib.page - 1) + '"' + (st.lib.page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>' +
        '<span class="lib-count"><b>' + pad2(st.lib.page) + '</b> / ' + pad2(totalPages) + '</span>' +
        '<button class="lib-arrow" data-page-scope="lib" data-page="' + (st.lib.page + 1) + '"' + (st.lib.page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>' +
      '</span>' +
    '</div>';

  return '<div class="lib-room">' + top + '<div class="lib-main">' + hero + focusPanel + '</div>' + rail + foot + '</div>';
}


/* 每本书按标题做确定性扰动：宽度/高度/倾角略有差别，像真实书架 */
function bookVar(title) {
  let h = 0;
  const s = String(title || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h % 4;
}

/* ---------------- 成品文案库（读 content/library/index.json） ----------------
   存的不是草稿，是「施工图」：分几段、每段几秒、画面拍什么、嘴里说什么、配套怎么设。
   新稿照这个骨架抄，比抄句子有用。 */
const WN = { open: '' };

function wnLineHtml(label, text, cls) {
  return '<div class="wn-line ' + (cls || '') + '"><b>' + esc(label) + '</b><span>' + esc(text) + '</span></div>';
}

function wnStepHtml(s) {
  return '<li class="wn-step">' +
    '<div class="wn-step-h">' +
      '<span class="wn-time">' + esc(s.t || '') + '</span>' +
      '<span class="wn-role">' + esc(s.role || '') + '</span>' +
    '</div>' +
    (s.visual ? wnLineHtml('画面', s.visual, 'wn-visual') : '') +
    (s.vo ? wnLineHtml('口播', s.vo, 'wn-vo') : '') +
  '</li>';
}

function wnItemHtml(it) {
  const id = String(it.id || '');
  const on = WN.open === id;
  const segs = it.segments || [];
  const extra = it.extra || [];

  let meta = '';
  if (it.kind) meta += '<span class="wn-tag">' + esc(it.kind) + '</span>';
  if (it.duration) meta += '<span>' + esc(it.duration) + '</span>';
  if (segs.length) meta += '<span>' + segs.length + ' 段</span>';
  if (it.date) meta += '<span>' + esc(it.date) + '</span>';
  if (it.source) meta += '<span>' + esc(it.source) + '</span>';

  return '<article class="wn-item' + (on ? ' is-open' : '') + '">' +
    '<button class="wn-head" type="button" data-wn-toggle="' + esc(id) + '" aria-expanded="' + (on ? 'true' : 'false') + '">' +
      '<span class="wn-h-main">' +
        '<span class="wn-title">' + esc(it.title || '未命名') + '</span>' +
        '<span class="wn-meta">' + meta + '</span>' +
      '</span>' +
      '<span class="wn-cue" aria-hidden="true"></span>' +
    '</button>' +
    '<div class="wn-body">' +
      (it.note ? '<div class="wn-note"><b>可抄的</b><span>' + esc(it.note) + '</span></div>' : '') +
      (segs.length ? '<ol class="wn-steps">' + segs.map(wnStepHtml).join('') + '</ol>' : '') +
      (extra.length ? '<div class="wn-extra">' + extra.map(function (e) {
        return '<div class="wn-kv"><b>' + esc(e.k || '') + '</b><span>' + esc(e.v || '') + '</span></div>';
      }).join('') + '</div>' : '') +
    '</div>' +
  '</article>';
}

function renderWenanPage() {
  if (st.load.wenan === 'error') {
    return stateHtml('error', '成品文案读不到', st.err.wenan, '重试', 'data-wn-retry="1"');
  }
  const items = (st.wenan && st.wenan.items) || [];
  const lead = '<div class="wn-lead">' +
    '<b>' + (st.load.wenan === 'ready' ? items.length + ' 条' : '—') + '</b>' +
    '<span>每条都是完整成片：分几段、每段几秒、画面拍什么、嘴里说什么、配套怎么设。写新稿照这个骨架来，别抄句子。</span>' +
  '</div>';
  if (st.load.wenan !== 'ready') return lead + stateHtml('loading', '正在取成品文案…');
  if (!items.length) return lead + '<div class="wn-empty">还没有存进来的成品文案</div>';
  return lead + '<div class="wn-list">' + items.map(wnItemHtml).join('') + '</div>';
}

function mountWenan() {
  const nc = document.getElementById('navWenanCount');
  if (nc) {
    const n = (st.wenan && st.wenan.items) ? st.wenan.items.length : 0;
    nc.textContent = st.load.wenan === 'ready' ? String(n) : '—';
  }
  const sec = document.getElementById('sec-wenan');
  if (!sec) return;

  sec.querySelectorAll('[data-wn-toggle]').forEach(function (el) {
    el.addEventListener('click', function () {
      const id = el.getAttribute('data-wn-toggle');
      const item = el.closest('.wn-item');
      const wasOpen = (WN.open === id);
      WN.open = wasOpen ? '' : id;
      if (item) item.classList.toggle('is-open', !wasOpen);
      el.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
    });
  });

  const rt = sec.querySelector('[data-wn-retry]');
  if (rt) rt.addEventListener('click', function () {
    st.load.wenan = 'idle';
    st.err.wenan = '';
    loadWenan();
  });
}

async function loadWenan() {
  if (st.load.wenan === 'loading' || st.load.wenan === 'ready') return;
  st.load.wenan = 'loading';
  st.err.wenan = '';
  renderView(true);
  try {
    st.wenan = await fetchJSON('content/library/index.json');
    st.load.wenan = 'ready';
  } catch (e) {
    st.load.wenan = 'error';
    st.err.wenan = e.message || '加载失败';
  }
  updateChrome();
  renderView(true);
}

/* ---------------- 口播工坊（自己写 · 自己定稿） ---------------- */
/* 数据两层：
   ① 仓库 content/drafts/index.json + 同名 md —— 我放进来的，只当素材
   ② 浏览器 localStorage —— 老板自己写的、自己改的，敲一下就存
   定稿只能老板点按钮，代码不替他判。我产的稿子默认全在「草稿」。
   本地存储跟着这台设备的浏览器走，手机和电脑不互通，挪稿子用「复制全文」。 */

const KB_WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const KB_STORE = 'wb.kb.docs.v2';

const KB = { open: '', lane: 'draft', md: {}, local: null, saved: '' };

function kbWords(txt) { return String(txt || '').replace(/\s/g, '').length; }

function kbSec(n) { return Math.round((Number(n) || 0) / 5.5); }

function kbDurText(n) {
  const s = kbSec(n);
  if (!s) return '0 秒';
  const m = Math.floor(s / 60);
  return (m ? m + ' 分 ' : '') + (s % 60) + ' 秒';
}

function kbLocal() {
  if (KB.local) return KB.local;
  KB.local = [];
  try {
    const raw = localStorage.getItem(KB_STORE);
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) {
      KB.local = arr.filter(function (d) { return d && d.id; });
      KB.local.forEach(function (d) { d.local = true; });
    }
  } catch (e) { KB.local = []; }
  return KB.local;
}

function kbPersist() {
  try {
    localStorage.setItem(KB_STORE, JSON.stringify(KB.local || []));
    const d = new Date();
    KB.saved = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    return true;
  } catch (e) { return false; }
}

/* 远端 md 拆成标题 + 正文。正文规矩跟以前一样：跳过 `## 正文` 这类标题行 */
function kbBody(md) {
  let t = String(md || '').replace(/\r/g, '');
  const a = t.indexOf('## 钩子');
  const c = t.search(/^##\s*(正文|稿)/m);
  const start = a >= 0 ? a : c;
  if (start >= 0) {
    const le = t.indexOf('\n', start);
    const rest = t.slice(le >= 0 ? le + 1 : start + 3);
    const m = rest.search(/^(##\s|---\s*$)/m);
    t = m >= 0 ? rest.slice(0, m) : rest;
  } else {
    t = t.replace(/^---[\s\S]*?\n---\n/, '');
  }
  return t.split('\n')
    .filter(function (l) { return !/^#{1,6}\s/.test(l) && !/^\s*[-*]\s+/.test(l); })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function kbMdParse(md) {
  const t = String(md || '').replace(/\r/g, '');
  const m = t.match(/^#\s+(.+)$/m);
  return { title: m ? m[1].trim() : '', body: kbBody(t) };
}

/* 本地 + 仓库合成一份清单，同一篇按 file 去重（本地优先） */
function kbDocs() {
  const locals = kbLocal();
  const out = locals.slice();
  const files = {};
  locals.forEach(function (d) { if (d.file) files[d.file] = 1; });
  const rem = (st.drafts && st.drafts.drafts) ? st.drafts.drafts : [];
  rem.forEach(function (r) {
    if (!r.file || files[r.file]) return;
    // md 已经拉下来的话，正文直接给编辑器，别再显示「正在取原稿」
    const md = KB.md[r.file];
    const p = md != null ? kbMdParse(md) : null;
    out.push({
      id: 'r:' + r.file, file: r.file, local: false,
      title: r.title || (p ? p.title : ''), body: p ? p.body : null, final: false,
      date: r.date || '', src: '我放进来的', publish_at: r.publish_at || ''
    });
  });
  out.sort(function (a, b) {
    const da = String(a.date || ''), db = String(b.date || '');
    if (da !== db) return db.localeCompare(da);
    return (a.final ? 1 : 0) - (b.final ? 1 : 0);
  });
  return out;
}

function kbGet(id) {
  const all = kbDocs();
  for (let i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

/* 要改仓库里那一篇了，先落成本地副本（留着 file，下次还能认出是同一篇） */
function kbMaterialize(id) {
  const all = kbDocs();
  for (let i = 0; i < all.length; i++) {
    const d = all[i];
    if (d.id !== id) continue;
    if (d.local) return d;
    const md = KB.md[d.file];
    const p = md != null ? kbMdParse(md) : { title: '', body: '' };
    const copy = {
      id: 'l:' + d.file, file: d.file, local: true,
      title: d.title || p.title, body: p.body || '',
      final: false, date: d.date || fmtDate(new Date()), src: d.src || ''
    };
    KB.local.unshift(copy);
    KB.open = copy.id;
    return copy;
  }
  return null;
}

function kbItemHtml(d) {
  const n = kbWords(d.body);
  return '<div class="kb-doc' + (KB.open === d.id ? ' is-on' : '') + '" data-kb-open="' + esc(d.id) + '" tabindex="0" role="button">' +
    '<div class="kb-doc-t">' + esc(d.title || '没写标题') + '</div>' +
    '<div class="kb-doc-m">' +
      '<span>' + (esc(fmtMD(d.date)) || '—') + '</span>' +
      (n ? '<span>' + n + ' 字</span>' : '') +
      (n ? '<span>' + kbDurText(n) + '</span>' : '') +
      (d.final ? '<span class="is-go">定稿</span>' : '<span class="is-dim">草稿</span>') +
    '</div>' +
  '</div>';
}

function kbEditorHtml(d) {
  if (!d) {
    return '<div class="kb-ed is-empty">' +
      '<span class="kb-empty-ico">' + ic('pen') + '</span>' +
      '<b>点左边一条开始改</b>' +
      '<span>或者点「+ 新建」，从零写一条。改一个字就自动存，定稿得你自己点。</span>' +
    '</div>';
  }
  const n = kbWords(d.body);
  const wait = d.body == null;
  const src = d.src || '';
  const link = /^https?:\/\//i.test(d.url || '')
    ? ' <a class="kb-ed-link" href="' + esc(d.url) + '" target="_blank" rel="noopener noreferrer">原文 ↗</a>' : '';
  return '<div class="kb-ed">' +
    '<div class="kb-ed-head">' +
      '<input class="kb-ed-t" data-kb-field="title" value="' + esc(d.title || '') + '" placeholder="标题，自己看得懂就行" spellcheck="false">' +
      '<div class="kb-ed-act">' +
        (d.final
          ? '<button type="button" class="kb-btn" data-kb-unfinal="1">退回草稿</button>'
          : '<button type="button" class="kb-btn is-go" data-kb-final="1">标为定稿</button>') +
        '<button type="button" class="kb-btn" data-kb-copy="1">复制全文</button>' +
        (d.local ? '<button type="button" class="kb-btn is-x" data-kb-del="1">删掉</button>' : '') +
      '</div>' +
    '</div>' +
    (src || link
      ? '<div class="kb-ed-src">' + esc(src) + link + '</div>'
      : '') +
    (wait
      ? '<div class="kb-ed-wait">正在取原稿…</div>'
      : '<textarea class="kb-ed-b" data-kb-field="body" spellcheck="false" placeholder="直接往这儿写。一整段别分，像说话那样。">' + esc(d.body || '') + '</textarea>') +
    '<div class="kb-ed-bar">' +
      '<span class="kb-ed-num' + (n > 700 ? ' is-over' : '') + '">' + (n ? n + ' 字 · 约 ' + kbDurText(n) : '空') + '</span>' +
      '<span class="kb-ed-hint">目标 520–700 字 · 1 分 20–1 分 40 · 一整段不分行</span>' +
      '<span class="kb-ed-save">' + (KB.saved ? '已存本地 ' + KB.saved : '还没动过') + '</span>' +
    '</div>' +
  '</div>';
}

function renderKouboPage() {
  const d = new Date();
  const docs = kbDocs();
  const nDraft = docs.filter(function (x) { return !x.final; }).length;
  const nFinal = docs.filter(function (x) { return x.final; }).length;

  const lane = KB.lane;
  const mine = docs.filter(function (x) { return lane === 'final' ? x.final : !x.final; });
  const cur = KB.open ? kbGet(KB.open) : null;
  const inLane = cur && (lane === 'final' ? cur.final : !cur.final);

  const list = mine.length
    ? mine.map(kbItemHtml).join('')
    : '<div class="kb-empty is-mini">' +
        '<span class="kb-empty-ico">' + ic(lane === 'final' ? 'check' : 'pen') + '</span>' +
        '<b>' + (lane === 'final' ? '还没有定稿' : '草稿是空的') + '</b>' +
        '<span>' + (lane === 'final' ? '你自己点了「标为定稿」，才会进这里' : '点「+ 新建」，或者去雷达挑一条') + '</span>' +
      '</div>';

  let note = '';
  if (st.load.drafts === 'error') {
    note = '<div class="kb-note is-err"><i></i>仓库里的稿子索引读不到（' + esc(st.err.drafts || '') + '），只显示这台设备上存的</div>';
  } else {
    note = '<div class="kb-note"><i></i>改动只存在这台设备的浏览器里 · 换设备要挪稿子，点「复制全文」</div>';
  }

  return '' +
    '<div class="kb-strip">' +
      '<div class="kb-strip-main">' +
        '<div class="kb-kicker"><b>TODAY</b> · 口播</div>' +
        '<div class="kb-date">' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日<em>' + KB_WEEK[d.getDay()] + '</em></div>' +
      '</div>' +
      '<div class="kb-slots">' +
        '<div class="kb-slot is-live"><span>发布</span><b>19:00</b></div>' +
        '<div class="kb-slot"><span>草稿</span><b>' + nDraft + '</b></div>' +
        '<div class="kb-slot"><span>定稿</span><b>' + nFinal + '</b></div>' +
      '</div>' +
    '</div>' +
    '<div class="kb-shell">' +
      '<aside class="kb-rail">' +
        '<div class="kb-rail-head">' +
          '<div class="kb-tabs">' +
            '<button type="button" class="kb-tab' + (lane === 'draft' ? ' is-on' : '') + '" data-kb-lane="draft">草稿 <b>' + nDraft + '</b></button>' +
            '<button type="button" class="kb-tab' + (lane === 'final' ? ' is-on' : '') + '" data-kb-lane="final">定稿 <b>' + nFinal + '</b></button>' +
          '</div>' +
          '<button type="button" class="kb-new" data-kb-new="1">+ 新建</button>' +
        '</div>' +
        '<div class="kb-list' + (mine.length ? '' : ' is-empty') + '">' + list + '</div>' +
      '</aside>' +
      kbEditorHtml(inLane ? cur : null) +
    '</div>' +
    note;
}

/* 只更新字数条，不动 DOM 结构，免得敲字时丢焦点 */
function kbSyncMeta() {
  const sec = document.getElementById('sec-koubo');
  if (!sec) return;
  const d = kbGet(KB.open);
  const num = sec.querySelector('.kb-ed-num');
  const save = sec.querySelector('.kb-ed-save');
  if (num && d) {
    const n = kbWords(d.body);
    num.textContent = n ? n + ' 字 · 约 ' + kbDurText(n) : '空';
    num.classList.toggle('is-over', n > 700);
  }
  if (save) save.textContent = KB.saved ? '已存本地 ' + KB.saved : '还没动过';
}

function mountKoubo() {
  const nc = document.getElementById('navKouboCount');
  if (nc) {
    const n = kbDocs().filter(function (x) { return !x.final; }).length;
    nc.textContent = st.load.drafts === 'ready' ? String(n) : String(n || 0);
  }

  const sec = document.getElementById('sec-koubo');
  if (!sec) return;

  // 远端那一篇的正文，第一次打开时拉一次
  const cur = KB.open ? kbGet(KB.open) : null;
  if (cur && cur.file && cur.body == null && KB.md[cur.file] == null) {
    const f = cur.file;
    fetch(encodeURI(f) + '?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (t) { KB.md[f] = t; if (KB.open) renderView(true); })
      .catch(function () { KB.md[f] = ''; if (KB.open) renderView(true); });
  }

  sec.addEventListener('click', function (e) {
    const t = e.target;
    const openEl = t.closest('[data-kb-open]');
    const laneEl = t.closest('[data-kb-lane]');
    const isNew = t.closest('[data-kb-new]');
    const isFinal = t.closest('[data-kb-final]');
    const isUnfinal = t.closest('[data-kb-unfinal]');
    const isCopy = t.closest('[data-kb-copy]');
    const isDel = t.closest('[data-kb-del]');

    if (isNew) {
      const d = {
        id: 'n' + Date.now(), local: true, file: null,
        title: '', body: '', final: false,
        date: fmtDate(new Date()), src: '', url: ''
      };
      kbLocal().unshift(d);
      kbPersist();
      KB.open = d.id;
      KB.lane = 'draft';
      renderView(true);
      const inp = document.querySelector('#sec-koubo .kb-ed-t');
      if (inp) inp.focus();
      return;
    }
    if (laneEl) {
      const k = laneEl.getAttribute('data-kb-lane');
      if (k === KB.lane) return;
      KB.lane = k;
      KB.open = '';
      renderView(true);
      return;
    }
    if (openEl) {
      const id = openEl.getAttribute('data-kb-open');
      if (id === KB.open) return;
      KB.open = id;
      renderView(true);
      return;
    }
    if (isFinal || isUnfinal) {
      let d = kbGet(KB.open);
      if (!d) return;
      if (!d.local) d = kbMaterialize(KB.open);
      if (!d) return;
      d.final = !!isFinal;
      kbPersist();
      KB.lane = d.final ? 'final' : 'draft';
      renderView(true);
      toast(isFinal ? '进定稿了' : '退回草稿了', 'ok');
      return;
    }
    if (isCopy) {
      const d = kbGet(KB.open);
      if (d && d.body) copyText(d.body);
      return;
    }
    if (isDel) {
      const d = kbGet(KB.open);
      if (!d || !d.local) return;
      if (!window.confirm('删掉「' + (d.title || '没写标题') + '」？删了就找不回来。')) return;
      KB.local = kbLocal().filter(function (x) { return x.id !== d.id; });
      kbPersist();
      KB.open = '';
      renderView(true);
      toast('删了', 'ok');
      return;
    }
  });

  sec.addEventListener('input', function (e) {
    const f = e.target.getAttribute('data-kb-field');
    if (!f) return;
    let d = kbGet(KB.open);
    if (!d) return;
    if (!d.local) {
      d = kbMaterialize(KB.open);
      if (!d) return;
    }
    d[f] = e.target.value;
    if (!d.date) d.date = fmtDate(new Date());
    kbPersist();
    kbSyncMeta();
  });

  // 标题改完，左边列表跟着变（点在标题上不重渲染，失焦才刷）
  const tt = sec.querySelector('.kb-ed-t');
  if (tt) {
    tt.addEventListener('blur', function () {
      const d = kbGet(KB.open);
      if (d && d.local) renderView(true);
    });
  }
}

/* 雷达点「写这条」：开一个空稿，标题和出处先填上 */
function kbStartFrom(idea) {
  const d = {
    id: 'n' + Date.now(), local: true, file: null,
    title: String((idea && idea.title) || ''),
    body: '', final: false,
    date: fmtDate(new Date()),
    src: (idea && idea.from ? idea.from + ' ' : '') + ((idea && idea.src) || ''),
    url: (idea && idea.url) || ''
  };
  kbLocal().unshift(d);
  kbPersist();
  KB.open = d.id;
  KB.lane = 'draft';
  switchTab('koubo');
  toast('开了个空稿，标题先填上了', 'ok');
}
/* ---------------- 战报（每月视频数据统计 · 照搬老板的 Excel） ---------------- */
/* 数据：content/report/index.json（tools/build-report.py 从 xlsx 生成）
   页面顺序与表格 sheet 一致：整体大盘 → 引流vs内容 → 全部明细 → TOP10 → 总结 */

const RRP = { month: '', top: '内容', q: '', type: '', sort: 'date', dir: 1, view: [] };
// month 空 = 用最新一个月；q/type 是明细筛选；sort/dir 是明细排序

function rrpNum(n) { const v = Number(n); return isFinite(v) ? v : 0; }

function rrpInt(n) {
  return String(Math.round(rrpNum(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function rrpDec(n) {
  const s = rrpNum(n).toFixed(1).split('.');
  return rrpInt(s[0]) + '.' + s[1];
}

// t: num 千分位 / dec 一位小数 / rate 百分比
function rrpVal(v, t) {
  if (t === 'rate') return (rrpNum(v) * 100).toFixed(2) + '%';
  if (t === 'dec') return rrpDec(v);
  return rrpInt(v);
}

function rrpWan(n) {
  const v = rrpNum(n);
  if (v >= 100000000) return (v / 100000000).toFixed(2) + ' 亿';
  if (v >= 10000) return (v / 10000).toFixed(1) + ' 万';
  return rrpInt(v);
}

function rrpCur() {
  const ms = (st.report && st.report.months) || [];
  if (!ms.length) return null;
  for (let i = 0; i < ms.length; i++) if (ms[i].key === RRP.month) return ms[i];
  return ms[ms.length - 1];
}

function rrpPick(m, k) {
  const a = (m && m.overview) || [];
  for (let i = 0; i < a.length; i++) if (a[i].k === k) return a[i].v;
  return 0;
}

function rrpHead(title, sub, right) {
  return '<div class="rrp-h"><div class="rrp-h-t">' + title + (sub ? '<em>' + sub + '</em>' : '') + '</div>' +
    (right ? '<div class="rrp-h-r">' + right + '</div>' : '') + '</div>';
}

/* 指标名去掉单位后缀，当小标题用 */
function rrpClean(k) {
  return String(k || '')
    .replace(/（条）\s*$/, '')
    .replace(/^体裁\s*·\s*/, '')
    .replace(/^审核\s*·\s*/, '')
    .replace(/^播放量\s+/, '');
}

/* 大盘指标分五组：总量 / 均值比率 / 播放分布 / 体裁 / 审核 */
function rrpGroups(m) {
  const g = { total: [], avg: [], dist: [], fmt: [], audit: [] };
  (m.overview || []).forEach(function (r) {
    const k = String(r.k || '');
    if (/^播放量[\s·]/.test(k)) g.dist.push(r);
    else if (/^体裁/.test(k)) g.fmt.push(r);
    else if (/^审核/.test(k)) g.audit.push(r);
    else if (/^总|^发布|^其中|^内容视频|^引流视频/.test(k)) g.total.push(r);
    else g.avg.push(r);
  });
  return g;
}

function rrpTiles(rows) {
  return '<div class="rrp-tiles">' + rows.map(function (r) {
    return '<div class="rrp-tile"><span>' + esc(rrpClean(r.k)) + '</span>' +
      '<b>' + rrpVal(r.v, r.t) + '</b></div>';
  }).join('') + '</div>';
}

/* 分布：一条细横条 + 数量 + 占比 */
function rrpBars(rows, total) {
  let sum = 0;
  rows.forEach(function (r) { sum += rrpNum(r.v); });
  if (total) sum = total;
  if (!sum) sum = 1;
  return '<div class="rrp-bars">' + rows.map(function (r) {
    const v = rrpNum(r.v);
    const w = v > 0 ? Math.max(2, (v / sum) * 100) : 0;
    return '<div class="rrp-bar-row">' +
      '<span class="rrp-bl">' + esc(rrpClean(r.k)) + '</span>' +
      '<span class="rrp-bt"><i style="width:' + w.toFixed(2) + '%"></i></span>' +
      '<b class="rrp-bn">' + rrpVal(r.v, r.t) + '</b>' +
      '<em class="rrp-bp">' + ((v / sum) * 100).toFixed(1) + '%</em>' +
    '</div>';
  }).join('') + '</div>';
}

/* 明细表列定义：k=字段 · 名称 · class */
const RRP_COLS = [
  ['title', '作品名称', 'is-title'],
  ['date', '发布时间', 'is-date'],
  ['fmt', '体裁', ''],
  ['audit', '审核', ''],
  ['play', '播放量', 'is-n'],
  ['fin', '完播率', 'is-n'],
  ['f5', '5s完播率', 'is-n'],
  ['ctr', '封面点击', 'is-n'],
  ['b2', '2s跳出', 'is-n'],
  ['avg', '平均时长', 'is-n'],
  ['like', '点赞', 'is-n'],
  ['share', '分享', 'is-n'],
  ['cmt', '评论', 'is-n'],
  ['fav', '收藏', 'is-n'],
  ['visit', '主页访问', 'is-n'],
  ['fans', '涨粉', 'is-n'],
  ['type', '类型', '']
];

function rrpCellHtml(r, k) {
  if (k === 'title') return '<td class="is-title" title="' + esc(r.title) + '"><span>' + esc(r.title) + '</span></td>';
  if (k === 'date') return '<td class="is-date">' + esc(String(r.date || '').slice(5)) + (r.time ? ' ' + esc(r.time) : '') + '</td>';
  if (k === 'fmt') return '<td class="is-dim">' + esc(r.fmt || '') + '</td>';
  if (k === 'audit') return '<td class="is-dim">' + esc(r.audit || '') + '</td>';
  if (k === 'type') {
    const c = r.type === '内容视频' ? ' is-c' : (r.type === '引流视频' ? ' is-y' : '');
    return '<td><span class="rrp-tag' + c + '">' + esc(r.type || '—') + '</span></td>';
  }
  if (k === 'avg') return '<td class="is-n">' + rrpDec(r.avg) + '</td>';
  if (k === 'ctr') {
    return '<td class="is-n">' + (r.ctr == null ? '<i class="rrp-nil">—</i>' : (rrpNum(r.ctr) * 100).toFixed(2) + '%') + '</td>';
  }
  if (k === 'fin' || k === 'f5' || k === 'b2') return '<td class="is-n">' + (rrpNum(r[k]) * 100).toFixed(2) + '%</td>';
  if (k === 'play') return '<td class="is-n is-strong">' + rrpInt(r.play) + '</td>';
  return '<td class="is-n">' + rrpInt(r[k]) + '</td>';
}

function renderReportPage() {
  if (st.load.report === 'error') {
    return '<div class="card rrp-card">' +
      stateHtml('error', '战报数据读不到',
        (st.err.report || 'content/report/index.json 没加载成功') + ' · 跑一次 tools/build-report.py 重新生成') +
      '</div>';
  }
  if (!st.report || st.load.report !== 'ready') {
    return '<div class="card rrp-card">' + stateHtml('loading', '正在读取月度数据') + '</div>';
  }

  const ms = st.report.months || [];
  if (!ms.length) {
    return '<div class="card rrp-card">' +
      stateHtml('empty', '还没有月度数据',
        '把「X月视频数据统计.xlsx」丢给 tools/build-report.py，生成的 content/report/index.json 就是这块的内容') +
      '</div>';
  }

  const m = rrpCur();
  const rowsAll = m.rows || [];
  const pub = rrpPick(m, '其中公开（条）');
  const g = rrpGroups(m);

  // 顶部：哪个月 + 四块大盘数 + 月份切换
  const chips = ms.map(function (x) {
    return '<button class="rrp-chip' + (x.key === m.key ? ' on' : '') + '" data-rrp-month="' +
      esc(x.key) + '">' + esc(x.label) + '</button>';
  }).join('');

  // 跟上个月比：只比播放和涨粉，没上个月就不显示
  const mi = ms.indexOf(m);
  const prev = mi > 0 ? ms[mi - 1] : null;
  const rrpDelta = function (key) {
    if (!prev) return '';
    const a = rrpPick(prev, key), b = rrpPick(m, key);
    if (!rrpNum(a)) return '';
    const d = ((rrpNum(b) - rrpNum(a)) / rrpNum(a)) * 100;
    return '<em class="rrp-dt' + (d >= 0 ? ' is-up' : ' is-down') + '">' +
      (d >= 0 ? '↑' : '↓') + Math.abs(d).toFixed(1) + '%</em>';
  };

  const head = '<div class="rrp-hero">' +
    '<div class="rrp-hero-top">' +
      '<div class="rrp-hero-l">' +
        '<div class="rrp-kicker"><b>REPORT</b> · 战报</div>' +
        '<div class="rrp-hero-t">' + esc(String(m.key).replace('-', ' 年 ')) + ' 月<em>数码科技账号</em></div>' +
        '<div class="rrp-hero-s">发布 ' + rrpInt(rrpPick(m, '发布视频数（条）')) +
          ' 条 · 公开 ' + rrpInt(pub) + ' · 取自「' + esc(m.label) + '视频数据统计.xlsx」</div>' +
      '</div>' +
      '<div class="rrp-chips">' + chips + '</div>' +
    '</div>' +
    '<div class="rrp-kpis">' +
      '<div class="rrp-kpi"><span>发布视频</span><b>' + rrpInt(rrpPick(m, '发布视频数（条）')) + '</b>' +
        '<i>公开 ' + rrpInt(pub) + ' 条</i></div>' +
      '<div class="rrp-kpi"><span>总播放</span><b>' + rrpWan(rrpPick(m, '总播放量')) + '</b>' +
        '<i>' + rrpDelta('总播放量') + '均播 ' + rrpWan(rrpPick(m, '平均单条播放量')) + '</i></div>' +
      '<div class="rrp-kpi"><span>涨粉</span><b>' + rrpInt(rrpPick(m, '总粉丝增量')) + '</b>' +
        '<i>' + rrpDelta('总粉丝增量') + '主页访问 ' + rrpWan(rrpPick(m, '总主页访问量')) + '</i></div>' +
      '<div class="rrp-kpi"><span>互动率</span><b>' + rrpVal(rrpPick(m, '互动率（赞+评+藏+转）/播放'), 'rate') + '</b>' +
        '<i>平均完播 ' + rrpVal(rrpPick(m, '平均完播率'), 'rate') + '</i></div>' +
    '</div>' +
  '</div>';

  // ① 整体大盘：总量 / 均值 / 分布，三类分开摆
  const kvCard = '<div class="card rrp-card">' +
    rrpHead('<b>1</b> 整体大盘', '指标只算公开视频 · 共 ' + rrpInt(pub) + ' 条') +
    (g.total.length ? '<div class="rrp-grp"><div class="rrp-grp-k">总量</div>' + rrpTiles(g.total) + '</div>' : '') +
    (g.avg.length ? '<div class="rrp-grp"><div class="rrp-grp-k">均值与比率</div>' + rrpTiles(g.avg) + '</div>' : '') +
    (g.dist.length ? '<div class="rrp-grp"><div class="rrp-grp-k">播放量分布</div>' + rrpBars(g.dist, pub) + '</div>' : '') +
    ((g.fmt.length || g.audit.length)
      ? '<div class="rrp-grp rrp-grp-2col">' +
          (g.fmt.length ? '<div><div class="rrp-grp-k">体裁</div>' +
            rrpBars(g.fmt, rrpPick(m, '发布视频数（条）')) + '</div>' : '') +
          (g.audit.length ? '<div><div class="rrp-grp-k">审核</div>' +
            rrpBars(g.audit, rrpPick(m, '发布视频数（条）')) + '</div>' : '') +
        '</div>'
      : '') +
  '</div>';

  // ② 引流 vs 内容：每行赢的那格标橙
  const cmp = m.compare || { cols: [], rows: [] };
  const cols2 = cmp.cols || [];
  let shareA = null;
  cmp.rows.forEach(function (r) { if (r.k === '播放量占比') shareA = rrpNum(r.v[0]) * 100; });

  let bar = '';
  if (shareA != null) {
    const b = 100 - shareA;
    bar = '<div class="rrp-share">' +
      '<div class="rrp-share-bar"><i style="width:' + shareA.toFixed(1) + '%"></i>' +
        '<u style="width:' + b.toFixed(1) + '%"></u></div>' +
      '<div class="rrp-share-legend">' +
        '<span><i class="a"></i>' + esc(cols2[0] || '引流') + ' · 占播放 ' + shareA.toFixed(1) + '%</span>' +
        '<span><i class="b"></i>' + esc(cols2[1] || '内容') + ' · 占播放 ' + b.toFixed(1) + '%</span>' +
      '</div>' +
    '</div>';
  }

  const cmpCard = '<div class="card rrp-card">' +
    rrpHead('<b>2</b> 引流 vs 内容', '同样的工作量，哪边更值 · 赢的那格标橙') +
    '<div class="rrp-cmp-wrap"><table class="rrp-t rrp-cmp"><thead><tr><th>指标</th>' +
      cols2.map(function (c) { return '<th class="is-n">' + esc(c) + '</th>'; }).join('') +
      '<th class="is-n">差多少</th>' +
    '</tr></thead><tbody>' +
      (cmp.rows || []).map(function (r) {
        const a = rrpNum(r.v[0]), b = rrpNum(r.v[1]);
        const win = a === b ? -1 : (a > b ? 0 : 1);
        let gap = '<span class="rrp-gap is-mute">—</span>';
        if (a || b) {
          const d = a ? ((b - a) / Math.abs(a)) * 100 : 100;
          if (!a) gap = '<span class="rrp-gap is-c">内容独有</span>';
          else {
            const side = d >= 0 ? '内容' : '引流';
            gap = '<span class="rrp-gap ' + (d >= 0 ? 'is-c' : 'is-y') + '">' +
              side + ' ' + (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(0) + '%</span>';
          }
        }
        return '<tr><td>' + esc(r.k) + '</td>' +
          '<td class="is-n' + (win === 0 ? ' is-win' : '') + '">' + rrpVal(r.v[0], r.t) + '</td>' +
          '<td class="is-n' + (win === 1 ? ' is-win' : '') + '">' + rrpVal(r.v[1], r.t) + '</td>' +
          '<td class="is-n">' + gap + '</td></tr>';
      }).join('') +
    '</tbody></table></div>' + bar +
  '</div>';

  // ③ 全部明细：可搜、可按列排、点一行看全部指标
  const sk = RRP.sort || 'date';
  const dir = RRP.dir < 0 ? -1 : 1;
  const view = rowsAll.slice();
  view.sort(function (a, b) {
    if (sk === 'date') {
      return (String(a.date || '') + ' ' + String(a.time || ''))
        .localeCompare(String(b.date || '') + ' ' + String(b.time || '')) * dir;
    }
    if (sk === 'title' || sk === 'fmt' || sk === 'audit' || sk === 'type') {
      return String(a[sk] || '').localeCompare(String(b[sk] || ''), 'zh') * dir;
    }
    let va = rrpNum(a[sk]), vb = rrpNum(b[sk]);
    if (a[sk] == null) va = -1;
    if (b[sk] == null) vb = -1;
    return (va - vb) * dir;
  });
  RRP.view = view;

  const th = RRP_COLS.map(function (c) {
    const on = RRP.sort === c[0];
    return '<th class="' + c[2] + (on ? ' is-sorted' : '') + '">' +
      '<button type="button" class="rrp-thb" data-rrp-sort="' + c[0] + '">' + esc(c[1]) +
        '<span class="rrp-ar' + (on ? (dir > 0 ? ' is-up' : ' is-down') : '') + '"></span>' +
      '</button></th>';
  }).join('');

  const typeChips = ['', '内容视频', '引流视频'].map(function (t) {
    return '<button type="button" class="rrp-fchip' + (RRP.type === t ? ' on' : '') +
      '" data-rrp-type="' + esc(t) + '">' + (t ? t.replace('视频', '') : '全部') + '</button>';
  }).join('');

  const detBody = view.map(function (r, i) {
    return '<tr data-rrp-row="' + i + '" data-type="' + esc(r.type || '') + '"' +
      ' data-q="' + esc((String(r.title || '') + ' ' + String(r.type || '') + ' ' + String(r.fmt || '')).toLowerCase()) + '"' +
      ' tabindex="0">' +
      RRP_COLS.map(function (c) { return rrpCellHtml(r, c[0]); }).join('') +
    '</tr>';
  }).join('');

  const detCard = '<div class="card rrp-card">' +
    rrpHead('<b>3</b> 全部明细', '点表头换排序 · 点一行看这条的全部指标 · 列多可以左右滑') +
    '<div class="rrp-tool">' +
      '<label class="rrp-search">' + ic('search') +
        '<input type="search" data-rrp-q placeholder="搜作品名、类型、体裁" value="' + esc(RRP.q) + '" spellcheck="false">' +
      '</label>' +
      '<div class="rrp-fchips">' + typeChips + '</div>' +
      '<span class="rrp-count" data-rrp-count>' + rowsAll.length + ' 条</span>' +
    '</div>' +
    '<div class="rrp-scroll"><table class="rrp-t rrp-detail"><thead><tr>' + th + '</tr></thead>' +
      '<tbody>' + detBody + '</tbody></table></div>' +
    '<div class="rrp-none">没有符合条件的作品，换个词试试</div>' +
  '</div>';

  // ④ TOP10
  const tops = m.top || {};
  const topKeys = ['内容', '引流'].filter(function (k) { return (tops[k] || []).length; });
  const topCur = topKeys.indexOf(RRP.top) >= 0 ? RRP.top : (topKeys[0] || '内容');
  const topChips = topKeys.map(function (k) {
    return '<button class="rrp-chip' + (k === topCur ? ' on' : '') + '" data-rrp-top="' +
      esc(k) + '">' + esc(k) + ' TOP10</button>';
  }).join('');
  const tl = tops[topCur] || [];
  const maxPlay = tl.reduce(function (mx, r) { return Math.max(mx, rrpNum(r.play)); }, 1);

  const topCard = '<div class="card rrp-card">' +
    rrpHead('<b>4</b> ' + esc(topCur) + '视频 TOP10', '按播放量排 · 表里的原榜', topChips) +
    '<div class="rrp-scroll"><table class="rrp-t rrp-top"><thead><tr>' +
      '<th class="is-rk">#</th><th>作品名称</th><th>日期</th><th>体裁</th>' +
      '<th class="is-n">播放量</th><th class="is-n">点赞</th><th class="is-n">评论</th>' +
      '<th class="is-n">分享</th><th class="is-n">收藏</th><th class="is-n">涨粉</th><th class="is-n">主页访问</th>' +
    '</tr></thead><tbody>' +
    tl.map(function (r) {
      const w = (rrpNum(r.play) / maxPlay) * 100;
      return '<tr' + (r.rank <= 3 ? ' class="is-top3"' : '') + '>' +
        '<td class="is-rk"><span>' + r.rank + '</span></td>' +
        '<td class="is-title" title="' + esc(r.title) + '"><span>' + esc(r.title) + '</span></td>' +
        '<td class="is-date">' + esc(String(r.date || '').slice(5)) + '</td>' +
        '<td class="is-dim">' + esc(r.fmt || '') + '</td>' +
        '<td class="is-n is-strong"><span class="rrp-play">' + rrpInt(r.play) + '</span>' +
          '<span class="rrp-mini"><i style="width:' + w.toFixed(1) + '%"></i></span></td>' +
        '<td class="is-n">' + rrpInt(r.like) + '</td>' +
        '<td class="is-n">' + rrpInt(r.cmt) + '</td>' +
        '<td class="is-n">' + rrpInt(r.share) + '</td>' +
        '<td class="is-n">' + rrpInt(r.fav) + '</td>' +
        '<td class="is-n">' + rrpInt(r.fans) + '</td>' +
        '<td class="is-n">' + rrpInt(r.visit) + '</td>' +
      '</tr>';
    }).join('') +
    '</tbody></table></div>' +
  '</div>';

  // ⑤ 总结（表里写的那段话，原样放）
  const note = String(m.note || '').trim();
  const noteCard = note
    ? '<div class="card rrp-card">' +
        rrpHead('<b>5</b> 总结', '表格里写的原话') +
        note.split('\n').map(function (p) {
          return p.trim() ? '<p class="rrp-note">' + esc(p.trim()) + '</p>' : '';
        }).join('') +
      '</div>'
    : '';

  return head + kvCard + cmpCard + detCard + topCard + noteCard;
}

/* ---------------- 每日雷达（每天 10:20 抓一遍 · 一天存一份） ---------------- */
/* 数据：radar-data.json（今天）+ wechat-feed.json（公众号）+ content/radar/YYYY-MM-DD.json（每天存档）
   页面：日期条（前天→今天→后天）→ 候选池（默认只摆 8 条）→ 热梗 */

const RDR = { onlyHit: false, day: '', more: false, view: [], ym: '' };
const RDR_MAX = 8;
const RDR_OFFSETS = [-3, -2, -1, 0, 1, 2];

function rdrToday() { return fmtDate(new Date()); }

function rdrShortTime(t) {
  return String(t || '').replace(/^\d{4}-/, '') || '—';
}

function rdrOffsetDate(off) {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d;
}

/* 今天：雷达 + 公众号合成一份；同标题只留先出现的 */
function rdrTodayList() {
  const out = [];
  const rp = (st.radar && st.radar.picks) ? st.radar.picks : [];
  rp.forEach(function (p) {
    out.push({
      title: p.title, source: p.source || '', kind: p.kind || '',
      score: p.score || 0, hooks: p.hooks || [], url: p.url || '', from: ''
    });
  });
  const wp = (st.wechat && st.wechat.picks) ? st.wechat.picks : [];
  wp.forEach(function (p) {
    out.push({
      title: p.title, source: p.account || '公众号', kind: '公众号',
      score: p.score || 0, hooks: (p.why || []).slice(0, 2), url: p.url || '', from: '公众号'
    });
  });
  const seen = {};
  const uniq = [];
  out.forEach(function (p) {
    const k = String(p.title || '').slice(0, 18);
    if (!k || seen[k]) return;
    seen[k] = 1;
    uniq.push(p);
  });
  uniq.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
  return uniq;
}

function rdrShoot(list) {
  return list.filter(function (p) { return (p.score || 0) >= 5; }).length;
}

/* 日历：一格一天。有存档的才给按钮，今天永远能点（实时数据），
   没抓过的日子和未来只留灰数字——不写「没存档」三个字，省得难看 */
function rdrYm() {
  if (RDR.ym) return RDR.ym;
  const d = parseDate(RDR.day || rdrToday()) || new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
}

/* radar-data.json 真正是哪天抓的（定时任务漏跑时，别把旧数据当今天） */
function rdrDataDate() {
  const m = String((st.radar && st.radar.updated) || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function rdrDayMeta() {
  const today = rdrToday();
  const meta = {};
  ((st.radarDays && st.radarDays.days) || []).forEach(function (x) {
    if (x && x.date && x.picks) meta[x.date] = x;
  });
  // 今天的数在内存里。index.json 有没有今天都得算上（以前漏的就是这一笔），
  // 但 radar-data.json 不是今天抓的就不给条数，只在日历上留一个能点的今天
  const tl = rdrTodayList();
  const fresh = rdrDataDate() === today;
  meta[today] = {
    date: today,
    picks: fresh ? tl.length : 0,
    shootable: fresh ? rdrShoot(tl) : 0,
    fresh: fresh
  };
  return meta;
}

function rdrShiftYm(step) {
  const ym = rdrYm();
  let y = Number(ym.slice(0, 4));
  let m = Number(ym.slice(5, 7)) + step;
  if (m < 1) { m = 12; y -= 1; }
  if (m > 12) { m = 1; y += 1; }
  const next = y + '-' + pad2(m);
  const today = rdrToday();
  const keys = Object.keys(rdrDayMeta()).sort();
  const minYm = keys.length ? keys[0].slice(0, 7) : today.slice(0, 7);
  if (next < minYm || next > today.slice(0, 7)) return null;
  return next;
}

function rdcCal(curKey, data) {
  const today = rdrToday();
  const meta = rdrDayMeta();
  const ym = rdrYm();
  const y = Number(ym.slice(0, 4));
  const mo = Number(ym.slice(5, 7)) - 1;
  const total = new Date(y, mo + 1, 0).getDate();
  const lead = (new Date(y, mo, 1).getDay() + 6) % 7;   // 周一打头

  const cells = [];
  let i;
  for (i = 0; i < lead; i++) cells.push('<span class="rdk-c is-void"></span>');

  let nDays = 0;
  let nPicks = 0;
  for (let d = 1; d <= total; d++) {
    const key = y + '-' + pad2(mo + 1) + '-' + pad2(d);
    const m = meta[key];
    const isToday = key === today;
    const future = key > today;
    const has = !!(m && m.picks);
    let cls = 'rdk-c';
    let tip;
    if (has) {
      cls += ' is-arch';
      tip = '这天存了 ' + m.picks + ' 条 · ' + (m.shootable || 0) + ' 条能拍';
      nDays++;
      nPicks += m.picks;
    } else if (isToday) {
      tip = m && m.fresh === false ? '今天还没抓，下面是 ' + (rdrDataDate() || '以前') + ' 抓的' : '今天还没抓';
    } else if (future) {
      cls += ' is-off';
      tip = '还没到';
    } else {
      cls += ' is-off';
      tip = '这天没抓';
    }
    if (isToday) cls += ' is-today';
    if (key === curKey) cls += ' is-on';
    const inner = '<b>' + d + '</b>' + (has ? '<i>' + m.picks + '</i>' : '');
    cells.push(has || isToday
      ? '<button type="button" class="' + cls + '" data-rdr-day="' + key + '" title="' + esc(tip) + '">' + inner + '</button>'
      : '<span class="' + cls + '" title="' + esc(tip) + '">' + inner + '</span>');
  }

  const prev = rdrShiftYm(-1);
  const next = rdrShiftYm(1);
  const week = ['一', '二', '三', '四', '五', '六', '日'];

  // 这天各平台抓了多少条（老板要的「每天都抓了什么」）
  const stats = (data && data.stats) || {};
  const plats = Object.keys(stats).filter(function (k) { return stats[k] > 0; });
  let srcSum = 0;
  plats.forEach(function (k) { srcSum += stats[k]; });
  const srcHtml = plats.length
    ? '<div class="rdk-src">' +
        '<div class="rdk-src-h">这天扫了 ' + srcSum + ' 条热榜</div>' +
        '<div class="rdk-src-g">' + plats.map(function (k) {
          return '<span>' + esc(k) + '<b>' + stats[k] + ' 条</b></span>';
        }).join('') + '</div>' +
      '</div>'
    : '';

  return '<div class="rdk">' +
    '<div class="rdk-head">' +
      '<button type="button" class="rdk-nav" data-rdr-ym="-1"' + (prev ? '' : ' disabled') + ' aria-label="上个月">‹</button>' +
      '<span class="rdk-ym">' + y + ' 年 ' + (mo + 1) + ' 月</span>' +
      '<button type="button" class="rdk-nav" data-rdr-ym="1"' + (next ? '' : ' disabled') + ' aria-label="下个月">›</button>' +
      '<button type="button" class="rdk-today" data-rdr-today="1">回今天</button>' +
    '</div>' +
    '<div class="rdk-week">' + week.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
    '<div class="rdk-grid">' + cells.join('') + '</div>' +
    srcHtml +
    '<div class="rdk-foot">' +
      '本月 <b>' + nDays + '</b> 天 · <b>' + nPicks + '</b> 条' +
      '<span class="rdk-dot is-on"></span><em>正在看</em>' +
      '<span class="rdk-dot is-arch"></span><em>有存档</em>' +
    '</div>' +
  '</div>';
}

function rdcRow(p, i) {
  const sc = p.score || 0;
  const url = /^https?:\/\//i.test(p.url || '') ? p.url : '';
  const tags = (p.hooks || []).map(function (h) { return '<i>' + esc(h) + '</i>'; }).join('') +
    (p.from ? '<u>' + esc(p.from) + '</u>' : (p.kind ? '<u>' + esc(p.kind) + '</u>' : ''));
  const main = '<span class="rdc-sc' + (sc >= 8 ? ' is-hot' : sc >= 5 ? ' is-hit' : '') + '">' +
      (sc > 0 ? sc : '—') + '</span>' +
    '<span class="rdc-src">' + esc(p.source || '') + '</span>' +
    '<span class="rdc-tt">' + esc(p.title || '') + (url ? '<i class="rd-out">↗</i>' : '') + '</span>' +
    '<span class="rdc-tg">' + tags + '</span>';
  const cell = url
    ? '<a class="rdc-main" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" title="打开原文">' + main + '</a>'
    : '<div class="rdc-main">' + main + '</div>';
  return '<div class="rdc-row">' + cell +
    '<button type="button" class="rdc-w" data-rdr-write="' + i + '" title="拿这条开个稿">写</button>' +
  '</div>';
}

function renderRadarPage() {
  if (st.load.radar === 'error') {
    return '<div class="card rd-card">' +
      stateHtml('error', '雷达数据读不到',
        (st.err.radar || 'radar-data.json 没加载成功') + ' · 跑一次 选题雷达/radar_run.py 就会生成') +
      '</div>';
  }
  if (!st.radar || st.load.radar !== 'ready') {
    return '<div class="card rd-card">' + stateHtml('loading', '正在读今天抓到的') + '</div>';
  }

  const today = rdrToday();
  const dayKey = RDR.day || today;
  const isToday = dayKey === today;
  const arch = isToday ? null : ((st.dayCache || {})[dayKey] || null);

  if (!isToday && !arch) {
    return '<div class="card rd-card rd-top"><div class="rdc-wrap">' +
      '<div class="rd-kicker"><b>每日雷达</b> 每天 10:20 抓一遍 · 一天存一份</div>' +
      '<div class="rdc-miss">这天的存档还没读上来，点日历上的「回今天」再看一次</div>' +
    '</div></div>';
  }

  const all = isToday ? rdrTodayList() : (arch.picks || []);
  const data = isToday ? st.radar : arch;
  const hit = rdrShoot(all);
  const list = RDR.onlyHit ? all.filter(function (p) { return (p.score || 0) >= 5; }) : all;
  const shown = RDR.more ? list : list.slice(0, RDR_MAX);
  RDR.view = shown;

  const d = parseDate(dayKey) || new Date();
  const dayLbl = (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
  const rel = isToday ? '今天' : (dayKey === fmtDate(rdrOffsetDate(-1)) ? '昨天' : '');
  const stats = data.stats || {};
  const platforms = Object.keys(stats).filter(function (k) { return stats[k] > 0; });
  let totalSrc = 0;
  platforms.forEach(function (k) { totalSrc += stats[k]; });

  let html = '<div class="card rd-card rd-top"><div class="rdc-wrap">' +
    '<div class="rdc-top">' +
      '<div>' +
        '<div class="rd-kicker"><b>每日雷达</b> 每天 10:20 抓一遍 · 一天存一份</div>' +
        '<div class="rdc-title">' + dayLbl + (rel ? '<em>' + rel + '</em>' : '') +
          '<span class="rdc-meta">' + esc(rdrShortTime(data.updated || '')) +
          (platforms.length ? ' · ' + platforms.length + ' 个平台 · 扫了 ' + totalSrc + ' 条热榜' : '') +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div class="rd-slots">' +
        '<div class="rd-slot"><span>候选</span><b>' + all.length + '</b></div>' +
        '<div class="rd-slot is-live"><span>能拍</span><b>' + hit + '</b></div>' +
        '<div class="rd-slot"><span>热梗</span><b>' + ((data.meme || []).length) + '</b></div>' +
      '</div>' +
    '</div>' +
  '</div></div>';

  html += '<div class="card rd-card rd-split">' +
    '<div class="rdc-side">' + rdcCal(dayKey, data) + '</div>' +
    '<div class="rdc-body">' +
    '<div class="rd-card-head">' +
      '<div class="rd-card-title">候选池<em>点一行看原文 · 点「写」直接开稿</em></div>' +
      '<div class="rd-chips">' +
        '<span class="chip' + (RDR.onlyHit ? '' : ' active') + '" data-rdr-hit="0">全部 ' + all.length + '</span>' +
        '<span class="chip' + (RDR.onlyHit ? ' active' : '') + '" data-rdr-hit="1">只看能拍 ' + hit + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="rdc-list">' + shown.map(rdcRow).join('') + '</div>' +
    (list.length > shown.length
      ? '<button type="button" class="rdc-more" data-rdr-more="1">展开剩下的 ' + (list.length - shown.length) + ' 条</button>'
      : (RDR.more && list.length > RDR_MAX
          ? '<button type="button" class="rdc-more" data-rdr-more="1">收起来，只看前 ' + RDR_MAX + ' 条</button>'
          : '<div class="rd-note"><i></i>分数只是「值不值得开机」，最后拍哪条你自己定</div>')) +
    '</div>' +
  '</div>';

  if ((data.meme || []).length) {
    html += '<div class="card rd-card">' +
      '<div class="rd-card-head"><div class="rd-card-title">热梗<em>口播里自然带一句就行，别硬念</em></div></div>' +
      '<div class="rd-meme">' +
        data.meme.slice(0, 12).map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') +
      '</div>' +
    '</div>';
  }

  return html;
}

function rdrLoadDay(date) {
  if (date === rdrToday()) {
    RDR.day = '';
    renderView(true);
    return;
  }
  const cache = st.dayCache || (st.dayCache = {});
  if (cache[date]) {
    RDR.day = date;
    renderView(true);
    return;
  }
  fetch('content/radar/' + date + '.json?t=' + Date.now())
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (j) { cache[date] = j; RDR.day = date; renderView(true); })
    .catch(function () { toast('这天没存下数据', 'err'); });
}

// 雷达筛选：重建 DOM 后重新挂监听
function mountRadar() {
  const nc = document.getElementById('navRadarCount');
  if (nc) {
    const n = st.radar ? rdrShoot(rdrTodayList()) : 0;
    nc.textContent = st.load.radar === 'ready' ? String(n) : '—';
  }

  const sec = document.getElementById('sec-radar');
  if (!sec) return;
  sec.querySelectorAll('[data-rdr-hit]').forEach(function (el) {
    el.addEventListener('click', function () {
      const v = el.getAttribute('data-rdr-hit') === '1';
      if (v === RDR.onlyHit) return;
      RDR.onlyHit = v;
      renderView(true);
    });
  });
  sec.querySelectorAll('[data-rdr-day]').forEach(function (el) {
    el.addEventListener('click', function () { rdrLoadDay(el.getAttribute('data-rdr-day')); });
  });
  const more = sec.querySelector('[data-rdr-more]');
  if (more) more.addEventListener('click', function () {
    RDR.more = !RDR.more;
    renderView(true);
  });
  const back = sec.querySelector('[data-rdr-today]');
  if (back) back.addEventListener('click', function () {
    RDR.ym = '';
    rdrLoadDay(rdrToday());
  });
  sec.querySelectorAll('[data-rdr-ym]').forEach(function (el) {
    el.addEventListener('click', function () {
      const ym = rdrShiftYm(Number(el.getAttribute('data-rdr-ym')));
      if (!ym || ym === rdrYm()) return;
      RDR.ym = ym;
      renderView(true);
    });
  });
  sec.querySelectorAll('[data-rdr-write]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const p = RDR.view[Number(el.getAttribute('data-rdr-write'))];
      if (p) kbStartFrom(p);
    });
  });
}

function mountReport() {
  // 侧栏条目数：所有月份加起来一共多少条视频
  const nc = document.getElementById('navReportCount');
  if (nc) {
    const ms = (st.report && st.report.months) ? st.report.months : [];
    let n = 0;
    ms.forEach(function (m) { n += (m.rows || []).length; });
    nc.textContent = (st.load.report === 'ready' && n) ? String(n) : '—';
  }

  const sec = document.getElementById('sec-report');
  if (!sec) return;

  sec.querySelectorAll('[data-rrp-month]').forEach(function (el) {
    el.addEventListener('click', function () {
      const k = el.getAttribute('data-rrp-month');
      if (k === RRP.month) return;
      RRP.month = k;
      RRP.q = '';
      RRP.type = '';
      renderView(true);
    });
  });
  sec.querySelectorAll('[data-rrp-top]').forEach(function (el) {
    el.addEventListener('click', function () {
      const k = el.getAttribute('data-rrp-top');
      if (k === RRP.top) return;
      RRP.top = k;
      renderView(true);
    });
  });

  // 明细：搜、筛、排、看详情
  const q = sec.querySelector('[data-rrp-q]');
  if (q) {
    q.addEventListener('input', function () { RRP.q = q.value; rrpFilter(sec); });
    q.addEventListener('search', function () { RRP.q = q.value; rrpFilter(sec); });
  }
  sec.querySelectorAll('[data-rrp-type]').forEach(function (el) {
    el.addEventListener('click', function () {
      const t = el.getAttribute('data-rrp-type') || '';
      if (t === RRP.type) return;
      RRP.type = t;
      sec.querySelectorAll('[data-rrp-type]').forEach(function (b) {
        b.classList.toggle('on', (b.getAttribute('data-rrp-type') || '') === t);
      });
      rrpFilter(sec);
    });
  });
  sec.querySelectorAll('[data-rrp-sort]').forEach(function (el) {
    el.addEventListener('click', function () {
      const k = el.getAttribute('data-rrp-sort');
      if (k === RRP.sort) RRP.dir = (RRP.dir < 0 ? 1 : -1);
      else { RRP.sort = k; RRP.dir = (k === 'date' || k === 'title' || k === 'fmt' || k === 'audit' || k === 'type') ? 1 : -1; }
      renderView(true);
    });
  });
  sec.querySelectorAll('[data-rrp-row]').forEach(function (tr) {
    tr.addEventListener('click', function () { rrpOpenRow(Number(tr.getAttribute('data-rrp-row'))); });
    tr.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        rrpOpenRow(Number(tr.getAttribute('data-rrp-row')));
      }
    });
  });

  rrpFilter(sec);
}

/* 明细筛选只动 DOM，不重渲染 —— 输入时不丢焦点 */
function rrpFilter(sec) {
  const q = String(RRP.q || '').trim().toLowerCase();
  const t = RRP.type || '';
  let n = 0;
  sec.querySelectorAll('.rrp-detail tbody tr[data-rrp-row]').forEach(function (tr) {
    const okQ = !q || String(tr.getAttribute('data-q') || '').indexOf(q) >= 0;
    const okT = !t || tr.getAttribute('data-type') === t;
    const on = okQ && okT;
    tr.style.display = on ? '' : 'none';
    if (on) n++;
  });
  const cnt = sec.querySelector('[data-rrp-count]');
  if (cnt) cnt.textContent = (n === RRP.view.length) ? (n + ' 条') : (n + ' / ' + RRP.view.length + ' 条');
  const none = sec.querySelector('.rrp-none');
  if (none) none.classList.toggle('is-on', !n);
}

/* 点一行：把这支视频的全部指标摊开 */
function rrpOpenRow(i) {
  const r = (RRP.view || [])[i];
  if (!r) return;
  const pct = function (v) { return (rrpNum(v) * 100).toFixed(2) + '%'; };
  const items = [
    ['播放量', rrpInt(r.play)],
    ['完播率', pct(r.fin)],
    ['5s 完播率', pct(r.f5)],
    ['封面点击率', r.ctr == null ? '—' : pct(r.ctr)],
    ['2s 跳出率', pct(r.b2)],
    ['平均播放时长', rrpDec(r.avg) + ' 秒'],
    ['点赞', rrpInt(r.like)],
    ['评论', rrpInt(r.cmt)],
    ['分享', rrpInt(r.share)],
    ['收藏', rrpInt(r.fav)],
    ['主页访问', rrpInt(r.visit)],
    ['涨粉', rrpInt(r.fans)]
  ];
  openModal({
    title: r.title || '未命名作品',
    meta: [r.date + (r.time ? ' ' + r.time : ''), r.fmt, r.audit, r.type],
    body: '<div class="rrp-metrics">' + items.map(function (x) {
      return '<div class="rrp-metric"><span>' + esc(x[0]) + '</span><b>' + x[1] + '</b></div>';
    }).join('') + '</div>'
  });
}

/* ---------------- 像素工坊（图片 → 像素风 · 透明背景导出） ---------------- */
const PX_DEFAULT = { size: 160, colors: 28, punch: 42, dither: 'none', outline: true, tol: 30, knock: true, scale: 4, preset: '' };

/* 预设：一键接近「AI 像素画」的观感 */
const PX_PRESETS = [
  { key: 'sprite', name: '像素角色', size: 144, colors: 22, punch: 56, dither: 'order', outline: true, knock: true, scale: 6 },
  { key: 'scene', name: '像素场景', size: 200, colors: 34, punch: 38, dither: 'none', outline: true, knock: false, scale: 4 },
  { key: 'retro', name: '复古 8 位', size: 72, colors: 10, punch: 26, dither: 'order', outline: true, knock: true, scale: 8 }
];

const PX_DITHER = {
  none: '无',
  order: '有序',
  fs: '扩散'
};

function pxGlyph() {
  return '<svg viewBox="0 0 16 16" aria-hidden="true">' +
    '<g fill="currentColor" opacity=".85">' +
      '<rect x="0" y="0" width="4" height="4"/><rect x="6" y="0" width="4" height="4"/><rect x="12" y="0" width="4" height="4"/>' +
      '<rect x="0" y="6" width="4" height="4"/><rect x="12" y="6" width="4" height="4"/>' +
      '<rect x="0" y="12" width="4" height="4"/><rect x="6" y="12" width="4" height="4"/><rect x="12" y="12" width="4" height="4"/>' +
    '</g><rect x="6" y="6" width="4" height="4" fill="#ff6a2f"/></svg>';
}

function pxCtrl(key, label, val, min, max, step, unit, hint) {
  return '<div class="px-ctrl">' +
    '<div class="px-ctrl-top"><label>' + label + '</label><b data-px-val="' + key + '">' + val + ' ' + unit + '</b></div>' +
    '<input type="range" data-px="' + key + '" data-unit="' + unit + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" aria-label="' + label + '">' +
    '<div class="px-ctrl-hint">' + hint + '</div>' +
  '</div>';
}

function renderPixelPage() {
  const p = st.pixel;
  const spec = p.outW ? (p.pw + ' × ' + p.ph + ' → ' + p.outW + ' × ' + p.outH + ' px') : '等待图片';
  const presetBtns = PX_PRESETS.map(function (k) {
    return '<button class="px-preset' + (p.preset === k.key ? ' on' : '') + '" data-pxpreset="' + k.key + '">' + k.name + '</button>';
  }).join('');
  const ditherBtns = Object.keys(PX_DITHER).map(function (k) {
    return '<button class="' + (p.dither === k ? 'on' : '') + '" data-pxdither="' + k + '">' + PX_DITHER[k] + '</button>';
  }).join('');

  return '<div class="px-wrap">' +
    '<div class="px-main">' +
      '<div class="px-bar">' +
        '<div class="px-file"><span class="px-file-tag">IMG</span>' +
          (p.name ? '<b title="' + esc(p.name) + '">' + esc(p.name) + '</b>' : '<b class="muted">还没有图片</b>') +
        '</div>' +
        '<div class="px-file-actions">' +
          '<button class="btn btn-sm" data-px-pick>' + ic('image', 'ico-14') + '<span>选择图片</span></button>' +
          '<button class="btn btn-sm" data-px-down' + (p.out ? '' : ' disabled') + '>' + ic('download', 'ico-14') + '<span>下载 PNG</span></button>' +
          '<button class="btn btn-sm btn-ghost" data-px-clear' + (p.src ? '' : ' disabled') + '>清空</button>' +
        '</div>' +
      '</div>' +
      '<div class="px-stage' + (p.src ? ' has-img' : '') + '" id="pxDrop">' +
        '<div class="px-board"><canvas id="pxCanvas" width="1" height="1"></canvas></div>' +
        '<div class="px-blank">' +
          '<div class="px-blank-ico">' + pxGlyph() + '</div>' +
          '<strong>把图片拖到这里</strong>' +
          '<span>PNG / JPG / WebP · 纯本地处理，不上传服务器</span>' +
          '<div class="px-blank-actions">' +
            '<button class="px-cta" data-px-pick>选择图片</button>' +
            '<button class="btn btn-sm" data-px-demo>用示例图试试</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<input type="file" id="pxFile" accept="image/*" hidden>' +
      '<div class="px-stats">' +
        '<div class="px-stat"><i>输出规格</i><b data-px-spec>' + esc(spec) + '</b></div>' +
        '<div class="px-stat"><i>调色板</i><b data-px-palette>' + (p.palette ? p.palette.length : p.colors) + ' 色 · ' + PX_DITHER[p.dither] + '抖动</b></div>' +
        '<div class="px-stat"><i>自动去背</i><b data-px-knocklabel>' + (p.knock ? '已开启' : '已关闭') + '</b></div>' +
      '</div>' +
    '</div>' +
    '<aside class="px-panel">' +
      '<div class="px-panel-head"><b>像素参数</b><span>LIVE</span></div>' +
      '<div class="px-ctrl px-ctrl-first">' +
        '<div class="px-ctrl-top"><label>一键预设</label></div>' +
        '<div class="px-presets">' + presetBtns + '</div>' +
      '</div>' +
      pxCtrl('size', '像素密度', p.size, 24, 320, 8, 'px', '越高细节越多；160 上下最接近 AI 像素画') +
      pxCtrl('colors', '色数', p.colors, 4, 64, 2, '色', '调色板颜色数量，越少越复古') +
      '<div class="px-ctrl">' +
        '<div class="px-ctrl-top"><label>抖动</label><b data-px-val="dither">' + PX_DITHER[p.dither] + '</b></div>' +
        '<div class="px-seg px-seg-3">' + ditherBtns + '</div>' +
        '<div class="px-ctrl-hint">默认「无」最像手绘像素画；渐变多的画面可选「扩散」</div>' +
      '</div>' +
      pxCtrl('punch', '鲜艳度', p.punch, 0, 100, 1, '%', '提升对比与饱和，像素画更精神') +
      pxCtrl('tol', '去背容差', p.tol, 0, 100, 1, '%', '四边背景色相近多少就判为透明') +
      '<div class="px-ctrl">' +
        '<div class="px-ctrl-top"><label>导出倍数</label><b data-px-val="scale">' + p.scale + '×</b></div>' +
        '<div class="px-seg">' + [1, 2, 4, 8].map(function (s) {
          return '<button class="' + (p.scale === s ? 'on' : '') + '" data-pxscale="' + s + '">' + s + '×</button>';
        }).join('') + '</div>' +
        '<div class="px-ctrl-hint">整数倍放大，边缘不糊，拖进剪辑软件即可用</div>' +
      '</div>' +
      '<div class="px-ctrl">' +
        '<div class="px-ctrl-top"><label>自动去背</label>' +
          '<button class="px-switch' + (p.knock ? ' on' : '') + '" data-pxknock role="switch" aria-checked="' + (p.knock ? 'true' : 'false') + '"><i></i></button>' +
        '</div>' +
        '<div class="px-ctrl-hint">从画面四边泛洪抠图，主体内部的同色区域会保留</div>' +
      '</div>' +
      '<div class="px-ctrl">' +
        '<div class="px-ctrl-top"><label>黑色描边</label>' +
          '<button class="px-switch' + (p.outline ? ' on' : '') + '" data-pxoutline role="switch" aria-checked="' + (p.outline ? 'true' : 'false') + '"><i></i></button>' +
        '</div>' +
        '<div class="px-ctrl-hint">在剪影外围描 1 像素深色边，更接近游戏精灵</div>' +
      '</div>' +
      '<div class="px-actions">' +
        '<button class="px-cta" data-px-down' + (p.out ? '' : ' disabled') + '>下载透明 PNG <span>↓</span></button>' +
        '<button class="btn" data-px-reset>恢复默认参数</button>' +
      '</div>' +
      '<div class="px-tip">导出的 PNG 带 alpha 通道，放进 Premiere / 剪映 / AE 就是透明图层。</div>' +
    '</aside>' +
  '</div>';
}

function pxLoadUrl(url, name) {
  const img = new Image();
  img.onload = function () {
    st.pixel.img = img;
    st.pixel.src = url;
    st.pixel.name = name || '图片';
    st.pixel.out = null;
    st.pixel.sigSrc = '';
    renderView(true);
  };
  img.onerror = function () { toast('图片读取失败', 'err'); };
  img.src = url;
}

function pxLoadFile(file) {
  if (!file) return;
  if (!/^image\//.test(file.type || '')) { toast('请选择图片文件', 'err'); return; }
  const reader = new FileReader();
  reader.onload = function () { pxLoadUrl(String(reader.result), file.name); };
  reader.onerror = function () { toast('图片读取失败', 'err'); };
  reader.readAsDataURL(file);
}

/* 边界泛洪去背：四边像素的中位色作为背景色，容差内连通的区域变透明 */
function pxKnock(src, w, h, tol) {
  const out = new Uint8ClampedArray(src);
  const rs = [], gs = [], bs = [];
  function pull(x, y) {
    const i = (y * w + x) * 4;
    if (src[i + 3] < 200) return;
    rs.push(src[i]); gs.push(src[i + 1]); bs.push(src[i + 2]);
  }
  for (let x = 0; x < w; x++) { pull(x, 0); pull(x, h - 1); }
  for (let y = 0; y < h; y++) { pull(0, y); pull(w - 1, y); }
  if (!rs.length) return out;

  const sortNum = function (a, b) { return a - b; };
  rs.sort(sortNum); gs.sort(sortNum); bs.sort(sortNum);
  const mid = rs.length >> 1;
  const br = rs[mid], bg = gs[mid], bb = bs[mid];
  const thr = Math.max(1, tol * 2.55);

  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qt = 0, qh = 0;

  function matches(x, y) {
    const i = (y * w + x) * 4;
    if (src[i + 3] < 40) return true;
    const dr = src[i] - br, dg = src[i + 1] - bg, db = src[i + 2] - bb;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= thr;
  }
  function visit(x, y) {
    const k = y * w + x;
    if (seen[k]) return;
    seen[k] = 1;
    if (!matches(x, y)) return;
    out[k * 4 + 3] = 0;
    queue[qt++] = k;
  }

  for (let x = 0; x < w; x++) { visit(x, 0); visit(x, h - 1); }
  for (let y = 0; y < h; y++) { visit(0, y); visit(w - 1, y); }

  while (qh < qt) {
    const k = queue[qh++];
    const cx = k % w, cy = (k / w) | 0;
    if (cx > 0) visit(cx - 1, cy);
    if (cx + 1 < w) visit(cx + 1, cy);
    if (cy > 0) visit(cx, cy - 1);
    if (cy + 1 < h) visit(cx, cy + 1);
  }
  return out;
}

/* 对比 + 饱和提升 + 亮度 S 曲线，让像素画的块面更有体积感 */
function pxPunch(r, g, b, amt) {
  if (amt <= 0) return [r, g, b];
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const sat = 1 + 0.62 * amt;
  const con = 1 + 0.50 * amt;
  let nr = (lum + (r - lum) * sat - 128) * con + 128;
  let ng = (lum + (g - lum) * sat - 128) * con + 128;
  let nb = (lum + (b - lum) * sat - 128) * con + 128;
  /* smoothstep 提亮亮部、压暗暗部，暗部更沉，块面更清楚 */
  const t = (0.299 * nr + 0.587 * ng + 0.114 * nb) / 255;
  const s = t * t * (3 - 2 * t) * 255;
  const d = (s - t * 255) * 0.34 * amt;
  return [nr + d, ng + d, nb + d];
}

/* 补洞：被主体包围的针孔填回邻近色，剪影不再漏底 */
function pxFillHoles(alive, flat, pw, ph) {
  const next = new Uint8Array(alive);
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const idx = y * pw + x;
      if (alive[idx]) continue;
      let cnt = 0, sr = 0, sg = 0, sb = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
          const ni = ny * pw + nx;
          if (!alive[ni]) continue;
          const no = ni * 4;
          sr += flat[no]; sg += flat[no + 1]; sb += flat[no + 2]; cnt++;
        }
      }
      if (cnt >= 6) {
        const o = idx * 4;
        flat[o] = sr / cnt; flat[o + 1] = sg / cnt; flat[o + 2] = sb / cnt; flat[o + 3] = 255;
        next[idx] = 1;
      }
    }
  }
  alive.set(next);
}

/* 去孤立噪点：四周几乎没有同伴的零散像素剪掉，边缘更干净 */
function pxDespeckle(alive, cov, pw, ph) {
  const kill = [];
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const idx = y * pw + x;
      if (!alive[idx]) continue;
      let cnt = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
          if (alive[ny * pw + nx]) cnt++;
        }
      }
      if (cnt === 0 || (cnt === 1 && cov[idx] < 180)) kill.push(idx);
    }
  }
  for (let i = 0; i < kill.length; i++) alive[kill[i]] = 0;
}

/* 去碎片：按连通块面积剪掉细小残渣（背景纹理、墨点），剪影只留主体 */
function pxDropIslands(alive, pw, ph) {
  const seen = new Uint8Array(pw * ph);
  const comp = new Int32Array(pw * ph);
  const stack = new Int32Array(pw * ph);
  const total = pw * ph;
  const parts = [];
  for (let i = 0; i < total; i++) {
    if (!alive[i] || seen[i]) continue;
    let sp = 0, cnt = 0;
    stack[sp++] = i;
    seen[i] = 1;
    while (sp) {
      const k = stack[--sp];
      comp[k] = parts.length;
      cnt++;
      const x = k % pw, y = (k / pw) | 0;
      if (x > 0 && alive[k - 1] && !seen[k - 1]) { seen[k - 1] = 1; stack[sp++] = k - 1; }
      if (x + 1 < pw && alive[k + 1] && !seen[k + 1]) { seen[k + 1] = 1; stack[sp++] = k + 1; }
      if (y > 0 && alive[k - pw] && !seen[k - pw]) { seen[k - pw] = 1; stack[sp++] = k - pw; }
      if (y + 1 < ph && alive[k + pw] && !seen[k + pw]) { seen[k + pw] = 1; stack[sp++] = k + pw; }
    }
    parts.push(cnt);
  }
  if (parts.length <= 1) return;
  let big = 0;
  for (let i = 1; i < parts.length; i++) if (parts[i] > parts[big]) big = i;
  /* 面积门槛：主体的 0.4%，至少 8 像素 */
  const minArea = Math.max(8, Math.round(parts[big] * 0.004));
  const drop = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    if (i !== big && parts[i] < minArea) drop[i] = 1;
  }
  for (let i = 0; i < total; i++) {
    if (alive[i] && drop[comp[i]]) alive[i] = 0;
  }
}

/* 边缘保持平滑：只在颜色相近的邻居间取均值，抹掉零散色斑但保住硬边 */
function pxSmooth(src, alive, pw, ph, thr) {
  const out = new Uint8Array(src.length);
  out.set(src);
  const t2 = thr * thr;
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      const idx = y * pw + x;
      if (!alive[idx]) continue;
      const o = idx * 4;
      const r0 = src[o], g0 = src[o + 1], b0 = src[o + 2];
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
          const ni = ny * pw + nx;
          if (!alive[ni]) continue;
          const no = ni * 4;
          const dr = src[no] - r0, dg = src[no + 1] - g0, db = src[no + 2] - b0;
          if (dr * dr + dg * dg + db * db > t2) continue;
          sr += src[no]; sg += src[no + 1]; sb += src[no + 2]; n++;
        }
      }
      if (n > 1) {
        out[o] = sr / n; out[o + 1] = sg / n; out[o + 2] = sb / n;
      }
    }
  }
  return out;
}

/* 中位切分：从 5bit 用色直方图里提取 N 色调色板（更接近手工像素画的配色） */
function pxPalette(rgb, maxColors) {
  const n = rgb.length / 3;
  if (!n) return [[255, 255, 255]];

  const hist = new Map();
  for (let i = 0; i < n; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let h = hist.get(key);
    if (!h) { h = { r: 0, g: 0, b: 0, n: 0 }; hist.set(key, h); }
    h.r += r; h.g += g; h.b += b; h.n++;
  }

  function makeBox(cols) {
    let sr = 0, sg = 0, sb = 0, count = 0;
    let rmin = 255, rmax = 0, gmin = 255, gmax = 0, bmin = 255, bmax = 0;
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      const r = c.r / c.n, g = c.g / c.n, b = c.b / c.n;
      sr += c.r; sg += c.g; sb += c.b; count += c.n;
      if (r < rmin) rmin = r; if (r > rmax) rmax = r;
      if (g < gmin) gmin = g; if (g > gmax) gmax = g;
      if (b < bmin) bmin = b; if (b > bmax) bmax = b;
    }
    const ranges = [rmax - rmin, gmax - gmin, bmax - bmin];
    let axis = 0;
    if (ranges[1] > ranges[axis]) axis = 1;
    if (ranges[2] > ranges[axis]) axis = 2;
    return {
      cols: cols, count: count, axis: axis, range: ranges[axis],
      r: sr / count, g: sg / count, b: sb / count
    };
  }

  let boxes = [makeBox(Array.from(hist.values()))];
  const limit = Math.max(2, Math.min(64, maxColors));

  while (boxes.length < limit) {
    let bi = -1, best = -1;
    for (let i = 0; i < boxes.length; i++) {
      const bx = boxes[i];
      if (bx.cols.length < 2) continue;
      const score = bx.range * Math.sqrt(bx.count);
      if (score > best) { best = score; bi = i; }
    }
    if (bi < 0) break;

    const bx = boxes[bi];
    const ch = bx.axis === 0 ? 'r' : bx.axis === 1 ? 'g' : 'b';
    bx.cols.sort(function (a, b) {
      return (a[ch] / a.n) - (b[ch] / b.n);
    });
    let acc = 0, cut = 1;
    const half = bx.count / 2;
    for (let i = 0; i < bx.cols.length - 1; i++) {
      acc += bx.cols[i].n;
      if (acc >= half) { cut = i + 1; break; }
    }
    if (cut >= bx.cols.length) cut = bx.cols.length - 1;
    boxes.splice(bi, 1, makeBox(bx.cols.slice(0, cut)), makeBox(bx.cols.slice(cut)));
  }

  let pal = boxes.map(function (bx) {
    return [Math.round(bx.r), Math.round(bx.g), Math.round(bx.b)];
  });

  /* k-means 精修：把每个色向它所辖像素的真实均值收敛，配色更贴近画面 */
  const step = Math.max(1, Math.floor(n / 24000));
  const kr = new Float64Array(pal.length), kg = new Float64Array(pal.length),
    kb = new Float64Array(pal.length), kc = new Int32Array(pal.length);
  for (let it = 0; it < 3; it++) {
    kr.fill(0); kg.fill(0); kb.fill(0); kc.fill(0);
    for (let i = 0; i < n; i += step) {
      const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
      const ci = pxNearest(pal, r, g, b);
      kr[ci] += r; kg[ci] += g; kb[ci] += b; kc[ci]++;
    }
    for (let j = 0; j < pal.length; j++) {
      if (!kc[j]) continue;
      pal[j] = [Math.round(kr[j] / kc[j]), Math.round(kg[j] / kc[j]), Math.round(kb[j] / kc[j])];
    }
  }

  /* 去重：精修后可能有两色并到一处 */
  const uniq = [];
  for (let i = 0; i < pal.length; i++) {
    let dup = false;
    for (let j = 0; j < uniq.length; j++) {
      const dr = pal[i][0] - uniq[j][0], dg = pal[i][1] - uniq[j][1], db = pal[i][2] - uniq[j][2];
      if (dr * dr + dg * dg + db * db < 25) { dup = true; break; }
    }
    if (!dup) uniq.push(pal[i]);
  }
  return uniq.length ? uniq : pal;
}

const PX_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function pxNearest(pal, r, g, b) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < pal.length; i++) {
    const c = pal[i];
    const dr = r - c[0], dg = g - c[1], db = b - c[2];
    const d = dr * dr * 2 + dg * dg * 3 + db * db;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/* 去背后的高质量像素化：浏览器平滑降采样 → 调色板量化 → 抖动 → 描边 → 整数倍放大 */
function pxRender() {
  const p = st.pixel;
  const img = p.img;
  if (!img || !img.naturalWidth) return;

  const iw = img.naturalWidth, ih = img.naturalHeight;
  const pw = Math.max(24, Math.min(320, Math.round(p.size)));
  const ph = Math.max(1, Math.round(pw * ih / iw));

  // 1. 工作图：限制采样成本，并在较大分辨率上做去背
  const MAXW = 1280;
  const k = Math.min(1, MAXW / Math.max(iw, ih));
  const ww = Math.max(1, Math.round(iw * k));
  const wh = Math.max(1, Math.round(ih * k));

  const wc = document.createElement('canvas');
  wc.width = ww; wc.height = wh;
  const wctx = wc.getContext('2d', { willReadFrequently: true });
  wctx.clearRect(0, 0, ww, wh);
  wctx.drawImage(img, 0, 0, ww, wh);

  if (p.knock) {
    const data = pxKnock(wctx.getImageData(0, 0, ww, wh).data, ww, wh, p.tol);
    wctx.putImageData(new ImageData(data, ww, wh), 0, 0);
  }

  // 2. 网格化：平滑降采样，保留更多细节
  const grid = document.createElement('canvas');
  grid.width = pw; grid.height = ph;
  const gctx = grid.getContext('2d', { willReadFrequently: true });
  gctx.imageSmoothingEnabled = true;
  gctx.imageSmoothingQuality = 'high';
  gctx.clearRect(0, 0, pw, ph);
  gctx.drawImage(wc, 0, 0, pw, ph);
  const gd = gctx.getImageData(0, 0, pw, ph).data;

  // 3. 硬边剪影：按覆盖率二值化 → 补洞 → 去噪 → 边缘保持平滑 → 鲜艳度
  const alive = new Uint8Array(pw * ph);
  const flat = new Uint8Array(pw * ph * 4);
  const cov = new Uint8Array(pw * ph);
  const punchAmt = Math.max(0, Math.min(1, p.punch / 100));

  for (let i = 0, o = 0; i < gd.length; i += 4, o += 4) {
    cov[o >> 2] = gd[i + 3];
    if (gd[i + 3] < 110) continue;
    alive[o >> 2] = 1;
    const c = pxPunch(gd[i], gd[i + 1], gd[i + 2], punchAmt);
    flat[o] = c[0] < 0 ? 0 : c[0] > 255 ? 255 : c[0];
    flat[o + 1] = c[1] < 0 ? 0 : c[1] > 255 ? 255 : c[1];
    flat[o + 2] = c[2] < 0 ? 0 : c[2] > 255 ? 255 : c[2];
    flat[o + 3] = 255;
  }

  pxFillHoles(alive, flat, pw, ph);
  pxDespeckle(alive, cov, pw, ph);
  if (p.knock) pxDropIslands(alive, pw, ph);
  /* 两遍平滑：相近色块并成整块，画面更「平涂」，接近手绘像素画 */
  flat.set(pxSmooth(pxSmooth(flat, alive, pw, ph, 26), alive, pw, ph, 26));

  const rgbSamples = [];
  for (let idx = 0; idx < pw * ph; idx++) {
    if (!alive[idx]) continue;
    const o = idx * 4;
    rgbSamples.push(flat[o], flat[o + 1], flat[o + 2]);
  }

  // 4. 调色板 + 抖动量化
  const pal = pxPalette(rgbSamples, p.colors);

  let stepAvg = 40;
  if (pal.length > 1) {
    let sum = 0, cnt = 0;
    for (let i = 0; i < pal.length && cnt < 24; i++) {
      let m = Infinity;
      for (let j = 0; j < pal.length; j++) {
        if (i === j) continue;
        const dr = pal[i][0] - pal[j][0], dg = pal[i][1] - pal[j][1], db = pal[i][2] - pal[j][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < m) m = d;
      }
      sum += Math.sqrt(m); cnt++;
    }
    stepAvg = Math.max(6, sum / Math.max(1, cnt));
  }

  const out = new Uint8ClampedArray(pw * ph * 4);

  if (p.dither === 'fs') {
    /* 误差只做六成强度并限幅：既能接住渐变色阶，又不会把平色区打成雪花 */
    const STR = 0.6, CAP = 34;
    const errR = new Float32Array(pw * ph + pw + 2);
    const errG = new Float32Array(pw * ph + pw + 2);
    const errB = new Float32Array(pw * ph + pw + 2);
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const idx = y * pw + x;
        const o = idx * 4;
        if (!alive[idx]) continue;
        const er = errR[idx] > CAP ? CAP : errR[idx] < -CAP ? -CAP : errR[idx];
        const eg = errG[idx] > CAP ? CAP : errG[idx] < -CAP ? -CAP : errG[idx];
        const eb = errB[idx] > CAP ? CAP : errB[idx] < -CAP ? -CAP : errB[idx];
        const r = flat[o] + er;
        const g = flat[o + 1] + eg;
        const b = flat[o + 2] + eb;
        const ci = pxNearest(pal, r, g, b);
        const pc = pal[ci];
        out[o] = pc[0]; out[o + 1] = pc[1]; out[o + 2] = pc[2]; out[o + 3] = 255;
        const dr = (r - pc[0]) * STR, dg = (g - pc[1]) * STR, db = (b - pc[2]) * STR;
        const i1 = idx + 1, i2 = idx + pw - 1, i3 = idx + pw, i4 = idx + pw + 1;
        errR[i1] += dr * 7 / 16; errG[i1] += dg * 7 / 16; errB[i1] += db * 7 / 16;
        if (x > 0) {
          errR[i2] += dr * 3 / 16; errG[i2] += dg * 3 / 16; errB[i2] += db * 3 / 16;
        }
        errR[i3] += dr * 5 / 16; errG[i3] += dg * 5 / 16; errB[i3] += db * 5 / 16;
        errR[i4] += dr * 1 / 16; errG[i4] += dg * 1 / 16; errB[i4] += db * 1 / 16;
      }
    }
  } else {
    const useOrder = p.dither === 'order';
    const amp = stepAvg * 0.5;
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const idx = y * pw + x;
        if (!alive[idx]) continue;
        const o = idx * 4;
        const off = useOrder ? (PX_BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.47) * amp : 0;
        const ci = pxNearest(pal, flat[o] + off, flat[o + 1] + off, flat[o + 2] + off);
        const pc = pal[ci];
        out[o] = pc[0]; out[o + 1] = pc[1]; out[o + 2] = pc[2]; out[o + 3] = 255;
      }
    }
  }

  // 5. 描边：剪影外圈补 1 像素深色边
  if (p.outline) {
    const edge = new Uint8Array(pw * ph);
    let any = false;
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const idx = y * pw + x;
        if (!alive[idx]) continue;
        if ((x > 0 && !alive[idx - 1]) || (x + 1 < pw && !alive[idx + 1]) ||
            (y > 0 && !alive[idx - pw]) || (y + 1 < ph && !alive[idx + pw])) {
          edge[idx] = 1; any = true;
        }
      }
    }
    if (any) {
      for (let y = 0; y < ph; y++) {
        for (let x = 0; x < pw; x++) {
          const idx = y * pw + x;
          if (alive[idx]) continue;
          if ((x > 0 && edge[idx - 1]) || (x + 1 < pw && edge[idx + 1]) ||
              (y > 0 && edge[idx - pw]) || (y + 1 < ph && edge[idx + pw])) {
            const o = idx * 4;
            out[o] = 16; out[o + 1] = 14; out[o + 2] = 20; out[o + 3] = 255;
          }
        }
      }
    }
  }

  // 6. 整数倍放大（最近邻，边缘不糊）
  const small = document.createElement('canvas');
  small.width = pw; small.height = ph;
  small.getContext('2d').putImageData(new ImageData(out, pw, ph), 0, 0);

  const scale = Math.max(1, Math.round(p.scale));
  const big = document.createElement('canvas');
  big.width = pw * scale; big.height = ph * scale;
  const bctx = big.getContext('2d');
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(small, 0, 0, big.width, big.height);

  p.out = big;
  p.palette = pal;
  p.pw = pw; p.ph = ph;
  p.outW = big.width; p.outH = big.height;
}

function pxApply() {
  const p = st.pixel;
  const cv = document.getElementById('pxCanvas');
  if (!cv) return;
  if (!p.out) { cv.width = 1; cv.height = 1; return; }
  cv.width = p.outW;
  cv.height = p.outH;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  c.imageSmoothingEnabled = false;
  c.drawImage(p.out, 0, 0);
}

function pxRefresh() {
  const p = st.pixel;
  if (!p.img) return;
  const cfg = [p.size, p.colors, p.punch, p.dither, p.outline ? 1 : 0, p.tol, p.knock ? 1 : 0, p.scale].join('|');
  if (!p.out || p.sigSrc !== p.src || p.sigCfg !== cfg) {
    pxRender();
    p.sigSrc = p.src;
    p.sigCfg = cfg;
  }
  pxApply();

  const spec = p.outW ? (p.pw + ' × ' + p.ph + ' → ' + p.outW + ' × ' + p.outH + ' px') : '等待图片';
  const specEl = document.querySelector('[data-px-spec]');
  if (specEl) specEl.textContent = spec;
  const palEl = document.querySelector('[data-px-palette]');
  if (palEl) palEl.textContent = (p.palette ? p.palette.length : p.colors) + ' 色 · ' + PX_DITHER[p.dither] + '抖动';
  document.querySelectorAll('[data-px-down]').forEach(function (b) { b.disabled = !p.out; });
}

let pxTimer = null;
function pxQueue() {
  clearTimeout(pxTimer);
  pxTimer = setTimeout(pxRefresh, 140);
}

function pxDownload() {
  const p = st.pixel;
  if (!p.out || !p.out.toDataURL) { toast('先选一张图片', 'err'); return; }
  const base = String(p.name || 'pixel').replace(/\.[^.]+$/, '');
  const a = document.createElement('a');
  a.download = base + '-pixel-' + p.outW + 'x' + p.outH + '.png';
  a.href = p.out.toDataURL('image/png');
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('已导出 ' + p.outW + ' × ' + p.outH + ' 透明 PNG', 'ok');
}

function mountPixel() {
  const drop = document.getElementById('pxDrop');
  if (!drop) return;
  const p = st.pixel;

  document.querySelectorAll('[data-px-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const f = document.getElementById('pxFile');
      if (f) f.click();
    });
  });

  const file = document.getElementById('pxFile');
  if (file) {
    file.addEventListener('change', function () {
      if (file.files && file.files[0]) pxLoadFile(file.files[0]);
    });
  }

  const demo = document.querySelector('[data-px-demo]');
  if (demo) demo.addEventListener('click', function () {
    pxLoadUrl('assets/avatar.jpg', '示例 · 人物插画');
  });

  document.querySelectorAll('[data-px-down]').forEach(function (btn) {
    btn.addEventListener('click', pxDownload);
  });

  const clear = document.querySelector('[data-px-clear]');
  if (clear) clear.addEventListener('click', function () {
    st.pixel = Object.assign({ src: '', name: '', img: null, out: null, pw: 0, ph: 0, outW: 0, outH: 0, sigSrc: '', sigCfg: '' }, PX_DEFAULT);
    renderView(true);
  });

  document.querySelectorAll('[data-px]').forEach(function (el) {
    el.addEventListener('input', function () {
      st.pixel[el.dataset.px] = Number(el.value);
      const label = document.querySelector('[data-px-val="' + el.dataset.px + '"]');
      if (label) label.textContent = el.value + (el.dataset.unit ? ' ' + el.dataset.unit : '');
      pxQueue();
    });
  });

  document.querySelectorAll('[data-pxscale]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      st.pixel.scale = Number(btn.dataset.pxscale);
      document.querySelectorAll('[data-pxscale]').forEach(function (b) {
        b.classList.toggle('on', b === btn);
      });
      const label = document.querySelector('[data-px-val="scale"]');
      if (label) label.textContent = st.pixel.scale + '×';
      pxQueue();
    });
  });

  const kn = document.querySelector('[data-pxknock]');
  if (kn) kn.addEventListener('click', function () {
    st.pixel.knock = !st.pixel.knock;
    kn.classList.toggle('on', st.pixel.knock);
    kn.setAttribute('aria-checked', st.pixel.knock ? 'true' : 'false');
    const label = document.querySelector('[data-px-knocklabel]');
    if (label) label.textContent = st.pixel.knock ? '已开启' : '已关闭';
    pxQueue();
  });

  document.querySelectorAll('[data-pxdither]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      st.pixel.dither = btn.dataset.pxdither;
      st.pixel.preset = '';
      document.querySelectorAll('[data-pxdither]').forEach(function (b) { b.classList.toggle('on', b === btn); });
      document.querySelectorAll('[data-pxpreset]').forEach(function (b) { b.classList.remove('on'); });
      const label = document.querySelector('[data-px-val="dither"]');
      if (label) label.textContent = PX_DITHER[st.pixel.dither];
      pxQueue();
    });
  });

  const ol = document.querySelector('[data-pxoutline]');
  if (ol) ol.addEventListener('click', function () {
    st.pixel.outline = !st.pixel.outline;
    ol.classList.toggle('on', st.pixel.outline);
    ol.setAttribute('aria-checked', st.pixel.outline ? 'true' : 'false');
    pxQueue();
  });

  document.querySelectorAll('[data-pxpreset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const preset = PX_PRESETS.filter(function (k) { return k.key === btn.dataset.pxpreset; })[0];
      if (!preset) return;
      const keep = { src: st.pixel.src, name: st.pixel.name, img: st.pixel.img };
      st.pixel = Object.assign({}, PX_DEFAULT, preset, keep, {
        out: null, pw: 0, ph: 0, outW: 0, outH: 0, sigSrc: '', sigCfg: ''
      });
      renderView(true);
      toast('已套用「' + preset.name + '」', 'ok');
    });
  });

  const reset = document.querySelector('[data-px-reset]');
  if (reset) reset.addEventListener('click', function () {
    const img = st.pixel.img, src = st.pixel.src, name = st.pixel.name;
    st.pixel = Object.assign({ img: img, src: src, name: name, out: null, pw: 0, ph: 0, outW: 0, outH: 0, sigSrc: '', sigCfg: '' }, PX_DEFAULT);
    renderView(true);
    toast('参数已恢复默认', 'ok');
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      drop.classList.add('drag');
    });
  });
  ['dragleave', 'dragend'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      if (ev === 'dragleave' && drop.contains(e.relatedTarget)) return;
      drop.classList.remove('drag');
    });
  });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    drop.classList.remove('drag');
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) pxLoadFile(dt.files[0]);
  });

  if (p.src) pxRefresh();
}

/* ============================================================
   画板 · 画笔 / 橡皮 / 直线 / 矩形 / 椭圆，导出 PNG 或 JPG
   ============================================================ */

const DRAW_TOOLS = [
  { k: 'pen', n: '画笔' },
  { k: 'eraser', n: '橡皮' },
  { k: 'line', n: '直线' },
  { k: 'rect', n: '矩形' },
  { k: 'ellipse', n: '椭圆' }
];

const DRAW_PALETTE = ['#1f2024', '#ff6a2f', '#e5484d', '#f2b74a', '#22a06b', '#3b82f6', '#8b5cf6', '#8a7f72'];

/* 笔画点全部用 0~1 的归一化坐标，窗口缩放后仍能按原比例重绘 */
const DRAW = {
  tool: 'pen', color: '#1f2024', size: 3,
  strokes: [], redo: [], live: null
};

let drawRO = null;
let drawRaf = 0;

function renderDrawPage() {
  const tools = DRAW_TOOLS.map(function (t) {
    return '<button class="dr-tool' + (DRAW.tool === t.k ? ' on' : '') + '" data-drawtool="' + t.k + '" ' +
      'title="' + t.n + '" aria-label="' + t.n + '">' + ic(t.k, 'ico-14') + '</button>';
  }).join('');

  const colors = DRAW_PALETTE.map(function (c) {
    return '<button class="dr-color' + (DRAW.color.toLowerCase() === c ? ' on' : '') + '" data-drawcolor="' + c + '" ' +
      'style="background:' + c + '" aria-label="颜色 ' + c + '"></button>';
  }).join('');

  return '<div class="dr-wrap">' +
    '<div class="dr-top">' +
      '<div class="dr-tools">' + tools + '</div>' +
      '<div class="dr-colors">' + colors +
        '<input type="color" class="dr-color-custom" id="drawColorInput" value="' + esc(DRAW.color) + '" title="自选颜色" aria-label="自选颜色">' +
      '</div>' +
      '<div class="dr-size">' +
        '<label for="drawSize">笔粗细</label>' +
        '<input type="range" id="drawSize" min="1" max="24" step="1" value="' + DRAW.size + '" data-drawsize>' +
        '<b data-drawsize-val>' + DRAW.size + '</b>' +
      '</div>' +
      '<div class="dr-ops">' +
        '<button class="btn btn-sm" data-drawact="undo" title="撤销"' + (DRAW.strokes.length ? '' : ' disabled') + '>' + ic('undo', 'ico-14') + '</button>' +
        '<button class="btn btn-sm" data-drawact="redo" title="重做"' + (DRAW.redo.length ? '' : ' disabled') + '>' + ic('redo', 'ico-14') + '</button>' +
        '<button class="btn btn-sm btn-ghost" data-drawact="clear" title="清空画布"' + (DRAW.strokes.length ? '' : ' disabled') + '>' + ic('trash', 'ico-14') + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="dr-stage' + (DRAW.strokes.length ? '' : ' is-empty') + '">' +
      '<canvas id="drawCanvas"></canvas>' +
      '<div class="dr-empty">' +
        '<div class="dr-empty-ico">' + ic('palette') + '</div>' +
        '<strong>在这儿随手画</strong>' +
        '<span>按住鼠标或手指拖动即可 · 支持撤回与重画</span>' +
      '</div>' +
    '</div>' +
    '<div class="dr-bottom">' +
      '<div class="dr-stat">笔画 <b data-draw-count>' + DRAW.strokes.length + '</b> · 画布 <b data-draw-size>—</b></div>' +
      '<div class="dr-export">' +
        '<button class="dr-save" data-drawact="png"' + (DRAW.strokes.length ? '' : ' disabled') + '>' + ic('download', 'ico-14') + '<span>保存 PNG</span></button>' +
        '<button class="btn" data-drawact="jpg"' + (DRAW.strokes.length ? '' : ' disabled') + '><span>保存 JPG</span></button>' +
      '</div>' +
    '</div>' +
    '<div class="dr-tip">PNG 背景透明，叠在视频或别的画面上直接能用；JPG 自动填白底，发给别人不会出现黑底。画布跟随窗口自适应，导出为高倍清晰度。</div>' +
  '</div>';
}

function drawPoint(e, canvas) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / (r.width || 1),
    y: (e.clientY - r.top) / (r.height || 1)
  };
}

function drawStroke(ctx, s, w, h) {
  const pts = s.points.map(function (p) { return { x: p.x * w, y: p.y * h }; });
  if (!pts.length) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = s.size;

  if (s.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
  }

  if (s.tool === 'pen' || s.tool === 'eraser') {
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, Math.max(1, s.size / 2), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
  } else if (pts.length > 1) {
    const a = pts[0], b = pts[pts.length - 1];
    if (s.tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    } else if (s.tool === 'rect') {
      ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    } else if (s.tool === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPaint() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const bw = Math.round(w * dpr), bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  DRAW.strokes.forEach(function (s) { drawStroke(ctx, s, w, h); });
  if (DRAW.live) drawStroke(ctx, DRAW.live, w, h);
  drawSync();
}

function drawRequestPaint() {
  if (drawRaf) return;
  drawRaf = window.requestAnimationFrame(function () {
    drawRaf = 0;
    drawPaint();
  });
}

function drawSync() {
  const n = DRAW.strokes.length;
  const stage = document.querySelector('.dr-stage');
  if (stage) stage.classList.toggle('is-empty', n === 0 && !DRAW.live);
  const count = document.querySelector('[data-draw-count]');
  if (count) count.textContent = n;
  const canvas = document.getElementById('drawCanvas');
  const size = document.querySelector('[data-draw-size]');
  if (size && canvas) size.textContent = canvas.clientWidth + ' × ' + canvas.clientHeight;
  document.querySelectorAll('[data-drawact="undo"]').forEach(function (b) { b.disabled = !n; });
  document.querySelectorAll('[data-drawact="redo"]').forEach(function (b) { b.disabled = !DRAW.redo.length; });
  document.querySelectorAll('[data-drawact="clear"]').forEach(function (b) { b.disabled = !n; });
  document.querySelectorAll('[data-drawact="png"],[data-drawact="jpg"]').forEach(function (b) { b.disabled = !n; });
}

function drawUndo() {
  if (!DRAW.strokes.length) return;
  DRAW.redo.push(DRAW.strokes.pop());
  drawPaint();
}

function drawRedo() {
  if (!DRAW.redo.length) return;
  DRAW.strokes.push(DRAW.redo.pop());
  drawPaint();
}

function drawClear() {
  if (!DRAW.strokes.length) return;
  DRAW.strokes.length = 0;
  DRAW.redo.length = 0;
  DRAW.live = null;
  drawPaint();
  toast('画布已清空', 'ok');
}

function drawExport(kind) {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas || !DRAW.strokes.length) { toast('先画几笔再保存', 'err'); return; }

  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  if (kind === 'jpg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.drawImage(canvas, 0, 0);

  const d = new Date();
  const stamp = fmtDate(d).replace(/-/g, '') + '-' + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
  const a = document.createElement('a');
  a.download = '画板-' + stamp + (kind === 'jpg' ? '.jpg' : '.png');
  a.href = out.toDataURL(kind === 'jpg' ? 'image/jpeg' : 'image/png', kind === 'jpg' ? 0.92 : undefined);
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('已保存 ' + a.download, 'ok');
}

function mountDraw() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;

  document.querySelectorAll('[data-drawtool]').forEach(function (b) {
    b.addEventListener('click', function () {
      DRAW.tool = b.dataset.drawtool;
      document.querySelectorAll('[data-drawtool]').forEach(function (x) { x.classList.toggle('on', x === b); });
      canvas.classList.toggle('is-eraser', DRAW.tool === 'eraser');
    });
  });

  document.querySelectorAll('[data-drawcolor]').forEach(function (b) {
    b.addEventListener('click', function () {
      DRAW.color = b.dataset.drawcolor;
      document.querySelectorAll('[data-drawcolor]').forEach(function (x) { x.classList.toggle('on', x === b); });
      const ci = document.getElementById('drawColorInput');
      if (ci) ci.value = DRAW.color;
      // 选了颜色通常是要画：自动切回画笔
      if (DRAW.tool === 'eraser') {
        DRAW.tool = 'pen';
        document.querySelectorAll('[data-drawtool]').forEach(function (x) { x.classList.toggle('on', x.dataset.drawtool === 'pen'); });
        canvas.classList.remove('is-eraser');
      }
    });
  });

  const ci = document.getElementById('drawColorInput');
  if (ci) ci.addEventListener('input', function () {
    DRAW.color = ci.value;
    document.querySelectorAll('[data-drawcolor]').forEach(function (x) { x.classList.remove('on'); });
  });

  const size = document.querySelector('[data-drawsize]');
  if (size) size.addEventListener('input', function () {
    DRAW.size = Number(size.value);
    const label = document.querySelector('[data-drawsize-val]');
    if (label) label.textContent = size.value;
  });

  document.querySelectorAll('[data-drawact]').forEach(function (b) {
    b.addEventListener('click', function () {
      const a = b.dataset.drawact;
      if (a === 'undo') drawUndo();
      else if (a === 'redo') drawRedo();
      else if (a === 'clear') drawClear();
      else drawExport(a);
    });
  });

  if (DRAW.tool === 'eraser') canvas.classList.add('is-eraser');

  canvas.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    DRAW.live = {
      tool: DRAW.tool, color: DRAW.color, size: DRAW.size,
      points: [drawPoint(e, canvas)]
    };
    drawPaint();
  });

  canvas.addEventListener('pointermove', function (e) {
    const live = DRAW.live;
    if (!live) return;
    e.preventDefault();
    const p = drawPoint(e, canvas);
    if (live.tool === 'pen' || live.tool === 'eraser') {
      const last = live.points[live.points.length - 1];
      if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 0.002) return;
      live.points.push(p);
    } else {
      live.points = [live.points[0], p];
    }
    drawRequestPaint();
  });

  function endStroke() {
    const live = DRAW.live;
    if (!live) return;
    DRAW.live = null;
    const isBrush = live.tool === 'pen' || live.tool === 'eraser';
    const enough = isBrush ? live.points.length > 0 : live.points.length > 1;
    if (enough) {
      DRAW.strokes.push(live);
      DRAW.redo.length = 0;
    }
    drawPaint();
  }
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('pointerleave', function (e) {
    // 鼠标没按住就离开，不需要结束笔画；按住拖出画布则让它继续
    if (e.pointerType === 'mouse' && e.buttons === 0) endStroke();
  });

  drawPaint();
  if (drawRO) drawRO.disconnect();
  if (window.ResizeObserver) {
    drawRO = new ResizeObserver(function () { drawPaint(); });
    drawRO.observe(canvas);
  }
}

/* ---------------- 视图渲染（一页到底，各区块纵向串联） ---------------- */
/* 两个大类：create 创作线 / tool 工具箱。区块按大类分组，一次只渲染一组 */
const SECTIONS = [
  { key: 'radar', cat: 'create', title: '今日雷达', desc: '每天 10:20 抓一遍 · 一天存一份 · 挑一条直接开稿' },
  { key: 'koubo', cat: 'create', title: '口播工坊', desc: '自己写 · 自己改 · 定稿得你自己点' },
  { key: 'wenan', cat: 'create', title: '成品文案', desc: '存完整成片 · 分几段、每段几秒、画面拍什么' },
  { key: 'report', cat: 'create', title: '战报', desc: '每月视频数据 · 照老板的表搬上来' },
  { key: 'tasks', cat: 'tool', title: '任务与日历', desc: '飞书任务月历 · 按日期筛选查看' },
  { key: 'library', cat: 'tool', title: '图书馆', desc: '藏书、书摘与思考' },
  { key: 'pixel', cat: 'tool', title: '像素工坊', desc: '图片转像素风 · 自动去背导出透明 PNG' },
  { key: 'draw', cat: 'tool', title: '画板', desc: '随手画 · 一键保存 PNG / JPG' }
];

const CATS = {
  create: { name: '创作线', desc: '找选题 · 拍口播 · 看战报' },
  tool:   { name: '工具箱', desc: '日历 · 图书馆 · 像素 · 画板' }
};

function secOf(key) {
  return SECTIONS.filter(function (s) { return s.key === key; })[0] || null;
}

function secHead(s) {
  return '<div class="sec-head">' +
    '<div class="sec-head-copy">' +
      '<div class="sec-kicker"><b>' + s.no + '</b> · SECTION</div>' +
      '<div class="sec-h-title">' + esc(s.title) + '</div>' +
      '<div class="sec-desc">' + esc(s.desc) + '</div>' +
    '</div>' +
    '<div class="sec-no" aria-hidden="true">' + s.no + '</div>' +
  '</div>';
}

// 最近一次导航目标：用于在随后的异步重渲染中保持滚动位置
let navGuard = null;

function renderView(keepScroll) {
  const view = document.getElementById('view');
  if (!view) return;
  const y = window.scrollY;

  const list = SECTIONS.filter(function (s) { return s.cat === st.group; });

  const bodyOf = function (s) {
    if (s.key === 'tasks') return renderTasksPage();
    if (s.key === 'library') return renderLibraryPage();
    if (s.key === 'koubo') return renderKouboPage();
    if (s.key === 'wenan') return renderWenanPage();
    if (s.key === 'pixel') return renderPixelPage();
    if (s.key === 'draw') return renderDrawPage();
    if (s.key === 'report') return renderReportPage();
    if (s.key === 'radar') return renderRadarPage();
    return '';
  };

  let html;
  if (st.tab === 'home') {
    html = renderHome();
  } else {
    const s = secOf(st.tab) || list[0];
    html = '<section class="page-sec" id="sec-' + s.key + '">' +
      secHead({ no: '01', title: s.title, desc: s.desc }) + bodyOf(s) + '</section>';
  }

  rwStop();
  view.innerHTML = html;

  if (keepScroll) {
    // 导航后紧接着有一次异步重渲染（数据加载）：此时旧 y 是滚动途中的位置，
    // 直接回滚会打断滚动动画，改为对准目标区块。
    const g = navGuard;
    if (g && Date.now() - g.at < 1500) {
      navGuard = null;
      if (g.key === 'home') {
        window.scrollTo(0, 0);
      } else {
        const el = document.getElementById('sec-' + g.key);
        window.scrollTo(0, el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - 76) : y);
      }
    } else {
      window.scrollTo(0, y);
    }
  }

  // 首页跑道动画 + 像素工坊画布 + 画板，都在重建 DOM 后重新挂载
  mountRunway();
  mountPixel();
  mountDraw();
  mountReport();
  mountRadar();
  mountKoubo();
  mountWenan();

  // 懒加载：图书馆 / 作品数据按需请求
  if (st.load.library === 'idle') loadLibrary();
  if (st.load.report === 'idle') loadReport();
  if (st.load.radar === 'idle') loadRadar();
  if (st.load.drafts === 'idle') loadDrafts();
  if (st.load.wenan === 'idle') loadWenan();

  // 重排后按真实滚动位置校正侧栏高亮
  syncActiveSection();
}

function updateChrome() {
  const cat = CATS[st.group] || CATS.create;
  const page = PAGES[st.tab];
  const isHome = st.tab === 'home' || !page;
  document.getElementById('pageTitle').innerHTML = isHome
    ? '<em>Workbench</em><span>个人工作台</span>'
    : '<em>' + esc(cat.name) + '</em><span>' + esc(page.title) + '</span>';
  document.getElementById('pageDesc').textContent = isHome ? cat.desc : page.desc;

  const actions = document.getElementById('pageActions');
  actions.innerHTML = '<button class="btn btn-sm" data-action="refresh"' + (st.load.feishu === 'loading' ? ' disabled' : '') + '>' +
    ic('refresh', 'ico-14') + '<span>刷新数据</span></button>';

  const nav = document.getElementById('sideNav');
  if (nav) nav.dataset.cat = st.group;
  document.querySelectorAll('#sideSwitch .sw-btn').forEach(function (b) {
    const on = b.dataset.cat === st.group;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });

  document.querySelectorAll('#sideNav .nav-item').forEach(function (el) {
    el.classList.toggle('active', el.dataset.nav === st.tab);
  });

  const navTask = document.getElementById('navTaskCount');
  if (navTask) navTask.textContent = st.feishu ? feishuInfo().total : '—';
  const navLib = document.getElementById('navLibCount');
  if (navLib) navLib.textContent = st.library ? ((st.library.books || []).length) : '—';
  const sideUpd = document.getElementById('sideUpdated');
  if (sideUpd) sideUpd.textContent = (st.feishu && st.feishu.updated_at) ? ('同步于 ' + st.feishu.updated_at) : '尚未同步';
}

/* ---------------- 弹窗 ---------------- */
function openModal(opt) {
  const root = document.getElementById('modalRoot');
  root.innerHTML =
      '<div class="modal" id="modalMask">' +
      '<div class="modal-box' + (opt.wide ? ' modal-wide' : '') + '" role="dialog" aria-modal="true">' +
        '<div class="modal-head">' +
          '<div class="modal-head-main">' +
            '<div class="modal-title">' + esc(opt.title || '') + '</div>' +
            (opt.meta && opt.meta.length
              ? '<div class="modal-meta">' + opt.meta.filter(Boolean).map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</div>'
              : '') +
          '</div>' +
          '<div class="modal-tools">' + (opt.tools || '') +
            '<button class="icon-btn" id="modalClose" aria-label="关闭">' + ic('close') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="modal-body" id="modalBody">' + (opt.body || '') + '</div>' +
      '</div>' +
    '</div>';

  const mask = document.getElementById('modalMask');

  // 「弹开」：以触发的卡片为原点展开（offset* 不受动画 transform 影响）
  const box = mask.querySelector('.modal-box');
  if (box && opt.from && opt.from.getBoundingClientRect) {
    const r = opt.from.getBoundingClientRect();
    const mr = mask.getBoundingClientRect();
    const ox = r.left + r.width / 2 - (mr.left + box.offsetLeft);
    const oy = r.top + r.height / 2 - (mr.top + box.offsetTop);
    box.style.transformOrigin = ox + 'px ' + oy + 'px';
  }

  mask.addEventListener('click', function (e) { if (e.target === mask) closeModal(); });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.addEventListener('keydown', modalEsc);

  if (opt.afterRender) opt.afterRender();
}

function modalEsc(e) {
  if (e.key === 'Escape') closeModal();
}

function closeModal() {
  document.getElementById('modalRoot').innerHTML = '';
  document.removeEventListener('keydown', modalEsc);
}

/* ---------------- 详情：图书 / 文案 / 视频 / 英雄 ---------------- */
function openBook(id, from) {
  const books = (st.library && st.library.books) || [];
  const b = books.filter(function (x) { return String(x.id || x.title) === String(id); })[0];
  if (!b) return;
  const chapters = b.chapters || [];
  openModal({
    title: b.title || '未命名',
    meta: [b.author, b.date],
    from: from,
    body:
      (b.oneLine ? '<div class="book-one">' + esc(b.oneLine) + '</div>' : '') +
      '<div class="doc-sec"><div class="doc-kicker">内容大纲 / Synopsis</div>' +
        '<div style="white-space:pre-wrap;">' + esc(b.summary || b.outline || '（暂无大纲）') + '</div></div>' +
      (chapters.length ? '<div class="doc-sec"><div class="doc-kicker">章节脉络 / Chapters</div>' +
        '<ol class="bk-chapters">' + chapters.map(function (c, i) {
          return '<li><span class="bk-no">' + pad2(i + 1) + '</span>' +
            '<span class="bk-body"><span class="bk-k">' + esc(c.k) + '</span>' +
            '<span class="bk-p">' + esc(c.p) + '</span></span></li>';
        }).join('') + '</ol></div>' : '') +
      '<div class="doc-sec"><div class="doc-kicker">我的思考 / Notes</div>' +
        '<div style="white-space:pre-wrap;">' + esc(b.think || '（暂无个人思考）') + '</div></div>' +
      (!b.oneLine && !b.summary && !chapters.length && !b.think ? '<div class="modal-note">该图书条目仅包含基础信息，暂无大纲与思考内容。</div>' : '')
  });
}


function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('已复制到剪贴板', 'ok'); })
      .catch(function () { fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); toast('已复制到剪贴板', 'ok'); }
  catch (e) { toast('复制失败，请手动选择', 'err'); }
  ta.remove();
}

/* ---------------- 交互 ---------------- */
function scrollKeep(fn) {
  const y = window.scrollY;
  fn();
  window.scrollTo(0, y);
}

function setGroup(cat) {
  if (!CATS[cat] || cat === st.group) return false;
  st.group = cat;
  try { localStorage.setItem('wb.cat', cat); } catch (e) {}
  return true;
}

function switchTab(key) {
  if (!PAGES[key]) key = 'home';
  const sec = secOf(key);
  const changed = !!(sec && sec.cat !== st.group && setGroup(sec.cat));
  st.tab = key;
  if (location.hash !== '#' + key) {
    try { history.replaceState(null, '', '#' + key); } catch (e) { location.hash = key; }
  }
  navGuard = { key: key, at: Date.now() };
  renderView(false);
  window.scrollTo(0, 0);
  updateChrome();
  scrollToSection(key);
  closeSidebar();
}

// 切换大类：整页重渲染成另一个大类，回到顶部
function switchGroup(cat) {
  if (!setGroup(cat)) return;
  st.tab = 'home';
  navGuard = null;
  try { history.replaceState(null, '', '#home'); } catch (e) {}
  updateChrome();
  renderView(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeSidebar();
}

function scrollToSection(key, instant) {
  // 现在一页只渲染当前区块，区块本身就在顶部，锚点滚动只会把页头推到吸顶栏底下
  window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
}

// 滚动时同步侧栏高亮
function syncActiveSection() {
  const probe = window.scrollY + 150;
  let cur = 'home';
  SECTIONS.forEach(function (s) {
    if (s.cat !== st.group) return;
    const el = document.getElementById('sec-' + s.key);
    if (el && el.getBoundingClientRect().top + window.scrollY <= probe) cur = s.key;
  });
  // 页面只有一张卡片、撑不满一屏时滚不动，probe 落不到区块上会把 tab 判成 home，
  // 下一次重渲染就跳回首页。页面上明明有区块，就以那个区块为准。
  if (cur === 'home') {
    const only = document.querySelector('#view .page-sec');
    if (only && only.id) cur = only.id.replace('sec-', '');
  }
  if (cur !== st.tab) { st.tab = cur; updateChrome(); }
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const mask = document.getElementById('sidebarMask');
  if (sb) sb.classList.remove('open');
  if (mask) mask.classList.remove('show');
}

function onViewClick(e) {
  const t = e.target;

  // 分页
  const pg = t.closest('.pager-btn, .lib-arrow');
  if (pg && !pg.disabled) {
    const scope = pg.dataset.pageScope;
    const page = Number(pg.dataset.page);
    if (scope === 'task') { if (page >= 1) { st.cal.page = page; } }
    else if (['lib'].indexOf(scope) >= 0) { st[scope].page = page; }
    renderView(true);
    return;
  }

  // 日历导航
  const cal = t.closest('[data-cal]');
  if (cal && st.cal.cursor) {
    const info = feishuInfo();
    if (cal.dataset.cal === 'prev') {
      st.cal.cursor = new Date(st.cal.cursor.getFullYear(), st.cal.cursor.getMonth() - 1, 1);
    } else if (cal.dataset.cal === 'next') {
      st.cal.cursor = new Date(st.cal.cursor.getFullYear(), st.cal.cursor.getMonth() + 1, 1);
    } else {
      const base = parseDate(info.latest) || new Date();
      st.cal.cursor = new Date(base.getFullYear(), base.getMonth(), 1);
      st.cal.selected = base;
    }
    renderView(true);
    return;
  }

  // 选中日期
  const cell = t.closest('.cal-cell');
  if (cell) {
    const ds = cell.dataset.date;
    const d = parseDate(ds);
    if (d) {
      st.cal.selected = d;
      if (d.getFullYear() !== st.cal.cursor.getFullYear() || d.getMonth() !== st.cal.cursor.getMonth()) {
        st.cal.cursor = new Date(d.getFullYear(), d.getMonth(), 1);
      }
      renderView(true);
    }
    return;
  }

  // 任务 tab / 分类
  const tt = t.closest('[data-task-tab]');
  if (tt) { st.cal.taskTab = tt.dataset.taskTab; st.cal.page = 1; renderView(true); return; }
  const tc = t.closest('[data-task-cat]');
  if (tc) { st.cal.taskCat = tc.dataset.taskCat; st.cal.page = 1; renderView(true); return; }

  // 动作按钮
  const act = t.closest('[data-action]');
  if (act) {
    const a = act.dataset.action;
    if (a === 'refresh') { loadFeishu(true); return; }
    if (a === 'retry-feishu') { loadFeishu(true); return; }
    if (a === 'retry-library') { st.load.library = 'idle'; loadLibrary(); return; }
    if (a === 'clear-lib') { st.lib.q = ''; st.lib.page = 1; renderView(true); return; }
    if (a === 'lib-random') { st.lib.focus = Math.floor(Math.random() * 997); renderView(true); return; }
    if (a === 'cat-more') { st.cal.catOpen = !st.cal.catOpen; renderView(true); return; }
  }

  // 书摘轮换
  const lf = t.closest('[data-lib-focus]');
  if (lf) { st.lib.focus = (st.lib.focus || 0) + Number(lf.dataset.libFocus); renderView(true); return; }

  // 详情入口
  const bk = t.closest('.lib-cover');
  if (bk) { openBook(bk.dataset.book, bk); return; }

  // 跳转
  const go = t.closest('[data-go]');
  if (go) { switchTab(go.dataset.go); return; }
}

let searchTimer = null;
function onViewInput(e) {
  const el = e.target;
  const map = { libSearch: 'lib' };
  const scope = map[el.id];
  if (!scope) return;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function () {
    st[scope].q = el.value.trim();
    st[scope].page = 1;
    renderView(true);
    const fresh = document.getElementById(el.id);
    if (fresh) {
      fresh.focus();
      const v = fresh.value;
      try { fresh.setSelectionRange(v.length, v.length); } catch (err) {}
    }
  }, 160);
}

/* ---------------- 初始化 ---------------- */
function init() {
  // 图标注入
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.outerHTML = ic(el.dataset.icon, 'nav-icon');
  });

  // 导航
  document.getElementById('sideNav').addEventListener('click', function (e) {
    const item = e.target.closest('.nav-item');
    if (item) switchTab(item.dataset.nav);
  });

  // 大类切换（创作线 / 工具箱）
  const sw = document.getElementById('sideSwitch');
  if (sw) {
    sw.addEventListener('click', function (e) {
      const b = e.target.closest('.sw-btn');
      if (b) switchGroup(b.dataset.cat);
    });
  }

  // 移动端抽屉
  document.getElementById('menuBtn').addEventListener('click', function () {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarMask').classList.add('show');
  });
  document.getElementById('sideClose').addEventListener('click', closeSidebar);
  document.getElementById('sidebarMask').addEventListener('click', closeSidebar);

  // 视图交互
  document.getElementById('view').addEventListener('click', onViewClick);
  document.getElementById('view').addEventListener('input', onViewInput);
  document.getElementById('view').addEventListener('search', onViewInput);

  // 顶栏操作
  document.getElementById('pageActions').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action="refresh"]');
    if (btn) loadFeishu(true);
  });

  // 大类：先读本地记忆，再让 hash 覆盖（直达某个区块时自动切到它所在的大类）
  try {
    const g = localStorage.getItem('wb.cat');
    if (CATS[g]) st.group = g;
  } catch (err) {}
  const h0 = (location.hash || '').replace('#', '');
  const s0 = secOf(h0);
  if (s0) st.group = s0.cat;

  updateChrome();

  renderView();
  loadFeishu();
  loadLibrary();

  // 滚动高亮 + 回到顶部按钮 + 锚点直达
  const fab = document.getElementById('fabTop');
  if (fab) {
    fab.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
  window.addEventListener('scroll', function () {
    syncActiveSection();
    if (fab) fab.classList.toggle('show', window.scrollY > 420);
  }, { passive: true });
  const hash = (location.hash || '').replace('#', '');
  if (hash && PAGES[hash] && hash !== 'home') {
    st.tab = hash;
    updateChrome();
    setTimeout(function () { scrollToSection(hash, true); }, 400);
  }

  window.addEventListener('hashchange', function () {
    const h = (location.hash || '').replace('#', '');
    if (h && PAGES[h]) switchTab(h);
  });
}

document.addEventListener('DOMContentLoaded', init);
