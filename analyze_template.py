#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import zipfile, re
from collections import defaultdict

path = 'templates_docx/htzl_yxtx_sgt.docx'

with zipfile.ZipFile(path) as z:
    xml = z.read('word/document.xml').decode('utf-8')

# 提取所有 {{...}} 和 {%...%}
raw = re.findall(r'\{\{[^}]+\}\}|\{%[^%]+%\}', xml)

# 清理并分类
tags = []
for t in raw:
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    if not t:
        continue
    tags.append(t)

from collections import Counter
c = Counter(tags)

# 分类
categories = defaultdict(list)
for t in sorted(set(tags)):
    if t.startswith('{%p'):
        categories['章节控制'].append(t)
    elif t.startswith('{%tr'):
        categories['表格行控制'].append(t)
    elif t.startswith('{{ has_'):
        categories['布尔开关'].append(t)
    elif t.startswith('{{ idx_el_'):
        categories['电力序号'].append(t)
    elif t.startswith('{{ idx_me_'):
        categories['机械序号'].append(t)
    elif t.startswith('{{ idx_'):
        categories['房建序号'].append(t)
    elif t.startswith('{{ el_'):
        categories['el变量'].append(t)
    elif t.startswith('{{ p_'):
        categories['用电量'].append(t)
    elif t.startswith('{{ h_'):
        categories['散热量'].append(t)
    elif t.startswith('{{ area_'):
        categories['面积'].append(t)
    elif t.startswith('{{ loc_'):
        categories['地点'].append(t)
    elif t.startswith('{{ staff_'):
        categories['定员'].append(t)
    elif t.startswith('{{ trench_') or t.startswith('{{ branch_') or t.startswith('{{ trough_'):
        categories['电缆沟'].append(t)
    else:
        categories['其他'].append(t)

with open('template_analysis.txt', 'w', encoding='utf-8') as f:
    for cat, items in categories.items():
        f.write(f'\n=== {cat} ===\n')
        for item in items:
            f.write(f'{c[item]:2d}  {item}\n')

print('saved to template_analysis.txt')
