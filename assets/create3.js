/* ============================================================
   创作线升级 · 口播工坊面板 + 战报复盘 + AI 中心 + 雷达操作 + 生产看板
   ============================================================ */
(function (global) {
  'use strict';
  var C = global.CWB;
  if (!C) { console.error('[cw] create.js 没加载'); return; }
  var esc = C.esc, num = C.num, wan = C.wan, pct = C.pct, today = C.today, toast = C.toast;

  /* ============================================================
     一、口播工坊：拍摄 / 剪辑 / 生产记录面板
     ============================================================ */
  var SHOT_TPL = [
    '开场：机器上手第一下（出镜手部特写，2 秒内）',
    '卖点镜头：把要讲的那一点单独拍清楚',
    '对比镜头：和陪衬机器摆一起，同一角度同一光',
    '价格镜头：官网价 / 渠道价截图或相机拍屏',
    '结尾：手拿配件或店内环境（收尾用）'
  ];
  var EDIT_TPL = {
    open: '第一帧就给结论画面，不要片头不要 logo',
    pace: '1 分 30 内，每 3-5 秒一个画面变化，不留静态超 5 秒',
    subtitle: '数字全上字幕：价格、容量、尺寸；型号名不要字幕机翻',
    transition: '硬切为主，只在换场景用一次叠化',
    fx: '不加花哨特效，放大推镜最多两处',
    bgm: '轻鼓点，音量压到人声的 20%',
    beat: '价格落地那一下卡重点',
    footage: '店内实拍为主，官方渲染图最多 2 张且必须标来源',
    ending: '固定句「完了你们记得买配件多问问我奥」原声收，不配字',
    note: ''
  };

  function panelOf(did) {
    var a = C.ensureAttach(did);
    if (!a.shoot.shots || !a.shoot.shots.length) {
      // 第一次打开：给一份能直接改的默认拍摄清单
      a.shoot.shots = SHOT_TPL.map(function (t) { return { id: C.uid('s-'), text: t, done: false }; });
      C.save(true);
    }
    return a;
  }

  function kouboPanel(d) {
    if (!d || !d.id) return '';
    var a = panelOf(d.id);
    var sh = a.shoot || {}, ed = a.edit || {}, cr = a.crew || {};
    var shots = (sh.shots || []).map(function (s, i) {
      return '<div class="cw-shot' + (s.done ? ' done' : '') + '" data-cw-shot="' + esc(s.id) + '">' +
        '<input type="checkbox" class="cw-chk" data-cw-shotdone="' + esc(s.id) + '"' + (s.done ? ' checked' : '') + '>' +
        '<span class="cw-shot-t">' + esc(s.text) + '</span>' +
        '<button class="cw-shot-x" data-cw-shotx="' + esc(s.id) + '">✕</button></div>';
    }).join('');
    var doneN = (sh.shots || []).filter(function (s) { return s.done; }).length;
    var totN = (sh.shots || []).length;

    var shootBody =
      '<div class="cw-grid cw-g3">' +
        C.field('出镜人员', '<input class="cw-in" data-cw-a="shoot.people" value="' + esc(sh.people || '') + '" placeholder="我 / 助理 / 不出镜">') +
        C.field('拍摄场景', '<input class="cw-in" data-cw-a="shoot.scene" value="' + esc(sh.scene || '') + '" placeholder="店里 / 桌前 / 户外">') +
        C.field('拍摄设备', '<input class="cw-in" data-cw-a="shoot.device" value="' + esc(sh.device || '') + '" placeholder="手机 / 相机 / 补光">') +
      '</div>' +
      '<div class="cw-grid cw-g3" style="margin-top:10px">' +
        C.field('镜头景别', '<input class="cw-in" data-cw-a="shoot.shotSize" value="' + esc(sh.shotSize || '') + '" placeholder="特写为主 / 半身">') +
        C.field('运镜方式', '<input class="cw-in" data-cw-a="shoot.move" value="' + esc(sh.move || '') + '" placeholder="固定 / 手推">') +
        C.field('产品展示顺序', '<input class="cw-in" data-cw-a="shoot.order" value="' + esc(sh.order || '') + '" placeholder="Duo → X7 → 配件">') +
      '</div>' +
      '<div class="cw-sec-h" style="margin:12px 0 7px">必须拍到的镜头' + '<span class="cw-sec-n">' + doneN + '/' + totN + ' 已拍</span><span class="cw-sec-line"></span></div>' +
      '<div class="cw-prog' + (doneN === totN && totN ? ' is-ok' : '') + '" style="margin-bottom:8px"><i style="width:' + (totN ? Math.round(doneN / totN * 100) : 0) + '%"></i></div>' +
      '<div class="cw-shots">' + (shots || '<div class="cw-note">还没有镜头。点下面「+ 加一个镜头」。</div>') + '</div>' +
      '<div class="cw-actions" style="margin-top:8px">' +
        '<button class="cw-btn is-sm" data-cw-shotadd="1">+ 加一个镜头</button>' +
        '<button class="cw-btn is-sm" data-cw-shottpl="1">套用通用清单</button>' +
      '</div>' +
      '<div style="margin-top:10px">' +
        C.field('需要补拍的素材', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="shoot.extra">' + esc(sh.extra || '') + '</textarea>') +
        C.field('特别注意事项', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="shoot.note">' + esc(sh.note || '') + '</textarea>') +
      '</div>';

    var editBody =
      '<div class="cw-grid cw-g2">' +
        C.field('开场画面设计', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.open">' + esc(ed.open || '') + '</textarea>') +
        C.field('剪辑节奏', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.pace">' + esc(ed.pace || '') + '</textarea>') +
        C.field('字幕重点', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.subtitle">' + esc(ed.subtitle || '') + '</textarea>') +
        C.field('转场方式', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.transition">' + esc(ed.transition || '') + '</textarea>') +
        C.field('特效要求', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.fx">' + esc(ed.fx || '') + '</textarea>') +
        C.field('BGM', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.bgm">' + esc(ed.bgm || '') + '</textarea>') +
        C.field('卡点要求', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.beat">' + esc(ed.beat || '') + '</textarea>') +
        C.field('画面素材', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.footage">' + esc(ed.footage || '') + '</textarea>') +
      '</div>' +
      '<div class="cw-grid cw-g2" style="margin-top:10px">' +
        C.field('结尾处理', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.ending">' + esc(ed.ending || '') + '</textarea>') +
        C.field('其他剪辑备注', '<textarea class="cw-ta" style="min-height:52px" data-cw-a="edit.note">' + esc(ed.note || '') + '</textarea>') +
      '</div>' +
      '<div class="cw-actions" style="margin-top:8px"><button class="cw-btn is-sm" data-cw-edittpl="1">套用默认剪辑方案</button></div>';

    var crewBody =
      '<div class="cw-grid cw-g4">' +
        C.field('文案撰写', '<input class="cw-in" data-cw-a="crew.writer" value="' + esc(cr.writer || '') + '">') +
        C.field('拍摄执行', '<input class="cw-in" data-cw-a="crew.shooter" value="' + esc(cr.shooter || '') + '">') +
        C.field('剪辑执行', '<input class="cw-in" data-cw-a="crew.editor" value="' + esc(cr.editor || '') + '">') +
        C.field('审核', '<input class="cw-in" data-cw-a="crew.reviewer" value="' + esc(cr.reviewer || '') + '">') +
      '</div>' +
      '<div class="cw-grid cw-g3" style="margin-top:10px">' +
        C.field('拍摄完成', '<input class="cw-in" type="date" data-cw-a="crew.shootDone" value="' + esc(cr.shootDone || '') + '">') +
        C.field('剪辑完成', '<input class="cw-in" type="date" data-cw-a="crew.editDone" value="' + esc(cr.editDone || '') + '">') +
        C.field('发布状态', C.sel('crew.pubStatus', ['未发布', '已发布', '暂缓'], cr.pubStatus || '未发布').replace('data-cw-f="crew.pubStatus"', 'data-cw-a="crew.pubStatus"')) +
      '</div>' +
      '<div class="cw-actions" style="margin-top:10px">' +
        '<button class="cw-btn is-sm" data-cw-listshoot="1">生成拍摄清单</button>' +
        '<button class="cw-btn is-sm" data-cw-listedit="1">生成剪辑清单</button>' +
        (a.videoId && C.videoById(a.videoId)
          ? '<button class="cw-btn is-sm" data-cw-govideo2="' + esc(a.videoId) + '">已进档案，去查看 →</button>'
          : '<button class="cw-btn is-sm is-dark" data-cw-tovideo="1">转入视频档案</button>') +
      '</div>';

    return '<div class="cw-foldbox" data-cw-panel="' + esc(d.id) + '" style="margin:8px 0 4px">' +
      C.folds([
        { t: '拍摄方案', s: doneN + '/' + totN, b: shootBody },
        { t: '剪辑方案', s: '', b: editBody },
        { t: '生产记录', s: cr.pubStatus || '', b: crewBody }
      ]) + '</div>';
  }

  /* 绑定：因为 kb 编辑器会整块重渲染，这里用事件委托挂到 sec-koubo 上（只挂一次） */
  var kouboBound = false;
  function bindKoubo() {
    if (kouboBound) return;
    var sec = document.getElementById('sec-koubo');
    if (!sec) return;
    kouboBound = true;

    sec.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-cw-fold-t]')) {
        var f = t.closest('.cw-fold');
        if (f) f.classList.toggle('on');
        return;
      }
      var did = curDraftId();
      if (!did) return;
      var a = C.ensureAttach(did);

      if (t.closest('[data-cw-shotadd]')) {
        var txt = prompt('加一个必拍镜头：');
        if (!txt) return;
        a.shoot.shots.push({ id: C.uid('s-'), text: txt, done: false });
        C.save(true); rerender();
        return;
      }
      if (t.closest('[data-cw-shottpl]')) {
        a.shoot.shots = SHOT_TPL.map(function (x) { return { id: C.uid('s-'), text: x, done: false }; });
        C.save(true); rerender(); toast('套上通用清单了', 'ok');
        return;
      }
      var sx = t.closest('[data-cw-shotx]');
      if (sx) {
        var sid = sx.getAttribute('data-cw-shotx');
        a.shoot.shots = a.shoot.shots.filter(function (x) { return x.id !== sid; });
        C.save(true); rerender();
        return;
      }
      if (t.closest('[data-cw-edittpl]')) {
        a.edit = Object.assign({}, EDIT_TPL);
        C.save(true); rerender(); toast('套上默认剪辑方案了', 'ok');
        return;
      }
      if (t.closest('[data-cw-listshoot]')) {
        var dd = C.attachOf(did) || a;
        var doc = curDoc();
        var txt2 = '【拍摄清单】' + (doc ? doc.title : '') + '\n' +
          '出镜：' + (dd.shoot.people || '—') + ' | 场景：' + (dd.shoot.scene || '—') + ' | 设备：' + (dd.shoot.device || '—') + '\n' +
          '景别：' + (dd.shoot.shotSize || '—') + ' | 运镜：' + (dd.shoot.move || '—') + '\n' +
          '产品顺序：' + (dd.shoot.order || '—') + '\n\n必拍镜头：\n' +
          (dd.shoot.shots || []).map(function (s, i) { return (i + 1) + '. [' + (s.done ? '✓' : ' ') + '] ' + s.text; }).join('\n') +
          '\n\n需补拍：' + (dd.shoot.extra || '—') + '\n注意：' + (dd.shoot.note || '—');
        C.copy(txt2);
        return;
      }
      if (t.closest('[data-cw-listedit]')) {
        var ed2 = a.edit || {};
        var doc2 = curDoc();
        var txt3 = '【剪辑清单】' + (doc2 ? doc2.title : '') + '\n' +
          '开场：' + (ed2.open || '—') + '\n节奏：' + (ed2.pace || '—') + '\n字幕：' + (ed2.subtitle || '—') +
          '\n转场：' + (ed2.transition || '—') + '\n特效：' + (ed2.fx || '—') + '\nBGM：' + (ed2.bgm || '—') +
          '\n卡点：' + (ed2.beat || '—') + '\n素材：' + (ed2.footage || '—') + '\n结尾：' + (ed2.ending || '—') +
          '\n备注：' + (ed2.note || '—');
        C.copy(txt3);
        return;
      }
      if (t.closest('[data-cw-tovideo]')) { toVideo(did); return; }
      var gv = t.closest('[data-cw-govideo2]');
      if (gv) { global.CWB2.openVideo(gv.getAttribute('data-cw-govideo2')); return; }
    });

    sec.addEventListener('change', function (e) {
      var cb = e.target.closest('[data-cw-shotdone]');
      if (!cb) return;
      var did = curDraftId(); if (!did) return;
      var a = C.ensureAttach(did);
      var sid = cb.getAttribute('data-cw-shotdone');
      a.shoot.shots.forEach(function (s) { if (s.id === sid) s.done = cb.checked; });
      C.save(true); rerender();
    });

    sec.addEventListener('input', function (e) {
      var inp = e.target.closest('[data-cw-a]');
      if (!inp) return;
      var did = curDraftId(); if (!did) return;
      var a = C.ensureAttach(did);
      var path = inp.getAttribute('data-cw-a').split('.');
      if (!a[path[0]]) a[path[0]] = {};
      a[path[0]][path[1]] = inp.value;
      C.save();
    });
  }

  function curDraftId() {
    try { return global.KB && global.KB.open ? global.KB.open : ''; } catch (e) { return ''; }
  }
  function curDoc() {
    try { return global.KB && global.KB.open && global.kbGet ? global.kbGet(global.KB.open) : null; } catch (e) { return null; }
  }
  function rerender() {
    // 只重画面板，不动 textarea 焦点
    var box = document.querySelector('[data-cw-panel]');
    var d = curDoc();
    if (box && d) box.outerHTML = kouboPanel(d);
  }

  /* 稿件 → 视频档案 */
  function toVideo(did) {
    var d = C.D();
    var a = C.ensureAttach(did);
    if (a.videoId && C.videoById(a.videoId)) { global.CWB2.openVideo(a.videoId); return; }
    var doc = curDoc();
    var v = {
      id: C.uid('v-'), name: doc ? doc.title : (a.title || ''),
      account: (C.topicById(a.topicId) || {}).account || '数码大号',
      platform: '抖音', date: today(), time: '19:00', url: '', cover: '',
      vtype: '观点分析', topicId: a.topicId || '', draftId: did,
      stats: {}, prod: {
        shooter: (a.crew || {}).shooter || '', editor: (a.crew || {}).editor || '',
        reviewer: (a.crew || {}).reviewer || ''
      },
      mark: '', star: false, tags: [], src: 'draft', createdAt: today()
    };
    d.videos.unshift(v);
    a.videoId = v.id;
    if (a.topicId) {
      var t = C.topicById(a.topicId);
      if (t) { t.videoId = v.id; t.status = '已完成'; }
    }
    C.save(true);
    toast('进档案了，数据回头补', 'ok');
    global.CWB2.openVideo(v.id);
  }

  /* ============================================================
     二、战报升级：筛选 / 排行 / 类型对比 / 成功案例库
     ============================================================ */
  var RF = { account: '', vtype: '', dim: 'play', top: 12 };

  function reportExtra() {
    var d = C.D();
    var list = d.videos.filter(function (v) {
      if (RF.account && v.account !== RF.account) return false;
      if (RF.vtype && v.vtype !== RF.vtype) return false;
      return num(v.stats && v.stats.play) > 0;
    });
    var dims = [
      { k: 'play', t: '播放' }, { k: 'like', t: '点赞' }, { k: 'cmt', t: '评论' },
      { k: 'share', t: '转发' }, { k: 'fav', t: '收藏' }, { k: 'fans', t: '涨粉' }
    ];
    var top = list.slice().sort(function (a, b) { return num(b.stats[RF.dim]) - num(a.stats[RF.dim]); }).slice(0, RF.top);

    var rank = top.map(function (v, i) {
      return '<tr data-cw-video="' + esc(v.id) + '">' +
        '<td class="num" style="width:34px;color:var(--cw-ink3)">' + (i + 1) + '</td>' +
        '<td class="tt">' + (v.star ? '★ ' : '') + esc(v.name) + '</td>' +
        '<td class="num"><b>' + wan(v.stats[RF.dim]) + '</b></td>' +
        '<td class="num">' + wan(v.stats.play) + '</td>' +
        '<td style="white-space:nowrap;color:var(--cw-ink3)">' + esc(v.date) + '</td>' +
        '<td><span class="cw-tag">' + esc(v.vtype || '—') + '</span></td>' +
      '</tr>';
    }).join('');

    // 内容 vs 引流
    var groups = {};
    list.forEach(function (v) {
      var k = /引流/.test(v.vtype || '') ? '引流视频' : '内容视频';
      (groups[k] = groups[k] || []).push(num(v.stats.play));
    });
    var cmp = Object.keys(groups).map(function (k) {
      var arr = groups[k].slice().sort(function (a, b) { return a - b; });
      var med = arr.length ? (arr.length % 2 ? arr[(arr.length - 1) / 2] : Math.round((arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2)) : 0;
      return '<div class="cw-mini-row"><span class="cw-mini-k">' + k + '</span>' +
        '<span style="color:var(--cw-ink3);font-size:11.5px">' + arr.length + ' 条 · 中位</span>' +
        '<span class="cw-mini-v">' + wan(med) + '</span></div>';
    }).join('');

    var cases = d.videos.filter(function (v) { return v.star || v.mark === '成功案例'; }).slice(0, 12);
    var caseHtml = cases.length ? '<div class="cw-board" style="gap:9px">' + cases.map(function (v) {
      return '<div class="cw-card" style="flex:0 0 232px" data-cw-video="' + esc(v.id) + '">' +
        '<div class="cw-card-t">' + (v.star ? '★ ' : '') + esc(v.name.slice(0, 30)) + '</div>' +
        '<div class="cw-card-m"><span class="cw-tag is-ok">' + wan(v.stats && v.stats.play) + ' 播放</span>' +
        '<span class="cw-tag">' + esc(v.vtype || '—') + '</span>' +
        (v.stats && v.stats.fin != null ? '<span class="cw-tag is-brown">完播 ' + pct(v.stats.fin) + '</span>' : '') + '</div>' +
        (v.tags && v.tags.length ? '<div class="cw-card-m">' + v.tags.slice(0, 3).map(function (t) { return '<span class="cw-tag is-blue">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '</div>';
    }).join('') + '</div>' : '<div class="cw-note">还没有成功案例。去视频档案里把跑得好的标成「成功案例」，这里就会出现。</div>';

    return '<div class="cw-wrap" style="margin-top:14px">' +
      '<div class="cw-panel"><div class="cw-panel-h"><b>从视频档案重新统计</b>' +
        '<span class="cw-panel-sub">上面那张是老板原表 · 这块是档案里的实时数</span></div>' +
        '<div class="cw-panel-b">' +
          '<div class="cw-bar" style="margin-bottom:10px">' +
            C.accSel('raccount', RF.account, '全部账号').replace('data-cw-f="raccount"', 'data-cw-rf="account"') +
            C.sel('rvtype', (function () { var s = {}; d.videos.forEach(function (v) { if (v.vtype) s[v.vtype] = 1; }); return Object.keys(s); })(), RF.vtype, '全部类型').replace('data-cw-f="rvtype"', 'data-cw-rf="vtype"') +
            C.seg('rdim', dims.map(function (x) { return { v: x.k, t: x.t }; }), RF.dim, 'data-cw-rdim="1"') +
            '<span class="cw-grow"></span>' +
            '<span style="font-size:11.5px;color:var(--cw-ink3)">共 ' + list.length + ' 条有播放数据</span>' +
          '</div>' +
          (top.length ? '<table class="cw-table"><thead><tr><th>#</th><th>视频</th><th style="text-align:right">' +
            (dims.filter(function (x) { return x.k === RF.dim; })[0] || { t: '' }).t + '</th><th style="text-align:right">播放</th><th>日期</th><th>类型</th></tr></thead><tbody>' + rank + '</tbody></table>'
            : '<div class="cw-note">这个筛选下没有带播放数据的视频</div>') +
        '</div></div>' +
      '<div class="cw-grid cw-g2">' +
        '<div class="cw-panel"><div class="cw-panel-h"><b>内容 vs 引流</b></div><div class="cw-panel-b"><div class="cw-mini">' + (cmp || '<div class="cw-note">没数据</div>') + '</div></div></div>' +
        '<div class="cw-panel"><div class="cw-panel-h"><b>爆款案例库</b><span class="cw-panel-sub">' + cases.length + ' 条</span></div>' +
          '<div class="cw-panel-b">' + caseHtml + '</div></div>' +
      '</div></div>';
  }

  /* ============================================================
     三、AI 中心
     ============================================================ */
  var AI = { fun: '', obj: '', out: '' };

  var AI_DEFS = [
    {
      k: 'teardown', t: '爆款视频拆解', d: '把一条跑起来的视频拆成可复用的方法，落到开场、结构、卖点、镜头、节奏。',
      run: function (v) {
        if (!v) return '先在下面选一条视频。';
        var r = C.reviewOf(v.id) || {};
        var cs = C.commentsOf(v.id);
        return [
          '你是一个懂抖音数码赛道的复盘教练。下面是我们要拆的一条视频，请只依据给到的材料分析，材料里没有的不要编。',
          '',
          '【视频】' + v.name,
          '【账号】' + (v.account || '') + ' ｜【类型】' + (v.vtype || '') + ' ｜【发布】' + (v.date || ''),
          '【数据】播放 ' + (v.stats && v.stats.play != null ? v.stats.play : '无') +
            ' ｜点赞 ' + ((v.stats && v.stats.like) || '无') + ' ｜评论 ' + ((v.stats && v.stats.cmt) || '无') +
            ' ｜完播率 ' + (v.stats && v.stats.fin != null ? (num(v.stats.fin) * 100).toFixed(1) + '%' : '无') +
            ' ｜平均时长 ' + ((v.stats && v.stats.avg) || '无') + ' 秒',
          '【文案】（如有关联口播稿请贴在这里）',
          '【拍摄方案】（如有请贴）',
          '【剪辑方案】（如有请贴）',
          cs.length ? '【评论区节选】\n' + cs.slice(0, 40).map(function (c) { return '- ' + c.text; }).join('\n') : '【评论区】无',
          '',
          '请按下面九块输出，每块 2-4 句，不要写空话：',
          '1. 开场钩子：前三秒做了什么、替观众决定了什么',
          '2. 内容结构：一段一段拆开，标出每一段在干哪件事',
          '3. 核心卖点：这条真正卖的是什么（不是参数）',
          '4. 文案表达：用了哪些口语手法、哪些句子是可以直接套的',
          '5. 镜头设计：镜头怎么配合说的内容',
          '6. 剪辑节奏：多少秒一个变化，卡点在哪',
          '7. 用户反馈：评论区印证了什么、否掉了什么',
          '8. 成功因素：给出 2-3 条假设，并说明证据够不够（相关性≠因果）',
          '9. 可复用方法：写成我下次能照着做的 3 条动作'
        ].join('\n');
      }
    },
    {
      k: 'comments', t: '评论区分析', d: '从真实评论里找需求、问题、争议和顾虑，每条结论都要带原文。',
      run: function (v) {
        if (!v) return '先在下面选一条视频。';
        var cs = C.commentsOf(v.id);
        if (!cs.length) return '这条还没导评论。先到视频档案里把评论粘进来，再回来分析。';
        return [
          '你是一个做数码短视频的内容负责人。下面是一条视频的评论区原文，请只依据这些评论分析，每条结论必须附上对应的评论原文，找不到原文支撑的就不要写。',
          '',
          '【视频】' + v.name + '（' + (v.vtype || '') + '，' + (v.date || '') + '，播放 ' + ((v.stats && v.stats.play) || '无') + '）',
          '【评论共 ' + cs.length + ' 条】',
          cs.map(function (c, i) {
            return (i + 1) + '. ' + c.text + (c.like ? '（赞 ' + c.like + '）' : '') + (c.ctype ? '［' + c.ctype + '］' : '');
          }).join('\n'),
          '',
          '请输出七块，每块结论后面用「原评：」标出支撑的评论（最多 3 条，逐字引用）：',
          '1. 用户核心需求',
          '2. 高频问题（能合并的合并，给出出现次数）',
          '3. 主要争议（正反双方各自的原话）',
          '4. 用户购买顾虑',
          '5. 正面反馈集中在哪',
          '6. 负面反馈集中在哪',
          '7. 新选题建议：每条给「选题名 + 为什么这条评论值得单独做一条 + 要用哪条评论做开场」'
        ].join('\n');
      }
    },
    {
      k: 'plan', t: '选题策划助手', d: '拿一条选题，结合历史成功案例给三种角度、钩子和大纲。',
      run: function (t) {
        if (!t) return '先在下面选一条选题。';
        var cases = C.D().videos.filter(function (v) { return v.star || v.mark === '成功案例'; }).slice(0, 8);
        return [
          '你是一个懂抖音数码赛道的选题策划。下面的选题是我们自己的真实选题，请结合我们跑起来过的案例来给方案，不要给通用建议。',
          '',
          '【选题】' + t.title,
          '【账号】' + (t.account || '') + ' ｜【类型】' + (t.ctType || '') + ' ｜【来源】' + (t.source || ''),
          '【核心观点】' + (t.core || '未填'),
          '【用户关注点】' + (t.userNeed || '未填'),
          '【可拍摄性】' + (t.shootable || ''),
          '【已核事实】' + (t.plan || '未填'),
          '',
          '【我们跑起来过的案例（播放/类型/标题）】',
          cases.length ? cases.map(function (v) { return '- ' + wan(v.stats && v.stats.play) + ' ｜' + (v.vtype || '') + ' ｜' + v.name; }).join('\n') : '（还没有标记成功案例）',
          '',
          '硬约束，方案必须遵守：',
          '- 口播 520-700 字，一整段不分段不编号，像语音转文字',
          '- 结尾固定句：完了你们记得买配件多问问我奥',
          '- 不许写没见过的画面，不许编价格（价格必须能落到官网或公开报道）',
          '- 选题优先级判据：先想「这台机器今天在我店里发生什么」，再想参数',
          '',
          '请输出：',
          '1. 三种策划角度（每个角度一句话说清「观众会看到什么他没见过的画面」）',
          '2. 推荐哪一个角度，为什么（结合上面的案例数据）',
          '3. 核心观点一句话',
          '4. 三个开场钩子（每个不超过 20 字，要能直接念）',
          '5. 文案大纲（按「起—加码—转折—落点」四段，不写成分镜）',
          '6. 需要的拍摄素材清单',
          '7. 适合哪个账号发，为什么',
          '8. 与历史案例的相似点（指明是哪一条、像在哪）'
        ].join('\n');
      }
    },
    {
      k: 'review', t: '视频复盘助手', d: '综合数据、文案、评论、拍摄剪辑记录，给假设和改进建议。',
      run: function (v) {
        if (!v) return '先在下面选一条视频。';
        var cs = C.commentsOf(v.id);
        var r = C.reviewOf(v.id) || {};
        var a = v.draftId ? C.attachOf(v.draftId) : null;
        return [
          '你是一个严格但不刻薄的内容复盘教练。只依据材料说话，数据不足就明说「样本不够」，不许把相关性当因果。',
          '',
          '【视频】' + v.name + '（' + (v.account || '') + ' / ' + (v.vtype || '') + ' / ' + (v.date || '') + '）',
          '【数据】播放 ' + ((v.stats && v.stats.play) || '无') + ' ｜点赞 ' + ((v.stats && v.stats.like) || '无') +
            ' ｜评论 ' + ((v.stats && v.stats.cmt) || '无') + ' ｜转发 ' + ((v.stats && v.stats.share) || '无') +
            ' ｜收藏 ' + ((v.stats && v.stats.fav) || '无') + ' ｜涨粉 ' + ((v.stats && v.stats.fans) || '无') +
            ' ｜完播 ' + (v.stats && v.stats.fin != null ? (num(v.stats.fin) * 100).toFixed(1) + '%' : '无') +
            ' ｜平均时长 ' + ((v.stats && v.stats.avg) || '无') + ' 秒',
          '【同类型参考中位】' + (function () {
            var arr = C.D().videos.filter(function (x) { return x.vtype === v.vtype && x.id !== v.id; })
              .map(function (x) { return num(x.stats && x.stats.play); }).filter(function (n) { return n > 0; }).sort(function (a, b) { return a - b; });
            return arr.length ? ('中位 ' + wan(arr[Math.floor(arr.length / 2)]) + '（' + arr.length + ' 条同类型）') : '无同类型样本';
          })(),
          a ? '【计划拍摄】' + JSON.stringify(a.shoot || {}, null, 0).slice(0, 600) : '【计划拍摄】无',
          a ? '【计划剪辑】' + JSON.stringify(a.edit || {}, null, 0).slice(0, 600) : '【计划剪辑】无',
          v.prod && (v.prod.realShoot || v.prod.realEdit) ? '【实际拍摄/剪辑】' + (v.prod.realShoot || '') + ' / ' + (v.prod.realEdit || '') : '【实际】未填',
          cs.length ? '【评论节选 ' + cs.length + ' 条】\n' + cs.slice(0, 30).map(function (c) { return '- ' + c.text; }).join('\n') : '【评论】无',
          r.perf ? '【我自己已经写的复盘】' + JSON.stringify(r).slice(0, 500) : '',
          '',
          '请输出：',
          '1. 数据表现：跟同类型中位比，好在哪差在哪（说清是量的问题还是质的问题）',
          '2. 用户反馈：从评论能确认什么、不能确认什么',
          '3. 内容优点（最多 3 条，每条要指到具体做法）',
          '4. 内容缺点（最多 3 条，同样要指到具体做法）',
          '5. 成功因素假设（标明哪些有证据、哪些只是猜测）',
          '6. 失败原因假设（同上）',
          '7. 下一条的具体改法（3 条可执行动作，不许写「多互动」这种空话）'
        ].join('\n');
      }
    }
  ];

  function renderAI() {
    var d = C.D();
    var vids = d.videos.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 120);
    var objOpts = '<option value="">选一条视频</option>' + vids.map(function (v) {
      return '<option value="' + esc(v.id) + '"' + (AI.obj === v.id ? ' selected' : '') + '>' + esc((v.date || '') + ' ' + v.name.slice(0, 26)) + '</option>';
    }).join('');
    var tOpts = '<option value="">选一条选题</option>' + d.topics.slice(0, 120).map(function (t) {
      return '<option value="' + esc(t.id) + '"' + (AI.obj === t.id ? ' selected' : '') + '>' + esc(t.title.slice(0, 28)) + '</option>';
    }).join('');

    var cur = AI_DEFS.filter(function (x) { return x.k === AI.fun; })[0] || AI_DEFS[0];
    var isTopic = cur.k === 'plan';
    var target = isTopic ? C.topicById(AI.obj) : C.videoById(AI.obj);
    var prompt = cur.run(target);

    var cards = AI_DEFS.map(function (x) {
      return '<div class="cw-ai-card" data-cw-aifun="' + x.k + '" style="cursor:pointer;' + (AI.fun === x.k ? 'border-color:var(--accent)' : '') + '">' +
        '<h4>' + esc(x.t) + (AI.fun === x.k ? ' <span class="cw-tag is-acc">当前</span>' : '') + '</h4>' +
        '<p>' + esc(x.d) + '</p></div>';
    }).join('');

    var saved = Object.keys(d.ai || {}).map(function (k) {
      var o = d.ai[k];
      return '<div class="cw-shot" style="align-items:flex-start">' +
        '<span class="cw-shot-t"><b style="font-size:12px">' + esc(o.label || k) + '</b>' +
          '<div style="color:var(--cw-ink3);font-size:10.5px;margin-top:2px">' + esc(o.at || '') + ' · ' + esc(String(o.result || '').slice(0, 60)) + '…</div></span>' +
        '<button class="cw-btn is-sm" data-cw-aiload="' + esc(k) + '">看</button>' +
        '<button class="cw-shot-x" data-cw-aidel="' + esc(k) + '">✕</button></div>';
    }).join('');

    return '<div class="cw-wrap">' +
      '<div class="cw-note">这个站点跑在 GitHub Pages 上，没有后端，也**没有**接任何 AI 接口。这里的四个按钮做的是：按模板把你的真实数据拼成一段可以直接粘给任意大模型的提示词，再把大模型的回答存回来。要真正一键调用，得单独配一个后端代理（见文末说明）。</div>' +
      '<div class="cw-ai-grid">' + cards + '</div>' +
      '<div class="cw-panel"><div class="cw-panel-h"><b>' + esc(cur.t) + '</b><span class="cw-panel-sub">第 1 步 选对象</span></div>' +
        '<div class="cw-panel-b">' +
          '<div class="cw-bar">' +
            (isTopic
              ? '<select class="cw-sel" style="max-width:340px" data-cw-aiobj="1">' + tOpts + '</select>'
              : '<select class="cw-sel" style="max-width:340px" data-cw-aiobj="1">' + objOpts + '</select>') +
            '<button class="cw-btn is-sm" data-cw-aigen="1">第 2 步 生成提示词</button>' +
            '<button class="cw-btn is-sm is-go" data-cw-aicopy="1">复制提示词</button>' +
            '<span class="cw-grow"></span>' +
            '<button class="cw-btn is-sm" data-cw-aisave="1">粘贴回答并保存</button>' +
          '</div>' +
          '<div style="margin-top:10px"><div class="cw-ai-out" id="cwAiOut">' + esc(prompt) + '</div></div>' +
        '</div></div>' +
      '<div class="cw-panel"><div class="cw-panel-h"><b>存下来的 AI 结果</b><span class="cw-panel-sub">' + Object.keys(d.ai || {}).length + ' 份</span></div>' +
        '<div class="cw-panel-b">' + (saved || '<div class="cw-note">还没有。生成提示词 → 粘到大模型 → 把回答粘回来保存。</div>') + '</div></div>' +
      '<div class="cw-panel"><div class="cw-panel-h"><b>要真正一键 AI，需要配什么</b></div><div class="cw-panel-b" style="font-size:12.5px;line-height:1.8;color:var(--cw-ink2)">' +
        'GitHub Pages 只能放静态文件，任何写进前端的 Key 都等于公开。可行做法只有一个：<b>自己在 Cloudflare Workers / Vercel / 任意服务器上放一个极小的代理</b>，' +
        '把 Key 存在服务端环境变量里，前端只 POST 到这个代理地址。' +
        '<br>代理做好后，在这个工作台的浏览器控制台里执行 <code>CWB4.setAIEndpoint(\'https://你的代理地址\')</code>，四个功能会自动改成「一键调用」。在那之前，请用「复制提示词」这条路，不假装它已经接通。' +
      '</div></div>' +
    '</div>';
  }

  var AI_ENDPOINT = '';
  function setAIEndpoint(u) {
    AI_ENDPOINT = String(u || '').trim();
    try { localStorage.setItem('wb.cw.ai.endpoint', AI_ENDPOINT); } catch (e) {}
    console.log('[cw] AI 代理地址：' + (AI_ENDPOINT || '未设置'));
  }
  try { AI_ENDPOINT = localStorage.getItem('wb.cw.ai.endpoint') || ''; } catch (e) {}

  function saveAI(label, promptText, result) {
    var d = C.D();
    var k = C.uid('ai-');
    d.ai[k] = { label: label, prompt: promptText, result: result, at: today() + ' ' + C.nowTime() };
    C.save(true);
    toast('存好了', 'ok');
    if (global.renderView) global.renderView(true);
  }

  /* ============================================================
     四、雷达：分类 / 收藏 / 忽略 / 转选题 + 创作线首页生产概览
     ============================================================ */
  function hotKey(p) {
    return String((p && (p.url || p.title)) || '').slice(-80);
  }
  function guessHotClass(p) {
    var t = (p.title || '') + ' ' + ((p.hooks || []).join(' '));
    if (/退货|裂|坏|投诉|吐槽|后悔|能不能|怎么样|好不好|值不值|问/.test(t)) return '用户需求';
    if (/销量|发布|开售|降价|崩|加价|市场|份额|财报|产能/.test(t)) return '行业热点';
    if (/参数|配置|实测|拆解|对比|跑分|续航|影像/.test(t)) return '产品信息';
    if (/同行|博主|账号|视频/.test(t)) return '竞品动态';
    return '行业热点';
  }
  function hotOp(p) {
    var ops = C.D().hotOps || {};
    return ops[hotKey(p)] || null;
  }

  function attachRadar() {
    var sec = document.getElementById('sec-radar');
    if (!sec) return;
    var bridge = global.CW_BRIDGE;
    var list = (bridge && bridge.radarList) ? bridge.radarList() : [];
    var rows = sec.querySelectorAll('.rdc-row');

    // 1) 每行注入操作条
    Array.prototype.forEach.call(rows, function (row, i) {
      if (row.querySelector('[data-cw-hotbar]')) return;
      var p = list[i];
      if (!p) return;
      var op = hotOp(p);
      var cls = (op && op.cls) || guessHotClass(p);
      var bar = document.createElement('div');
      bar.setAttribute('data-cw-hotbar', '1');
      bar.style.cssText = 'display:flex;align-items:center;gap:5px;padding:0 0 7px 34px;flex-wrap:wrap';
      bar.innerHTML =
        '<span class="cw-tag ' + (cls === '用户需求' ? 'is-acc' : cls === '产品信息' ? 'is-blue' : cls === '竞品动态' ? 'is-brown' : 'is-warn') + '">' + esc(cls) + '</span>' +
        '<button class="cw-btn is-sm ' + (op && op.op === 'star' ? 'is-go' : 'is-ghost') + '" data-cw-hot="star" data-cw-hi="' + i + '">' +
          (op && op.op === 'star' ? '已收藏' : '收藏') + '</button>' +
        '<button class="cw-btn is-sm is-ghost" data-cw-hot="skip" data-cw-hi="' + i + '">' + (op && op.op === 'skip' ? '已忽略' : '忽略') + '</button>' +
        '<button class="cw-btn is-sm is-ghost" data-cw-hot="cls" data-cw-hi="' + i + '">改分类</button>' +
        '<button class="cw-btn is-sm is-dark" data-cw-hot="topic" data-cw-hi="' + i + '">转选题池</button>';
      var wBtn = row.querySelector('[data-rdr-write]');
      if (wBtn) row.insertBefore(bar, wBtn.nextSibling);
      else row.appendChild(bar);
    });

    // 2) 顶部生产概览（创作线首页）
    if (sec.querySelector('[data-cw-overview]')) return;
    var d = C.D();
    var n = function (s) { return d.topics.filter(function (t) { return t.status === s; }).length; };
    var pend = d.topics.filter(function (t) { return ['待策划', '待写文案', '待拍摄', '待剪辑'].indexOf(t.status) >= 0; });
    var accStat = {};
    pend.forEach(function (t) {
      var a = t.account || '未分账号';
      accStat[a] = (accStat[a] || 0) + 1;
    });
    var accRows = Object.keys(accStat).map(function (a) {
      return '<div class="cw-mini-row"><span class="cw-mini-k">' + esc(a) + '</span><span class="cw-mini-v">' + accStat[a] + ' 条在排</span></div>';
    }).join('');
    var box = document.createElement('div');
    box.setAttribute('data-cw-overview', '1');
    box.className = 'cw-panel';
    box.style.marginBottom = '12px';
    box.innerHTML =
      '<div class="cw-panel-h"><b>今天卡在哪</b><span class="cw-panel-sub">数据来自选题池和视频档案</span></div>' +
      '<div class="cw-panel-b cw-ovgrid">' +
        '<div class="cw-tiles is-3">' +
          '<div class="cw-tile" data-cw-goto="topics"><div class="cw-tile-k">待策划</div><div class="cw-tile-v">' + n('待策划') + '</div></div>' +
          '<div class="cw-tile" data-cw-goto="topics"><div class="cw-tile-k">待写文案</div><div class="cw-tile-v">' + n('待写文案') + '</div></div>' +
          '<div class="cw-tile" data-cw-goto="topics"><div class="cw-tile-k">待拍摄</div><div class="cw-tile-v">' + n('待拍摄') + '</div></div>' +
          '<div class="cw-tile is-accent" data-cw-goto="topics"><div class="cw-tile-k">待剪辑</div><div class="cw-tile-v">' + n('待剪辑') + '</div></div>' +
          '<div class="cw-tile is-dark" data-cw-goto="videos"><div class="cw-tile-k">已建档案</div><div class="cw-tile-v">' + d.videos.length + '</div></div>' +
          '<div class="cw-tile" data-cw-goto="videos"><div class="cw-tile-k">成功案例</div><div class="cw-tile-v">' + d.videos.filter(function (v) { return v.mark === '成功案例'; }).length + '</div></div>' +
        '</div>' +
        '<div><div style="font-size:11.5px;color:var(--cw-ink3);margin-bottom:7px">各账号在排量</div>' +
          '<div class="cw-mini">' + (accRows || '<div class="cw-note">选题池还是空的</div>') + '</div>' +
          '<div class="cw-actions" style="margin-top:11px">' +
            '<button class="cw-btn is-sm" data-cw-export="1">导出全部备份</button>' +
            '<label class="cw-btn is-sm" style="cursor:pointer">恢复备份<input type="file" accept=".json" data-cw-import="1" style="display:none"></label>' +
          '</div>' +
          '<div style="font-size:10.5px;color:var(--cw-ink3);margin-top:6px;line-height:1.6">数据只在这台设备的浏览器里。换设备 / 换浏览器前先导出。</div>' +
        '</div>' +
      '</div>';
    var top = sec.querySelector('.rd-card');
    if (top && top.parentNode) top.parentNode.insertBefore(box, top);
    else sec.insertBefore(box, sec.firstChild);
  }

  function bindRadarOps() {
    var sec = document.getElementById('sec-radar');
    if (!sec || sec.__cwBound) return;
    sec.__cwBound = true;
    sec.addEventListener('click', function (e) {
      var goto = e.target.closest('[data-cw-goto]');
      if (goto) { if (global.switchTab) global.switchTab(goto.getAttribute('data-cw-goto')); return; }
      if (e.target.closest('[data-cw-export]')) { C.exportAll(); return; }

      var b = e.target.closest('[data-cw-hot]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var bridge = global.CW_BRIDGE;
      var list = (bridge && bridge.radarList) ? bridge.radarList() : [];
      var p = list[Number(b.getAttribute('data-cw-hi'))];
      if (!p) return;
      var d = C.D();
      if (!d.hotOps) d.hotOps = {};
      var k = hotKey(p);
      var cur = d.hotOps[k] || { op: '', cls: guessHotClass(p) };
      var act = b.getAttribute('data-cw-hot');

      if (act === 'star') { cur.op = cur.op === 'star' ? '' : 'star'; }
      else if (act === 'skip') { cur.op = cur.op === 'skip' ? '' : 'skip'; }
      else if (act === 'cls') {
        var idx = C.HCLS.indexOf(cur.cls || '行业热点');
        cur.cls = C.HCLS[(idx + 1) % C.HCLS.length];
        toast('分类改成「' + cur.cls + '」', 'ok');
      } else if (act === 'topic') {
        var exists = d.topics.filter(function (t) { return t.note && t.note.indexOf(k) >= 0; })[0];
        if (exists) { toast('这条已经在选题池里了', 'ok'); return; }
        d.topics.unshift({
          id: C.uid('t-'), title: p.title || '', account: '数码大号',
          ctType: '数码资讯', source: '今日雷达',
          core: '', userNeed: /退货|裂|吐槽|问/.test(p.title || '') ? '这条的评论区八成在问「到底能不能买」' : '',
          hook: '', plan: '来源：' + (p.source || '') + (p.kind ? '（' + p.kind + '）' : ''),
          refs: p.url ? [{ label: p.source || '原文', url: p.url }] : [],
          material: '', shootable: C.SHOOTABLE[1], priority: (p.score || 0) >= 8 ? 3 : 2,
          status: '待策划', note: '雷达转入 ' + k, tags: (p.hooks || []).slice(),
          createdAt: today(), updatedAt: today(), draftId: '', videoId: ''
        });
        cur.op = 'star';
        C.save(true);
        toast('已转进选题池', 'ok');
        if (global.renderView) global.renderView(true);
        return;
      }
      d.hotOps[k] = cur;
      C.save(true);
      if (global.renderView) global.renderView(true);
    });

    sec.addEventListener('change', function (e) {
      var f = e.target.closest('[data-cw-import]');
      if (!f || !f.files || !f.files[0]) return;
      C.importAll(f.files[0]);
      f.value = '';
    });
  }

  /* ============================================================
     五、页面挂载总入口（由 workbench.js 的 renderView 末尾调用）
     ============================================================ */
  function attach(tab) {
    if (tab === 'radar') { bindRadarOps(); attachRadar(); }
    if (tab === 'koubo') { bindKoubo(); }
    if (tab === 'report') {
      var sec = document.getElementById('sec-report');
      if (sec && !sec.querySelector('[data-cw-rep]')) {
        var box = document.createElement('div');
        box.setAttribute('data-cw-rep', '1');
        box.innerHTML = reportExtra();
        sec.appendChild(box);
      }
    }
    var nt = document.getElementById('navTopicCount');
    if (nt) nt.textContent = String(C.D().topics.length);
    var nv = document.getElementById('navVideoCount');
    if (nv) nv.textContent = String(C.D().videos.length);
  }

  global.CWB_REPORT_SET = function (k, v) {
    if (k === 'dim') RF.dim = v; else RF[k] = v;
    if (global.renderView) global.renderView(true);
  };

  global.CWB3 = { kouboPanel: kouboPanel, attach: attach, bindKoubo: bindKoubo, toVideo: toVideo, openDraftPanel: function (id) { try { global.KB.open = id; global.renderView && global.renderView(true); } catch (e) {} } };
  global.CWB4 = {
    renderAI: renderAI, AI: AI, AI_DEFS: AI_DEFS, saveAI: saveAI, setAIEndpoint: setAIEndpoint,
    presetAI: function (fun, id) { AI.fun = fun; AI.obj = id || ''; if (global.renderView) global.renderView(true); }
  };
  global.CWB_PAGE = { attach: attach };
})(window);
