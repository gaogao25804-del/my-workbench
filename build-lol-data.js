/**
 * 转换 haidou.vip 原始数据为 lol-data.json
 */
const fs = require('fs');

const cRaw = require('./champions-raw.json');
const aRaw = require('./augments-raw.json');

const tierMap = { 1:'T0', 2:'T1', 3:'T2', 4:'T3', 5:'T4' };
const roleMap = {
  tank: '坦克', fighter: '战士', assassin: '刺客',
  mage: '法师', marksman: '射手', support: '辅助'
};
// haidou.vip tierCalc 算法（16.15.5 前端 JS tierCalc-D-E4EfLb.js 直译）
function _haidouI(o){ return Math.max(-1, Math.min(1, (o-.5)/.02)); }
function haidouTierCalc(arr){
  const s = new Map();
  const n = arr.filter(t => t.winRate != null);
  if (n.length < 5) return s;
  const R = n.reduce((t, e) => t + e.winRate, 0) / n.length;
  const i = n.reduce((t, e) => t + (e.winRate - R) ** 2, 0) / n.length;
  const h = Math.sqrt(i);
  const r = n.map(t => t.pickRate ?? 0);
  const T = r.reduce((t, e) => t + e, 0) / r.length;
  const l = r.reduce((t, e) => t + (e - T) ** 2, 0) / r.length;
  const u = Math.sqrt(l);
  const fn = (t, e, c) => c === 0 ? 0 : (t - e) / c;
  const a = n.map(t => ({
    id: t.id,
    score: .7 * fn(t.winRate, R, h) + .3 * _haidouI(t.winRate) * fn(t.pickRate ?? 0, T, u)
  }));
  a.sort((t, e) => e.score - t.score);
  a.forEach((t, idx) => {
    const c = Math.min(5, Math.floor(idx / a.length * 5) + 1);
    s.set(t.id, c);
  });
  return s;
}
// 按 role 分类的英雄数量矩阵计数（方便 debug）
function printMatrix(champsWithTierRanks) {
  const rows = ['T0','T1','T2','T3','T4'];
  const cols = ['坦克','战士','刺客','法师','射手','辅助'];
  const m = {};
  rows.forEach(r => { m[r] = {}; cols.forEach(c => m[r][c] = 0); });
  champsWithTierRanks.forEach(h => {
    Object.entries(h.tierRanks || {}).forEach(([roleCN, tierLabel]) => {
      if (m[tierLabel] && m[tierLabel][roleCN] != null) m[tierLabel][roleCN]++;
    });
  });
  console.log('Tier×职业 矩阵（期望 T0=[7,8,7,17,12,8]）：');
  console.log('       ', cols.map(c => c.padStart(4)).join(' '));
  rows.forEach(r => {
    const line = cols.map(c => String(m[r][c]).padStart(4)).join(' ');
    console.log(r.padStart(3), ' ', line);
  });
}

// 清理描述中的标签
function cleanDesc(s) {
  if (!s) return '';
  return s
    .replace(/<\/?[a-zA-Z]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// === 转换英雄 ===
const champions = [];
const cData = cRaw.data;

// 先用 haidou 原算法重算 global tier（更接近首页真实分级），之后按 role 再分别分配
const haidouInput = Object.keys(cData).map(k => {
  const c = cData[k];
  return { id: c.id, winRate: c.stats && c.stats.winRate, pickRate: c.stats && c.stats.pickRate };
});
const haidouGlobalTier = haidouTierCalc(haidouInput); // Map<id, 1..5>

Object.keys(cData).forEach(k => {
  const c = cData[k];
  if (!c || !c.stats) return;
  const s = c.stats;
  // 每个英雄：如果有多个 role，则每个 role 都单独入列（与 haidou.vip 首页 A 矩阵一致）
  // tier 号：优先使用 haidouTierCalc 重算的 global tier；若缺失则用 stats.tier 兜底
  const tierNum = haidouGlobalTier.get(c.id) || s.tier || 5;
  const tierLabel = tierMap[tierNum] || 'T4';
  const rolesCN = (c.roles || []).map(r => roleMap[r] || r).filter(Boolean);
  const tierRanks = {};
  rolesCN.forEach(rCN => { tierRanks[rCN] = tierLabel; });
  champions.push({
    id: c.id,
    name: c.name,
    title: c.title || '',
    alias: c.alias || '',
    roles: rolesCN,
    tier: tierLabel,
    tierRanks, // { 坦克: 'T0', 战士: 'T0' }
    win: Math.round((s.winRate || 0) * 1000) / 10,
    pick: Math.round((s.pickRate || 0) * 1000) / 10,
    icon: c.iconUrl || ''
  });
});
// 按胜率降序
champions.sort((a, b) => b.win - a.win);

// 打印矩阵校验
printMatrix(champions);

// === 转换海克斯强化 ===
const augments = [];
const aData = aRaw.data;
Object.keys(aData).forEach(k => {
  const a = aData[k];
  if (!a || !a.enabled) return;
  const s = a.stats || {};
  // topChampions 可能是英雄 id 数组或对象
  let topChamps = [];
  if (Array.isArray(a.topChampions)) {
    topChamps = a.topChampions.slice(0, 6).map(tc => {
      if (typeof tc === 'number') {
        const champ = champions.find(c => c.id === tc);
        return champ ? champ.name : '';
      }
      if (tc && tc.name) return tc.name;
      if (tc && tc.id) {
        const champ = champions.find(c => c.id === tc.id);
        return champ ? champ.name : '';
      }
      return '';
    }).filter(Boolean);
  }
  augments.push({
    id: a.id,
    name: a.name,
    rarity: a.rarityDisplayName || '',
    tier: tierMap[s.tier] || 'T4',
    win: Math.round((s.winRate || 0) * 1000) / 10,
    pick: Math.round((s.pickRate || 0) * 1000) / 10,
    icon: a.iconUrl || '',
    desc: cleanDesc(a.description),
    champions: topChamps
  });
});
// 按胜率降序
augments.sort((a, b) => b.win - a.win);

// === 统计 ===
const tierCount = {};
champions.forEach(c => { tierCount[c.tier] = (tierCount[c.tier] || 0) + 1; });

const result = {
  version: cRaw.dataVersion || cRaw.gamePatch || '',
  syncTime: new Date().toISOString().slice(0, 10),
  source: 'haidou.vip + tierCalc 直译',
  total: champions.length,
  augTotal: augments.length,
  tierCount,
  tierRolesOrder: ['坦克','战士','刺客','法师','射手','辅助'],
  tierOrder: ['T0','T1','T2','T3','T4'],
  champions,
  augments
};

fs.writeFileSync('lol-data.json', JSON.stringify(result, null, 2), 'utf8');
console.log('=== 转换完成 ===');
console.log('英雄:', champions.length, '条');
console.log('海克斯:', augments.length, '条');
console.log('Tier分布:', JSON.stringify(tierCount));
console.log('版本:', result.version);
console.log('前3英雄:', champions.slice(0, 3).map(c => `${c.name}(${c.tier},${c.win}%,roles=${c.roles.join('/')})`).join(', '));
console.log('前3海克斯:', augments.slice(0, 3).map(a => `${a.name}(${a.tier},${a.win}%)`).join(', '));
