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
  koubo:   { title: '口播工坊',   desc: '选题 · 草稿 · 定稿 · 三段流水线' },
  pixel:   { title: '像素工坊',   desc: '图片转像素风 · 去背导出透明 PNG' },
  draw:    { title: '画板',       desc: '随手画 · 导出 PNG / JPG 到本地' },
  report:  { title: '战报',       desc: '作品数据回流 · 过线率与公式热力表' },
  radar:   { title: '今日雷达',   desc: '全网热点 · 每天自动抓一遍' }
};

const PAGE_SIZE = { task: 20 };

/* ---------------- 全局状态 ---------------- */
const st = {
  tab: 'home',
  group: 'create',
  feishu: null,
  library: null,
  videos: null,
  radar: null,
  wechat: null,
  drafts: null,
  load: { feishu: 'idle', library: 'idle', videos: 'idle', radar: 'idle', drafts: 'idle' },
  err: { feishu: '', library: '', videos: '', radar: '', drafts: '' },
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

async function loadVideos() {
  if (st.load.videos === 'loading' || st.load.videos === 'ready') return;
  st.load.videos = 'loading';
  st.err.videos = '';
  renderView(true);
  try {
    st.videos = await fetchJSON('videos-data.json');
    st.load.videos = 'ready';
  } catch (e) {
    st.load.videos = 'error';
    st.err.videos = e.message || '加载失败';
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
  const info = feishuInfo();
  const ready = st.load.feishu === 'ready';

  const recent = info.tasks.slice()
    .filter(function (t) { return t.completed_at; })
    .sort(function (a, b) { return String(b.completed_at).localeCompare(String(a.completed_at)); })
    .slice(0, 6);

  const quick = [
    { go: 'tasks', icon: 'calendar', no: '01', cls: 'c1', title: '任务与日历', desc: '月历视图 · 按日期查看任务' },
    { go: 'library', icon: 'book', no: '02', cls: 'c2', title: '图书馆', desc: '搜索书名 · 阅读书摘与思考' },
    { go: 'pixel', icon: 'pixel', no: '03', cls: 'c4', title: '像素工坊', desc: '图片转像素 · 去背导出透明 PNG' }
  ];

  const rs = rwStats();
  RW.stats = rs;

  return '' +
    '<section class="rw-hero" id="rwHero">' +
      '<canvas class="rw-canvas" id="rwCanvas" aria-hidden="true"></canvas>' +
      '<div class="rw-vignette"></div>' +
      '<div class="rw-inner">' +
        '<div class="rw-kicker"><i></i>PERSONAL WORKBENCH<em>EST 2026</em><span>LOCAL FIRST</span></div>' +
        '<h1 class="rw-title">把每天该做的事<br><span>排成一条跑道。</span></h1>' +
        '<p class="rw-sub">任务是飞书同步来的，藏书和口播文案留在本机，<br>打开这一页，今天做什么、还剩什么，一眼看到底。</p>' +
        '<div class="rw-actions">' +
          '<button class="rw-btn primary" data-go="tasks">看看今天 <span>→</span></button>' +
          '<button class="rw-btn" data-go="koubo">写今天的口播</button>' +
          '<button class="rw-btn" data-go="library">翻一翻藏书</button>' +
        '</div>' +
        '<div class="rw-panel">' +
          '<div class="rw-panel-main">' +
            '<div class="rw-label">累计完成</div>' +
            '<div class="rw-big"><b id="rwTotal">' + (ready ? rs.total : '—') + '</b><i>项</i></div>' +
            '<div class="rw-end"><b id="rwDays">' + (ready ? rs.days : '—') + '</b> 天有记录 · 最近一次 <b id="rwLast">' + (ready ? rwMonthDay(rs.last) : '—') + '</b></div>' +
          '</div>' +
          '<div class="rw-panel-side">' +
            '<div class="rw-kv"><span>最近 7 天</span><b id="rwLast7">' + (ready ? rs.last7 + ' 项' : '—') + '</b></div>' +
            '<div class="rw-kv"><span>今日目标</span><b id="rwGoal">10 项</b></div>' +
            '<input class="rw-range" id="rwGoalRange" type="range" min="3" max="20" step="1" value="10" aria-label="今日目标">' +
            '<div class="rw-hint">拖动滑杆 · 目标越高，数字火苗越旺</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<div class="fx-section-head">' +
      '<div><div class="fx-eyebrow">EXPLORE · 3 SPACES</div>' +
      '<div class="fx-sec-title">工作区入口 <em>— explore</em></div></div>' +
      '<span class="fx-view">SCROLL ↓</span>' +
    '</div>' +
    '<div class="fx-cards">' +
      quick.map(function (q) {
        return '<div class="fx-card ' + q.cls + '" data-go="' + q.go + '">' +
          '<div class="fx-card-art">' +
            '<div class="fx-card-ico">' + ic(q.icon) + '</div>' +
            '<span class="fx-card-no">' + q.no + '</span>' +
            '<i class="fx-card-spark"></i>' +
          '</div>' +
          '<div class="fx-card-foot">' +
            '<div class="fx-card-txt"><b>' + esc(q.title) + '</b><span>' + esc(q.desc) + '</span></div>' +
            '<span class="fx-card-go">↗</span>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div class="fx-section-head">' +
      '<div><div class="fx-eyebrow">RECENT · ' + (ready ? recent.length : '·') + '</div>' +
      '<div class="fx-sec-title">最近完成 <em>— timeline</em></div></div>' +
      '<button class="fx-view link" data-go="tasks">全部任务 →</button>' +
    '</div>' +
    '<div class="card fx-recent">' +
      (st.load.feishu === 'loading' ? stateHtml('loading', '正在读取任务数据')
        : st.load.feishu === 'error' ? stateHtml('error', '飞书数据加载失败', st.err.feishu, '重试', 'data-action="retry-feishu"')
        : recent.length
          ? '<div class="row-list">' + recent.map(function (t) {
              return '<div class="list-row" data-go="tasks">' +
                '<div class="row-ico">' + ic('check') + '</div>' +
                '<div class="row-main"><div class="row-title">' + esc(t.summary || '—') + '</div>' +
                '<div class="row-sub"><span>' + esc(t.category || '其他') + '</span><span>' + esc(fmtDateTime(t.completed_at)) + '</span></div></div>' +
                '</div>';
            }).join('') + '</div>'
          : stateHtml('empty', '暂无已完成任务')) +
    '</div>';
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

  // 任务中心
  const cats = {};
  info.tasks.forEach(function (t) {
    if (t.category) cats[t.category] = (cats[t.category] || 0) + 1;
  });
  if (st.cal.taskCat !== 'all' && !cats[st.cal.taskCat]) st.cal.taskCat = 'all';

  let list = info.tasks.slice();
  if (st.cal.taskTab === 'pending') list = list.filter(function (t) { return t.status !== 'completed'; });
  if (st.cal.taskTab === 'completed') list = list.filter(function (t) { return t.status === 'completed'; });
  if (st.cal.taskCat !== 'all') list = list.filter(function (t) { return t.category === st.cal.taskCat; });
  list.sort(function (a, b) {
    return String(b.completed_at || b.due || '').localeCompare(String(a.completed_at || a.due || ''));
  });

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE.task));
  if (st.cal.page > totalPages) st.cal.page = 1;
  const startIdx = (st.cal.page - 1) * PAGE_SIZE.task;
  const pageList = list.slice(startIdx, startIdx + PAGE_SIZE.task);

  const catKeys = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; });
  const catRows = catKeys.map(function (k) {
    const arr = info.tasks.filter(function (t) { return t.category === k; });
    const done = arr.filter(function (t) { return t.status === 'completed'; }).length;
    return { key: k, total: arr.length, done: done, pct: arr.length ? Math.round(done / arr.length * 100) : 0 };
  });
  const donePct = info.total ? Math.round(info.completed / info.total * 100) : 0;

  const taskHtml = '<div class="card poster-card">' +
    '<div class="pz-head">' +
      '<div class="tc-head-row">' +
        '<div class="tc-head-copy">' +
          '<div class="pz-kicker">Task Center · ' + esc((info.latest || '2026').slice(0, 4)) + '</div>' +
          '<div class="pz-title">任务中心</div>' +
          (info.earliest ? '<div class="pz-sub">' + esc(info.earliest) + ' — ' + esc(info.latest) + '，按分类与月份归集的工作记录</div>' : '') +
        '</div>' +
        '<div class="tc-stats">' +
          '<div class="tc-stat"><b>' + info.total + '</b><span>全部任务</span></div>' +
          '<div class="tc-stat"><b>' + info.completed + '</b><span>已完成</span></div>' +
          '<div class="tc-stat"><b>' + info.pending + '</b><span>待办</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="tc-overall">' +
        '<div class="tc-overall-top">' +
          '<span class="tc-overall-label">整体完成进度</span>' +
          '<span class="tc-state' + (donePct >= 100 ? ' done' : ' run') + '">' + (donePct >= 100 ? '全部完成' : '进行中') + '</span>' +
          '<em class="tc-pct">' + donePct + '%</em>' +
        '</div>' +
        '<div class="tc-bar-big"><b>' + info.completed + '</b><span>/ ' + info.total + ' 已完成</span></div>' +
        '<div class="tc-progress lg"><i style="width:' + donePct + '%"></i></div>' +
      '</div>' +
    '</div>' +
    '<div class="tc-sec"><i></i>按分类筛选</div>' +
    '<div class="tc-cats">' +
      '<button class="tc-chip tc-chip-all' + (st.cal.taskCat === 'all' ? ' on' : '') + '" data-task-cat="all">' +
        '<i></i>全部分类<em>' + info.total + '</em>' +
      '</button>' +
      (function () {
        const LIMIT = 12;
        const expanded = !!st.cal.catOpen || st.cal.taskCat !== 'all';
        const shown = expanded ? catRows : catRows.slice(0, LIMIT);
        let s = shown.map(function (c) {
          return '<button class="tc-chip t' + catTone(c.key) + (st.cal.taskCat === c.key ? ' on' : '') + '" data-task-cat="' + esc(c.key) + '">' +
            '<i></i>' + esc(c.key) + '<em>' + c.total + '</em>' +
          '</button>';
        }).join('');
        if (catRows.length > LIMIT) {
          s += '<button class="tc-chip tc-chip-more" data-action="cat-more">' +
            (expanded ? '收起' : '+ ' + (catRows.length - LIMIT) + ' 个分类') +
          '</button>';
        }
        return s;
      })() +
    '</div>' +
    '<div class="pz-foot">' +
      '<div class="task-tabs">' +
        ['all:全部', 'pending:待办', 'completed:已完成'].map(function (pair) {
          const k = pair.split(':')[0], label = pair.split(':')[1];
          return '<button class="task-tab' + (st.cal.taskTab === k ? ' active' : '') + '" data-task-tab="' + k + '">' + label + '</button>';
        }).join('') +
      '</div>' +
      '<div class="pz-note">' + (st.cal.taskCat === 'all' ? '全部分类' : esc(st.cal.taskCat)) + ' · 共 ' + list.length + ' 条</div>' +
    '</div>' +
    (pageList.length ? '<div class="tc-grid">' + pageList.map(function (t) { return taskCard(t); }).join('') + '</div>'
      : stateHtml('empty', '没有符合条件的任务', '换个筛选条件试试')) +
    pagerHtml('task', st.cal.page, PAGE_SIZE.task, list.length) +
    '</div>';

  return syncCard(info) +
    '<div class="two-col" style="margin-bottom:14px;">' + calHtml + dayHtml + '</div>' +
    taskHtml;
}

function taskCard(t) {
  const done = t.status === 'completed';
  const when = done ? fmtDateTime(t.completed_at) : fmtDateTime(t.due);
  const cat = t.category || '未分类';
  return '<article class="tc-card t' + catTone(cat) + (done ? ' done' : '') + '">' +
    '<div class="tc-card-top">' +
      '<span class="tc-pill">' + esc(cat) + '</span>' +
      '<span class="tc-state' + (done ? ' done' : ' run') + '">' + (done ? '已完成' : '待办') + '</span>' +
    '</div>' +
    '<div class="tc-card-title">' + esc(t.summary || '—') + '</div>' +
    '<div class="tc-card-foot"><span class="tc-date">' + esc(when || '—') + '</span></div>' +
    '<div class="tc-progress' + (done ? ' done' : '') + '"><i style="width:' + (done ? 100 : 0) + '%"></i></div>' +
    '</article>';
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

/* ---------------- 口播工坊（读 content/drafts/index.json） ---------------- */
const KB_LANES = [
  { key: 'idea',  name: '选题池', en: 'IDEAS',  icon: 'inbox', empty: '今天还没挑', tip: '下面这几条是雷达够分的，挑一条说一声就出稿' },
  { key: 'draft', name: '草稿',   en: 'DRAFT',  icon: 'pen',   empty: '还没有草稿', tip: '念得顺了才算过关' },
  { key: 'final', name: '定稿',   en: 'FINAL',  icon: 'check', empty: '还没有定稿', tip: '定稿的稿子，直接拿去向镜头' }
];

const KB_WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/* 界面状态：open=正在念哪一篇，text=正文缓存，copy=刚点过复制 */
const KB = { open: '', text: {}, copy: '', busy: '' };

function kbLane(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'final' || v === 'done' || v === 'published' || v === 'shot') return 'final';
  if (v === 'idea' || v === 'topic') return 'idea';
  return 'draft';
}

function kbFind(file) {
  const docs = (st.drafts && st.drafts.drafts) || [];
  for (let i = 0; i < docs.length; i++) if (docs[i].file === file) return docs[i];
  return null;
}

/* 从 md 里抽出真正要念的部分：钩子 / 正文 / 结尾，去掉标题行和列表符号 */
function kbBody(md) {
  let t = String(md || '').replace(/\r/g, '');
  const a = t.indexOf('## 钩子');
  const c = t.search(/^##\s*(正文|稿)/m);
  const start = a >= 0 ? a : c;
  if (start >= 0) {
    // 先跳到标题行末尾，别把「## 正文（直接念，一整段）」这行念出来
    const le = t.indexOf('\n', start);
    const rest = t.slice(le >= 0 ? le + 1 : start + 3);
    // 遇到下一个二级标题或分隔线就停
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

function kbParas(txt) {
  return txt.split(/\n{2,}/).map(function (p) {
    return p.replace(/\n/g, '').trim();
  }).filter(Boolean);
}

function kbWords(txt) { return String(txt || '').replace(/\s/g, '').length; }

function kbDur(sec) {
  const s = Number(sec) || 0;
  if (!s) return '';
  const m = Math.floor(s / 60);
  return (m ? m + '分' : '') + (s % 60 ? (s % 60) + '秒' : '');
}

function kbDocHtml(d) {
  const f = String(d.file || '');
  const w = Number(d.words) || 0;
  const dur = kbDur(d.duration_sec);
  return '<div class="kb-doc" data-kb-open="' + esc(f) + '" tabindex="0" role="button">' +
    '<div class="kb-doc-t">' + esc(d.title || '未命名') + '</div>' +
    (d.hook ? '<div class="kb-doc-h">' + esc(d.hook) + '</div>' : '') +
    '<div class="kb-doc-m">' +
      '<span>' + esc(fmtMD(d.date) || '') + '</span>' +
      (w ? '<span>' + w + ' 字</span>' : '') +
      (dur ? '<span>' + esc(dur) + '</span>' : '') +
      (d.publish_at ? '<span class="is-go">' + esc(d.publish_at) + ' 发</span>' : '') +
    '</div>' +
  '</div>';
}

/* 选题池：直接把今日雷达够分的候选搬进来，点标题看原文 */
function kbIdeaHtml() {
  // 两个源合一：全网热榜/媒体 + 公众号。公众号的 source 用号名，一眼能分清
  const out = [];
  const rp = (st.radar && st.radar.picks) ? st.radar.picks : [];
  rp.filter(function (p) { return (p.score || 0) >= 5; }).forEach(function (p) {
    out.push({ title: p.title, src: p.source || '', url: p.url || '', score: p.score || 0, from: '' });
  });
  const wp = (st.wechat && st.wechat.picks) ? st.wechat.picks : [];
  wp.filter(function (p) { return (p.score || 0) >= 6; }).forEach(function (p) {
    out.push({
      title: p.title, src: p.account || '公众号', url: p.url || '',
      score: p.score || 0, from: '公众号'
    });
  });
  out.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return (b.from ? 1 : 0) - (a.from ? 1 : 0);
  });
  const use = out.slice(0, 6);
  if (!use.length) return '';
  return use.map(function (p) {
    const tag = p.url ? 'a' : 'div';
    const href = p.url ? ' href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer"' : '';
    return '<' + tag + ' class="kb-doc is-idea"' + href + '>' +
      '<div class="kb-doc-t">' + esc(p.title || '') + '</div>' +
      '<div class="kb-doc-m">' +
        '<span>' + (p.from ? '<u>' + esc(p.from) + '</u>' + esc(p.src) : esc(p.src)) + '</span>' +
        '<span class="is-go">' + (p.score || 0) + ' 分</span>' +
      '</div>' +
    '</' + tag + '>';
  }).join('');
}

function kbReadHtml() {
  if (!KB.open) return '';
  const d = kbFind(KB.open);
  const txt = KB.text[KB.open];
  let body;
  if (txt == null) {
    body = '<div class="kb-read-wait">正在取正文…</div>';
  } else {
    const ps = kbParas(kbBody(txt));
    body = ps.length
      ? ps.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('')
      : '<div class="kb-read-wait">这篇里没找到正文，点下面的仓库链接看原文</div>';
  }
  return '<div class="kb-read">' +
    '<div class="kb-read-bar">' +
      '<div class="kb-read-k">念稿</div>' +
      '<div class="kb-read-t">' + esc(d ? d.title : '') + '</div>' +
      '<button type="button" class="kb-read-btn" data-kb-copy="1">' + (KB.copy ? '已复制' : '复制全文') + '</button>' +
      '<button type="button" class="kb-read-btn is-x" data-kb-close="1">关闭</button>' +
    '</div>' +
    '<div class="kb-read-body">' + body + '</div>' +
  '</div>';
}

function renderKouboPage() {
  const d = new Date();
  const docs = (st.drafts && st.drafts.drafts) || [];

  const lanes = KB_LANES.map(function (l) {
    let inner = '';
    let n = 0;
    if (l.key === 'idea') {
      const idea = kbIdeaHtml();
      if (idea) { inner = '<div class="kb-list">' + idea + '</div>'; n = idea.split('class="kb-doc is-idea"').length - 1; }
    } else {
      const mine = docs.filter(function (x) { return kbLane(x.status) === l.key; });
      n = mine.length;
      if (n) inner = '<div class="kb-list">' + mine.map(kbDocHtml).join('') + '</div>';
    }
    if (!inner) {
      inner = '<div class="kb-empty">' +
        '<span class="kb-empty-ico">' + ic(l.icon) + '</span>' +
        '<b>' + esc(l.empty) + '</b>' +
        '<span>' + esc(l.tip) + '</span>' +
      '</div>';
    }
    return '<div class="kb-col" data-kb-lane="' + l.key + '">' +
      '<div class="kb-col-head">' +
        '<i class="kb-dot"></i>' +
        '<span class="kb-col-name">' + esc(l.name) + '</span>' +
        '<span class="kb-col-en">' + esc(l.en) + '</span>' +
        '<span class="kb-col-count">' + n + '</span>' +
      '</div>' +
      inner +
    '</div>';
  }).join('');

  const nDraft = docs.filter(function (x) { return kbLane(x.status) === 'draft'; }).length;
  const nFinal = docs.filter(function (x) { return kbLane(x.status) === 'final'; }).length;
  const nIdea = ((st.radar && st.radar.picks)
    ? st.radar.picks.filter(function (p) { return (p.score || 0) >= 5; }).length : 0) +
    ((st.wechat && st.wechat.picks)
    ? st.wechat.picks.filter(function (p) { return (p.score || 0) >= 6; }).length : 0);

  let note = '';
  if (st.load.drafts === 'error') {
    note = '<div class="kb-note is-err"><i></i>稿子索引读不到（' + esc(st.err.drafts || '') + '），列表是空的</div>';
  } else if (st.load.drafts === 'ready' && !docs.length) {
    note = '<div class="kb-note"><i></i>索引是好的，就是还没有稿子。index.json 里加一条就出来</div>';
  } else {
    note = '<div class="kb-note"><i></i>点任意一篇就能看全文，复制了直接念</div>';
  }

  return '' +
    '<div class="kb-strip">' +
      '<div class="kb-strip-main">' +
        '<div class="kb-kicker"><b>TODAY</b> · 口播</div>' +
        '<div class="kb-date">' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日<em>' + KB_WEEK[d.getDay()] + '</em></div>' +
      '</div>' +
      '<div class="kb-slots">' +
        '<div class="kb-slot is-live"><span>发布</span><b>19:00</b></div>' +
        '<div class="kb-slot"><span>能挑</span><b>' + (st.radar ? nIdea : '—') + '</b></div>' +
        '<div class="kb-slot"><span>待念</span><b>' + (st.load.drafts === 'ready' ? nDraft : '—') + '</b></div>' +
        '<div class="kb-slot"><span>已定稿</span><b>' + (st.load.drafts === 'ready' ? nFinal : '—') + '</b></div>' +
      '</div>' +
    '</div>' +
    '<div class="kb-board">' + lanes + '</div>' +
    note +
    kbReadHtml();
}

function mountKoubo() {
  const nc = document.getElementById('navKouboCount');
  if (nc) {
    const n = (st.drafts && st.drafts.drafts) ? st.drafts.drafts.length : 0;
    nc.textContent = st.load.drafts === 'ready' ? String(n) : '—';
  }

  document.body.classList.toggle('kb-lock', !!KB.open);

  const sec = document.getElementById('sec-koubo');
  if (!sec) return;

  sec.querySelectorAll('[data-kb-open]').forEach(function (el) {
    const go = function () {
      const f = el.getAttribute('data-kb-open');
      if (!f) return;
      KB.open = f;
      KB.copy = '';
      renderView(true);
      if (KB.text[f] == null && KB.busy !== f) {
        KB.busy = f;
        fetch(encodeURI(f) + '?t=' + Date.now())
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
          .then(function (t) { KB.text[f] = t; KB.busy = ''; if (KB.open === f) renderView(true); })
          .catch(function () { KB.text[f] = ''; KB.busy = ''; if (KB.open === f) renderView(true); });
      }
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  const close = sec.querySelector('[data-kb-close]');
  if (close) close.addEventListener('click', function () { KB.open = ''; renderView(true); });

  const cp = sec.querySelector('[data-kb-copy]');
  if (cp) cp.addEventListener('click', function () {
    const txt = KB.text[KB.open];
    if (txt == null) return;
    const body = kbBody(txt);
    const done = function () {
      KB.copy = '1';
      renderView(true);
      setTimeout(function () { KB.copy = ''; if (KB.open) renderView(true); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(body).then(done, function () { kbFallbackCopy(body); done(); });
    } else {
      kbFallbackCopy(body);
      done();
    }
  });

  const sheet = sec.querySelector('.kb-read');
  if (sheet) {
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet) { KB.open = ''; renderView(true); }
    });
  }
}

function kbFallbackCopy(t) {
  const ta = document.createElement('textarea');
  ta.value = t;
  ta.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

/* ---------------- 战报（作品台账 · 只读快照） ---------------- */
const RPT_PASS_PLAY = 35000;   // 过线门槛：3.5 万播放
const RPT_MAX_MONTHS = 6;      // 热力表最多看 6 个月
const RPT_MAX_ROWS = 40;       // 条目录最多列 40 条
const RPT = { type: 'all', passOnly: false };

const RPT_TYPES = [
  { key: 'all', name: '全部' },
  { key: 'content', name: '内容' },
  { key: 'traffic', name: '引流' },
  { key: 'product', name: '产品' },
  { key: 'commerce', name: '带货' }
];

const RPT_FORMULA = {
  F1: '跨品牌错位', F2: '提前爆料', F3: '站队抬杠', F4: '颜色纠结',
  F5: '抢机拿下', F6: '代买报价', F7: '客户故事', F8: '教程干货',
  F9: '单品三件套', F10: '反共识劝退', F11: '行业吐槽', F12: '委托寄机',
  F13: '老机型服务', F14: '参数科普', F15: '一堆挨个试', F16: '公益纪录'
};

function rptNum(n) { const v = Number(n); return isFinite(v) ? v : 0; }
function rptInter(v) { return rptNum(v.like) + rptNum(v.comment) + rptNum(v.share); }
// 合格 = 播放过 3.5 万 且 有点赞/评论/分享里任意一种互动
function rptPass(v) { return rptNum(v.play) >= RPT_PASS_PLAY && rptInter(v) > 0; }
function rptMonth(v) { return String(v.date || '').slice(0, 7); }
function rptWan(n) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(n >= 100000 ? 0 : 1) + '万';
  return String(Math.round(n));
}
function rptPct(a, b) { return b ? Math.round(a / b * 100) : 0; }
function rptFName(k) { return RPT_FORMULA[k] || '待归类'; }
function rptTypeName(k) {
  for (let i = 0; i < RPT_TYPES.length; i++) if (RPT_TYPES[i].key === k) return RPT_TYPES[i].name;
  return '内容';
}

// 条目录标题：说明当前筛选与实际显示条数
function rptDirHint(all, shown) {
  const on = RPT.type !== 'all' || RPT.passOnly;
  if (on) return '<em>筛出 ' + shown.length + ' 条 · 共 ' + all.length + ' 条</em>';
  if (all.length > RPT_MAX_ROWS) return '<em>共 ' + all.length + ' 条 · 只显示最近 ' + RPT_MAX_ROWS + ' 条</em>';
  return '<em>共 ' + all.length + ' 条</em>';
}

function renderReportPage() {
  if (st.load.videos === 'error') {
    return '<div class="card rp-card">' +
      stateHtml('error', '作品数据读不到', (st.err.videos || 'videos-data.json 没加载成功') + ' · 确认文件在仓库根目录后刷新页面') +
      '</div>';
  }

  if (!st.videos || st.load.videos !== 'ready') {
    return '<div class="card rp-card">' + stateHtml('loading', '正在读取作品数据') + '</div>';
  }

  const list = (st.videos.videos || []).filter(function (v) { return v && v.date; });

  // 空数据：还没接过 Excel，直接告诉他缺什么
  if (!list.length) {
    return '<div class="card rp-card">' +
      '<div class="rp-empty">' +
        '<span class="rp-empty-ico">' + ic('chart') + '</span>' +
        '<b>还没有作品数据</b>' +
        '<span>这块要等 <em>videos-data.json</em> 里有内容才会长出来。把抖音后台导出的作品表转成这个文件放到仓库根目录，条目录、过线率、公式热力表就都有了。</span>' +
        '<div class="rp-fields"><i>date</i><i>time</i><i>title</i><i>type</i><i>formula</i><i>play</i><i>like</i><i>comment</i><i>share</i><i>follow</i></div>' +
      '</div>' +
    '</div>';
  }

  const months = [];
  list.forEach(function (v) { const m = rptMonth(v); if (m && months.indexOf(m) < 0) months.push(m); });
  months.sort();
  const cols = months.slice(-RPT_MAX_MONTHS);
  const last = cols[cols.length - 1] || '';

  const cur = list.filter(function (v) { return rptMonth(v) === last; });
  const curPass = cur.filter(rptPass).length;
  const curAvg = cur.length ? Math.round(cur.reduce(function (s, v) { return s + rptNum(v.play); }, 0) / cur.length) : 0;
  const unknown = list.filter(function (v) { return !RPT_FORMULA[v.formula]; }).length;

  const strip = '<div class="rp-strip">' +
      '<div class="rp-hero">' +
        '<div class="rp-kicker"><b>REPORT</b> · 战报</div>' +
        '<div class="rp-big"><b>' + rptPct(curPass, cur.length) + '</b><i>%</i></div>' +
        '<div class="rp-hero-sub">' + (last ? last.replace('-', ' 年 ') + ' 月' : '—') + '合格率 · ' + curPass + '/' + cur.length + ' 条过线</div>' +
      '</div>' +
      '<div class="rp-slots">' +
        '<div class="rp-slot"><span>本月条数</span><b>' + cur.length + '</b></div>' +
        '<div class="rp-slot"><span>过线</span><b class="is-ok">' + curPass + '</b></div>' +
        '<div class="rp-slot"><span>平均播放</span><b>' + rptWan(curAvg) + '</b></div>' +
        '<div class="rp-slot"><span>待归类</span><b' + (unknown ? ' class="is-warn"' : '') + '>' + unknown + '</b></div>' +
      '</div>' +
    '</div>';

  // 公式 × 月份 热力表
  const keys = [];
  Object.keys(RPT_FORMULA).forEach(function (k) {
    if (list.some(function (v) { return v.formula === k; })) keys.push(k);
  });
  keys.sort(function (a, b) { return Number(a.slice(1)) - Number(b.slice(1)); });

  function cellsOf(key, month) {
    return list.filter(function (v) {
      const f = RPT_FORMULA[v.formula] ? v.formula : '?';
      return f === key && rptMonth(v) === month;
    });
  }

  let mx = '<div class="rp-matrix" style="--rp-cols:' + cols.length + '">' +
    '<div class="rp-mx-row rp-mx-head"><span class="rp-mx-name">公式</span>' +
      cols.map(function (m) { return '<span class="rp-mx-m">' + m.slice(5) + ' 月</span>'; }).join('') +
    '</div>';

  keys.forEach(function (k) {
    const all = list.filter(function (v) { return (RPT_FORMULA[v.formula] ? v.formula : '?') === k; });
    const allPass = all.filter(rptPass).length;
    mx += '<div class="rp-mx-row"><span class="rp-mx-name"><b>' + esc(k) + '</b>' + esc(rptFName(k)) +
      '<i>' + all.length + ' 条</i></span>' +
      cols.map(function (m) {
        const arr = cellsOf(k, m);
        if (!arr.length) return '<span class="rp-mx-c is-empty">·</span>';
        const ok = arr.filter(rptPass).length;
        const rate = rptPct(ok, arr.length);
        const a = (rate === 0 ? 0.05 : 0.12 + rate / 100 * 0.5).toFixed(2);
        return '<span class="rp-mx-c" style="background:rgba(255,106,47,' + a + ')" title="' +
          esc(rptFName(k) + ' · ' + m + ' · ' + ok + '/' + arr.length + ' 条过线') + '">' +
          rate + '<i>%</i></span>';
      }).join('') + '</div>';
  });

  mx += '<div class="rp-mx-row rp-mx-total"><span class="rp-mx-name"><b>合计</b>全部公式</span>' +
    cols.map(function (m) {
      const arr = list.filter(function (v) { return rptMonth(v) === m; });
      const ok = arr.filter(rptPass).length;
      return '<span class="rp-mx-c">' + rptPct(ok, arr.length) + '<i>%</i></span>';
    }).join('') + '</div></div>';

  // 本月结论：直接给出最稳和最差的两个公式，省得自己扫表格
  const rank = keys.map(function (k) {
    const arr = cellsOf(k, last);
    return { k: k, n: arr.length, rate: rptPct(arr.filter(rptPass).length, arr.length) };
  }).filter(function (r) { return r.n >= 2; })
    .sort(function (a, b) { return b.rate - a.rate || b.n - a.n; });

  const best = rank[0];
  const worst = rank.length > 1 ? rank[rank.length - 1] : null;
  const summary = (best && best.rate > (worst ? worst.rate : -1))
    ? '<div class="rp-summary">本月最稳：<b>' + esc(best.k) + ' ' + esc(rptFName(best.k)) + '</b> ' +
        best.rate + '%（' + best.n + ' 条）' +
        (worst && worst.rate < best.rate
          ? '　·　最差：<b>' + esc(worst.k) + ' ' + esc(rptFName(worst.k)) + '</b> ' + worst.rate + '%（' + worst.n + ' 条）'
          : '') +
      '</div>'
    : '';

  const matrixCard = '<div class="card rp-card">' +
    '<div class="rp-card-head"><div class="rp-card-title">哪种开头能过线<em>公式 × 月份 · 格子里是该月过线率</em></div>' +
    (keys.length ? '<div class="rp-legend"><i></i>颜色越亮过线越多</div>' : '') + '</div>' +
    (keys.length
      ? mx + summary
      : '<div class="rp-mx-blank">这一版还没有作品打上公式标签。<br>等转换脚本按关键词规则跑一遍，F1–F16 的过线率就会排在这里。</div>') +
    '</div>';

  // 条目录（可筛）
  const filtered = list.filter(function (v) {
    if (RPT.type !== 'all' && (v.type || 'content') !== RPT.type) return false;
    if (RPT.passOnly && !rptPass(v)) return false;
    return true;
  }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });

  const chips = RPT_TYPES.map(function (t) {
    return '<button class="chip' + (RPT.type === t.key ? ' active' : '') + '" data-rpt-type="' + t.key + '">' + t.name + '</button>';
  }).join('') +
    '<button class="chip' + (RPT.passOnly ? ' active' : '') + '" data-rpt-pass="1">只看过线</button>';

  const rows = filtered.slice(0, RPT_MAX_ROWS).map(function (v) {
    const ok = rptPass(v);
    return '<div class="rp-tr' + (ok ? ' is-ok' : '') + '">' +
      '<span class="rp-td-date">' + esc(String(v.date).slice(5).replace('-', '/')) + '</span>' +
      '<span class="rp-td-title">' + esc(v.title || '（无标题）') +
        '<i>' + esc(v.time || '') + (v.time ? ' · ' : '') + esc(rptTypeName(v.type || 'content')) + '</i></span>' +
      '<span class="rp-td-f"><b>' + esc(v.formula || '?') + '</b>' + esc(rptFName(v.formula)) + '</span>' +
      '<span class="rp-td-num">' + rptWan(rptNum(v.play)) + '</span>' +
      '<span class="rp-td-num rp-td-inter">' + rptWan(rptInter(v)) + '</span>' +
      '<span class="rp-td-flag">' + (ok ? '过线' : '—') + '</span>' +
    '</div>';
  }).join('');

  const dirCard = '<div class="card rp-card">' +
    '<div class="rp-card-head">' +
      '<div class="rp-card-title">条目录' + rptDirHint(list, filtered) + '</div>' +
      '<div class="rp-chips">' + chips + '</div>' +
    '</div>' +
    '<div class="rp-table"><div class="rp-tr rp-th">' +
      '<span class="rp-td-date">日期</span><span class="rp-td-title">标题</span>' +
      '<span class="rp-td-f">公式</span><span class="rp-td-num">播放</span>' +
      '<span class="rp-td-num rp-td-inter">互动</span><span class="rp-td-flag">判定</span></div>' +
      (filtered.length ? rows : stateHtml('empty', '这个筛选下没有条目', '换个类型或关掉「只看过线」')) +
    '</div>' +
    '<div class="rp-note"><i></i>合格口径：播放 ≥ ' + rptWan(RPT_PASS_PLAY) + ' 且有点赞/评论/分享 · 数据快照 ' +
      esc(st.videos.updated_at || '—') + '</div>' +
  '</div>';

  return strip + matrixCard + dirCard;
}

// 战报筛选：重建 DOM 后重新挂监听
/* ---------------- 今日雷达（全网热点 · 每天 10:20 自动更新） ---------------- */

const RDR = { onlyHit: false };
const RDR_MAX = 18;

function rdrShortTime(t) {
  return (t || '').replace(/^\d{4}-/, '') || '—';
}

function renderRadarPage() {
  if (st.load.radar === 'error') {
    return '<div class="card rd-card">' +
      stateHtml('error', '雷达数据读不到',
        (st.err.radar || 'radar-data.json 没加载成功') + ' · 跑一次 选题雷达/radar_run.py 就会生成') +
      '</div>';
  }
  if (!st.radar || st.load.radar !== 'ready') {
    return '<div class="card rd-card">' + stateHtml('loading', '正在读今日热点') + '</div>';
  }

  const d = st.radar;
  const picks = (d.picks || []).slice();
  if (!picks.length) {
    return '<div class="card rd-card">' +
      stateHtml('empty', '今天还没抓到东西', '检查电脑有没有联网，再跑一次 radar_run.py') +
      '</div>';
  }

  const hit = picks.filter(function (p) { return (p.score || 0) >= 5; });
  const list = RDR.onlyHit ? hit : picks;
  const shown = list.slice(0, RDR_MAX);
  const stats = d.stats || {};
  const platforms = Object.keys(stats).filter(function (k) { return stats[k] > 0; });
  let totalSrc = 0;
  platforms.forEach(function (k) { totalSrc += stats[k]; });

  // 顶部条
  let html = '<div class="card rd-card rd-strip-card"><div class="rd-strip">' +
    '<div class="rd-strip-l">' +
      '<div class="rd-kicker"><b>今日雷达</b> 每天 10:20 自动更新</div>' +
      '<div class="rd-time">' + esc(rdrShortTime(d.updated)) +
        '<em>' + platforms.length + ' 个平台 · 扫了 ' + totalSrc + ' 条热榜</em></div>' +
    '</div>' +
    '<div class="rd-slots">' +
      '<div class="rd-slot"><span>候选</span><b>' + picks.length + '</b></div>' +
      '<div class="rd-slot is-live"><span>能拍</span><b>' + hit.length + '</b></div>' +
      '<div class="rd-slot"><span>热梗</span><b>' + (d.meme || []).length + '</b></div>' +
    '</div>' +
  '</div></div>';

  // 候选池
  html += '<div class="card rd-card">' +
    '<div class="rd-card-head">' +
      '<div class="rd-card-title">候选池<em>分数 = 能不能开机拍 · 你手上四台机器命中直接加 5 分</em></div>' +
      '<div class="rd-chips">' +
        '<span class="chip' + (RDR.onlyHit ? '' : ' active') + '" data-rdr-hit="0">全部 ' + picks.length + '</span>' +
        '<span class="chip' + (RDR.onlyHit ? ' active' : '') + '" data-rdr-hit="1">只看能拍 ' + hit.length + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="rd-list">' +
      shown.map(function (p, i) {
        const sc = p.score || 0;
        const cls = sc >= 8 ? ' is-hot' : sc >= 5 ? ' is-hit' : '';
        const top3 = !RDR.onlyHit && i < 3 && sc >= 5;
        const url = /^https?:\/\//i.test(p.url || '') ? p.url : '';
        const inner = '<span class="rd-score">' + (sc > 0 ? sc : '—') + '</span>' +
          '<span class="rd-src">' + esc(p.source || '') + '</span>' +
          '<span class="rd-title">' + esc(p.title) + (url ? '<i class="rd-out">↗</i>' : '') + '</span>' +
          '<span class="rd-tags">' +
            (p.hooks || []).map(function (h) { return '<i>' + esc(h) + '</i>'; }).join('') +
            (p.kind ? '<u>' + esc(p.kind) + '</u>' : '') +
          '</span>';
        if (!url) return '<div class="rd-row' + cls + (top3 ? ' is-top' : '') + '">' + inner + '</div>';
        return '<a class="rd-row rd-link' + cls + (top3 ? ' is-top' : '') + '" href="' + esc(url) +
          '" target="_blank" rel="noopener noreferrer" title="打开原文：' + esc(p.title) + '">' + inner + '</a>';
      }).join('') +
    '</div>' +
    (list.length > RDR_MAX
      ? '<div class="rd-note">共 ' + list.length + ' 条，只显示前 ' + RDR_MAX + ' 条</div>'
      : '<div class="rd-note"><i></i>分数只是「值不值得开机」，最后拍哪条你自己定</div>') +
  '</div>';

  // 热梗
  if ((d.meme || []).length) {
    html += '<div class="card rd-card">' +
      '<div class="rd-card-head"><div class="rd-card-title">热梗<em>口播里自然带一句就行，别硬念，念出来像广告</em></div></div>' +
      '<div class="rd-meme">' +
        d.meme.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') +
      '</div>' +
    '</div>';
  }

  return html;
}

// 雷达筛选：重建 DOM 后重新挂监听
function mountRadar() {
  const nc = document.getElementById('navRadarCount');
  if (nc) {
    const n = st.radar && st.radar.picks
      ? st.radar.picks.filter(function (p) { return (p.score || 0) >= 5; }).length : 0;
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
}

function mountReport() {
  // 侧栏条目数：跟随快照里实际条数
  const nc = document.getElementById('navReportCount');
  if (nc) {
    const n = (st.videos && st.videos.videos) ? st.videos.videos.length : 0;
    nc.textContent = st.load.videos === 'ready' ? String(n) : '—';
  }

  const sec = document.getElementById('sec-report');
  if (!sec) return;
  sec.querySelectorAll('[data-rpt-type]').forEach(function (el) {
    el.addEventListener('click', function () {
      RPT.type = el.dataset.rptType;
      renderView(true);
    });
  });
  const p = sec.querySelector('[data-rpt-pass]');
  if (p) p.addEventListener('click', function () {
    RPT.passOnly = !RPT.passOnly;
    renderView(true);
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
  { key: 'radar', cat: 'create', title: '今日雷达', desc: '全网热点 · 每天 10:20 自动抓一遍' },
  { key: 'koubo', cat: 'create', title: '口播工坊', desc: '选题 → 草稿 → 定稿 · 一天一条' },
  { key: 'report', cat: 'create', title: '战报', desc: '发布后的数据回流 · 哪种开头能过线' },
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
  const cat = CATS[st.group] || CATS.create;

  let html = renderHome() +
    '<div class="cat-band">' +
      '<div class="cat-band-k">CATEGORY</div>' +
      '<div class="cat-band-b"><b>' + esc(cat.name) + '</b><span>' + esc(cat.desc) + '</span></div>' +
      '<div class="cat-band-tag">' + list.length + ' 个区块</div>' +
    '</div>';
  list.forEach(function (s, i) {
    let body = '';
    if (s.key === 'tasks') body = renderTasksPage();
    else if (s.key === 'library') body = renderLibraryPage();
    else if (s.key === 'koubo') body = renderKouboPage();
    else if (s.key === 'pixel') body = renderPixelPage();
    else if (s.key === 'draw') body = renderDrawPage();
    else if (s.key === 'report') body = renderReportPage();
    else if (s.key === 'radar') body = renderRadarPage();
    else body = '';
    html += '<section class="page-sec" id="sec-' + s.key + '">' +
      secHead({ no: pad2(i + 1), title: s.title, desc: s.desc }) + body + '</section>';
  });
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

  // 懒加载：图书馆 / 作品数据按需请求
  if (st.load.library === 'idle') loadLibrary();
  if (st.load.videos === 'idle') loadVideos();
  if (st.load.radar === 'idle') loadRadar();
  if (st.load.drafts === 'idle') loadDrafts();

  // 重排后按真实滚动位置校正侧栏高亮
  syncActiveSection();
}

function updateChrome() {
  const cat = CATS[st.group] || CATS.create;
  const page = PAGES[st.tab];
  document.getElementById('pageTitle').textContent =
    (st.tab === 'home' || !page) ? '个人工作台' : (cat.name + ' · ' + page.title);
  document.getElementById('pageDesc').textContent = (st.tab === 'home' || !page) ? cat.desc : page.desc;

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
  if (changed) renderView(true);
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
  const behavior = instant ? 'auto' : 'smooth';
  if (key === 'home') { window.scrollTo({ top: 0, behavior: behavior }); return; }
  const el = document.getElementById('sec-' + key);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 76;
  window.scrollTo({ top: Math.max(0, top), behavior: behavior });
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
