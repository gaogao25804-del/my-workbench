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
  inbox: '<path d="M3 12.5 5.5 5.5h13L21 12.5v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/><path d="M3 12.5h5l1.5 2.5h5l1.5-2.5h5"/>'
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
  wenan:   { title: '文案库',     desc: '口播脚本 · 在线阅读与复制下载' }
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
  wenan: { q: '', cat: 'all', page: 1 }
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
    { go: 'tasks', icon: 'calendar', title: '任务与日历', desc: '月历视图 · 按日期查看任务' },
    { go: 'library', icon: 'book', title: '图书馆', desc: '搜索书名 · 阅读书摘与思考' },
    { go: 'wenan', icon: 'file', title: '文案库', desc: '脚本在线阅读 · 复制与下载' }
  ];

  return '' +
    '<section class="home-hero">' +
      '<div class="hero-copy">' +
        '<div class="hero-head">' +
          '<div class="hero-kicker"><span class="px-dot"></span>DIGITAL WORKBENCH · EST 2026</div>' +
          '<div class="hero-badge">' +
            '<svg viewBox="0 0 16 16"><g fill="#8ba0d8"><rect x="1" y="9" width="3" height="3"/><rect x="4" y="6" width="3" height="6"/><rect x="8" y="3" width="3" height="9"/></g><rect x="12" y="7" width="2" height="5" fill="#c9d4ee"/><rect x="1" y="12" width="13" height="1.5" fill="#3d4d85"/></svg>' +
            '<span>EST. 2026<br>LOCAL FIRST</span>' +
          '</div>' +
        '</div>' +
        '<div class="hero-title">你好，这里是<br>个人工作台<span class="px-mark">' +
          '<svg viewBox="0 0 16 16"><g fill="#9fb0dd"><rect x="6" y="0" width="4" height="3"/><rect x="6" y="13" width="4" height="3"/><rect x="0" y="6" width="3" height="4"/><rect x="13" y="6" width="3" height="4"/><rect x="2" y="2" width="3" height="3"/><rect x="11" y="2" width="3" height="3"/><rect x="2" y="11" width="3" height="3"/><rect x="11" y="11" width="3" height="3"/></g><rect x="6" y="6" width="4" height="4" fill="#3d4d85"/></svg>' +
        '</span></div>' +
        '<div class="hero-rule"></div>' +
        '<div class="hero-note">任务、藏书与文案，收在一张安静的桌面上。</div>' +
        '<div class="hero-actions">' +
          '<button class="btn hero-btn primary" data-go="tasks"><span>查看任务</span></button>' +
          '<button class="btn hero-btn" data-go="library"><span>浏览藏书</span><i>✦</i></button>' +
        '</div>' +
      '</div>' +
      '<div class="hero-art"><img src="assets/img/px-flower.png" alt="" loading="lazy"></div>' +
    '</section>' +
    '<div class="ornament"><span>Made with care</span><i>✿</i><span>Pixel by pixel</span><i>✿</i><span>Built to last</span></div>' +
    '<div class="stat-grid">' +
      statItems.map(function (s) {
        return '<div class="stat"><div class="stat-label">' + esc(s.label) + '</div>' +
          '<div class="stat-value">' + esc(String(s.value)) + '</div>' +
          '<div class="stat-hint">' + esc(s.hint) + '</div></div>';
      }).join('') +
    '</div>' +
    '<div class="quick-grid" style="margin-top:18px;">' +
      quick.map(function (q) {
        return '<div class="quick-card" data-go="' + q.go + '">' +
          '<div class="quick-ico">' + ic(q.icon) + '</div>' +
          '<div><div class="qc-title">' + esc(q.title) + '</div>' +
          '<div class="qc-desc">' + esc(q.desc) + '</div></div></div>';
      }).join('') +
    '</div>' +
    '<div class="card">' +
      '<div class="card-head"><div class="card-title">最近完成的任务</div>' +
        '<div class="card-head-actions"><button class="btn btn-sm btn-ghost" data-go="tasks">查看全部</button></div>' +
      '</div>' +
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
  const catMax = catKeys.length ? cats[catKeys[0]] : 1;

  const taskHtml = '<div class="card poster-card">' +
    '<div class="pz-head">' +
      '<div class="pz-kicker">Task Center · ' + esc((info.latest || '2026').slice(0, 4)) + '</div>' +
      '<div class="pz-title">任务中心</div>' +
      (info.earliest ? '<div class="pz-sub">' + esc(info.earliest) + ' — ' + esc(info.latest) + '，按分类与月份归集的工作记录</div>' : '') +
      '<div class="pz-stats">' +
        '<div class="pz-stat"><b>' + info.total + '</b><span>Total · 全部</span></div>' +
        '<div class="pz-stat"><b>' + info.completed + '</b><span>Done · 已完成</span></div>' +
        '<div class="pz-stat"><b>' + info.pending + '</b><span>Pending · 待办</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="pz-body">' +
      '<div class="pz-left">' +
        catCloud(cats, catKeys, catMax, st.cal.taskCat, info.total) +
        '<div class="pz-sec"><i></i>按月分布</div>' +
        '<div class="pz-bars">' + monthBars(info.tasks) + '</div>' +
      '</div>' +
      '<div class="pz-side">' +
        '<div class="pz-sec"><i></i>按分类 · 点击筛选</div>' +
        '<div class="pz-legend">' + catKeys.map(function (k) {
          return '<button class="pz-leg' + (st.cal.taskCat === k ? ' on' : '') + '" data-task-cat="' + esc(k) + '">' +
            '<span class="pz-dot"></span>' +
            '<span class="pz-name">' + esc(k) + '</span>' +
            '<span class="pz-bar"><i style="width:' + Math.round(cats[k] / catMax * 100) + '%"></i></span>' +
            '<span class="pz-num">' + cats[k] + '</span>' +
            '</button>';
        }).join('') + '</div>' +
      '</div>' +
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
    (pageList.length ? '<div class="task-list">' + pageList.map(function (t) { return taskRow(t); }).join('') + '</div>'
      : stateHtml('empty', '没有符合条件的任务', '换个筛选条件试试')) +
    pagerHtml('task', st.cal.page, PAGE_SIZE.task, list.length) +
    '</div>';

  return syncCard(info) +
    '<div class="two-col" style="margin-bottom:14px;">' + calHtml + dayHtml + '</div>' +
    taskHtml;
}

function taskRow(t) {
  const done = t.status === 'completed';
  const when = done ? fmtDateTime(t.completed_at) : fmtDateTime(t.due);
  return '<div class="task-row' + (done ? ' done' : '') + '">' +
    '<div class="task-check' + (done ? ' done' : '') + '">' + (done ? ic('check', 'ico-12') : '') + '</div>' +
    '<div class="task-text">' + esc(t.summary || '—') + '</div>' +
    (t.category ? '<span class="task-tag">' + esc(t.category) + '</span>' : '') +
    (when ? '<div class="task-date">' + esc(when) + '</div>' : '') +
    '</div>';
}

/* 分类星图：按数量大小排成内外两圈气泡，点击即筛选 */
function catCloud(cats, keys, max, active, total) {
  const n = keys.length;
  if (!n) return '';
  const n1 = Math.floor(n / 2);
  const n0 = n - n1;
  let i0 = 0, i1 = 0;

  const bubbles = keys.map(function (k, i) {
    const outer = i % 2 === 1;
    const count = outer ? n1 : n0;
    const idx = outer ? i1++ : i0++;
    const ring = outer ? 46 : 32;
    const ang = (-90 + 360 * idx / Math.max(1, count)) * Math.PI / 180;
    const cx = 50 + Math.cos(ang) * ring;
    const cy = 50 + Math.sin(ang) * ring;
    const size = Math.round(14 + Math.sqrt(cats[k] / max) * 44);

    return '<button class="pz-bub' + (active === k ? ' on' : '') + '"' +
      ' style="left:' + cx.toFixed(2) + '%;top:' + cy.toFixed(2) + '%;--bs:' + size + 'px"' +
      ' data-task-cat="' + esc(k) + '" title="' + esc(k + ' · ' + cats[k] + ' 条') + '">' +
      (size >= 26 ? '<b>' + cats[k] + '</b>' : '') + (size >= 44 ? '<i>' + esc(k) + '</i>' : '') +
      '</button>';
  }).join('');

  return '<div class="pz-radial">' +
    '<span class="pz-ring r1"></span><span class="pz-ring r2"></span>' +
    '<button class="pz-center' + (active === 'all' ? ' on' : '') + '" data-task-cat="all" title="全部任务 ' + total + ' 条">' +
      '<b>' + total + '</b><i>ALL</i></button>' +
    bubbles +
    '</div>';
}

/* 按月柱状：细柱 + 顶部数值，对应海报底部的细长条形图 */
function monthBars(tasks) {
  const map = {};
  tasks.forEach(function (t) {
    const m = String(t.completed_at || t.due || '').slice(0, 7);
    if (m) map[m] = (map[m] || 0) + 1;
  });
  const months = Object.keys(map).sort();
  if (!months.length) return '';
  const max = Math.max.apply(null, months.map(function (m) { return map[m]; }));

  return months.map(function (m) {
    const mon = Number(m.slice(5, 7));
    return '<div class="pz-col">' +
      '<span class="pz-col-n">' + map[m] + '</span>' +
      '<div class="pz-col-track"><span class="pz-col-bar" style="height:' + Math.max(2, Math.round(map[m] / max * 100)) + '%"></span></div>' +
      '<span class="pz-col-l">' + mon + '月</span>' +
      '</div>';
  }).join('');
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

/* ---------------- 视图渲染（一页到底，各区块纵向串联） ---------------- */
const SECTIONS = [
  { key: 'tasks', no: '01', title: '任务与日历', desc: '飞书任务月历 · 按日期筛选查看', art: 'assets/img/px-octo.png' },
  { key: 'library', no: '02', title: '图书馆', desc: '藏书、书摘与思考', art: 'assets/img/px-icons.png' },
  { key: 'wenan', no: '03', title: '文案库', desc: '口播脚本与流程文档' }
];

function secHead(s) {
  return '<div class="sec-head">' +
    '<div class="sec-head-copy">' +
      '<div class="sec-kicker">' + s.no + ' · SECTION</div>' +
      '<div class="sec-h-title">' + esc(s.title) + '</div>' +
      '<div class="sec-desc">' + esc(s.desc) + '</div>' +
    '</div>' +
    (s.art ? '<div class="sec-art' + (s.key === 'library' ? ' framed' : '') + '"><img src="' + s.art + '" alt="" loading="lazy"></div>' : '') +
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
    else body = renderWenanPage();
    html += '<section class="page-sec" id="sec-' + s.key + '">' + secHead(s) + body + '</section>';
  });
  view.innerHTML = html;

  if (keepScroll) window.scrollTo(0, y);

  // 懒加载：图书馆数据按需请求
  if (st.load.library === 'idle') loadLibrary();
}

function updateChrome() {
  document.getElementById('pageTitle').textContent = '个人工作台';
  document.getElementById('pageDesc').textContent = '任务 · 藏书 · 文案，一页看完';

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
