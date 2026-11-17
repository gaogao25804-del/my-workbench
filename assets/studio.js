/* ============================================================
   短视频内容决策与数据分析平台
   ------------------------------------------------------------
   定位（2026-11-17 重构）：
   飞书管日常（任务、日志、文案），这里只管四件事——
   ① 发现值得做的选题 ② 研究不同切入角度
   ③ 分析各账号/类型的数据 ④ 从历史数据里找规律

   数据来源全部复用现有文件，不新建重复录入系统：
   - videos-data.json        1056 条历史视频（含账号/类型/日期/互动）
   - content/report/index.json 9-10 月战报（完播率/5 秒留存等深度指标）
   - radar-data.json         每日热点扫描结果
   - content/topics.json     选题池（Trae 维护，只读）

   本地库：wb.ideas.v2（旧 key 一个不删，迁移只读不覆盖）
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'wb.ideas.v2';

  /* ---------------- 基础工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) {
    if (n == null || n === '' || isNaN(n)) return '—';
    return Number(n).toLocaleString('zh-CN');
  }
  function play(n) {
    if (n == null || isNaN(n)) return '—';
    n = Number(n);
    if (n >= 10000) return (n / 10000).toFixed(n >= 100000 ? 0 : 1) + '万';
    return String(n);
  }
  function pct(a, b, digits) {
    if (!b) return '—';
    return (a / b * 100).toFixed(digits == null ? 1 : digits) + '%';
  }
  function median(arr) {
    arr = (arr || []).filter(function (x) { return x != null && !isNaN(x); });
    if (!arr.length) return 0;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    /* 不能按整数舍入：完播率、留存率是小数，round 一次就变成 0 */
    var v = a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
    return Math.round(v * 10000) / 10000;
  }
  function mean(arr) {
    arr = (arr || []).filter(function (x) { return x != null && !isNaN(x); });
    if (!arr.length) return 0;
    var s = 0; arr.forEach(function (x) { s += Number(x); });
    return Math.round(s / arr.length * 10) / 10;
  }
  function sum(arr) {
    arr = (arr || []).filter(function (x) { return x != null && !isNaN(x); });
    var s = 0; arr.forEach(function (x) { s += Number(x); });
    return s;
  }
  function toast(msg, type) {
    if (global.WB && typeof global.WB.toast === 'function') {
      try { global.WB.toast(msg, type); return; } catch (e) {}
    }
    if (global.CWB && typeof global.CWB.toast === 'function') {
      try { global.CWB.toast(msg, type); return; } catch (e) {}
    }
    try { console.log('[studio]', msg); } catch (e) {}
  }
  function rerender() {
    if (typeof global.renderView === 'function') {
      try { global.renderView(true); return; } catch (e) {}
    }
  }
  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function today() {
    var d = new Date();
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /* ---------------- 领域 / 状态 / 评分维度 ---------------- */
  var FIELDS = ['行业热点', '新品发布', '产品动态', '配件周边', '用户痛点', '使用场景',
    '功能细节', '价格促销', '竞品内容', '社交话题', '生活创意', '反常识', '趣味实验'];
  var STATUS = ['灵感收集', '待研究', '值得拍摄', '已发布', '暂时放弃'];
  var PLATFORMS = ['抖音', '小红书', '视频号', '快手', 'B站'];

  /* 评分维度：权重可改，规则全部公开在页面上 */
  var DIMS = [
    { k: 'heat',   n: '话题热度',       w: 2, tip: '这件事现在有多少人在聊' },
    { k: 'focus',  n: '用户关注度',     w: 2, tip: '目标人群会不会真的关心' },
    { k: 'fresh',  n: '新鲜感',         w: 1, tip: '是不是已经过时了' },
    { k: 'visual', n: '视觉呈现能力',   w: 3, tip: '观众会看到什么他没见过的画面' },
    { k: 'shoot',  n: '拍摄可行性',     w: 3, tip: '手上有没有机器和场景能拍' },
    { k: 'fit',    n: '账号匹配度',     w: 2, tip: '适不适合这个号的定位' },
    { k: 'biz',    n: '商业价值',       w: 2, tip: '能不能带配件或成交' },
    { k: 'sim',    n: '与爆款相似度',   w: 1, tip: '跟历史跑得动的那批像不像' }
  ];
  function defaultWeights() {
    var w = {};
    DIMS.forEach(function (d) { w[d.k] = d.w; });
    return w;
  }

  /* 一个产品能拆出的角度（老板要「从一个产品延伸出十几个方向」） */
  var ANGLES = [
    '外观设计', '手感和重量', '实际使用体验', '隐藏功能', '与上一代对比', '与竞品对比',
    '容易忽略的细节', '配件搭配', '价格和购买建议', '使用场景', '趣味测试',
    '争议性话题', '反常识切入', '售后与风险'
  ];

  /* ---------------- 远端数据 ---------------- */
  var cache = { videos: null, report: null, radar: null, err: {}, busy: {} };

  function ensureVideos() {
    if (cache.videos || cache.busy.videos) return;
    cache.busy.videos = true;
    fetch('videos-data.json?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { cache.videos = d.videos || []; cache.busy.videos = false; rerender(); })
      .catch(function (e) { cache.err.videos = String(e.message || e); cache.busy.videos = false; rerender(); });
  }
  function ensureReport() {
    if (cache.report || cache.busy.report) return;
    cache.busy.report = true;
    fetch('content/report/index.json?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { cache.report = d; cache.busy.report = false; rerender(); })
      .catch(function (e) { cache.err.report = String(e.message || e); cache.busy.report = false; rerender(); });
  }
  function ensureRadar() {
    if (cache.radar || cache.busy.radar) return;
    cache.busy.radar = true;
    fetch('radar-data.json?t=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { cache.radar = d; cache.busy.radar = false; rerender(); })
      .catch(function (e) { cache.err.radar = String(e.message || e); cache.busy.radar = false; rerender(); });
  }

  /* ---------------- 本地库 ---------------- */
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object') d = {};
    if (!Array.isArray(d.ideas)) d.ideas = [];
    if (!Array.isArray(d.angles)) d.angles = [];
    if (!Array.isArray(d.cases)) d.cases = [];
    if (!Array.isArray(d.assets)) d.assets = [];
    if (!d.weights || typeof d.weights !== 'object') d.weights = defaultWeights();
    DIMS.forEach(function (d2) {
      if (d.weights[d2.k] == null) d.weights[d2.k] = d2.w;
    });
    return d;
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); }
    catch (e) { toast('保存失败：浏览器存储不可用或已满', 'err'); }
  }

  /* 迁移：只从旧库读，不删不改旧 key */
  function migrate(d) {
    if (d.migrated) return;
    var added = 0;

    /* ① 旧「热门选题」信号（wb.dcw.v1.ideas） */
    try {
      var old = JSON.parse(localStorage.getItem('wb.dcw.v1') || 'null');
      (old && old.ideas || []).forEach(function (x) {
        if (!x || !x.title) return;
        if (d.ideas.some(function (y) { return y.title === x.title; })) return;
        d.ideas.push({
          id: uid('m'), title: x.title, field: '行业热点',
          platforms: ['抖音'], accounts: [], source: x.source || '',
          hook: x.why || '', audience: '', angle: '', creative: '',
          ref: x.source || '', status: '待研究',
          scores: {}, note: '', createdAt: x.date || today(), from: '热门选题信号'
        });
        added++;
      });
    } catch (e) {}

    /* ② 旧素材库（wb.plnr.v1.assets）→ 素材/创意库 */
    try {
      var pl = JSON.parse(localStorage.getItem('wb.plnr.v1') || 'null');
      (pl && pl.assets || []).forEach(function (x) {
        if (!x || !x.title) return;
        if (d.assets.some(function (y) { return y.title === x.title; })) return;
        d.assets.push({ id: uid('a'), title: x.title, kind: x.kind || '', body: x.body || '', createdAt: today() });
        added++;
      });
    } catch (e) {}

    /* ③ Trae 的选题池（content/topics.json，只读不改） */
    fetch('content/topics.json?t=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (t) {
        if (!t || !Array.isArray(t.topics)) return;
        var n = 0;
        t.topics.forEach(function (x) {
          if (!x.title) return;
          if (d.ideas.some(function (y) { return y.title === x.title; })) return;
          d.ideas.push({
            id: uid('t'), title: x.title, field: '新品发布',
            platforms: ['抖音'], accounts: [], source: (x.sources || []).join(' '),
            hook: (x.facts || []).join('；'), audience: '', angle: x.angle || '',
            creative: '', ref: (x.sources || [])[0] || '', status: '待研究',
            scores: { heat: x.scores && x.scores.crowd, fresh: x.scores && x.scores.fresh,
                      shoot: x.scores && x.scores.shoot, biz: x.scores && x.scores.dispute },
            note: x.notes || '', createdAt: today(), from: '选题池'
          });
          n++;
        });
        if (n) { d.migrated = today(); save(d); rerender(); }
        else { d.migrated = today(); save(d); }
      })
      .catch(function () { d.migrated = today(); save(d); });

    if (added) { save(d); rerender(); }
    d.migrated = d.migrated || today();
    save(d);
  }

  /* ---------------- 视频数据归一化 ---------------- */
  var ACC_NAME = { main: '郝金彪（主号）', sub: '小号' };
  var TYPE_NAME = { content: '内容视频', commerce: '带货视频', traffic: '其他' };
  function accName(a) { return ACC_NAME[a] || a || '未标注'; }
  function typeName(t) { return TYPE_NAME[t] || t || '未分类'; }

  function rows() {
    if (!cache.videos) return [];
    var depth = {};
    if (cache.report && cache.report.months) {
      cache.report.months.forEach(function (m) {
        (m.rows || []).forEach(function (r) {
          depth[(r.date || '') + '|' + (r.title || '').trim()] = r;
        });
      });
    }
    return cache.videos.map(function (v) {
      var d = depth[(v.date || '') + '|' + (v.title || '').trim()] || null;
      return {
        id: v.id, date: v.date || '', ym: (v.date || '').slice(0, 7),
        time: v.time || '', title: v.title || '',
        account: v.account || 'main', type: v.type || 'content',
        play: Number(v.play) || 0, like: Number(v.like) || 0,
        comment: Number(v.comment) || 0, share: Number(v.share) || 0,
        follow: Number(v.follow) || 0,
        fin: d ? d.fin : null, f5: d ? d.f5 : null, ctr: d ? d.ctr : null,
        b2: d ? d.b2 : null, avg: d ? d.avg : null, visit: d ? d.visit : null,
        fans: d ? d.fans : null, fav: d ? d.fav : null
      };
    });
  }
  function months() {
    var set = {};
    rows().forEach(function (r) { if (r.ym) set[r.ym] = 1; });
    return Object.keys(set).sort();
  }
  function latestMonth() {
    var ms = months();
    return ms.length ? ms[ms.length - 1] : '';
  }

  /* 一组视频的汇总指标 */
  function stats(list) {
    var plays = list.map(function (r) { return r.play; });
    var likes = sum(list.map(function (r) { return r.like; }));
    var cmts = sum(list.map(function (r) { return r.comment; }));
    var shs = sum(list.map(function (r) { return r.share; }));
    var favs = sum(list.map(function (r) { return r.fav || 0; }));
    var total = sum(plays);
    var fin = list.map(function (r) { return r.fin; }).filter(function (x) { return x != null; });
    var f5 = list.map(function (r) { return r.f5; }).filter(function (x) { return x != null; });
    return {
      n: list.length, total: total, avg: mean(plays), med: median(plays),
      max: plays.length ? Math.max.apply(null, plays) : 0,
      hot10: plays.filter(function (p) { return p >= 100000; }).length,
      hot100: plays.filter(function (p) { return p >= 1000000; }).length,
      like: likes, cmt: cmts, share: shs, fav: favs,
      inter: (likes + cmts + shs + favs),
      interRate: total ? (likes + cmts + shs + favs) / total : 0,
      finMed: fin.length ? median(fin) : null, finN: fin.length,
      f5Med: f5.length ? median(f5) : null, f5N: f5.length,
      avgDur: list.map(function (r) { return r.avg; }).filter(function (x) { return x != null; })
        .reduce(function (a, b) { return a + b; }, 0) /
        (list.filter(function (r) { return r.avg != null; }).length || 1),
      fans: sum(list.map(function (r) { return r.fans || 0; })),
      visit: sum(list.map(function (r) { return r.visit || 0; }))
    };
  }

  /* 爆款判定标准（页面上要写清楚，不藏着） */
  var HOT10 = 100000, HOT100 = 1000000;

  /* 标题特征分类：可验证的关键词规则，页面上原样展示 */
  var TITLE_RULES = [
    { k: '拿货到手', w: ['拿下', '到手', '抢到', '抢了', '代买', '真机', '开箱', '进货'] },
    { k: '价格行情', w: ['崩盘', '加价', '多钱', '多少钱', '降价', '行情', '价'] },
    { k: '贴膜壳配件', w: ['贴膜', '膜', '壳', '钢化', '配件', '教程'] },
    { k: '对比选择', w: ['还是', '区别', '怎么选', '买哪个', '对比', '和'] },
    { k: '提问式', w: ['？', '?'] }
  ];
  function titleKind(t) {
    t = t || '';
    for (var i = 0; i < TITLE_RULES.length; i++) {
      for (var j = 0; j < TITLE_RULES[i].w.length; j++) {
        if (t.indexOf(TITLE_RULES[i].w[j]) >= 0) return TITLE_RULES[i].k;
      }
    }
    return '其它';
  }
  /* 按标题特征分组统计（比手打标签可靠，因为规则公开可查） */
  function byTitleKind(list) {
    var g = {};
    list.forEach(function (r) {
      var k = titleKind(r.title);
      (g[k] = g[k] || []).push(r);
    });
    return Object.keys(g).map(function (k) {
      var s = stats(g[k]);
      s.kind = k; return s;
    }).sort(function (a, b) { return b.med - a.med; });
  }

  /* ---------------- 选题综合评分 ---------------- */
  function scoreOf(idea, weights) {
    var sc = idea.scores || {}, sum = 0, wsum = 0, done = 0;
    DIMS.forEach(function (dim) {
      var v = sc[dim.k];
      var w = weights[dim.k] == null ? dim.w : Number(weights[dim.k]);
      if (v == null || v === '' || isNaN(v)) return;
      sum += Number(v) * w; wsum += w; done++;
    });
    if (!wsum) return { total: 0, filled: 0, dims: DIMS.length };
    return { total: Math.round(sum / wsum * 20), filled: done, dims: DIMS.length };
  }

  /* ---------------- 小组件 ---------------- */
  function panel(title, desc, body, extra) {
    var b = body || '';
    /* 宽表格统一套一层横向滚动，窄屏不撑破页面 */
    if (b.indexOf('<table') >= 0 && b.indexOf('st-scroll') < 0) {
      b = '<div class="st-scroll">' + b + '</div>';
    }
    return '<div class="st-panel"><div class="st-panel-h"><b>' + esc(title) + '</b>' +
      (extra || '') + (desc ? '<span>' + esc(desc) + '</span>' : '') +
      '</div><div class="st-panel-b">' + b + '</div></div>';
  }
  function kpi(label, value, sub, cls) {
    return '<div class="st-kpi' + (cls ? ' ' + cls : '') + '">' +
      '<b>' + value + '</b><span>' + esc(label) + '</span>' +
      (sub ? '<em>' + esc(sub) + '</em>' : '') + '</div>';
  }
  function tag(text, kind) {
    if (!text) return '';
    return '<span class="st-tag' + (kind ? ' is-' + kind : '') + '">' + esc(text) + '</span>';
  }
  function bar(v, max, color) {
    var w = max ? Math.max(2, Math.round(v / max * 100)) : 0;
    return '<span class="st-bar"><i style="width:' + w + '%;background:' + (color || 'var(--accent)') + '"></i></span>';
  }
  function empty(text, sub) {
    return '<div class="st-empty"><b>' + esc(text) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>';
  }
  function field(label, inner) {
    return '<label class="st-field"><span>' + esc(label) + '</span>' + inner + '</label>';
  }
  function inp(id, ph, val) {
    return '<input class="st-in" id="' + id + '" placeholder="' + esc(ph || '') + '" value="' + esc(val || '') + '">';
  }
  function ta(id, ph, val, rows) {
    return '<textarea class="st-ta" id="' + id + '" rows="' + (rows || 3) + '" placeholder="' + esc(ph || '') + '">' + esc(val || '') + '</textarea>';
  }
  function sel(id, opts, val) {
    return '<select class="st-in" id="' + id + '">' + opts.map(function (o) {
      return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>';
    }).join('') + '</select>';
  }
  function multi(id, opts, chosen) {
    chosen = chosen || [];
    return '<div class="st-multi" id="' + id + '">' + opts.map(function (o) {
      return '<label class="st-chk"><input type="checkbox" value="' + esc(o) + '"' +
        (chosen.indexOf(o) >= 0 ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
    }).join('') + '</div>';
  }
  function selValues(id) {
    var box = document.getElementById(id);
    if (!box) return [];
    return Array.prototype.slice.call(box.querySelectorAll('input:checked')).map(function (i) { return i.value; });
  }
  function gv(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  /* ============================================================
     一、首页 · 内容决策总览
     ============================================================ */
  function renderHome() {
    ensureVideos(); ensureReport(); ensureRadar();
    var d = load();
    var all = rows();
    if (!all.length) {
      return '<div class="st-wrap">' + panel('正在读取历史数据',
        'videos-data.json / content/report/index.json',
        empty('还没读到数据', '如果一直空着，多半是这几个 json 没推上去')) + '</div>';
    }
    var lm = latestMonth();
    var monthList = all.filter(function (r) { return r.ym === lm; });
    var prevM = months();
    var pm = prevM.length > 1 ? prevM[prevM.length - 2] : '';
    var ms = stats(monthList);
    var ps = pm ? stats(all.filter(function (r) { return r.ym === pm; })) : null;

    /* 账号表现 */
    var accs = {};
    monthList.forEach(function (r) { (accs[r.account] = accs[r.account] || []).push(r); });
    var accRows = Object.keys(accs).map(function (a) {
      var s = stats(accs[a]); s.name = accName(a); s.key = a; return s;
    }).sort(function (x, y) { return y.med - x.med; });

    /* 类型表现 */
    var types = {};
    monthList.forEach(function (r) { (types[r.type] = types[r.type] || []).push(r); });
    var typeRows = Object.keys(types).map(function (t) {
      var s = stats(types[t]); s.name = typeName(t); return s;
    }).sort(function (x, y) { return y.med - x.med; });

    /* 全量维度表现（跨月，避免单月样本太小） */
    var kinds = byTitleKind(all.filter(function (r) { return r.play > 0; }));

    /* 爆款 */
    var hits = all.filter(function (r) { return r.play >= HOT10; })
      .sort(function (a, b) { return b.play - a.play; });

    /* 热点 */
    var radar = cache.radar;
    var picks = (radar && radar.picks || []).slice(0, 6);

    /* 近三月方向（近 3 个月、样本≥3 的标题特征分组） */
    var recent = all.filter(function (r) {
      return r.play > 0 && r.ym >= (prevM[prevM.length - 4] || '0');
    });
    var recentKinds = byTitleKind(recent).filter(function (k) { return k.n >= 5; }).slice(0, 4);

    var html = '';

    /* —— 顶部：一条数据带 —— */
    html += '<div class="st-hero">' +
      '<div class="st-hero-l">' +
        '<div class="st-hero-t">' + esc(lm ? lm.replace('-', ' 年 ') + ' 月' : '—') + '</div>' +
        '<div class="st-hero-s">本月已发布 ' + ms.n + ' 条 · 中位播放 ' + play(ms.med) +
          (ps ? ' · 上月 ' + play(ps.med) + '（' + (ms.med >= ps.med ? '↑' : '↓') + '）' : '') + '</div>' +
      '</div>' +
      '<div class="st-kpis">' +
        kpi('总播放', play(ms.total), '上月 ' + play(ps ? ps.total : 0)) +
        kpi('中位播放', play(ms.med), '平均 ' + play(ms.avg)) +
        kpi('10万+', ms.hot10 + ' 条', '爆款率 ' + pct(ms.hot10, ms.n)) +
        kpi('互动率', pct(ms.interRate, 1, 2), '赞评藏转 / 播放') +
        kpi('完播中位', ms.finMed == null ? '暂无数据' : pct(ms.finMed, 1), ms.finN ? ms.finN + ' 条有数据' : '战报未接入') +
        kpi('5秒留存', ms.f5Med == null ? '暂无数据' : pct(ms.f5Med, 1), ms.f5N ? ms.f5N + ' 条有数据' : '战报未接入') +
      '</div>' +
    '</div>';

    /* —— 现在值得做什么 —— */
    html += panel('现在值得做什么', '按标题特征分组的中位播放，跨月统计，样本量标在后面', kindTable(recentKinds, '近三个月'));

    /* —— 两栏：账号 / 类型 —— */
    html += '<div class="st-grid2">';
    html += panel('本月各账号', '发布量与中位播放分开看',
      accRows.length ? '<table class="st-tbl"><thead><tr><th>账号</th><th>条数</th><th>中位</th><th>最高</th><th>10万+</th><th>互动率</th></tr></thead><tbody>' +
        accRows.map(function (a) {
          return '<tr><td><b>' + esc(a.name) + '</b></td><td>' + a.n + '</td><td>' + play(a.med) +
            '</td><td>' + play(a.max) + '</td><td>' + a.hot10 + '</td><td>' + pct(a.interRate, 1, 2) + '</td></tr>';
        }).join('') + '</tbody></table>' : empty('本月没有数据'));
    html += panel('本月内容类型', '中位数优先，均值会被爆款拉偏',
      typeRows.length ? '<table class="st-tbl"><thead><tr><th>类型</th><th>条数</th><th>中位</th><th>平均</th><th>最高</th><th>爆款率</th></tr></thead><tbody>' +
        typeRows.map(function (a) {
          return '<tr><td><b>' + esc(a.name) + '</b></td><td>' + a.n + '</td><td>' + play(a.med) +
            '</td><td>' + play(a.avg) + '</td><td>' + play(a.max) + '</td><td>' + pct(a.hot10, a.n) + '</td></tr>';
        }).join('') + '</tbody></table>' : empty('本月没有数据'));
    html += '</div>';

    /* —— 热点方向 —— */
    html += panel('最近的热点方向', radar ? ('来自 ' + (radar.updated || '').slice(0, 16) + ' 的扫描结果') : '正在读取 radar-data.json',
      picks.length ? '<ul class="st-list">' + picks.map(function (p) {
        return '<li><span class="st-list-t">' + esc(p.title || '') + '</span>' +
          tag(p.source, 'is-soft') + tag('分 ' + (p.score == null ? '—' : p.score), 'is-score') +
          (p.url ? '<a class="st-link" href="' + esc(p.url) + '" target="_blank" rel="noopener">原文</a>' : '') +
          '</li>';
      }).join('') + '</ul>' :
      empty(radar ? '这次扫描没有可用条目' : '正在读取…', '雷达每天 10:20 自动跑'));

    /* —— 历史爆款 —— */
    html += panel('历史爆款入口', '10 万+ 共 ' + hits.length + ' 条，先看前 8', hits.length ?
      '<ul class="st-list">' + hits.slice(0, 8).map(function (h) {
        return '<li><span class="st-list-t">' + esc(h.title) + '</span>' +
          tag(accName(h.account), 'is-soft') + tag(typeName(h.type), 'is-soft') +
          tag(titleKind(h.title), 'is-score') +
          '<b class="st-list-n">' + play(h.play) + '</b></li>';
      }).join('') + '</li></ul>' : empty('还没有 10 万+ 的视频'));

    /* —— 入口 —— */
    html += '<div class="st-jump-row">' +
      '<a class="st-jump" href="#pool"><b>选题研究中心</b><span>灵感库 · 角度拆解 · 评分 · 复用</span></a>' +
      '<a class="st-jump" href="#perf"><b>平台数据分析中心</b><span>账号 · 类型 · 爆款 · 趋势 · 反哺</span></a>' +
      '<a class="st-jump" href="#tools"><b>研究与工具中心</b><span>热点 · 对标 · 开头 · SOP · AI</span></a>' +
      '</div>';

    return '<div class="st-wrap">' + html + '</div>';
  }

  function kindTable(kinds, label) {
    if (!kinds || !kinds.length) return empty('样本还不够', '同一类至少 3 条才做比较');
    var max = Math.max.apply(null, kinds.map(function (k) { return k.med; })) || 1;
    return '<table class="st-tbl"><thead><tr><th>' + esc(label || '') + '方向</th><th>样本</th><th style="width:34%">中位播放</th><th>平均</th><th>最高</th><th>爆款率</th></tr></thead><tbody>' +
      kinds.map(function (k) {
        return '<tr><td><b>' + esc(k.kind) + '</b></td><td>' + k.n + ' 条</td>' +
          '<td>' + bar(k.med, max) + '<b class="st-n">' + play(k.med) + '</b></td>' +
          '<td>' + play(k.avg) + '</td><td>' + play(k.max) + '</td><td>' + pct(k.hot10, k.n) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  /* ============================================================
     二、选题研究中心
     ============================================================ */
  function renderIdeas() {
    ensureVideos();
    var d = load();
    var ideas = d.ideas;
    var byStatus = {};
    STATUS.forEach(function (s) { byStatus[s] = ideas.filter(function (i) { return i.status === s; }).length; });
    var scored = ideas.map(function (i) { return { i: i, s: scoreOf(i, d.weights) }; })
      .filter(function (x) { return x.s.filled > 0; })
      .sort(function (a, b) { return b.s.total - a.s.total; });

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">选题研究中心</div>' +
      '<div class="st-hero-s">从一条灵感，到一个产品能拆出的十几个方向，再到能拍的那一条</div></div>' +
      '<div class="st-kpis">' +
        kpi('灵感总数', ideas.length) +
        kpi('待研究', byStatus['待研究']) +
        kpi('值得拍摄', byStatus['值得拍摄']) +
        kpi('已发布', byStatus['已发布']) +
        kpi('已打分', scored.length) +
      '</div></div>';

    html += '<div class="st-jump-row">' +
      '<a class="st-jump" href="#pool"><b>灵感库</b><span>' + ideas.length + ' 条 · 录入与筛选</span></a>' +
      '<a class="st-jump" href="#angles"><b>角度拆解</b><span>' + d.angles.length + ' 个产品方向 · ' + ANGLES.length + ' 种角度</span></a>' +
      '<a class="st-jump" href="#score"><b>评分与优先级</b><span>' + DIMS.length + ' 个维度 · 权重可改</span></a>' +
      '<a class="st-jump" href="#reuse"><b>复用与案例库</b><span>' + d.cases.length + ' 条可迁移规律</span></a>' +
      '</div>';

    if (scored.length) {
      html += panel('优先做这几条', '综合分 = Σ(维度分×权重)÷Σ权重×20，权重在「评分与优先级」里可改', 
        '<ul class="st-list">' + scored.slice(0, 5).map(function (x) {
          return '<li><span class="st-list-t">' + esc(x.i.title) + '</span>' +
            tag(x.i.status || '未标状态', 'is-soft') +
            tag('综合 ' + x.s.total + '（' + x.s.filled + '/' + x.s.dims + ' 项已评）', 'is-score') + '</li>';
        }).join('') + '</ul>');
    }

    html += panel('这个产品的 14 个角度', '选一个产品，一键把角度铺开，再往下填具体创意',
      '<div class="st-inline">' +
        '<select class="st-in" id="stAngleProduct" style="max-width:260px">' +
          '<option value="">选择产品…</option>' +
          productOptions(d).map(function (p) { return '<option value="' + esc(p) + '">' + esc(p) + '</option>'; }).join('') +
        '</select>' +
        '<button class="st-btn is-go" data-sx="angle-gen">铺开 14 个角度</button>' +
        '<span class="st-hint">产品名来自灵感库和素材库，没有就先在灵感库加一条</span>' +
      '</div>' +
      '<div class="st-angle-grid">' + ANGLES.map(function (a) {
        var n = d.angles.filter(function (x) { return x.angle === a; }).length;
        return '<div class="st-angle"><b>' + esc(a) + '</b><span>' + n + ' 条创意</span></div>';
      }).join('') + '</div>');

    return '<div class="st-wrap">' + html + '</div>';
  }

  function productOptions(d) {
    var set = {};
    d.ideas.forEach(function (i) { if (i.title) set[i.title] = 1; });
    d.assets.forEach(function (a) { if (a.title) set[a.title] = 1; });
    d.angles.forEach(function (a) { if (a.product) set[a.product] = 1; });
    return Object.keys(set).sort();
  }

  /* ---------- 灵感库 ---------- */
  function renderPool() {
    var d = load();
    var f = st.poolFilter || (st.poolFilter = { field: '', status: '', account: '', q: '' });
    var list = d.ideas.filter(function (i) {
      if (f.field && i.field !== f.field) return false;
      if (f.status && i.status !== f.status) return false;
      if (f.account && (i.accounts || []).indexOf(f.account) < 0) return false;
      if (f.q) {
        var hay = [i.title, i.hook, i.angle, i.creative, i.audience, i.source, i.note].join(' ');
        if (hay.toLowerCase().indexOf(f.q.toLowerCase()) < 0) return false;
      }
      return true;
    });
    var scored = list.map(function (i) { return { i: i, s: scoreOf(i, d.weights) }; })
      .sort(function (a, b) { return b.s.total - a.s.total; });

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">选题灵感库</div>' +
      '<div class="st-hero-s">每条记全：来源、看点、角度、创意、状态。来源必须是链接或出处</div></div>' +
      '<div class="st-kpis">' +
        kpi('全部', d.ideas.length) +
        kpi('当前筛选', list.length) +
        kpi('待研究', list.filter(function (i) { return i.status === '待研究'; }).length) +
        kpi('值得拍摄', list.filter(function (i) { return i.status === '值得拍摄'; }).length) +
      '</div></div>';

    /* 筛选条 */
    html += '<div class="st-filter">' +
      '<input class="st-in" id="stPoolQ" placeholder="搜索标题、看点、角度…" value="' + esc(f.q) + '">' +
      '<select class="st-in" id="stPoolField"><option value="">全部领域</option>' +
        FIELDS.map(function (x) { return '<option' + (x === f.field ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<select class="st-in" id="stPoolStatus"><option value="">全部状态</option>' +
        STATUS.map(function (x) { return '<option' + (x === f.status ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<select class="st-in" id="stPoolAccount"><option value="">全部账号</option>' +
        ['main', 'sub'].map(function (x) { return '<option' + (x === f.account ? ' selected' : '') + ' value="' + x + '">' + esc(accName(x)) + '</option>'; }).join('') + '</select>' +
      '<button class="st-btn" data-sx="pool-clear">清空筛选</button>' +
      '</div>';

    /* 新增表单 */
    html += panel('新增一条选题', '来源必填。没有出处的东西不算选题',
      '<div class="st-form-grid">' +
        field('选题名称', inp('stIdeaTitle', '例：Duo 开始松价，先塌的是 1TB')) +
        field('所属领域', sel('stIdeaField', FIELDS)) +
        field('适合平台', multi('stIdeaPlat', PLATFORMS, ['抖音'])) +
        field('适合账号', multi('stIdeaAcc', ['main', 'sub'].map(accName), [])) +
        field('选题来源', inp('stIdeaSource', '链接或出处，如 9to5Mac / 酷安原帖')) +
        field('核心看点', inp('stIdeaHook', '一句话说清为什么值得做')) +
        field('目标观众', inp('stIdeaAudience', '谁会看')) +
        field('推荐切入角度', inp('stIdeaAngle', '从哪个角度切')) +
        field('拍摄创意', ta('stIdeaCreative', '具体怎么拍，画面是什么', 2)) +
        field('参考链接', inp('stIdeaRef', 'https://…')) +
      '</div>' +
      '<div class="st-inline" style="margin-top:10px">' +
        '<select class="st-in" id="stIdeaStatus" style="max-width:160px">' +
          STATUS.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select>' +
        '<button class="st-btn is-go" data-sx="idea-add">存进灵感库</button>' +
      '</div>');

    /* 列表 */
    html += panel('选题列表', list.length + ' 条 / 共 ' + d.ideas.length + ' 条，按综合分从高到低',
      scored.length ? '<div class="st-cards">' + scored.map(function (x) {
        var i = x.i;
        return '<div class="st-card">' +
          '<div class="st-card-h"><b>' + esc(i.title) + '</b>' +
            (i.status ? tag(i.status, i.status === '值得拍摄' ? 'is-go' : (i.status === '已发布' ? 'is-ok' : 'is-soft')) : '') +
            (i.field ? tag(i.field, 'is-soft') : '') +
            (i.from ? tag(i.from, 'is-dim') : '') +
            '<span class="st-score" title="综合分 ' + x.s.total + '（已评 ' + x.s.filled + '/' + x.s.dims + ' 项）">' + x.s.total + '</span>' +
            '<button class="st-mini is-x" data-sx="idea-del" data-id="' + esc(i.id) + '">删</button>' +
          '</div>' +
          '<div class="st-card-b">' +
            (i.hook ? '<p><em>看点</em>' + esc(i.hook) + '</p>' : '') +
            (i.angle ? '<p><em>角度</em>' + esc(i.angle) + '</p>' : '') +
            (i.creative ? '<p><em>创意</em>' + esc(i.creative) + '</p>' : '') +
            (i.audience ? '<p><em>观众</em>' + esc(i.audience) + '</p>' : '') +
            (i.source ? '<p><em>来源</em>' + esc(i.source) + '</p>' : '') +
            (i.ref ? '<a class="st-link" href="' + esc(i.ref) + '" target="_blank" rel="noopener">参考链接</a>' : '') +
            '<p class="st-card-m">' + esc(i.createdAt || '') + '</p>' +
          '</div>' +
          '<div class="st-card-f">' +
            STATUS.map(function (s) {
              return '<button class="st-mini' + (i.status === s ? ' is-cur' : '') + '" data-sx="idea-status" data-id="' + esc(i.id) + '" data-v="' + esc(s) + '">' + esc(s) + '</button>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('') + '</div>' : empty('没有符合条件的选题', '换个筛选条件，或者上面新增一条'));

    return '<div class="st-wrap">' + html + '</div>';
  }

  /* ---------- 角度拆解 ---------- */
  function renderAngles() {
    var d = load();
    var groups = {};
    d.angles.forEach(function (a) {
      var key = a.product || '未指定产品';
      (groups[key] = groups[key] || []).push(a);
    });
    var prods = Object.keys(groups);
    var cur = st.angleProduct && groups[st.angleProduct] ? st.angleProduct : (prods[0] || '');

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">选题角度拆解</div>' +
      '<div class="st-hero-s">一个产品不只有一个方向。先铺开角度，再往每个角度里塞具体创意</div></div>' +
      '<div class="st-kpis">' + kpi('产品', prods.length) + kpi('角度记录', d.angles.length) +
      kpi('创意总数', d.angles.reduce(function (a, b) { return a + (b.ideas || []).length; }, 0)) + '</div></div>';

    html += panel('选择产品', '产品名可以在灵感库里加，或者直接手输',
      '<div class="st-inline">' +
        (prods.length ? '<select class="st-in" id="stAngleSel" style="max-width:220px">' +
          prods.map(function (p) { return '<option' + (p === cur ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select>' : '') +
        '<input class="st-in" id="stAngleName" placeholder="产品名，例：iPhoneDuo" style="max-width:220px">' +
        '<button class="st-btn is-go" data-sx="angle-gen">铺开 14 个角度</button>' +
        '<button class="st-btn" data-sx="angle-addone">只加一个角度</button>' +
      '</div>');

    if (!cur) {
      html += panel('还没有产品', '上面输入一个产品名，点「铺开 14 个角度」', empty('空的', '先选个产品'));
      return '<div class="st-wrap">' + html + '</div>';
    }

    var list = groups[cur];
    var byAngle = {};
    list.forEach(function (a) {
      (byAngle[a.angle] = byAngle[a.angle] || []).push(a);
    });

    html += panel(cur + ' 的角度', list.length + ' 个角度记录',
      '<div class="st-angle-wrap">' + ANGLES.map(function (ang) {
        var recs = byAngle[ang] || [];
        var creatives = [];
        recs.forEach(function (r) { (r.ideas || []).forEach(function (i) { creatives.push(i); }); });
        return '<div class="st-angle-box">' +
          '<div class="st-angle-h"><b>' + esc(ang) + '</b><span>' + creatives.length + ' 条创意</span>' +
            '<button class="st-mini" data-sx="crea-add" data-p="' + esc(cur) + '" data-a="' + esc(ang) + '">加创意</button></div>' +
          (creatives.length ? '<ul class="st-list st-list-sm">' + creatives.map(function (c) {
            return '<li><span class="st-list-t">' + esc(c.text) + '</span>' +
              (c.note ? '<span class="st-dim">' + esc(c.note) + '</span>' : '') +
              '<button class="st-mini is-x" data-sx="crea-del" data-p="' + esc(cur) + '" data-a="' + esc(ang) + '" data-t="' + esc(c.text) + '">删</button></li>';
          }).join('') + '</ul>' : '<div class="st-dim st-pad">还没有创意</div>') +
        '</div>';
      }).join('') + '</div>');

    return '<div class="st-wrap">' + html + '</div>';
  }

  /* ---------- 评分与优先级 ---------- */
  function renderScore() {
    var d = load();
    var f = st.scoreFilter || (st.scoreFilter = { min: 0, status: '' });
    var scored = d.ideas.map(function (i) { return { i: i, s: scoreOf(i, d.weights) }; })
      .filter(function (x) { return x.s.filled > 0; })
      .filter(function (x) { return x.s.total >= f.min; })
      .filter(function (x) { return !f.status || x.i.status === f.status; })
      .sort(function (a, b) { return b.s.total - a.s.total; });

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">评分与优先级</div>' +
      '<div class="st-hero-s">规则全部公开，权重你自己定，改完立刻重算</div></div>' +
      '<div class="st-kpis">' + kpi('已评分', scored.length) + kpi('选题总数', d.ideas.length) +
      kpi('最高分', scored.length ? scored[0].s.total : 0) + '</div></div>';

    /* 权重表 */
    html += panel('评分规则（可改）', '综合分 = Σ(维度分 × 权重) ÷ Σ权重 × 20，每个维度 1-5 分',
      '<table class="st-tbl st-tbl-w"><thead><tr><th>维度</th><th>说明</th><th style="width:120px">默认权重</th><th style="width:150px">当前权重</th></tr></thead><tbody>' +
      DIMS.map(function (dim) {
        return '<tr><td><b>' + esc(dim.n) + '</b></td><td class="st-dim">' + esc(dim.tip) + '</td>' +
          '<td>' + dim.w + '</td>' +
          '<td><input class="st-in st-in-sm" type="number" min="0" max="5" step="1" data-sx="weight" data-k="' + dim.k + '" value="' + (d.weights[dim.k] == null ? dim.w : d.weights[dim.k]) + '"></td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="st-inline" style="margin-top:10px">' +
        '<button class="st-btn" data-sx="weight-reset">恢复默认权重</button>' +
        '<span class="st-hint">改完点「保存权重」生效</span>' +
        '<button class="st-btn is-go" data-sx="weight-save">保存权重</button>' +
      '</div>');

    /* 筛选 */
    html += '<div class="st-filter">' +
      '<select class="st-in" id="stScoreMin"><option value="0">全部分数</option>' +
        [40, 60, 80].map(function (v) { return '<option value="' + v + '"' + (String(v) === String(f.min) ? ' selected' : '') + '>' + v + ' 分以上</option>'; }).join('') + '</select>' +
      '<select class="st-in" id="stScoreStatus"><option value="">全部状态</option>' +
        STATUS.map(function (s) { return '<option' + (s === f.status ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
      '</div>';

    /* 打分工作台 */
    html += panel('打分工作台', '每条选题 8 个维度，1-5 分，改完即时保存',
      scored.length ? '<div class="st-score-wrap">' + scored.map(function (x) {
        var i = x.i, sc = i.scores || {};
        return '<div class="st-score-card">' +
          '<div class="st-score-h"><b>' + esc(i.title) + '</b>' +
            (i.status ? tag(i.status, 'is-soft') : '') +
            '<span class="st-score-lg">' + x.s.total + '</span></div>' +
          '<div class="st-dims">' + DIMS.map(function (dim) {
            var v = sc[dim.k];
            return '<label class="st-dim-row"><span>' + esc(dim.n) + '</span>' +
              '<select class="st-in st-in-sm" data-sx="score" data-id="' + esc(i.id) + '" data-k="' + dim.k + '">' +
              '<option value="">—</option>' +
              [1, 2, 3, 4, 5].map(function (n) {
                return '<option value="' + n + '"' + (String(v) === String(n) ? ' selected' : '') + '>' + n + '</option>';
              }).join('') + '</select></label>';
          }).join('') + '</div>' +
        '</div>';
      }).join('') + '</div>' :
      empty('还没有打过分的选题', '先在灵感库里加选题，再到这儿逐条打分'));

    return '<div class="st-wrap">' + html + '</div>';
  }

  /* ---------- 复用与案例库 ---------- */
  function renderReuse() {
    ensureVideos();
    var d = load();
    var all = rows().filter(function (r) { return r.play > 0; });
    var kinds = byTitleKind(all);
    var hits = all.filter(function (r) { return r.play >= HOT10; }).sort(function (a, b) { return b.play - a.play; });

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">复用与案例库</div>' +
      '<div class="st-hero-s">不是收藏爆款，是把爆款背后的结构拆出来，迁到新产品上</div></div>' +
      '<div class="st-kpis">' + kpi('爆款（10万+）', hits.length) + kpi('方向类型', kinds.length) +
      kpi('手动沉淀', d.cases.length) + '</div></div>';

    /* 自动提炼的方向规律 */
    html += panel('跑得动的方向（全量统计）', '分组规则写在下面，可核对；中位播放优先于平均',
      kindTable(kinds, '标题特征') +
      '<div class="st-note">分组规则：' + TITLE_RULES.map(function (r) {
        return esc(r.k) + '（' + r.w.map(esc).join('/') + '）';
      }).join('；') + '。命中第一个即归入该组。爆款＝播放 ≥ 10 万。</div>');

    /* 可迁移的高播放结构 */
    var topKinds = hits.slice(0, 12);
    html += panel('爆款结构样本', '按播放量排序的前 12 条，看它们共用了什么开头',
      topKinds.length ? '<table class="st-tbl"><thead><tr><th>标题</th><th>类型</th><th>特征</th><th>账号</th><th>播放</th><th>5秒留存</th></tr></thead><tbody>' +
        topKinds.map(function (h) {
          return '<tr><td>' + esc(h.title.slice(0, 28)) + '</td><td>' + esc(typeName(h.type)) + '</td>' +
            '<td>' + tag(titleKind(h.title), 'is-score') + '</td><td>' + esc(accName(h.account)) + '</td>' +
            '<td><b>' + play(h.play) + '</b></td>' +
            '<td>' + (h.f5 == null ? '<span class="st-dim">暂无</span>' : pct(h.f5, 1)) + '</td></tr>';
        }).join('') + '</tbody></table>' : empty('还没有爆款样本'));

    /* 手动沉淀 */
    html += panel('我沉淀的迁移规律', '看完爆款，把可迁移的结构记在这里',
      '<div class="st-inline">' +
        '<input class="st-in" id="stCaseTitle" placeholder="规律名称，例：拿货当天先发数量">' +
        '<input class="st-in" id="stCaseAngle" placeholder="核心切入点" style="max-width:180px">' +
        '<input class="st-in" id="stCaseMigrate" placeholder="可迁移到，例：Mate XT2 / 小米18" style="max-width:220px">' +
        '<button class="st-btn is-go" data-sx="case-add">记下来</button>' +
      '</div>' +
      (d.cases.length ? '<div class="st-cards" style="margin-top:12px">' + d.cases.map(function (c) {
        return '<div class="st-card"><div class="st-card-h"><b>' + esc(c.title) + '</b>' +
          (c.angle ? tag(c.angle, 'is-score') : '') +
          (c.play ? tag(play(c.play) + ' 播放', 'is-ok') : '') +
          '<button class="st-mini is-x" data-sx="case-del" data-id="' + esc(c.id) + '">删</button></div>' +
          '<div class="st-card-b">' +
            (c.why ? '<p><em>为什么</em>' + esc(c.why) + '</p>' : '') +
            (c.migrate ? '<p><em>可迁移</em>' + esc(c.migrate) + '</p>' : '') +
            (c.type ? '<p><em>类型</em>' + esc(c.type) + '</p>' : '') +
          '</div></div>';
      }).join('') + '</div>' : '<div class="st-dim st-pad">还没有沉淀</div>'));

    return '<div class="st-wrap">' + html + '</div>';
  }

  /* ---------------- 导出 ---------------- */
  global.STU = {
    KEY: KEY,
    load: load, save: save, migrate: migrate,
    rows: rows, stats: stats, median: median, mean: mean, sum: sum,
    play: play, num: num, pct: pct, esc: esc, uid: uid, today: today,
    accName: accName, typeName: typeName, titleKind: titleKind,
    byTitleKind: byTitleKind, months: months, latestMonth: latestMonth,
    scoreOf: scoreOf, DIMS: DIMS, FIELDS: FIELDS, STATUS: STATUS, PLATFORMS: PLATFORMS,
    ANGLES: ANGLES, HOT10: HOT10, HOT100: HOT100, TITLE_RULES: TITLE_RULES,
    ensureVideos: ensureVideos, ensureReport: ensureReport, ensureRadar: ensureRadar,
    cache: cache, renderHome: renderHome, renderIdeas: renderIdeas,
    renderPool: renderPool, renderAngles: renderAngles, renderScore: renderScore,
    renderReuse: renderReuse,
    panel: panel, kpi: kpi, tag: tag, bar: bar, empty: empty, field: field,
    inp: inp, ta: ta, sel: sel, multi: multi, selValues: selValues, gv: gv,
    toast: toast, rerender: rerender, kindTable: kindTable,
    st: st
  };
})(window);
