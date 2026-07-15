# -*- coding: utf-8 -*-
"""检查合并后 {%tr if %} 标签在 XML 中的实际形态"""
import zipfile, re

with zipfile.ZipFile('templates_docx/互提资料模板-施工图-有线通信提站后.docx') as z:
    xml = z.read('word/document.xml').decode('utf-8')

# 找到第一个 {%tr if 的位置
idx = xml.find('{%tr')
if idx == -1:
    print('未找到 {%tr')
else:
    # 显示前后 500 字符
    start = max(0, idx - 100)
    end = min(len(xml), idx + 500)
    snippet = xml[start:end]
    print('=== 第一个 {%tr 附近 ===')
    print(snippet)
    print()

# 统计 {%tr if 的各种形态
# 完整的 {%tr if has_xxx %}
complete = re.findall(r'\{%tr\s+if\s+\w+\s*%\}', xml)
print('完整标签数:', len(complete))
for t in complete[:5]:
    print(' ', repr(t))

# 被拆分的（{%tr 在一个 w:t，if 在另一个）
split = re.findall(r'\{%tr[^%]*$', xml, re.MULTILINE)
print('\n被拆分的 {%tr 开头:', len(split))

# 查找所有包含 {% 的 w:t 片段
wt_tags = re.findall(r'<w:t[^>]*>([^<]*\{%[^<]*)</w:t>', xml)
print('\n包含 {% 的 w:t 片段数:', len(wt_tags))
for t in wt_tags[:10]:
    print(' ', repr(t))
