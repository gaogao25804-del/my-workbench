/* ==========================================================
   自由布局工作台 · 文件解析层
   DESKPARSE.docx / xlsx / pdf / txt
   依赖同目录 vendor：mammoth.browser.min.js、xlsx.full.min.js、pdf.min.js
   ========================================================== */
window.DESKPARSE = (function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fail(title, sub) {
    return '<div class="dk-state">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
      '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.2v.1"/></svg>' +
      '<b>' + esc(title) + '</b>' +
      (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</div>';
  }

  /* ---------------------------------------------------------
     DOCX —— mammoth 转 HTML，保留标题/段落/表格/图片/列表
     --------------------------------------------------------- */
  function docx(buf) {
    return new Promise(function (res, rej) {
      if (!window.mammoth) return rej(new Error('mammoth 没加载，检查 assets/vendor/mammoth.browser.min.js'));
      window.mammoth.convertToHtml({ arrayBuffer: buf }, {
        // 把 Word 的样式尽量映射到语义标签
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => p.dk-subtitle:fresh",
          "p[style-name='标题 1'] => h1:fresh",
          "p[style-name='标题 2'] => h2:fresh",
          "p[style-name='标题 3'] => h3:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
          "p[style-name='引用'] => blockquote:fresh"
        ]
      }).then(function (r) {
        var html = r.value || '';
        if (!html.trim()) return res(fail('文档是空的', '这个 docx 里没有可显示的正文'));
        res(html);
      }, function (e) {
        rej(new Error((e && e.message) || 'docx 解析失败'));
      });
    });
  }

  /* ---------------------------------------------------------
     XLSX / XLS —— SheetJS 读多表，自己建表以保留合并单元格
     --------------------------------------------------------- */
  var XR_MAX = 3000;   // 单个表最多渲染行
  var XC_MAX = 200;    // 最多渲染列

  function sheetHTML(ws) {
    if (!ws || !ws['!ref']) {
      return '<div class="dk-state"><b>空工作表</b><span class="sub">这个 sheet 没有内容</span></div>';
    }
    var rg, r0, r1, c0, c1;
    try { rg = XLSX.utils.decode_range(ws['!ref']); } catch (e) { return fail('表格读取失败'); }

    r0 = rg.s.r;
    c0 = rg.s.c;
    r1 = Math.min(rg.e.r, r0 + XR_MAX - 1);
    c1 = Math.min(rg.e.c, c0 + XC_MAX - 1);
    var cut = (rg.e.r > r1) || (rg.e.c > c1);

    // 合并单元格：记录左上角跨度，其余位置跳过
    var merges = ws['!merges'] || [];
    var skip = {}, span = {};
    merges.forEach(function (m) {
      if (m.e.r < r0 || m.e.c < c0 || m.s.r > r1 || m.s.c > c1) return;
      var rs = Math.min(m.e.r, r1) - m.s.r + 1;
      var cs = Math.min(m.e.c, c1) - m.s.c + 1;
      if (rs < 1 || cs < 1) return;
      span[m.s.r + '_' + m.s.c] = { rs: rs, cs: cs };
      for (var r = m.s.r; r < m.s.r + rs; r++) {
        for (var c = m.s.c; c < m.s.c + cs; c++) {
          if (r !== m.s.r || c !== m.s.c) skip[r + '_' + c] = 1;
        }
      }
    });

    var out = [];
    out.push('<table><thead><tr><th class="dk-rowno"></th>');
    for (var c = c0; c <= c1; c++) out.push('<th>' + XLSX.utils.encode_col(c) + '</th>');
    out.push('</tr></thead><tbody>');

    for (var r = r0; r <= r1; r++) {
      out.push('<tr><td class="dk-rowno">' + (r + 1) + '</td>');
      for (var cc = c0; cc <= c1; cc++) {
        var k = r + '_' + cc;
        if (skip[k]) continue;
        var sp = span[k];
        var attr = sp ? ((sp.rs > 1 ? ' rowspan="' + sp.rs + '"' : '') +
                         (sp.cs > 1 ? ' colspan="' + sp.cs + '"' : '')) : '';
        var cell = ws[XLSX.utils.encode_cell({ r: r, c: cc })];
        var txt = '';
        if (cell) {
          try { txt = XLSX.utils.format_cell(cell); } catch (e) { txt = cell.v == null ? '' : String(cell.v); }
        }
        if (txt === '') { out.push('<td' + attr + '></td>'); continue; }
        out.push('<td' + attr + '>' + esc(txt) + '</td>');
      }
      out.push('</tr>');
    }
    out.push('</tbody></table>');
    if (cut) {
      out.push('<div style="padding:12px 14px;color:#8a8a8e;font-size:11.5px;line-height:1.6">' +
        '表格较大，这里只显示前 ' + (r1 - r0 + 1) + ' 行 × ' + (c1 - c0 + 1) + ' 列。' +
        '完整内容请在 WPS 里看，或把表拆小后再放进来。</div>');
    }
    return out.join('');
  }

  function xlsx(buf) {
    return new Promise(function (res, rej) {
      if (!window.XLSX) return rej(new Error('SheetJS 没加载，检查 assets/vendor/xlsx.full.min.js'));
      var wb;
      try {
        wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true, cellNF: false, cellText: true });
      } catch (e) {
        return rej(new Error('表格解析失败：' + ((e && e.message) || e)));
      }
      if (!wb || !wb.SheetNames || !wb.SheetNames.length) return rej(new Error('这个表格里没有工作表'));
      var sheets = wb.SheetNames.map(function (nm) {
        return { name: nm, html: sheetHTML(wb.Sheets[nm]) };
      });
      res(sheets);
    });
  }

  /* ---------------------------------------------------------
     PDF —— pdf.js 逐页 canvas 渲染，只渲染进视口的页
     --------------------------------------------------------- */
  function mountPdf(buf, box) {
    if (!window.pdfjsLib) {
      box.innerHTML = fail('PDF 引擎没加载', '检查 assets/vendor/pdf.min.js 是否存在');
      return null;
    }
    var pdfjs = window.pdfjsLib;
    pdfjs.GlobalWorkerOptions.workerSrc = 'assets/vendor/pdf.worker.min.js';

    box.innerHTML = '<div class="dk-state"><div class="dk-spin"></div><span>正在打开 PDF…</span></div>';

    var state = { scale: 1.3, doc: null, pages: [], done: {}, busy: {}, io: null, host: null, wrap: box };

    function build(firstPage) {
      var vp0 = firstPage.getViewport({ scale: 1 });
      var avail = Math.max(200, box.clientWidth - 22);
      state.scale = Math.max(0.35, Math.min(2.4, avail / vp0.width));

      var n = state.doc.numPages;
      var html = ['<div class="dk-pdf">'];
      html.push('<div class="dk-pdf-bar">' +
        '<button data-pz="out" title="缩小">−</button>' +
        '<button data-pz="in" title="放大">+</button>' +
        '<button data-pz="fit" title="适应宽度">适应</button>' +
        '<span class="pg"></span></div>');
      for (var i = 1; i <= n; i++) {
        html.push('<div class="dk-pdf-pg" data-pg="' + i + '" style="width:' +
          Math.max(80, vp0.width * state.scale) + 'px;height:' +
          Math.max(80, vp0.height * state.scale) + 'px"></div>');
      }
      html.push('</div>');
      box.innerHTML = html.join('');

      state.host = box.querySelector('.dk-pdf');
      state.pages = Array.prototype.slice.call(box.querySelectorAll('.dk-pdf-pg'));
      state.done = {};
      state.busy = {};

      var bar = box.querySelector('.dk-pdf-bar');
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-pz]');
        if (!b) return;
        var act = b.dataset.pz;
        if (act === 'fit') {
          var avail2 = Math.max(200, box.clientWidth - 22);
          state.scale = Math.max(0.35, Math.min(2.4, avail2 / vp0.width));
        } else {
          state.scale = Math.max(0.35, Math.min(3.2, state.scale * (act === 'in' ? 1.2 : 1 / 1.2)));
        }
        rebuild();
      });

      if (state.io) state.io.disconnect();
      state.io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) drawPage(+en.target.dataset.pg, en.target);
        });
      }, { root: box, rootMargin: '420px 0px' });
      state.pages.forEach(function (p) { state.io.observe(p); });

      // 页码跟随滚动
      var tick = null;
      box.onscroll = function () {
        if (tick) return;
        tick = requestAnimationFrame(function () {
          tick = null;
          var top = box.scrollTop + 40, cur = 1;
          for (var i = 0; i < state.pages.length; i++) {
            if (state.pages[i].offsetTop <= top) cur = i + 1;
          }
          var el = box.querySelector('.dk-pdf-bar .pg');
          if (el) el.textContent = cur + ' / ' + n + ' 页';
        });
      };
      box.onscroll();

      drawPage(1, state.pages[0]);
      if (state.pages[1]) drawPage(2, state.pages[1]);
    }

    function drawPage(num, host) {
      if (!host || state.done[num] || state.busy[num]) return;
      state.busy[num] = 1;
      state.doc.getPage(num).then(function (pg) {
        var vp = pg.getViewport({ scale: state.scale });
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.floor(vp.width * dpr));
        cv.height = Math.max(1, Math.floor(vp.height * dpr));
        cv.style.width = Math.floor(vp.width) + 'px';
        cv.style.height = Math.floor(vp.height) + 'px';
        host.style.width = Math.floor(vp.width) + 'px';
        host.style.height = Math.floor(vp.height) + 'px';
        var ctx = cv.getContext('2d', { alpha: false });
        var task = pg.render({
          canvasContext: ctx,
          viewport: vp,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
        });
        return task.promise.then(function () {
          host.innerHTML = '';
          host.appendChild(cv);
          state.done[num] = 1;
          delete state.busy[num];
        });
      }).catch(function () {
        delete state.busy[num];
      });
    }

    function rebuild() {
      if (!state.doc) return;
      var keep = box.scrollTop;
      state.doc.getPage(1).then(function (p) { build(p); box.scrollTop = keep; });
    }

    pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise.then(function (doc) {
      state.doc = doc;
      return doc.getPage(1);
    }).then(function (p) {
      build(p);
    }).catch(function (e) {
      box.innerHTML = fail('PDF 打不开', (e && e.message) || '文件可能损坏或加了密码');
    });

    // 窗口变宽变窄时重排
    var lastW = box.clientWidth, rt = null;
    var ro = new ResizeObserver(function () {
      var w = box.clientWidth;
      if (Math.abs(w - lastW) < 24) return;
      lastW = w;
      clearTimeout(rt);
      rt = setTimeout(rebuild, 320);
    });
    ro.observe(box);

    return function () { try { ro.disconnect(); if (state.io) state.io.disconnect(); } catch (e) {} };
  }

  /* ---------------------------------------------------------
     TXT —— 自动识别 UTF-8 / GBK
     --------------------------------------------------------- */
  function decodeText(buf) {
    var u8 = new Uint8Array(buf);
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(u8);
    } catch (e) {
      try { return new TextDecoder('gbk').decode(u8); } catch (e2) {}
      try { return new TextDecoder('gb18030').decode(u8); } catch (e3) {}
      return new TextDecoder('utf-8').decode(u8);
    }
  }

  function txt(buf) {
    var MAX = 2 * 1024 * 1024;
    var cutMsg = '';
    var use = buf;
    if (buf.byteLength > MAX) {
      use = buf.slice(0, MAX);
      cutMsg = '\n\n—— 文件很大，这里只显示前 2MB，完整内容请用别的软件打开 ——';
    }
    var s = decodeText(use);
    return '<pre class="dk-txt">' + esc(s) + esc(cutMsg) + '</pre>';
  }

  return { docx: docx, xlsx: xlsx, pdf: mountPdf, txt: txt, esc: esc, fail: fail };
})();
