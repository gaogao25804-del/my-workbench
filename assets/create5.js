/* ============================================================
   创作线 · 新版四模块（融合进旧版「个人工作台」）
   账号拆解 / 热门选题 / 五秒开头 / SOP 库

   设计约束（2026-11-17 老板要求）：
   - 套用旧版 cw-* 组件与橙 + 深棕 + 纸白配色，不引入新皮肤
   - 数据独立存 wb.dcw.v1，旧版所有 key 一个不动、一条不删
   - 今日雷达 / 战报 / 工具箱完全不受影响
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'wb.dcw.v1';
  var KINDS = ['accounts', 'ideas', 'hooks', 'sops'];

  /* ---------------- 基础工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return Number(n || 0).toLocaleString('zh-CN'); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function uid() { return 'x' + Date.now() + Math.random().toString(36).slice(2, 6); }

  function toast(msg, type) {
    if (global.CWB && typeof global.CWB.toast === 'function') {
      try { global.CWB.toast(msg, type); return; } catch (e) {}
    }
    try { console.log('[cw5]', msg); } catch (e) {}
  }

  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object') d = {};
    KINDS.forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    return d;
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); }
    catch (e) { toast('保存失败：浏览器存储不可用或已满', 'err'); }
  }
  function pushRec(kind, obj) {
    var d = load();
    obj.id = obj.id || uid();
    obj.createdAt = obj.createdAt || today();
    d[kind].unshift(obj);
    save(d);
  }
  function delRec(kind, id) {
    var d = load();
    d[kind] = d[kind].filter(function (x) { return String(x.id) !== String(id); });
    save(d);
  }

  /* ---------------- 小部件 ---------------- */
  function field(label, inner) {
    return '<div class="cw-field"><label>' + esc(label) + '</label>' + inner + '</div>';
  }
  function inp(id, ph, attrs) {
    return '<input class="cw-in" id="' + id + '" placeholder="' + esc(ph || '') + '"' + (attrs || '') + '>';
  }
  function ta(id, ph) {
    return '<textarea class="cw-ta" id="' + id + '" placeholder="' + esc(ph || '') + '"></textarea>';
  }
  function sel(id, opts) {
    return '<select class="cw-sel" id="' + id + '">' + opts.map(function (o) {
      return '<option>' + esc(o) + '</option>';
    }).join('') + '</select>';
  }
  function tg(text, cls) {
    if (text === '' || text == null) return '';
    return '<span class="cw-tag ' + (cls || '') + '">' + esc(text) + '</span>';
  }
  function emptyHtml(big, small) {
    return '<div class="cw-empty"><b>' + esc(big) + '</b><span>' + esc(small) + '</span></div>';
  }
  function delBtn(kind, id) {
    return '<button class="cw-btn is-sm is-x" data-cw5="del" data-kind="' + kind + '" data-id="' + esc(id) + '">删除</button>';
  }
  function link(url) {
    if (!url) return '';
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener" style="font-size:11.5px;color:#b8460f;margin-top:7px;display:inline-block;word-break:break-all">查看原始来源 ↗</a>';
  }
  /* 卡片：标题 + 删除 / 标签行 / 正文 / 附加 */
  function card(title, delHtml, tagsHtml, body, extra) {
    return '<div class="cw-card" style="cursor:default">' +
        '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">' +
          '<div class="cw-card-t" style="flex:1 1 auto">' + esc(title || '未命名') + '</div>' +
          delHtml +
        '</div>' +
        (tagsHtml ? '<div class="cw-card-m" style="margin-top:6px;flex-wrap:wrap">' + tagsHtml + '</div>' : '') +
        (body ? '<div style="font-size:12px;color:var(--cw-ink2);margin-top:7px;line-height:1.7;white-space:pre-wrap">' + esc(body) + '</div>' : '') +
        (extra || '') +
      '</div>';
  }
  function panel(title, sub, inner, headExtra) {
    return '<div class="cw-panel">' +
        '<div class="cw-panel-h"><b>' + esc(title) + '</b>' +
          (headExtra || '') +
          (sub ? '<span class="cw-panel-sub">' + esc(sub) + '</span>' : '') +
        '</div>' +
        '<div class="cw-panel-b">' + inner + '</div>' +
      '</div>';
  }

  /* ---------------- 一、账号拆解 ---------------- */
  function renderAccount() {
    var list = load().accounts;
    var form = panel('新建拆解任务', '静态页读不到抖音私有数据，只生成指令',
      '<div class="cw-grid cw-g2">' +
        field('抖音账号 / 视频链接', inp('c5AccUrl', '粘贴主页或视频链接')) +
        field('你想研究什么', sel('c5AccGoal', ['账号定位与内容结构', '爆款选题规律', '单条视频拆解', '拍摄剪辑 SOP'])) +
      '</div>' +
      '<div style="margin-top:10px">' + field('补充素材或观察（可选）', ta('c5AccNotes', '高赞视频标题、截图里的数据、口播转写…')) + '</div>' +
      '<div class="cw-actions" style="margin-top:11px">' +
        '<button class="cw-btn is-go" data-cw5="acc-make">生成拆解指令</button>' +
        '<button class="cw-btn" data-cw5="acc-save">保存记录</button>' +
      '</div>' +
      '<div class="cw-note" style="margin-top:9px">没抓到的数据一律标「未知」，别让 AI 编播放量和粉丝数。</div>'
    );

    var body = list.length
      ? '<div class="cw-cards">' + list.map(function (x) {
          return card(x.url || x.goal, delBtn('accounts', x.id),
            tg(x.goal, 'is-acc') + tg(x.date, '') + (x.createdAt && x.createdAt !== x.date ? tg('建 ' + x.createdAt, '') : ''),
            x.notes, link(x.url));
        }).join('') + '</div>'
      : emptyHtml('还没有拆解记录', '上面填完点「保存记录」');
    return '<div class="cw-wrap">' + form + panel('拆解记录', list.length + ' 条', body) + '</div>';
  }

  function makeAccPrompt() {
    var url = (el('c5AccUrl') || {}).value || '';
    var goal = (el('c5AccGoal') || {}).value || '';
    var notes = (el('c5AccNotes') || {}).value || '';
    url = url.trim(); notes = notes.trim();
    if (!url) { toast('先把账号或视频链接填上', 'err'); return; }
    var p = '请拆解这个抖音账号/视频，研究目标：' + goal + '\n' +
      '链接：' + url + '\n' +
      '我提供的素材：' + (notes || '暂无') + '\n' +
      '要求：严格区分「可验证事实」「素材推断」「未知信息」；不要编造播放量、粉丝数、发布时间或互动数据。' +
      '输出账号定位、目标受众、选题类型、开头钩子、内容结构、镜头与剪辑方法、评论区需求、可迁移的选题模板，' +
      '以及适合我数码账号验证的 3 个具体方向。';
    copyText(p);
  }
  function saveAcc() {
    var url = ((el('c5AccUrl') || {}).value || '').trim();
    var goal = (el('c5AccGoal') || {}).value || '';
    var notes = ((el('c5AccNotes') || {}).value || '').trim();
    if (!url) { toast('先把链接填上再保存', 'err'); return; }
    pushRec('accounts', { url: url, goal: goal, notes: notes, date: today() });
    rerender();
    toast('拆解记录已保存', 'ok');
  }

  /* ---------------- 二、热门选题 ---------------- */
  function ideaCard(x) {
    return card(x.title, delBtn('ideas', x.id),
      tg(x.type, 'is-acc') + tg(x.product || '未分类', '') +
      tg(x.play ? '来源播放 ' + num(x.play) : '播放量未核实', x.play ? 'is-ok' : 'is-warn') +
      tg(x.date, ''),
      x.why, link(x.source));
  }
  function ideaListHtml(q) {
    var list = load().ideas;
    var qq = String(q || '').toLowerCase();
    var shown = qq ? list.filter(function (x) {
      return ((x.title || '') + (x.product || '') + (x.why || '')).toLowerCase().indexOf(qq) >= 0;
    }) : list;
    return {
      html: shown.length
        ? '<div class="cw-cards">' + shown.map(ideaCard).join('') + '</div>'
        : emptyHtml(qq ? '没有匹配的选题' : '还没有选题', qq ? '换个词，或者清空搜索框' : '把刷到的有效信号记在这里'),
      count: shown.length,
      total: list.length
    };
  }
  function renderTrends() {
    var r = ideaListHtml('');
    var form = panel('录入选题信号', '来源链接必填 · 播放量没可靠数字就留空',
      '<div class="cw-grid cw-g3">' +
        field('选题 / 热点标题', inp('c5IdeaTitle', '')) +
        field('产品 / 关键词', inp('c5IdeaProduct', '')) +
        field('信号类型', sel('c5IdeaType', ['新品发布', '用户痛点', '争议话题', '消费决策', '功能体验', '竞品爆款', '其他'])) +
      '</div>' +
      '<div class="cw-grid cw-g3" style="margin-top:10px">' +
        field('播放量（没可靠数字留空）', inp('c5IdeaPlay', '', ' type="number" min="0"')) +
        field('采集日期', inp('c5IdeaDate', '', ' type="date" value="' + today() + '"')) +
        field('来源链接（必填）', inp('c5IdeaSource', '原始视频 / 官方发布 / 可信报道')) +
      '</div>' +
      '<div style="margin-top:10px">' + field('为什么值得做 / 观察到的现象', ta('c5IdeaWhy', '例如：评论区一堆人问能不能不带壳、价格比上代涨了 500…')) + '</div>' +
      '<div class="cw-actions" style="margin-top:11px"><button class="cw-btn is-go" data-cw5="idea-save">保存选题</button></div>' +
      '<div class="cw-note" style="margin-top:9px">只填来源页面明确展示的数字，AI 可以分析机会，不可以伪造数据。</div>'
    );
    return '<div class="cw-wrap">' + form + panel('选题池', '', 
      '<div id="c5IdeaList">' + r.html + '</div>',
      '<span class="cw-grow"></span>' +
      '<input class="cw-in" id="c5IdeaSearch" placeholder="搜索标题 / 产品 / 关键词" style="max-width:220px;height:30px;padding:4px 9px;font-size:12px">' +
      '<span class="cw-panel-sub" id="c5IdeaCount">' + r.count + ' / ' + r.total + ' 条</span>'
    ) + '</div>';
  }
  function saveIdea() {
    var title = ((el('c5IdeaTitle') || {}).value || '').trim();
    var source = ((el('c5IdeaSource') || {}).value || '').trim();
    if (!title) { toast('标题得填', 'err'); return; }
    if (!source) { toast('来源链接必填，不能空着', 'err'); return; }
    pushRec('ideas', {
      title: title,
      product: ((el('c5IdeaProduct') || {}).value || '').trim(),
      type: (el('c5IdeaType') || {}).value || '其他',
      play: ((el('c5IdeaPlay') || {}).value || '').trim(),
      date: ((el('c5IdeaDate') || {}).value || today()),
      source: source,
      why: ((el('c5IdeaWhy') || {}).value || '').trim()
    });
    rerender();
    toast('选题已保存', 'ok');
  }

  /* ---------------- 三、五秒开头 ---------------- */
  function renderHooks() {
    var list = load().hooks;
    var form = panel('新增开头', '存经过验证或值得测的开场，不堆空洞金句',
      field('开头文案 / 画面描述', ta('c5HookText', '例如：先甩出结果，再反问一句「你猜这是多少钱的？」，然后镜头切到价格牌…')) +
      '<div class="cw-grid cw-g2" style="margin-top:10px">' +
        field('适用场景', inp('c5HookScene', '新品体验 / 配件对比 / 用户痛点')) +
        field('验证状态', sel('c5HookStatus', ['待测试', '已验证有效', '效果一般'])) +
      '</div>' +
      '<div style="margin-top:10px">' + field('关联视频 / 数据 / 备注', inp('c5HookNote', '哪条视频用过、播放多少、完播多少')) + '</div>' +
      '<div class="cw-actions" style="margin-top:11px"><button class="cw-btn is-go" data-cw5="hook-save">保存开头</button></div>'
    );
    var body = list.length
      ? '<div class="cw-cards">' + list.map(function (x) {
          return card(x.text, delBtn('hooks', x.id),
            tg(x.status, x.status === '已验证有效' ? 'is-ok' : (x.status === '效果一般' ? 'is-warn' : '')) +
            tg(x.scene, '') + tg(x.createdAt, ''),
            x.note);
        }).join('') + '</div>'
      : emptyHtml('还没有开头素材', '上面写完点「保存开头」');
    return '<div class="cw-wrap">' + form + panel('开头库', list.length + ' 条', body) + '</div>';
  }
  function saveHook() {
    var text = ((el('c5HookText') || {}).value || '').trim();
    if (!text) { toast('先写开头内容', 'err'); return; }
    pushRec('hooks', {
      text: text,
      scene: ((el('c5HookScene') || {}).value || '').trim(),
      status: (el('c5HookStatus') || {}).value || '待测试',
      note: ((el('c5HookNote') || {}).value || '').trim()
    });
    rerender();
    toast('开头已保存', 'ok');
  }

  /* ---------------- 四、SOP 库 ---------------- */
  function renderSop() {
    var list = load().sops;
    var form = panel('新增 SOP', '沉淀能重复执行的流程，写清适用条件和验证结果',
      field('名称', inp('c5SopTitle', '例如：新机首发当天快速选题流程')) +
      '<div class="cw-grid cw-g2" style="margin-top:10px">' +
        field('所属环节', sel('c5SopStage', ['选题研究', '脚本策划', '拍摄', '剪辑', '发布复盘'])) +
        field('验证状态', sel('c5SopStatus', ['待验证', '已验证', '需迭代'])) +
      '</div>' +
      '<div style="margin-top:10px">' + field('执行步骤', ta('c5SopSteps', '1. …\n2. …\n3. …')) + '</div>' +
      '<div style="margin-top:10px">' + field('适用条件 / 案例 / 数据', ta('c5SopEvidence', '什么情况下适用、用过哪条视频、结果如何')) + '</div>' +
      '<div class="cw-actions" style="margin-top:11px"><button class="cw-btn is-go" data-cw5="sop-save">保存 SOP</button></div>'
    );
    var body = list.length
      ? '<div class="cw-cards">' + list.map(function (x) {
          var txt = (x.steps || '') + (x.evidence ? '\n\n【适用/案例】' + x.evidence : '');
          return card(x.title, delBtn('sops', x.id),
            tg(x.stage, 'is-brown') +
            tg(x.status, x.status === '已验证' ? 'is-ok' : (x.status === '需迭代' ? 'is-warn' : '')) +
            tg(x.createdAt, ''),
            txt);
        }).join('') + '</div>'
      : emptyHtml('还没有 SOP', '上面写完点「保存 SOP」');
    return '<div class="cw-wrap">' + form + panel('流程库', list.length + ' 条', body) + '</div>';
  }
  function saveSop() {
    var title = ((el('c5SopTitle') || {}).value || '').trim();
    if (!title) { toast('先填 SOP 名称', 'err'); return; }
    pushRec('sops', {
      title: title,
      stage: (el('c5SopStage') || {}).value || '选题研究',
      status: (el('c5SopStatus') || {}).value || '待验证',
      steps: ((el('c5SopSteps') || {}).value || '').trim(),
      evidence: ((el('c5SopEvidence') || {}).value || '').trim()
    });
    rerender();
    toast('SOP 已保存', 'ok');
  }

  /* ---------------- 共用 ---------------- */
  function el(id) { return document.getElementById(id); }
  function rerender() { if (typeof global.renderView === 'function') global.renderView(true); }
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () {
        toast('拆解指令已复制，粘给 AI 就行', 'ok');
      }).catch(function () { prompt('手动复制以下内容', t); });
    } else {
      prompt('手动复制以下内容', t);
    }
  }

  /* ---------------- 事件绑定（一次，全站委托） ---------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-cw5]') : null;
    if (!b) return;
    var act = b.getAttribute('data-cw5');
    if (act === 'acc-make') { makeAccPrompt(); return; }
    if (act === 'acc-save') { saveAcc(); return; }
    if (act === 'idea-save') { saveIdea(); return; }
    if (act === 'hook-save') { saveHook(); return; }
    if (act === 'sop-save') { saveSop(); return; }
    if (act === 'del') {
      delRec(b.getAttribute('data-kind'), b.getAttribute('data-id'));
      rerender();
      toast('已删除', 'ok');
      return;
    }
  });

  document.addEventListener('input', function (e) {
    if (!e.target || e.target.id !== 'c5IdeaSearch') return;
    var box = document.getElementById('c5IdeaList');
    var r = ideaListHtml(e.target.value);
    if (box) box.innerHTML = r.html;
    var cnt = document.getElementById('c5IdeaCount');
    if (cnt) cnt.textContent = r.count + ' / ' + r.total + ' 条';
  });

  global.CWB5 = {
    renderAccount: renderAccount,
    renderTrends: renderTrends,
    renderHooks: renderHooks,
    renderSop: renderSop,
    load: load
  };
})(window);
