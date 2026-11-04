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
  image: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M3 16.5 8 12l4 3.5 3-2.5 6 5"/>'
};

function ic(name, cls) {
  return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICON_PATHS[name] || '') + '</svg>';
}

/* ---------------- 静态清单 ---------------- */
const WENAN = [
  { name: "一条视频五步做完（极简版）", date: "2026-11-01", size: "581KB", path: "文案/一条视频五步做完_极简版.docx", cat: "流程", tag: "拍摄/剪辑" },
  { name: "账号流程标准", date: "2026-11-01", size: "3.5MB", path: "文案/账号流程标准.docx", cat: "流程", tag: "账号/标准" },
  { name: "代买手机全流程", date: "2026-11-01", size: "11KB", path: "文案/代买手机全流程.docx", cat: "流程", tag: "代买/流程" },
  { name: "千川引流视频创作规则参考（3C 数码类）", date: "2026-11-01", size: "9KB", path: "文案/千川引流视频创作规则参考（3C数码类）.docx", cat: "规则", tag: "千川/3C数码" },
  { name: "郝金彪室内室外美颜参数", date: "2026-11-01", size: "4.1MB", path: "文案/郝金彪室内室外美颜参数.docx", cat: "参数", tag: "美颜/参数" },
  { name: "6G哥专用的表格", date: "2026-11-01", size: "767KB", path: "文案/6G哥专用的表格.xlsx", cat: "表格", tag: "表格/模板" },
  { name: "9月视频数据统计", date: "2026-11-01", size: "35KB", path: "文案/9月视频数据统计.xlsx", cat: "数据", tag: "数据/月度" }
];

/* ---------------- 页面配置 ---------------- */
const PAGES = {
  home:    { title: '主页',       desc: '工作台概览 · 数据来自飞书本地快照' },
  tasks:   { title: '任务与日历', desc: '飞书任务月历视图 · 支持筛选与分页', actions: ['refresh'] },
  library: { title: '图书馆',     desc: '藏书浏览 · 搜索与分页查看书摘和思考' },
  wenan:   { title: '文案库',     desc: '口播脚本 · 在线阅读与复制下载' },
  pixel:   { title: '像素工坊',   desc: '图片转像素风 · 去背导出透明 PNG' }
};

const PAGE_SIZE = { lib: 12, wenan: 10, task: 20 };

/* ---------------- 全局状态 ---------------- */
const st = {
  tab: 'home',
  feishu: null,
  library: null,
  load: { feishu: 'idle', library: 'idle' },
  err: { feishu: '', library: '' },
  cal: { cursor: null, selected: null, taskTab: 'all', taskCat: 'all', page: 1 },
  lib: { q: '', page: 1 },
  wenan: { q: '', cat: 'all', page: 1 },
  pixel: {
    src: '', name: '', img: null, out: null,
    size: 64, levels: 6, tol: 26, knock: true, scale: 8,
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
  const books = (st.library && st.library.books) || [];
  const ready = st.load.feishu === 'ready';

  const recent = info.tasks.slice()
    .filter(function (t) { return t.completed_at; })
    .sort(function (a, b) { return String(b.completed_at).localeCompare(String(a.completed_at)); })
    .slice(0, 6);

  const statItems = [
    { label: '任务总数', value: ready ? info.total : '—', hint: ready ? (info.earliest + ' ~ ' + info.latest) : '飞书任务清单' },
    { label: '已完成', value: ready ? info.completed : '—', hint: '全部完成' },
    { label: '待办', value: ready ? info.pending : '—', hint: '当前无逾期' },
    { label: '藏书', value: st.library ? books.length : '—', hint: '含书摘与思考' },
    { label: '文案', value: WENAN.length, hint: '口播 / 提示词' }
  ];

  const quick = [
    { go: 'tasks', icon: 'calendar', no: '01', cls: 'c1', title: '任务与日历', desc: '月历视图 · 按日期查看任务' },
    { go: 'library', icon: 'book', no: '02', cls: 'c2', title: '图书馆', desc: '搜索书名 · 阅读书摘与思考' },
    { go: 'wenan', icon: 'file', no: '03', cls: 'c3', title: '文案库', desc: '脚本在线阅读 · 复制与下载' },
    { go: 'pixel', icon: 'pixel', no: '04', cls: 'c4', title: '像素工坊', desc: '图片转像素 · 去背导出透明 PNG' }
  ];

  const marq = 'TASKS ✦ LIBRARY ✦ SCRIPTS ✦ PIXEL ✦ FEISHU ✦ AI ✦ EDIT ✦ DATA ✦ ';

  return '' +
    '<section class="fx-hero">' +
      '<div class="fx-hero-grid"></div>' +
      '<div class="fx-hero-glow"></div>' +
      '<div class="fx-hero-ring r1"></div>' +
      '<div class="fx-hero-ring r2"></div>' +
      '<div class="fx-hero-ghost">WORKBENCH</div>' +
      '<div class="fx-marquee m1"><div class="fx-track">' + marq + marq + '</div></div>' +
      '<div class="fx-marquee m2"><div class="fx-track rev">' + marq + marq + '</div></div>' +
      '<div class="fx-hero-inner">' +
        '<div class="fx-kicker"><i></i> DIGITAL WORKBENCH <em>EST · 2026</em><span>LOCAL FIRST</span></div>' +
        '<div class="fx-art"><img src="assets/img/px-octo.png" alt="" loading="lazy"></div>' +
        '<h1 class="fx-title">个人<span>工作台</span></h1>' +
        '<div class="fx-en">PERSONAL · WORKBENCH</div>' +
        '<p class="fx-note">任务、藏书与文案，收在一张安静的桌面上。</p>' +
        '<div class="fx-actions">' +
          '<button class="fx-btn primary" data-go="tasks">进入任务 <span>→</span></button>' +
          '<button class="fx-btn" data-go="library">浏览藏书</button>' +
        '</div>' +
        '<div class="fx-hero-stats">' +
          statItems.map(function (s) {
            return '<div class="fx-stat"><b>' + esc(String(s.value)) + '</b><span>' + esc(s.label) + '</span></div>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</section>' +
    '<div class="fx-section-head">' +
      '<div><div class="fx-eyebrow">EXPLORE · 4 SPACES</div>' +
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
    '<div class="tc-sec"><i></i>分类进度 · 点击筛选</div>' +
    '<div class="tc-cats">' +
      '<button class="tc-cat tc-cat-all' + (st.cal.taskCat === 'all' ? ' on' : '') + '" data-task-cat="all">' +
        '<div class="tc-cat-top"><span class="tc-dot"></span><span class="tc-cat-name">全部分类</span></div>' +
        '<div class="tc-cat-num"><b>' + info.completed + '</b><span>/ ' + info.total + '</span><em>' + donePct + '%</em></div>' +
        '<div class="tc-progress"><i style="width:' + donePct + '%"></i></div>' +
      '</button>' +
      catRows.map(function (c) {
        return '<button class="tc-cat t' + catTone(c.key) + (st.cal.taskCat === c.key ? ' on' : '') + '" data-task-cat="' + esc(c.key) + '">' +
          '<div class="tc-cat-top">' +
            '<span class="tc-dot"></span>' +
            '<span class="tc-cat-name">' + esc(c.key) + '</span>' +
            '<span class="tc-state' + (c.pct >= 100 ? ' done' : ' run') + '">' + (c.pct >= 100 ? '已完成' : '进行中') + '</span>' +
          '</div>' +
          '<div class="tc-cat-num"><b>' + c.done + '</b><span>/ ' + c.total + '</span><em>' + c.pct + '%</em></div>' +
          '<div class="tc-progress"><i style="width:' + c.pct + '%"></i></div>' +
        '</button>';
      }).join('') +
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
function renderLibraryPage() {
  if (st.load.library === 'loading') return stateHtml('loading', '正在读取图书数据');
  if (st.load.library === 'error') return stateHtml('error', '图书数据加载失败', st.err.library, '重试', 'data-action="retry-library"');
  const books = (st.library && st.library.books) || [];
  if (!books.length) return stateHtml('empty', '图书库为空', '请先同步飞书多维表格');

  const q = st.lib.q.toLowerCase();
  const list = books.filter(function (b) {
    if (!q) return true;
    return ((b.title || '') + ' ' + (b.author || '') + ' ' + (b.outline || '') + ' ' + (b.think || '')).toLowerCase().indexOf(q) >= 0;
  });

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE.lib));
  if (st.lib.page > totalPages) st.lib.page = 1;
  const pageList = list.slice((st.lib.page - 1) * PAGE_SIZE.lib, st.lib.page * PAGE_SIZE.lib);

  const toolbar = '<div class="toolbar">' +
    '<div class="search-wrap"><span class="search-ico">' + ic('search') + '</span>' +
    '<input class="input" id="libSearch" type="search" placeholder="搜索书名 / 作者 / 书摘 / 思考" value="' + esc(st.lib.q) + '"></div>' +
    '<span class="toolbar-note">共 ' + books.length + ' 本 · 当前 ' + list.length + ' 本</span>' +
    '</div>';

  const grid = pageList.length
    ? shelfRows(pageList)
    : stateHtml('empty', '没有找到匹配的图书', '换个关键词试试', '清空搜索', 'data-action="clear-lib"');

  return toolbar + '<div class="card shelf-card">' + grid + pagerHtml('lib', st.lib.page, PAGE_SIZE.lib, list.length) + '</div>';
}

function shelfRows(list) {
  const per = window.innerWidth <= 600 ? 3 : window.innerWidth <= 1200 ? 4 : 6;
  let out = '<div class="shelf-wrap">';
  for (let i = 0; i < list.length; i += per) {
    out += '<div class="shelf">' +
      '<div class="shelf-books">' + list.slice(i, i + per).map(bookSpine).join('') + '</div>' +
      '<div class="shelf-plank"></div>' +
      '</div>';
  }
  return out + '</div>';
}

/* 每本书按标题做确定性扰动：宽度/高度/倾角略有差别，像真实书架 */
function bookVar(title) {
  let h = 0;
  const s = String(title || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h % 4;
}

function bookSpine(b) {
  const id = b.id || b.title;
  const title = b.title || '未命名';
  const author = b.author || '未知作者';
  const hasCover = b.cover && b.hasCover !== false;
  const face = hasCover
    ? '<img src="' + esc(b.cover) + '" alt="' + esc(title) + '" loading="lazy">'
    : '<div class="spine-fallback"><span>' + esc(title) + '</span><i>' + esc(author) + '</i></div>';

  return '<div class="book-shelf-item kv' + bookVar(title) + '" data-book="' + esc(id) + '" tabindex="0" role="button" aria-label="' + esc(title) + '">' +
    '<div class="book-face">' + face + '</div>' +
    '<div class="book-tip"><strong>' + esc(title) + '</strong><span>' + esc(author) + (b.date ? ' · ' + esc(b.date) : '') + '</span></div>' +
    '</div>';
}

/* ---------------- 文案库 ---------------- */
function renderWenanPage() {
  const q = st.wenan.q.toLowerCase();
  const cats = ['all'].concat(Array.from(new Set(WENAN.map(function (d) { return d.cat; }))));
  const list = WENAN.filter(function (d) {
    if (st.wenan.cat !== 'all' && d.cat !== st.wenan.cat) return false;
    if (!q) return true;
    return ((d.name || '') + ' ' + (d.tag || '') + ' ' + d.cat).toLowerCase().indexOf(q) >= 0;
  });

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE.wenan));
  if (st.wenan.page > totalPages) st.wenan.page = 1;
  const pageList = list.slice((st.wenan.page - 1) * PAGE_SIZE.wenan, st.wenan.page * PAGE_SIZE.wenan);

  const toolbar = '<div class="toolbar">' +
    '<div class="search-wrap"><span class="search-ico">' + ic('search') + '</span>' +
    '<input class="input" id="wenanSearch" type="search" placeholder="搜索文案名称 / 标签" value="' + esc(st.wenan.q) + '"></div>' +
    '<span class="toolbar-note">共 ' + WENAN.length + ' 份</span>' +
    '</div>' +
    '<div class="toolbar">' + cats.map(function (c) {
      return '<button class="chip' + (st.wenan.cat === c ? ' active' : '') + '" data-wcat="' + esc(c) + '">' + (c === 'all' ? '全部' : esc(c)) + '</button>';
    }).join('') + '</div>';

  const rows = pageList.length
    ? wenanShelves(pageList)
    : stateHtml('empty', '没有匹配的文案', '换个关键词或分类', '清空筛选', 'data-action="clear-wenan"');

  return toolbar + '<div class="card shelf-card">' + rows + pagerHtml('wenan', st.wenan.page, PAGE_SIZE.wenan, list.length) + '</div>';
}

/* 文案库：文档也立到书架上，用带大字的彩色书皮区分分类 */
const WENAN_TONE = { '流程': 0, '规则': 1, '参数': 2, '表格': 3, '数据': 4 };

function wenanShelves(list) {
  const per = window.innerWidth <= 600 ? 3 : window.innerWidth <= 900 ? 3 : 4;
  let out = '<div class="shelf-wrap">';
  for (let i = 0; i < list.length; i += per) {
    out += '<div class="shelf">' +
      '<div class="shelf-books">' + list.slice(i, i + per).map(wenanBook).join('') + '</div>' +
      '<div class="shelf-plank"></div>' +
      '</div>';
  }
  return out + '</div>';
}

function wenanBook(d) {
  const idx = WENAN.indexOf(d);
  const tone = WENAN_TONE[d.cat] != null ? WENAN_TONE[d.cat] : 5;
  return '<div class="wb-item kv' + bookVar(d.name) + '" data-wenan="' + idx + '" tabindex="0" role="button" aria-label="' + esc(d.name) + '">' +
    '<div class="wb-cover wb-t' + tone + '">' +
      '<span class="wb-cat">' + esc(d.cat) + '</span>' +
      '<span class="wb-title">' + esc(d.name) + '</span>' +
      '<span class="wb-foot"><i>' + esc(d.tag) + '</i><b>' + esc(d.size) + '</b></span>' +
    '</div>' +
    '<div class="book-tip"><strong>' + esc(d.name) + '</strong><span>' + esc(d.date) + ' · ' + esc(d.size) + '</span></div>' +
  '</div>';
}

/* ---------------- 像素工坊（图片 → 像素风 · 透明背景导出） ---------------- */
const PX_DEFAULT = { size: 64, levels: 6, tol: 26, knock: true, scale: 8 };

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
        '<div class="px-stat"><i>导出格式</i><b>PNG · 透明通道</b></div>' +
        '<div class="px-stat"><i>自动去背</i><b data-px-knocklabel>' + (p.knock ? '已开启' : '已关闭') + '</b></div>' +
      '</div>' +
    '</div>' +
    '<aside class="px-panel">' +
      '<div class="px-panel-head"><b>像素参数</b><span>LIVE</span></div>' +
      pxCtrl('size', '像素密度', p.size, 16, 160, 8, 'px', '数值越小，方块越大，像素味越重') +
      pxCtrl('levels', '色阶', p.levels, 2, 12, 1, '级', '每通道阶数，越低越像复古游戏') +
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

/* 降采样到像素网格：块内按 alpha 加权取均值 → 色阶量化 → 整数倍放大 */
function pxRender() {
  const p = st.pixel;
  const img = p.img;
  if (!img || !img.naturalWidth) return;

  const iw = img.naturalWidth, ih = img.naturalHeight;
  const pw = Math.max(8, Math.min(200, Math.round(p.size)));
  const ph = Math.max(1, Math.round(pw * ih / iw));

  const MAXW = 1280;
  const k = Math.min(1, MAXW / Math.max(iw, ih));
  const ww = Math.max(1, Math.round(iw * k));
  const wh = Math.max(1, Math.round(ih * k));

  const wc = document.createElement('canvas');
  wc.width = ww; wc.height = wh;
  const wctx = wc.getContext('2d', { willReadFrequently: true });
  wctx.clearRect(0, 0, ww, wh);
  wctx.drawImage(img, 0, 0, ww, wh);
  let data = wctx.getImageData(0, 0, ww, wh).data;
  if (p.knock) data = pxKnock(data, ww, wh, p.tol);

  const out = new Uint8ClampedArray(pw * ph * 4);
  const stepX = ww / pw, stepY = wh / ph;
  const lv = Math.max(2, Math.round(p.levels));
  const step = 255 / (lv - 1);
  const qz = function (v) { return Math.round(Math.round(v / step) * step); };

  for (let oy = 0; oy < ph; oy++) {
    const y0 = Math.floor(oy * stepY);
    const y1 = Math.max(y0 + 1, Math.floor((oy + 1) * stepY));
    for (let ox = 0; ox < pw; ox++) {
      const x0 = Math.floor(ox * stepX);
      const x1 = Math.max(x0 + 1, Math.floor((ox + 1) * stepX));
      let sr = 0, sg = 0, sb = 0, sw = 0, total = 0, solid = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * ww + x) * 4;
          const a = data[i + 3];
          total++;
          if (a > 0) {
            sr += data[i] * a; sg += data[i + 1] * a; sb += data[i + 2] * a;
            sw += a; solid++;
          }
        }
      }
      const o = (oy * pw + ox) * 4;
      const cov = total ? solid / total : 0;
      if (cov < 0.5 || !sw) { out[o] = 0; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 0; continue; }
      out[o] = qz(sr / sw);
      out[o + 1] = qz(sg / sw);
      out[o + 2] = qz(sb / sw);
      out[o + 3] = 255;
    }
  }

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
  const cfg = [p.size, p.levels, p.tol, p.knock ? 1 : 0, p.scale].join('|');
  if (!p.out || p.sigSrc !== p.src || p.sigCfg !== cfg) {
    pxRender();
    p.sigSrc = p.src;
    p.sigCfg = cfg;
  }
  pxApply();

  const spec = p.outW ? (p.pw + ' × ' + p.ph + ' → ' + p.outW + ' × ' + p.outH + ' px') : '等待图片';
  const specEl = document.querySelector('[data-px-spec]');
  if (specEl) specEl.textContent = spec;
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
    pxLoadUrl('assets/img/px-octo.png', '示例 · 像素章鱼');
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

/* ---------------- 视图渲染（一页到底，各区块纵向串联） ---------------- */
const SECTIONS = [
  { key: 'tasks', no: '01', title: '任务与日历', desc: '飞书任务月历 · 按日期筛选查看' },
  { key: 'library', no: '02', title: '图书馆', desc: '藏书、书摘与思考' },
  { key: 'wenan', no: '03', title: '文案库', desc: '口播脚本与流程文档' },
  { key: 'pixel', no: '04', title: '像素工坊', desc: '图片转像素风 · 自动去背导出透明 PNG' }
];

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

function renderView(keepScroll) {
  const view = document.getElementById('view');
  if (!view) return;
  const y = window.scrollY;

  let html = renderHome();
  SECTIONS.forEach(function (s) {
    let body = '';
    if (s.key === 'tasks') body = renderTasksPage();
    else if (s.key === 'library') body = renderLibraryPage();
    else if (s.key === 'wenan') body = renderWenanPage();
    else body = renderPixelPage();
    html += '<section class="page-sec" id="sec-' + s.key + '">' + secHead(s) + body + '</section>';
  });
  view.innerHTML = html;

  if (keepScroll) window.scrollTo(0, y);

  // 像素工坊：重绘画布并重新绑定控件
  mountPixel();

  // 懒加载：图书馆数据按需请求
  if (st.load.library === 'idle') loadLibrary();
}

function updateChrome() {
  document.getElementById('pageTitle').textContent = '个人工作台';
  document.getElementById('pageDesc').textContent = '任务 · 藏书 · 文案 · 像素，一页看完';

  const actions = document.getElementById('pageActions');
  actions.innerHTML = '<button class="btn btn-sm" data-action="refresh"' + (st.load.feishu === 'loading' ? ' disabled' : '') + '>' +
    ic('refresh', 'ico-14') + '<span>刷新数据</span></button>';

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
  openModal({
    title: b.title || '未命名',
    meta: [b.author, b.date],
    from: from,
    body:
      '<div class="doc-sec"><div class="doc-kicker">摘录 / Outline</div>' +
        '<div style="white-space:pre-wrap;">' + esc(b.outline || '（暂无书摘）') + '</div></div>' +
      '<div class="doc-sec"><div class="doc-kicker">我的思考 / Notes</div>' +
        '<div style="white-space:pre-wrap;">' + esc(b.think || '（暂无个人思考）') + '</div></div>' +
      (!b.outline && !b.think ? '<div class="modal-note">该图书条目仅包含基础信息，暂无书摘与思考内容。</div>' : '')
  });
}

let mammothPromise = null;
function ensureMammoth() {
  if (window.mammoth) return Promise.resolve();
  if (mammothPromise) return mammothPromise;
  mammothPromise = new Promise(function (resolve, reject) {
    // 优先本地文件，失败再回退 CDN
    const urls = [
      'assets/vendor/mammoth.browser.min.js',
      'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js'
    ];
    let i = 0;
    function next() {
      if (window.mammoth) { resolve(); return; }
      if (i >= urls.length) { reject(new Error('文档解析组件加载失败，请检查网络')); return; }
      const s = document.createElement('script');
      s.src = urls[i++];
      s.onload = function () { if (window.mammoth) resolve(); else next(); };
      s.onerror = function () { next(); };
      document.head.appendChild(s);
    }
    next();
    setTimeout(function () { if (!window.mammoth) reject(new Error('文档解析组件加载超时')); }, 15000);
  });
  return mammothPromise;
}

/* ---------- 表格在线预览 ---------- */
const SHEET_PAGE_ROWS = 300;
const SHEET_MAX_COLS = 40;
let sheetView = null;
let xlsxPromise = null;

function ensureXLSX() {
  if (window.XLSX) return Promise.resolve();
  if (xlsxPromise) return xlsxPromise;
  xlsxPromise = new Promise(function (resolve, reject) {
    // 优先本地文件，失败再回退 CDN
    const urls = [
      'assets/vendor/xlsx.full.min.js',
      'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
    ];
    let i = 0;
    function next() {
      if (window.XLSX) { resolve(); return; }
      if (i >= urls.length) { reject(new Error('表格解析组件加载失败，请检查网络')); return; }
      const s = document.createElement('script');
      s.src = urls[i++];
      s.onload = function () { if (window.XLSX) resolve(); else next(); };
      s.onerror = function () { next(); };
      document.head.appendChild(s);
    }
    next();
    setTimeout(function () { if (!window.XLSX) reject(new Error('表格解析组件加载超时')); }, 20000);
  });
  return xlsxPromise;
}

function openSheet(d, dlBtn, from) {
  sheetView = null;
  openModal({
    title: d.name,
    meta: [d.cat, d.date, d.size, d.tag],
    tools: dlBtn,
    wide: true,
    from: from,
    body: '<div class="state"><div class="spinner"></div>正在解析表格…</div>'
  });

  fetch(encodeURI(d.path))
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
    .then(function (buf) {
      return ensureXLSX().then(function () {
        const wb = window.XLSX.read(new Uint8Array(buf), { type: 'array' });
        if (!wb.SheetNames.length) throw new Error('工作簿中没有工作表');
        sheetView = { wb: wb, name: wb.SheetNames[0], shown: SHEET_PAGE_ROWS };
        renderSheet(wb.SheetNames[0]);
      });
    })
    .catch(function (err) {
      const body = document.getElementById('modalBody');
      if (body) {
        body.innerHTML = '<div class="state"><strong>无法在线读取表格</strong>' +
          '<div>' + esc(err.message || '未知错误') + '</div>' +
          '<div class="modal-note">若线上文件缺失会返回 404，可点击右上角「下载」获取原文件。</div></div>';
      }
    });
}

function renderSheet(name) {
  if (!sheetView || !sheetView.wb) return;
  const XLSX = window.XLSX;
  const ws = sheetView.wb.Sheets[name];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '', blankrows: false });
  const totalRows = aoa.length;
  // 只统计真正有内容的列，避免把右侧空白但带格式的列也渲染出来
  let totalCols = 0;
  aoa.forEach(function (r) {
    for (let i = (r || []).length - 1; i >= 0; i--) {
      if (String(r[i] == null ? '' : r[i]).trim()) { if (i + 1 > totalCols) totalCols = i + 1; break; }
    }
  });
  const cols = Math.min(totalCols, SHEET_MAX_COLS);
  const shown = Math.min(sheetView.shown, totalRows);

  const body = document.getElementById('modalBody');
  if (!body) return;

  // 列宽策略：能压到 100px 以上就铺满容器，否则按 100px 固定并横向滚动
  const avail = Math.max(320, body.clientWidth - 52);
  const minColW = 100;
  const fits = cols * minColW <= avail;
  const tableStyle = fits ? 'width:100%' : 'width:' + (cols * minColW) + 'px';
  const colgroup = fits ? ''
    : '<colgroup>' + Array.from({ length: cols }, function () { return '<col style="width:' + minColW + 'px">'; }).join('') + '</colgroup>';

  const tabs = sheetView.wb.SheetNames.map(function (n) {
    return '<button class="sheet-tab' + (n === name ? ' active' : '') + '" data-sheet="' + esc(n) + '">' + esc(n) + '</button>';
  }).join('');

  let html = '<div class="sheet-bar">' +
      '<div class="sheet-tabs">' + tabs + '</div>' +
      '<div class="sheet-info">' + totalRows + ' 行 × ' + cols + ' 列' +
        (shown < totalRows ? ' · 已显示 ' + shown + ' 行' : '') +
        (totalCols > cols ? ' · 仅显示前 ' + cols + ' 列' : '') +
      '</div>' +
    '</div>';

  if (!totalRows) {
    html += '<div class="state"><strong>该工作表为空</strong><div>可切换其他工作表或下载原文件查看。</div></div>';
  } else {
    html += '<div class="sheet-wrap"><table class="sheet-table" style="' + tableStyle + '">' + colgroup;
    for (let r = 0; r < shown; r++) {
      const row = aoa[r] || [];
      html += '<tr' + (r === 0 ? ' class="sheet-head"' : '') + '>';
      for (let c = 0; c < cols; c++) {
        const v = row[c] == null ? '' : String(row[c]);
        html += '<td>' + esc(v) + '</td>';
      }
      html += '</tr>';
    }
    html += '</table></div>';
    if (shown < totalRows) {
      html += '<div class="sheet-more"><button class="btn btn-sm" data-sheet-more>显示更多（剩余 ' + (totalRows - shown) + ' 行）</button></div>';
    }
  }

  html += '<div class="modal-note">表格按原值渲染，合并单元格、字体颜色与图片不保留；行列过多时会分批显示，完整内容请用右上角「下载」在 Excel / WPS 中打开。</div>';

  body.innerHTML = html;
  body.scrollTop = 0;

  body.querySelectorAll('[data-sheet]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const n = btn.getAttribute('data-sheet');
      if (n === sheetView.name) return;
      sheetView.name = n;
      sheetView.shown = SHEET_PAGE_ROWS;
      renderSheet(n);
    });
  });
  const more = body.querySelector('[data-sheet-more]');
  if (more) {
    more.addEventListener('click', function () {
      sheetView.shown += SHEET_PAGE_ROWS;
      renderSheet(sheetView.name);
    });
  }
}

function openWenan(idx, from) {
  const d = WENAN[idx];
  if (!d) return;

  const isSheet = /\.(xlsx|xls)$/i.test(d.path);
  const dlBtn = '<a class="btn btn-sm" href="' + encodeURI(d.path) + '" download>' + ic('download', 'ico-14') + '<span>下载</span></a>';

  if (isSheet) {
    openSheet(d, dlBtn, from);
    return;
  }

  openModal({
    title: d.name,
    meta: [d.cat, d.date, d.size, d.tag],
    tools: '<button class="btn btn-sm" data-copy>' + ic('copy', 'ico-14') + '<span>复制</span></button>' + dlBtn,
    from: from,
    body: '<div class="state"><div class="spinner"></div>正在读取文档…</div>'
  });

  let plainText = '';
  fetch(encodeURI(d.path))
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
    .then(function (buf) { return ensureMammoth().then(function () { return buf; }); })
    .then(function (buf) { return window.mammoth.convertToHtml({ arrayBuffer: buf }); })
    .then(function (res) {
      plainText = (res.value || '').replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
      const body = document.getElementById('modalBody');
      if (body) {
        body.innerHTML = res.value
          ? '<div class="doc-sec doc-flow">' + res.value + '</div>'
          : '<div class="state">文档内容为空</div>';
      }
    })
    .catch(function (err) {
      const body = document.getElementById('modalBody');
      if (body) {
        body.innerHTML = '<div class="state"><strong>无法在线读取文档</strong>' +
          '<div>' + esc(err.message || '未知错误') + '</div>' +
          '<div class="modal-note">线上版需要文档文件已随站点部署；若文件缺失会返回 404。可点击右上角「下载」获取原文件。</div></div>';
      }
    });

  const copyBtn = document.querySelector('[data-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!plainText) { toast('文档尚未读取完成', 'err'); return; }
      copyText(plainText);
    });
  }
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

function switchTab(key) {
  if (!PAGES[key]) key = 'home';
  st.tab = key;
  if (location.hash !== '#' + key) {
    try { history.replaceState(null, '', '#' + key); } catch (e) { location.hash = key; }
  }
  updateChrome();
  scrollToSection(key);
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
  const pg = t.closest('.pager-btn');
  if (pg && !pg.disabled) {
    const scope = pg.dataset.pageScope;
    const page = Number(pg.dataset.page);
    if (scope === 'task') { if (page >= 1) { st.cal.page = page; } }
    else if (['lib', 'wenan'].indexOf(scope) >= 0) { st[scope].page = page; }
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

  // 文案分类
  const wc = t.closest('[data-wcat]');
  if (wc) { st.wenan.cat = wc.dataset.wcat; st.wenan.page = 1; renderView(true); return; }

  // 动作按钮
  const act = t.closest('[data-action]');
  if (act) {
    const a = act.dataset.action;
    if (a === 'refresh') { loadFeishu(true); return; }
    if (a === 'retry-feishu') { loadFeishu(true); return; }
    if (a === 'retry-library') { st.load.library = 'idle'; loadLibrary(); return; }
    if (a === 'clear-lib') { st.lib.q = ''; st.lib.page = 1; renderView(true); return; }
    if (a === 'clear-wenan') { st.wenan.q = ''; st.wenan.cat = 'all'; st.wenan.page = 1; renderView(true); return; }
  }

  // 详情入口
  const bk = t.closest('.book-shelf-item');
  if (bk) { openBook(bk.dataset.book, bk); return; }
  const wd = t.closest('[data-wenan]');
  if (wd) { openWenan(Number(wd.dataset.wenan), wd); return; }

  // 跳转
  const go = t.closest('[data-go]');
  if (go) { switchTab(go.dataset.go); return; }
}

let searchTimer = null;
function onViewInput(e) {
  const el = e.target;
  const map = { libSearch: 'lib', wenanSearch: 'wenan' };
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
    if (h && PAGES[h]) {
      st.tab = h;
      updateChrome();
      scrollToSection(h);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
