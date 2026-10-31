// sync-library.js — 从飞书「我的图书馆」多维表格拉取书籍数据和封面
// 运行: node sync-library.js  (需要先完成 lark-cli 认证)
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BASE_TOKEN = "SDdGbnIkMaQEUlsXQYTcwVlanie";
const TABLE_ID = "tbl6lKHJylNBa2lu";
const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, "assets", "library");
const OUT_JSON = path.join(ROOT, "library-data.json");
const REL_DIR = "assets/library";

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024, cwd: ROOT, ...opts });
  } catch (e) {
    if (e.stdout && e.stdout.toString().trim()) {
      try {
        const j = JSON.parse(e.stdout.toString());
        if (j.ok) return e.stdout.toString();
      } catch (_) {}
    }
    if (!opts.silent) console.error("  [ERR]", (e.message || "").slice(0, 200));
    return null;
  }
}

function main() {
  console.log("=== 飞书图书馆同步 ===\n");
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. 拉取所有记录
  console.log("[1/3] 拉取书籍记录...");
  let allRows = [];
  let allRecordIds = [];
  let fields = null;
  let pageToken = null;
  let page = 1;

  do {
    let cmd = `lark-cli base +record-list --base-token ${BASE_TOKEN} --table-id ${TABLE_ID} --as user --limit 200 --json`;
    if (pageToken) cmd += ` --page-token ${pageToken}`;
    const raw = run(cmd);
    if (!raw) { console.error(`第 ${page} 页拉取失败`); break; }
    const j = JSON.parse(raw);
    if (!j.ok) { console.error("API 错误:", JSON.stringify(j).slice(0, 300)); break; }

    if (!fields) fields = j.data.fields;
    allRows = allRows.concat(j.data.data);
    allRecordIds = allRecordIds.concat(j.data.record_id_list);
    pageToken = j.data.has_more ? (j.data.page_token || null) : null;
    if (pageToken) { process.stdout.write(`  第 ${page} 页: +${j.data.data.length} 条\n`); page++; }
  } while (pageToken);

  console.log(`  共 ${allRows.length} 条记录`);

  const titleIdx = fields.indexOf("书名");
  const authorIdx = fields.indexOf("作者");
  const thinkIdx = fields.indexOf("个人思考");
  const dateIdx = fields.indexOf("阅读日期");
  const outlineIdx = fields.indexOf("大纲");
  const coverIdx = fields.indexOf("封面");

  // 2. 处理记录和下载封面
  console.log("[2/3] 处理封面...");
  const books = [];
  let dlCount = 0, failCount = 0, skipCount = 0;

  allRows.forEach((row, i) => {
    const recId = allRecordIds[i];
    const title = (row[titleIdx] || "未命名书籍").toString().trim();
    const author = (row[authorIdx] || "佚名").toString().trim();
    const think = (row[thinkIdx] || "").toString().trim();
    const dateRaw = row[dateIdx];
    const outline = (row[outlineIdx] || "").toString().trim();
    const atts = row[coverIdx];

    const safeName = title.replace(/[\\/:*?"<>\|\s]/g, "_").slice(0, 40);
    let coverFile = "";
    let fileToken = "";

    if (Array.isArray(atts) && atts.length > 0) {
      fileToken = atts[0].file_token;
      const ext = (atts[0].name || "cover.jpg").split(".").pop().toLowerCase();
      coverFile = `${safeName}_${recId.slice(-4)}.${ext}`;
      const relPath = path.join(REL_DIR, coverFile);
      const absPath = path.join(ROOT, relPath);

      if (!fs.existsSync(absPath)) {
        const dl = run(`lark-cli base +record-download-attachment --base-token ${BASE_TOKEN} --table-id ${TABLE_ID} --record-id ${recId} --file-token ${fileToken} --as user --output "${relPath}" --overwrite`, { silent: true });
        if (dl === null) {
          // Try without --overwrite
          const dl2 = run(`lark-cli base +record-download-attachment --base-token ${BASE_TOKEN} --table-id ${TABLE_ID} --record-id ${recId} --file-token ${fileToken} --as user --output "${relPath}"`, { silent: true });
          if (dl2 === null) {
            coverFile = "";
            fileToken = "";
            failCount++;
            process.stdout.write("✗");
          } else {
            dlCount++;
            process.stdout.write(".");
          }
        } else {
          dlCount++;
          process.stdout.write(".");
        }
      } else {
        skipCount++;
      }
    }

    books.push({
      id: recId,
      title,
      author,
      think,
      date: dateRaw ? dateRaw.split(" ")[0] : "",
      outline,
      cover: coverFile ? `${REL_DIR}/${coverFile}` : "",
      hasCover: !!coverFile,
      fileToken
    });
  });
  console.log(`\n  下载: ${dlCount} 成功, 跳过: ${skipCount} 已存在, 失败: ${failCount}`);

  // 3. 保存 JSON
  console.log("[3/3] 保存数据...");
  const output = {
    syncTime: new Date().toISOString(),
    total: books.length,
    books
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2), "utf8");
  console.log(`\n完成！共 ${books.length} 本书`);
  console.log(`数据: ${OUT_JSON}`);
  console.log(`封面: ${OUT_DIR}`);
}

main();
