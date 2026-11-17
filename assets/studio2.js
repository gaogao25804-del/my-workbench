/* ============================================================
   短视频内容决策与数据分析平台 · 第二部分
   03 平台数据分析中心 / 04 研究与工具中心 / 交互绑定
   复用 studio.js 的数据层与组件，风格统一
   ============================================================ */
(function (global) {
  'use strict';

  var S = global.STU;
  if (!S) return;

  var st = S.st;

  /* ---------------- 图表：纯 SVG，不引第三方库 ---------------- */
  function lineChart(series, opt) {
    opt = opt || {};
    var W = 720, H = opt.height || 230;
    var pl = 44, pr = 14, pt = 14, pb = 30;
    var all = [];
    series.forEach(function (s) { s.points.forEach(function (p) { all.push(p.value); }); });
    if (!all.length) return '<div class="st-empty">没有数据</div>';
    var max = Math.max.apply(null, all) || 1;
    var min = 0;
    var n = series[0] ? series[0].points.length : 0;
    var iw = W - pl - pr, ih = H - pt - pb;
    var sx = function (i) { return pl + (n <= 1 ? iw / 2 : i / (n - 1) * iw); };
    var sy = function (v) { return pt + ih - (v - min) / (max - min || 1) * ih; };

    var svg = '<svg class="st-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">';
    /* 网格 */
    for (var g = 0; g <= 4; g++) {
      var yv = min + (max - min) * g / 4;
      var y = sy(yv);
      svg += '<line x1="' + pl + '" y1="' + y.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + y.toFixed(1) +
        '" stroke="rgba(0,0,0,.06)" stroke-width="1"/>';
      svg += '<text x="' + (pl - 6) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="10" fill="#8b93a1">' +
        S.play(Math.round(yv)) + '</text>';
    }
    /* 线 */
    series.forEach(function (s) {
      var d = s.points.map(function (p, i) { return (i ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(p.value).toFixed(1); }).join(' ');
      svg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      s.points.forEach(function (p, i) {
        svg += '<circle cx="' + sx(i).toFixed(1) + '" cy="' + sy(p.value).toFixed(1) + '" r="2.6" fill="' + s.color + '"/>';
      });
    });
    /* X 轴标签（最多 8 个） */
    var step = Math.ceil(n / 8);
    series[0].points.forEach(function (p, i) {
      if (i % step) return;
      svg += '<text x="' + sx(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="10" fill="#8b93a1">' +
        esc(p.label) + '</text>';
    });
    svg += '</svg>';

    var lg = '<div class="st-legend">' + series.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>';
    }).join('') + '</div>';
    return lg + '<div class="st-chart-wrap">' + svg + '</div>';
  }

  function barChart(items, opt) {
    opt = opt || {};
    if (!items.length) return '<div class="st-empty">没有数据</div>';
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    return '<div class="st-bars">' + items.map(function (i) {
      return '<div class="st-bar-row"><span class="st-bar-k">' + esc(i.label) + '</span>' +
        '<span class="st-bar-t">' + S.bar(i.value, max, i.color || 'var(--accent)') + '</span>' +
        '<b class="st-bar-v">' + esc(i.text != null ? i.text : S.play(i.value)) + '</b>' +
        (i.sub ? '<span class="st-bar-s">' + esc(i.sub) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }

  /* ============================================================
     03-A 账号与平台表现
     ============================================================ */
  function renderPerf() {
    S.ensureVideos(); S.ensureReport();
    var all = S.rows();
    if (!all.length) {
      return '<div class="st-wrap">' + S.panel('正在读取历史数据', 'videos-data.json',
        S.empty('还没读到数据')) + '</div>';
    }
    var ms = S.months();
    var sel = st.perfMonth || (st.perfMonth = S.latestMonth());
    var list = all.filter(function (r) { return !sel || r.ym === sel; });

    /* 账号维度 */
    var accGroups = {};
    list.forEach(function (r) { (accGroups[r.account] = accGroups[r.account] || []).push(r); });
    var accRows = Object.keys(accGroups).map(function (a) {
      var s = S.stats(accGroups[a]); s.name = S.accName(a); s.key = a; return s;
    }).sort(function (x, y) { return y.med - x.med; });

    var ts = S.stats(list);

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">账号与平台表现</div>' +
      '<div class="st-hero-s">当前只接了抖音数据；其他平台没有接口，页面里如实写「暂无数据」</div></div>' +
      '<div class="st-kpis">' +
        kpi('月份', sel || '全部') +
        kpi('发布', ts.n + ' 条') +
        kpi('总播放', S.play(ts.total)) +
        kpi('中位', S.play(ts.med)) +
        kpi('平均', S.play(ts.avg)) +
        kpi('爆款率', S.pct(ts.hot10, ts.n)) +
      '</div></div>';

    /* 月份切换 */
    html += '<div class="st-filter">' +
      '<select class="st-in" id="stPerfMonth"><option value="">全部月份</option>' +
        ms.slice().reverse().map(function (m) { return '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') +
      '</select></div>';

    /* 平台说明 */
    html += S.panel('平台覆盖', '现在有什么数据，就分析什么',
      '<table class="st-tbl"><thead><tr><th>平台</th><th>账号</th><th>条数</th><th>总播放</th><th>中位</th><th>状态</th></tr></thead><tbody>' +
      accRows.map(function (a) {
        return '<tr><td><b>抖音</b></td><td>' + esc(a.name) + '</td><td>' + a.n + '</td>' +
          '<td>' + S.play(a.total) + '</td><td><b>' + S.play(a.med) + '</b></td>' +
          '<td>' + S.tag('已接入', 'is-ok') + '</td></tr>';
      }).join('') +
      ['小红书', '视频号', '快手', 'B站'].map(function (p) {
        return '<tr><td>' + p + '</td><td class="st-dim">—</td><td class="st-dim">—</td><td class="st-dim">—</td>' +
          '<td class="st-dim">—</td><td>' + S.tag('暂无数据', 'is-dim') + '</td></tr>';
      }).join('') + '</tbody></table>');

    /* 指标明细 */
    html += S.panel('完整指标', '中位与平均都列出来；完播/留存只统计战报里有数的那些条',
      '<table class="st-tbl st-tbl-w"><thead><tr><th>账号</th><th>发布</th><th>总播放</th><th>平均</th><th>中位</th><th>最高</th>' +
      '<th>10万+</th><th>100万+</th><th>爆款率</th><th>点赞</th><th>评论</th><th>分享</th><th>互动率</th><th>完播中位</th><th>5秒留存</th><th>粉丝增量</th></tr></thead><tbody>' +
      accRows.map(function (a) {
        return '<tr><td><b>' + esc(a.name) + '</b></td><td>' + a.n + '</td><td>' + S.play(a.total) + '</td>' +
          '<td>' + S.play(a.avg) + '</td><td><b>' + S.play(a.med) + '</b></td><td>' + S.play(a.max) + '</td>' +
          '<td>' + a.hot10 + '</td><td>' + a.hot100 + '</td><td>' + S.pct(a.hot10, a.n) + '</td>' +
          '<td>' + S.num(a.like) + '</td><td>' + S.num(a.cmt) + '</td><td>' + S.num(a.share) + '</td>' +
          '<td>' + S.pct(a.interRate, 1, 2) + '</td>' +
          '<td>' + (a.finMed == null ? '<span class="st-dim">暂无</span>' : S.pct(a.finMed, 1) + ' <span class="st-dim">' + a.finN + '条</span>') + '</td>' +
          '<td>' + (a.f5Med == null ? '<span class="st-dim">暂无</span>' : S.pct(a.f5Med, 1) + ' <span class="st-dim">' + a.f5N + '条</span>') + '</td>' +
          '<td>' + (a.fans ? S.num(a.fans) : '<span class="st-dim">暂无</span>') + '</td></tr>';
      }).join('') + '</tbody></table>');

    return '<div class="st-wrap">' + html + '</div>';
  }
  function kpi(label, value, sub, cls) { return S.kpi(label, value, sub, cls); }

  /* ============================================================
     03-B 内容类型对比
     ============================================================ */
  function renderTypes() {
    S.ensureVideos();
    var all = S.rows();
    if (!all.length) return '<div class="st-wrap">' + S.panel('正在读取', '', S.empty('还没读到数据')) + '</div>';
    var sel = st.typeMonth || (st.typeMonth = 'all');
    var list = all.filter(function (r) { return sel === 'all' || r.ym === sel; });
    var ms = S.months();

    /* 官方类型 */
    var groups = {};
    list.forEach(function (r) { (groups[r.type] = groups[r.type] || []).push(r); });
    var typeRows = Object.keys(groups).map(function (t) {
      var s = S.stats(groups[t]); s.name = S.typeName(t); return s;
    }).sort(function (a, b) { return b.med - a.med; });

    /* 标题特征分组（更贴近选题） */
    var kinds = S.byTitleKind(list.filter(function (r) { return r.play > 0; }));

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">内容类型对比</div>' +
      '<div class="st-hero-s">中位数排第一；平均值会被单条爆款拉偏，不能当判断依据</div></div>' +
      '<div class="st-kpis">' + kpi('样本', list.length + ' 条') +
      kpi('类型数', typeRows.length) + kpi('特征组', kinds.length) + '</div></div>';

    html += '<div class="st-filter"><select class="st-in" id="stTypeMonth"><option value="all">全部月份</option>' +
      ms.slice().reverse().map(function (m) { return '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') +
      '</select></div>';

    html += S.panel('按内容类型', '账号后台打的标签',
      '<table class="st-tbl"><thead><tr><th>类型</th><th>条数</th><th>中位</th><th>平均</th><th>最高</th><th>爆款数</th><th>爆款率</th><th>互动率</th></tr></thead><tbody>' +
      typeRows.map(function (a) {
        return '<tr><td><b>' + esc(a.name) + '</b></td><td>' + a.n + '</td><td><b>' + S.play(a.med) + '</b></td>' +
          '<td>' + S.play(a.avg) + '</td><td>' + S.play(a.max) + '</td><td>' + a.hot10 + '</td>' +
          '<td>' + S.pct(a.hot10, a.n) + '</td><td>' + S.pct(a.interRate, 1, 2) + '</td></tr>';
      }).join('') + '</tbody></table>');

    html += S.panel('按标题特征分组', '规则可核对：同一条只归第一组',
      S.kindTable(kinds, '特征组'));

    /* 对比图 */
    html += S.panel('中位播放对比', '两个维度放一起看',
      '<div class="st-2col">' +
        '<div><div class="st-sub">内容类型</div>' +
          barChart(typeRows.map(function (a) { return { label: a.name, value: a.med, sub: a.n + ' 条' }; })) + '</div>' +
        '<div><div class="st-sub">标题特征</div>' +
          barChart(kinds.slice(0, 6).map(function (a) { return { label: a.kind, value: a.med, sub: a.n + ' 条' }; })) + '</div>' +
      '</div>');

    return '<div class="st-wrap">' + html + '</div>';
  }

  /* ============================================================
     03-C 爆款视频库
     ============================================================ */
  function renderHits() {
    S.ensureVideos();
    var all = S.rows();
    if (!all.length) return '<div class="st-wrap">' + S.panel('正在读取', '', S.empty('还没读到数据')) + '</div>';
    var f = st.hitFilter || (st.hitFilter = { min: S.HOT10, acct: '', type: '', q: '', sort: 'play' });
    var list = all.filter(function (r) {
      if (r.play < f.min) return false;
      if (f.acct && r.account !== f.acct) return false;
      if (f.type && r.type !== f.type) return false;
      if (f.q && (r.title || '').toLowerCase().indexOf(f.q.toLowerCase()) < 0) return false;
      return true;
    });
    list.sort(function (a, b) {
      if (f.sort === 'fin') return (b.fin || 0) - (a.fin || 0);
      if (f.sort === 'f5') return (b.f5 || 0) - (a.f5 || 0);
      if (f.sort === 'date') return String(b.date).localeCompare(String(a.date));
      return b.play - a.play;
    });
    var shown = list.slice(0, 80);

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">爆款视频库</div>' +
      '<div class="st-hero-s">当前筛出 ' + list.length + ' 条，表格显示前 80 条</div></div>' +
      '<div class="st-kpis">' +
        kpi('10万+', all.filter(function (r) { return r.play >= S.HOT10; }).length) +
        kpi('100万+', all.filter(function (r) { return r.play >= S.HOT100; }).length) +
        kpi('当前筛选', list.length) +
        kpi('中位', S.play(S.median(list.map(function (r) { return r.play; })))) +
      '</div></div>';

    html += '<div class="st-filter">' +
      '<input class="st-in" id="stHitQ" placeholder="搜标题…" value="' + esc(f.q) + '">' +
      '<select class="st-in" id="stHitMin">' +
        [0, 50000, S.HOT10, 300000, S.HOT100].map(function (v) {
          return '<option value="' + v + '"' + (String(v) === String(f.min) ? ' selected' : '') + '>' +
            (v ? '≥ ' + S.play(v) : '全部') + '</option>';
        }).join('') + '</select>' +
      '<select class="st-in" id="stHitAcct"><option value="">全部账号</option>' +
        ['main', 'sub'].map(function (x) { return '<option value="' + x + '"' + (x === f.acct ? ' selected' : '') + '>' + esc(S.accName(x)) + '</option>'; }).join('') + '</select>' +
      '<select class="st-in" id="stHitType"><option value="">全部类型</option>' +
        ['content', 'commerce', 'traffic'].map(function (x) { return '<option value="' + x + '"' + (x === f.type ? ' selected' : '') + '>' + esc(S.typeName(x)) + '</option>'; }).join('') + '</select>' +
      '<select class="st-in" id="stHitSort">' +
        [['play', '按播放'], ['date', '按时间'], ['fin', '按完播'], ['f5', '按5秒留存']].map(function (p) {
          return '<option value="' + p[0] + '"' + (p[0] === f.sort ? ' selected' : '') + '>' + p[1] + '</option>';
        }).join('') + '</select>' +
      '</div>';

    html += S.panel('爆款清单', '「特征」列是按公开规则自动归的类，可以据此迁移选题',
      shown.length ? '<table class="st-tbl st-tbl-h"><thead><tr><th>标题</th><th>日期</th><th>账号</th><th>类型</th><th>特征</th><th>播放</th><th>完播</th><th>5秒</th><th>赞</th><th>评</th></tr></thead><tbody>' +
        shown.map(function (h) {
          return '<tr><td>' + esc(h.title) + '</td><td class="st-dim">' + esc(h.date) + '</td>' +
            '<td>' + esc(S.accName(h.account)) + '</td><td>' + esc(S.typeName(h.type)) + '</td>' +
            '<td>' + S.tag(S.titleKind(h.title), 'is-score') + '</td>' +
            '<td><b>' + S.play(h.play) + '</b></td>' +
            '<td>' + (h.fin == null ? '<span class="st-dim">暂无</span>' : S.pct(h.fin, 1)) + '</td>' +
            '<td>' + (h.f5 == null ? '<span class="st-dim">暂无</span>' : S.pct(h.f5, 1)) + '</td>' +
            '<td>' + S.num(h.like) + '</td><td>' + S.num(h.comment) + '</td></tr>';
        }).join('') + '</tbody></table>' : S.empty('没有符合条件的视频', '把门槛调低试试'));

    return '<div class="st-wrap">' + html + '</div>';
  }

  /* ============================================================
     03-D 趋势对比
     ============================================================ */
  function renderTrend() {
    S.ensureVideos();
    var all = S.rows();
    if (!all.length) return '<div class="st-wrap">' + S.panel('正在读取', '', S.empty('还没读到数据')) + '</div>';
    var ms = S.months();
    var mode = st.trendMode || (st.trendMode = 'med');
    var acct = st.trendAcct || (st.trendAcct = 'all');

    var byM = {};
    all.forEach(function (r) {
      if (!r.ym) return;
      if (acct !== 'all' && r.account !== acct) return;
      (byM[r.ym] = byM[r.ym] || []).push(r);
    });

    var series = [];
    if (acct === 'all') {
      series.push({ name: '全部账号', color: '#ff6a2f', points: ms.map(function (m) {
        var s = S.stats(byM[m] || []);
        return { label: m.slice(2), value: mode === 'n' ? s.n : mode === 'total' ? s.total : s.med };
      }) });
      ['main', 'sub'].forEach(function (a) {
        var pts = ms.map(function (m) {
          var list = (byM[m] || []).filter(function (r) { return r.account === a; });
          var s = S.stats(list);
          return { label: m.slice(2), value: mode === 'n' ? s.n : mode === 'total' ? s.total : s.med };
        });
        if (pts.some(function (p) { return p.value; })) {
          series.push({ name: S.accName(a), color: a === 'main' ? '#2f7bd6' : '#17805a', points: pts });
        }
      });
    } else {
      series.push({ name: S.accName(acct), color: '#ff6a2f', points: ms.map(function (m) {
        var list = (byM[m] || []).filter(function (r) { return r.account === acct; });
        var s = S.stats(list);
        return { label: m.slice(2), value: mode === 'n' ? s.n : mode === 'total' ? s.total : s.med };
      }) });
    }

    /* 类型对比线 */
    var typeSeries = [];
    var typeColors = { content: '#ff6a2f', commerce: '#2f7bd6', traffic: '#17805a' };
    ['content', 'commerce'].forEach(function (t) {
      var pts = ms.map(function (m) {
        var list = (byM[m] || []).filter(function (r) { return r.type === t; });
        var s = S.stats(list);
        return { label: m.slice(2), value: mode === 'n' ? s.n : mode === 'total' ? s.total : s.med };
      });
      if (pts.some(function (p) { return p.value; })) {
        typeSeries.push({ name: S.typeName(t), color: typeColors[t], points: pts });
      }
    });

    /* 本月 vs 上月 */
    var lm = S.latestMonth(), pm = ms.length > 1 ? ms[ms.length - 2] : '';
    var cmp = pm ? [
      { k: '发布条数', a: S.stats(byM[lm] || []).n, b: S.stats(byM[pm] || []).n },
      { k: '总播放', a: S.stats(byM[lm] || []).total, b: S.stats(byM[pm] || []).total },
      { k: '中位播放', a: S.stats(byM[lm] || []).med, b: S.stats(byM[pm] || []).med },
      { k: '10万+ 条数', a: S.stats(byM[lm] || []).hot10, b: S.stats(byM[pm] || []).hot10 },
      { k: '互动率', a: S.stats(byM[lm] || []).interRate, b: S.stats(byM[pm] || []).interRate }
    ] : [];

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">趋势对比</div>' +
      '<div class="st-hero-s">数据区间 ' + (ms[0] || '—') + ' ~ ' + (lm || '—') + '，共 ' + ms.length + ' 个月</div></div>' +
      '<div class="st-kpis">' + kpi('月份', ms.length + ' 个') +
      kpi('总条数', all.length) +
      kpi('本月中位', S.play(S.stats(byM[lm] || []).med)) +
      kpi('上月中位', pm ? S.play(S.stats(byM[pm] || []).med) : '—') + '</div></div>';

    html += '<div class="st-filter">' +
      '<select class="st-in" id="stTrendMode">' +
        [['med', '中位播放'], ['total', '总播放'], ['n', '发布条数']].map(function (p) {
          return '<option value="' + p[0] + '"' + (p[0] === mode ? ' selected' : '') + '>' + p[1] + '</option>';
        }).join('') + '</select>' +
      '<select class="st-in" id="stTrendAcct">' +
        [['all', '全部账号'], ['main', S.accName('main')], ['sub', S.accName('sub')]].map(function (p) {
          return '<option value="' + p[0] + '"' + (p[0] === acct ? ' selected' : '') + '>' + esc(p[1]) + '</option>';
        }).join('') + '</select></div>';

    html += S.panel('账号趋势', '折线是月度' + (mode === 'med' ? '中位播放' : mode === 'total' ? '总播放' : '发布条数'),
      lineChart(series, { height: 240 }));

    html += S.panel('内容类型趋势', '同一坐标轴上比较两类内容',
      lineChart(typeSeries, { height: 240 }));

    html += S.panel('本月 vs 上月', lm + ' 对比 ' + pm,
      cmp.length ? '<table class="st-tbl"><thead><tr><th>指标</th><th>本月</th><th>上月</th><th>变化</th></tr></thead><tbody>' +
        cmp.map(function (c) {
          var rate = c.a === c.b ? '—' : ((c.a - c.b) / (c.b || 1) * 100).toFixed(0) + '%';
          var isRate = c.k === '互动率';
          return '<tr><td><b>' + esc(c.k) + '</b></td>' +
            '<td>' + (isRate ? S.pct(c.a, 1, 2) : (c.k.indexOf('条数') >= 0 ? c.a : S.play(c.a))) + '</td>' +
            '<td>' + (isRate ? S.pct(c.b, 1, 2) : (c.k.indexOf('条数') >= 0 ? c.b : S.play(c.b))) + '</td>' +
            '<td class="' + (c.a >= c.b ? 'is-up' : 'is-down') + '">' + (c.a >= c.b ? '↑ ' : '↓ ') + rate + '</td></tr>';
        }).join('') + '</tbody></table>' : S.empty('只有一个月，没法对比'));

    return '<div class="st-wrap">' + html + '</div>';
  }

  /* ============================================================
     03-E 数据反哺选题
     ============================================================ */
  function renderInsight() {
    S.ensureVideos();
    var all = S.rows();
    if (!all.length) return '<div class="st-wrap">' + S.panel('正在读取', '', S.empty('还没读到数据')) + '</div>';
    var ms = S.months();
    var withPlay = all.filter(function (r) { return r.play > 0; });

    var concl = [];

    /* ① 哪个方向跑得动 */
    var kinds = S.byTitleKind(withPlay);
    var big = kinds.filter(function (k) { return k.n >= 5; });
    if (big.length) {
      var best = big[0];
      var worst = null;
      big.forEach(function (k) {
        if (k.kind === '其它') return;
        if (!worst || k.med < worst.med) worst = k;
      });
      /* 同口径的近期值也摆出来，避免全量被早期数据压低后误判 */
      var recentK = {};
      var lastMs = ms.slice(-3);
      S.byTitleKind(withPlay.filter(function (r) { return lastMs.indexOf(r.ym) >= 0; }))
        .forEach(function (k) { recentK[k.kind] = k; });
      var rk = recentK[best.kind];
      concl.push({
        t: '跑得动的方向：' + best.kind,
        body: '全量（' + (ms[0] || '') + ' ~ ' + S.latestMonth() + '）' + best.n + ' 条，中位 ' + S.play(best.med) +
          '，爆款率 ' + S.pct(best.hot10, best.n) + '。' +
          (rk ? '近三个月 ' + rk.n + ' 条，中位 ' + S.play(rk.med) + '。' : '') +
          (worst && worst.kind !== best.kind ? '同口径下最低的是「' + worst.kind + '」中位 ' + S.play(worst.med) + '（' + worst.n + ' 条）。' : '') +
          '这是相关性不是因果：同类标题多的月份本身也更可能是大月。',
        n: best.n
      });
    }

    /* ② 哪个账号更适合哪类 */
    var byAcc = {};
    withPlay.forEach(function (r) { (byAcc[r.account] = byAcc[r.account] || []).push(r); });
    Object.keys(byAcc).forEach(function (a) {
      var ks = S.byTitleKind(byAcc[a]).filter(function (k) { return k.n >= 4; });
      if (!ks.length) return;
      var b = ks[0];
      concl.push({
        t: S.accName(a) + ' 最擅长：' + b.kind,
        body: '该号在此类上的中位播放 ' + S.play(b.med) + '，样本 ' + b.n + ' 条；该号全部内容中位 ' +
          S.play(S.median(byAcc[a].map(function (r) { return r.play; }))) + '（' + byAcc[a].length + ' 条）。',
        n: b.n
      });
    });

    /* ③ 高播放低互动 */
    var lowInter = withPlay.filter(function (r) {
      return r.play >= S.HOT10 && (r.like + r.comment + r.share) / (r.play || 1) < 0.005;
    });
    if (lowInter.length) {
      concl.push({
        t: '有 ' + lowInter.length + ' 条播放过 10 万但互动很低',
        body: '互动率低于 0.5%。这些视频「被推了但没被讨论」，多半是画面有冲击、但没给人开口的理由。可以对着其中一条想想：观众看完能问出什么。样本 ' + lowInter.length + ' 条。',
        n: lowInter.length
      });
    }

    /* ④ 最近变化 */
    if (ms.length >= 6) {
      var last3 = ms.slice(-3), prev3 = ms.slice(-6, -3);
      var recentRows = withPlay.filter(function (r) { return last3.indexOf(r.ym) >= 0; });
      var prevRows = withPlay.filter(function (r) { return prev3.indexOf(r.ym) >= 0; });
      var rk = S.byTitleKind(recentRows).filter(function (k) { return k.n >= 5; });
      var pk = {};
      S.byTitleKind(prevRows).forEach(function (k) { pk[k.kind] = k; });
      rk.forEach(function (k) {
        var p = pk[k.kind];
        if (!p || p.n < 5) return;
        var diff = p.med ? (k.med - p.med) / p.med * 100 : 0;
        if (Math.abs(diff) >= 25) {
          concl.push({
            t: (diff > 0 ? '在涨：' : '在跌：') + k.kind,
            body: '近三个月中位 ' + S.play(k.med) + '（' + k.n + ' 条），前三个月 ' + S.play(p.med) + '（' + p.n + ' 条），' +
              (diff > 0 ? '涨了 ' : '跌了 ') + Math.abs(diff).toFixed(0) + '%。样本都只有几条，先当参考，别当定论。',
            n: k.n
          });
        }
      });
    }

    /* ⑤ 爆款结构 */
    var hits = withPlay.filter(function (r) { return r.play >= S.HOT100; });
    if (hits.length) {
      var q = hits.filter(function (r) { return /[？?]/.test(r.title); }).length;
      concl.push({
        t: '百万播放 ' + hits.length + ' 条，其中 ' + q + ' 条标题带问号',
        body: '占 ' + S.pct(q, hits.length) + '。可以拿这 ' + hits.length + ' 条当模板对照，标题写成什么样最容易破百万。',
        n: hits.length
      });
    }

    /* ⑥ 完播与留存的门槛 */
    var f5 = withPlay.filter(function (r) { return r.f5 != null; });
    if (f5.length >= 10) {
      var hi = f5.filter(function (r) { return r.f5 >= 0.5; });
      var lo = f5.filter(function (r) { return r.f5 < 0.5; });
      if (hi.length && lo.length) {
        concl.push({
          t: '5 秒留存过 50% 的 ' + hi.length + ' 条，中位播放 ' + S.play(S.median(hi.map(function (r) { return r.play; }))),
          body: '其余 ' + lo.length + ' 条中位 ' + S.play(S.median(lo.map(function (r) { return r.play; }))) +
            '。前 5 秒决定后面有没有人看，这条比题材本身更能提前判断。',
          n: f5.length
        });
      }
    }

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">数据反哺选题</div>' +
      '<div class="st-hero-s">每条结论都带样本量。样本少的只当参考，不当结论</div></div>' +
      '<div class="st-kpis">' + kpi('结论', concl.length) + kpi('样本总数', all.length) +
      kpi('统计区间', (ms[0] || '') + '~' + (S.latestMonth() || '')) + '</div></div>';

    html += S.panel('结论', '能追溯到具体数字的才放上来',
      concl.length ? '<div class="st-concl">' + concl.map(function (c) {
        return '<div class="st-concl-i"><b>' + esc(c.t) + '</b><p>' + esc(c.body) + '</p>' +
          (c.n ? '<span class="st-dim">样本 ' + c.n + ' 条</span>' : '') + '</div>';
      }).join('') + '</div>' : S.empty('数据还不够，暂时给不出结论'));

    html += S.panel('怎么用', '结论不是拿来念的，是拿来排选题顺序的',
      '<div class="st-rules">' +
        '<div class="st-rule"><b>先看样本量</b><span>少于 10 条的结论，只能当方向，不能当依据</span></div>' +
        '<div class="st-rule"><b>看中位不看平均</b><span>一条 180 万能把平均值拉飞，中位数不会骗人</span></div>' +
        '<div class="st-rule"><b>相关性不是因果</b><span>大月发的题天然数据好，别倒推成因果</span></div>' +
        '<div class="st-rule"><b>没有数据就说没有</b><span>完播率、5 秒留存只有 9-10 月战报里有，其余月份不编</span></div>' +
      '</div>');

    return '<div class="st-wrap">' + html + '</div>';
  }

  /* ============================================================
     04 研究与工具中心
     ============================================================ */
  function renderTools() {
    S.ensureRadar();
    var d = S.load();
    var radar = S.cache.radar;
    var picks = (radar && radar.picks || []).length;
    var dcw = null;
    try { dcw = JSON.parse(localStorage.getItem('wb.dcw.v1') || 'null') || {}; } catch (e) { dcw = {}; }

    var html = '<div class="st-hero st-hero-sm">' +
      '<div class="st-hero-l"><div class="st-hero-t">研究与工具中心</div>' +
      '<div class="st-hero-s">为选题研究服务的工具。文案和任务在飞书，这里不重复</div></div>' +
      '<div class="st-kpis">' + kpi('热点条目', picks || '—') +
      kpi('素材库', d.assets.length) +
      kpi('开头库', (dcw.hooks || []).length) +
      kpi('SOP', (dcw.sops || []).length) + '</div></div>';

    html += '<div class="st-tiles">' +
      tile('radar', '今日热点与行业动态', '每天 10:20 自动扫一遍，45 个平台', picks ? picks + ' 条候选' : '读取中') +
      tile('account', '对标账号研究', '拆别人的账号结构，不编数据', '拆解工具') +
      tile('trends', '热门选题信号', '只收有出处的信号，来源必填', ((dcw.ideas || []).length) + ' 条') +
      tile('hooks', '五秒开头案例库', '验证过的开场，按场景查', ((dcw.hooks || []).length) + ' 条') +
      tile('sop', 'SOP 知识库', '能重复执行的流程，带验证结果', ((dcw.sops || []).length) + ' 条') +
      tile('ai', 'AI 选题分析工作流', '提示词模板，复制即用，不是假按钮', '6 条流程') +
      '</div>';

    /* 素材库 */
    html += S.panel('素材与创意库', '写稿前翻这里；价格、事实、用户原话都可以存',
      (d.assets.length ? '<div class="st-cards">' + d.assets.map(function (a) {
        return '<div class="st-card"><div class="st-card-h"><b>' + esc(a.title) + '</b>' +
          (a.kind ? S.tag(a.kind, 'is-brown') : '') +
          '<button class="st-mini is-x" data-sx="asset-del" data-id="' + esc(a.id) + '">删</button></div>' +
          '<div class="st-card-b"><p>' + esc(a.body) + '</p></div></div>';
      }).join('') + '</div>' : S.empty('素材库是空的', '从旧库迁移过来的会出现在这里')) +
      '<div class="st-inline" style="margin-top:12px">' +
        '<input class="st-in" id="stAssetTitle" placeholder="资料名称" style="max-width:220px">' +
        '<input class="st-in" id="stAssetKind" placeholder="类型：价格核 / 用户原话" style="max-width:200px">' +
        '<button class="st-btn is-go" data-sx="asset-add">存一条</button>' +
      '</div>' +
      '<div class="st-inline" style="margin-top:8px">' +
        '<textarea class="st-ta" id="stAssetBody" rows="2" placeholder="内容：一条一条写清楚，别写形容词"></textarea>' +
      '</div>');

    return '<div class="st-wrap">' + html + '</div>';
  }
  function tile(key, title, desc, meta) {
    return '<a class="st-tile" href="#' + key + '"><b>' + esc(title) + '</b><span>' + esc(desc) + '</span>' +
      (meta ? '<em>' + esc(meta) + '</em>' : '') + '</a>';
  }

  /* ============================================================
     交互绑定
     ============================================================ */
  function bind() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-sx]');
      if (!t) return;
      var act = t.getAttribute('data-sx');
      var d = S.load();

      /* 灵感库 */
      if (act === 'idea-add') {
        var title = S.gv('stIdeaTitle');
        if (!title) { S.toast('先填选题名称', 'err'); return; }
        d.ideas.push({
          id: S.uid('i'), title: title, field: S.gv('stIdeaField'),
          platforms: S.selValues('stIdeaPlat'), accounts: S.selValues('stIdeaAcc'),
          source: S.gv('stIdeaSource'), hook: S.gv('stIdeaHook'),
          audience: S.gv('stIdeaAudience'), angle: S.gv('stIdeaAngle'),
          creative: S.gv('stIdeaCreative'), ref: S.gv('stIdeaRef'),
          status: S.gv('stIdeaStatus'), scores: {}, note: '', createdAt: S.today()
        });
        S.save(d); S.rerender(); S.toast('已存进灵感库', 'ok');
        return;
      }
      if (act === 'idea-del') {
        var id = t.getAttribute('data-id');
        d.ideas = d.ideas.filter(function (x) { return x.id !== id; });
        S.save(d); S.rerender(); S.toast('已删除', 'ok');
        return;
      }
      if (act === 'idea-status') {
        var id2 = t.getAttribute('data-id'), v = t.getAttribute('data-v');
        d.ideas.forEach(function (x) { if (x.id === id2) x.status = v; });
        S.save(d); S.rerender();
        return;
      }
      if (act === 'pool-clear') {
        st.poolFilter = { field: '', status: '', account: '', q: '' };
        S.rerender(); return;
      }

      /* 角度拆解 */
      if (act === 'angle-gen' || act === 'angle-addone') {
        var name = S.gv('stAngleName') || S.gv('stAngleProduct') ||
          (document.getElementById('stAngleSel') ? document.getElementById('stAngleSel').value : '');
        if (!name) { S.toast('先写产品名', 'err'); return; }
        if (act === 'angle-gen') {
          var added = 0;
          S.ANGLES.forEach(function (ang) {
            if (d.angles.some(function (x) { return x.product === name && x.angle === ang; })) return;
            d.angles.push({ id: S.uid('g'), product: name, angle: ang, ideas: [], createdAt: S.today() });
            added++;
          });
          S.toast(added ? '铺开 ' + added + ' 个角度' : '这个产品已经铺过了', added ? 'ok' : 'err');
        } else {
          d.angles.push({ id: S.uid('g'), product: name, angle: '自定义角度', ideas: [], createdAt: S.today() });
          S.toast('加了一个自定义角度', 'ok');
        }
        st.angleProduct = name;
        S.save(d); S.rerender();
        return;
      }
      if (act === 'crea-add') {
        var p = t.getAttribute('data-p'), a2 = t.getAttribute('data-a');
        var txt = prompt('给「' + a2 + '」加一条创意：');
        if (!txt) return;
        var rec = null;
        d.angles.forEach(function (x) { if (x.product === p && x.angle === a2) rec = x; });
        if (!rec) {
          rec = { id: S.uid('g'), product: p, angle: a2, ideas: [], createdAt: S.today() };
          d.angles.push(rec);
        }
        rec.ideas = rec.ideas || [];
        rec.ideas.push({ text: txt, note: '' });
        S.save(d); S.rerender(); S.toast('创意已加', 'ok');
        return;
      }
      if (act === 'crea-del') {
        var p2 = t.getAttribute('data-p'), a3 = t.getAttribute('data-a'), txt2 = t.getAttribute('data-t');
        d.angles.forEach(function (x) {
          if (x.product === p2 && x.angle === a3) {
            x.ideas = (x.ideas || []).filter(function (i) { return i.text !== txt2; });
          }
        });
        S.save(d); S.rerender();
        return;
      }

      /* 权重 */
      if (act === 'weight-save') {
        var inputs = document.querySelectorAll('[data-sx="weight"]');
        Array.prototype.forEach.call(inputs, function (inp) {
          var k = inp.getAttribute('data-k');
          var v = parseInt(inp.value, 10);
          d.weights[k] = isNaN(v) ? 0 : Math.max(0, Math.min(5, v));
        });
        S.save(d); S.rerender(); S.toast('权重已保存，分数已重算', 'ok');
        return;
      }
      if (act === 'weight-reset') {
        d.weights = S.load().weights;
        var w = {};
        S.DIMS.forEach(function (dim) { w[dim.k] = dim.w; });
        d.weights = w;
        S.save(d); S.rerender(); S.toast('已恢复默认权重', 'ok');
        return;
      }

      /* 案例 */
      if (act === 'case-add') {
        var ct = S.gv('stCaseTitle');
        if (!ct) { S.toast('先写规律名称', 'err'); return; }
        d.cases.push({
          id: S.uid('c'), title: ct, angle: S.gv('stCaseAngle'),
          migrate: S.gv('stCaseMigrate'), why: '', type: '', play: null, createdAt: S.today()
        });
        S.save(d); S.rerender(); S.toast('记下来了', 'ok');
        return;
      }
      if (act === 'case-del') {
        var cid = t.getAttribute('data-id');
        d.cases = d.cases.filter(function (x) { return x.id !== cid; });
        S.save(d); S.rerender();
        return;
      }

      /* 素材 */
      if (act === 'asset-add') {
        var at = S.gv('stAssetTitle');
        if (!at) { S.toast('先填资料名称', 'err'); return; }
        d.assets.push({ id: S.uid('a'), title: at, kind: S.gv('stAssetKind'), body: S.gv('stAssetBody'), createdAt: S.today() });
        S.save(d); S.rerender(); S.toast('已存进素材库', 'ok');
        return;
      }
      if (act === 'asset-del') {
        var aid = t.getAttribute('data-id');
        d.assets = d.assets.filter(function (x) { return x.id !== aid; });
        S.save(d); S.rerender();
        return;
      }
    });

    /* change 事件：筛选、评分 */
    document.addEventListener('change', function (e) {
      var el = e.target;
      var id = el.id;

      if (id === 'stPoolQ') { st.poolFilter.q = el.value; S.rerender(); return; }
      if (id === 'stPoolField') { st.poolFilter.field = el.value; S.rerender(); return; }
      if (id === 'stPoolStatus') { st.poolFilter.status = el.value; S.rerender(); return; }
      if (id === 'stPoolAccount') { st.poolFilter.account = el.value; S.rerender(); return; }

      if (id === 'stScoreMin') { st.scoreFilter.min = parseInt(el.value, 10) || 0; S.rerender(); return; }
      if (id === 'stScoreStatus') { st.scoreFilter.status = el.value; S.rerender(); return; }

      if (id === 'stPerfMonth') { st.perfMonth = el.value; S.rerender(); return; }
      if (id === 'stTypeMonth') { st.typeMonth = el.value; S.rerender(); return; }
      if (id === 'stHitQ') { st.hitFilter.q = el.value; S.rerender(); return; }
      if (id === 'stHitMin') { st.hitFilter.min = parseInt(el.value, 10) || 0; S.rerender(); return; }
      if (id === 'stHitAcct') { st.hitFilter.acct = el.value; S.rerender(); return; }
      if (id === 'stHitType') { st.hitFilter.type = el.value; S.rerender(); return; }
      if (id === 'stHitSort') { st.hitFilter.sort = el.value; S.rerender(); return; }
      if (id === 'stTrendMode') { st.trendMode = el.value; S.rerender(); return; }
      if (id === 'stTrendAcct') { st.trendAcct = el.value; S.rerender(); return; }
      if (id === 'stAngleSel') { st.angleProduct = el.value; S.rerender(); return; }

      /* 维度打分 */
      if (el.getAttribute && el.getAttribute('data-sx') === 'score') {
        var d2 = S.load();
        var iid = el.getAttribute('data-id'), k = el.getAttribute('data-k');
        d2.ideas.forEach(function (x) {
          if (x.id === iid) {
            x.scores = x.scores || {};
            if (el.value === '') delete x.scores[k]; else x.scores[k] = parseInt(el.value, 10);
          }
        });
        S.save(d2);
        /* 只更新这一条的分数显示，避免整页重绘丢焦点 */
        var card = el.closest('.st-score-card');
        if (card) {
          var lg = card.querySelector('.st-score-lg');
          var idea = d2.ideas.filter(function (x) { return x.id === iid; })[0];
          if (lg && idea) lg.textContent = S.scoreOf(idea, d2.weights).total;
        }
        return;
      }
    });

    /* 搜索框防抖：只重绘列表区域太麻烦，这里整页重绘但保留焦点 */
    var timer = null;
    document.addEventListener('input', function (e) {
      var id = e.target.id;
      if (id !== 'stPoolQ' && id !== 'stHitQ') return;
      clearTimeout(timer);
      var v = e.target.value;
      var pos = e.target.selectionStart;
      timer = setTimeout(function () {
        if (id === 'stPoolQ') st.poolFilter.q = v; else st.hitFilter.q = v;
        S.rerender();
        var again = document.getElementById(id);
        if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (err) {} }
      }, 320);
    });
  }

  /* 对外 */
  global.STU.renderPerf = renderPerf;
  global.STU.renderTypes = renderTypes;
  global.STU.renderHits = renderHits;
  global.STU.renderTrend = renderTrend;
  global.STU.renderInsight = renderInsight;
  global.STU.renderTools = renderTools;
  global.STU.lineChart = lineChart;
  global.STU.barChart = barChart;
  global.STU.bind = bind;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { S.migrate(S.load()); bind(); });
  } else {
    S.migrate(S.load()); bind();
  }
})(window);
