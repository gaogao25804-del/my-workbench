/* ==========================================================
   策划台 · 视图切换（清单 / 日历）
   只管一件事：同一份计划数据的两种看法怎么换。
   数据、同步、编辑全在 planner.js / sync.js 里，这里一行都没碰。

   视图偏好写在本机 wb.cal.v1（calendar.js 管那个 key），
   不调 WBSync、不进云端 —— 换个设备看到什么视图无所谓。
   ========================================================== */
(function () {
  'use strict';

  var listEl = document.getElementById('plListView');
  var calEl = document.getElementById('plCalView');
  if (!listEl || !calEl) return;

  var sws = Array.prototype.slice.call(document.querySelectorAll('.pv-sw'));
  var cur = '';

  function cal() { return window.WBCalendar || null; }
  function pl() { return window.WBPlanner || null; }
  function ymNow() { return pl() ? pl().getYm() : ''; }

  /* 只切显示，顺手把日历的状态同步过去 */
  function show(v) {
    cur = (v === 'cal') ? 'cal' : 'list';
    var isCal = (cur === 'cal');

    listEl.hidden = isCal;
    calEl.hidden = !isCal;

    sws.forEach(function (b) {
      var on = b.getAttribute('data-view') === cur;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    var c = cal();
    if (!c) return;
    c.setActive(isCal);
    if (isCal) c.refresh(ymNow());   /* 月份跟着策划台走，只有一个来源 */
  }

  function set(v, save) {
    var next = (v === 'cal') ? 'cal' : 'list';
    var same = (cur === next);
    show(next);
    if (save !== false) {
      var c = cal();
      if (c) c.setView(next);
    }
    if (!same) {
      try { window.scrollTo(0, 0); } catch (e) {}
    }
  }

  sws.forEach(function (b) {
    b.addEventListener('click', function () { set(b.getAttribute('data-view')); });
  });

  /* 顶栏「加一条」在日历视图里也能用：先切回清单，再让 planner 原来的
     「展开表单 + 滚过去」跑，否则它滚的是一个藏起来的元素。
     用捕获阶段，保证早于 planner.js 绑在按钮上的处理。 */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('#plAddTop')) {
      if (cur === 'cal') set('list');
    }
  }, true);

  /* 挂载日历。内嵌模式：不自己拉云端、不管主题、不写业务数据。 */
  var c0 = cal();
  if (c0) {
    c0.mount({
      embed: true,
      ym: ymNow(),
      onOpen: function (id) {          /* 点一条计划 → 回清单定位并进入原编辑流程 */
        set('list');
        if (pl()) pl().focus(id);
      },
      onAdd: function (due) {          /* 点「这天排一条」→ 展开原来的表单 */
        set('list');
        if (pl()) pl().add(due);
      },
      onYm: function (k) {             /* 日历里翻月 → 交给策划台翻，翻完它会回调 */
        if (pl()) pl().goto(k);
      }
    });
  }

  /* 清单那边数据变了，日历跟着重画（看不见就不画） */
  document.addEventListener('wb:plans', function () {
    var c = cal();
    if (c && cur === 'cal') c.refresh(ymNow());
  });

  /* 起：地址栏带 #cal 就进日历；否则用上次停的视图 */
  var h = (location.hash || '').replace('#', '');
  var start = (h === 'cal') ? 'cal' : (c0 ? c0.getView() : 'list');
  set(start, h === 'cal');
})();
