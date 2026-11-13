#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地总线：Trae 和 WorkBuddy 直接对话用的共享信箱。

  py -3 tools/bus.py say --as trae --to workbuddy "正文"
  py -3 tools/bus.py inbox --as workbuddy
  py -3 tools/bus.py log
  py -3 tools/bus.py serve            # 本地网页，浏览器里看/发

消息存在仓库根的 .bus/messages.json，不进 git、不上线。
两个 agent 只要跑在同一条磁盘上，读写的就是同一份。
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
BUS_DIR = ROOT / '.bus'
BUS_FILE = BUS_DIR / 'messages.json'


def load():
    if not BUS_FILE.exists():
        return []
    for _ in range(5):
        try:
            return json.loads(BUS_FILE.read_text(encoding='utf-8') or '[]')
        except (json.JSONDecodeError, OSError):
            time.sleep(0.15)  # 对方正在写，等一下再读
    return []


def save(msgs):
    BUS_DIR.mkdir(exist_ok=True)
    tmp = BUS_FILE.with_suffix('.tmp')
    tmp.write_text(json.dumps(msgs, ensure_ascii=False, indent=2), encoding='utf-8')
    for _ in range(5):
        try:
            os.replace(tmp, BUS_FILE)
            return
        except PermissionError:
            time.sleep(0.15)  # Windows 上文件被占用时重试
    os.replace(tmp, BUS_FILE)


def new_id():
    return 'm-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + str(int(time.time() * 1000) % 1000).zfill(3)


def cmd_say(a):
    text = ' '.join(a.text).strip()
    if not text:
        print('内容不能为空')
        return 1
    msgs = load()
    msg = {
        'id': new_id(),
        'ts': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'from': a.as_name,
        'to': a.to,
        'text': text,
        'read': [],
    }
    msgs.append(msg)
    save(msgs)
    print('已投递 %s → %s  %s' % (msg['from'], msg['to'], msg['id']))
    return 0


def unread_for(msgs, who):
    return [m for m in msgs if m.get('to') in (who, 'all', 'any') and who not in m.get('read', []) and m.get('from') != who]


def show(m):
    print('\n[%s] %s → %s   %s' % (m['ts'], m['from'], m['to'], m['id']))
    print(m['text'])


def cmd_inbox(a):
    msgs = load()
    rows = unread_for(msgs, a.as_name)
    if not rows:
        print('没有新消息。')
        return 0
    for m in rows:
        show(m)
        m.setdefault('read', []).append(a.as_name)
    save(msgs)
    print('\n共 %d 条，已标记为已读。' % len(rows))
    return 0


def cmd_log(a):
    msgs = load()[-a.n:]
    if not msgs:
        print('总线还是空的。')
        return 0
    for m in msgs:
        show(m)
    return 0


def cmd_clear(a):
    save([])
    print('已清空。')
    return 0


PAGE = """<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agent 总线</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f7f8fa;color:#111318;
     font:14px/1.65 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
header{position:sticky;top:0;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);
       border-bottom:1px solid #e6e9ef;padding:14px 22px;display:flex;align-items:center;gap:10px}
h1{font-size:15px;margin:0;font-weight:650;letter-spacing:-.01em}
.dot{width:7px;height:7px;border-radius:50%;background:#17805a}
.hint{margin-left:auto;font-size:11.5px;color:#8b93a1}
main{max-width:820px;margin:0 auto;padding:22px}
.msg{background:#fff;border:1px solid #e6e9ef;border-radius:14px;padding:14px 16px;margin-bottom:12px}
.meta{display:flex;align-items:center;gap:8px;font-size:11.5px;color:#8b93a1;margin-bottom:7px}
.who{font-weight:650;color:#111318;font-size:12.5px}
.who.trae{color:#c8460d}
.who.workbuddy{color:#1f5fbf}
.who.boss{color:#17805a}
.arrow{color:#c9cfda}
.body{white-space:pre-wrap;word-break:break-word;font-size:13.5px}
.empty{text-align:center;color:#8b93a1;padding:60px 0;font-size:13px}
form{position:sticky;bottom:0;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);
     border-top:1px solid #e6e9ef;padding:12px 22px;display:flex;gap:8px;align-items:center}
select,input{height:34px;border:1px solid #d3d8e1;border-radius:9px;background:#fff;font:inherit;font-size:13px;padding:0 10px;outline:none}
input{flex:1}
button{height:34px;padding:0 16px;border:0;border-radius:999px;background:#ff6a2f;color:#fff;font-weight:600;cursor:pointer}
button:hover{background:#e85a1f}
</style></head><body>
<header><i class="dot"></i><h1>Agent 总线</h1><span class="hint">本地 · 每 2 秒刷新 · 不进 git</span></header>
<main id="list"><div class="empty">还没有消息</div></main>
<form method="post" action="/say">
  <select name="from"><option value="boss">老板</option><option value="trae">Trae</option><option value="workbuddy">WorkBuddy</option></select>
  <select name="to"><option value="all">双方</option><option value="trae">Trae</option><option value="workbuddy">WorkBuddy</option></select>
  <input name="text" placeholder="说点什么，回车发送" autocomplete="off" autofocus>
  <button type="submit">发送</button>
</form>
<script>
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
async function tick(){
  try{
    const r = await fetch('/api/messages?t=' + Date.now());
    const rows = await r.json();
    const box = document.getElementById('list');
    if(!rows.length){ box.innerHTML = '<div class="empty">还没有消息</div>'; return; }
    box.innerHTML = rows.map(function(m){
      return '<div class="msg"><div class="meta">' +
        '<span class="who ' + esc(m.from) + '">' + esc(m.from) + '</span>' +
        '<span class="arrow">→</span><span>' + esc(m.to) + '</span>' +
        '<span style="margin-left:auto">' + esc(m.ts) + '</span></div>' +
        '<div class="body">' + esc(m.text) + '</div></div>';
    }).join('');
    if(document.body.dataset.n !== String(rows.length)){
      document.body.dataset.n = rows.length; window.scrollTo(0, document.body.scrollHeight);
    }
  }catch(e){}
}
tick(); setInterval(tick, 2000);
</script></body></html>"""


def cmd_serve(a):
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
    from urllib.parse import parse_qs

    class H(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def _send(self, code, body, ctype='text/html; charset=utf-8'):
            data = body.encode('utf-8')
            self.send_response(code)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if self.path.startswith('/api/messages'):
                self._send(200, json.dumps(load()[-a.n:], ensure_ascii=False), 'application/json; charset=utf-8')
            else:
                self._send(200, PAGE)

        def do_POST(self):
            n = int(self.headers.get('Content-Length') or 0)
            q = parse_qs(self.rfile.read(n).decode('utf-8'))
            text = (q.get('text') or [''])[0].strip()
            if text:
                msgs = load()
                msgs.append({
                    'id': new_id(),
                    'ts': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'from': (q.get('from') or ['boss'])[0],
                    'to': (q.get('to') or ['all'])[0],
                    'text': text,
                    'read': [],
                })
                save(msgs)
            self.send_response(303)
            self.send_header('Location', '/')
            self.end_headers()

    srv = ThreadingHTTPServer(('127.0.0.1', a.port), H)
    print('总线已开：http://127.0.0.1:%d  （Ctrl+C 关掉）' % a.port)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\n已关闭。')
    return 0


def main():
    p = argparse.ArgumentParser(description='Trae / WorkBuddy 本地总线')
    sub = p.add_subparsers(dest='cmd')

    s = sub.add_parser('say', help='发一条')
    s.add_argument('text', nargs='+')
    s.add_argument('--as', dest='as_name', required=True, choices=['trae', 'workbuddy', 'boss'])
    s.add_argument('--to', default='all', choices=['trae', 'workbuddy', 'all'])
    s.set_defaults(fn=cmd_say)

    s = sub.add_parser('inbox', help='看未读并标记已读')
    s.add_argument('--as', dest='as_name', required=True, choices=['trae', 'workbuddy', 'boss'])
    s.set_defaults(fn=cmd_inbox)

    s = sub.add_parser('log', help='看最近全部')
    s.add_argument('-n', type=int, default=30)
    s.set_defaults(fn=cmd_log)

    s = sub.add_parser('serve', help='开本地网页')
    s.add_argument('--port', type=int, default=8788)
    s.add_argument('-n', type=int, default=200)
    s.set_defaults(fn=cmd_serve)

    sub.add_parser('clear', help='清空').set_defaults(fn=cmd_clear)

    a = p.parse_args()
    if not getattr(a, 'fn', None):
        p.print_help()
        return 0
    return a.fn(a)


if __name__ == '__main__':
    sys.exit(main())
