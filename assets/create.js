/* ============================================================
   创作线升级 · 数据层 + 选题池
   设计原则：
   1. 不动原有 workbench.js 的渲染逻辑，只通过 SECTIONS/bodyOf 挂新页面
   2. 原有数据（雷达 / 战报 / 口播稿）只读兼容，迁移一次后写入本机存储
   3. 跨模块只用 ID 关联：选题 t-* → 稿件 d-*（=原稿 id/文件路径）→ 视频 v-* → 评论 c-*
   4. 存储：localStorage 单键 wb.cw.v1；导出/导入全量 JSON
   ============================================================ */
(function (global) {
  'use strict';

  var STORE = 'wb.cw.v1';
  var BAK = 'wb.cw.bak.';
  var VERSION = 1;

  var ACC = [
    { id: 'a1', name: '数码大号' },
    { id: 'a2', name: '安卓账号' },
    { id: 'a3', name: '数码内容小号' },
    { id: 'a4', name: '汽车账号' },
    { id: 'a5', name: '其他' }
  ];

  var CT = ['引流视频', '产品介绍', '产品评测', '数码资讯', '观点分析', '对比测评', '用户问题解答', '其他'];
  var SRC = ['今日雷达', '评论区', '竞品视频', '历史视频', '自主灵感', '其他'];
  var TSTAT = ['待策划', '待写文案', '待拍摄', '待剪辑', '已完成', '暂缓', '已放弃'];
  var SHOOTABLE = ['现有条件即可拍摄', '需要准备素材或设备', '暂时无法拍摄'];
  var HCLS = ['行业热点', '竞品动态', '用户需求', '产品信息'];
  var CTYPE = ['正面反馈', '负面反馈', '用户提问', '观点争议', '购买意向', '内容建议', '其他'];
  var MARK = ['成功案例', '普通案例', '失败案例'];

  var STAT_COLOR = {
    '待策划': '#8b93a1', '待写文案': '#3c4aa8', '待拍摄': '#c98a00',
    '待剪辑': '#8a4bbf', '已完成': '#17805a', '暂缓': '#8b93a1', '已放弃': '#c0342a'
  };

  /* ---------------- 小工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function nowTime() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function wan(n) {
    n = num(n);
    if (!n) return '0';
    if (n >= 100000000) return (n / 100000000).toFixed(2).replace(/\.?0+$/, '') + ' 亿';
    if (n >= 10000) return (n / 10000).toFixed(n >= 1000000 ? 0 : 1).replace(/\.0$/, '') + ' 万';
    return String(Math.round(n));
  }
  function pct(v) { return v == null || v === '' ? '—' : (num(v) * 100).toFixed(1) + '%'; }
  function blk(t) { return t ? String(t).trim() : ''; }
  function uniq(a) { var s = {}, o = []; a.forEach(function (x) { if (!s[x]) { s[x] = 1; o.push(x); } }); return o; }
  function toast(m, t) { if (global.toast) { try { global.toast(m, t || 'ok'); return; } catch (e) {} } console.log(m); }

  /* ---------------- 数据层 ---------------- */
  var D = null;

  function blank() {
    return {
      v: VERSION, updated: today(),
      accounts: ACC.slice(),
      topics: [], videos: [], comments: [], reviews: [],
      attach: {},     // draftId -> {shoot,edit,crew}
      hotOps: {},     // hotKey -> {op,cls,account}
      migrated: {},
      ai: {}          // videoId/topicId -> 文本结果
    };
  }

  function load() {
    if (D) return D;
    var raw = null;
    try { raw = localStorage.getItem(STORE); } catch (e) {}
    if (raw) {
      try {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object') {
          D = Object.assign(blank(), o);
          if (!Array.isArray(D.accounts) || !D.accounts.length) D.accounts = ACC.slice();
          if (!D.attach) D.attach = {};
          if (!D.hotOps) D.hotOps = {};
          if (!D.migrated) D.migrated = {};
          if (!D.ai) D.ai = {};
          return D;
        }
      } catch (e) { console.warn('[cw] 本地数据损坏，先用空库跑，旧数据仍在 localStorage 里', e); }
    }
    D = blank();
    return D;
  }

  var saveTimer = null;
  function save(now) {
    var go = function () {
      D.updated = today();
      try { localStorage.setItem(STORE, JSON.stringify(D)); }
      catch (e) {
        toast('存不下了，浏览器存储满了，先点「导出备份」再删点旧数据', 'err');
        console.error(e);
      }
      saveTimer = null;
    };
    if (now) { if (saveTimer) clearTimeout(saveTimer); go(); return; }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(go, 260);
  }

  function backup(tag) {
    try {
      localStorage.setItem(BAK + today() + (tag ? '.' + tag : ''), JSON.stringify(D));
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- 迁移：原有 JSON → 新结构 ---------------- */
  function fetchJSON(url) {
    // 按天做一次缓存键：同一天内复用，跨天自动拉新的，也不至于每次刷新都打三个 JSON
    return fetch(encodeURI(url) + (url.indexOf('?') < 0 ? '?' : '&') + 'd=' + today(), { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  function vidId(date, i) {
    return 'v' + String(date || '').replace(/-/g, '') + '-' + String(i + 1).padStart(3, '0');
  }

  function migrate() {
    var d = load();
    var jobs = [];

    // 每次都做「增量合并」：仓库里新加的稿子、新月份的战报会自动进来，
    // 已经存在的记录只补事实数据（播放量等），不覆盖用户手改过的字段。
    jobs.push(fetchJSON('content/topics.json').then(function (o) {
      var list = (o && o.topics) || [];
      var add = 0;
      list.forEach(function (t) {
        var id = 't-m-' + t.id;
        if (d.topics.some(function (x) { return x.id === id; })) return;
        d.topics.push({
          id: id,
          title: t.title || '',
          account: '数码大号',
          ctType: '数码资讯',
          source: '今日雷达',
          core: t.angle || '',
          userNeed: (t.scores && t.scores.dispute >= 4) ? '有争议，评论区会吵' : '',
          hook: '',
          plan: (t.facts || []).join('；'),
          refs: (t.sources || []).map(function (u) { return { label: u, url: u }; }),
          material: '',
          shootable: t.scores && t.scores.shoot >= 4 ? SHOOTABLE[0] : SHOOTABLE[1],
          priority: t.score >= 80 ? 3 : (t.score >= 60 ? 2 : 1),
          status: t.picked ? '待写文案' : '待策划',
          note: t.notes || '',
          tags: [t.brand].filter(Boolean),
          createdAt: t.event_date || today(),
          updatedAt: today(),
          draftId: '', videoId: ''
        });
        add++;
      });
      if (add) { d.migrated.topics = true; save(true); }
      return add;
    }).catch(function (e) { console.warn('[cw] 合并旧选题失败', e); return 0; }));

    jobs.push(fetchJSON('content/report/index.json').then(function (o) {
      var months = (o && o.months) || [];
      var add = 0, upd = 0;
      months.forEach(function (m) {
        (m.rows || []).forEach(function (r, i) {
          var id = vidId(r.date, i);
          var stats = {
            play: r.play, like: r.like, cmt: r.cmt, share: r.share, fav: r.fav,
            fin: r.fin, avg: r.avg, fans: r.fans, visit: r.visit, b2: r.b2, ctr: r.ctr
          };
          var hit = d.videos.filter(function (x) { return x.id === id; })[0];
          if (hit) {
            // 已有档案：只刷新战报口径的数字，评级/收藏/评论/复盘/链接都保留
            hit.stats = stats;
            if (!hit.vtype) hit.vtype = r.type || (r.fmt || '');
            upd++;
            return;
          }
          d.videos.push({
            id: id,
            name: r.title || '',
            account: '数码大号',
            platform: '抖音',
            date: r.date || '',
            time: r.time || '',
            url: '', cover: '',
            vtype: r.type || (r.fmt || ''),
            fmt: r.fmt || '',
            topicId: '', draftId: '',
            stats: stats,
            prod: {},
            mark: '', star: false, tags: [],
            src: 'report', createdAt: today()
          });
          add++;
        });
      });
      if (add || upd) { d.migrated.report = true; save(true); }
      return add;
    }).catch(function (e) { console.warn('[cw] 合并战报失败', e); return 0; }));

    jobs.push(fetchJSON('content/drafts/index.json').then(function (o) {
      var list = (o && o.drafts) || [];
      var add = 0;
      list.forEach(function (x) {
        if (!x || !x.file) return;
        var id = 'd-' + x.file;
        if (d.attach[id]) return;
        d.attach[id] = {
          title: x.title || '', date: x.date || '', words: x.words || 0,
          hook: x.hook || '', topicId: x.topic_id ? 't-m-' + x.topic_id : '',
          shoot: {}, edit: {}, crew: {}, videoId: ''
        };
        add++;
      });
      if (add) { d.migrated.drafts = true; save(true); }
      return add;
    }).catch(function (e) { console.warn('[cw] 合并稿件索引失败', e); return 0; }));

    return Promise.all(jobs);
  }

  /* ---------------- 导出 / 导入 ---------------- */
  function download(name, text, mime) {
    var b = new Blob([text], { type: mime || 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }
  function exportAll() {
    load();
    var pack = {
      _meta: { app: 'my-workbench/创作线', v: VERSION, exported: new Date().toISOString() },
      data: D
    };
    download('创作线备份-' + today() + '.json', JSON.stringify(pack, null, 1));
    toast('已导出 JSON 备份', 'ok');
  }
  function importAll(file) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var o = JSON.parse(String(fr.result));
        var src = o && o.data ? o.data : o;
        if (!src || !Array.isArray(src.topics) && !Array.isArray(src.videos)) throw new Error('这不是创作线的备份文件');
        if (!confirm('导入会覆盖本机当前全部创作线数据（含选题、视频、评论、复盘）。\n导入前会自动留一份今日备份，确定继续？')) return;
        backup('before-import');
        D = Object.assign(blank(), src);
        if (!Array.isArray(D.accounts) || !D.accounts.length) D.accounts = ACC.slice();
        if (!D.attach) D.attach = {};
        if (!D.hotOps) D.hotOps = {};
        if (!D.ai) D.ai = {};
        if (!D.migrated) D.migrated = {};
        save(true);
        toast('导入完成，已覆盖', 'ok');
        if (global.renderView) global.renderView(false);
      } catch (e) {
        alert('导入失败：' + e.message);
      }
    };
    fr.readAsText(file, 'utf-8');
  }

  /* ---------------- 查询辅助 ---------------- */
  function topicById(id) { return load().topics.filter(function (x) { return x.id === id; })[0] || null; }
  function videoById(id) { return load().videos.filter(function (x) { return x.id === id; })[0] || null; }
  function commentsOf(vid) { return load().comments.filter(function (c) { return c.videoId === vid; }); }
  function reviewOf(vid) { return load().reviews.filter(function (r) { return r.videoId === vid; })[0] || null; }
  function attachOf(did) { return load().attach[did] || null; }
  function ensureAttach(did, seed) {
    var d = load();
    if (!d.attach[did]) d.attach[did] = Object.assign({ shoot: {}, edit: {}, crew: {}, videoId: '' }, seed || {});
    var a = d.attach[did];
    if (!a.shoot) a.shoot = {};
    if (!a.edit) a.edit = {};
    if (!a.crew) a.crew = {};
    if (!Array.isArray(a.shoot.shots)) a.shoot.shots = [];
    return a;
  }

  /* ---------------- 抽屉 ---------------- */
  var sideEl = null;
  function openSide(opt) {
    closeSide();
    var el = document.createElement('div');
    el.className = 'cw-side';
    el.innerHTML =
      '<div class="cw-side-h">' +
        '<div class="cw-side-h-main">' +
          '<div class="cw-side-k">' + esc(opt.kicker || '') + '</div>' +
          '<div class="cw-side-t">' + (opt.title || '') + '</div>' +
        '</div>' +
        '<button class="icon-btn" data-cw-close="1" aria-label="关闭">&#10005;</button>' +
      '</div>' +
      '<div class="cw-side-b" id="cwSideBody">' + (opt.body || '') + '</div>' +
      (opt.foot ? '<div class="cw-side-f">' + opt.foot + '</div>' : '');
    document.body.appendChild(el);
    sideEl = el;
    requestAnimationFrame(function () { el.classList.add('on'); });
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-cw-close]')) closeSide();
    });
    if (opt.after) opt.after(el);
    return el;
  }
  function closeSide() {
    if (!sideEl) return;
    var el = sideEl;
    sideEl = null;
    el.classList.remove('on');
    setTimeout(function () { el.remove(); }, 280);
  }
  function sideBody() { return document.getElementById('cwSideBody'); }

  /* ---------------- 通用小部件 ---------------- */
  function seg(name, opts, cur, attr) {
    return '<div class="cw-seg" ' + (attr || '') + '>' + opts.map(function (o) {
      var v = typeof o === 'string' ? o : o.v, t = typeof o === 'string' ? o : o.t;
      return '<button type="button" class="' + (String(v) === String(cur) ? 'on' : '') + '" data-cw-seg="' + esc(name) + '" data-v="' + esc(v) + '">' + esc(t) + '</button>';
    }).join('') + '</div>';
  }
  function selHtml(name, opts, cur, blankLabel) {
    var h = '<select class="cw-sel" data-cw-f="' + esc(name) + '">';
    if (blankLabel) h += '<option value="">' + esc(blankLabel) + '</option>';
    opts.forEach(function (o) {
      var v = typeof o === 'string' ? o : o.v, t = typeof o === 'string' ? o : o.t;
      h += '<option value="' + esc(v) + '"' + (String(v) === String(cur == null ? '' : cur) ? ' selected' : '') + '>' + esc(t) + '</option>';
    });
    return h + '</select>';
  }
  function accSel(name, cur, blank) {
    return selHtml(name, load().accounts.map(function (a) { return { v: a.name, t: a.name }; }), cur, blank);
  }
  function field(label, inner, cls) {
    return '<div class="cw-field ' + (cls || '') + '"><label>' + esc(label) + '</label>' + inner + '</div>';
  }
  function foldsHtml(items) {
    return items.map(function (it, i) {
      return '<div class="cw-fold' + (i === 0 ? ' on' : '') + '" data-cw-fold="' + i + '">' +
        '<div class="cw-fold-h" data-cw-fold-t="1"><span class="cw-fold-ar">&#9654;</span><b>' + esc(it.t) + '</b>' +
        (it.s ? '<span class="cw-tag">' + esc(it.s) + '</span>' : '') + '</div>' +
        '<div class="cw-fold-b">' + it.b + '</div></div>';
    }).join('');
  }

  /* ---------------- 选题池 ---------------- */
  var TF = { view: 'board', q: '', account: '', ctType: '', source: '', priority: '', status: '', from: '', to: '' };

  function topicFiltered() {
    var d = load();
    var q = TF.q.trim().toLowerCase();
    return d.topics.filter(function (t) {
      if (TF.account && t.account !== TF.account) return false;
      if (TF.ctType && t.ctType !== TF.ctType) return false;
      if (TF.source && t.source !== TF.source) return false;
      if (TF.priority && String(t.priority) !== String(TF.priority)) return false;
      if (TF.status && t.status !== TF.status) return false;
      if (TF.from && String(t.createdAt || '') < TF.from) return false;
      if (TF.to && String(t.createdAt || '') > TF.to) return false;
      if (q) {
        var hay = [t.title, t.core, t.hook, t.plan, t.note, t.userNeed, (t.tags || []).join(' ')].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function priDot(p) {
    var c = p >= 3 ? '#c0342a' : (p >= 2 ? '#ff8b55' : '#c9cfd8');
    return '<span class="cw-dot" style="background:' + c + '" title="优先级 P' + (p || 1) + '"></span>';
  }

  function topicCard(t) {
    return '<div class="cw-card" draggable="true" data-cw-topic="' + esc(t.id) + '">' +
      '<div class="cw-card-t">' + esc(t.title || '（未命名选题）') + '</div>' +
      '<div class="cw-card-m">' + priDot(t.priority) +
        '<span class="cw-tag">' + esc(t.account || '未分账号') + '</span>' +
        (t.ctType ? '<span class="cw-tag is-brown">' + esc(t.ctType) + '</span>' : '') +
        (t.videoId ? '<span class="cw-tag is-ok">已出片</span>' : (t.draftId ? '<span class="cw-tag is-acc">有稿</span>' : '')) +
      '</div>' +
      (t.shootable === SHOOTABLE[2] ? '<div class="cw-card-m"><span class="cw-tag is-warn">暂时拍不了</span></div>' : '') +
    '</div>';
  }

  function boardHtml(list) {
    return '<div class="cw-board" id="cwBoard">' + TSTAT.map(function (s) {
      var items = list.filter(function (t) { return (t.status || '待策划') === s; });
      return '<div class="cw-col" data-cw-drop="' + esc(s) + '">' +
        '<div class="cw-col-h"><i style="background:' + STAT_COLOR[s] + '"></i><b>' + esc(s) + '</b><span>' + items.length + '</span></div>' +
        '<div class="cw-cards">' + items.map(topicCard).join('') + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function tableHtml(list) {
    if (!list.length) return '';
    var rows = list.slice().sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    }).map(function (t) {
      return '<tr data-cw-topic="' + esc(t.id) + '">' +
        '<td class="tt">' + esc(t.title || '（未命名）') + '</td>' +
        '<td>' + esc(t.account || '—') + '</td>' +
        '<td>' + esc(t.ctType || '—') + '</td>' +
        '<td>' + esc(t.source || '—') + '</td>' +
        '<td>' + priDot(t.priority) + ' P' + (t.priority || 1) + '</td>' +
        '<td><span class="cw-tag" style="background:' + STAT_COLOR[t.status || '待策划'] + '1a;color:' + STAT_COLOR[t.status || '待策划'] + '">' + esc(t.status || '待策划') + '</span></td>' +
        '<td style="white-space:nowrap;color:var(--cw-ink3)">' + esc(t.createdAt || '') + '</td>' +
      '</tr>';
    }).join('');
    return '<div class="cw-panel"><div class="cw-panel-b is-flush"><div class="cw-scroll"><table class="cw-table">' +
      '<thead><tr><th>选题</th><th>账号</th><th>类型</th><th>来源</th><th>优先级</th><th>状态</th><th>创建</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div></div>';
  }

  function tilesHtml(list) {
    var n = function (s) { return list.filter(function (t) { return t.status === s; }).length; };
    var pub = load().videos.length;
    var cells = [
      { k: '待策划', v: n('待策划'), cls: '' },
      { k: '待写文案', v: n('待写文案'), cls: '' },
      { k: '待拍摄', v: n('待拍摄'), cls: '' },
      { k: '待剪辑', v: n('待剪辑'), cls: 'is-accent' },
      { k: '已完成', v: n('已完成'), cls: 'is-dark' },
      { k: '暂缓', v: n('暂缓') + n('已放弃'), cls: '' }
    ];
    return '<div class="cw-tiles is-6">' + cells.map(function (c) {
      return '<div class="cw-tile ' + c.cls + (TF.status === c.k ? ' on' : '') + '" data-cw-tstat="' + esc(c.k) + '">' +
        '<div class="cw-tile-k">' + esc(c.k) + '</div><div class="cw-tile-v">' + c.v + '</div></div>';
    }).join('') + '</div>';
  }

  function renderTopics() {
    var d = load();
    var list = topicFiltered();
    var filt =
      '<div class="cw-bar">' +
        '<div class="cw-seg" data-cw-tview="1">' +
          '<button type="button" class="' + (TF.view === 'board' ? 'on' : '') + '" data-v="board">看板</button>' +
          '<button type="button" class="' + (TF.view === 'list' ? 'on' : '') + '" data-v="list">列表</button>' +
        '</div>' +
        '<input class="cw-in" style="max-width:230px" placeholder="搜选题 / 观点 / 梗" value="' + esc(TF.q) + '" data-cw-tq="1">' +
        accSel('faccount', TF.account, '全部账号') +
        selHtml('fctType', CT, TF.ctType, '全部类型') +
        selHtml('fsource', SRC, TF.source, '全部来源') +
        selHtml('fpriority', [{ v: '3', t: 'P3 急' }, { v: '2', t: 'P2 正常' }, { v: '1', t: 'P1 不急' }], TF.priority, '全部优先级') +
        '<input class="cw-in" type="date" style="max-width:150px" value="' + esc(TF.from) + '" data-cw-tfrom="1" title="创建起始">' +
        '<input class="cw-in" type="date" style="max-width:150px" value="' + esc(TF.to) + '" data-cw-tto="1" title="创建截止">' +
        '<button class="cw-btn is-ghost is-sm" data-cw-treset="1">清筛选</button>' +
        '<span class="cw-grow"></span>' +
        '<button class="cw-btn is-go" data-cw-tnew="1">+ 新选题</button>' +
      '</div>';
    // 让筛选下拉可以直接用 change
    filt = filt.replace(/<select class="cw-sel" data-cw-f="f(account|ctType|source|priority)"/g, function (m, a) {
      return '<select class="cw-sel" data-cw-tf="' + a + '"';
    }).replace(/data-cw-f="faccount"/, 'data-cw-tf="account"')
      .replace(/data-cw-f="fctType"/, 'data-cw-tf="ctType"')
      .replace(/data-cw-f="fsource"/, 'data-cw-tf="source"')
      .replace(/data-cw-f="fpriority"/, 'data-cw-tf="priority"');

    var main = TF.view === 'board'
      ? (list.length ? boardHtml(list) : emptyHtml('这个筛选下一条都没有', '换个筛选，或者点右上「+ 新选题」'))
      : (list.length ? tableHtml(list) : emptyHtml('这个筛选下一条都没有', '换个筛选，或者点右上「+ 新选题」'));

    return '<div class="cw-wrap">' + tilesHtml(d.topics) + filt + main +
      '<div class="cw-note">看板里的卡片能拖着换状态。选题不是热点，转发过来的热点只是「候选」，做不做你自己定。</div></div>';
  }

  function emptyHtml(t, s) {
    return '<div class="cw-panel"><div class="cw-empty"><b>' + esc(t) + '</b><span>' + esc(s) + '</span></div></div>';
  }

  /* 选题详情抽屉 */
  function openTopic(id) {
    var d = load();
    var t = id ? topicById(id) : null;
    var isNew = !t;
    if (isNew) {
      t = {
        id: uid('t-'), title: '', account: d.accounts[0] ? d.accounts[0].name : '数码大号',
        ctType: '观点分析', source: '自主灵感', core: '', userNeed: '', hook: '', plan: '',
        refs: [], material: '', shootable: SHOOTABLE[0], priority: 2, status: '待策划',
        note: '', tags: [], createdAt: today(), updatedAt: today(), draftId: '', videoId: ''
      };
    }
    var refs = (t.refs || []).map(function (r, i) {
      return '<div class="cw-shot" data-cw-ref="' + i + '">' +
        '<span class="cw-shot-t"><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.label || r.url) + '</a></span>' +
        '<button class="cw-shot-x" data-cw-ref-x="' + i + '">&#10005;</button></div>';
    }).join('');

    var body =
      '<div class="cw-sec">' +
        field('选题名称', '<input class="cw-in" data-cw-f="title" value="' + esc(t.title) + '" placeholder="一句话，自己看得懂就行">') +
        '<div class="cw-grid cw-g3">' +
          field('所属账号', accSel('account', t.account)) +
          field('内容类型', selHtml('ctType', CT, t.ctType)) +
          field('选题来源', selHtml('source', SRC, t.source)) +
        '</div>' +
        '<div class="cw-grid cw-g3">' +
          field('优先级', selHtml('priority', [{ v: 3, t: 'P3 急' }, { v: 2, t: 'P2 正常' }, { v: 1, t: 'P1 不急' }], t.priority)) +
          field('生产状态', selHtml('status', TSTAT, t.status)) +
          field('可拍摄性', selHtml('shootable', SHOOTABLE, t.shootable)) +
        '</div>' +
      '</div>' +

      '<div class="cw-sec">' +
        '<div class="cw-sec-h">内容策划<span class="cw-sec-line"></span></div>' +
        field('核心观点（这条到底说啥）', '<textarea class="cw-ta" data-cw-f="core" placeholder="一句话结论，别写成大纲">' + esc(t.core) + '</textarea>') +
        field('用户关注点（他们到底想知道啥）', '<textarea class="cw-ta" data-cw-f="userNeed">' + esc(t.userNeed) + '</textarea>') +
        field('开场钩子（前三秒那句话）', '<textarea class="cw-ta" data-cw-f="hook" placeholder="第一句就得让人不划走">' + esc(t.hook) + '</textarea>') +
        field('内容策划方向 / 已核事实', '<textarea class="cw-ta" data-cw-f="plan" style="min-height:96px">' + esc(t.plan) + '</textarea>') +
        field('所需拍摄素材', '<textarea class="cw-ta" data-cw-f="material" placeholder="要拍什么机器、什么手、什么场景">' + esc(t.material) + '</textarea>') +
      '</div>' +

      '<div class="cw-sec">' +
        '<div class="cw-sec-h">参考资料<span class="cw-sec-line"></span>' +
          '<button class="cw-btn is-sm" data-cw-ref-add="1">+ 加链接</button></div>' +
        '<div class="cw-shots">' + (refs || '<div class="cw-note">还没加参考链接。原文、竞品视频、参数页都往这儿塞。</div>') + '</div>' +
        field('标签（逗号隔开）', '<input class="cw-in" data-cw-f="tags" value="' + esc((t.tags || []).join('，')) + '" placeholder="折叠屏，退货，华为">') +
        field('备注', '<textarea class="cw-ta" data-cw-f="note">' + esc(t.note) + '</textarea>') +
      '</div>' +

      '<div class="cw-sec">' +
        '<div class="cw-sec-h">关联<span class="cw-sec-line"></span></div>' +
        '<div class="cw-kv">' +
          '<dt>口播稿</dt><dd>' + (t.draftId ? '<span class="cw-tag is-acc">' + esc(t.draftId.split('/').pop()) + '</span>' : '<span style="color:var(--cw-ink3)">还没生成</span>') + '</dd>' +
          '<dt>视频</dt><dd>' + (t.videoId && videoById(t.videoId) ? '<a href="#" data-cw-govideo="' + esc(t.videoId) + '">' + esc(videoById(t.videoId).name.slice(0, 40)) + '</a>' : '<span style="color:var(--cw-ink3)">还没出片</span>') + '</dd>' +
        '</div>' +
      '</div>';

    var foot =
      (isNew ? '' : '<button class="cw-btn is-x" data-cw-tdel="' + esc(t.id) + '">删掉</button>') +
      '<span class="cw-grow"></span>' +
      (isNew ? '' : '<button class="cw-btn" data-cw-tcopy="1">复制策划文案</button>') +
      (isNew ? '' : '<button class="cw-btn is-dark" data-cw-todraft="' + esc(t.id) + '">生成口播稿</button>') +
      '<button class="cw-btn is-go" data-cw-tsave="1">' + (isNew ? '建这条' : '保存') + '</button>';

    openSide({
      kicker: isNew ? '新建选题' : '选题 · ' + (t.status || '待策划'),
      title: esc(t.title || (isNew ? '新选题' : '未命名选题')),
      body: body, foot: foot,
      after: function (el) {
        el.addEventListener('click', function (e) {
          var addRef = e.target.closest('[data-cw-ref-add]');
          if (addRef) {
            var url = prompt('粘链接（原文 / 竞品视频 / 参数页）：');
            if (!url) return;
            collectTopic(t, el);
            t.refs.push({ label: url, url: url });
            openTopic(t.id);
            return;
          }
          var rx = e.target.closest('[data-cw-ref-x]');
          if (rx) {
            collectTopic(t, el);
            t.refs.splice(Number(rx.getAttribute('data-cw-ref-x')), 1);
            openTopic(t.id);
            return;
          }
          var gov = e.target.closest('[data-cw-govideo]');
          if (gov) { e.preventDefault(); closeSide(); openVideo(gov.getAttribute('data-cw-govideo')); return; }
          if (e.target.closest('[data-cw-tcopy]')) {
            collectTopic(t, el);
            var txt = '【' + (t.title || '') + '】\n账号：' + t.account + ' · ' + t.ctType + '\n核心观点：' + (t.core || '—') +
              '\n用户关注点：' + (t.userNeed || '—') + '\n开场钩子：' + (t.hook || '—') + '\n策划方向：' + (t.plan || '—') +
              '\n拍摄素材：' + (t.material || '—');
            copy(txt);
            return;
          }
          if (e.target.closest('[data-cw-todraft]')) { collectTopic(t, el); makeDraftFrom(t); return; }
          if (e.target.closest('[data-cw-tdel]')) {
            if (!confirm('删掉这条选题？删了不回来。')) return;
            d.topics = d.topics.filter(function (x) { return x.id !== t.id; });
            save(true); closeSide(); toast('已删除', 'ok');
            if (global.renderView) global.renderView(true);
            return;
          }
          if (e.target.closest('[data-cw-tsave]')) {
            collectTopic(t, el);
            if (!blk(t.title)) { alert('选题名称不能空'); return; }
            t.updatedAt = today();
            if (isNew) d.topics.unshift(t);
            save(true); closeSide(); toast(isNew ? '选题建好了' : '已保存', 'ok');
            if (global.renderView) global.renderView(true);
          }
        });
      }
    });
  }

  function collectTopic(t, el) {
    el.querySelectorAll('[data-cw-f]').forEach(function (inp) {
      var k = inp.getAttribute('data-cw-f');
      var v = inp.value;
      if (k === 'priority') v = Number(v) || 1;
      if (k === 'tags') v = String(v).split(/[,，\s]+/).filter(Boolean);
      t[k] = v;
    });
    // 标题栏同步
    var head = el.querySelector('.cw-side-t');
    if (head && t.title) head.textContent = t.title;
  }

  function copy(text) {
    if (global.copyText) { try { global.copyText(text); toast('已复制', 'ok'); return; } catch (e) {} }
    navigator.clipboard && navigator.clipboard.writeText(text).then(function () { toast('已复制', 'ok'); }, function () { alert('复制失败，手选吧'); });
  }

  /* 选题 → 口播稿：复用口播工坊的开新稿入口 */
  function makeDraftFrom(t) {
    var d = load();
    var src = t.source === '今日雷达' ? '雷达 ' : '';
    var idea = { title: t.title, from: src, src: (t.refs && t.refs[0] ? t.refs[0].url : ''), url: (t.refs && t.refs[0] ? t.refs[0].url : '') };
    if (global.kbStartFrom) {
      global.kbStartFrom(idea);
      // 记下关联：新稿 id 是 kbStartFrom 生成的那个
      try {
        var kb = global.KB;
        if (kb && kb.open) {
          t.draftId = kb.open;
          var a = ensureAttach(kb.open);
          a.topicId = t.id;
          a.title = t.title;
          a.hook = t.hook || '';
          if (t.status === '待策划') t.status = '待写文案';
          save(true);
        }
      } catch (e) {}
      toast('开好稿了，在口播工坊', 'ok');
    } else {
      alert('口播工坊没加载出来，刷新一下页面');
    }
  }

  /* ---------------- 导出给外部 ---------------- */
  global.CWB = {
    D: function () { return load(); },
    save: save, backup: backup, exportAll: exportAll, importAll: importAll,
    migrate: migrate, today: today, nowTime: nowTime,
    esc: esc, uid: uid, num: num, wan: wan, pct: pct, toast: toast, copy: copy,
    ACC: ACC, CT: CT, SRC: SRC, TSTAT: TSTAT, SHOOTABLE: SHOOTABLE, HCLS: HCLS, CTYPE: CTYPE, MARK: MARK,
    STAT_COLOR: STAT_COLOR,
    topicById: topicById, videoById: videoById, commentsOf: commentsOf, reviewOf: reviewOf,
    attachOf: attachOf, ensureAttach: ensureAttach,
    openSide: openSide, closeSide: closeSide, sideBody: sideBody,
    field: field, sel: selHtml, accSel: accSel, folds: foldsHtml, seg: seg, empty: emptyHtml,
    renderTopics: renderTopics, openTopic: openTopic,
    TF: TF
  };
})(window);
