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
  { name: "KOC-账号名称-脚本-8月抖音", date: "2026-08-17", size: "28KB", path: "文案/KOC-账号名称-脚本-8月抖音.docx", cat: "脚本", tag: "抖音/KOC" },
  { name: "即梦图生视频提示词-结婚10周年", date: "2026-08-18", size: "23KB", path: "文案/即梦图生视频提示词-结婚10周年.docx", cat: "提示词", tag: "即梦/婚礼" },
  { name: "理想L7ULTRA一年用车小报告", date: "2026-07-26", size: "14KB", path: "文案/理想L7ULTRA一年用车小报告.docx", cat: "评测", tag: "理想/用车" },
  { name: "08.12_MateX8猜想", date: "2026-08-13", size: "12KB", path: "文案/08.12_MateX8猜想.docx", cat: "数码", tag: "华为/折叠屏" },
  { name: "08.12_MateX8猜想（备档）", date: "2026-08-13", size: "12KB", path: "文案/08.12_MateX8猜想--------.docx", cat: "数码", tag: "备档" },
  { name: "08.12_猜想Mate90RS", date: "2026-08-13", size: "11KB", path: "文案/08.12_猜想Mate90RS.docx", cat: "数码", tag: "华为/Mate90RS" },
  { name: "08.12_猜想Mate90RS（备档）", date: "2026-08-13", size: "12KB", path: "文案/08.12_猜想Mate90RS-------.docx", cat: "数码", tag: "备档" },
  { name: "08.12_拉米酷指环扣", date: "2026-08-12", size: "11KB", path: "文案/08.12_拉米酷指环扣.docx", cat: "数码配件", tag: "指环扣" },
  { name: "2026.7.23-三星zfold8", date: "2026-07-23", size: "10KB", path: "文案/2026.7.23-三星zfold8.docx", cat: "数码", tag: "三星/Z Fold8" },
  { name: "2026.7.23三台阔折叠对比", date: "2026-07-23", size: "11KB", path: "文案/2026.7.23三台阔折叠对比.docx", cat: "数码", tag: "横向对比/折叠屏" }
];

const FILE_ICON = { '脚本': 'file', '提示词': 'file', '评测': 'file', '数码': 'file', '数码配件': 'file' };

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
  renderView();
  try {
    st.feishu = await fetchJSON('feishu-data.json');
    st.load.feishu = 'ready';
  } catch (e) {
    st.load.feishu = 'error';
    st.err.feishu = e.message || '加载失败';
  }
  updateChrome();
  renderView();
  if (showToast) {
    if (st.load.feishu === 'ready') toast('数据已刷新', 'ok');
    else toast('刷新失败：' + st.err.feishu, 'err');
  }
}

async function loadLibrary() {
  if (st.load.library === 'loading' || st.load.library === 'ready') return;
  st.load.library = 'loading';
  st.err.library = '';
  renderView();
  try {
    st.library = await fetchJSON('library-data.json');
    st.load.library = 'ready';
  } catch (e) {
    st.load.library = 'error';
    st.err.library = e.message || '加载失败';
  }
  updateChrome();
  renderView();
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
    '<div class="stat-grid">' +
      statItems.map(function (s) {
        return '<div class="stat"><div class="stat-label">' + esc(s.label) + '</div>' +
          '<div class="stat-value">' + esc(String(s.value)) + '</div>' +
          '<div class="stat-hint">' + esc(s.hint) + '</div></div>';
      }).join('') +
    '</div>' +
    syncCard(info) +
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

  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
  const calHtml = '<div class="card">' +
    '<div class="cal-head">' +
      '<div class="cal-month">' + st.cal.cursor.getFullYear() + ' 年 ' + (st.cal.cursor.getMonth() + 1) + ' 月</div>' +
      '<div class="cal-nav">' +
        '<button class="icon-btn" data-cal="prev" aria-label="上个月">' + ic('chevL') + '</button>' +
        '<button class="btn btn-sm btn-ghost" data-cal="today">回到最新</button>' +
        '<button class="icon-btn" data-cal="next" aria-label="下个月">' + ic('chevR') + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="cal-weekdays">' + weekdays.map(function (w) { return '<div>' + w + '</div>'; }).join('') + '</div>' +
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

        const marks = groups.slice(0, 2).map(function (g) {
          return '<span class="cal-mark' + (g.ev ? ' ev' : '') + '">' + esc(g.label) + ' ' + g.n + '</span>';
        }).join('');
        const more = groups.length > 2 ? '<span class="cal-more">+' + (groups.length - 2) + '</span>' : '';
        return '<div class="cal-cell' + (c.other ? ' other' : '') + (isSel ? ' selected' : '') + (isToday ? ' today' : '') +
          '" data-date="' + c.ds + '">' +
          '<div class="cal-daynum">' + c.date.getDate() + '</div>' +
          (total ? '<span class="cal-count">' + total + '</span>' : '') +
          '<div class="cal-marks">' + marks + more + '</div>' +
        '</div>';
      }).join('') +
    '</div></div>';

  const dayTasks = selCell.tasks.slice().sort(function (a, b) {
    return String(a.completed_at || a.due || '').localeCompare(String(b.completed_at || b.due || ''));
  });
  const doneTasks = dayTasks.filter(function (t) { return t.status === 'completed'; });
  const pendTasks = dayTasks.filter(function (t) { return t.status !== 'completed'; });
  const wd = ['日', '一', '二', '三', '四', '五', '六'][selCell.date.getDay()];

  const dayHtml = '<div class="card">' +
    '<div class="day-head">' +
      '<div class="day-title">' + fmtMD(fmtDate(selCell.date)) + '</div>' +
      '<div class="day-sub">周' + wd + ' · ' + (dayTasks.length + selCell.events.length) + ' 项</div>' +
    '</div>' +
    '<div class="day-body">' +
      (pendTasks.length ? '<div class="day-group-title">待办 ' + pendTasks.length + '</div>' +
        pendTasks.map(function (t) { return dayTaskRow(t, false); }).join('') : '') +
      (doneTasks.length ? '<div class="day-group-title">已完成 ' + doneTasks.length + '</div>' +
        doneTasks.map(function (t) { return dayTaskRow(t, true); }).join('') : '') +
      (selCell.events.length ? '<div class="day-group-title">日程 ' + selCell.events.length + '</div>' +
        selCell.events.map(function (e) {
          const t = e.start ? new Date(e.start) : null;
          const time = t && !isNaN(t.getTime()) ? pad2(t.getHours()) + ':' + pad2(t.getMinutes()) : '全天';
          return '<div class="day-item"><div class="day-check"></div><div class="day-item-main">' +
            '<div class="day-item-title">' + esc(e.summary || '—') + '</div>' +
            '<div class="day-item-meta">' + time + '</div></div></div>';
        }).join('') : '') +
      (!dayTasks.length && !selCell.events.length ? stateHtml('empty', '当日暂无任务与日程') : '') +
    '</div></div>';

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

  const taskHtml = '<div class="card">' +
    '<div class="card-head"><div class="card-title">任务中心</div>' +
      '<div class="card-sub">共 ' + info.total + ' 条 · 已完成 ' + info.completed + ' · 待办 ' + info.pending + '</div></div>' +
    '<div class="task-tabs">' +
      ['all:全部', 'pending:待办', 'completed:已完成'].map(function (pair) {
        const k = pair.split(':')[0], label = pair.split(':')[1];
        return '<button class="task-tab' + (st.cal.taskTab === k ? ' active' : '') + '" data-task-tab="' + k + '">' + label + '</button>';
      }).join('') +
    '</div>' +
    (Object.keys(cats).length ? '<div class="task-cats">' +
      '<button class="chip' + (st.cal.taskCat === 'all' ? ' active' : '') + '" data-task-cat="all">全部</button>' +
      Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).map(function (k) {
        return '<button class="chip' + (st.cal.taskCat === k ? ' active' : '') + '" data-task-cat="' + esc(k) + '">' + esc(k) + ' ' + cats[k] + '</button>';
      }).join('') + '</div>' : '') +
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

function dayTaskRow(t, done) {
  return '<div class="day-item' + (done ? ' done' : '') + '">' +
    '<div class="day-check' + (done ? ' done' : '') + '">' + (done ? ic('check', 'ico-12') : '') + '</div>' +
    '<div class="day-item-main"><div class="day-item-title">' + esc(t.summary || '—') + '</div>' +
    '<div class="day-item-meta">' + esc(t.category || '其他') + '</div></div></div>';
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
    ? '<div class="book-grid">' + pageList.map(bookCard).join('') + '</div>'
    : stateHtml('empty', '没有找到匹配的图书', '换个关键词试试', '清空搜索', 'data-action="clear-lib"');

  return toolbar + '<div class="card" style="padding:12px;">' + grid + pagerHtml('lib', st.lib.page, PAGE_SIZE.lib, list.length) + '</div>';
}

function bookCard(b) {
  const id = b.id || b.title;
  const initial = (b.title || '?').charAt(0);
  const hasCover = b.cover && b.hasCover !== false;
  const cover = hasCover
    ? '<img src="' + esc(b.cover) + '" alt="" loading="lazy"><div class="cover-fallback" style="display:none">' + esc(initial) + '</div>'
    : '<div class="cover-fallback">' + esc(initial) + '</div>';
  const snippet = (b.outline || b.think || '').slice(0, 60);

  return '<div class="book-card" data-book="' + esc(id) + '">' +
    '<div class="book-cover">' + cover + '</div>' +
    '<div class="book-main">' +
      '<div class="book-title">' + esc(b.title || '未命名') + '</div>' +
      '<div class="book-author">' + esc(b.author || '未知作者') + '</div>' +
      (snippet ? '<div class="book-snippet">' + esc(snippet) + ((b.outline || b.think || '').length > 60 ? '…' : '') + '</div>' : '') +
      '<div class="book-foot"><span class="book-date">' + esc(b.date || '') + '</span>' +
      (b.think ? '<span class="book-has">有思考</span>' : '') + '</div>' +
    '</div></div>';
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
    ? '<div class="row-list">' + pageList.map(function (d) {
        const idx = WENAN.indexOf(d);
        return '<div class="list-row" data-wenan="' + idx + '">' +
          '<div class="row-ico">' + ic(FILE_ICON[d.cat] || 'file') + '</div>' +
          '<div class="row-main"><div class="row-title">' + esc(d.name) + '</div>' +
          '<div class="row-sub"><span class="row-tag">' + esc(d.cat) + '</span><span>' + esc(d.tag) + '</span>' +
          '<span>' + esc(d.date) + '</span><span>' + esc(d.size) + '</span></div></div>' +
          '<div class="row-right"><button class="btn btn-sm" data-wenan="' + idx + '">阅读</button></div>' +
          '</div>';
      }).join('') + '</div>'
    : stateHtml('empty', '没有匹配的文案', '换个关键词或分类', '清空筛选', 'data-action="clear-wenan"');

  return toolbar + '<div class="card">' + rows + pagerHtml('wenan', st.wenan.page, PAGE_SIZE.wenan, list.length) + '</div>';
}

/* ---------------- 视图渲染 ---------------- */
function renderView() {
  const view = document.getElementById('view');
  if (!view) return;

  let html = '';
  switch (st.tab) {
    case 'home': html = renderHome(); break;
    case 'tasks': html = renderTasksPage(); break;
    case 'library': html = renderLibraryPage(); break;
    case 'wenan': html = renderWenanPage(); break;
    default: html = renderHome();
  }
  view.innerHTML = html;

  bindImgFallback();

  // 懒加载：进入模块时按需请求数据
  if (st.tab === 'library' && st.load.library === 'idle') loadLibrary();
}

function bindImgFallback() {
  document.querySelectorAll('.book-cover img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.style.display = 'none';
      const fb = img.nextElementSibling;
      if (fb) fb.style.display = 'flex';
    }, { once: true });
  });
}

function updateChrome() {
  const page = PAGES[st.tab] || PAGES.home;
  document.getElementById('pageTitle').textContent = page.title;
  document.getElementById('pageDesc').textContent = page.desc;

  const actions = document.getElementById('pageActions');
  if (page.actions && page.actions.indexOf('refresh') >= 0) {
    actions.innerHTML = '<button class="btn btn-sm" data-action="refresh"' + (st.load.feishu === 'loading' ? ' disabled' : '') + '>' +
      ic('refresh', 'ico-14') + '<span>刷新数据</span></button>';
  } else {
    actions.innerHTML = '';
  }

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
      '<div class="modal-box" role="dialog" aria-modal="true">' +
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
function openBook(id) {
  const books = (st.library && st.library.books) || [];
  const b = books.filter(function (x) { return String(x.id || x.title) === String(id); })[0];
  if (!b) return;
  openModal({
    title: b.title || '未命名',
    meta: [b.author, b.date],
    body:
      '<div class="sec-title">书摘 / 大纲</div>' +
      '<div style="white-space:pre-wrap;">' + esc(b.outline || '（暂无书摘）') + '</div>' +
      '<div class="sec-title">个人思考</div>' +
      '<div style="white-space:pre-wrap;">' + esc(b.think || '（暂无个人思考）') + '</div>' +
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

function openWenan(idx) {
  const d = WENAN[idx];
  if (!d) return;

  openModal({
    title: d.name,
    meta: [d.cat, d.date, d.size, d.tag],
    tools: '<button class="btn btn-sm" data-copy>' + ic('copy', 'ico-14') + '<span>复制</span></button>' +
           '<a class="btn btn-sm" href="' + encodeURI(d.path) + '" download>下载</a>',
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
      if (body) body.innerHTML = res.value || '<div class="state">文档内容为空</div>';
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
  renderView();
  window.scrollTo({ top: 0, behavior: 'auto' });
  closeSidebar();
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
    renderView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    renderView();
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
      renderView();
    }
    return;
  }

  // 任务 tab / 分类
  const tt = t.closest('[data-task-tab]');
  if (tt) { st.cal.taskTab = tt.dataset.taskTab; st.cal.page = 1; renderView(); return; }
  const tc = t.closest('[data-task-cat]');
  if (tc) { st.cal.taskCat = tc.dataset.taskCat; st.cal.page = 1; renderView(); return; }

  // 文案分类
  const wc = t.closest('[data-wcat]');
  if (wc) { st.wenan.cat = wc.dataset.wcat; st.wenan.page = 1; renderView(); return; }

  // 动作按钮
  const act = t.closest('[data-action]');
  if (act) {
    const a = act.dataset.action;
    if (a === 'refresh') { loadFeishu(true); return; }
    if (a === 'retry-feishu') { loadFeishu(true); return; }
    if (a === 'retry-library') { st.load.library = 'idle'; loadLibrary(); return; }
    if (a === 'clear-lib') { st.lib.q = ''; st.lib.page = 1; renderView(); return; }
    if (a === 'clear-wenan') { st.wenan.q = ''; st.wenan.cat = 'all'; st.wenan.page = 1; renderView(); return; }
  }

  // 详情入口
  const bk = t.closest('.book-card');
  if (bk) { openBook(bk.dataset.book); return; }
  const wd = t.closest('[data-wenan]');
  if (wd) { openWenan(Number(wd.dataset.wenan)); return; }

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
    const y = window.scrollY;
    renderView();
    window.scrollTo(0, y);
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

  // 支持 #模块 直接访问
  const hash = (location.hash || '').replace('#', '');
  if (hash && PAGES[hash]) {
    st.tab = hash;
    updateChrome();
  }

  renderView();
  loadFeishu();
  loadLibrary();

  window.addEventListener('hashchange', function () {
    const h = (location.hash || '').replace('#', '');
    if (h && PAGES[h] && h !== st.tab) {
      st.tab = h;
      updateChrome();
      renderView();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
