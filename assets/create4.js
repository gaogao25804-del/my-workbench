/* ============================================================
   创作线升级 · 全局事件委托 + 启动
   ============================================================ */
(function (global) {
  'use strict';
  var C = global.CWB, C2 = global.CWB2, C3 = global.CWB3, C4 = global.CWB4;
  if (!C) { console.error('[cw] create.js 没加载'); return; }
  var esc = C.esc, num = C.num, toast = C.toast;

  function inSec(el, id) {
    var s = el && el.closest ? el.closest('#' + id) : null;
    return !!s;
  }

  /* ---------------- 选题池 ---------------- */
  function bindTopics() {
    document.addEventListener('click', function (e) {
      if (!inSec(e.target, 'sec-topics')) return;
      var t = e.target;

      var seg = t.closest('[data-cw-tview] button');
      if (seg) { C.TF.view = seg.getAttribute('data-v'); global.renderView(true); return; }

      var tile = t.closest('[data-cw-tstat]');
      if (tile) {
        var k = tile.getAttribute('data-cw-tstat');
        C.TF.status = C.TF.status === k ? '' : k;
        global.renderView(true);
        return;
      }
      if (t.closest('[data-cw-tnew]')) { C.openTopic(''); return; }
      if (t.closest('[data-cw-treset]')) {
        Object.keys(C.TF).forEach(function (k2) { C.TF[k2] = k2 === 'view' ? 'board' : ''; });
        global.renderView(true);
        return;
      }
      var card = t.closest('[data-cw-topic]');
      if (card) { C.openTopic(card.getAttribute('data-cw-topic')); return; }
    });

    document.addEventListener('change', function (e) {
      if (!inSec(e.target, 'sec-topics')) return;
      var f = e.target.closest('[data-cw-tf]');
      if (f) { C.TF[f.getAttribute('data-cw-tf')] = f.value; global.renderView(true); return; }
      var fd = e.target.closest('[data-cw-tfrom]');
      if (fd) { C.TF.from = fd.value; global.renderView(true); return; }
      var ft = e.target.closest('[data-cw-tto]');
      if (ft) { C.TF.to = ft.value; global.renderView(true); }
    });

    var tmr = null;
    document.addEventListener('input', function (e) {
      if (!inSec(e.target, 'sec-topics')) return;
      var q = e.target.closest('[data-cw-tq]');
      if (!q) return;
      clearTimeout(tmr);
      tmr = setTimeout(function () {
        C.TF.q = q.value;
        var keep = document.activeElement === q;
        global.renderView(true);
        if (keep) {
          var again = document.querySelector('[data-cw-tq]');
          if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
        }
      }, 260);
    });

    // 拖拽改状态
    var dragId = '';
    document.addEventListener('dragstart', function (e) {
      var card = e.target.closest && e.target.closest('[data-cw-topic][draggable]');
      if (!card) return;
      dragId = card.getAttribute('data-cw-topic');
      card.classList.add('drag');
      try { e.dataTransfer.setData('text/plain', dragId); } catch (x) {}
      e.dataTransfer.effectAllowed = 'move';
    });
    document.addEventListener('dragend', function (e) {
      var card = e.target.closest && e.target.closest('[data-cw-topic][draggable]');
      if (card) card.classList.remove('drag');
      document.querySelectorAll('.cw-col.drop').forEach(function (c) { c.classList.remove('drop'); });
    });
    document.addEventListener('dragover', function (e) {
      var col = e.target.closest && e.target.closest('[data-cw-drop]');
      if (!col || !dragId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.cw-col.drop').forEach(function (c) { if (c !== col) c.classList.remove('drop'); });
      col.classList.add('drop');
    });
    document.addEventListener('drop', function (e) {
      var col = e.target.closest && e.target.closest('[data-cw-drop]');
      if (!col) return;
      e.preventDefault();
      var status = col.getAttribute('data-cw-drop');
      var id = dragId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
      if (!id) return;
      var t = C.topicById(id);
      if (!t) return;
      if (t.status === status) return;
      t.status = status;
      t.updatedAt = C.today();
      C.save(true);
      toast('挪到「' + status + '」了', 'ok');
      dragId = '';
      global.renderView(true);
    });
  }

  /* ---------------- 视频档案 ---------------- */
  function bindVideos() {
    document.addEventListener('click', function (e) {
      if (!inSec(e.target, 'sec-videos')) return;
      var t = e.target;
      if (t.closest('[data-cw-vnew]')) { C2.openVideo(''); return; }
      if (t.closest('[data-cw-vstar]')) { C2.VF.star = !C2.VF.star; C2.VF.page = 1; global.renderView(true); return; }
      var th = t.closest('[data-cw-vsort]');
      if (th) {
        var k = th.getAttribute('data-cw-vsort');
        if (C2.VF.sort === k) C2.VF.dir *= -1; else { C2.VF.sort = k; C2.VF.dir = -1; }
        global.renderView(true);
        return;
      }
      var pg = t.closest('[data-cw-vpage]');
      if (pg) { C2.VF.page += Number(pg.getAttribute('data-cw-vpage')); global.renderView(true); return; }
      var mk = t.closest('[data-cw-vmark]');
      if (mk) {
        var m = mk.getAttribute('data-cw-vmark');
        C2.VF.mark = C2.VF.mark === m ? '' : m;
        C2.VF.page = 1;
        global.renderView(true);
        return;
      }
      var row = t.closest('[data-cw-video]');
      if (row) { C2.openVideo(row.getAttribute('data-cw-video')); return; }
    });

    document.addEventListener('change', function (e) {
      if (!inSec(e.target, 'sec-videos')) return;
      var f = e.target.closest('[data-cw-vf]');
      if (f) { C2.VF[f.getAttribute('data-cw-vf')] = f.value; C2.VF.page = 1; global.renderView(true); }
    });

    var tmr = null;
    document.addEventListener('input', function (e) {
      if (!inSec(e.target, 'sec-videos')) return;
      var q = e.target.closest('[data-cw-vq]');
      if (!q) return;
      clearTimeout(tmr);
      tmr = setTimeout(function () {
        C2.VF.q = q.value;
        C2.VF.page = 1;
        global.renderView(true);
        var again = document.querySelector('[data-cw-vq]');
        if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
      }, 260);
    });
  }

  /* ---------------- 战报扩展区 ---------------- */
  function bindReport() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.closest('[data-cw-rep]') && !inSec(t, 'sec-report')) return;
      var seg = t.closest('[data-cw-rdim] button');
      if (seg) {
        if (global.CWB_REPORT_SET) global.CWB_REPORT_SET('dim', seg.getAttribute('data-v'));
        return;
      }
      var row = t.closest('[data-cw-video]');
      if (row) { C2.openVideo(row.getAttribute('data-cw-video')); }
    });
    document.addEventListener('change', function (e) {
      var f = e.target.closest('[data-cw-rf]');
      if (f && global.CWB_REPORT_SET) global.CWB_REPORT_SET(f.getAttribute('data-cw-rf'), f.value);
    });
  }

  /* ---------------- AI 中心 ---------------- */
  function bindAI() {
    document.addEventListener('click', function (e) {
      if (!inSec(e.target, 'sec-ai')) return;
      var t = e.target;
      var fun = t.closest('[data-cw-aifun]');
      if (fun) { C4.AI.fun = fun.getAttribute('data-cw-aifun'); C4.AI.obj = ''; global.renderView(true); return; }
      if (t.closest('[data-cw-aigen]')) {
        var cur = C4.AI_DEFS.filter(function (x) { return x.k === C4.AI.fun; })[0] || C4.AI_DEFS[0];
        var isT = cur.k === 'plan';
        var target = isT ? C.topicById(C4.AI.obj) : C.videoById(C4.AI.obj);
        var out = document.getElementById('cwAiOut');
        if (out) out.textContent = cur.run(target);
        toast('提示词已生成，可以复制了', 'ok');
        return;
      }
      if (t.closest('[data-cw-aicopy]')) {
        var o2 = document.getElementById('cwAiOut');
        if (o2) C.copy(o2.textContent);
        return;
      }
      if (t.closest('[data-cw-aisave]')) {
        var o3 = document.getElementById('cwAiOut');
        var res = prompt('把大模型的回答整段粘进来（太长的建议直接存到笔记里，这儿只存结论）：');
        if (!res) return;
        var cur2 = C4.AI_DEFS.filter(function (x) { return x.k === C4.AI.fun; })[0] || C4.AI_DEFS[0];
        var tg = cur2.k === 'plan' ? C.topicById(C4.AI.obj) : C.videoById(C4.AI.obj);
        var label = cur2.t + ' · ' + (tg ? (tg.title || tg.name || '').slice(0, 20) : '未选对象');
        C4.saveAI(label, o3 ? o3.textContent : '', res);
        return;
      }
      var ld = t.closest('[data-cw-aiload]');
      if (ld) {
        var k = ld.getAttribute('data-cw-aiload');
        var o4 = C.D().ai[k];
        if (!o4) return;
        C.openSide({
          kicker: 'AI 结果 · ' + (o4.at || ''),
          title: esc(o4.label || ''),
          body: '<div class="cw-sec"><div class="cw-sec-h">提示词</div><div class="cw-ai-out">' + esc(String(o4.prompt || '').slice(0, 4000)) + '</div></div>' +
                '<div class="cw-sec"><div class="cw-sec-h">回答</div><div class="cw-ai-out" style="max-height:none">' + esc(o4.result || '') + '</div></div>',
          foot: '<button class="cw-btn is-ghost" data-cw-aicopy2="' + esc(k) + '">复制回答</button><span class="cw-grow"></span><button class="cw-btn" data-cw-close="1">关了</button>'
        });
        return;
      }
      var dl = t.closest('[data-cw-aidel]');
      if (dl) {
        var k2 = dl.getAttribute('data-cw-aidel');
        if (!confirm('删掉这份 AI 结果？')) return;
        delete C.D().ai[k2];
        C.save(true);
        global.renderView(true);
      }
    });

    document.addEventListener('click', function (e) {
      var c2 = e.target.closest('[data-cw-aicopy2]');
      if (!c2) return;
      var o = C.D().ai[c2.getAttribute('data-cw-aicopy2')];
      if (o) C.copy(o.result || '');
    });

    document.addEventListener('change', function (e) {
      if (!inSec(e.target, 'sec-ai')) return;
      var s = e.target.closest('[data-cw-aiobj]');
      if (s) { C4.AI.obj = s.value; global.renderView(true); }
    });
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    C.migrate().then(function () {
      console.log('[cw] 迁移完成', {
        topics: C.D().topics.length,
        videos: C.D().videos.length,
        attach: Object.keys(C.D().attach || {}).length
      });
      // 侧栏计数刷新
      var nt = document.getElementById('navTopicCount');
      if (nt) nt.textContent = String(C.D().topics.length);
      if (global.renderView) global.renderView(true);
    }).catch(function (e) { console.warn('[cw] 迁移异常', e); });

    bindTopics();
    bindVideos();
    bindReport();
    bindAI();

  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
