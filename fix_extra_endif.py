# -*- coding: utf-8 -*-
"""删除模板中多余的 {%tr endif %} 行（没有对应 {%tr if %} 的）"""
import zipfile, re
from lxml import etree

src = 'templates_docx/互提资料模板-施工图-有线通信提站后.docx'
W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
XML_NS = 'http://www.w3.org/XML/1998/namespace'

def w(tag):
    return '{%s}%s' % (W_NS, tag)

with zipfile.ZipFile(src) as z:
    xml_bytes = z.read('word/document.xml')

tree = etree.fromstring(xml_bytes)

# 遍历所有表格，检查每行的 if/endif 配对
removed = 0
for table in tree.iter(w('tbl')):
    rows = table.findall(w('tr'))
    # 追踪 if 栈
    if_stack = []
    for tr in rows:
        row_text = ' '.join(tr.itertext())
        has_tr_if = bool(re.search(r'\{%tr\s+if\s', row_text))
        has_tr_endif = bool(re.search(r'\{%tr\s+endif', row_text))

        if has_tr_if:
            if_stack.append(tr)
        elif has_tr_endif:
            if if_stack:
                if_stack.pop()
            else:
                # 多余的 endif 行，删除
                table.remove(tr)
                removed += 1
                print('删除多余的 endif 行')

# 写回
import os, tempfile, shutil
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
print('删除了 %d 个多余的 endif 行' % removed)
