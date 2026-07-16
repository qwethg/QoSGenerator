# -*- coding: utf-8 -*-
"""修复模板中 {{ idx_ txyrjx }} 的空格问题（XML 级别）"""
import zipfile, re, os, tempfile, shutil
from lxml import etree

src = 'templates_docx/htzl_yxtx_sgt.docx'
W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
XML_NS = 'http://www.w3.org/XML/1998/namespace'

def w(tag):
    return '{%s}%s' % (W_NS, tag)

with zipfile.ZipFile(src) as z:
    xml_bytes = z.read('word/document.xml')

tree = etree.fromstring(xml_bytes)

# 遍历所有 <w:p>，合并文本后检查是否有 idx_ txyrjx
fixed = 0
for p in tree.iter(w('p')):
    full_text = ''
    runs = p.findall(w('r'))
    for r in runs:
        for t in r.findall(w('t')):
            full_text += t.text or ''

    if 'idx_' in full_text and 'txyrjx' in full_text:
        # 检查是否是 idx_ txyrjx（中间有空格或被 run 拆分）
        clean = re.sub(r'\s+', ' ', full_text).strip()
        if 'idx_ txyrjx' in clean:
            # 需要合并：找到 idx_ 所在的 run 和 txyrjx 所在的 run
            # 将所有 run 文本合并，修复后重新分配
            # 简单方案：把 idx_ 后面的空格去掉
            new_text = full_text.replace('idx_ txyrjx', 'idx_txyrjx')
            new_text = new_text.replace('idx_  txyrjx', 'idx_txyrjx')

            if new_text != full_text:
                # 重建段落：保留第一个 run 的格式
                first_run = runs[0]
                rpr = first_run.find(w('rPr'))

                for r in runs:
                    p.remove(r)

                # 用一个 run 承载修复后的文本
                # 但要保留 jinja 标签的结构
                # 分割文本，每个 jinja 标签一个 run
                parts = []
                pos = 0
                for m in re.finditer(r'\{%[^%]*%\}|\{\{[^}]*\}\}', new_text):
                    if m.start() > pos:
                        parts.append(('text', new_text[pos:m.start()]))
                    tag_text = m.group(0)
                    tag_text = re.sub(r'\s+', ' ', tag_text).strip()
                    parts.append(('tag', tag_text))
                    pos = m.end()
                if pos < len(new_text):
                    parts.append(('text', new_text[pos:]))

                for ptype, ptext in parts:
                    if not ptext:
                        continue
                    new_r = etree.SubElement(p, w('r'))
                    if rpr is not None:
                        from copy import deepcopy
                        new_r.append(deepcopy(rpr))
                    new_t = etree.SubElement(new_r, w('t'))
                    new_t.set('{%s}space' % XML_NS, 'preserve')
                    new_t.text = ptext

                fixed += 1

print('修复了 %d 个 idx_ txyrjx' % fixed)

# 写回
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
print('已保存')
