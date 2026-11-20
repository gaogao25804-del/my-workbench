/* ==========================================================
   跨设备同步
   数据本来只存在这台电脑的浏览器里（localStorage），换台设备就是空的。
   这里把它推到自己仓库里的一个 JSON 文件，别的设备打开时从那儿拉。

   读：raw.githubusercontent.com，谁都能读，不用令牌
   写：GitHub Contents API，需要一个令牌（只存在本机浏览器里）

   画布（index.html）和卡片库（cards.html）共用同一份数据，两页都引这个文件。
   ========================================================== */
(function () {
  var OWNER = 'gaogao25804-del';
  var REPO = 'my-workbench';
  var PATH = 'desk-data.json';
  var BRANCH = 'main';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + PATH;
  var RAW = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/' + PATH;
  var TKEY = 'wb.sync.token.v1';
  var TSTAMP = 'wb.sync.at.v1';      /* 上次成功的云端时间戳，用来判断谁新 */

  /* 同域那份：页面和它在一个域名下，手机上一定打得开。
     raw.githubusercontent 在国内时不时抽风，所以读的时候先找自己家这个。 */
  var SELF = (function () {
    try {
      return location.origin + location.pathname.replace(/[^/]*$/, '') + PATH;
    } catch (e) { return ''; }
  })();

  var opt = null;                    /* { getState, applyRemote, onStatus } */
  var token = '';
  var pushTimer = null, pushing = false, pulling = false;
  var lastErr = '';

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
  function stamp() {
    var n = 0;
    try { n = parseInt(localStorage.getItem(TSTAMP) || '0', 10) || 0; } catch (e) {}
    return n;
  }
  function setStamp(n) {
    try { localStorage.setItem(TSTAMP, String(n || 0)); } catch (e) {}
  }

  function b64(s) {
    return btoa(unescape(encodeURIComponent(s)));
  }
  function unb64(s) {
    return decodeURIComponent(escape(atob(String(s || '').replace(/\s/g, ''))));
  }

  function status(kind, text) {
    if (opt && opt.onStatus) {
      try { opt.onStatus(kind, text); } catch (e) {}
    }
  }

  /* ---------- 拉：谁的时间新用谁的 ---------- */
  function pull(silent) {
    if (pulling) return Promise.resolve(null);
    pulling = true;
    if (!silent) status('busy', '正在取云端的…');

    /* 先找同域那份（最快、手机上一定通），再退到 raw */
    var tries = [];
    if (SELF) tries.push(SELF + '?t=' + Date.now());
    tries.push(RAW + '?t=' + Date.now());

    function grab(i) {
      return fetch(tries[i], { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .catch(function (e) {
          if (i + 1 < tries.length) return grab(i + 1);
          throw e;
        });
    }

    return grab(0)
      .then(function (j) {
        /* 同域那份就是数据本身；万一哪次拿到的是接口包装，也认 */
        var remote = null;
        if (j && j.content) {
          try { remote = JSON.parse(unb64(j.content)); } catch (e) { remote = null; }
        } else if (j && j.wins) {
          remote = j;
        }
        if (!remote || !remote.wins) { status('err', '云端那份读不懂'); return null; }

        var localAt = 0;
        try {
          var l = JSON.parse(localStorage.getItem('wb.desk.v1') || 'null');
          localAt = (l && l.at) || 0;
        } catch (e) { localAt = 0; }
        var remoteAt = remote.at || 0;

        if (remoteAt > localAt + 800) {
          /* 云端更新：换成云端的。正在打字就别动它，提示一下就好 */
          var busy = document.activeElement && document.activeElement.isContentEditable;
          if (busy || !opt) { status('local', '云端有更新'); return remote; }
          opt.applyRemote(remote);
          status('ok', '已取回云端');
          return remote;
        }
        status('ok', '已是最新');
        return remote;
      })
      .catch(function (e) {
        lastErr = (e && e.message) || String(e);
        /* 两边都 404 就是还没推过，不算错 */
        if (lastErr.indexOf('404') >= 0) status('local', '云端还没有');
        else status('err', '取不到云端');
        return null;
      })
      .then(function (r) { pulling = false; return r; });
  }

  /* ---------- 推：只有拿到令牌才推得动 ---------- */
  /* 一份推到 gh-pages（页面自己在那儿，手机上同域就能读），
     一份推到 main（源码分支留个底）。两个都写，坏一个还有一个。 */
  function pushTo(branch, body0, hdr) {
    var url = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + PATH;
    return fetch(url + '?ref=' + branch + '&t=' + Date.now(), { headers: hdr, cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (meta) {
        var body = {
          message: 'workbench sync ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
          content: b64(body0),
          branch: branch
        };
        if (meta && meta.sha) body.sha = meta.sha;
        return fetch(url, { method: 'PUT', headers: hdr, body: JSON.stringify(body) });
      })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return true;
      });
  }

  function push() {
    if (!token) { status('local', '只在本机'); return Promise.resolve(false); }
    if (pushing) return Promise.resolve(false);
    pushing = true;
    status('busy', '正在同步…');

    var state = opt && opt.getState ? opt.getState() : null;
    if (!state) { pushing = false; return Promise.resolve(false); }
    var body0 = JSON.stringify(state);
    var hdr = {
      Authorization: 'token ' + token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };

    return pushTo('gh-pages', body0, hdr)
      .catch(function (e) { lastErr = (e && e.message) || String(e); return false; })
      .then(function (a) {
        return pushTo(BRANCH, body0, hdr)
          .catch(function (e) { lastErr = (e && e.message) || String(e); return false; })
          .then(function (b) { return a || b; });
      })
      .then(function (ok) {
        if (!ok) throw new Error(lastErr || 'HTTP 500');
        setStamp(Date.now());
        status('ok', '已同步到云端');
        return true;
      })
      .catch(function (e) {
        lastErr = (e && e.message) || String(e);
        var msg = lastErr.indexOf('401') >= 0 ? '令牌不对或过期'
                : lastErr.indexOf('403') >= 0 ? '令牌没权限（要 repo）'
                : lastErr.indexOf('404') >= 0 ? '仓库找不到'
                : '推不上去';
        status('err', msg);
        return false;
      })
      .then(function (ok) { pushing = false; return ok; });
  }

  function pushSoon() {
    if (!token) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { push(); }, 2200);
  }

  /* ---------- 设置面板 ---------- */
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
      '<div class="sy-p">卡片现在只存在这台设备的浏览器里，换台设备打开就是空的。' +
        '给一个 GitHub 令牌，我把它推到你自己的仓库，手机打开就能读到同一份。</div>' +
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
      push().then(function (ok) { say(ok ? '推上去了，手机打开就能看到。' : ('没推上去：' + lastErr)); });
    });
    box.querySelector('#syOut').addEventListener('click', function () {
      saveToken('');
      inp.value = '';
      say('这台设备不再同步了。云端那份还在。');
      status('local', '只在本机');
    });

    if (!token) say('还没给令牌，现在只能在这台设备上看。');
  }

  /* ---------- 对外 ---------- */
  window.WBSync = {
    init: function (o) {
      opt = o || {};
      readToken();
      /* 启动时悄悄拉一次，不刷「正在取」 */
      setTimeout(function () { pull(true); }, 700);
    },
    push: push,
    pushSoon: pushSoon,
    pull: pull,
    panel: panel,
    hasToken: function () { return !!readToken(); },
    openPanel: panel
  };
})();
