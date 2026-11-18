/* ==========================================================
   票根卡的数据源
   SOP = 选题复用卡 / HARD = 困难卡 / HOOK = 前五秒卡
   画布（index.html）和卡片库（cards.html）共用这一份，改文案只改这里
   ========================================================== */
window.TK_ORDER = ['sop', 'hard', 'hook'];

/* 三种卡都不带 01/02/03 小标题，整块都留给写字，空的只给一句浅提示 */
window.TK = {
  sop: {
    name: 'SOP 卡',
    short: '选题复用卡',
    brand: 'SOP',
    tag: '选题复用',
    lab: '复用次数',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h8.4M4 12h10.6M4 16.5h6.2"/><path d="M15.2 15.4l2 2 3.9-4.2"/></svg>',
    ph: { name: '给它起个名', big: '一句数字', a: '这个选题怎么套…', b: '谁能用…', c: '发过没…' },
    f: {
      name: '新机发布怎么选颜色',
      big: '无限复用',
      a: '新机的颜色选择，怎么去选？',
      b: '所有手机，换个机名就行',
      c: 'Duo 发过，X8 发过，还能再发'
    }
  },
  hard: {
    name: '困难卡',
    short: '卡点复盘',
    brand: 'HARD',
    tag: '卡点复盘',
    lab: '卡了多久',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6 21.2 19.4H2.8z"/><path d="M12 9.2v4.5M12 16.5v.1"/></svg>',
    ph: { name: '给它起个名', big: '一句数字', a: '我干了什么…', b: '被什么卡住…', c: '后来怎么解的…' },
    f: {
      name: '折叠态贴膜压不出边',
      big: '一直卡',
      a: '给 Mate X8 折叠态贴膜',
      b: '弧边压不住，一贴就白边',
      c: '热压二次收边，跟客户改到明天'
    }
  },
  hook: {
    name: '前五秒卡',
    short: '开头库',
    brand: 'HOOK',
    tag: '开头 0—5S',
    lab: '用过几次',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="M10.2 8.9l5.4 3.1-5.4 3.1z"/></svg>',
    ph: { name: '给它起个名', big: '一句数字', a: '什么样的视频…', b: '开头怎么说…', c: '为什么这么开…' },
    f: {
      name: '邮寄贴膜用威胁开头',
      big: '用过 3 次',
      a: '邮寄贴膜',
      b: '不怕我给你手机卖了？',
      c: '先吓一下，再圆回来讲原因'
    }
  }
};

/* 编号重排：删一张之后不留空号，001、002、003 一路连着
   排序按原编号，同号按位置，所以「捡回来」的卡还能回到原来那一格 */
window.TK_RENUM = function (wins) {
  var list = [];
  Object.keys(wins || {}).forEach(function (k) {
    var w = wins[k];
    if (w && w.kind === 'note' && w.note && window.TK[w.note.style]) list.push(w);
  });
  list.sort(function (a, b) {
    var x = a.note.no | 0, y = b.note.no | 0;
    if (x !== y) return x - y;
    return (a.y | 0) - (b.y | 0) || (a.x | 0) - (b.x | 0);
  });
  list.forEach(function (w, i) {
    if (w.note.no !== i + 1) w.note.no = i + 1;
  });
  return list;
};
