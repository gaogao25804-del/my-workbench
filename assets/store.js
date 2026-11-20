/* ==========================================================
   数据分家（store.js）
   以前画布（index.html）和卡片库（cards.html）共用 wb.desk.v1，
   在卡片库里删一张，画布上那张也跟着没，反过来也一样。

   现在拆成两个互不相干的地方：
     wb.desk.v1    画布：只放链接窗 / 文件窗        { v:3, theme, wins:[], at }
     wb.cards.v1   卡片库：只放票根卡（kind=note）  { v:3, theme, wins:[], at }

   第一次打开时把老数据里混着的那批卡片搬到卡片库去，
   搬之前把整份老数据原样留一份在 wb.desk.bak.v1，出事能捞回来。
   只搬一次（wb.cards.migrated.v1 记个记号），之后两页各写各的。
   ========================================================== */
window.WBStore = (function () {
  'use strict';

  var DK = 'wb.desk.v1';        /* 画布 */
  var CK = 'wb.cards.v1';       /* 卡片库 */
  var BK = 'wb.desk.bak.v1';    /* 搬家前的原始底 */
  var DT = 'wb.desk.trash.v1';  /* 老回收站（两页共用） */
  var CT = 'wb.cards.trash.v1'; /* 卡片库自己的回收站 */
  var MKEY = 'wb.cards.migrated.v1';

  function rd(k) {
    try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; }
  }
  function wr(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }
  function isNote(w) { return !!(w && w.kind === 'note'); }

  function movedTrash() {
    var ot = rd(DT);
    if (!Array.isArray(ot) || !ot.length) return;
    var nt = rd(CT);
    if (!Array.isArray(nt)) nt = [];
    var ids = {};
    nt.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
    var add = 0;
    ot.forEach(function (x) {
      if (!x || !x.id || ids[x.id]) return;
      nt.push(x);
      ids[x.id] = 1;
      add++;
    });
    if (add) wr(CT, nt.slice(0, 60));
  }

  /* 搬一次；搬完再调就是空跑。返回搬了几张卡 */
  function migrate() {
    try { if (localStorage.getItem(MKEY) === '1') return 0; } catch (e) { return 0; }

    var moved = 0;
    var d = rd(DK);

    if (d && Array.isArray(d.wins)) {
      var notes = d.wins.filter(isNote);
      if (notes.length) {
        /* 先留底：整份老数据，只在第一次搬的时候写，不覆盖已有底 */
        try { if (!localStorage.getItem(BK)) wr(BK, d); } catch (e) {}

        var c = rd(CK);
        if (!c || !Array.isArray(c.wins)) {
          c = { v: 3, theme: (d.theme || 'light'), wins: [], at: (d.at || 0) };
        }
        var seen = {};
        c.wins.forEach(function (w) { if (w && w.id) seen[w.id] = 1; });

        var copy = 0;
        notes.forEach(function (n) {
          if (!n || !n.id || seen[n.id]) return;
          seen[n.id] = 1;
          c.wins.push(n);
          copy++;
        });

        /* 卡片库那份写不进去，就什么都别改，宁可不搬也不能丢 */
        if (copy && !wr(CK, c)) return 0;
        moved = copy;

        d.wins = d.wins.filter(function (w) { return !isNote(w); });
        d.v = 3;
        wr(DK, d);
      } else {
        d.v = 3;
      }
    }

    movedTrash();

    try { localStorage.setItem(MKEY, '1'); } catch (e) {}
    return moved;
  }

  return {
    DK: DK, CK: CK, BK: BK,
    read: rd, write: wr, isNote: isNote, migrate: migrate
  };
})();
