# -*- coding: utf-8 -*-
"""
修复模板 v4：正确放置 {%tr if %} 和 {%tr endif %}
docxtpl 的 {%tr %} 语法要求：
- {%tr if xxx %} 独占一行（该行会被替换为 {% if xxx %}，行本身消失）
- 数据行保持正常内容
- {%tr endif %} 独占一行（该行会被替换为 {% endif %}，行本身消失）

当前问题：{%tr if %} 和数据在同一个 <w:tr> 中，导致整行被删除
修复方案：
1. 移除数据行中的 {%tr if has_xxx %} 标签
2. 在数据行前插入一个新行，只含 {%tr if has_xxx %}
3. 移除数据行中的 {%tr endif %} 标签（之前脚本添加的）
4. 在数据行后插入一个新行，只含 {%tr endif %}
"""
import shutil
import zipfile
import re
from lxml import etree
from copy import deepcopy

src = 'templates_docx/互提资料模板-施工图-有线通信提站后.docx'
# 从 bak3（合并标签后、添加 endif 后的版本）开始
# 但 bak3 的 endif 位置不对，需要从 bak（原始）重新开始
bak = 'templates_docx/互提资料模板-施工图-有线通信提站后.docx.bak'
shutil.copy2(bak, src)
print('从原始备份恢复')

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
XML_NS = 'http://www.w3.org/XML/1998/namespace'

def w(tag):
    return '{%s}%s' % (W_NS, tag)

with zipfile.ZipFile(src) as z:
    xml_bytes = z.read('word/document.xml')

tree = etree.fromstring(xml_bytes)

# ========== 第一步：合并拆分的 jinja 标签 ==========
merged_count = 0

for p in tree.iter(w('p')):
    runs = p.findall(w('r'))
    if not runs:
        continue

    full_text = ''
    for r in runs:
        for t in r.findall(w('t')):
            full_text += t.text or ''

    if '{%' not in full_text or '%}' not in full_text:
        continue

    jinja_tags = re.findall(r'\{%[^%]*%\}', full_text)
    if not jinja_tags:
        continue

    has_tr_tag = any('{%tr' in t for t in jinja_tags)
    if not has_tr_tag:
        continue

    first_run = runs[0]
    rpr = first_run.find(w('rPr'))

    for r in runs:
        p.remove(r)

    remaining = full_text
    pos = 0
    parts = []
    for m in re.finditer(r'\{%[^%]*%\}', full_text):
        if m.start() > pos:
            parts.append(('text', full_text[pos:m.start()]))
        tag_text = m.group(0)
        tag_text = re.sub(r'\s+', ' ', tag_text).strip()
        parts.append(('tag', tag_text))
        pos = m.end()
    if pos < len(full_text):
        parts.append(('text', full_text[pos:]))

    for ptype, ptext in parts:
        if not ptext:
            continue
        new_r = etree.SubElement(p, w('r'))
        if rpr is not None:
            new_r.append(deepcopy(rpr))
        new_t = etree.SubElement(new_r, w('t'))
        new_t.set('{%s}space' % XML_NS, 'preserve')
        new_t.text = ptext

    merged_count += 1

print('合并了 %d 个段落的拆分标签' % merged_count)

# ========== 第二步：为每个含 {%tr if %} 的行，拆分为三行 ==========
# 收集需要处理的行
rows_to_fix = []

for tr in tree.iter(w('tr')):
    row_text = ' '.join(tr.itertext())
    if '{%tr' not in row_text or 'if' not in row_text:
        continue
    if 'endif' in row_text:
        continue
    # 提取 if 条件
    m = re.search(r'\{%tr\s+if\s+(\w+)\s*%\}', row_text)
    if m:
        condition = m.group(1)
        rows_to_fix.append((tr, condition))

print('找到 %d 个需要修复的行' % len(rows_to_fix))

fixed_count = 0
for tr, condition in rows_to_fix:
    parent = tr.getparent()
    if parent is None:
        continue

    tr_index = list(parent).index(tr)

    # 1. 从数据行中移除 {%tr if has_xxx %} 标签
    for p in tr.iter(w('p')):
        runs = p.findall(w('r'))
        for r in runs:
            r_text = ''
            for t in r.findall(w('t')):
                r_text += t.text or ''
            if '{%tr' in r_text and 'if' in r_text:
                p.remove(r)
                break

    # 2. 在数据行前插入一个新行，只含 {%tr if has_xxx %}
    if_row = etree.Element(w('tr'))
    # 复制数据行的 trPr（行属性）
    trpr = tr.find(w('trPr'))
    if trpr is not None:
        if_row.append(deepcopy(trpr))
    # 创建一个只有一个 cell 的行
    if_tc = etree.SubElement(if_row, w('tc'))
    if_tc_pr = etree.SubElement(if_tc, w('tcPr'))
    if_tc_w = etree.SubElement(if_tc_pr, w('tcW'))
    if_tc_w.set(w('w'), '0')
    if_tc_w.set(w('type'), 'auto')
    if_p = etree.SubElement(if_tc, w('p'))
    if_r = etree.SubElement(if_p, w('r'))
    if_t = etree.SubElement(if_r, w('t'))
    if_t.set('{%s}space' % XML_NS, 'preserve')
    if_t.text = '{%%tr if %s %%}' % condition

    parent.insert(tr_index, if_row)

    # 3. 在数据行后插入一个新行，只含 {%tr endif %}
    endif_row = etree.Element(w('tr'))
    if trpr is not None:
        endif_row.append(deepcopy(trpr))
    endif_tc = etree.SubElement(endif_row, w('tc'))
    endif_tc_pr = etree.SubElement(endif_tc, w('tcPr'))
    endif_tc_w = etree.SubElement(endif_tc_pr, w('tcW'))
    endif_tc_w.set(w('w'), '0')
    endif_tc_w.set(w('type'), 'auto')
    endif_p = etree.SubElement(endif_tc, w('p'))
    endif_r = etree.SubElement(endif_p, w('r'))
    endif_t = etree.SubElement(endif_r, w('t'))
    endif_t.set('{%s}space' % XML_NS, 'preserve')
    endif_t.text = '{%tr endif %}'

    # 数据行现在在 tr_index + 1 的位置
    parent.insert(tr_index + 2, endif_row)

    fixed_count += 1

print('修复了 %d 个行' % fixed_count)

# ========== 写回 docx ==========
import os
import tempfile

tmp_fd, tmp_path = tempfile.mkstemp(suffix='.docx')
os.close(tmp_fd)

with zipfile.ZipFile(src, 'r') as zin:
    with zipfile.ZipFile(tmp_path, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == 'word/document.xml':
                zout.writestr(item, etree.tostring(tree, xml_declaration=True, encoding='UTF-8', standalone=True))
            else:
                zout.writestr(item, zin.read(item.filename))

shutil.move(tmp_path, src)
print('已保存到', src)
