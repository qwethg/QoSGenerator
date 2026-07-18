# -*- coding: utf-8 -*-
"""
修复模板：
1. 合并被 Word 拆分的 {%tr if has_xxx %} 标签（多个 w:r 合并为一个）
2. 为每个 {%tr if %} 行补充 {%tr endif %}
直接操作 XML，避免 python-docx 合并单元格问题
"""
import shutil
import zipfile
import re
from lxml import etree
from copy import deepcopy

src = 'templates_docx/htzl_yxtx_sgt.docx'
bak = 'templates_docx/htzl_yxtx_sgt.docx.bak3'
shutil.copy2(src, bak)
print('已备份到', bak)

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
XML_NS = 'http://www.w3.org/XML/1998/namespace'

def w(tag):
    return '{%s}%s' % (W_NS, tag)

# 读取 document.xml
with zipfile.ZipFile(src) as z:
    xml_bytes = z.read('word/document.xml')

tree = etree.fromstring(xml_bytes)

# ========== 第一步：合并拆分的 jinja 标签 ==========
# 遍历所有 <w:p>，检查其中是否有被拆分的 {%tr if %} 标签
merged_count = 0

for p in tree.iter(w('p')):
    # 获取段落中所有 <w:r> 的文本
    runs = p.findall(w('r'))
    if not runs:
        continue

    full_text = ''
    for r in runs:
        for t in r.findall(w('t')):
            full_text += t.text or ''

    # 检查是否包含被拆分的 jinja 标签
    # 匹配 {%tr if xxx %} 或 {% if xxx %} 等（跨多个 run）
    if '{%' not in full_text or '%}' not in full_text:
        continue

    # 提取所有 jinja 标签
    jinja_tags = re.findall(r'\{%[^%]*%\}', full_text)
    if not jinja_tags:
        continue

    # 检查是否有需要合并的标签（{%tr 开头）
    has_tr_tag = any('{%tr' in t or '{%p' in t for t in jinja_tags)
    if not has_tr_tag:
        continue

    # 合并：保留第一个 run 的格式，替换其文本为完整的标签文本
    # 将所有 run 的文本合并，然后用第一个 run 承载完整文本
    first_run = runs[0]
    # 收集第一个 run 的 rPr（格式）
    rpr = first_run.find(w('rPr'))

    # 清除所有现有 run
    for r in runs:
        p.remove(r)

    # 为每个 jinja 标签创建一个干净的 run
    # 同时保留非 jinja 文本
    remaining = full_text
    parts = []
    pos = 0
    for m in re.finditer(r'\{%[^%]*%\}', full_text):
        if m.start() > pos:
            parts.append(('text', full_text[pos:m.start()]))
        tag_text = m.group(0)
        # 清理标签内的 XML 残留
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

# ========== 第二步：补充 {%tr endif %} ==========
fixed_count = 0

for tr in tree.iter(w('tr')):
    # 获取该行自身的文本
    row_text = ' '.join(tr.itertext())

    # 检查是否有 {%tr if 且没有 {%tr endif
    if '{%tr' not in row_text:
        continue
    if 'if' not in row_text:
        continue
    if 'endif' in row_text:
        continue

    # 找到该行最后一个 <w:tc>
    tcs = tr.findall(w('tc'))
    if not tcs:
        continue
    last_tc = tcs[-1]

    # 找到最后一个 <w:p>
    ps = last_tc.findall(w('p'))
    if not ps:
        p = etree.SubElement(last_tc, w('p'))
    else:
        p = ps[-1]

    # 在段落末尾添加 {%tr endif %}
    r = etree.SubElement(p, w('r'))
    t = etree.SubElement(r, w('t'))
    t.set('{%s}space' % XML_NS, 'preserve')
    t.text = ' {%tr endif %}'

    fixed_count += 1

print('补充了 %d 个 tr_endif' % fixed_count)

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
