# -*- coding: utf-8 -*-
"""
在 XML 级别为每个 {%tr if has_xxx %} 行补充 {%tr endif %}
直接操作 word/document.xml，避免 python-docx 合并单元格的误判
"""
import shutil
import zipfile
import re
from lxml import etree

src = 'templates_docx/htzl_yxtx_sgt.docx'
bak = 'templates_docx/htzl_yxtx_sgt.docx.bak2'
shutil.copy2(src, bak)
print('已备份到', bak)

# 读取 document.xml
with zipfile.ZipFile(src) as z:
    xml_bytes = z.read('word/document.xml')

tree = etree.fromstring(xml_bytes)
nsmap = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

fixed_count = 0

# 遍历所有 <w:tr> 元素
for tr in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr'):
    # 获取该行自身的文本（不含合并单元格的重复内容）
    texts = tr.itertext()
    row_text = ' '.join(texts)

    # 检查是否有 {%tr if 且没有 {%tr endif
    if '{%tr' not in row_text:
        continue
    if 'if' not in row_text:
        continue
    if 'endif' in row_text:
        continue

    # 找到该行最后一个 <w:tc>
    tcs = tr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tc')
    if not tcs:
        continue
    last_tc = tcs[-1]

    # 找到最后一个 <w:p>
    ps = last_tc.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
    if not ps:
        # 创建一个新的 <w:p>
        p = etree.SubElement(last_tc, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
    else:
        p = ps[-1]

    # 在段落末尾添加 <w:r><w:t xml:space="preserve"> {%tr endif %}</w:t></w:r>
    r = etree.SubElement(p, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r')
    t = etree.SubElement(r, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')
    t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    t.text = ' {%tr endif %}'

    fixed_count += 1

print('共补充 %d 个 endif' % fixed_count)

# 写回 docx
# 读取原始 zip 中所有文件，替换 document.xml
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
