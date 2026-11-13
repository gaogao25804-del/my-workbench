#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
共用发布脚本 · Trae 和 WorkBuddy 都用这一个，别再各写一套。

它只做一件事：把你点名的几个文件，推到 main 和 gh-pages，然后触发 Pages 重建。

设计上避开两个坑：
  1. 只提交你点名的路径（tree 里只放这些文件），不会用本地旧文件把别人的改动盖掉；
  2. 每次写之前重新读分支最新 head，遇到「不是快进」就重新读一遍再来，最多 5 次，
     两个 agent 同时发布也不会互相打断。

token 不写在仓库里，运行时从 git 凭据里取（或读环境变量 GITHUB_TOKEN）。

用法：
    py -3 tools/publish.py index.html assets/workbench.css -m "改了侧栏"
    py -3 tools/publish.py radar-data.json -m "更新雷达" --branches main
    py -3 tools/publish.py index.html --check        # 只检查 token 和分支，不写任何东西
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

OWNER = "gaogao25804-del"
REPO = "my-workbench"
API = "https://api.github.com/repos/%s/%s" % (OWNER, REPO)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def token():
    t = os.environ.get("GITHUB_TOKEN", "").strip()
    if t:
        return t
    try:
        out = subprocess.run(
            ["git", "credential", "fill"],
            input="protocol=https\nhost=github.com\n\n",
            capture_output=True, text=True, check=True,
        ).stdout
    except Exception:
        out = ""
    for line in out.splitlines():
        if line.startswith("password="):
            return line[len("password="):].strip()
    sys.exit("找不到 GitHub token。请先在本机登录过 GitHub（git credential），或设置环境变量 GITHUB_TOKEN。")


TOKEN = token()


def gh(method, url, body=None, retries=6):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    last = None
    for i in range(retries):
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", "Bearer " + TOKEN)
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("X-GitHub-Api-Version", "2022-11-28")
        req.add_header("User-Agent", "workbench-publish")
        if data:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                txt = r.read().decode("utf-8")
                return json.loads(txt) if txt else {}
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "ignore")[:200]
            last = RuntimeError("%s %s -> %s %s" % (method, url.replace(API, ""), e.code, detail))
            # 5xx / 400 / 422 值得重试；其余直接抛
            if e.code not in (400, 422, 500, 502, 503, 504):
                raise last
        except Exception as e:  # 网络抖动
            last = e
        time.sleep(2 + i * 1.5)
    raise last


def blob_for(path):
    with open(path, "rb") as f:
        buf = f.read()
    b = gh("POST", API + "/git/blobs", {"content": base64.b64encode(buf).decode("ascii"), "encoding": "base64"})
    print("  blob %-32s %8d 字节  %s" % (os.path.relpath(path, ROOT).replace("\\", "/"), len(buf), b["sha"][:8]))
    return b["sha"]


def publish(branch, tree, message):
    for attempt in range(1, 6):
        head = gh("GET", API + "/git/ref/heads/" + branch)["object"]["sha"]
        commit = gh("GET", API + "/git/commits/" + head)
        t = gh("POST", API + "/git/trees", {"base_tree": commit["tree"]["sha"], "tree": tree})
        c = gh("POST", API + "/git/commits", {"message": message, "tree": t["sha"], "parents": [head]})
        try:
            gh("PATCH", API + "/git/refs/heads/" + branch, {"sha": c["sha"], "force": False})
            print("  %-9s %s -> %s" % (branch, head[:8], c["sha"][:8]))
            return
        except Exception as e:
            print("  %s 第 %d 次被抢先，重读最新版本再来：%s" % (branch, attempt, str(e)[:70]))
            time.sleep(2)
    raise RuntimeError(branch + " 连续 5 次没推上去")


def main():
    ap = argparse.ArgumentParser(description="推指定文件到 main / gh-pages 并触发 Pages 重建")
    ap.add_argument("files", nargs="+", help="要发布的文件（相对仓库根目录）")
    ap.add_argument("-m", "--message", default="更新工作台", help="提交说明")
    ap.add_argument("--branches", default="main,gh-pages", help="默认 main,gh-pages")
    ap.add_argument("--check", action="store_true", help="只检查连通性和分支，不写")
    args = ap.parse_args()

    tree = []
    missing = []
    print("待发布：")
    for f in args.files:
        p = os.path.abspath(os.path.join(ROOT, f))
        if not p.startswith(ROOT) or not os.path.isfile(p):
            missing.append(f)
            continue
        tree.append({"path": f.replace("\\", "/"), "mode": "100644", "type": "blob", "sha": None})
    if missing:
        sys.exit("找不到文件：" + ", ".join(missing))

    branches = [b.strip() for b in args.branches.split(",") if b.strip()]
    if args.check:
        for b in branches:
            head = gh("GET", API + "/git/ref/heads/" + b)["object"]["sha"]
            print("  %-9s head %s" % (b, head[:8]))
        print("检查通过：token 可用，分支可读。")
        return

    for item in tree:
        item["sha"] = blob_for(os.path.join(ROOT, item["path"]))

    print("写入分支：")
    for b in branches:
        publish(b, tree, args.message)

    try:
        gh("POST", API + "/pages/builds", {})
        print("已触发 Pages 重建，等 30~60 秒生效。")
    except Exception as e:
        print("Pages 重建触发失败（不影响推送，网页会自动重建）：%s" % str(e)[:80])


if __name__ == "__main__":
    main()
