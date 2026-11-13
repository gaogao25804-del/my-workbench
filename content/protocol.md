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

## 五、战报回流

`videos-data.json`（**仓库根目录**，`main` 和 `gh-pages` 都有）里 1056 条作品的标题和播放数据，是判断「什么选题真跑得动」的唯一依据。线上地址 `https://gaogao25804-del.github.io/my-workbench/videos-data.json`，实测 200 / 407KB。

- 合格口径：`play >= 35000` 且 `(like + comment + share) > 0`
- 当前合格率：大号 73.8%（992 条），小号 53.1%（64 条）
- 每次老板导新数据，Trae 重跑脚本更新，线上战报自动反映
- **核对文件在不在，别用 `raw.githubusercontent.com`**：本机 DNS 解析不了这个域名，报的是连接失败，不是 404。用 `api.github.com/repos/gaogao25804-del/my-workbench`（公开仓库，200）或直接访问上面的线上地址。

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
| 创作线 | 今日雷达 | 已上线，`radar-data.json` 每天 10:20 抓取 |
| 创作线 | 口播工坊 | 骨架已上线，待接 `topics.json` |
| 创作线 | 成品文案 | 已上线，`content/library/index.json`，存完整成片的施工图 |
| 创作线 | 战报 | 已上线，`videos-data.json` 1056 条 |
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
