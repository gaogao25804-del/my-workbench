/* ============================================================
   数码内容策划台 · 六模块（融合进旧版「个人工作台」）
   01 工作驾驶舱 / 02 选题策划中心 / 03 文案生产中心
   04 视频生产中心 / 05 数据分析中心 / 06 AI 与知识库

   设计约束（2026-11-17 老板要求）：
   - 工具箱 5 项（任务与日历/图书馆/英文翻译/像素工坊/画板）一个字不碰
   - 旧页面（雷达/战报/账号拆解/热门选题/五秒开头/SOP库）全部保留，
     新版模块只是容器与入口，旧渲染函数原样调用，不重写
   - 数据独立存 wb.plnr.v1，旧 key 一个不动
   - 沿用工作台浅色体系与 cw-* 组件，不引入深色皮肤（整站一致优先）
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'wb.plnr.v1';

  /* 六阶段：跟老板的生产流程一一对应 */
  var STAGES = [
    { k: 'idea',    n: '选题确认', c: 'is-1' },
    { k: 'script',  n: '文案确认', c: 'is-2' },
    { k: 'shoot',   n: '待拍摄',   c: 'is-3' },
    { k: 'edit',    n: '剪辑中',   c: 'is-4' },
    { k: 'publish', n: '待发布',   c: 'is-5' },
    { k: 'done',    n: '已发布',   c: 'is-6' }
  ];
  var STAGE_IDX = {};
  STAGES.forEach(function (s, i) { STAGE_IDX[s.k] = i; });

  /* 账号分工：老板原话，别改 */
  var DEFAULT_ACCOUNTS = [
    { id: 'a1', name: '数码大号',     goal: '核心内容 · 播放量增长' },
    { id: 'a2', name: '安卓账号',     goal: '安卓新品 · 产品内容' },
    { id: 'a3', name: '数码内容小号', goal: '引流 · 内容补充' }
  ];

  var AIFLOW = [
    { t: '爆款拆解', i: '历史优秀视频', o: '结构分析', p: '把这个视频的口播稿拆成结构：开头钩子用的是什么类型（提问/反差/数字/身份）、中间怎么推进、结尾怎么收。不要评价好坏，只描述结构。' },
    { t: '热点选题', i: '热点信息', o: '可拍选题', p: '从这些热点里挑出能拍口播的题。判据只有一个：观众会看到什么他没见过的画面。带人干一件事强于讲一件事。只保留手上有机型能拍的。' },
    { t: '文案辅助', i: '选题 + 产品资料', o: '初版脚本', p: '按 520-700 字写口播稿，一整段不分段不编号，像语音转文字，带口水词和自问自答。结尾固定「完了你们记得买配件多问问我奥」。' },
    { t: '文案审核', i: '已有文案', o: '问题及建议', p: '检查这份稿子：有没有分段编号、有没有报告腔、有没有编造没见到的画面、价格有没有核实、结尾是不是固定那句。只列问题，不要重写。' },
    { t: '数据复盘', i: '视频数据', o: '表现分析', p: '按选题类型分组算中位播放量，指出哪一类跑得动、哪一类白写。只用给的数据，不要推测原因。' },
    { t: 'SOP 生成', i: '成功案例', o: '标准流程', p: '把这几次成功的过程抽成可重复执行的步骤。每步写清楚触发条件、动作、完成标准。不要写心得。' }
  ];

  /* ---------------- 基础工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) {
    if (n == null || n === '') return '—';
    return Number(n).toLocaleString('zh-CN');
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function uid() { return 'p' + Date.now() + Math.random().toString(36).slice(2, 5); }
  function dayDiff(s) {
    if (!s) return null;
    var p = String(s).slice(0, 10).split('-').map(Number);
    if (p.length < 3) return null;
    var t = new Date(p[0], p[1] - 1, p[2]);
    var n = new Date(); n.setHours(0, 0, 0, 0);
    return Math.round((t - n) / 86400000);
  }
  function toast(msg, type) {
    if (global.CWB && typeof global.CWB.toast === 'function') {
      try { global.CWB.toast(msg, type); return; } catch (e) {}
    }
    if (global.WB && typeof global.WB.toast === 'function') {
      try { global.WB.toast(msg, type); return; } catch (e) {}
    }
    try { console.log('[plnr]', msg); } catch (e) {}
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  /* ---------------- 存储 ---------------- */
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object') d = {};
    if (!Array.isArray(d.pipe)) d.pipe = [];
    if (!Array.isArray(d.assets)) d.assets = [];
    if (!Array.isArray(d.accounts) || !d.accounts.length) d.accounts = DEFAULT_ACCOUNTS.slice();
    if (!d.seeded) seedOnce(d);
    return d;
  }

  /* 首次打开填一次预置数据（planner-seed.js）。
     规则：当前列表有内容就不动它。他手填的一条都不会被冲掉。 */
  function seedOnce(d) {
    var s = global.PLNR_SEED;
    if (!s) return;
    if (!d.pipe.length && Array.isArray(s.pipe)) d.pipe = s.pipe.slice();
    if (!d.assets.length && Array.isArray(s.assets)) d.assets = s.assets.slice();
    d.seeded = s.version || '1';
    save(d);
    if (s.dcw) {
      var DK = 'wb.dcw.v1', raw = null;
      try { raw = JSON.parse(localStorage.getItem(DK) || 'null'); } catch (e) { raw = null; }
      if (!raw || typeof raw !== 'object') raw = {};
      var hit = false;
      Object.keys(s.dcw).forEach(function (k) {
        if (!Array.isArray(raw[k])) raw[k] = [];
        if (!raw[k].length && Array.isArray(s.dcw[k]) && s.dcw[k].length) {
          raw[k] = s.dcw[k].slice(); hit = true;
        }
      });
      if (hit) { try { localStorage.setItem(DK, JSON.stringify(raw)); } catch (e) {} }
    }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); }
    catch (e) { toast('保存失败：浏览器存储不可用或已满', 'err'); }
  }
  function rerender() {
    if (typeof global.renderView === 'function') {
      try { global.renderView(true); return; } catch (e) {}
    }
  }

  /* ---------------- 远端数据（战报 / 雷达） ---------------- */
  var cache = { report: null, reportErr: '', radar: null, radarErr: '', busy: {} };

  function ensureReport() {
    if (cache.report || cache.busy.report) return;
    cache.busy.report = true;
    fetch('content/report/index.json?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { cache.report = d; cache.busy.report = false; rerender(); })
      .catch(function (e) { cache.reportErr = String(e.message || e); cache.busy.report = false; rerender(); });
  }
  function ensureRadar() {
    if (cache.radar || cache.busy.radar) return;
    cache.busy.radar = true;
    fetch('radar-data.json?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { cache.radar = d; cache.busy.radar = false; rerender(); })
      .catch(function (e) { cache.radarErr = String(e.message || e); cache.busy.radar = false; rerender(); });
  }
  function latestMonth() {
    if (!cache.report || !Array.isArray(cache.report.months) || !cache.report.months.length) return null;
    return cache.report.months[cache.report.months.length - 1];
  }
  function kpiOf(month) {
    var o = {};
    ((month && month.overview) || []).forEach(function (x) { o[x.k] = x.v; });
    return o;
  }

  /* 按类型分组算中位播放：老板的选题判据就靠这个 */
  function median(arr) {
    if (!arr.length) return 0;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
  }
  function byType(rows) {
    var g = {};
    (rows || []).forEach(function (r) {
      var t = r.type || '未分类';
      if (!g[t]) g[t] = [];
      if (r.play != null) g[t].push(Number(r.play) || 0);
    });
    return Object.keys(g).map(function (t) {
      return { type: t, n: g[t].length, med: median(g[t]), max: Math.max.apply(null, g[t]) };
    }).sort(function (a, b) { return b.med - a.med; });
  }

  /* ---------------- 小部件 ---------------- */
  function panel(title, sub, inner, headExtra) {
    return '<div class="cw-panel">' +
        '<div class="cw-panel-h"><b>' + esc(title) + '</b>' +
          (headExtra || '') +
          (sub ? '<span class="cw-panel-sub">' + esc(sub) + '</span>' : '') +
        '</div>' +
        '<div class="cw-panel-b">' + inner + '</div>' +
      '</div>';
  }
  function field(label, inner, hint) {
    return '<div class="cw-field"><label>' + esc(label) + '</label>' + inner +
      (hint ? '<span class="pl-hint">' + esc(hint) + '</span>' : '') + '</div>';
  }
  function inp(id, ph) {
    return '<input class="cw-in" id="' + id + '" placeholder="' + esc(ph || '') + '">';
  }
  function ta(id, ph, rows) {
    return '<textarea class="cw-ta" id="' + id + '" rows="' + (rows || 3) + '" placeholder="' + esc(ph || '') + '"></textarea>';
  }
  function sel(id, opts, cur) {
    return '<select class="cw-sel" id="' + id + '">' + opts.map(function (o) {
      var v = typeof o === 'object' ? o.v : o;
      var t = typeof o === 'object' ? o.t : o;
      return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('') + '</select>';
  }
  function tag(text, cls) {
    if (text === '' || text == null) return '';
    return '<span class="cw-tag ' + (cls || '') + '">' + esc(text) + '</span>';
  }
  function empty(big, small) {
    return '<div class="cw-empty"><b>' + esc(big) + '</b><span>' + esc(small) + '</span></div>';
  }
  function btn(label, act, attrs, cls) {
    return '<button class="cw-btn ' + (cls || '') + '" data-plnr="' + act + '" ' + (attrs || '') + '>' + esc(label) + '</button>';
  }
  function kpi(v, k, hint, tone) {
    return '<div class="pl-kpi' + (tone ? ' ' + tone : '') + '">' +
        '<div class="pl-kpi-v">' + v + '</div>' +
        '<div class="pl-kpi-k">' + esc(k) + '</div>' +
        (hint ? '<div class="pl-kpi-h">' + esc(hint) + '</div>' : '') +
      '</div>';
  }

  /* 子页入口卡：点开跳到旧页面，旧功能一点不改 */
  function jump(key, no, title, desc, meta) {
    return '<div class="pl-jump" data-jump="' + key + '">' +
        '<div class="pl-jump-no">' + esc(no) + '</div>' +
        '<div class="pl-jump-t">' + esc(title) + '</div>' +
        '<div class="pl-jump-d">' + esc(desc) + '</div>' +
        (meta ? '<div class="pl-jump-m">' + meta + '</div>' : '') +
        '<div class="pl-jump-go">打开 →</div>' +
      '</div>';
  }

  /* ---------------- 生产流水线：统计 ---------------- */
  function stats(pipe) {
    var d = today();
    var s = { total: pipe.length, byStage: {}, blocked: 0, overdue: 0, todayDue: 0, weekNew: 0, done: 0 };
    STAGES.forEach(function (x) { s.byStage[x.k] = 0; });
    var weekAgo = Date.now() - 7 * 86400000;
    pipe.forEach(function (t) {
      s.byStage[t.stage] = (s.byStage[t.stage] || 0) + 1;
      if (t.blocked) s.blocked++;
      if (t.stage === 'done') s.done++;
      var dd = dayDiff(t.due);
      if (dd !== null && dd < 0 && t.stage !== 'done') s.overdue++;
      if (t.due === d && t.stage !== 'done') s.todayDue++;
      var ct = Date.parse(t.createdAt || '');
      if (!isNaN(ct) && ct > weekAgo) s.weekNew++;
    });
    return s;
  }

  /* ============================================================
     01 工作驾驶舱
     ============================================================ */
  function renderDash() {
    ensureReport();
    var d = load();
    var pipe = d.pipe;
    var s = stats(pipe);
    var m = latestMonth();
    var K = kpiOf(m);

    /* 卡住的原因分类统计 */
    var reasons = {};
    pipe.forEach(function (t) {
      if (t.blocked && t.blockReason) reasons[t.blockReason] = (reasons[t.blockReason] || 0) + 1;
    });
    var reasonRows = Object.keys(reasons).sort(function (a, b) { return reasons[b] - reasons[a]; });

    /* 今天要做的事：截止今天或已超期 */
    var todo = pipe.filter(function (t) {
      if (t.stage === 'done') return false;
      var dd = dayDiff(t.due);
      return dd !== null && dd <= 0;
    }).sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); });

    /* 每列任务 */
    function col(stage) {
      var list = pipe.filter(function (t) { return t.stage === stage.k; });
      var body = list.length ? list.map(function (t) {
        var dd = dayDiff(t.due);
        var dueTxt = stage.k === 'done'
          ? (t.due ? String(t.due).slice(5).replace('-', '/') + ' 发布' : '')
          : (!t.due ? '' : (dd < 0 ? '超期 ' + (-dd) + ' 天' : dd === 0 ? '今天' : dd + ' 天后'));
        return '<div class="pl-task' + (t.blocked ? ' is-blocked' : '') + '">' +
            '<div class="pl-task-t">' + esc(t.title) + '</div>' +
            '<div class="pl-task-m">' +
              tag(t.account, 'is-brown') + tag(t.type, 'is-blue') +
              (t.owner ? tag(t.owner, 'is-acc') : '') +
            '</div>' +
            (t.blocked ? '<div class="pl-task-block">卡在：' + esc(t.blockReason || '未填原因') + '</div>' : '') +
            (dueTxt ? '<div class="pl-task-due' + (dd < 0 && stage.k !== 'done' ? ' is-over' : '') + '">' + esc(dueTxt) + '</div>' : '') +
            (t.note ? '<div class="pl-task-note">' + esc(t.note) + '</div>' : '') +
            '<div class="pl-task-act">' +
              (stage.k !== 'done'
                ? '<button class="pl-mini" data-plnr="adv" data-id="' + esc(t.id) + '" title="推进到下一阶段">下一步</button>'
                : '') +
              '<button class="pl-mini" data-plnr="block" data-id="' + esc(t.id) + '">' + (t.blocked ? '解除' : '卡住') + '</button>' +
              '<button class="pl-mini is-x" data-plnr="pdel" data-id="' + esc(t.id) + '">删</button>' +
            '</div>' +
          '</div>';
      }).join('') : '<div class="pl-col-empty">空</div>';
      return '<div class="pl-col">' +
          '<div class="pl-col-h"><b>' + esc(stage.n) + '</b>' +
            '<span class="pl-col-n">' + list.length + '</span></div>' +
          '<div class="pl-col-b">' + body + '</div>' +
        '</div>';
    }

    var addForm = panel('新建一条内容任务', '一条任务从选题走到发布，全程只在这一张表里',
      '<div class="cw-grid cw-g2">' +
        field('做的是什么', inp('pTitle', '例：Duo 加人脸解锁，但这不是 Face ID')) +
        field('发哪个号', sel('pAccount', d.accounts.map(function (a) { return a.name; }))) +
      '</div>' +
      '<div class="cw-grid cw-g3" style="margin-top:10px">' +
        field('内容类型', sel('pType', ['内容视频', '引流视频', '产品视频', '热点视频'])) +
        field('卡在谁手上', sel('pOwner', ['我', '助理', '老板', '无'])) +
        field('截止日期', '<input class="cw-in" id="pDue" type="date" value="' + today() + '">') +
      '</div>' +
      '<div style="margin-top:10px">' + field('备注（可选）', inp('pNote', '要拍什么画面、缺什么素材')) + '</div>' +
      '<div class="pl-form-foot">' + btn('加进流水线', 'padd', '', 'is-primary') + '</div>'
    );

    var overview = '<div class="pl-kpis">' +
        kpi(s.total, '流水线内', '全部未归档', '') +
        kpi(s.todayDue, '今天到期', s.todayDue ? '先干这些' : '今天没到期任务', s.todayDue ? 'is-warn' : '') +
        kpi(s.blocked, '卡住的', reasonRows.length ? reasonRows[0] + ' 占最多' : '没有阻塞', s.blocked ? 'is-danger' : 'is-ok') +
        kpi(s.overdue, '已超期', s.overdue ? '拖了就是链条问题' : '没有超期', s.overdue ? 'is-danger' : 'is-ok') +
        kpi(s.weekNew, '本周新增', '近 7 天进流水线', '') +
      '</div>';

    /* 战报摘要 */
    var reportBlock;
    if (cache.reportErr) {
      reportBlock = empty('战报数据没读到', cache.reportErr);
    } else if (!m) {
      reportBlock = empty('正在读战报', 'content/report/index.json');
    } else {
      var ty = byType(m.rows);
      reportBlock = '<div class="pl-kpis pl-kpis-sm">' +
          kpi(num(K['发布视频数（条）']), m.label + '发布', '', '') +
          kpi(num(K['总播放量']), m.label + '总播放', '', '') +
          kpi(num(K['平均单条播放量']), '平均单条', '', '') +
          kpi(num(K['播放量 100 万+（条）']), '百万播放', '爆款数', '') +
          kpi((K['互动率（赞+评+藏+转）/播放'] != null ? (K['互动率（赞+评+藏+转）/播放'] * 100).toFixed(2) + '%' : '—'), '互动率', '', '') +
        '</div>' +
        '<div class="pl-note">跑得动的类型：' + (ty.slice(0, 2).map(function (t) {
          return '<b>' + esc(t.type) + '</b> 中位 ' + num(t.med);
        }).join(' · ') || '—') + '</div>';
    }

    return '<div class="pl-wrap">' +
        overview +
        panel('今天该干的事', s.todo === 0 ? '没有到期的' : '按截止日期排，超期的在最上面',
          todo.length ? '<div class="pl-todo">' + todo.slice(0, 8).map(function (t) {
            var dd = dayDiff(t.due);
            return '<div class="pl-todo-row">' +
                '<span class="pl-todo-dot' + (dd < 0 ? ' is-over' : '') + '"></span>' +
                '<span class="pl-todo-t">' + esc(t.title) + '</span>' +
                '<span class="pl-todo-m">' + esc(t.account || '') + ' · ' + esc(t.owner || '未派') + '</span>' +
                '<span class="pl-todo-s">' + esc(STAGES[STAGE_IDX[t.stage]] ? STAGES[STAGE_IDX[t.stage]].n : t.stage) + '</span>' +
              '</div>';
          }).join('') + '</div>' : empty('今天没有到期任务', '新建一条，或去流水线里推进已有任务')
        ) +
        addForm +
        panel('生产流水线', '六阶段 · 点「下一步」推进，「卡住」要填原因',
          '<div class="pl-board">' + STAGES.map(col).join('') + '</div>'
        ) +
        (reasonRows.length ? panel('阻塞原因分布', '看是执行慢，还是链条本身就堵',
          '<div class="pl-bars">' + reasonRows.map(function (r) {
            var w = Math.round(reasons[r] / reasonRows[0] * 100);
            return '<div class="pl-bar-row"><span class="pl-bar-k">' + esc(r) + '</span>' +
                '<span class="pl-bar-t"><i style="width:' + w + '%"></i></span>' +
                '<span class="pl-bar-v">' + reasons[r] + '</span></div>';
          }).join('') + '</div>'
        ) : '') +
        panel(m ? m.label + '账号表现' : '账号表现', '来自战报，不重复录入', reportBlock,
          '<a class="cw-btn is-sm" href="javascript:void(0)" data-jump="data" style="margin-left:auto">看数据分析 →</a>'
        ) +
        panel('账号分工', '三个号各干什么，别混着发',
          '<div class="pl-acc">' + d.accounts.map(function (a) {
            var cnt = pipe.filter(function (t) { return t.account === a.name; }).length;
            var dn = pipe.filter(function (t) { return t.account === a.name && t.stage === 'done'; }).length;
            return '<div class="pl-acc-row">' +
                '<b>' + esc(a.name) + '</b>' +
                '<span class="pl-acc-goal">' + esc(a.goal) + '</span>' +
                '<span class="pl-acc-n">在产 ' + cnt + ' · 已发 ' + dn + '</span>' +
              '</div>';
          }).join('') + '</div>'
        ) +
      '</div>';
  }

  /* ============================================================
     02 选题策划中心（概览 + 四个子页入口）
     ============================================================ */
  function renderPlan() {
    ensureRadar();
    var d = load();
    var cand = 0, shoot = 0, updated = '';
    if (cache.radar) {
      cand = (cache.radar.picks || []).length;
      shoot = (cache.radar.picks || []).filter(function (p) { return (p.score || 0) >= 5; }).length;
      updated = cache.radar.updated || '';
    }
    var pipe = d.pipe;
    var inIdea = pipe.filter(function (t) { return t.stage === 'idea'; }).length;
    var inScript = pipe.filter(function (t) { return t.stage === 'script'; }).length;

    var head = '<div class="pl-kpis">' +
        kpi(cand || '—', '今日候选', updated || '雷达数据', '') +
        kpi(shoot || '—', '够分能拍', '分数 ≥5', shoot ? 'is-ok' : '') +
        kpi(inIdea, '待研究选题', '在流水线 idea 阶段', '') +
        kpi(inScript, '待写稿', '在流水线 script 阶段', '') +
      '</div>';

    var cycle = '<div class="pl-cycle">' + [
      ['待研究', '这条能不能拍，画面在哪'],
      ['已定题', '选题进流水线，主题定了'],
      ['已写稿', '文案过审，字数时长合规'],
      ['已拍', '素材回传，可以剪'],
      ['已发', '记录发布时间与账号'],
      ['已验证', '数据回来，可进复用库']
    ].map(function (x, i) {
      return '<div class="pl-cycle-i"><span class="pl-cycle-n">' + pad(i + 1) + '</span>' +
          '<b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div>';
    }).join('') + '</div>';

    return '<div class="pl-wrap">' +
        head +
        panel('选题从哪里进来', '四个入口，都能点开，接的还是原来那套',
          '<div class="pl-jumps">' +
            jump('radar', '01', '今日雷达', '每天 10:20 抓 45 个平台，筛出数码相关按可拍性打分', cand ? '今天 ' + cand + ' 条候选' : '') +
            jump('trends', '02', '热门选题', '只收录有来源的信号，来源必填', '') +
            jump('account', '03', '账号拆解', '拆对标账号，生成可复制指令', '') +
            jump('hooks', '04', '五秒开头', '存验证过的开场，按适用场景检索', '') +
          '</div>'
        ) +
        panel('选题生命周期', '别让选题库变成只进不出的垃圾场',
          cycle +
          '<div class="pl-note" style="margin-top:14px">过期没动的选题要清掉，验证成功的要进复用库。什么标准算验证成功：<b>小号 3.5 万播放且有互动</b>。</div>'
        ) +
        panel('选题判断标准', '写之前先过一遍，过不了就别写',
          '<div class="pl-rules">' +
            '<div class="pl-rule"><b>1</b><span>观众会不会看到他从没见过的画面</span></div>' +
            '<div class="pl-rule"><b>2</b><span>带人干一件事，强过坐着讲一件事</span></div>' +
            '<div class="pl-rule"><b>3</b><span>手上有没有这台真机，没有就不写机型判断</span></div>' +
            '<div class="pl-rule"><b>4</b><span>写机型前先查体型：折叠方式 / 三维重量 / 内屏比例</span></div>' +
            '<div class="pl-rule"><b>5</b><span>拿货、到手、现在什么价，这三类跑得最好</span></div>' +
          '</div>'
        ) +
        panel('选题复用库', '把验证过的拆成可以再拍一次的结构',
          d.pipe.filter(function (t) { return t.stage === 'done'; }).length
            ? '<div class="pl-reuse">' + d.pipe.filter(function (t) { return t.stage === 'done'; }).slice(0, 12).map(function (t) {
                return '<div class="pl-reuse-i"><b>' + esc(t.title) + '</b>' +
                    '<span>' + esc(t.type || '') + ' · ' + esc(t.account || '') + '</span></div>';
              }).join('') + '</div>'
            : empty('还没有已发布的', '流水线里走到「已发布」的会自动出现在这')
        ) +
      '</div>';
  }

  /* ============================================================
     03 文案生产中心
     ============================================================ */
  function renderCopy() {
    var d = load();
    var scripting = d.pipe.filter(function (t) { return t.stage === 'script' || t.stage === 'idea'; });
    var donePipe = d.pipe.filter(function (t) { return t.stage !== 'idea'; });

    var checker = panel('字数 / 时长自查', '写的时候贴进来，超 100 秒会标红',
      '<textarea class="cw-ta" id="pCheck" rows="6" placeholder="把口播稿贴进来，边写边看字数"></textarea>' +
      '<div class="pl-checker" id="pCheckOut">' +
        '<span>字数 <b id="pCheckW">0</b></span>' +
        '<span>按 6 字/秒估 <b id="pCheckS">0</b> 秒</span>' +
        '<span id="pCheckTip" class="pl-checker-tip">目标 520-700 字 / 1 分 20 - 1 分 40</span>' +
      '</div>'
    );

    var listPanel = panel('在写的稿子', '来自流水线「选题确认 / 文案确认」两条',
      scripting.length ? '<div class="pl-scripts">' + scripting.map(function (t) {
        var body = t.script || '';
        var w = body.replace(/\s/g, '').length;
        return '<div class="pl-script">' +
            '<div class="pl-script-h">' +
              '<b>' + esc(t.title) + '</b>' +
              tag(t.stage === 'script' ? '文案确认' : '选题确认', 'is-blue') +
              (w ? tag(w + ' 字 / ' + Math.round(w / 6) + ' 秒', w > 700 ? 'is-warn' : 'is-ok') : '') +
            '</div>' +
            (body ? '<div class="pl-script-b">' + esc(body) + '</div>' : '<div class="pl-script-b is-empty">还没写，点下面写</div>') +
            '<div class="pl-script-f">' +
              '<button class="pl-mini" data-plnr="scribe" data-id="' + esc(t.id) + '">' + (body ? '改稿' : '写稿') + '</button>' +
              (body ? '<button class="pl-mini" data-plnr="copytext" data-id="' + esc(t.id) + '">复制正文</button>' : '') +
            '</div>' +
          '</div>';
      }).join('') + '</div>' : empty('没有在写的', '先在驾驶舱加一条任务，再到这写稿')
    );

    var assetPanel = panel('卖点 / 素材资料库', '写稿前先翻这里，别每次从零想',
      '<div class="cw-grid cw-g2">' +
        field('资料名称', inp('pAssetT', '例：Duo 内屏出厂哑光膜 / 星芒 O1 Pro 配置')) +
        field('类型', sel('pAssetK', ['产品卖点', '价格核', '用户原话', '竞品信息', '拍摄画面'])) +
      '</div>' +
      '<div style="margin-top:10px">' + field('内容', ta('pAssetB', '一条一条写清楚，别写形容词', 3)) + '</div>' +
      '<div class="pl-form-foot">' + btn('存进资料库', 'aadd', '', 'is-primary') + '</div>' +
      (d.assets.length ? '<div class="pl-assets">' + d.assets.map(function (a) {
        return '<div class="pl-asset">' +
            '<div class="pl-asset-h"><b>' + esc(a.title) + '</b>' + tag(a.kind, 'is-brown') +
              '<button class="pl-mini is-x" data-plnr="adel" data-id="' + esc(a.id) + '">删</button></div>' +
            '<div class="pl-asset-b">' + esc(a.body) + '</div>' +
          '</div>';
      }).join('') + '</div>' : '<div class="pl-note" style="margin-top:12px">资料库还是空的。报价、参数、用户原话都可以存进来。</div>')
    );

    var rulePanel = panel('写稿铁律', '这几条不过，稿子就得退回',
      '<div class="pl-rules">' +
        '<div class="pl-rule"><b>字数</b><span>520-700 字，1 分 20 到 1 分 40</span></div>' +
        '<div class="pl-rule"><b>形式</b><span>一整段，不分段不编号，像语音转文字</span></div>' +
        '<div class="pl-rule"><b>语感</b><span>短句、带口水词、自问自答，允许口误</span></div>' +
        '<div class="pl-rule"><b>结尾</b><span>固定那句：完了你们记得买配件多问问我奥</span></div>' +
        '<div class="pl-rule"><b>禁写</b><span>不分镜、不写拍摄指导、不写「对我这行意味着什么」</span></div>' +
        '<div class="pl-rule"><b>价格</b><span>必须核过官网，没核过不许写数字</span></div>' +
      '</div>'
    );

    return '<div class="pl-wrap">' +
        checker +
        listPanel +
        panel('优质文案对照', 'AI 生成新稿前先读这个，别自己发明风格',
          donePipe.length ? '<div class="pl-goldlist">' + donePipe.slice(0, 10).map(function (t) {
            return '<div class="pl-gold"><b>' + esc(t.title) + '</b><span>' + esc(t.type || '') + '</span></div>';
          }).join('') + '</div>'
          : empty('还没有可对照的成稿', '在「文案生产」里通过的稿子会进这里')
        ) +
        rulePanel +
        assetPanel +
      '</div>';
  }

  /* ============================================================
     04 视频生产中心
     ============================================================ */
  function renderProd() {
    var d = load();
    var pipe = d.pipe;
    var s = stats(pipe);

    function stageBlock(key) {
      var list = pipe.filter(function (t) { return t.stage === key; })
        .sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); });
      return list;
    }

    var flow = '<div class="pl-flow">' + STAGES.map(function (st, i) {
      var n = s.byStage[st.k] || 0;
      return '<div class="pl-flow-i' + (n ? ' is-on' : '') + '">' +
          '<span class="pl-flow-n">' + pad(i + 1) + '</span>' +
          '<b>' + esc(st.n) + '</b>' +
          '<span class="pl-flow-c">' + n + '</span>' +
        '</div>' + (i < STAGES.length - 1 ? '<span class="pl-flow-arrow">↓</span>' : '');
    }).join('') + '</div>';

    function table(list, title, sub) {
      if (!list.length) return panel(title, sub, empty('这一阶段是空的', '没有卡在这里的任务'));
      return panel(title, sub,
        '<div class="pl-tbl">' +
          '<div class="pl-tbl-h"><span>任务</span><span>账号</span><span>负责人</span><span>截止</span><span>状态</span><span></span></div>' +
          list.map(function (t) {
            var dd = dayDiff(t.due);
            var dueCls = dd !== null && dd < 0 ? ' is-over' : dd === 0 ? ' is-today' : '';
            return '<div class="pl-tbl-r">' +
                '<span class="pl-tbl-t">' + esc(t.title) + '</span>' +
                '<span>' + esc(t.account || '—') + '</span>' +
                '<span>' + esc(t.owner || '未派') + '</span>' +
                '<span class="' + dueCls.trim() + '">' + esc(t.due || '—') + '</span>' +
                '<span>' + (t.blocked ? '<em class="pl-red">卡住</em>' : '<em class="pl-dim">正常</em>') + '</span>' +
                '<span class="pl-tbl-a">' +
                  (t.stage !== 'done' ? '<button class="pl-mini" data-plnr="adv" data-id="' + esc(t.id) + '">推进</button>' : '') +
                  '<button class="pl-mini" data-plnr="block" data-id="' + esc(t.id) + '">' + (t.blocked ? '解除' : '卡住') + '</button>' +
                '</span>' +
              '</div>';
          }).join('') + '</div>'
      );
    }

    return '<div class="pl-wrap">' +
        panel('六道工序', '一条内容从定题到发出去，卡在哪一格一眼看得见',
          flow +
          '<div class="pl-note" style="margin-top:14px">还在产 ' + (s.total - s.done) + ' 条 · 已发 ' + s.done + ' 条 · 卡住 ' + s.blocked + ' 条</div>'
        ) +
        table(stageBlock('shoot'), '待拍摄', '要老板或助理出素材的都在这一格') +
        table(stageBlock('edit'), '剪辑中', '剪完要验收：画面、字幕、口播对不对得上') +
        table(stageBlock('publish'), '待发布', '19:00 发主视频，发完回来点「推进」记已发') +
        panel('发布排期', '按截止日期排，19:00 是主视频的固定时间',
          (function () {
            var up = pipe.filter(function (t) { return t.stage !== 'done' && t.due; })
              .sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); });
            if (!up.length) return empty('没有排期', '在驾驶舱给任务填上截止日期就会出现');
            return '<div class="pl-cal">' + up.slice(0, 14).map(function (t) {
              var dd = dayDiff(t.due);
              var cls = dd < 0 ? 'is-over' : dd === 0 ? 'is-today' : '';
              return '<div class="pl-cal-i ' + cls + '">' +
                  '<b>' + esc(String(t.due).slice(5)) + '</b>' +
                  '<span>' + esc(t.title) + '</span>' +
                  '<em>' + esc(t.account || '') + '</em>' +
                '</div>';
            }).join('') + '</div>';
          })()
        ) +
        panel('负责人与验收', '从自己干，慢慢变成管流程',
          '<div class="pl-rules">' +
            '<div class="pl-rule"><b>负责人</b><span>每条任务都要有人，写「无」等于没人管</span></div>' +
            '<div class="pl-rule"><b>拍摄验收</b><span>画面能不能看清机身、手在动、口播对得上嘴</span></div>' +
            '<div class="pl-rule"><b>剪辑验收</b><span>开头 5 秒有没有钩子、字幕没错字、时长 80-100 秒</span></div>' +
            '<div class="pl-rule"><b>发布验收</b><span>19:00 发出、带 #郝金彪、评论区置顶引导</span></div>' +
          '</div>'
        ) +
      '</div>';
  }

  /* ============================================================
     05 数据分析中心
     ============================================================ */
  function renderData() {
    ensureReport();
    var m = latestMonth();
    if (cache.reportErr) {
      return '<div class="pl-wrap">' + panel('数据分析中心', '', empty('战报数据没读到', cache.reportErr)) + '</div>';
    }
    if (!m) {
      return '<div class="pl-wrap">' + panel('数据分析中心', '', empty('正在读战报', 'content/report/index.json')) + '</div>';
    }
    var K = kpiOf(m);
    var rows = m.rows || [];
    var ty = byType(rows);

    var totalPlay = Number(K['总播放量'] || 0);
    var pub = Number(K['发布视频数（条）'] || 0);
    var hits = rows.filter(function (r) { return Number(r.play) >= 1000000; }).length;
    var over100k = rows.filter(function (r) { return Number(r.play) >= 100000; }).length;

    /* 爆款率：百万以上 / 发布数 */
    var hitRate = pub ? (hits / pub * 100).toFixed(1) : '0';

    var kpis = '<div class="pl-kpis">' +
        kpi(num(pub), m.label + '产量', '', '') +
        kpi(num(totalPlay), '总播放', '', '') +
        kpi(num(K['平均单条播放量']), '平均单条', '', '') +
        kpi(hits, '百万播放', '爆款数', hits ? 'is-ok' : '') +
        kpi(hitRate + '%', '爆款率', '百万 / 总产量', '') +
        kpi(num(over100k), '10 万+', '跑起来的下限', '') +
      '</div>';

    var typeTable = '<div class="pl-tbl pl-tbl-type">' +
        '<div class="pl-tbl-h"><span>选题类型</span><span>条数</span><span>中位播放</span><span>最高</span><span>占比</span></div>' +
        ty.map(function (t) {
          var w = pub ? (t.n / pub * 100).toFixed(0) : 0;
          return '<div class="pl-tbl-r">' +
              '<span class="pl-tbl-t">' + esc(t.type) + '</span>' +
              '<span>' + t.n + '</span>' +
              '<span><b>' + num(t.med) + '</b></span>' +
              '<span>' + num(t.max) + '</span>' +
              '<span>' + w + '%</span>' +
            '</div>';
        }).join('') + '</div>';

    /* Top 10 */
    var top = rows.slice().sort(function (a, b) { return (b.play || 0) - (a.play || 0); }).slice(0, 10);

    var deep = panel('反向关联：谁带来了好成绩', '点开一条爆款，能看到它是什么类型、什么时候发的',
      '<div class="pl-tbl">' +
        '<div class="pl-tbl-h"><span>标题</span><span>类型</span><span>播放</span><span>完播</span><span>5秒留存</span></div>' +
        top.map(function (r) {
          return '<div class="pl-tbl-r">' +
              '<span class="pl-tbl-t" title="' + esc(r.title) + '">' + esc(String(r.title || '').slice(0, 26)) + '</span>' +
              '<span>' + esc(r.type || '—') + '</span>' +
              '<span><b>' + num(r.play) + '</b></span>' +
              '<span>' + (r.fin != null ? (r.fin * 100).toFixed(1) + '%' : '—') + '</span>' +
              '<span>' + (r.f5 != null ? (r.f5 * 100).toFixed(1) + '%' : '—') + '</span>' +
            '</div>';
        }).join('') + '</div>'
    );

    return '<div class="pl-wrap">' +
        kpis +
        panel('什么类型跑得动', '按中位播放量排，不看均值（均值会被爆款带偏）',
          typeTable +
          '<div class="pl-note" style="margin-top:12px">中位最高的是 <b>' + esc(ty[0] ? ty[0].type : '—') + '</b>。' +
          '写稿前先问自己：这条选题属于哪一类？落在最低那两档的，先别写。</div>'
        ) +
        deep +
        panel('账号对比与复盘', '月度、类型、爆款三个角度看',
          '<div class="pl-jumps">' +
            jump('report', '01', '战报明细', '每月完整数据：大盘 / 明细 / TOP10 / 排行', m.label) +
            jump('dash', '02', '回驾驶舱', '把结论变成任务，别再只看不动', '') +
          '</div>'
        ) +
        panel('这个月要盯的数', '不是看数字好看，是看哪里在漏',
          '<div class="pl-rules">' +
            '<div class="pl-rule"><b>平均完播</b><span>' + (K['平均完播率'] != null ? (K['平均完播率'] * 100).toFixed(2) + '%' : '—') + ' · 低于 6% 说明开头没抓住</span></div>' +
            '<div class="pl-rule"><b>平均播放时长</b><span>' + (K['平均播放时长（秒）'] || '—') + ' 秒 · 对上稿子长度没有</span></div>' +
            '<div class="pl-rule"><b>互动率</b><span>' + (K['互动率（赞+评+藏+转）/播放'] != null ? (K['互动率（赞+评+藏+转）/播放'] * 100).toFixed(2) + '%' : '—') + ' · 低说明内容没话可说</span></div>' +
            '<div class="pl-rule"><b>粉丝增量</b><span>' + num(K['总粉丝增量']) + ' · 播放高但不涨粉＝内容对，人不认</span></div>' +
          '</div>'
        ) +
      '</div>';
  }

  /* ============================================================
     06 AI 与知识库
     ============================================================ */
  function renderKnow() {
    var d = load();
    /* 顺手把 SOP / 开头库的条数带出来，省得还要点进去看 */
    var dcw = null;
    try { dcw = JSON.parse(localStorage.getItem('wb.dcw.v1') || 'null') || {}; } catch (e) { dcw = {}; }
    var nSop = (dcw.sops || []).length, nHook = (dcw.hooks || []).length;
    var flowCards = '<div class="pl-ai">' + AIFLOW.map(function (f, i) {
      return '<div class="pl-ai-i">' +
          '<div class="pl-ai-h"><b>' + esc(f.t) + '</b><span>' + pad(i + 1) + '</span></div>' +
          '<div class="pl-ai-io">' +
            '<span><em>输入</em>' + esc(f.i) + '</span>' +
            '<span><em>输出</em>' + esc(f.o) + '</span>' +
          '</div>' +
          '<div class="pl-ai-p">' + esc(f.p.slice(0, 56)) + '…</div>' +
          '<button class="pl-mini" data-plnr="aiprompt" data-i="' + i + '">复制提示词</button>' +
        '</div>';
    }).join('') + '</div>';

    return '<div class="pl-wrap">' +
        panel('AI 工作流', '六条固定流程，不是聊天框。复制提示词直接用',
          flowCards +
          '<div class="pl-note" style="margin-top:14px">规矩：先翻素材库和历史成稿，再让 AI 动手。别每次让它从零发明一套。</div>'
        ) +
        panel('知识库入口', '已经在用的东西，别另起一套',
          '<div class="pl-jumps">' +
            jump('sop', '01', 'SOP 库', '能重复执行的流程 · 适用条件 · 验证结果', nSop ? nSop + ' 条' : '') +
            jump('hooks', '02', '五秒开头', '验证过的开场，按场景检索', nHook ? nHook + ' 条' : '') +
            jump('account', '03', '账号拆解', '拆对标账号的结构与打法', '') +
            jump('copy', '04', '文案生产', '素材库和写稿铁律都在那', d.assets.length ? d.assets.length + ' 条素材' : '') +
          '</div>'
        ) +
        panel('经验沉淀', '一条经验值钱的地方是「什么条件下成立」',
          '<div class="pl-rules">' +
            '<div class="pl-rule"><b>案例</b><span>先记事实：什么题、什么画面、什么数据</span></div>' +
            '<div class="pl-rule"><b>条件</b><span>再记前提：什么号发的、当时有没有热点</span></div>' +
            '<div class="pl-rule"><b>结论</b><span>最后才是判断，且要写清适用范围</span></div>' +
            '<div class="pl-rule"><b>复盘</b><span>跑砸的也要记，别只存成功的</span></div>' +
          '</div>'
        ) +
        panel('当前版本', '策划台本身也要能回溯',
          '<div class="pl-kv">' +
            '<div><em>流水线任务</em><b>' + d.pipe.length + '</b></div>' +
            '<div><em>素材条目</em><b>' + d.assets.length + '</b></div>' +
            '<div><em>账号</em><b>' + d.accounts.length + '</b></div>' +
            '<div><em>存储</em><b>wb.plnr.v1</b></div>' +
          '</div>'
        ) +
      '</div>';
  }

  /* ============================================================
     弹窗：改稿 / 填阻塞原因
     ============================================================ */
  function openScript(id) {
    var d = load();
    var t = d.pipe.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!t) return;
    var root = document.getElementById('modalRoot');
    if (!root) { toast('页面结构没找到弹窗容器', 'err'); return; }
    root.innerHTML =
      '<div class="modal" id="plModal">' +
        '<div class="modal-box" role="dialog" aria-modal="true">' +
          '<div class="modal-head"><div class="modal-head-main">' +
            '<div class="modal-title">' + esc(t.title) + '</div>' +
            '<div class="modal-meta"><span>口播正文</span><span>520-700 字</span></div>' +
          '</div><div class="modal-tools">' +
            '<button class="icon-btn" id="plModalX" aria-label="关闭">✕</button>' +
          '</div></div>' +
          '<div class="modal-body">' +
            '<textarea class="cw-ta" id="plScriptTa" rows="14" style="width:100%">' + esc(t.script || '') + '</textarea>' +
            '<div class="pl-checker" id="plModalChk"><span>字数 <b>0</b></span><span>约 <b>0</b> 秒</span></div>' +
          '</div>' +
          '<div class="modal-foot">' +
            '<button class="cw-btn" id="plModalCancel">取消</button>' +
            '<button class="cw-btn is-primary" id="plModalSave">存稿</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    var tael = document.getElementById('plScriptTa');
    function refresh() {
      var w = String(tael.value || '').replace(/\s/g, '').length;
      document.getElementById('plModalChk').innerHTML =
        '<span>字数 <b>' + w + '</b></span><span>约 <b>' + Math.round(w / 6) + '</b> 秒</span>' +
        '<span class="pl-checker-tip ' + (w > 700 || (w > 0 && w < 520) ? 'is-warn' : 'is-ok') + '">' +
        (w > 700 ? '超了，砍一段' : w > 0 && w < 520 ? '不够，再补点' : '在这个范围里') + '</span>';
    }
    tael.addEventListener('input', refresh);
    refresh();
    function close() { root.innerHTML = ''; }
    document.getElementById('plModalX').onclick = close;
    document.getElementById('plModalCancel').onclick = close;
    document.getElementById('plModalSave').onclick = function () {
      var d2 = load();
      d2.pipe.forEach(function (x) {
        if (String(x.id) === String(id)) {
          x.script = tael.value;
          if (x.stage === 'idea') x.stage = 'script';
        }
      });
      save(d2);
      close();
      toast('存好了');
      rerender();
    };
  }

  function openBlock(id) {
    var d = load();
    var t = d.pipe.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!t) return;
    if (t.blocked) {
      d.pipe.forEach(function (x) { if (String(x.id) === String(id)) { x.blocked = false; x.blockReason = ''; } });
      save(d); toast('已解除'); rerender(); return;
    }
    var reasons = ['等老板拍摄', '缺选题', '缺产品素材', '文案未确认', '助理还没做完', '等价格核实'];
    var root = document.getElementById('modalRoot');
    if (!root) { toast('页面结构没找到弹窗容器', 'err'); return; }
    root.innerHTML =
      '<div class="modal" id="plModal">' +
        '<div class="modal-box" role="dialog" aria-modal="true">' +
          '<div class="modal-head"><div class="modal-head-main">' +
            '<div class="modal-title">卡在哪了</div>' +
            '<div class="modal-meta"><span>' + esc(t.title) + '</span></div>' +
          '</div><div class="modal-tools"><button class="icon-btn" id="plModalX">✕</button></div></div>' +
          '<div class="modal-body">' +
            '<div class="pl-picks" id="plReasons">' + reasons.map(function (r) {
              return '<button class="pl-pick" data-r="' + esc(r) + '">' + esc(r) + '</button>';
            }).join('') + '</div>' +
            '<div style="margin-top:12px"><input class="cw-in" id="plReasonIn" placeholder="或者自己写"></div>' +
          '</div>' +
          '<div class="modal-foot"><button class="cw-btn" id="plModalCancel">取消</button></div>' +
        '</div>' +
      '</div>';
    function apply(r) {
      if (!r) return;
      var d2 = load();
      d2.pipe.forEach(function (x) {
        if (String(x.id) === String(id)) { x.blocked = true; x.blockReason = r; }
      });
      save(d2);
      root.innerHTML = '';
      toast('记下了：' + r);
      rerender();
    }
    document.getElementById('plReasons').onclick = function (e) {
      var b = e.target.closest('.pl-pick');
      if (b) apply(b.dataset.r);
    };
    document.getElementById('plModalX').onclick = function () { root.innerHTML = ''; };
    document.getElementById('plModalCancel').onclick = function () { root.innerHTML = ''; };
    document.getElementById('plReasonIn').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') apply(String(this.value || '').trim());
    });
  }

  /* ============================================================
     事件委托（document 级，重渲染不用重绑）
     ============================================================ */
  function bind() {
    if (window.__plnrBound) return;
    window.__plnrBound = true;

    document.addEventListener('click', function (e) {
      /* 子页跳转 */
      var j = e.target.closest('[data-jump]');
      if (j) {
        e.preventDefault();
        var k = j.dataset.jump;
        if (typeof global.switchTab === 'function') global.switchTab(k);
        return;
      }

      var el = e.target.closest('[data-plnr]');
      if (!el) return;
      var act = el.dataset.plnr;
      var id = el.dataset.id;
      var d = load();

      if (act === 'padd') {
        var title = val('pTitle');
        if (!title) { toast('先写做的是什么', 'err'); return; }
        d.pipe.unshift({
          id: uid(), title: title,
          account: val('pAccount'), type: val('pType'),
          stage: 'idea', owner: val('pOwner'),
          due: val('pDue') || today(),
          blocked: false, blockReason: '', note: val('pNote'),
          script: '', createdAt: today()
        });
        save(d); toast('进流水线了'); rerender(); return;
      }

      if (act === 'adv' || act === 'back') {
        d.pipe.forEach(function (t) {
          if (String(t.id) !== String(id)) return;
          var i = STAGE_IDX[t.stage];
          if (i == null) i = 0;
          var ni = act === 'adv' ? Math.min(STAGES.length - 1, i + 1) : Math.max(0, i - 1);
          t.stage = STAGES[ni].k;
          if (t.stage === 'done') { t.blocked = false; t.blockReason = ''; t.doneAt = today(); }
        });
        save(d); rerender(); return;
      }

      if (act === 'block') { openBlock(id); return; }
      if (act === 'scribe') { openScript(id); return; }

      if (act === 'pdel') {
        d.pipe = d.pipe.filter(function (t) { return String(t.id) !== String(id); });
        save(d); toast('删了'); rerender(); return;
      }

      if (act === 'aadd') {
        var at = val('pAssetT'), ab = val('pAssetB');
        if (!at || !ab) { toast('名称和内容都要填', 'err'); return; }
        d.assets.unshift({ id: uid(), title: at, kind: val('pAssetK'), body: ab, createdAt: today() });
        save(d); toast('存好了'); rerender(); return;
      }

      if (act === 'adel') {
        d.assets = d.assets.filter(function (a) { return String(a.id) !== String(id); });
        save(d); rerender(); return;
      }

      if (act === 'copytext') {
        var t2 = d.pipe.filter(function (x) { return String(x.id) === String(id); })[0];
        if (t2 && t2.script) {
          try { navigator.clipboard.writeText(t2.script); toast('正文已复制'); }
          catch (err) { toast('复制失败，手动选一下', 'err'); }
        }
        return;
      }

      if (act === 'aiprompt') {
        var f = AIFLOW[Number(el.dataset.i)];
        if (f) {
          try { navigator.clipboard.writeText(f.p); toast('提示词已复制：' + f.t); }
          catch (err) { toast('复制失败', 'err'); }
        }
        return;
      }
    });

    /* 字数自查实时算 */
    document.addEventListener('input', function (e) {
      if (e.target && e.target.id === 'pCheck') {
        var w = String(e.target.value || '').replace(/\s/g, '').length;
        var sec = Math.round(w / 6);
        var wEl = document.getElementById('pCheckW');
        var sEl = document.getElementById('pCheckS');
        var tEl = document.getElementById('pCheckTip');
        if (wEl) wEl.textContent = w;
        if (sEl) sEl.textContent = sec;
        if (tEl) {
          tEl.textContent = w === 0 ? '目标 520-700 字 / 1 分 20 - 1 分 40'
            : w > 700 ? '超了 ' + (w - 700) + ' 字，先砍一段'
            : w < 520 ? '还差 ' + (520 - w) + ' 字'
            : '字数正好 · 约 ' + sec + ' 秒';
          tEl.className = 'pl-checker-tip ' + (w > 700 || (w > 0 && w < 520) ? 'is-warn' : 'is-ok');
        }
      }
    });
  }

  /* ============================================================
     样式：只注入一次，命名全带 pl- 前缀，不碰旧样式
     ============================================================ */
  function style() {
    if (document.getElementById('plnrStyle')) return;
    var css = [
      '.nav-item.is-sub{padding-left:34px;font-size:12.5px}',
      '.nav-item.is-sub.active{padding-left:34px}',
      '.nav-item.is-sub .nav-count{font-size:10.5px}',
      '.pl-wrap .cw-panel-h{flex-wrap:wrap;row-gap:2px}',
      '.pl-wrap .cw-panel-h .cw-panel-sub{font-size:11px}',
      '.pl-wrap{display:flex;flex-direction:column;gap:16px}',
      '.pl-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:10px}',
      '.pl-kpi{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:12px;padding:12px 14px;min-width:0}',
      '.pl-kpi-v{font-size:22px;font-weight:600;line-height:1.15;color:#1c1c1e;letter-spacing:-.01em}',
      '.pl-kpi-k{font-size:12px;color:#6b6b70;margin-top:3px}',
      '.pl-kpi-h{font-size:11px;color:#9a9a9e;margin-top:2px}',
      '.pl-kpi.is-danger{border-color:rgba(200,50,40,.28);background:#fdf3f2}',
      '.pl-kpi.is-danger .pl-kpi-v{color:#b3261e}',
      '.pl-kpi.is-warn{border-color:rgba(200,130,20,.3);background:#fdf8ee}',
      '.pl-kpi.is-warn .pl-kpi-v{color:#9a6100}',
      '.pl-kpi.is-ok{border-color:rgba(30,140,80,.22);background:#f3faf6}',
      '.pl-kpi.is-ok .pl-kpi-v{color:#1a7a48}',
      '.pl-kpis-sm .pl-kpi-v{font-size:18px}',
      '.pl-board{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;padding-bottom:4px}',
      '.pl-col{background:#faf9f7;border:1px solid rgba(0,0,0,.055);border-radius:11px;padding:10px 9px;min-width:0}',
      '.pl-col-h{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#4a4a4f;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid rgba(0,0,0,.05)}',
      '.pl-col-n{background:#ecebe7;border-radius:20px;padding:1px 7px;font-size:11px;color:#5f5f63}',
      '.pl-col-b{display:flex;flex-direction:column;gap:8px}',
      '.pl-col-empty{font-size:11.5px;color:#b5b5b8;text-align:center;padding:14px 0}',
      '.pl-task{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:9px;padding:9px 10px;min-width:0}',
      '.pl-task.is-blocked{border-color:rgba(200,50,40,.3);background:#fdf7f6}',
      '.pl-task-t{font-size:12.5px;color:#1c1c1e;line-height:1.45;word-break:break-word}',
      '.pl-task-m{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}',
      '.pl-task-block{font-size:11px;color:#b3261e;margin-top:6px;line-height:1.5}',
      '.pl-task-due{font-size:11px;color:#8a8a8e;margin-top:5px}',
      '.pl-task-due.is-over{color:#b3261e;font-weight:500}',
      '.pl-task-note{font-size:11px;color:#6b6259;margin-top:5px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
      '.pl-task-act{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}',
      '.pl-mini{font:inherit;font-size:11px;line-height:1;padding:5px 8px;border-radius:6px;border:1px solid rgba(0,0,0,.12);background:#fff;color:#4a4a4f;cursor:pointer}',
      '.pl-mini:hover{background:#f4f3f0}',
      '.pl-mini.is-x{color:#a8a8ac;border-color:rgba(0,0,0,.07)}',
      '.pl-mini.is-x:hover{color:#b3261e;border-color:rgba(200,50,40,.3)}',
      '.pl-todo{display:flex;flex-direction:column;gap:0}',
      '.pl-todo-row{display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid rgba(0,0,0,.045);font-size:12.5px}',
      '.pl-todo-row:last-child{border-bottom:0}',
      '.pl-todo-dot{width:6px;height:6px;border-radius:50%;background:#c9c9cc;flex:0 0 auto}',
      '.pl-todo-dot.is-over{background:#d33b30}',
      '.pl-todo-t{flex:1 1 auto;color:#1c1c1e;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pl-todo-m{color:#8a8a8e;font-size:11.5px;flex:0 0 auto}',
      '.pl-todo-s{color:#6b6b70;font-size:11px;background:#f1f0ec;padding:2px 7px;border-radius:5px;flex:0 0 auto}',
      '.pl-form-foot{margin-top:12px;display:flex;gap:8px}',
      '.pl-hint{font-size:11px;color:#9a9a9e;margin-top:3px}',
      '.pl-note{font-size:12px;color:#6b6b70;line-height:1.7;background:#faf9f6;border-left:2px solid #e6e3dc;padding:9px 12px;border-radius:0 8px 8px 0}',
      '.pl-bars{display:flex;flex-direction:column;gap:8px}',
      '.pl-bar-row{display:grid;grid-template-columns:104px 1fr 28px;align-items:center;gap:10px;font-size:12px}',
      '.pl-bar-k{color:#4a4a4f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pl-bar-t{height:6px;background:#eeede9;border-radius:3px;overflow:hidden}',
      '.pl-bar-t i{display:block;height:100%;background:#c9743f;border-radius:3px}',
      '.pl-bar-v{color:#8a8a8e;text-align:right;font-size:11.5px}',
      '.pl-acc{display:flex;flex-direction:column;gap:0}',
      '.pl-acc-row{display:flex;align-items:center;gap:12px;padding:10px 2px;border-bottom:1px solid rgba(0,0,0,.045);font-size:12.5px}',
      '.pl-acc-row:last-child{border-bottom:0}',
      '.pl-acc-row b{flex:0 0 88px;color:#1c1c1e}',
      '.pl-acc-goal{flex:1 1 auto;color:#6b6b70;font-size:11.5px;min-width:0}',
      '.pl-acc-n{flex:0 0 auto;color:#9a9a9e;font-size:11.5px}',
      '.pl-jumps{display:grid;grid-template-columns:repeat(auto-fit,minmax(208px,1fr));gap:10px}',
      '.pl-jump{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:14px 15px;cursor:pointer;transition:border-color .15s,transform .15s;min-width:0;position:relative}',
      '.pl-jump:hover{border-color:rgba(201,116,63,.5);transform:translateY(-1px)}',
      '.pl-jump-no{font-size:11px;color:#b9b6ae;letter-spacing:.06em}',
      '.pl-jump-t{font-size:14px;font-weight:600;color:#1c1c1e;margin-top:4px}',
      '.pl-jump-d{font-size:11.5px;color:#7a7a7f;line-height:1.6;margin-top:5px}',
      '.pl-jump-m{font-size:11px;color:#b8460f;margin-top:7px}',
      '.pl-jump-go{font-size:11.5px;color:#c9743f;margin-top:9px}',
      '.pl-cycle{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px}',
      '.pl-cycle-i{background:#faf9f7;border:1px solid rgba(0,0,0,.05);border-radius:10px;padding:11px 12px;display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.pl-cycle-n{font-size:10.5px;color:#b9b6ae;letter-spacing:.08em}',
      '.pl-cycle-i b{font-size:12.5px;color:#1c1c1e}',
      '.pl-cycle-i span{font-size:11px;color:#8a8a8e;line-height:1.55}',
      '.pl-rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(228px,1fr));gap:8px}',
      '.pl-rule{display:flex;gap:9px;align-items:flex-start;font-size:12px;line-height:1.65;color:#4a4a4f;background:#faf9f7;border-radius:9px;padding:10px 12px;min-width:0}',
      '.pl-rule b{flex:0 0 auto;color:#b8460f;font-size:11.5px;font-weight:600;background:#fdf1ea;border-radius:5px;padding:1px 6px;margin-top:1px;white-space:nowrap}',
      '.pl-reuse{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}',
      '.pl-reuse-i{background:#faf9f7;border-radius:9px;padding:10px 12px;display:flex;flex-direction:column;gap:3px;min-width:0}',
      '.pl-reuse-i b{font-size:12px;color:#1c1c1e;line-height:1.5;word-break:break-word}',
      '.pl-reuse-i span{font-size:11px;color:#9a9a9e}',
      '.pl-checker{display:flex;gap:16px;align-items:center;font-size:12px;color:#8a8a8e;margin-top:10px;flex-wrap:wrap}',
      '.pl-checker b{color:#1c1c1e;font-weight:600}',
      '.pl-checker-tip{font-size:11.5px;padding:2px 8px;border-radius:5px;background:#f1f0ec;color:#6b6b70}',
      '.pl-checker-tip.is-warn{background:#fdf1ea;color:#b8460f}',
      '.pl-checker-tip.is-ok{background:#f0f8f3;color:#1a7a48}',
      '.pl-scripts{display:flex;flex-direction:column;gap:10px}',
      '.pl-script{border:1px solid rgba(0,0,0,.07);border-radius:10px;padding:12px 13px;background:#fff;min-width:0}',
      '.pl-script-h{display:flex;align-items:center;gap:7px;flex-wrap:wrap}',
      '.pl-script-h b{font-size:13px;color:#1c1c1e;flex:1 1 auto;min-width:0;word-break:break-word}',
      '.pl-script-b{font-size:12px;color:#4a4a4f;line-height:1.75;margin-top:8px;white-space:pre-wrap;max-height:132px;overflow:auto}',
      '.pl-script-b.is-empty{color:#b5b5b8;font-style:italic}',
      '.pl-script-f{margin-top:10px;display:flex;gap:6px}',
      '.pl-assets{display:flex;flex-direction:column;gap:8px;margin-top:14px}',
      '.pl-asset{background:#faf9f7;border-radius:9px;padding:10px 12px}',
      '.pl-asset-h{display:flex;align-items:center;gap:7px;flex-wrap:wrap}',
      '.pl-asset-h b{font-size:12.5px;color:#1c1c1e;flex:1 1 auto;min-width:0}',
      '.pl-asset-b{font-size:11.5px;color:#6b6b70;line-height:1.7;margin-top:5px;white-space:pre-wrap}',
      '.pl-goldlist{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}',
      '.pl-gold{background:#faf9f7;border-radius:9px;padding:10px 12px;display:flex;flex-direction:column;gap:3px;min-width:0}',
      '.pl-gold b{font-size:12px;color:#1c1c1e;line-height:1.5;word-break:break-word}',
      '.pl-gold span{font-size:11px;color:#9a9a9e}',
      '.pl-flow{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
      '.pl-flow-i{display:flex;flex-direction:column;align-items:center;gap:3px;background:#faf9f7;border:1px solid rgba(0,0,0,.06);border-radius:10px;padding:9px 14px;min-width:82px}',
      '.pl-flow-i.is-on{background:#fdf6f0;border-color:rgba(201,116,63,.35)}',
      '.pl-flow-n{font-size:10px;color:#b9b6ae;letter-spacing:.08em}',
      '.pl-flow-i b{font-size:11.5px;color:#1c1c1e;white-space:nowrap}',
      '.pl-flow-c{font-size:14px;font-weight:600;color:#c9743f}',
      '.pl-flow-arrow{color:#c9c9cc;font-size:12px}',
      '.pl-tbl{min-width:0}',
      '.pl-tbl-h,.pl-tbl-r{display:grid;grid-template-columns:1fr 76px 66px 78px 54px 104px;gap:8px;align-items:center;font-size:12px;padding:8px 2px}',
      '.pl-tbl-type .pl-tbl-h,.pl-tbl-type .pl-tbl-r{grid-template-columns:1fr 62px 86px 86px 54px}',
      '.pl-tbl-h{color:#9a9a9e;font-size:11px;border-bottom:1px solid rgba(0,0,0,.07);padding-bottom:7px}',
      '.pl-tbl-r{border-bottom:1px solid rgba(0,0,0,.04)}',
      '.pl-tbl-r:last-child{border-bottom:0}',
      '.pl-tbl-t{color:#1c1c1e;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.pl-tbl-r b{font-weight:600;color:#1c1c1e}',
      '.pl-tbl-a{display:flex;gap:4px;justify-content:flex-end}',
      '.pl-tbl-r .is-over{color:#b3261e}',
      '.pl-tbl-r .is-today{color:#b8460f;font-weight:500}',
      '.pl-red{color:#b3261e;font-style:normal;font-size:11px}',
      '.pl-dim{color:#9a9a9e;font-style:normal;font-size:11px}',
      '.pl-cal{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}',
      '.pl-cal-i{background:#faf9f7;border-radius:9px;padding:10px 11px;display:flex;flex-direction:column;gap:3px;min-width:0;border-left:2px solid #dedbd4}',
      '.pl-cal-i.is-today{border-left-color:#c9743f;background:#fdf8f4}',
      '.pl-cal-i.is-over{border-left-color:#d33b30;background:#fdf6f5}',
      '.pl-cal-i b{font-size:11.5px;color:#8a8a8e;font-weight:500}',
      '.pl-cal-i span{font-size:12px;color:#1c1c1e;line-height:1.45;word-break:break-word}',
      '.pl-cal-i em{font-size:10.5px;color:#9a9a9e;font-style:normal}',
      '.pl-ai{display:grid;grid-template-columns:repeat(auto-fit,minmax(214px,1fr));gap:10px}',
      '.pl-ai-i{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:11px;padding:13px 14px;display:flex;flex-direction:column;gap:8px;min-width:0}',
      '.pl-ai-h{display:flex;align-items:center;justify-content:space-between}',
      '.pl-ai-h b{font-size:13px;color:#1c1c1e}',
      '.pl-ai-h span{font-size:10.5px;color:#b9b6ae}',
      '.pl-ai-io{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#6b6b70}',
      '.pl-ai-io em{font-style:normal;color:#a8a8ac;font-size:10.5px;margin-right:5px}',
      '.pl-ai-p{font-size:11px;color:#a8a8ac;line-height:1.6;border-top:1px dashed rgba(0,0,0,.08);padding-top:8px}',
      '.pl-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}',
      '.pl-kv>div{background:#faf9f7;border-radius:9px;padding:10px 12px;display:flex;flex-direction:column;gap:3px}',
      '.pl-kv em{font-style:normal;font-size:11px;color:#9a9a9e}',
      '.pl-kv b{font-size:13px;color:#1c1c1e}',
      '.pl-picks{display:flex;flex-wrap:wrap;gap:7px}',
      '.pl-pick{font:inherit;font-size:12px;padding:7px 12px;border-radius:8px;border:1px solid rgba(0,0,0,.12);background:#fff;color:#4a4a4f;cursor:pointer}',
      '.pl-pick:hover{border-color:rgba(201,116,63,.5);color:#b8460f}',
      '@media(max-width:900px){',
      '  .pl-board{grid-template-columns:repeat(2,minmax(140px,1fr))}',
      '  .pl-tbl-h,.pl-tbl-r{grid-template-columns:1fr 62px 66px 60px;font-size:11.5px}',
      '  .pl-tbl-h span:nth-child(3),.pl-tbl-r>span:nth-child(3),.pl-tbl-h span:nth-child(5),.pl-tbl-r>span:nth-child(5),.pl-tbl-h span:nth-child(6),.pl-tbl-r>span:nth-child(6){display:none}',
      '  .pl-tbl-type .pl-tbl-h,.pl-tbl-type .pl-tbl-r{grid-template-columns:1fr 52px 82px}',
      '  .pl-kpi-v{font-size:19px}',
      '  .pl-flow-i{min-width:0;flex:1 1 88px}',
      '}'
    ].join('\n');
    var el = document.createElement('style');
    el.id = 'plnrStyle';
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ============================================================
     对外接口
     ============================================================ */
  function wrap(inner) { style(); return inner; }

  global.PLNR = {
    renderDash: function () { return wrap(renderDash()); },
    renderPlan: function () { return wrap(renderPlan()); },
    renderCopy: function () { return wrap(renderCopy()); },
    renderProd: function () { return wrap(renderProd()); },
    renderData: function () { return wrap(renderData()); },
    renderKnow: function () { return wrap(renderKnow()); },
    load: load,
    STAGES: STAGES,
    _cache: cache
  };

  /* 导航子项缩进：样式尽早注入，别等第一次进策划台页面 */
  try { style(); } catch (e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})(window);
