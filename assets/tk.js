/* ==========================================================
   票根卡的数据源
   SOP = 选题复用卡 / HARD = 困难卡 / HOOK = 前五秒卡
   画布（index.html）和卡片库（cards.html）共用这一份，改文案只改这里
   ========================================================== */
window.TK_ORDER = ['sop', 'hard', 'hook'];

window.TK = {
  sop: {
    name: 'SOP 卡',
    short: '选题复用卡',
    brand: 'SOP',
    tag: '选题复用',
    lab: '复用次数',
    k1: '01 // 这个选题',
    k2: '02 // 谁能用',
    k3: '03 // 发过没',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h8.4M4 12h10.6M4 16.5h6.2"/><path d="M15.2 15.4l2 2 3.9-4.2"/></svg>',
    f: {
      name: '新机发布怎么选颜色',
      big: '复用 3 次',
      a: '每个新机发布都能套：颜色怎么选',
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
    k1: '01 // 我干了什么',
    k2: '02 // 被什么卡住',
    k3: '03 // 怎么解的',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6 21.2 19.4H2.8z"/><path d="M12 9.2v4.5M12 16.5v.1"/></svg>',
    f: {
      name: '折叠态贴膜压不出边',
      big: '卡了 2 天',
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
    k1: '01 // 什么视频',
    k2: '02 // 开头怎么说',
    k3: '03 // 为什么这么开',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="M10.2 8.9l5.4 3.1-5.4 3.1z"/></svg>',
    f: {
      name: '邮寄贴膜用威胁开头',
      big: '用过 3 次',
      a: '邮寄贴膜',
      b: '不怕我给你手机卖了？',
      c: '先吓一下，再圆回来讲原因'
    }
  }
};
