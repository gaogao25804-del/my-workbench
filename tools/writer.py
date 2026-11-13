#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文案流水线：你提交需求 → 两套初稿 → 交叉评审 → 各自修订 → 最终文案。

  py -3 tools/writer.py serve --port 8790        # 打开 http://127.0.0.1:8790
  py -3 tools/writer.py submit "主题" --goal "要讲清什么"
  py -3 tools/writer.py put --job J1 --stage draft --who trae --file 草稿.md
  py -3 tools/writer.py put --job J1 --stage review --who trae --text "评审意见"
  py -3 tools/writer.py show --job J1
  py -3 tools/writer.py list

提交需求时自动往 .bus 总线发两条通知，两个 agent 收件就知道有活。
数据在 .bus/jobs.json，本地，不进 git。
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parent.parent
BUS_DIR = ROOT / '.bus'
JOB_FILE = BUS_DIR / 'jobs.json'
MSG_FILE = BUS_DIR / 'messages.json'

SIDES = ['workbuddy', 'trae']
STAGES = ['draft', 'review', 'revise', 'final']


# ---------------- 存储 ----------------

def _load(path, default):
    if not path.exists():
        return default
    for _ in range(6):
        try:
            return json.loads(path.read_text(encoding='utf-8') or json.dumps(default))
        except (json.JSONDecodeError, OSError):
            time.sleep(0.12)
    return default


def _save(path, data):
    BUS_DIR.mkdir(exist_ok=True)
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    for _ in range(6):
        try:
            os.replace(tmp, path)
            return
        except PermissionError:
            time.sleep(0.12)
    os.replace(tmp, path)


def jobs():
    return _load(JOB_FILE, [])


def save_jobs(rows):
    _save(JOB_FILE, rows)


def notify(text):
    """往总线发通知，两个 agent 下次 inbox 就能收到。"""
    msgs = _load(MSG_FILE, [])
    msgs.append({
        'id': 'm-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + str(len(msgs)).zfill(3),
        'ts': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'from': 'writer',
        'to': 'all',
        'text': text,
        'read': [],
    })
    _save(MSG_FILE, msgs)


def next_id(rows):
    return 'J' + str(len(rows) + 1)


def find(rows, jid):
    for j in rows:
        if j['id'].lower() == jid.lower():
            return j
    return None


def filled(job, stage, who=None):
    s = job.get('steps', {}).get(stage)
    if not s:
        return ''
    if who:
        return (s.get(who) or {}).get('text', '')
    return s.get('text', '')


# ---------------- 命令行 ----------------

def cmd_submit(a):
    rows = jobs()
    jid = next_id(rows)
    job = {
        'id': jid,
        'ts': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'req': {'topic': a.topic, 'goal': a.goal or '', 'extra': a.extra or ''},
        'steps': {'draft': {}, 'review': {}, 'revise': {}, 'final': {}},
    }
    rows.append(job)
    save_jobs(rows)
    notify('新需求 %s：%s%s\n两边各写一版初稿：py -3 tools/writer.py put --job %s --stage draft --who <你> --file 草稿.md'
           % (jid, a.topic, ('（' + a.goal + '）') if a.goal else '', jid))
    print('已建单 %s：%s' % (jid, a.topic))
    return 0


def cmd_put(a):
    rows = jobs()
    job = find(rows, a.job)
    if not job:
        print('没有这个单：%s' % a.job)
        return 1
    if a.stage == 'final':
        text = a.text[0] if isinstance(a.text, list) else a.text
        if a.file:
            text = Path(a.file).read_text(encoding='utf-8')
        elif a.text:
            text = ' '.join(a.text)
        else:
            print('final 需要 --text 或 --file')
            return 1
        job['steps']['final'] = {'text': text.strip(), 'by': a.who or 'trae',
                                 'ts': datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    else:
        if a.file:
            text = Path(a.file).read_text(encoding='utf-8')
        elif a.text:
            text = ' '.join(a.text)
        else:
            print('需要 --text 或 --file')
            return 1
        who = a.who or 'trae'
        job['steps'].setdefault(a.stage, {})[who] = {
            'text': text.strip(),
            'ts': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
    save_jobs(rows)
    print('已写入 %s · %s · %s' % (job['id'], a.stage, a.who or 'trae'))
    return 0


def cmd_show(a):
    rows = jobs()
    job = find(rows, a.job) if a.job else (rows[-1] if rows else None)
    if not job:
        print('还没有单。')
        return 0
    print('%s  %s  %s' % (job['id'], job['ts'], job['req']['topic']))
    if job['req'].get('goal'):
        print('目标：%s' % job['req']['goal'])
    for st in STAGES:
        print('\n== %s ==' % st)
        s = job['steps'].get(st) or {}
        if st == 'final':
            print(s.get('text') or '（空）')
        else:
            for who in SIDES:
                t = (s.get(who) or {}).get('text') or '（空）'
                print('-- %s --\n%s' % (who, t))
    return 0


def cmd_list(a):
    rows = jobs()
    if not rows:
        print('还没有单。')
        return 0
    for j in rows:
        d = sum(1 for w in SIDES if filled(j, 'draft', w))
        r = sum(1 for w in SIDES if filled(j, 'review', w))
        v = sum(1 for w in SIDES if filled(j, 'revise', w))
        f = '✓' if filled(j, 'final') else '·'
        print('%s  %s  初稿%d/2 评审%d/2 修订%d/2 最终%s  %s'
              % (j['id'], j['ts'], d, r, v, f, j['req']['topic']))
    return 0


# ---------------- 网页 ----------------

PAGE = r"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>文案流水线</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f5f6f8;color:#111318;
     font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:26px 18px 60px}
.head{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.head h1{font-size:17px;margin:0;letter-spacing:-.02em;font-weight:700}
.head .sub{font-size:12px;color:#8b93a1;margin-left:auto}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.tab{border:1px solid #e2e5eb;background:#fff;border-radius:999px;padding:5px 12px;font-size:12.5px;cursor:pointer}
.tab.on{border-color:#111318;font-weight:600}
.panel{display:flex;flex-direction:column;gap:0}
.box{background:rgba(238,242,255,.85);border:1px solid rgba(200,212,240,.7);border-radius:16px;padding:20px;text-align:center}
.box .t{font-size:19px;font-weight:650}
.box .s{font-size:12.5px;color:#5b6474;margin-top:5px}
.note{font-size:11.5px;color:#8b93a1;padding:7px 4px 0;line-height:1.6}
.arrow{text-align:left;padding-left:30px;color:#9aa3b2;font-size:16px;line-height:1;margin:14px 0}.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:#fff;border:1px solid #e2e5eb;border-radius:16px;padding:16px 18px;min-height:104px}
.card .n{font-size:17px;font-weight:650;letter-spacing:-.01em}
.card .d{font-size:12.5px;color:#8b93a1;margin-top:3px}
.card .body{font-size:13px;line-height:1.72;white-space:pre-wrap;margin-top:11px;color:#2b3040;max-height:260px;overflow:auto}
.card.pending{border-style:dashed;background:#fbfcfd}
.card.pending .body{color:#a3aab8}
.wide{background:#fff;border:1px solid #e2e5eb;border-radius:16px;padding:16px 18px}
.wide .t{font-weight:650;font-size:16px;text-align:center}
.wide .s{font-size:12.5px;color:#8b93a1;text-align:center;margin-top:3px;margin-bottom:0}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.two .cell{background:#f7f8fa;border-radius:11px;padding:11px 13px;font-size:12.5px;line-height:1.7;white-space:pre-wrap;color:#2b3040}
.two .k{font-size:11px;color:#8b93a1;letter-spacing:.04em;text-transform:uppercase;margin-bottom:4px}
.final{background:#e9f7ee;border:1px solid #cbe8d7;border-radius:16px;padding:20px;text-align:center}
.final .t{font-size:18px;font-weight:700}
.final .s{font-size:12.5px;color:#3f6a54;margin-top:4px}
.final .body{background:#fff;border-radius:12px;padding:15px 17px;margin-top:14px;text-align:left;
            font-size:13.5px;line-height:1.8;white-space:pre-wrap;max-height:420px;overflow:auto}
.copy{margin-top:12px;border:0;border-radius:999px;background:#17805a;color:#fff;
      padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer}
form.sub{background:#fff;border:1px solid #e2e5eb;border-radius:16px;padding:16px;margin-bottom:20px}
form.sub input,form.sub textarea{width:100%;border:1px solid #dfe3ea;border-radius:10px;padding:9px 11px;
      font:inherit;font-size:13px;margin-bottom:9px;outline:none;background:#fbfcfd}
form.sub textarea{resize:vertical;min-height:54px}
form.sub button{border:0;border-radius:999px;background:#111318;color:#fff;padding:9px 20px;font-size:13px;font-weight:600;cursor:pointer}
.empty{text-align:center;color:#9aa3b2;padding:50px 0;font-size:13px}
@media(max-width:600px){.row,.two{grid-template-columns:1fr}}
</style></head><body>
<div class="wrap">
  <div class="head"><h1>文案流水线</h1><span class="sub" id="meta">本地 · 每 2 秒刷新</span></div>

  <form class="sub" id="f">
    <input name="topic" placeholder="需求：这条讲什么（必填）" required>
    <textarea name="goal" placeholder="要讲清的点 / 给谁看 / 长度（可空）"></textarea>
    <button type="submit">提交需求</button>
  </form>

  <div class="tabs" id="tabs"></div>
  <div id="board"><div class="empty">还没有需求，在上面提交第一条</div></div>
</div>
<script>
var CUR = null;
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function card(who,label,txt,pendingTip){
  if(txt) return '<div class="card"><div class="n">'+esc(who)+'</div><div class="d">'+esc(label)+
    '</div><div class="body">'+esc(txt)+'</div></div>';
  return '<div class="card pending"><div class="n">'+esc(who)+'</div><div class="d">'+esc(label)+
    '</div><div class="body">'+esc(pendingTip)+'</div></div>';
}
function render(jobs){
  var tabs = document.getElementById('tabs');
  tabs.innerHTML = jobs.slice().reverse().map(function(j){
    return '<button class="tab'+(j.id===CUR?' on':'')+'" data-id="'+esc(j.id)+'">'+esc(j.id)+' · '+esc(j.req.topic.slice(0,14))+'</button>';
  }).join('');
  var box = document.getElementById('board');
  if(!jobs.length){ box.innerHTML='<div class="empty">还没有需求，在上面提交第一条</div>'; return; }
  var j = jobs.filter(function(x){return x.id===CUR})[0] || jobs[jobs.length-1];
  CUR = j.id;
  var s = j.steps||{}, d=s.draft||{}, r=s.review||{}, v=s.revise||{}, f=s.final||null;
  var h = '';
  h += '<div class="box"><div class="t">你提交文案需求</div><div class="s">'+esc(j.req.topic)+
       (j.req.goal?' · '+esc(j.req.goal):'')+'</div></div>';
  if(j.note) h += '<div class="note">'+esc(j.note)+'</div>';
  h += '<div class="arrow">↓</div>';
  h += '<div class="row">'+card('WorkBuddy','独立创作第一版',(d.workbuddy||{}).text,'等 WorkBuddy 交稿')+
       card('Trae','独立创作第一版',(d.trae||{}).text,'等 Trae 交稿')+'</div>';
  h += '<div class="arrow">↓</div>';
  h += '<div class="wide"><div class="t">交叉评审</div><div class="s">互相挑错、比较卖点、指出表达问题</div>'+
       '<div class="two">'+
       '<div class="cell"><div class="k">WorkBuddy 评 Trae</div>'+esc((r.workbuddy||{}).text||'待评审')+'</div>'+
       '<div class="cell"><div class="k">Trae 评 WorkBuddy</div>'+esc((r.trae||{}).text||'待评审')+'</div>'+
       '</div></div>';
  h += '<div class="arrow">↓</div>';
  h += '<div class="row">'+card('WorkBuddy','吸收意见，修改文案',(v.workbuddy||{}).text,'待修订')+
       card('Trae','吸收意见，修改文案',(v.trae||{}).text,'待修订')+'</div>';
  h += '<div class="arrow">↓</div>';
  h += '<div class="final"><div class="t">最终文案</div><div class="s">保留两者的优点，解决双方指出的问题</div>'+
       (f&&f.text ? '<div class="body">'+esc(f.text)+'</div><button class="copy" id="cp">复制最终文案</button>'
                  : '<div class="s" style="margin-top:14px">待定稿</div>')+'</div>';
  box.innerHTML = h;
  var cp = document.getElementById('cp');
  if(cp) cp.onclick = function(){
    var t = f.text;
    if(navigator.clipboard) navigator.clipboard.writeText(t);
    cp.textContent = '已复制';
    setTimeout(function(){ cp.textContent='复制最终文案' }, 1500);
  };
}
function tick(){
  fetch('/api/jobs?t='+Date.now()).then(function(r){return r.json()}).then(function(j){
    render(j);
    document.getElementById('meta').textContent = '本地 · 共 ' + j.length + ' 条需求';
  }).catch(function(){});
}
document.getElementById('tabs').addEventListener('click', function(e){
  var b = e.target.closest('.tab'); if(!b) return;
  CUR = b.dataset.id; tick();
});
document.getElementById('f').addEventListener('submit', function(e){
  e.preventDefault();
  var fd = new FormData(e.target);
  fetch('/submit', {method:'POST', body:new URLSearchParams(fd)}).then(function(){
    e.target.reset(); tick();
  });
});
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
            if self.path.startswith('/api/jobs'):
                self._send(200, json.dumps(jobs(), ensure_ascii=False), 'application/json; charset=utf-8')
            else:
                self._send(200, PAGE)

        def do_POST(self):
            n = int(self.headers.get('Content-Length') or 0)
            q = parse_qs(self.rfile.read(n).decode('utf-8'))
            topic = (q.get('topic') or [''])[0].strip()
            if topic:
                rows = jobs()
                jid = next_id(rows)
                rows.append({
                    'id': jid,
                    'ts': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'req': {'topic': topic, 'goal': (q.get('goal') or [''])[0].strip(), 'extra': ''},
                    'steps': {'draft': {}, 'review': {}, 'revise': {}, 'final': {}},
                })
                save_jobs(rows)
                notify('新需求 %s：%s\n两边各写一版：py -3 tools/writer.py put --job %s --stage draft --who <你> --file 草稿.md'
                       % (jid, topic, jid))
            self.send_response(303)
            self.send_header('Location', '/')
            self.end_headers()

    srv = ThreadingHTTPServer(('127.0.0.1', a.port), H)
    print('文案流水线：http://127.0.0.1:%d  （Ctrl+C 关掉）' % a.port)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\n已关闭。')
    return 0


def main():
    p = argparse.ArgumentParser(description='文案流水线')
    sub = p.add_subparsers(dest='cmd')

    s = sub.add_parser('serve', help='开本地页面')
    s.add_argument('--port', type=int, default=8790)
    s.set_defaults(fn=cmd_serve)

    s = sub.add_parser('submit', help='建一条需求')
    s.add_argument('topic')
    s.add_argument('--goal', default='')
    s.add_argument('--extra', default='')
    s.set_defaults(fn=cmd_submit)

    s = sub.add_parser('put', help='写某一格的稿子/意见')
    s.add_argument('--job', required=True)
    s.add_argument('--stage', required=True, choices=STAGES)
    s.add_argument('--who', choices=SIDES + ['boss'])
    s.add_argument('--text', nargs='+')
    s.add_argument('--file')
    s.set_defaults(fn=cmd_put)

    s = sub.add_parser('show', help='看某条全部内容')
    s.add_argument('--job')
    s.set_defaults(fn=cmd_show)

    sub.add_parser('list', help='列出所有需求').set_defaults(fn=cmd_list)

    a = p.parse_args()
    if not getattr(a, 'fn', None):
        p.print_help()
        return 0
    return a.fn(a)


if __name__ == '__main__':
    sys.exit(main())
