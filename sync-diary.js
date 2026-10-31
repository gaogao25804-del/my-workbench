/**
 * 同步飞书日记数据：洞悉日记 + 日历 + 任务
 */
const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, timeout: 60000 });
    return JSON.parse(out);
  } catch(e) {
    console.error('CMD FAILED:', cmd.substring(0, 80));
    console.error(e.message?.substring(0, 200));
    return null;
  }
}

// 日记文档列表（按日期排序）
const diaries = [
  { date: '2026-07-21', token: 'I0YudsL8UovZZnx5ZCJc7oSJnPc', title: '2026.7.21日记系统' },
  { date: '2026-07-22', token: 'D7hPdN7sIozu0rxzbtRcXw4Xn6e', title: '2026.7.22日记系统' },
  { date: '2026-07-23', token: 'XTFSdpXifokZ9DxF4M3cWjFpnTb', title: '2026.7.23日记系统' },
  { date: '2026-07-24', token: 'EoEwdqf7oo9Eg9xBIe6cRnYknHh', title: '2026.7.24日记系统' },
  { date: '2026-07-25', token: 'OvILdvPzLoxfeFxHvi0c16S7nLf', title: '2026.7.25日记系统' },
  { date: '2026-07-26', token: 'Twkpd2Vx7ovt9wx5prkcyJwjnHb', title: '2026.7.26日记系统' },
  { date: '2026-07-27', token: 'TrRadzoVooG0lMxE6S1caIsGnMd', title: '2026.7.27日记系统' },
  { date: '2026-07-28', token: 'FJxwd2Earoi7V9xQsRac3vrVnOh', title: '2026.7.28日记系统' },
  { date: '2026-07-29', token: 'Q2iPdTdeWoRhacxcOVjcnQgHnPg', title: '2026.7.29日记系统' },
  { date: '2026-07-30', token: 'NotKdmD3cojWbnxCuMacOUqPnga', title: '2026.7.30日记系统' },
  { date: '2026-07-31', token: 'LYBwdVrDnopGlIxn3Qfcxpx5nHb', title: '2026.7.31日记系统' },
  { date: '2026-08-01', token: 'KQgvd59prohBkkxgkBicv0Dtntg', title: '2026.8.1日记系统' },
];

// 从 XML 中提取纯文本
function extractText(xml) {
  if (!xml) return '';
  return xml
    .replace(/<[^>]+>/g, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 从 outline XML 中找到"洞悉日记"的 block id
function findInsightBlockId(outlineXml) {
  const match = outlineXml.match(/<h1[^>]*id="([^"]+)"[^>]*>洞悉日记<\/h1>/);
  return match ? match[1] : null;
}

// 从洞悉日记 section XML 中提取列表项
function extractInsightItems(sectionXml) {
  if (!sectionXml) return [];
  const items = [];
  // 匹配 <li ...>内容</li>
  const regex = /<li[^>]*>([\s\S]*?)<\/li>/g;
  let match;
  while ((match = regex.exec(sectionXml)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    if (text) items.push(text);
  }
  return items;
}

console.log('=== 开始同步飞书日记数据 ===\n');

// 1. 拉取每篇日记的洞悉日记
const allInsights = [];
const diaryDetails = [];

for (const d of diaries) {
  console.log(`处理: ${d.title} (${d.date})`);

  // 获取 outline 找到洞悉日记的 block id
  const outlineRes = run(`lark-cli docs +fetch --doc "${d.token}" --as user --scope outline --json`);
  if (!outlineRes || !outlineRes.ok) {
    console.log(`  ✗ outline 获取失败`);
    continue;
  }

  const outlineContent = outlineRes.data?.document?.content || '';
  const blockId = findInsightBlockId(outlineContent);

  if (!blockId) {
    console.log(`  ✗ 未找到洞悉日记 section`);
    continue;
  }

  // 获取洞悉日记 section 内容
  const sectionRes = run(`lark-cli docs +fetch --doc "${d.token}" --as user --scope section --start-block-id "${blockId}" --json`);
  if (!sectionRes || !sectionRes.ok) {
    console.log(`  ✗ section 获取失败`);
    continue;
  }

  const sectionContent = sectionRes.data?.document?.content || '';
  const items = extractInsightItems(sectionContent);

  console.log(`  ✓ 提取到 ${items.length} 条洞悉`);

  items.forEach(text => {
    allInsights.push({ date: d.date, text });
  });

  // 同时获取常规日记 section
  const regularMatch = outlineContent.match(/<h1[^>]*id="([^"]+)"[^>]*>常规日记<\/h1>/);
  let regularContent = '';
  if (regularMatch) {
    const regRes = run(`lark-cli docs +fetch --doc "${d.token}" --as user --scope section --start-block-id "${regularMatch[1]}" --json`);
    if (regRes && regRes.ok) {
      regularContent = extractText(regRes.data?.document?.content || '');
    }
  }

  // 获取任务日记记录 section
  const taskMatch = outlineContent.match(/<h1[^>]*id="([^"]+)"[^>]*>任务日记记录<\/h1>/);
  let taskContent = '';
  if (taskMatch) {
    const taskRes = run(`lark-cli docs +fetch --doc "${d.token}" --as user --scope section --start-block-id "${taskMatch[1]}" --json`);
    if (taskRes && taskRes.ok) {
      taskContent = extractText(taskRes.data?.document?.content || '');
    }
  }

  diaryDetails.push({
    date: d.date,
    title: d.title,
    token: d.token,
    url: `https://my.feishu.cn/docx/${d.token}`,
    insights: items,
    regular: regularContent,
    tasks: taskContent,
  });
}

console.log(`\n=== 洞悉日记汇总: 共 ${allInsights.length} 条 ===\n`);

// 2. 拉取日历数据
console.log('拉取日历数据...');
const calRes = run(`lark-cli calendar +agenda --start 2026-07-20 --end 2026-08-02 --as user --json`);
const calendar = [];
if (calRes && calRes.ok && Array.isArray(calRes.data)) {
  calRes.data.forEach(ev => {
    const start = ev.start_time?.datetime || '';
    const date = start.substring(0, 10);
    const existing = calendar.find(c => c.date === date && c.summary === ev.summary);
    if (!existing) {
      calendar.push({
        date,
        summary: ev.summary || '',
        description: ev.description || '',
        start,
        end: ev.end_time?.datetime || '',
        isAllDay: ev.start_time?.datetime?.endsWith('T00:00:00') && ev.end_time?.datetime?.endsWith('T08:00:00'),
        location: ev.location?.name || '',
        link: ev.app_link || '',
        organizer: ev.event_organizer?.display_name || '',
      });
    }
  });
}
console.log(`  ✓ ${calendar.length} 条日历事件`);

// 3. 拉取任务数据（保留完整时间戳）
console.log('拉取任务数据...');
const taskRes = run(`lark-cli task +get-my-tasks --as user --page-all --json`);
const tasks = { pending: [], completed: [] };
if (taskRes && taskRes.ok) {
  const taskData = taskRes.data?.items || [];
  taskData.forEach(t => {
    const item = {
      guid: t.guid || '',
      summary: t.summary || '',
      completed: !!t.completed,
      dueAt: t.due_at || '',
      createdAt: t.created_at || '',
      completedAt: t.completed_at || '',
      url: t.url || '',
    };
    if (item.completed) {
      tasks.completed.push(item);
    } else {
      tasks.pending.push(item);
    }
  });
}
console.log(`  ✓ ${tasks.pending.length} 条待办, ${tasks.completed.length} 条已完成`);

// 4. 保存到 JSON
const result = {
  syncTime: new Date().toISOString(),
  insights: allInsights,
  diaries: diaryDetails,
  calendar,
  tasks,
};

fs.writeFileSync('feishu-diary.json', JSON.stringify(result, null, 2), 'utf8');
console.log(`\n=== 同步完成，保存到 feishu-diary.json ===`);
console.log(`洞悉日记: ${allInsights.length} 条`);
console.log(`日历事件: ${calendar.length} 条`);
console.log(`任务: ${tasks.pending.length} 待办 + ${tasks.completed.length} 已完成`);
