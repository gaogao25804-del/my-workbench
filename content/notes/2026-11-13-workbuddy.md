# WorkBuddy → Trae 留言 · 2026-11-13 12:50

## 这次动了界面文件，先说明

口播工坊原来是个空壳（`renderKouboPage` 里写着「内容留空，等数据接入后再填」），稿子在仓库里但界面不知道，老板打开看不到任何一篇，所以觉得"两个 agent 没联动、白做"。

我把它接上了。**动了 `index.html` + `assets/workbench.js` + `assets/workbench.css` 三个文件**，按协议先留话。

### 改的函数（js）
- 新增 `loadDrafts()` — 拉 `content/drafts/index.json`
- 重写 `renderKouboPage()` — 三条泳道不再是死空态
- 新增 `mountKoubo()` — 卡片点击 / 念稿浮层 / 复制
- 新增 `kbLane()` `kbFind()` `kbBody()` `kbParas()` `kbWords()` `kbDur()` `kbDocHtml()` `kbIdeaHtml()` `kbReadHtml()` `kbFallbackCopy()`
- 新增常量 `KB`（界面状态）、`KB_LANES`（改成带 tip 的版本）
- `st` 增加 `drafts` / `load.drafts` / `err.drafts`
- `renderView()` 里加 `mountKoubo()` 和 `if (st.load.drafts === 'idle') loadDrafts();`

### 改的 index.html
只有一行：侧栏口播工坊加 `<span class="nav-count" id="navKouboCount">—</span>`。

### 改的 css
只追加到文件末尾，`/* 口播工坊：稿子卡片 + 念稿浮层 */` 一段。新类全部前缀 `kb-`，
没改任何既有的 `.kb-*` 规则，没新增色系，只用 `--surface/--line/--accent/--ink` 这些既有 token。

## 数据契约（我这边维护）

`content/drafts/index.json` 我每写一篇稿就更新，字段：

```json
{
  "file": "content/drafts/xxx.md",
  "date": "2026-11-13",
  "title": "标题",
  "topic_id": "",
  "hook": "钩子一句话",
  "words": 695,
  "duration_sec": 95,
  "status": "draft",          // draft | final，决定落哪条泳道
  "publish_at": "19:00",
  "device": "iPhoneduo"
}
```

界面读的就是这一个文件。**你那边如果要加筛选、状态流转、发布打勾，直接按这个结构做，我不会改字段。**

## 选题池是怎么来的

不是空的。`kbIdeaHtml()` 读 `st.radar.picks` 里 `score >= 5` 的前 4 条，点标题直接跳原文。
所以链路是：雷达抓 → 够分的自动进选题池 → 老板点一条 → 我出稿 → 落草稿泳道 → 点开就能念。

## 还有两件事想请你确认

1. **`videos-data.json` 两个分支都 404，但战报页有数据**（74% / 本月 111 条 / 待归类 663）。
   数据是不是换路径了？协议第五节还写着这个文件和 1056 条，已经过期。我要读它算合格率。
2. **协议第四节和老板的要求打架**：它写「目标 60 秒 ≈ 220–260 字」「正文分 2–3 段」，
   老板一直是 **520–700 字 / 1 分 20–1 分 40 / 不分段不编号**。建议改掉，我没单方面动 `protocol.md`。
