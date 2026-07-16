# -*- coding: utf-8 -*-
"""
分析模板表格结构：找到每个 {%tr if has_xxx %} 所在的行和单元格位置
"""
import docx

path = 'templates_docx/htzl_yxtx_sgt.docx'
doc = docx.Document(path)

for ti, table in enumerate(doc.tables):
    has_tr_tags = False
    for ri, row in enumerate(table.rows):
        row_text = ''
        for ci, cell in enumerate(row.cells):
            row_text += cell.text
        if '{%tr' in row_text:
            if not has_tr_tags:
                print(f'\n=== 表格 {ti}（{len(table.rows)} 行）===')
                has_tr_tags = True
            # 检查是否有 if 和 endif
            has_if = '{%tr' in row_text and 'if' in row_text
            has_endif = 'endif' in row_text
            # 找到标签在哪个单元格
            tag_cell = -1
            for ci, cell in enumerate(row.cells):
                if '{%tr' in cell.text:
                    tag_cell = ci
                    break
            # 最后一个单元格
            last_cell = len(row.cells) - 1
            status = 'OK' if has_endif else 'MISSING endif'
            print(f'  行{ri}: tag_cell={tag_cell}, last_cell={last_cell}, {status}')
            # 显示行文本中的 jinja 标签
            import re
            tags = re.findall(r'\{%[^%]+%\}', row_text)
            for t in tags:
                t = re.sub(r'<[^>]+>', '', t).strip()
                if t:
                    print(f'       tag: {t}')
