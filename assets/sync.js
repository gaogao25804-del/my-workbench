/* ==========================================================
   跨设备同步 v4（安全版）

   教训：v3 是"拿本地全量盖云端"，任何一次错误的本地状态都能
   把云端有效数据整份抹掉。2026-11-23 11 条计划被归零 4 次。
   v4 改成三方合并，铁律：

   1. 本地没有这份数据（从没打开过那个模块）≠ 本地这份是空的
   2. 三份都空、或本地空且没有任何删除记录 → 云端有就以云端为准，
      空数据永远不能作为覆盖源
   3. 删除必须留墓碑（tombs），墓碑跟着数据一起同步，
      这样"另一台设备的旧记录"不会把删掉的东西复活
   4. 三方内容比对优先判"谁改了"，时间戳只在两边都改且内容不同时兜底
   5. 推之前必须成功读到云端（含 SHA），发到 GitHub 带 sha，
      云端变了返回 409/422 → 重新合并重试，绝不硬覆盖
   6. 同一页面所有 pull/push 走同一条串行队列，不许并发

   云端格式向后兼容：还是平铺的 {v,at,wat,wins,nat,notes,pat,plans}，
   只增量加了 rev / tombs 两个字段，旧页面读到不会炸。
   ========================================================== */
(function () {
  var OWNER = 'gaogao25804-del';
  var REPO = 'my-workbench';
  var PATH = 'desk-data.json';
  var BRANCH = 'main';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + PATH;
  var RAW = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/' + PATH;
  var TKEY = 'wb.sync.token.v1';
  var TSTAMP = 'wb.sync.at.v1';      /* 上次成功的云端时间戳 */
  var SKEY = 'wb.sync.state.v1';     /* v4 同步元数据：base 快照 / 墓碑 / rev */

  var DK = 'wb.desk.v1';             /* 画布：链接窗 / 文件窗 */
  var CK = 'wb.cards.v1';            /* 卡片库：票根卡 */
  var PK = 'wb.planner.v1';          /* 内容策划：按月计划 */

  /* 仓库根目录（形如 /my-workbench/） */
  var BASE = (function () {
    try {
      var m = location.pathname.match(/^(.*?\/my-workbench\/)/i);
      return m ? m[1] : location.pathname.replace(/[^/]*$/, '');
    } catch (e) { return '/'; }
  })();

  var SELF = (function () {
    try {
      return location.origin + BASE + PATH;
    } catch (e) { return ''; }
  })();

  /* ================= 纯逻辑：合并引擎 =================
     这一段不碰 DOM、不碰网络、不碰 localStorage，
     可以整段抠出来在 node 里跑测试（tools/test_sync.js 就是这么干的）。
     ==================================================== */
  /* @core-begin */
  var Core = (function () {

    var TOMB_KEEP = 3650 * 864e5;    /* 墓碑留 10 年：30 天太短，base 为空的老设备会把删过的数据复活 */

    function isArr(a) { return Object.prototype.toString.call(a) === '[object Array]'; }
    function isObj(o) { return o && typeof o === 'object'; }
    function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
    function keys(o) { var r = [], k; for (k in (o || {})) r.push(k); return r; }
    function map(o) { var r = {}, k; for (k in (o || {})) r[k] = o[k]; return r; }

    function idOf(x) {
      if (!isObj(x)) return '';
      if (x.id !== undefined && x.id !== null) return String(x.id);
      if (x.fileId !== undefined && x.fileId !== null) return String(x.fileId);
      return '';
    }
    function utOf(x) { return num(x && x.ut) || num(x && x.ct) || 0; }

    /* 内容签名：比"改没改"用的，忽略 ut 本身 */
    function sig(x) {
      if (!isObj(x)) return String(x);
      var ks = keys(x).filter(function (k) { return k !== 'ut'; }).sort();
      var o = {};
      for (var i = 0; i < ks.length; i++) o[ks[i]] = x[ks[i]];
      return JSON.stringify(o);
    }
    function same(a, b) {
      if (!a || !b) return a === b;
      return sig(a) === sig(b);
    }

    function index(list) {
      var m = {}, a = isArr(list) ? list : [];
      for (var i = 0; i < a.length; i++) {
        var id = idOf(a[i]);
        if (id) m[id] = a[i];
      }
      return m;
    }

    function pruneTombs(t, now) {
      var out = {}, k, ts;
      for (k in (t || {})) {
        ts = num(t[k]);
        if (ts && now - ts < TOMB_KEEP) out[k] = ts;
      }
      return out;
    }
    function mergeTombs(a, b, now) {
      var out = pruneTombs(a, now), k, ts;
      for (k in (b || {})) {
        ts = num(b[k]);
        if (ts > num(out[k])) out[k] = ts;
      }
      return pruneTombs(out, now);
    }

    /**
     * 三方合并一格。
     * o = { base, local, remote, baseTombs, localTombs, remoteTombs,
     *       now, readOnly, absentLocal, absentRemote }
     * 返回 { items, tombs, st, emptyLocal }
     */
    function mergeSection(o) {
      var now = o.now || Date.now();
      var baseI = index(o.base);
      var locI = index(o.local);
      var remI = index(o.remote);

      var localN = keys(locI).length;
      var remoteN = keys(remI).length;
      var localT = pruneTombs(o.localTombs, now);
      var tombs = mergeTombs(o.baseTombs, localT, now);
      tombs = mergeTombs(tombs, o.remoteTombs, now);

      var st = { added: 0, updated: 0, deleted: 0, fought: 0, restored: 0 };
      var out = [];
      var k, b, l, r, lt, lastLive;

      /* 只读模式（没令牌时的拉取）：只补本地缺的，绝不删、绝不改。
         CDN 可能给旧版本，拿旧版本去删本地是最危险的。 */
      if (o.readOnly) {
        for (k in locI) out.push(locI[k]);
        for (k in remI) if (!locI[k]) { out.push(remI[k]); st.added++; }
        return { items: out, tombs: tombs, st: st, emptyLocal: false };
      }

      /* 本地这份是空的、而且没有任何删除记录，云端却有东西
         → 这不是"用户清空了"，是"这台设备还没同步过"。绝不按删除处理。 */
      var emptyLocal = (localN === 0) && (keys(localT).length === 0) && remoteN > 0;

      var ids = {};
      for (k in baseI) ids[k] = 1;
      for (k in locI) ids[k] = 1;
      for (k in remI) ids[k] = 1;

      for (k in ids) {
        b = baseI[k]; l = locI[k]; r = remI[k];
        lt = num(tombs[k]);

        /* 1) 墓碑：删除发生在两边最后一次修改之后 → 真的删了 */
        if (lt) {
          lastLive = Math.max(l ? utOf(l) : 0, r ? utOf(r) : 0, b ? utOf(b) : 0);
          if (lt >= lastLive) { st.deleted++; continue; }
        }

        /* 2) 只有本地有 */
        if (l && !r) {
          if (!b) { out.push(l); st.added++; }             /* 本地新增 */
          else if (same(l, b)) { st.deleted++; tombs[k] = now; }  /* 本地没动过 → 云端删了，跟删 */
          else { out.push(l); st.updated++; }              /* 本地改过 → 保留 */
          continue;
        }

        /* 3) 只有云端有 */
        if (!l && r) {
          if (!b) { out.push(r); st.added++; }             /* 云端新增 */
          else if (emptyLocal) { out.push(r); st.restored++; }   /* 上面那条规则 */
          else if (same(r, b)) { st.deleted++; tombs[k] = now; } /* 云端没动过 → 本地删了，跟删 */
          else { out.push(r); st.updated++; }              /* 云端改过 → 取云端，宁可多一条不丢一条 */
          continue;
        }

        /* 4) 两边都有 */
        if (l && r) {
          var lonly = !same(l, b), ronly = !same(r, b);
          if (!lonly && !ronly) { out.push(l); }                       /* 两边都没动 */
          else if (!lonly && ronly) { out.push(r); st.updated++; }     /* 只有云端动 */
          else if (lonly && !ronly) { out.push(l); st.updated++; }     /* 只有本地动 */
          else if (same(l, r)) { out.push(l); }                        /* 都动了但改到一样 */
          else {
            /* 真冲突：两边都改、内容不同。时间戳兜底，判不出来取云端并记一笔 */
            var lu = utOf(l), ru = utOf(r);
            if (lu > ru) { out.push(l); st.updated++; }
            else if (ru > lu) { out.push(r); st.updated++; }
            else { out.push(r); st.fought++; }
          }
          continue;
        }
        /* 5) 两边都没有 → 只留墓碑 */
      }

      return {
        items: out,
        tombs: pruneTombs(tombs, now),
        st: st,
        emptyLocal: emptyLocal
      };
    }

    /* ---- 计划表是 { 2026-11: [ ... ] }，合并前展平，合并后重组 ---- */
    function flattenPlans(months) {
      var out = [], ym, a, i, x, c;
      for (ym in (months || {})) {
        a = isArr(months[ym]) ? months[ym] : [];
        for (i = 0; i < a.length; i++) {
          x = a[i];
          if (!idOf(x)) continue;
          c = map(x);
          c.__ym = ym;
          out.push(c);
        }
      }
      return out;
    }
    function regroupPlans(list) {
      var m = {}, i, x, ym, c;
      for (i = 0; i < (list || []).length; i++) {
        x = list[i];
        ym = x && x.__ym;
        if (!ym) continue;
        if (!m[ym]) m[ym] = [];
        c = map(x);
        delete c.__ym;
        m[ym].push(c);
      }
      for (ym in m) {
        m[ym].sort(function (a, b) {
          var da = String(a.due || '9999-99-99'), db = String(b.due || '9999-99-99');
          if (da !== db) return da < db ? -1 : 1;
          return num(a.ct) - num(b.ct);
        });
      }
      return m;
    }

    /* ---- 给旧条目补 ut（只补一次，用格时间，不会误判成"刚改过"） ---- */
    function stampItems(list, baseTs) {
      var a = isArr(list) ? list : [], i, x;
      for (i = 0; i < a.length; i++) {
        x = a[i];
        if (!isObj(x)) continue;
        if (!num(x.ut)) x.ut = num(baseTs) || num(x.ct) || 1;
      }
      return a;
    }

    /**
     * 合并整个状态。base/local/remote 都是
     * { wins, notes, plans, tombs:{wins,notes,plans}, rev, at }
     * 某格为 null 表示"这份数据在这台设备上不存在"（不是空的）。
     */
    function mergeState(base, local, remote, now, readOnly) {
      base = base || {}; local = local || {}; remote = remote || {};
      now = now || Date.now();

      var bt = base.tombs || {};
      var out = {
        v: 4,
        at: now,
        rev: Math.max(num(base.rev), num(local.rev), num(remote.rev)) + 1,
        tombs: {},
        st: { added: 0, updated: 0, deleted: 0, fought: 0, restored: 0 },
        absent: {},
        emptyLocal: {}
      };

      function tally(s) {
        for (var k in s) if (out.st[k] !== undefined) out.st[k] += s[k];
      }

      /* --- 画布 wins --- */
      if (local.wins === null || local.wins === undefined) {
        out.wins = isArr(remote.wins) ? remote.wins : [];
        out.absent.wins = true;
        out.tombs.wins = pruneTombs((remote.tombs || {}).wins, now);
      } else {
        var w = mergeSection({
          base: base.wins, local: local.wins, remote: remote.wins,
          baseTombs: bt.wins, localTombs: (local.tombs || {}).wins, remoteTombs: (remote.tombs || {}).wins,
          now: now, readOnly: readOnly
        });
        out.wins = w.items; out.tombs.wins = w.tombs;
        out.emptyLocal.wins = w.emptyLocal;
        tally(w.st);
      }

      /* --- 卡片库 notes --- */
      if (local.notes === null || local.notes === undefined) {
        out.notes = isArr(remote.notes) ? remote.notes : [];
        out.absent.notes = true;
        out.tombs.notes = pruneTombs((remote.tombs || {}).notes, now);
      } else {
        var n = mergeSection({
          base: base.notes, local: local.notes, remote: remote.notes,
          baseTombs: bt.notes, localTombs: (local.tombs || {}).notes, remoteTombs: (remote.tombs || {}).notes,
          now: now, readOnly: readOnly
        });
        out.notes = n.items; out.tombs.notes = n.tombs;
        out.emptyLocal.notes = n.emptyLocal;
        tally(n.st);
      }

      /* --- 内容策划 plans --- */
      if (local.plans === null || local.plans === undefined) {
        out.plans = isObj(remote.plans) ? remote.plans : {};
        out.absent.plans = true;
        out.tombs.plans = pruneTombs((remote.tombs || {}).plans, now);
      } else {
        var p = mergeSection({
          base: flattenPlans(base.plans), local: flattenPlans(local.plans), remote: flattenPlans(remote.plans),
          baseTombs: bt.plans, localTombs: (local.tombs || {}).plans, remoteTombs: (remote.tombs || {}).plans,
          now: now, readOnly: readOnly
        });
        out.plans = regroupPlans(p.items); out.tombs.plans = p.tombs;
        out.emptyLocal.plans = p.emptyLocal;
        tally(p.st);
      }

      return out;
    }

    function totalCount(plans) {
      var n = 0, k;
      for (k in (plans || {})) if (isArr(plans[k])) n += plans[k].length;
      return n;
    }

    return {
      TOMB_KEEP: TOMB_KEEP,
      mergeSection: mergeSection,
      mergeState: mergeState,
      flattenPlans: flattenPlans,
      regroupPlans: regroupPlans,
      stampItems: stampItems,
      totalCount: totalCount,
      pruneTombs: pruneTombs,
      idOf: idOf,
      utOf: utOf,
      same: same,
      _internals: { index: index, sig: sig, num: num }
    };
  })();
  /* @core-end */

  /* ================= 本地存储层 ================= */
  var opt = null;
  var token = '';
  var lastErr = '';
  var lastPullOk = false;
  var inited = false;

  /* 串行队列：同一页面的 pull / push 一条一条来，不许并发 */
  var chain = Promise.resolve();
  function enqueue(fn) {
    var p = chain.then(function () { return fn(); }, function () { return fn(); });
    chain = p.then(function () {}, function () {});
    return p;
  }

  function readToken() {
    try { token = localStorage.getItem(TKEY) || ''; } catch (e) { token = ''; }
    return token;
  }
  function saveToken(v) {
    token = String(v || '').trim();
    try {
      if (token) localStorage.setItem(TKEY, token);
      else localStorage.removeItem(TKEY);
    } catch (e) {}
  }
  function setStamp(n) {
    try { localStorage.setItem(TSTAMP, String(n || 0)); } catch (e) {}
  }

  function b64(s) { return btoa(unescape(encodeURIComponent(s))); }
  function unb64(s) { return decodeURIComponent(escape(atob(String(s || '').replace(/\s/g, '')))); }

  function status(kind, text) {
    if (opt && opt.onStatus) { try { opt.onStatus(kind, text); } catch (e) {} }
  }

  /* 读原始对象；读不到 / 坏了返回 null —— 跟"空的"严格区分开 */
  function readRaw(k) {
    try {
      var o = JSON.parse(localStorage.getItem(k) || 'null');
      return (o && typeof o === 'object') ? o : null;
    } catch (e) { return null; }
  }
  function writeStore(k, o) {
    try { localStorage.setItem(k, JSON.stringify(o)); return true; } catch (e) { return false; }
  }

  /* 同步元数据：base = 上次和云端对齐时的那份快照，是三方合并的基准 */
  function loadMeta() {
    var m = readRaw(SKEY);
    if (!m || typeof m !== 'object') m = {};
    if (!m.base || typeof m.base !== 'object') m.base = {};
    if (!m.tombs || typeof m.tombs !== 'object') m.tombs = {};
    if (!m.base.tombs) m.base.tombs = {};
    return m;
  }
  function saveMeta(m) { writeStore(SKEY, m); }

  /* 本地三份。null = 这台设备没有这份数据（≠ 空数组） */
  function localState() {
    var d = readRaw(DK), c = readRaw(CK), p = readRaw(PK);
    var m = loadMeta();
    return {
      wins: (d && Core._internals && Object.prototype.toString.call(d.wins) === '[object Array]') ? d.wins : null,
      notes: (c && Object.prototype.toString.call(c.wins) === '[object Array]') ? c.wins : null,
      plans: (p && p.months && typeof p.months === 'object') ? p.months : null,
      tombs: m.tombs || {},
      rev: Core._internals.num(m.rev),
      at: Math.max(Core._internals.num(d && d.at), Core._internals.num(c && c.at), Core._internals.num(p && p.at))
    };
  }

  /* 把合并结果写回本地。本地没有这一格的就不给它凭空建一份。
     baseObj：base 快照该存什么。语义上 base 必须是「上次和云端对齐时，云端那份的样子」，
     三方合并靠它判断"这条是本地改的、还是云端删的"。
       - pull 之后：云端还是原来那份，所以 base = remote
       - push 成功之后：云端已经被我们写成 merged 了，所以 base = merged
     这里传错一次，就会把本地数据判成"云端已删除"然后一路删光。 */
  /* 比较「内容有没有变」。必须忽略 ut：
     stampItems 补过 ut 的那份和云端没 ut 的那份，JSON.stringify 永远不相等，
     照那种比法每次 pull 都算"有变化"→ onApplied → location.reload() → 死循环。 */
  function eqList(a, b) {
    var x = a || [], y = b || [], i, k;
    if (x.length !== y.length) return false;
    var ma = {}, mb = {};
    for (i = 0; i < x.length; i++) ma[Core.idOf(x[i]) || ('#' + i)] = x[i];
    for (i = 0; i < y.length; i++) mb[Core.idOf(y[i]) || ('#' + i)] = y[i];
    for (k in ma) { if (!mb[k] || !Core.same(ma[k], mb[k])) return false; }
    for (k in mb) { if (!ma[k]) return false; }
    return true;
  }
  function eqMonths(a, b) {
    a = a || {}; b = b || {};
    var ka = [], kb = [], i, k;
    for (k in a) ka.push(k);
    for (k in b) kb.push(k);
    if (ka.length !== kb.length) return false;
    ka = ka.sort(); kb = kb.sort();
    for (i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return false;
    for (i = 0; i < ka.length; i++) if (!eqList(a[ka[i]], b[ka[i]])) return false;
    return true;
  }

  function applyMerged(merged, now, baseObj, keepBase) {
    var n = 0;

    /* 写不写回本地：
       - 本地有这一格 → 写
       - 本地没有这一格，但云端有内容 → 也写（全新设备就是靠这个把数据落下来）
       - 本地没有、云端也没有 → 不写（别凭空造一个空模块）
       注意：这里宽松一点是安全的。危险的方向只有一个——拿空去盖云端，
       那条防线在 doPush 里，不在这儿。 */
    var hasWins = !merged.absent.wins || (merged.wins && merged.wins.length > 0);
    var hasNotes = !merged.absent.notes || (merged.notes && merged.notes.length > 0);
    var hasPlans = !merged.absent.plans || (Core.totalCount(merged.plans) > 0);

    if (hasWins) {
      var d = readRaw(DK) || { v: 3, theme: 'light', wins: [], at: 0 };
      if (!eqList(d.wins, merged.wins)) {
        d.wins = Core.stampItems(merged.wins, d.at || now);
        d.at = now; d.v = 3;
        if (writeStore(DK, d)) n++;
      }
    }
    if (hasNotes) {
      var c = readRaw(CK) || { v: 3, theme: 'light', wins: [], at: 0 };
      if (!eqList(c.wins, merged.notes)) {
        c.wins = Core.stampItems(merged.notes, c.at || now);
        c.at = now; c.v = 3;
        if (writeStore(CK, c)) n++;
      }
    }
    if (hasPlans) {
      var p = readRaw(PK) || { v: 1, at: 0, months: {} };
      if (!eqMonths(p.months, merged.plans)) {
        var m2 = {}, ym, a;
        for (ym in merged.plans) {
          a = Core.stampItems(merged.plans[ym], (p.at || now));
          m2[ym] = a;
        }
        p.months = m2;
        p.at = now; p.v = 1;
        if (writeStore(PK, p)) n++;
      }
    }

    var meta = loadMeta();
    meta.rev = merged.rev;
    meta.tombs = merged.tombs || { wins: {}, notes: {}, plans: {} };
    if (keepBase) {
      /* 无令牌只读拉取：读到的可能是 CDN 旧版，不能拿来当基准 */
    } else if (baseObj) {
      meta.base = {
        wins: baseObj.wins, notes: baseObj.notes, plans: baseObj.plans,
        tombs: (baseObj.tombs || {}), rev: baseObj.rev || 0
      };
    } else {
      meta.base = {
        wins: merged.wins, notes: merged.notes, plans: merged.plans,
        tombs: meta.tombs, rev: merged.rev
      };
    }
    saveMeta(meta);
    return n;
  }

  /* ================= 网络层 ================= */
  function hdr() {
    return {
      Authorization: 'token ' + token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };
  }

  /* 从 GitHub 读某个分支的真实内容（带 sha），绕开 Pages 的 CDN 缓存 */
  function getRemote(branch, h) {
    return fetch(API + '?ref=' + branch + '&t=' + Date.now(), { headers: h, cache: 'no-store' })
      .then(function (r) {
        if (r.status === 404) return { branch: branch, sha: '', data: null, rev: 0 };
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json().then(function (j) {
          var data = null;
          try { data = JSON.parse(unb64(j.content)); } catch (e) { data = null; }
          return {
            branch: branch,
            sha: j.sha || '',
            data: data,
            rev: Core._internals.num(data && data.rev)
          };
        });
      });
  }

  function putRemote(branch, sha, bodyObj, h) {
    var body = {
      message: 'workbench sync ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
      content: b64(JSON.stringify(bodyObj)),
      branch: branch
    };
    if (sha) body.sha = sha;
    return fetch(API, { method: 'PUT', headers: h, body: JSON.stringify(body) })
      .then(function (r) {
        if (r.ok) return true;
        if (r.status === 409 || r.status === 422 || r.status === 412) {
          var e = new Error('CONFLICT');
          e.conflict = true;
          throw e;
        }
        throw new Error('HTTP ' + r.status);
      });
  }

  /* 把云端对象规整成合并引擎吃的形状 */
  function shape(data) {
    var EMPTY = { wins: null, notes: null, plans: null, tombs: {}, rev: 0 };
    if (!data || typeof data !== 'object') return EMPTY;

    function isA(x) { return Object.prototype.toString.call(x) === '[object Array]'; }

    var w = data.wins, n = data.notes;
    if (!isA(n)) {
      /* 老格式：卡片混在 wins 里。数据被写坏时也不能崩，按空的处理。 */
      var src = isA(w) ? w : [];
      w = []; n = [];
      for (var i = 0; i < src.length; i++) {
        var x = src[i];
        if (x && x.kind === 'note') n.push(x); else w.push(x);
      }
    }
    return {
      wins: isA(w) ? w : [],
      notes: isA(n) ? n : [],
      plans: (data.plans && typeof data.plans === 'object' && !isA(data.plans)) ? data.plans : {},
      tombs: (data.tombs && typeof data.tombs === 'object') ? data.tombs : {},
      rev: Core._internals.num(data.rev),
      at: Core._internals.num(data.at)
    };
  }

  /* ================= 拉 ================= */
  function doPull(silent) {
    if (!silent) status('busy', '正在取云端的…');

    var p;
    if (token) {
      /* 有令牌：走 API 拿真实内容 + sha，顺便把 base 对齐 */
      p = getRemote('gh-pages', hdr())
        .catch(function () { return getRemote(BRANCH, hdr()); })
        .then(function (res) {
          if (!res || !res.data) { lastPullOk = true; status('local', '云端还没有'); return null; }
          lastPullOk = true;
          return res;
        });
    } else {
      /* 没令牌：只能读同域那份（CDN 可能有延迟），只读合并，绝不删 */
      var tries = [];
      if (SELF) tries.push(SELF + '?t=' + Date.now());
      tries.push(RAW + '?t=' + Date.now());
      function grab(i) {
        return fetch(tries[i], { cache: 'no-store' })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .catch(function (e) {
            if (i + 1 < tries.length) return grab(i + 1);
            throw e;
          });
      }
      p = grab(0).then(function (j) {
        var data = j;
        if (j && j.content) { try { data = JSON.parse(unb64(j.content)); } catch (e) { data = null; } }
        lastPullOk = true;
        return { branch: 'self', sha: '', data: data, rev: Core._internals.num(data && data.rev) };
      });
    }

    return p
      .then(function (res) {
        if (!res || !res.data) return null;

        /* 正在打字就别动它 */
        var busy = document.activeElement && document.activeElement.isContentEditable;
        if (busy) { status('local', '云端有更新'); return null; }

        var meta = loadMeta();
        var remote = shape(res.data);
        /* 没令牌 → readOnly：只补缺的，不删不改；而且 base 不动（CDN 可能是旧版） */
        var merged = Core.mergeState(meta.base, localState(), remote, Date.now(), !token);
        var n = applyMerged(merged, Date.now(), token ? remote : null, !token);

        var st = merged.st;
        /* 只有真的动了数据才让页面重载。三个页面里 onApplied 就是 location.reload()，
           判断条件写宽了会变成"拉一次刷一次"。这里按合并统计走，不看 n（n 可能只是补了 ut）。 */
        var changed = (st.added + st.updated + st.deleted + st.restored + st.fought) > 0;
        if (changed) {
          status('ok', st.fought ? ('已取回云端（' + st.fought + ' 条冲突）') : '已取回云端');
          if (opt && opt.onApplied) { try { opt.onApplied(); } catch (e) {} }
        } else {
          status('ok', '已是最新');
        }
        return merged;
      })
      .catch(function (e) {
        lastErr = (e && e.message) || String(e);
        if (lastErr.indexOf('404') >= 0) status('local', '云端还没有');
        else status('err', '取不到云端');
        return null;
      });
  }

  function pull(silent) { return enqueue(function () { return doPull(silent); }); }

  /* ================= 推 ================= */
  function doPush(attempt) {
    if (!token) { status('local', '只在本机'); return Promise.resolve(false); }
    attempt = attempt || 0;
    status('busy', '正在同步…');

    var h = hdr();

    /* 1) 先读两个分支。读不到就不推 —— 这是第 5 条铁律 */
    return Promise.all([getRemote('gh-pages', h), getRemote(BRANCH, h)])
      .then(function (pair) {
        var gp = pair[0], mn = pair[1];

        /* 两个分支内容不一样时，rev 大的那个是新的。
           都是 0 且都没数据 = 云端第一次建，也允许。 */
        var remote = null;
        if (gp.data && mn.data) remote = (gp.rev >= mn.rev) ? shape(gp.data) : shape(mn.data);
        else if (gp.data) remote = shape(gp.data);
        else if (mn.data) remote = shape(mn.data);
        else remote = { wins: [], notes: [], plans: {}, tombs: {}, rev: 0 };

        var meta = loadMeta();
        var local = localState();
        var merged = Core.mergeState(meta.base, local, remote, Date.now(), false);

        /* 2) 合并结果为空、云端非空、而且没有任何删除记录 → 拒绝推 */
        var outCount =
          (merged.wins || []).length + (merged.notes || []).length + Core.totalCount(merged.plans);
        var remCount =
          (remote.wins || []).length + (remote.notes || []).length + Core.totalCount(remote.plans);
        if (outCount === 0 && remCount > 0 && !merged.st.deleted) {
          status('err', '本地是空的，没有覆盖云端');
          return false;
        }

        /* 3) 写成云端格式（平铺，向后兼容） */
        var now = Date.now();
        var bodyObj = {
          v: 4,
          at: now,
          wat: now, wins: merged.wins,
          nat: now, notes: merged.notes,
          pat: now, plans: merged.plans,
          rev: merged.rev,
          tombs: merged.tombs
        };

        /* 4) 带 sha 提交。云端在此期间变了 → 409/422 → 重新读重新合并 */
        return putRemote('gh-pages', gp.sha, bodyObj, h)
          .catch(function (e) {
            if (e.conflict && attempt < 2) throw e;
            if (e.conflict) throw new Error('云端一直在变，这次没推上去');
            throw e;
          })
          .then(function () {
            return putRemote(BRANCH, mn.sha, bodyObj, h)
              .catch(function (e) {
                if (e.conflict) return false;   /* main 只是留底，冲突就跳过 */
                throw e;
              });
          })
          .then(function () {
            /* 5) 成功了才更新本地和 base —— 顺序很重要，失败时本地不能被改 */
            applyMerged(merged, now);
            setStamp(now);
            lastPullOk = true;
            status('ok', '已同步到云端');
            return true;
          })
          .catch(function (e) {
            if (e && e.conflict && attempt < 2) {
              return doPush(attempt + 1);
            }
            throw e;
          });
      })
      .catch(function (e) {
        lastErr = (e && e.message) || String(e);
        var msg = lastErr.indexOf('401') >= 0 ? '令牌不对或过期'
                : lastErr.indexOf('403') >= 0 ? '令牌没权限（要 repo）'
                : lastErr.indexOf('404') >= 0 ? '仓库找不到'
                : lastErr.indexOf('CONFLICT') >= 0 ? '云端刚被别处改过'
                : '推不上去（没动云端）';
        status('err', msg);
        return false;
      });
  }

  function push() { return enqueue(function () { return doPush(0); }); }

  /* 保存后延时推。没令牌 / 从没成功拉过 → 不推 */
  var pushTimer = null;
  function pushSoon() {
    if (!token) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      if (!lastPullOk) { status('local', '先取一次云端再推'); pull(true).then(function () { push(); }); return; }
      push();
    }, 2200);
  }

  /* ================= 设置面板 ================= */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function panel() {
    var old = document.getElementById('syncPanel');
    if (old) { old.remove(); return; }

    var mask = el('div', 'sy-mask');
    mask.id = 'syncPanel';

    var box = el('div', 'sy-box');
    box.innerHTML =
      '<div class="sy-t">同步到其他设备</div>' +
      '<div class="sy-p">数据现在只存在这台设备的浏览器里，换台设备打开就是空的。' +
        '给一个 GitHub 令牌，我把它推到你自己的仓库，手机打开就能读到同一份。' +
        '画布、卡片库、策划表分开存，各同步各的，谁也不会盖掉谁。</div>' +
      '<ol class="sy-how">' +
        '<li>点下面的按钮，在新页面里勾选 <code>repo</code>，拉到最底下点 <b>Generate token</b></li>' +
        '<li>复制那串 <code>ghp_</code> 开头的字符，粘回这里</li>' +
      '</ol>' +
      '<a class="sy-go" href="https://github.com/settings/tokens/new?scopes=repo&description=my-workbench" target="_blank" rel="noreferrer">去拿令牌 ↗</a>' +
      '<input class="sy-in" id="syTok" type="password" spellcheck="false" autocomplete="off" placeholder="粘贴到这里：ghp_xxxxxxxx">' +
      '<div class="sy-row">' +
        '<button class="sy-btn" type="button" id="sySave">存下来</button>' +
        '<button class="sy-btn is-main" type="button" id="syNow">立刻同步</button>' +
        '<button class="sy-btn is-quiet" type="button" id="syOut">忘掉令牌</button>' +
      '</div>' +
      '<div class="sy-note" id="syNote"></div>';
    mask.appendChild(box);
    document.body.appendChild(mask);

    var inp = box.querySelector('#syTok');
    inp.value = token;
    var note = box.querySelector('#syNote');

    function say(s) { note.textContent = s; }

    mask.addEventListener('click', function (e) {
      if (e.target === mask) mask.remove();
    });
    box.querySelector('#sySave').addEventListener('click', function () {
      saveToken(inp.value);
      say(token ? (token.length > 20 ? '存好了。手机那边打开就会自动取。' : '这串看着不太对，再对一遍？') : '清掉了');
      if (token) pushSoon();
    });
    box.querySelector('#syNow').addEventListener('click', function () {
      saveToken(inp.value);
      if (!token) { say('先粘令牌再同步'); return; }
      say('正在对齐两边的数据…');
      pull(true).then(function () { return push(); }).then(function (ok) {
        say(ok ? '推上去了，手机打开就能看到。' : ('没推上去：' + lastErr));
      });
    });
    box.querySelector('#syOut').addEventListener('click', function () {
      saveToken('');
      inp.value = '';
      say('这台设备不再同步了。云端那份还在。');
      status('local', '只在本机');
    });

    if (!token) say('还没给令牌，现在只能在这台设备上看。');
  }

  /* ================= 对外 ================= */
  window.WBSync = {
    version: 4,
    init: function (o) {
      if (o) opt = o;
      readToken();
      if (inited) return;          /* 策划台和卡片库都会 init，只跑一次 */
      inited = true;
      setTimeout(function () { pull(true); }, 700);
    },
    push: push,
    pushSoon: pushSoon,
    pull: pull,
    panel: panel,
    hasToken: function () { return !!readToken(); },
    openPanel: panel,
    /* 给测试和调试用 */
    _core: (typeof Core !== 'undefined') ? Core : null
  };
})();
