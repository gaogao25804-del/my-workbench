# -*- coding: utf-8 -*-
"""
把抖音后台导出的《作品列表导出.xlsx》转成 videos-data.json。

用法：
    py -3 build-videos.py "作品列表导出.xlsx" --account main
    py -3 build-videos.py "小号导出.xlsx" --account sub --merge

只用标准库，不需要 pip install。
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
    '内容类型': 'type',
}


def _col_index(ref):
    m = re.match(r'([A-Z]+)(\d+)', ref or '')
    if not m:
        return None
    n = 0
    for ch in m.group(1):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def _date_style_ids(z):
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
    root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
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
    return rows


def to_int(v):
    s = str(v or '').strip().replace(',', '').replace('，', '')
    if s in ('', '-', '--', '/', 'N/A', 'null', 'None'):
        return 0
    try:
        return int(round(float(s)))
    except ValueError:
        m = re.search(r'-?\d+(?:\.\d+)?', s)
        return int(round(float(m.group()))) if m else 0


def split_time(v):
    s = str(v or '').strip()
    m = re.match(r'(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?', s)
    if not m:
        return '', ''
    y, mo, d, hh, mm = m.groups()
    date = '%s-%02d-%02d' % (y, int(mo), int(d))
    return date, ('%02d:%s' % (int(hh), mm)) if hh is not None else ''


HASHTAG_RE = re.compile(r'#\S+')


def clean_title(title):
    """剥掉 #标签 再匹配。不剥的话几乎每条都带 #手机壳 #手机贴膜，F9 会吃掉全表。"""
    return HASHTAG_RE.sub('', title or '').strip()


def load_config(path):
    empty = ([], {'order': [], 'default': '', 'traffic': [], 'commerce': []})
    if not path or not os.path.exists(path):
        return empty
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    rules = data.get('rules') or []
    rules = sorted(enumerate(rules), key=lambda p: (-int(p[1].get('priority', 0)), p[0]))
    return rules, (data.get('type_rules') or {})


def detect_type(text, cfg):
    """按 type_rules.order 的顺序判：先 traffic 再 commerce，都不中就是 default(content)。"""
    low = text.lower()
    for name in (cfg.get('order') or ['traffic', 'commerce']):
        for kw in (cfg.get(name) or []):
            if str(kw).lower() in low:
                return name
    return cfg.get('default') or 'content'


def tag(title, rules):
    text = clean_title(title).lower()
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


def build(xlsx_path, rules_path, account='main'):
    rows = read_sheet(xlsx_path)
    if not rows:
        raise SystemExit('表里没有内容')
    header = [h.strip() for h in rows[0]]
    idx = {}
    for i, h in enumerate(header):
        field = COLUMN_MAP.get(h)
        if field and field not in idx:
            idx[field] = i
    if 'title' not in idx or 'published_at' not in idx:
        raise SystemExit('表头没对上，实际：' + ' / '.join(header))

    rules, type_cfg = load_config(rules_path)
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
        vtype = cell('type').strip() or detect_type(clean_title(title), type_cfg)
        # 只有 content 走公式规则；引流、带货类公式直接留 "?"，避免冲淡公式统计
        formula = tag(title, rules) if vtype == 'content' else '?'
        item = {
            'id': '',
            'account': account,
            'date': date,
            'time': time,
            'title': title,
            'type': vtype,
            'formula': formula,
            'tagged_by': 'rule' if formula != '?' else '',
            'play': to_int(cell('play')),
            'like': to_int(cell('like')),
            'comment': to_int(cell('comment')),
            'share': to_int(cell('share')),
            'follow': to_int(cell('follow')),
        }
        videos.append(item)
    return videos, len(rules), skipped


def finalize(videos):
    seen = set()
    uniq = []
    for v in videos:
        key = (v.get('account', ''), v.get('date', ''), v.get('time', ''), v.get('title', ''))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(v)
    uniq.sort(key=lambda v: (v['date'], v['time']), reverse=True)
    pad = max(4, len(str(len(uniq))))
    for i, v in enumerate(uniq):
        v['id'] = 'v' + str(i + 1).zfill(pad)
    return uniq


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument('xlsx')
    ap.add_argument('--out', default=os.path.join(here, 'videos-data.json'))
    ap.add_argument('--rules', default=os.path.join(here, 'formula-rules.json'))
    ap.add_argument('--account', default='main')
    ap.add_argument('--merge', action='store_true', help='并入已有 out 文件，而不是覆盖')
    args = ap.parse_args()

    videos, rule_count, skipped = build(args.xlsx, args.rules, args.account)

    if args.merge and os.path.exists(args.out):
        with open(args.out, 'r', encoding='utf-8') as f:
            old = json.load(f).get('videos') or []
        videos = old + videos
        print('并入已有 %d 条' % len(old))

    videos = finalize(videos)
    data = {'updated_at': datetime.date.today().isoformat(), 'videos': videos}
    with open(args.out, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    for acc in sorted(set(v['account'] for v in videos)):
        sub = [v for v in videos if v['account'] == acc]
        ok = sum(1 for v in sub if v['play'] >= 35000 and (v['like'] + v['comment'] + v['share']) > 0)
        print('  [%s] %d 条，合格 %d 条（%.1f%%）'
              % (acc, len(sub), ok, (ok / len(sub) * 100) if sub else 0))
    unknowable = sum(1 for v in videos if v['formula'] == '?')
    print('合计 %d 条（本次跳过空行 %d）| 规则 %d 条'
          % (len(videos), skipped, rule_count))
    types = {}
    for v in videos:
        types[v['type']] = types.get(v['type'], 0) + 1
    print('类型分布：' + '，'.join('%s %d' % (k, n) for k, n in sorted(types.items(), key=lambda x: -x[1])))
    content = [v for v in videos if v['type'] == 'content']
    tagged = [v for v in content if v['formula'] != '?']
    print('内容型 %d 条，命中公式 %d 条（%.1f%%），待归类 %d 条'
          % (len(content), len(tagged), (len(tagged) / len(content) * 100) if content else 0,
             len(content) - len(tagged)))
    print('全文待归类 %d 条（含引流/带货，按规则一律不标）' % unknowable)
    print('写出 %s' % args.out)


if __name__ == '__main__':
    sys.exit(main())
