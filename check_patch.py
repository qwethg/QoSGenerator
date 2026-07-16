# -*- coding: utf-8 -*-
"""检查 docxtpl patch_xml 前后的 {%tr %} 标签变化"""
from docxtpl import DocxTemplate
import re

doc = DocxTemplate('templates_docx/htzl_yxtx_sgt.docx')
doc.init_docx()

# 原始 XML
raw_xml = doc.get_xml()
raw_tr_if = len(re.findall(r'\{%tr\s+if', raw_xml))
raw_tr_endif = len(re.findall(r'\{%tr\s+endif', raw_xml))
print('原始 XML: tr_if=%d, tr_endif=%d' % (raw_tr_if, raw_tr_endif))

# patch 后的 XML
patched_xml = doc.patch_xml(raw_xml)
pat_tr_if = len(re.findall(r'\{%tr\s+if', patched_xml))
pat_tr_endif = len(re.findall(r'\{%tr\s+endif', patched_xml))
pat_if = len(re.findall(r'\{%\s*if\s', patched_xml))
pat_endif = len(re.findall(r'\{%\s*endif\s*%\}', patched_xml))
print('patch 后: tr_if=%d, tr_endif=%d' % (pat_tr_if, pat_tr_endif))
print('patch 后: if=%d, endif=%d' % (pat_if, pat_endif))

# 查看 patch 后 tr 标签变成了什么
# 找 {%tr 相关的片段
matches = re.findall(r'\{%[^%]*tr[^%]*%\}', patched_xml)
print('\npatch 后包含 tr 的标签:', len(matches))
for m in matches[:10]:
    print(' ', m)

# 检查 {% if 和 {% endif 是否在 <w:tr> 标签附近
# 提取 patch 后的 if/endif 标签
all_tags = re.findall(r'\{%[^%]+%\}', patched_xml)
tr_if_count = 0
tr_endif_count = 0
plain_if = 0
plain_endif = 0
for t in all_tags:
    t_clean = re.sub(r'\s+', ' ', t).strip()
    if 'if ' in t_clean and 'endif' not in t_clean:
        plain_if += 1
    elif 'endif' in t_clean:
        plain_endif += 1

print('\npatch 后所有标签: if=%d, endif=%d' % (plain_if, plain_endif))
