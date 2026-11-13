#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把抖音后台导出的「X月视频数据统计.xlsx」转成战报页要读的 content/report/index.json。

老板的表格本身就是成品：汇总（整体大盘 + 引流vs内容）、明细、TOP10、总结。
这里只做搬运和规范化，不新增指标、不改口径。

口径（与 9 月汇总表一致，已逐项核对）：
  - 全部指标只统计「审核状态 = 公开」的视频（需优化 / 自见 不计入）
  - 平均单条播放 = 总播放 / 公开条数
  - 互动率 = (赞 + 评 + 转 + 藏) / 总播放
  - 完播率、平均播放时长 = 该组所有视频的算术平均

用法：
    py -3 tools/build-report.py                       # 用桌面上的 9月/10月 两个表
    py -3 tools/build-report.py a.xlsx b.xlsx         # 指定文件，按文件名里的月份识别
"""

import json
import os
import re
import statistics
import sys

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'content', 'report', 'index.json')
DESKTOP = os.path.join(os.path.expanduser('~'), 'Desktop')

# 指标名 → 显示类型：num 千分位整数 / dec 一位小数 / rate 百分比
TYPES = {
    '平均单条播放量': 'dec',
    '平均单条播放': 'dec',
    '互动率（赞+评+藏+转）/播放': 'rate',
    '平均完播率': 'rate',
    '平均播放时长（秒）': 'dec',
    '互动率': 'rate',
    '播放量占比': 'rate',
}


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def read_rows(wb):
    """明细表 → 字典列表，跳过空行，只留公开的"""
    ws = wb['明细'] if '明细' in wb.sheetnames else [
        wb[s] for s in wb.sheetnames if s.endswith('明细')][0]
    rows = list(ws.iter_rows(values_only=True))
    head = [str(h).strip() if h is not None else '' for h in rows[0]]
    out = []
    for r in rows[1:]:
        if not r or not r[0]:
            continue
        out.append(dict(zip(head, r)))
    return out


def parse_time(s):
    s = str(s or '').strip()
    m = re.match(r'(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})', s)
    if m:
        return m.group(1), m.group(2)
    return s[:10], ''


def group_stats(g, total_play):
    play = sum(num(r['播放量']) for r in g)
    return {
        '条数': len(g),
        '总播放量': int(play),
        '平均单条播放': round(play / len(g), 1) if g else 0,
        '总点赞量': int(sum(num(r['点赞量']) for r in g)),
        '总评论量': int(sum(num(r['评论量']) for r in g)),
        '总分享量': int(sum(num(r['分享量']) for r in g)),
        '总收藏量': int(sum(num(r['收藏量']) for r in g)),
        '总粉丝增量': int(sum(num(r['粉丝增量']) for r in g)),
        '互动率': round(sum(num(r['点赞量']) + num(r['评论量']) + num(r['分享量']) + num(r['收藏量'])
                       for r in g) / play, 4) if play else 0,
        '平均完播率': round(statistics.mean(num(r['完播率']) for r in g), 4) if g else 0,
        '播放量占比': round(play / total_play, 4) if total_play else 0,
    }


def read_summary(wb):
    """读汇总表已有的数值：{指标名: 值} 与 {指标名: [引流, 内容]}，空的留 None

    老板的表里如果已经算好了，就直接用他的数，不自己重算——页面上跟他 Excel 一字不差。
    """
    if '汇总' not in wb.sheetnames:
        return {}, []
    ov, cmp_rows, mode = {}, [], None
    for r in wb['汇总'].iter_rows(values_only=True):
        a = str(r[0]).strip() if r[0] is not None else ''
        if a.startswith('①'):
            mode = 'ov'
            continue
        if a.startswith('②'):
            mode = 'cmp'
            continue
        if not a or a == '指标':
            continue
        if mode == 'ov':
            ov[a] = None if r[1] is None else r[1]
        elif mode == 'cmp':
            cmp_rows.append((a, r[1], r[2]))
    return ov, cmp_rows


def build(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    month = re.search(r'(\d{1,2})\s*月', os.path.basename(path)).group(1)
    year = '2026'

    all_rows = read_rows(wb)
    pub = [r for r in all_rows if str(r.get('审核状态')).strip() == '公开']
    # 内容 / 引流 按类型分，不看审核（9 月「需优化」那条也归内容，与汇总表 26 条对齐）
    con = [r for r in all_rows if str(r.get('类型')).strip() == '内容视频']
    tra = [r for r in all_rows if str(r.get('类型')).strip() == '引流视频']

    play = sum(num(r['播放量']) for r in pub)
    inter = sum(num(r['点赞量']) + num(r['评论量']) + num(r['分享量']) + num(r['收藏量']) for r in pub)

    def band(lo, hi=None):
        c = 0
        for r in pub:
            p = num(r['播放量'])
            if (p >= lo) if hi is None else (lo <= p < hi):
                c += 1
        return c

    fmt = {}
    for r in all_rows:
        k = str(r.get('体裁') or '').strip()
        fmt[k] = fmt.get(k, 0) + 1
    audit = {}
    for r in all_rows:
        k = str(r.get('审核状态') or '').strip()
        audit[k] = audit.get(k, 0) + 1

    mine = [
        ('发布视频数（条）', len(all_rows)),
        ('其中公开（条）', len(pub)),
        ('内容视频（条）', len(con)),
        ('引流视频（条）', len(tra)),
        ('总播放量', int(play)),
        ('总点赞量', int(sum(num(r['点赞量']) for r in pub))),
        ('总评论量', int(sum(num(r['评论量']) for r in pub))),
        ('总分享量', int(sum(num(r['分享量']) for r in pub))),
        ('总收藏量', int(sum(num(r['收藏量']) for r in pub))),
        ('总主页访问量', int(sum(num(r['主页访问量']) for r in pub))),
        ('总粉丝增量', int(sum(num(r['粉丝增量']) for r in pub))),
        ('平均单条播放量', round(play / len(pub), 1) if pub else 0),
        ('互动率（赞+评+藏+转）/播放', round(inter / play, 4) if play else 0),
        ('平均完播率', round(statistics.mean(num(r['完播率']) for r in pub), 4) if pub else 0),
        ('平均播放时长（秒）', round(statistics.mean(num(r['平均播放时长']) for r in pub), 1) if pub else 0),
        ('播放量 100 万+（条）', band(1000000)),
        ('播放量 50-100 万（条）', band(500000, 1000000)),
        ('播放量 10-50 万（条）', band(100000, 500000)),
        ('播放量 1-10 万（条）', band(10000, 100000)),
        ('播放量 1 万以下（条）', band(0, 10000)),
    ]
    for k in ['1-3min视频', '1min-视频', '3-5min视频', '5min+视频']:
        if fmt.get(k):
            mine.append(('体裁 · %s（条）' % k, fmt[k]))
    for k in ['公开', '需优化', '自见']:
        if audit.get(k):
            mine.append(('审核 · %s（条）' % k, audit[k]))
    mine = dict(mine)

    # 表里已有的原值优先；空的（10 月汇总还没填）用自己算的补上
    ov_ref, cmp_ref = read_summary(wb)
    order = [k for k in ov_ref.keys() if k in mine] or list(mine.keys())
    for k in mine:
        if k not in order:
            order.append(k)
    overview = []
    for k in order:
        ref = ov_ref.get(k)
        v = mine[k] if ref is None else ref
        overview.append((k, v))

    ov = [{'k': k, 'v': v, 't': TYPES.get(k, 'num')} for k, v in overview]

    st_t = group_stats(tra, play)
    st_c = group_stats(con, play)
    if cmp_ref:
        rows_cmp = []
        for k, a, b in cmp_ref:
            v = [st_t.get(k, 0) if a is None else a, st_c.get(k, 0) if b is None else b]
            if k == '播放量占比' and a is None and b is None and month == '9':
                continue
            rows_cmp.append({'k': k, 'v': v, 't': TYPES.get(k, 'num')})
    else:
        keys = ['条数', '总播放量', '平均单条播放', '总点赞量', '总评论量', '总分享量',
                '总收藏量', '总粉丝增量', '互动率', '平均完播率', '播放量占比']
        rows_cmp = [{'k': k, 'v': [st_t[k], st_c[k]], 't': TYPES.get(k, 'num')} for k in keys]
    compare = {'cols': ['引流视频', '内容视频'], 'rows': rows_cmp}

    # TOP10：直接读表
    top = {}
    ws = wb['TOP10']
    cur = None
    for r in ws.iter_rows(values_only=True):
        if r[0] and isinstance(r[0], str):
            cur = '内容' if '内容' in r[0] else ('引流' if '引流' in r[0] else cur)
            if '排名' in str(r[0]):
                continue
        if isinstance(r[0], int) and cur:
            top.setdefault(cur, []).append({
                'rank': r[0], 'title': str(r[1] or '').strip(), 'date': str(r[2] or '')[:10],
                'fmt': r[3], 'play': int(num(r[4])), 'like': int(num(r[5])),
                'cmt': int(num(r[6])), 'share': int(num(r[7])), 'fav': int(num(r[8])),
                'fans': int(num(r[9])), 'visit': int(num(r[10])),
            })

    # 明细：保持表格原顺序
    rows = []
    for r in all_rows:
        d, t = parse_time(r.get('发布时间'))
        ctr = r.get('封面点击率')
        rows.append({
            'title': str(r.get('作品名称') or '').strip(),
            'date': d, 'time': t,
            'fmt': str(r.get('体裁') or '').strip(),
            'audit': str(r.get('审核状态') or '').strip(),
            'play': int(num(r['播放量'])),
            'fin': round(num(r['完播率']), 6),
            'f5': round(num(r['5s完播率']), 6),
            'ctr': None if ctr in (None, '-', '') else round(num(ctr), 6),
            'b2': round(num(r['2s跳出率']), 6),
            'avg': round(num(r['平均播放时长']), 2),
            'like': int(num(r['点赞量'])), 'share': int(num(r['分享量'])),
            'cmt': int(num(r['评论量'])), 'fav': int(num(r['收藏量'])),
            'visit': int(num(r['主页访问量'])), 'fans': int(num(r['粉丝增量'])),
            'type': str(r.get('类型') or '').strip(),
        })

    note = ''
    if '总结' in wb.sheetnames:
        parts = []
        for r in wb['总结'].iter_rows(values_only=True):
            for c in r:
                if isinstance(c, str) and len(c.strip()) > 8:
                    parts.append(c.strip())
        note = '\n'.join(parts)

    return {
        'key': '%s-%02d' % (year, int(month)),
        'label': '%d 月' % int(month),
        'title': '数码科技账号 %s 年 %d 月视频数据统计' % (year, int(month)),
        'overview': ov,
        'compare': compare,
        'top': top,
        'rows': rows,
        'note': note,
    }


def main():
    files = sys.argv[1:]
    if not files:
        files = [os.path.join(DESKTOP, '9月视频数据统计.xlsx'),
                 os.path.join(DESKTOP, '10月视频数据统计.xlsx')]
    months = []
    for f in files:
        if not os.path.exists(f):
            print('[MISS] %s' % f)
            continue
        m = build(f)
        print('[OK] %s -> %s 条 %d（公开 %d） 播放 %d'
              % (os.path.basename(f), m['label'], len(m['rows']),
                 sum(1 for r in m['rows'] if r['audit'] == '公开'),
                 sum(r['play'] for r in m['rows'] if r['audit'] == '公开')))
        months.append(m)
    months.sort(key=lambda x: x['key'])
    data = {'updated_at': '2026-11-13', 'months': months}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print('[WROTE] %s  %d 个月' % (OUT, len(months)))


if __name__ == '__main__':
    main()
