# 工作台协作边界

> 两个 agent 各管一摊：不互相评审、不互相留言、不互相等待。文件归属写死在下面，越界就算错。

## 一、各管各的

| 角色 | 只负责 | 不碰 |
|---|---|---|
| **WorkBuddy** | `content/` 下的口播稿与笔记（`drafts/`、`notes/`）；自己发布上线 | 站点代码、数据文件、`topics.json` |
| **Trae** | 站点本身：`index.html`、`assets/`、`tools/`；数据文件：`topics.json`、`videos-data.json`、`feishu-data.json`、`library-data.json`、`radar-data.json` | 任何文案稿子 |
| **你（老板）** | 挑选题、定稿、拍摄发布、导数据 | — |

**文案一律由 WorkBuddy 写。Trae 不写稿、不评稿、不改稿**，工作台只负责把内容展示出来。

## 二、文件归属

```
content/drafts/  content/notes/   WorkBuddy 的地盘
content/topics.json               Trae 写（雷达打分结果）→ WorkBuddy 只读
index.html  assets/               Trae 的地盘
videos-data.json  feishu-data.json  library-data.json  radar-data.json   Trae 的地盘
tools/                            Trae 的地盘（publish.py 是两边共用的发布器）
```

铁律：**只改自己地盘的文件**。跨界的活由老板决定派给谁。

## 三、topics.json 结构

```json
{
  "updated_at": "2026-11-13",
  "topics": [
    {
      "id": "t001",
      "title": "荣耀 700 系列今天发布，三款怎么选",
      "brand": "荣耀",
      "event_date": "2026-11-13",
      "status": "hot",
      "score": 92,
      "scores": { "rel": 4, "fresh": 5, "shoot": 4, "dispute": 3, "crowd": 3 },
      "angle": "拍给纠结 700S 还是 700 Pro 的人看",
      "facts": ["事实要点一", "事实要点二"],
      "sources": ["https://..."],
      "picked": false,
      "notes": ""
    }
  ]
}
```

字段说明：

- `status`：`hot`（时效热点）或 `evergreen`（常青选题）
- `score`：0–100，五个维度加权算出来的
- `scores`：`rel` 赛道相关 / `fresh` 时效 / `shoot` 可拍性 / `dispute` 争议度 / `crowd` 竞品饱和度（**分越高越挤，是减分项**），每项 0–5
- `facts`：已经核实过的事实要点，**WorkBuddy 只能引用这里，不要自己补**
- `picked`：老板挑中后置 `true`

评分公式（Trae 执行，WorkBuddy 只读）：

```
total = rel*8 + fresh*8 + shoot*6 + dispute*5 + (5-crowd)*3
score = round(total / 150 * 100)
```

满分 150，折算百分制。

## 四、口播稿结构

文件名：`content/drafts/<日期>-<短标题>.md`

```markdown
# 选题：荣耀 700 系列今天发布

- topic_id: t001
- 日期: 2026-11-13
- 目标时长: 80–100s
- 状态: draft

## 钩子（0–3 秒）
一句话，必须是反常识 / 利益 / 冲突。

## 正文
**一整段**，不分段、不编号、不用小标题。2–3 个信息点顺着说下来，
像语音转文字，可以自问自答，不念参数表。

## 结尾
一句行动号召。

## 标题备选
1. …
2. …
3. …

## 素材清单
- 需要拍的东西
- 需要截图的页面
```

硬要求：

- **不许编事实**。`facts` 里没有的数据、价格、参数，一律不写
- 不许写「众所周知」「随着科技的发展」这类废话开头
- 参数要翻译成人话，不说「搭载 2nm 制程」，说「这颗芯片今年只有两台手机用上」
- 目标 **80–100 秒、520–700 字**，正文一整段（老板反复退回过，这条不许改回 220–260 字那套）

## 五、战报（每月视频数据统计）

老板 2026-11-13 的活：「战报那个没有任何意义，全删掉，把每个月的数据填进去，格式照抄我的表格」。
旧的合格率 / 公式热力表那一版**整块删掉了**，别再恢复。

**数据只有一个文件**：`content/report/index.json`，由 `tools/build-report.py` 从「X月视频数据统计.xlsx」生成。

```bash
py -3 tools/build-report.py                                    # 用桌面上的 9月/10月 两个表
py -3 tools/build-report.py "C:/path/11月视频数据统计.xlsx"      # 新月份单独加
```

- 页面结构照表格的 sheet 顺序：**① 整体大盘 → ② 引流 vs 内容 → ③ 全部明细 → ④ TOP10 → ⑤ 总结**
- 指标口径跟表格一致：只统计「审核状态 = 公开」；汇总表里已经算好的数值**原样照抄**，
  哪一格空着（比如 10 月汇总还没填）才自己按明细补算，补算结果要能对上「总结」里那句官方数字
- 明细一条不删，列跟 Excel 一样多，表格里横向滚
- 代码归属：`assets/workbench.js` 的 `renderReportPage` 与 `rrp*` 函数、css 里 `rrp-*` 段、
  `index.html` 的 `data-nav="report"` 与 `navReportCount`。Trae 要动先问老板

`videos-data.json`（1056 条作品台账）文件保留，但**战报页不再读它**，页面侧已经不引用了。
那不是这一版的东西，别往 `renderReportPage` 里加回排行榜、过线率、热力表。

## 六、部署（两边权限相同，各发各的）

线上 <https://gaogao25804-del.github.io/my-workbench/>，GitHub Pages **从 `gh-pages` 分支发布**。
`main` 是源码分支，`gh-pages` 是线上分支。**两个都要写，只写 `main` 线上不会变。**

权限已核实（2026-11-13）：本机这份 GitHub 凭据对该仓库是 **admin**（`admin` / `maintain` / `push` 全开），`main` 和 `gh-pages` 都能直接推，没有分支保护。WorkBuddy 用的是同一份凭据，**不需要 Trae 代发，也不需要任何人审批**。

发布统一走仓库自带的脚本，不要自己拼 API 调用：

```bash
py -3 tools/publish.py <你改过的文件...> -m "一句话说明"
```

脚本干四件事：

1. 只把**点名的文件**打成 blob，不会用你本地的旧版本覆盖别人的改动
2. 每次写之前重读分支 head
3. 被抢先（非快进）就重读最新版本自动重试，最多 5 次
4. 写完触发 Pages 重建

铁律：

- **只发布你改过的文件**，禁止 `git add .`、禁止整树覆盖
- **禁止 force push**，撞车了脚本自己重来
- 第一次用先自检：`py -3 tools/publish.py --check`
- 发完等 30~60 秒再看线上，CDN 有缓存
- token 不用手配：同机运行时脚本从 git 凭据里自动读；异地运行才需要设环境变量 `GITHUB_TOKEN`
- **例外（已批准）**：无人值守的定时任务（`选题雷达/radar_run.py`，每天 10:20）可以自己拼 API 直推，只点 `radar-data.json` 一个文件、`main` + `gh-pages` 都推。定时任务不需要改成调 `publish.py`，保持现状。

## 七、当前站点结构

侧栏分两个大类，一次只显示一组。编号在每个大类内部重新排。

| 大类 | 区块 | 状态 |
|---|---|---|
| 创作线 | 今日雷达 | 已上线，`radar-data.json`（今天）+ `content/radar/` 一天一份存档 |
| 创作线 | 口播工坊 | 已上线，老板直接写、自己定稿（改的是浏览器本地，见第十节） |
| 创作线 | 成品文案 | 已上线，`content/library/index.json`，存完整成片的施工图 |
| 创作线 | 战报 | 已上线，`content/report/index.json`（9 月 / 10 月，照老板的 Excel） |
| 工具箱 | 任务与日历 | 已上线，993 条飞书任务 |
| 工具箱 | 图书馆 | 已上线，63 本书 |
| 工具箱 | 像素工坊 | 已上线 |
| 工具箱 | 画板 | 已上线 |

已下线：旧的「文案库」区块（Trae 早前那版，整块删掉了，不用恢复）。

**注意：2026-11-13 上线的「成品文案」是另一件事**，老板直接派的活，见第九节。

## 八、不做的事

- 不互评、不互改、不互相留言、不等对方审阅
- 不让老板在中间转述内容；谁要动对方的文件，先问老板
- 不做任何「双 agent 流水线」「交叉评审」「共享信箱」之类的机制

## 九、成品文案库（content/library/）

老板要的「专门存完成文案的地方」，2026-11-13 上线。存的不是草稿，是**完整成片的施工图**：
分几段、每段几秒、这段的功能是什么、画面拍什么、嘴里说什么、BGM/字幕/话题/封面怎么设。

数据只有一个文件：`content/library/index.json`

```json
{
  "updated_at": "2026-11-13",
  "items": [{
    "id": "2026-11-13-iphone20-anniversary",
    "title": "iPhone20 苹果20周年纪念款",
    "kind": "爆料 · 概念机",
    "duration": "2分20秒",
    "date": "2026-11-13",
    "source": "老板提供的成品",
    "note": "这条可抄的点，一两句",
    "segments": [
      { "t": "0–6s", "role": "黄金钩子 · 强抓眼球", "visual": "画面拍什么", "vo": "口播原文" }
    ],
    "extra": [{ "k": "BGM", "v": "科技类轻快，音量低于人声" }]
  }]
}
```

规矩：

- 只收**老板认可的成品**。测试稿、被退的稿不进，别把草稿混进来
- `segments` 按时间顺序，`role` 写**功能**不写内容（写「争议 + 干货」，不写「讲渲染图」）
- `visual` 可以为空（原文没写画面就留空，前端会跳过这行）
- 代码归 WorkBuddy：`assets/` 里 `wn-*` 那段 css/js、`index.html` 的 `data-nav="wenan"` 与 `navWenanCount`。
  **Trae 不要删、不要重命名这一块**，要动先问老板
- 加新条目只要往 `items` 里追加一个对象，不用碰代码

## 十、口播工坊与雷达存档（2026-11-13 改版）

老板当天的三条要求：选题池挪进雷达、候选池按天存一份、口播工坊要能自己写、定稿必须他点。
以下三条是硬规矩。

### 1. 定稿只能老板点

`content/drafts/index.json` 里 **`status` 永远写 `draft`**，谁写 `final` 谁违规。
页面上只有老板按了「标为定稿」才进定稿泳道，那一下只存在他浏览器里，不回写仓库。
稿子合格与否由老板判，我们不自评、不代判——上一条 11-13 的稿子就是被我写成 final 塞进去的，
老板原话：「你写的那个定稿在我这都没合格呢」。

### 2. 口播工坊是编辑器，不落仓库

- 数据两层：仓库 `content/drafts/index.json`（我们放进去的素材，只读）+ 浏览器 `localStorage`
  键 `wb.kb.docs.v2`（老板自己写的、自己改的）
- 改一个字就自动存本地，换设备要挪稿子只能点「复制全文」
- 远端那篇一改就落成本地副本（保留 `file` 字段），仓库里的原文件不动
- 代码归属：`assets/workbench.js` 里 `kb*` 开头的新函数（`renderKouboPage` / `mountKoubo` /
  `kbDocs` / `kbStartFrom`…）与 css 里 `08 · 口播工坊改版` 那一段，归 WorkBuddy

### 3. 雷达一天存一份

- `content/radar/YYYY-MM-DD.json`：当天的候选（雷达 + 公众号合并、按分数排序）
- `content/radar/index.json`：日期清单，`days[]` 按日期倒序，最多 120 天
- 生成方式只有一个：`py -3 tools/archive-radar.py --config "<选题雷达>/radar-config.json"`，
  定时任务 `运行雷达.bat` 跑完抓取和公众号之后作为第三步自动调它
- 页面日期条只读 `index.json`，点哪天读哪天的文件；未来两天只显示「10:20 自动抓」
- **别手工改 index.json**，重跑脚本会覆盖

选题池已经不在口播工坊了：雷达候选行右边点「写」，直接开一条空稿跳进编辑器。
代码归属：`rdc*` 开头的函数与 css 里 `09 · 每日雷达改版` 那一段，归 WorkBuddy。
