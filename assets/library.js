/* ============================================================
   独立图书馆 · 应用逻辑
   数据源：library-data.json（与工作台共用同一份快照）
   ============================================================ */
'use strict';

const PER = 6;
const S = { books: [], q: '', page: 1, focus: 0, loading: true, err: '' };

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function pad2(n) { return String(n).padStart(2, '0'); }

function matches(b, q) {
  if (!q) return true;
  const hay = (b.title || '') + ' ' + (b.author || '') + ' ' + (b.outline || '') + ' ' +
    (b.think || '') + ' ' + (b.summary || '') + ' ' +
    (b.chapters || []).map(function (c) { return c.k + ' ' + c.p; }).join(' ');
  return hay.toLowerCase().indexOf(q) >= 0;
}

function coverHtml(b) {
  const id = b.id || b.title;
  const title = b.title || '未命名';
  const author = b.author || '未知作者';
  const hasCover = b.cover && b.hasCover !== false;
  const face = hasCover
    ? '<img src="' + esc(b.cover) + '" alt="' + esc(title) + '" loading="lazy">'
    : '<span class="lib-cover-fallback"><b>' + esc(title) + '</b><i>' + esc(author) + '</i></span>';
  return '<button class="lib-cover" data-book="' + esc(id) + '" aria-label="' + esc(title) + '">' +
    '<span class="lib-cover-img">' + face + '</span>' +
    '<span class="lib-cover-title">' + esc(title) + '</span>' +
    '<span class="lib-cover-author">' + esc(author) + '</span>' +
    '</button>';
}

function stateBlock(kind, title, desc, act) {
  return '<div class="lib-empty"><div class="state ' + kind + '">' +
    '<strong>' + esc(title) + '</strong>' +
    (desc ? '<div>' + esc(desc) + '</div>' : '') +
    (act ? '<button class="btn btn-sm" data-act="' + act + '">' +
      (act === 'clear' ? '清空搜索' : '重试') + '</button>' : '') +
    '</div></div>';
}

function render() {
  const body = document.getElementById('libBody');
  if (!body) return;

  if (S.loading) {
    body.innerHTML = '<div class="lib-room"><div class="lib-empty"><div class="state loading">' +
      '<strong>正在读取图书数据</strong></div></div></div>';
    return;
  }
  if (S.err) {
    body.innerHTML = '<div class="lib-room">' + stateBlock('error', '图书数据加载失败', S.err, 'retry') + '</div>';
    return;
  }
  if (!S.books.length) {
    body.innerHTML = '<div class="lib-room">' + stateBlock('empty', '图书库还是空的', '同步飞书多维表格后会自动出现在这里') + '</div>';
    return;
  }

  const q = S.q.toLowerCase().trim();
  const list = S.books.filter(function (b) { return matches(b, q); });
  const meta = document.getElementById('libMeta');
  if (meta) meta.innerHTML = '<b>' + S.books.length + '</b> 本藏书';

  if (!list.length) {
    body.innerHTML = '<div class="lib-room">' + stateBlock('empty', '没有找到匹配的图书', '换个关键词试试', 'clear') + '</div>';
    return;
  }

  const totalPages = Math.max(1, Math.ceil(list.length / PER));
  if (S.page > totalPages) S.page = 1;
  const pageList = list.slice((S.page - 1) * PER, S.page * PER);
  const focusIdx = ((S.focus % list.length) + list.length) % list.length;
  const fb = list[focusIdx];

  const hero = '<div class="lib-hero">' +
      '<h2 class="lib-head">把这本书读下去。</h2>' +
      '<p class="lib-desc">封面、书摘、读书时写下的那点想法，<br>全在这一页里，翻一翻就能接着读。</p>' +
      '<button class="lib-cta" data-act="random">随机抽一本 <i>↗</i></button>' +
    '</div>';

  const focusPanel = '<aside class="lib-focus">' +
      '<div class="lib-focus-head">' +
        '<span class="lib-ava">' + esc(String(fb.author || '书').slice(0, 1)) + '</span>' +
        '<span class="lib-focus-id"><b>' + esc(fb.author || '未知作者') + '</b><i>' + esc(fb.title || '未命名') + '</i></span>' +
        '<span class="lib-focus-nav">' +
          '<button data-focus="-1" aria-label="上一条书摘">‹</button>' +
          '<button data-focus="1" aria-label="下一条书摘">›</button>' +
        '</span>' +
      '</div>' +
      '<blockquote class="lib-quote">' + esc(fb.think || fb.outline || '这本书还没有写下书摘。') + '</blockquote>' +
    '</aside>';

  const rail = '<div class="lib-rail">' + pageList.map(coverHtml).join('') + '</div>';

  const foot = '<div class="lib-foot">' +
      '<span class="lib-tip">点一张封面 · 看这本书的书摘与思考</span>' +
      '<span class="lib-pager">' +
        '<button class="lib-arrow" data-page="' + (S.page - 1) + '"' + (S.page <= 1 ? ' disabled' : '') + ' aria-label="上一页">‹</button>' +
        '<span class="lib-count"><b>' + pad2(S.page) + '</b> / ' + pad2(totalPages) + '</span>' +
        '<button class="lib-arrow" data-page="' + (S.page + 1) + '"' + (S.page >= totalPages ? ' disabled' : '') + ' aria-label="下一页">›</button>' +
      '</span>' +
    '</div>';

  body.innerHTML = '<div class="lib-room">' +
    '<div class="lib-main">' + hero + focusPanel + '</div>' + rail + foot + '</div>';
}

function openBook(id) {
  const b = S.books.filter(function (x) { return String(x.id || x.title) === String(id); })[0];
  if (!b) return;
  const chapters = b.chapters || [];
  document.getElementById('modalTitle').textContent = b.title || '未命名';
  document.getElementById('modalMeta').innerHTML = [b.author, b.date].filter(Boolean)
    .map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('');
  document.getElementById('modalBody').innerHTML =
    (b.oneLine ? '<div class="book-one">' + esc(b.oneLine) + '</div>' : '') +
    '<div class="doc-sec"><div class="doc-kicker">内容大纲 / Synopsis</div>' +
      '<div style="white-space:pre-wrap;">' + esc(b.summary || b.outline || '（暂无大纲）') + '</div></div>' +
    (chapters.length ? '<div class="doc-sec"><div class="doc-kicker">章节脉络 / Chapters</div>' +
      '<ol class="bk-chapters">' + chapters.map(function (c, i) {
        return '<li><span class="bk-no">' + pad2(i + 1) + '</span>' +
          '<span class="bk-body"><span class="bk-k">' + esc(c.k) + '</span>' +
          '<span class="bk-p">' + esc(c.p) + '</span></span></li>';
      }).join('') + '</ol></div>' : '') +
    '<div class="doc-sec"><div class="doc-kicker">我的思考 / Notes</div>' +
      '<div style="white-space:pre-wrap;">' + esc(b.think || '（暂无个人思考）') + '</div></div>';
  document.getElementById('modal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').hidden = true;
  document.body.style.overflow = '';
}

function bind() {
  const search = document.getElementById('libSearch');
  search.addEventListener('input', function () {
    S.q = search.value;
    S.page = 1;
    S.focus = 0;
    render();
  });

  document.addEventListener('click', function (e) {
    const cover = e.target.closest('[data-book]');
    if (cover) { openBook(cover.dataset.book); return; }

    const focusBtn = e.target.closest('[data-focus]');
    if (focusBtn) { S.focus += Number(focusBtn.dataset.focus); render(); return; }

    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn) {
      if (pageBtn.disabled) return;
      S.page = Number(pageBtn.dataset.page) || 1;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const act = e.target.closest('[data-act]');
    if (act) {
      if (act.dataset.act === 'random') { S.focus = Math.floor(Math.random() * 997); render(); }
      else if (act.dataset.act === 'clear') { S.q = ''; S.page = 1; search.value = ''; render(); }
      else if (act.dataset.act === 'retry') { boot(); }
      return;
    }

    if (e.target.closest('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
}

async function boot() {
  S.loading = true; S.err = '';
  render();
  try {
    const r = await fetch('library-data.json?t=' + Date.now());
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    S.books = (d && d.books) || [];
  } catch (e) {
    S.err = e.message || '加载失败';
  }
  S.loading = false;
  render();
}

bind();
boot();
