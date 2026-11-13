# 工作台内容协作协议

> 这份文档是 Trae 和 WorkBuddy 之间的接口约定。两个 agent 不共享对话上下文，**只靠仓库里的文件传话**。任何一方改接口，必须先改这份文档。

## 一、角色

| 角色 | 负责 | 不负责 |
|---|---|---|
| **Trae** | 界面/交互/样式、联网抓热点、打分排序、写 `content/topics.json`、维护 `videos-data.json` | 写口播逐字稿 |
| **WorkBuddy** | 内容与数据、读选题池、写口播逐字稿到 `content/drafts/` | 抓热点、改 `topics.json` 与 `videos-data.json` |
| **你（老板）** | 挑选题、润色稿子、拍摄发布、导数据回来 | — |

**两人平级**：都有 `main` + `gh-pages` 的发布权，发布方式见第六节。

## 二、接口文件

```
content/
  topics.json          选题池        Trae 写 → WorkBuddy 读
  drafts/
    2026-11-13-荣耀700.md   口播稿   WorkBuddy 写 → 老板读
  protocol.md          本文件        双方只读
videos-data.json       已发作品数据   Trae 写 → WorkBuddy 读
```

铁律：**谁写的文件谁改**。WorkBuddy 不要改 `topics.json` 和 `videos-data.json`，Trae 不要改 `drafts/`。
要配合直接走第八节的总线，不经过老板转发。

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
- 每次老板导新数据，Trae 重跑脚本更新，WorkBuddy 的「战报」自动反映
- **核对文件在不在，别用 `raw.githubusercontent.com`**：本机 DNS 解析不了这个域名，报的是连接失败，不是 404。用 `api.github.com/repos/gaogao25804-del/my-workbench`（公开仓库，200）或直接访问上面的线上地址。

## 六、部署（同级：Trae 和 WorkBuddy 都有发布权）

线上 <https://gaogao25804-del.github.io/my-workbench/>，GitHub Pages **从 `gh-pages` 分支发布**。
`main` 是源码分支，`gh-pages` 是线上分支。**两个都要写，只写 `main` 线上不会变。**

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

权限同级，但**文件归属不变**（见第二节）：谁写的文件谁改。要配合直接走第八节的总线，由老板转达是下下策。

## 七、当前站点结构

侧栏分两个大类，一次只显示一组。编号在每个大类内部重新排。

| 大类 | 区块 | 状态 |
|---|---|---|
| 创作线 | 今日雷达 | 已上线，`radar-data.json` 每天 10:20 抓取 |
| 创作线 | 口播工坊 | 骨架已上线，待接 `topics.json` |
| 创作线 | 战报 | 已上线，`videos-data.json` 1056 条 |
| 工具箱 | 任务与日历 | 已上线，993 条飞书任务 |
| 工具箱 | 图书馆 | 已上线，63 本书 |
| 工具箱 | 像素工坊 | 已上线 |
| 工具箱 | 画板 | 已上线 |

已下线：文案库（整块删除，别再往 `assets/` 里加相关代码）。

## 八、直连总线（Trae ↔ WorkBuddy）

两边不经过老板，直接往同一个本地信箱写。消息存在仓库根 `.bus/messages.json`，**不进 git、不上线**。
前提：两个 agent 跑在同一条磁盘上（同一个仓库目录）。

```bash
py -3 tools/bus.py inbox --as trae        # 收自己的未读（另一侧换成 --as workbuddy）
py -3 tools/bus.py say --as trae --to workbuddy "正文"
py -3 tools/bus.py log                    # 看最近全部
py -3 tools/bus.py serve                  # 本地网页 http://127.0.0.1:8788
```

规矩：

- **开工第一件事 `inbox`**，收工前把该说的 `say` 出去。看完自动标记已读，不会重复提醒。
- 一条消息只说一件事，带上文件名和行号。不写「你看一下那个」。
- 需要对方动手才发，纯通知不发。不复述背景 300 字。
- 老板随时可以 `serve` 打开网页看全部往来，也能自己插一句（发件人选「老板」）。
