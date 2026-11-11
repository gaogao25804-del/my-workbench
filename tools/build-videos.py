# -*- coding: utf-8 -*-
"""
把抖音后台导出的《作品列表导出.xlsx》转成 videos-data.json。

用法：
    py -3 tools/build-videos.py "作品列表导出.xlsx"
    py -3 tools/build-videos.py "作品列表导出.xlsx" --out videos-data.json
    py -3 tools/build-videos.py "作品列表导出.xlsx" --rules tools/formula-rules.json

只用标准库，不需要 pip install。

导出文件的真实列名（16 列）：
    作品名称 / 发布时间 / 体裁 / 审核状态 / 播放量 / 完播率 / 5s完播率 /
    封面点击率 / 2s跳出率 / 平均播放时长 / 点赞量 / 分享量 / 评论量 /
    收藏量 / 主页访问量 / 粉丝增量

映射到 JSON 的字段：
    title   <- 作品名称
    date    <- 发布时间 前 10 位
    time    <- 发布时间 时:分
    play    <- 播放量
    like    <- 点赞量
    comment <- 评论量
    share   <- 分享量
    follow  <- 粉丝增量（粉丝增量）
    type    <- 导出文件里没有这一列，留空
    formula <- 由 tools/formula-rules.json 匹配，匹配不上就是 "?"

「合格」不在脚本里算，由前端按 播放量 >= 35000 且 互动 > 0 判定。
"""
import argparse
import datetime
import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
NS = {'m': NS_MAIN}

# 列名 -> JSON 字段。导出表头若带空格或换行也能对上
COLUMN_MAP = {
    '作品名称': 'title',
    '发布时间': 'published_at',
    '播放量': 'play',
    '点赞量': 'like',
    '评论量': 'comment',
    '分享量': 'share',
    '粉丝增量': 'follow',
    '体裁': 'genre',
    '审核状态': 'audit',
    '内容类型': 'type',      # 导出里通常没有，有就取
}

INT_FIELDS = ('play', 'like', 'comment', 'share', 'follow')


# ---------------- xlsx 读取（仅标准库） ----------------

def _col_index(ref):
    m = re.match(r'([A-Z]+)(\d+)', ref or '')
    if not m:
        return None
    n = 0
    for ch in m.group(1):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def _date_style_ids(z):
    """找出被格式化成日期的样式下标，避免 45231 这种序列号漏转换。"""
    if 'xl/styles.xml' not in z.namelist():
        return set()
    root = ET.fromstring(z.read('xl/styles.xml'))
    customs = {}
    for f in root.iter('{%s}numFmt' % NS_MAIN):
        try:
            customs[int(f.get('numId'))] = f.get('formatCode', '')
        except (TypeError, ValueError):
            pass
    out = set()
    for i, xf in enumerate(root.iter('{%s}xf' % NS_MAIN)):
        try:
            nid = int(xf.get('numFmtId') or 0)
        except ValueError:
            nid = 0
        code = customs.get(nid, '')
        if 14 <= nid <= 22 or nid in (45, 46, 47) or ('y' in code and 'd' in code):
            out.add(i)
    return out


def read_sheet(path):
    z = zipfile.ZipFile(path)
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in root.findall('m:si', NS):
            shared.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS_MAIN)))
    date_styles = _date_style_ids(z)

    workbook = ET.fromstring(z.read('xl/workbook.xml'))
    sheet_names = [s.get('name') for s in workbook.iter('{%s}sheet' % NS_MAIN)]
    sheet_path = 'xl/worksheets/sheet1.xml'
    root = ET.fromstring(z.read(sheet_path))

    rows = []
    for r in root.iter('{%s}row' % NS_MAIN):
        cells = {}
        for c in r.findall('m:c', NS):
            ci = _col_index(c.get('r'))
            if ci is None:
                continue
            t = c.get('t')
            v = c.find('m:v', NS)
            if t == 'inlineStr':
                node = c.find('m:is', NS)
                val = ''.join(x.text or '' for x in node.iter('{%s}t' % NS_MAIN)) if node is not None else ''
            elif v is not None and v.text is not None:
                raw = v.text
                if t == 's':
                    try:
                        val = shared[int(raw)]
                    except (ValueError, IndexError):
                        val = ''
                elif t == 'str':
                    val = raw
                else:
                    try:
                        style = int(c.get('s') or 0)
                    except ValueError:
                        style = 0
                    if style in date_styles:
                        try:
                            dt = datetime.datetime(1899, 12, 30) + datetime.timedelta(days=float(raw))
                            val = dt.strftime('%Y-%m-%d %H:%M')
                        except ValueError:
                            val = raw
                    else:
                        val = raw
            else:
                val = ''
            cells[ci] = str(val).strip()
        if cells:
            rows.append([cells.get(i, '') for i in range(max(cells) + 1)])
    return sheet_names, rows


# ---------------- 字段清洗 ----------------

def to_int(v):
    """'47,517' / '47517' / '47517.0' 都转成 int；'-' 和空串转 0。"""
    s = str(v or '').strip().replace(',', '').replace('，', '')
    if s in ('', '-', '--', '/', 'N/A', 'null', 'None'):
        return 0
    try:
        return int(round(float(s)))
    except ValueError:
        m = re.search(r'-?\d+(?:\.\d+)?', s)
        return int(round(float(m.group()))) if m else 0


def split_time(v):
    """"2026-11-10 19:00:03" -> ("2026-11-10", "19:00")"""
    s = str(v or '').strip()
    m = re.match(r'(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?', s)
    if not m:
        return '', ''
    y, mo, d, hh, mm = m.groups()
    date = '%s-%02d-%02d' % (y, int(mo), int(d))
    return date, ('%02d:%s' % (int(hh), mm)) if hh is not None else ''


# ---------------- 规则打标 ----------------

def load_rules(path):
    if not path or not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    rules = data.get('rules') or []
    # priority 大的先匹配；同优先级保持文件里的先后顺序
    return sorted(enumerate(rules), key=lambda p: (-int(p[1].get('priority', 0)), p[0]))


def tag(title, rules):
    """标题命中第一条规则就返回它的 formula，全不中返回 '?'。"""
    text = (title or '').lower()
    for _, rule in rules:
        formula = rule.get('formula')
        if not formula:
            continue
        keywords = [str(k).lower() for k in (rule.get('keywords') or []) if str(k)]
        if not keywords:
            continue
        if rule.get('match') == 'all':
            if all(k in text for k in keywords):
                return formula
        elif any(k in text for k in keywords):
            return formula
    return '?'


# ---------------- 主流程 ----------------

def build(xlsx_path, rules_path):
    _, rows = read_sheet(xlsx_path)
    if not rows:
        raise SystemExit('表里没有内容')

    header = [h.strip() for h in rows[0]]
    idx = {}
    for i, h in enumerate(header):
        field = COLUMN_MAP.get(h)
        if field and field not in idx:
            idx[field] = i
    if 'title' not in idx or 'published_at' not in idx:
        raise SystemExit('表头没对上，找不到「作品名称」或「发布时间」。实际表头：' + ' / '.join(header))

    rules = load_rules(rules_path)
    videos = []
    skipped = 0
    for r in rows[1:]:
        def cell(field):
            i = idx.get(field)
            return r[i] if i is not None and i < len(r) else ''

        title = cell('title').strip()
        if not title:
            skipped += 1
            continue
        date, time = split_time(cell('published_at'))
        if not date:
            skipped += 1
            continue

        item = {
            'id': '',
            'date': date,
            'time': time,
            'title': title,
            'type': cell('type').strip(),
            'formula': tag(title, rules),
            'tagged_by': 'rule',
            'play': to_int(cell('play')),
            'like': to_int(cell('like')),
            'comment': to_int(cell('comment')),
            'share': to_int(cell('share')),
            'follow': to_int(cell('follow')),
        }
        if item['formula'] == '?':
            item['tagged_by'] = ''
        videos.append(item)

    videos.sort(key=lambda v: (v['date'], v['time']), reverse=True)
    pad = max(4, len(str(len(videos))))
    for i, v in enumerate(videos):
        v['id'] = 'v' + str(i + 1).zfill(pad)

    return {
        'updated_at': datetime.date.today().isoformat(),
        'videos': videos,
    }, len(rules), skipped


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)

    ap = argparse.ArgumentParser()
    ap.add_argument('xlsx', help='抖音后台导出的作品列表 xlsx')
    ap.add_argument('--out', default=os.path.join(root, 'videos-data.json'))
    ap.add_argument('--rules', default=os.path.join(here, 'formula-rules.json'))
    args = ap.parse_args()

    data, rule_count, skipped = build(args.xlsx, args.rules)

    with open(args.out, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    videos = data['videos']
    unknowable = sum(1 for v in videos if v['formula'] == '?')
    ok = sum(1 for v in videos if v['play'] >= 35000 and (v['like'] + v['comment'] + v['share']) > 0)
    print('写出 %s' % args.out)
    print('作品 %d 条（跳过空行 %d）' % (len(videos), skipped))
    print('规则 %d 条，命中 %d 条，待归类 %d 条' % (rule_count, len(videos) - unknowable, unknowable))
    print('合格（播放>=35000 且 互动>0）%d 条，合格率 %.1f%%'
          % (ok, (ok / len(videos) * 100) if videos else 0))
    if rule_count == 0:
        print('提示：formula-rules.json 里还没有规则，所有作品的 formula 都是 "?"。')


if __name__ == '__main__':
    sys.exit(main())
