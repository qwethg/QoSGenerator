# -*- coding: utf-8 -*-
"""详细检查 patch_xml 对 {%tr if %} 的处理"""
from docxtpl import DocxTemplate
import re

doc = DocxTemplate('templates_docx/htzl_yxtx_sgt.docx')
doc.init_docx()
raw = doc.get_xml()
patched = doc.patch_xml(raw)

# 在 patched 中查找所有 {% if 和 {%tr if
pat_if = re.findall(r'\{%[-~]?\s*if\s+\w+\s*%\}', patched)
pat_tr_if = re.findall(r'\{%tr\s+if', patched)
pat_endif = re.findall(r'\{%[-~]?\s*endif\s*%\}', patched)
pat_tr_endif = re.findall(r'\{%tr\s+endif', patched)

print('patch 后:')
print('  {% if xxx %}:', len(pat_if))
print('  {%tr if:', len(pat_tr_if))
print('  {% endif %}:', len(pat_endif))
print('  {%tr endif:', len(pat_tr_endif))

# 查找 patched 中所有包含 if 的标签
all_if_tags = re.findall(r'\{%[^%]*if[^%]*%\}', patched)
print('\n所有包含 if 的标签:')
for t in all_if_tags[:20]:
    t_clean = re.sub(r'<[^>]+>', '', t)
    t_clean = re.sub(r'\s+', ' ', t_clean).strip()
    print(' ', repr(t_clean))

# 检查 {%tr if has_txz %} 在 patched 中变成了什么
idx = patched.find('has_txz')
if idx >= 0:
    start = max(0, idx - 200)
    end = min(len(patched), idx + 200)
    print('\n=== has_txz 在 patched 中的上下文 ===')
    print(patched[start:end])
