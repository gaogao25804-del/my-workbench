/**
 * 飞书数据同步脚本（数据源 = 飞书多维表格「工作任务日志」）
 * 运行: node sync-feishu.js
 * 拉取表内全部记录，生成 feishu-data.json 供网页读取
 */
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE_TOKEN = 'WppobuE1VabhqlsgSKbc8vILnvd';
const TABLE_ID = 'tblwFUFemR43pPTp';
const OUT = path.join(__dirname, 'feishu-data.json');
const RAW = path.join(os.tmpdir(), 'feishu-base-export.ndjson');

const FIELDS = ['日期', '时间', '任务内容', '任务类型', '状态'];

console.log('正在拉取飞书多维表格...');
const fieldArgs = FIELDS.map(f => `--field-id "${f}"`).join(' ');
execSync(
  `lark-cli base +record-list --base-token ${BASE_TOKEN} --table-id ${TABLE_ID} ` +
  `${fieldArgs} --limit 2000 --format ndjson --output "${RAW}" --as user`,
  { encoding: 'utf8', stdio: 'inherit', maxBuffer: 10 * 1024 * 1024 }
);

const lines = fs.readFileSync(RAW, 'utf8').split(/\r?\n/).filter(l => l.trim());
const recs = lines.map(l => JSON.parse(l));

function day10(v) { return v ? String(v).slice(0, 10) : ''; }

function dateTime(v, date) {
  if (!v) return date + ' 00:00:00';
  const m = String(v).match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  return (m ? m[0] : day10(v) + ' 00:00:00').replace('T', ' ');
}

const tasks = [];
for (const r of recs) {
  const summary = String(r['任务内容'] || '').trim();
  const date = day10(r['日期']);
  if (!summary || !date) continue;
  const cat = Array.isArray(r['任务类型']) && r['任务类型'].length ? String(r['任务类型'][0]) : '其他';
  const state = Array.isArray(r['状态']) && r['状态'].length ? String(r['状态'][0]) : '';
  tasks.push({
    id: 'task-' + date + '-' + String(r.record_id || '').slice(-6).toLowerCase(),
    summary: summary,
    status: state === '已完成' ? 'completed' : 'pending',
    category: cat,
    completed_at: dateTime(r['时间'], date),
    due: null,
    url: null
  });
}

tasks.sort((a, b) => String(a.completed_at).localeCompare(String(b.completed_at)));

const byDateMap = {};
tasks.forEach(t => {
  const d = t.completed_at.slice(0, 10);
  byDateMap[d] = (byDateMap[d] || 0) + 1;
});
const byDate = Object.keys(byDateMap).sort().map(d => ({ date: d, count: byDateMap[d] }));

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const updated_at = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
  ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

fs.writeFileSync(OUT, JSON.stringify({
  updated_at: updated_at,
  tasks: { all: tasks },
  calendar: { events: [], byDate: byDate }
}, null, 2) + '\n', 'utf8');

const completed = tasks.filter(t => t.status === 'completed').length;
console.log(`同步完成！共 ${tasks.length} 条（已完成 ${completed}），` +
  `${byDate[0] ? byDate[0].date : '—'} ~ ${byDate.length ? byDate[byDate.length - 1].date : '—'}`);
console.log(`保存到: ${OUT}`);
