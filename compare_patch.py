# -*- coding: utf-8 -*-
"""对比两个模板的 patch 结果"""
from docxtpl import DocxTemplate
import re

for path in ['templates_docx/互提资料模板-施工图.docx', 'templates_docx/互提资料模板-施工图-有线通信提站后.docx']:
    doc = DocxTemplate(path)
    doc.init_docx()
    raw = doc.get_xml()
    patched = doc.patch_xml(raw)

    raw_tr_if = len(re.findall(r'\{%tr\s+if', raw))
    raw_tr_endif = len(re.findall(r'\{%tr\s+endif', raw))
    pat_if = len(re.findall(r'\{%\s*if\s', patched))
    pat_endif = len(re.findall(r'\{%\s*endif\s*%\}', patched))

    print('%s' % path)
    print('  原始: tr_if=%d, tr_endif=%d' % (raw_tr_if, raw_tr_endif))
    print('  patch后: if=%d, endif=%d' % (pat_if, pat_endif))
    print()
