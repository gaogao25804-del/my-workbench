/* ============================================================
   创作线升级 · 视频档案 + 评论区 + 复盘
   ============================================================ */
(function (global) {
  'use strict';
  var C = global.CWB;
  if (!C) { console.error('[cw] create.js 没加载'); return; }

  var esc = C.esc, num = C.num, wan = C.wan, pct = C.pct, today = C.today, toast = C.toast;

  var VF = { q: '', account: '', vtype: '', month: '', mark: '', sort: 'date', dir: -1, page: 1, size: 20, star: false };

  /* ---------------- 筛选与统计 ---------------- */
  function baseList() {
    var d = C.D();
    var q = VF.q.trim().toLowerCase();
    return d.videos.filter(function (v) {
      if (VF.account && v.account !== VF.account) return false;
      if (VF.vtype && v.vtype !== VF.vtype) return false;
      if (VF.mark && v.mark !== VF.mark) return false;
      if (VF.star && !v.star) return false;
      if (VF.month && String(v.date || '').slice(0, 7) !== VF.month) return false;
      if (q) {
        var hay = [v.name, v.vtype, (v.tags || []).join(' '), v.account].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  var SORT_KEY = {
    date: function (v) { return v.date || ''; },
    play: function (v) { return num(v.stats && v.stats.play); },
    like: function (v) { return num(v.stats && v.stats.like); },
    cmt: function (v) { return num(v.stats && v.stats.cmt); },
    share: function (v) { return num(v.stats && v.stats.share); },
    fav: function (v) { return num(v.stats && v.stats.fav); },
    fans: function (v) { return num(v.stats && v.stats.fans); },
    fin: function (v) { return num(v.stats && v.stats.fin); }
  };

  function sorted(list) {
    var f = SORT_KEY[VF.sort] || SORT_KEY.date;
    return list.slice().sort(function (a, b) {
      var x = f(a), y = f(b);
      if (typeof x === 'string') return VF.dir * String(x).localeCompare(String(y));
      return VF.dir * (x - y);
    });
  }

  function months() {
    var s = {};
    C.D().videos.forEach(function (v) { var m = String(v.date || '').slice(0, 7); if (m) s[m] = 1; });
    return Object.keys(s).sort().reverse();
  }
  function vtypes() {
    var s = {};
    C.D().videos.forEach(function (v) { if (v.vtype) s[v.vtype] = 1; });
    return Object.keys(s);
  }

  function median(arr) {
    if (!arr.length) return 0;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
  }

  /* ---------------- 列表页 ---------------- */
  function renderVideos() {
    var all = baseList();
    var list = sorted(all);
    var pages = Math.max(1, Math.ceil(list.length / VF.size));
    if (VF.page > pages) VF.page = pages;
    var slice = list.slice((VF.page - 1) * VF.size, VF.page * VF.size);

    var plays = all.map(function (v) { return num(v.stats && v.stats.play); }).filter(function (n) { return n > 0; });
    var totPlay = plays.reduce(function (a, b) { return a + b; }, 0);
    var med = median(plays);
    var best = sorted(all).filter(function (v) { return num(v.stats && v.stats.play) > 0; })[0];
    var succ = C.D().videos.filter(function (v) { return v.mark === '成功案例'; }).length;

    var tiles =
      '<div class="cw-tiles">' +
        '<div class="cw-tile"><div class="cw-tile-k">档案条数</div><div class="cw-tile-v">' + all.length + '</div><div class="cw-tile-s">当前筛选下</div></div>' +
        '<div class="cw-tile"><div class="cw-tile-k">总播放</div><div class="cw-tile-v">' + wan(totPlay) + '</div><div class="cw-tile-s">有数据的合计</div></div>' +
        '<div class="cw-tile is-dark"><div class="cw-tile-k">中位播放</div><div class="cw-tile-v">' + wan(med) + '</div><div class="cw-tile-s">比平均数实在</div></div>' +
        '<div class="cw-tile' + (VF.mark === '成功案例' ? ' on' : '') + '" data-cw-vmark="成功案例"><div class="cw-tile-k">成功案例</div><div class="cw-tile-v">' + succ + '</div><div class="cw-tile-s">点这里只看这些</div></div>' +
      '</div>';

    var bar =
      '<div class="cw-bar">' +
        '<input class="cw-in" style="max-width:250px" placeholder="搜视频名 / 标签" value="' + esc(VF.q) + '" data-cw-vq="1">' +
        C.accSel('vaccount', VF.account, '全部账号').replace('data-cw-f="vaccount"', 'data-cw-vf="account"') +
        C.sel('vvtype', vtypes(), VF.vtype, '全部类型').replace('data-cw-f="vvtype"', 'data-cw-vf="vtype"') +
        C.sel('vmonth', months().map(function (m) { return { v: m, t: m }; }), VF.month, '全部月份').replace('data-cw-f="vmonth"', 'data-cw-vf="month"') +
        C.sel('vmark', C.MARK, VF.mark, '全部评级').replace('data-cw-f="vmark"', 'data-cw-vf="mark"') +
        '<button class="cw-btn is-sm ' + (VF.star ? 'is-go' : 'is-ghost') + '" data-cw-vstar="1">★ 重点收藏</button>' +
        '<span class="cw-grow"></span>' +
        '<button class="cw-btn" data-cw-vnew="1">+ 建档案</button>' +
      '</div>';

    var head = '<thead><tr>' +
      th('date', '日期') + '<th>视频</th>' + th('play', '播放') + th('like', '点赞') + th('cmt', '评论') +
      th('share', '转发') + th('fav', '收藏') + th('fans', '涨粉') + th('fin', '完播') +
      '<th>账号</th><th>类型</th><th>评级</th></tr></thead>';

    var body = slice.map(function (v) {
      var s = v.stats || {};
      var mc = v.mark === '成功案例' ? 'is-ok' : (v.mark === '失败案例' ? 'is-bad' : '');
      return '<tr data-cw-video="' + esc(v.id) + '">' +
        '<td class="num" style="width:92px;color:var(--cw-ink2);text-align:left;white-space:nowrap">' + esc(v.date || '') + '</td>' +
        '<td class="tt" title="' + esc(v.name) + '">' + (v.star ? '<span style="color:var(--accent)">★</span> ' : '') + esc(v.name) + '</td>' +
        '<td class="num"><b>' + (s.play == null ? '—' : wan(s.play)) + '</b></td>' +
        '<td class="num">' + (s.like == null ? '—' : wan(s.like)) + '</td>' +
        '<td class="num">' + (s.cmt == null ? '—' : wan(s.cmt)) + '</td>' +
        '<td class="num">' + (s.share == null ? '—' : wan(s.share)) + '</td>' +
        '<td class="num">' + (s.fav == null ? '—' : wan(s.fav)) + '</td>' +
        '<td class="num">' + (s.fans == null ? '—' : wan(s.fans)) + '</td>' +
        '<td class="num">' + pct(s.fin) + '</td>' +
        '<td><span class="cw-tag">' + esc(v.account || '—') + '</span></td>' +
        '<td style="white-space:nowrap">' + esc(v.vtype || '—') + '</td>' +
        '<td>' + (v.mark ? '<span class="cw-tag ' + mc + '">' + esc(v.mark) + '</span>' : '') + '</td>' +
      '</tr>';
    }).join('');

    var table = slice.length
      ? '<div class="cw-panel"><div class="cw-panel-b is-flush"><div class="cw-scroll"><table class="cw-table">' + head + '<tbody>' + body + '</tbody></table></div></div>' +
        '<div class="cw-panel-b" style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--cw-line)">' +
          '<span style="font-size:11.5px;color:var(--cw-ink3)">共 ' + list.length + ' 条 · 第 ' + VF.page + '/' + pages + ' 页</span>' +
          '<span class="cw-grow"></span>' +
          '<button class="cw-btn is-sm" data-cw-vpage="-1"' + (VF.page <= 1 ? ' disabled' : '') + '>上一页</button>' +
          '<button class="cw-btn is-sm" data-cw-vpage="1"' + (VF.page >= pages ? ' disabled' : '') + '>下一页</button>' +
        '</div></div>'
      : C.empty('没有符合条件的视频', '换个筛选，或者点「+ 建档案」手动加一条');

    var bestLine = best
      ? '<div class="cw-note">播放最高：' + esc(best.name.slice(0, 46)) + ' · ' + wan(best.stats.play) + '（' + esc(best.date) + '）</div>'
      : '';

    return '<div class="cw-wrap">' + tiles + bar + bestLine + table +
      '<div class="cw-note">这里只存真实数字。没有的字段留空，不编。</div></div>';
  }

  function th(k, label) {
    var on = VF.sort === k;
    return '<th class="sortable" data-cw-vsort="' + k + '">' + label + (on ? '<span class="ar">' + (VF.dir < 0 ? '↓' : '↑') + '</span>' : '') + '</th>';
  }

  /* ---------------- 视频详情 ---------------- */
  function openVideo(id) {
    var v = id ? C.videoById(id) : null;
    var isNew = !v;
    if (isNew) {
      v = {
        id: C.uid('v-'), name: '', account: '数码大号', platform: '抖音', date: today(), time: '19:00',
        url: '', cover: '', vtype: '观点分析', topicId: '', draftId: '',
        stats: {}, prod: {}, mark: '', star: false, tags: [], createdAt: today(), src: 'manual'
      };
    }
    var s = v.stats || {};
    var st = function (k, label, opt) {
      return '<div class="cw-field"><label>' + label + '</label><input class="cw-in" type="number" data-cw-s="' + k + '" value="' + (s[k] == null ? '' : esc(s[k])) + '" placeholder="' + (opt || '空着') + '"></div>';
    };
    var d = C.D();
    var topicOpts = d.topics.map(function (t) { return { v: t.id, t: t.title.slice(0, 28) }; });

    var cm = commentsHtml(v.id);

    var body =
      '<div class="cw-sec">' +
        C.field('视频名称 / 标题', '<input class="cw-in" data-cw-v="name" value="' + esc(v.name) + '">') +
        '<div class="cw-grid cw-g4">' +
          C.field('账号', C.accSel('account', v.account).replace('data-cw-f="account"', 'data-cw-v="account"')) +
          C.field('平台', C.sel('platform', ['抖音', '快手', '小红书', '视频号', 'B站', '其他'], v.platform).replace('data-cw-f="platform"', 'data-cw-v="platform"')) +
          C.field('发布日期', '<input class="cw-in" type="date" data-cw-v="date" value="' + esc(v.date) + '">') +
          C.field('发布时间', '<input class="cw-in" data-cw-v="time" value="' + esc(v.time || '') + '" placeholder="19:00">') +
        '</div>' +
        '<div class="cw-grid cw-g3">' +
          C.field('视频类型', C.sel('vtype', ['引流视频', '内容视频', '产品介绍', '产品评测', '数码资讯', '观点分析', '对比测评', '用户问题解答', '其他'], v.vtype).replace('data-cw-f="vtype"', 'data-cw-v="vtype"')) +
          C.field('关联选题', C.sel('topicId', topicOpts, v.topicId, '不关联').replace('data-cw-f="topicId"', 'data-cw-v="topicId"')) +
          C.field('关联口播稿 ID', '<input class="cw-in" data-cw-v="draftId" value="' + esc(v.draftId || '') + '" placeholder="d-开头或文件路径">') +
        '</div>' +
        C.field('视频链接', '<input class="cw-in" data-cw-v="url" value="' + esc(v.url || '') + '" placeholder="https://...">') +
      '</div>' +

      '<div class="cw-sec">' +
        '<div class="cw-sec-h">数据<span class="cw-sec-line"></span><span class="cw-sec-n">没有就留空</span></div>' +
        '<div class="cw-grid cw-g4">' +
          st('play', '播放量') + st('like', '点赞') + st('cmt', '评论') + st('share', '转发') +
          st('fav', '收藏') + st('fans', '涨粉') + st('fin', '完播率', '0.045') + st('avg', '平均时长(秒)') +
        '</div>' +
      '</div>' +

      '<div class="cw-sec">' +
        '<div class="cw-sec-h">生产记录<span class="cw-sec-line"></span></div>' +
        '<div class="cw-grid cw-g3">' +
          C.field('拍摄执行', '<input class="cw-in" data-cw-p="shooter" value="' + esc((v.prod || {}).shooter || '') + '">') +
          C.field('剪辑执行', '<input class="cw-in" data-cw-p="editor" value="' + esc((v.prod || {}).editor || '') + '">') +
          C.field('审核人', '<input class="cw-in" data-cw-p="reviewer" value="' + esc((v.prod || {}).reviewer || '') + '">') +
        '</div>' +
        C.field('实际拍摄情况（跟计划不一样的地方）', '<textarea class="cw-ta" data-cw-p="realShoot">' + esc((v.prod || {}).realShoot || '') + '</textarea>') +
        C.field('实际剪辑情况', '<textarea class="cw-ta" data-cw-p="realEdit">' + esc((v.prod || {}).realEdit || '') + '</textarea>') +
        (v.draftId ? '<div class="cw-actions"><button class="cw-btn is-sm" data-cw-godraft="' + esc(v.draftId) + '">看这条的拍摄/剪辑方案 →</button></div>' : '<div class="cw-note">还没关联口播稿。关联之后拍摄、剪辑方案自动读过来。</div>') +
      '</div>' +

      '<div class="cw-sec">' +
        '<div class="cw-sec-h">评论区<span class="cw-sec-line"></span>' +
          '<button class="cw-btn is-sm" data-cw-cpaste="1">批量粘贴导入</button>' +
          '<label class="cw-btn is-sm" style="cursor:pointer">CSV<input type="file" accept=".csv,.txt" data-cw-cfile="1" style="display:none"></label>' +
        '</div>' +
        '<div id="cwCmtBox">' + cm + '</div>' +
      '</div>' +

      '<div class="cw-sec">' +
        '<div class="cw-sec-h">复盘<span class="cw-sec-line"></span><span class="cw-sec-n">人工填或 AI 起草后自己改</span></div>' +
        reviewFields(v.id) +
      '</div>' +

      '<div class="cw-sec">' +
        '<div class="cw-sec-h">评级与标签<span class="cw-sec-line"></span></div>' +
        '<div class="cw-grid cw-g3">' +
          C.field('案例评级', C.sel('mark', C.MARK, v.mark, '未评').replace('data-cw-f="mark"', 'data-cw-v="mark"')) +
          C.field('重点收藏', '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;padding-top:7px"><input type="checkbox" class="cw-chk" data-cw-v="star"' + (v.star ? ' checked' : '') + '> 标成爆款样片</label>') +
          C.field('标签（逗号隔开）', '<input class="cw-in" data-cw-v="tags" value="' + esc((v.tags || []).join('，')) + '">') +
        '</div>' +
      '</div>';

    var foot =
      (isNew ? '' : '<button class="cw-btn is-x" data-cw-vdel="' + esc(v.id) + '">删档案</button>') +
      '<span class="cw-grow"></span>' +
      (isNew ? '' : '<button class="cw-btn" data-cw-vexport="1">导出这条</button>') +
      '<button class="cw-btn is-dark" data-cw-vai="1">AI 复盘提示词</button>' +
      '<button class="cw-btn is-go" data-cw-vsave="1">' + (isNew ? '建档' : '保存') + '</button>';

    C.openSide({
      kicker: '视频档案 · ' + (v.date || ''),
      title: esc(v.name || (isNew ? '新档案' : '未命名')),
      body: body, foot: foot,
      after: function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.closest('[data-cw-godraft]')) {
            var did = e.target.closest('[data-cw-godraft]').getAttribute('data-cw-godraft');
            C.closeSide();
            if (global.switchTab) global.switchTab('koubo');
            setTimeout(function () { if (global.CWB3 && CWB3.openDraftPanel) CWB3.openDraftPanel(did); }, 320);
            return;
          }
          if (e.target.closest('[data-cw-cpaste]')) { pasteComments(v); return; }
          if (e.target.closest('[data-cw-vexport]')) {
            collectVideo(v, el);
            var pack = { video: v, comments: C.commentsOf(v.id), review: C.reviewOf(v.id) };
            C.copy(JSON.stringify(pack, null, 1));
            return;
          }
          if (e.target.closest('[data-cw-vai]')) {
            collectVideo(v, el);
            C.save(true);
            C.closeSide();
            if (global.switchTab) global.switchTab('ai');
            setTimeout(function () { if (CWB4 && CWB4.presetAI) CWB4.presetAI('review', v.id); }, 300);
            return;
          }
          if (e.target.closest('[data-cw-vdel]')) {
            if (!confirm('删掉这条档案？关联的评论和复盘也一起删。')) return;
            var dd = C.D();
            dd.videos = dd.videos.filter(function (x) { return x.id !== v.id; });
            dd.comments = dd.comments.filter(function (x) { return x.videoId !== v.id; });
            dd.reviews = dd.reviews.filter(function (x) { return x.videoId !== v.id; });
            C.save(true); C.closeSide(); toast('已删除', 'ok');
            if (global.renderView) global.renderView(true);
            return;
          }
          if (e.target.closest('[data-cw-vsave]')) {
            collectVideo(v, el);
            collectReview(v.id, el);
            if (!v.name) { alert('视频名称不能空'); return; }
            if (isNew) C.D().videos.unshift(v);
            C.save(true); C.closeSide(); toast(isNew ? '建档完成' : '已保存', 'ok');
            if (global.renderView) global.renderView(true);
            return;
          }
          // 评论行操作
          var cdel = e.target.closest('[data-cw-cdel]');
          if (cdel) {
            var cid = cdel.getAttribute('data-cw-cdel');
            C.D().comments = C.D().comments.filter(function (x) { return x.id !== cid; });
            C.save(true); refreshComments(v.id);
            return;
          }
          var cref = e.target.closest('[data-cw-ctotopic]');
          if (cref) {
            var cc = C.D().comments.filter(function (x) { return x.id === cref.getAttribute('data-cw-ctotopic'); })[0];
            if (cc) commentToTopic(cc, v);
            return;
          }
          var cai = e.target.closest('[data-cw-canalyze]');
          if (cai) {
            collectVideo(v, el); C.save(true); C.closeSide();
            if (global.switchTab) global.switchTab('ai');
            setTimeout(function () { if (CWB4 && CWB4.presetAI) CWB4.presetAI('comments', v.id); }, 300);
          }
        });
        el.addEventListener('change', function (e) {
          var f = e.target.closest('[data-cw-cfile]');
          if (!f || !f.files || !f.files[0]) return;
          importCSV(v, f.files[0]);
          return;
        });
        el.addEventListener('input', function (e) {
          var q = e.target.closest('[data-cw-cq]');
          if (q) { renderCommentList(v.id, q.value); }
        });
        el.addEventListener('change', function (e) {
          var tp = e.target.closest('[data-cw-ctype]');
          if (tp) {
            var cid = tp.getAttribute('data-cw-ctype');
            var cc = C.D().comments.filter(function (x) { return x.id === cid; })[0];
            if (cc) { cc.ctype = tp.value; C.save(true); refreshComments(v.id); }
            return;
          }
          var hi = e.target.closest('[data-cw-chi]');
          if (hi) {
            var id2 = hi.getAttribute('data-cw-chi');
            var c2 = C.D().comments.filter(function (x) { return x.id === id2; })[0];
            if (c2) { c2.hi = hi.checked; C.save(true); refreshComments(v.id); }
          }
        });
      }
    });
  }

  function collectVideo(v, el) {
    el.querySelectorAll('[data-cw-v]').forEach(function (inp) {
      var k = inp.getAttribute('data-cw-v');
      if (k === 'star') { v.star = inp.checked; return; }
      if (k === 'tags') { v.tags = String(inp.value).split(/[,，\s]+/).filter(Boolean); return; }
      v[k] = inp.value;
    });
    if (!v.stats) v.stats = {};
    el.querySelectorAll('[data-cw-s]').forEach(function (inp) {
      var k = inp.getAttribute('data-cw-s');
      if (String(inp.value).trim() === '') { v.stats[k] = null; return; }
      v.stats[k] = Number(inp.value);
    });
    if (!v.prod) v.prod = {};
    el.querySelectorAll('[data-cw-p]').forEach(function (inp) {
      v.prod[inp.getAttribute('data-cw-p')] = inp.value;
    });
  }

  /* ---------------- 评论 ---------------- */
  function commentsHtml(vid) {
    var list = C.commentsOf(vid);
    if (!list.length) {
      return '<div class="cw-note">还没导评论。点「批量粘贴导入」，一行一条，直接粘抖音评论区复制的文本就行。</div>';
    }
    var byType = {};
    list.forEach(function (c) { byType[c.ctype || '其他'] = (byType[c.ctype || '其他'] || 0) + 1; });
    var chips = Object.keys(byType).map(function (k) {
      return '<span class="cw-tag ' + (k === '用户提问' ? 'is-acc' : k === '购买意向' ? 'is-ok' : k === '负面反馈' ? 'is-bad' : '') + '">' + esc(k) + ' ' + byType[k] + '</span>';
    }).join(' ');
    return '<div class="cw-bar" style="margin-bottom:8px">' +
        '<input class="cw-in" style="max-width:200px" placeholder="搜评论 / 关键词统计" data-cw-cq="' + esc(vid) + '">' +
        '<span style="font-size:11.5px;color:var(--cw-ink3)">共 ' + list.length + ' 条</span>' +
        '<span class="cw-grow"></span>' + chips +
        '<button class="cw-btn is-sm" data-cw-canalyze="1">AI 分析评论</button>' +
      '</div>' +
      '<div class="cw-cmt" id="cwCmtList">' + commentRows(list) + '</div>';
  }

  function commentRows(list) {
    return list.map(function (c) {
      return '<div class="cw-cmt-row' + (c.hi ? ' hi' : '') + '">' +
        '<div class="cw-cmt-main">' +
          '<div class="cw-cmt-t">' + esc(c.text) + '</div>' +
          '<div class="cw-cmt-m">' +
            (c.user ? '<span>' + esc(c.user) + '</span>' : '') +
            (c.like != null && c.like !== '' ? '<span>赞 ' + esc(c.like) + '</span>' : '') +
            (c.time ? '<span>' + esc(c.time) + '</span>' : '') +
            '<select data-cw-ctype="' + esc(c.id) + '">' + C.CTYPE.map(function (t) {
              return '<option' + (t === (c.ctype || '其他') ? ' selected' : '') + '>' + t + '</option>';
            }).join('') + '</select>' +
            '<label style="display:inline-flex;align-items:center;gap:3px"><input type="checkbox" data-cw-chi="' + esc(c.id) + '"' + (c.hi ? ' checked' : '') + '>高价值</label>' +
          '</div>' +
        '</div>' +
        '<div class="cw-cmt-act">' +
          '<button class="cw-btn is-sm is-ghost" data-cw-ctotopic="' + esc(c.id) + '" title="拿这条评论去开选题">开选题</button>' +
          '<button class="cw-shot-x" data-cw-cdel="' + esc(c.id) + '">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function refreshComments(vid) {
    var box = document.getElementById('cwCmtBox');
    if (box) box.innerHTML = commentsHtml(vid);
  }

  function renderCommentList(vid, q) {
    var list = C.commentsOf(vid);
    q = String(q || '').trim().toLowerCase();
    if (q) list = list.filter(function (c) { return String(c.text).toLowerCase().indexOf(q) >= 0; });
    var box = document.getElementById('cwCmtList');
    if (box) box.innerHTML = list.length ? commentRows(list) : '<div class="cw-note">这个词一条都没搜到</div>';
  }

  /* 批量粘贴：一行一条；支持「昵称<Tab>内容」「内容<Tab>点赞数」两种顺序靠猜 */
  function pasteComments(v) {
    var txt = prompt('把评论整段粘进来，一行一条。\n（浏览器弹框里粘完按确定，太长的建议用 CSV）');
    if (!txt) return;
    var lines = String(txt).split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    var d = C.D();
    var n = 0;
    lines.forEach(function (ln) {
      var parts = ln.split(/\t|\s{3,}/).map(function (x) { return x.trim(); }).filter(Boolean);
      var text = ln, user = '', like = '';
      if (parts.length >= 2) {
        if (/^\d+$/.test(parts[parts.length - 1])) { like = parts.pop(); }
        if (parts.length >= 2 && parts[0].length <= 16) { user = parts.shift(); }
        text = parts.join(' ');
      }
      d.comments.push({
        id: C.uid('c-'), videoId: v.id, text: text, user: user, like: like,
        time: '', ctype: guessType(text), hi: false, note: '', createdAt: today()
      });
      n++;
    });
    C.save(true);
    refreshComments(v.id);
    toast('导进 ' + n + ' 条评论', 'ok');
  }

  function importCSV(v, file) {
    var fr = new FileReader();
    fr.onload = function () {
      var txt = String(fr.result || '');
      var lines = txt.split(/\r?\n/).filter(function (x) { return x.trim(); });
      var d = C.D();
      var n = 0;
      lines.forEach(function (ln, i) {
        if (i === 0 && /评论|内容|content|text/i.test(ln)) return;
        var cells = ln.split(',').map(function (x) { return x.replace(/^"|"$/g, '').trim(); });
        if (!cells.length || !cells[0]) return;
        // 约定列序：内容,昵称,点赞,时间
        var text = cells[0], user = cells[1] || '', like = cells[2] || '', time = cells[3] || '';
        // 如果第一列像昵称、第二列更长，就换过来
        if (cells[1] && cells[1].length > text.length + 4) { user = cells[0]; text = cells[1]; }
        d.comments.push({
          id: C.uid('c-'), videoId: v.id, text: text, user: user, like: like, time: time,
          ctype: guessType(text), hi: false, note: '', createdAt: today()
        });
        n++;
      });
      C.save(true);
      refreshComments(v.id);
      toast('CSV 导进 ' + n + ' 条', 'ok');
    };
    fr.readAsText(file, 'utf-8');
  }

  function guessType(t) {
    t = String(t);
    // 带货号里「多少钱 / 在哪买」比提问更值钱，所以购买意向排第一
    if (/买|要一个|来一个|链接|下单|哪里买|哪买|哪有|想入|入手|多少米|多少钱|价格|便宜|优惠|包邮/.test(t)) return '购买意向';
    if (/垃圾|坑|后悔|退货|退了|烂|丑|不行|失望|骗|翻车/.test(t)) return '负面反馈';
    if (/下期|能不能拍|想看|做个|讲讲|出一期|评测一下/.test(t)) return '内容建议';
    if (/应该|不如|其实|纠正|不对|反驳|不认同|说错/.test(t)) return '观点争议';
    if (/怎么|能不能|可以|哪[个款]|什么|为什么|多少|？|\?/.test(t)) return '用户提问';
    if (/牛|好|喜欢|厉害|支持|赞|香|顶|绝了/.test(t)) return '正面反馈';
    return '其他';
  }

  function commentToTopic(c, v) {
    var t = {
      id: C.uid('t-'), title: (c.text || '').slice(0, 40), account: v.account || '数码大号',
      ctType: '用户问题解答', source: '评论区', core: '', userNeed: c.text || '', hook: '',
      plan: '来自视频《' + (v.name || '').slice(0, 30) + '》的评论', refs: v.url ? [{ label: '原视频', url: v.url }] : [],
      material: '', shootable: C.SHOOTABLE[0], priority: 2, status: '待策划',
      note: '评论原文：' + c.text, tags: ['评论区'], createdAt: today(), updatedAt: today(), draftId: '', videoId: ''
    };
    C.D().topics.unshift(t);
    c.hi = true;
    C.save(true);
    toast('已生成选题，去选题池能看到', 'ok');
  }

  /* ---------------- 复盘字段 ---------------- */
  var REV = [
    ['perf', '表现评价'], ['success', '主要成功因素'], ['problem', '主要问题'],
    ['feedback', '用户反馈总结'], ['open', '开场设计分析'], ['structure', '文案结构分析'],
    ['shoot', '拍摄问题'], ['edit', '剪辑问题'], ['reuse', '可复用经验'], ['next', '下次改进方向']
  ];

  function reviewFields(vid) {
    var r = C.reviewOf(vid) || {};
    return '<div class="cw-grid cw-g2">' + REV.map(function (p) {
      return '<div class="cw-field"><label>' + p[1] + '</label><textarea class="cw-ta" style="min-height:56px" data-cw-r="' + p[0] + '">' + esc(r[p[0]] || '') + '</textarea></div>';
    }).join('') + '</div>';
  }

  function collectReview(vid, el) {
    var d = C.D();
    var r = C.reviewOf(vid);
    var any = false;
    var o = { videoId: vid, updatedAt: today() };
    el.querySelectorAll('[data-cw-r]').forEach(function (inp) {
      o[inp.getAttribute('data-cw-r')] = inp.value;
      if (String(inp.value).trim()) any = true;
    });
    if (!any && !r) return;
    if (r) { Object.assign(r, o); }
    else { o.id = C.uid('r-'); d.reviews.push(o); }
  }

  global.CWB2 = {
    renderVideos: renderVideos, openVideo: openVideo, VF: VF,
    median: median, guessType: guessType, REV: REV
  };
})(window);
