# -*- coding: utf-8 -*-
"""雷达存档：把今天的抓取结果存成一天一份，给工作台的日期条用。

读的是 GitHub 上已有的 radar-data.json + wechat-feed.json（跟线上一致），
合成 content/radar/YYYY-MM-DD.json，再更新 content/radar/index.json，
main 和 gh-pages 一起推。

用法：
    py -3 tools/archive-radar.py --config "<选题雷达>/radar-config.json"
    py -3 tools/archive-radar.py --config ... --dry      只看结果不推
    py -3 tools/archive-radar.py --config ... --date 2026-11-12   补某一天（用当前线上数据）
"""
import argparse
import base64
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone, timedelta

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CST = timezone(timedelta(hours=8))
API = "https://api.github.com/repos/%s/contents/%s"


def gh(method, url, payload, token):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "radar-archiver",
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode() or "{}")


def get_json(cfg, path, branch):
    try:
        d = gh("GET", (API % (cfg["repo"], path)) + "?ref=" + branch, None, cfg["token"])
    except Exception:
        return None
    return json.loads(base64.b64decode(d["content"]).decode("utf-8"))


def put_file(cfg, path, text, branch, msg):
    api = API % (cfg["repo"], path)
    body = {
        "message": msg,
        "content": base64.b64encode(text.encode("utf-8")).decode(),
        "branch": branch,
    }
    try:
        old = gh("GET", api + "?ref=" + branch, None, cfg["token"])
        body["sha"] = old["sha"]
    except Exception:
        pass
    r = gh("PUT", api, body, cfg["token"])
    return r["commit"]["sha"][:8]


def merge(radar, wechat):
    out = []
    for p in (radar or {}).get("picks", []):
        out.append({
            "title": p.get("title", ""), "source": p.get("source", ""),
            "kind": p.get("kind", ""), "score": p.get("score", 0),
            "hooks": p.get("hooks", []), "url": p.get("url", ""), "from": "",
        })
    for p in (wechat or {}).get("picks", []):
        out.append({
            "title": p.get("title", ""), "source": p.get("account", "公众号"),
            "kind": "公众号", "score": p.get("score", 0),
            "hooks": (p.get("why") or [])[:2], "url": p.get("url", ""), "from": "公众号",
        })
    seen, uniq = set(), []
    for p in out:
        k = p["title"][:18]
        if not k or k in seen:
            continue
        seen.add(k)
        uniq.append(p)
    uniq.sort(key=lambda x: -(x.get("score") or 0))
    return uniq


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--date", default="")
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()

    with open(a.config, encoding="utf-8") as f:
        cfg = json.load(f)
    branch = cfg.get("branch", "main")
    mirror = cfg.get("mirror_branch")
    date = a.date or datetime.now(CST).strftime("%Y-%m-%d")

    radar = get_json(cfg, "radar-data.json", branch)
    wechat = get_json(cfg, "wechat-feed.json", branch)
    if not radar:
        raise SystemExit("线上读不到 radar-data.json，先跑一次 radar_run.py")

    picks = merge(radar, wechat)
    payload = {
        "date": date,
        "updated": radar.get("updated", ""),
        "stats": radar.get("stats", {}),
        "picks": picks,
        "meme": radar.get("meme", []),
        "counts": {
            "picks": len(picks),
            "shootable": len([p for p in picks if (p.get("score") or 0) >= 5]),
            "meme": len(radar.get("meme", [])),
            "wechat": len((wechat or {}).get("picks", [])),
        },
    }

    # 本地也留一份，免得只有线上有
    out_dir = os.path.join(ROOT, "content", "radar")
    os.makedirs(out_dir, exist_ok=True)
    day_text = json.dumps(payload, ensure_ascii=False, indent=1)
    with open(os.path.join(out_dir, date + ".json"), "w", encoding="utf-8") as f:
        f.write(day_text)

    idx_text = ""
    idx_path = os.path.join(out_dir, "index.json")
    index = {"updated_at": date, "days": []}
    if os.path.exists(idx_path):
        try:
            with open(idx_path, encoding="utf-8") as f:
                index = json.load(f)
        except Exception:
            index = {"updated_at": date, "days": []}
    days = [x for x in index.get("days", []) if x.get("date") != date]
    days.append({
        "date": date,
        "updated": payload["updated"],
        "picks": payload["counts"]["picks"],
        "shootable": payload["counts"]["shootable"],
        "meme": payload["counts"]["meme"],
        "wechat": payload["counts"]["wechat"],
    })
    days.sort(key=lambda x: x["date"], reverse=True)
    index = {"updated_at": date, "days": days[:120]}
    idx_text = json.dumps(index, ensure_ascii=False, indent=1)
    with open(idx_path, "w", encoding="utf-8") as f:
        f.write(idx_text)

    print("%s 存档：候选 %d 条，能拍 %d 条，热梗 %d 个，公众号 %d 条"
          % (date, payload["counts"]["picks"], payload["counts"]["shootable"],
             payload["counts"]["meme"], payload["counts"]["wechat"]))

    if a.dry:
        print("--dry，跳过推送")
        return

    branches = [branch] + ([mirror] if mirror and mirror != branch else [])
    for br in branches:
        s1 = put_file(cfg, "content/radar/%s.json" % date, day_text, br,
                      "chore(radar): 存档 %s" % date)
        s2 = put_file(cfg, "content/radar/index.json", idx_text, br,
                      "chore(radar): 更新存档清单 %s" % date)
        print("  [%s] %s / %s" % (br, s1, s2))
    print("完成：%s 天，最新 %s" % (len(index["days"]), index["days"][0]["date"]))


if __name__ == "__main__":
    main()
