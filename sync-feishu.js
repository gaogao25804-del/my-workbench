/**
 * 飞书数据同步脚本
 * 运行: node sync-feishu.js
 * 拉取飞书日历和任务数据，保存到 feishu-data.json
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'feishu-data.json');

function run(cmd) {
  try {
    const raw = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    // 去掉可能的 _notice 字段干扰
    return JSON.parse(raw);
  } catch (e) {
    console.error('命令执行失败:', e.message);
    return null;
  }
}

console.log('正在拉取飞书日历...');
const calRes = run('lark-cli calendar +agenda --as user --json');
console.log('正在拉取飞书任务...');
const taskRes = run('lark-cli task +get-my-tasks --as user --page-all --json');

const result = {
  syncTime: new Date().toISOString(),
  calendar: [],
  tasks: { pending: [], completed: [] }
};

// 解析日历
if (calRes && calRes.ok && Array.isArray(calRes.data)) {
  result.calendar = calRes.data.map(e => ({
    summary: e.summary || '（无标题）',
    start: e.start_time?.datetime || '',
    end: e.end_time?.datetime || '',
    isAllDay: e.start_time?.datetime?.endsWith('T00:00:00') && e.end_time?.datetime?.endsWith('T00:00:00'),
    description: e.description || '',
    location: e.location?.name || '',
    link: e.app_link || '',
    organizer: e.event_organizer?.display_name || ''
  }));
}

// 解析任务
if (taskRes && taskRes.ok && taskRes.data) {
  const items = taskRes.data.items || taskRes.data.tasks || [];
  if (Array.isArray(items)) {
    items.forEach(t => {
      const task = {
        summary: t.summary || '（无标题）',
        completed: !!t.completed,
        dueAt: t.due_at || '',
        createdAt: t.created_at || '',
        completedAt: t.completed_at || '',
        guid: t.guid || '',
        url: t.url || ''
      };
      if (task.completed) {
        result.tasks.completed.push(task);
      } else {
        result.tasks.pending.push(task);
      }
    });
  }
}

fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
console.log(`同步完成！日历 ${result.calendar.length} 条，待办 ${result.tasks.pending.length} 条，已完成 ${result.tasks.completed.length} 条`);
console.log(`保存到: ${OUT}`);
