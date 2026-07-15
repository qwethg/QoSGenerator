# -*- coding: utf-8 -*-
"""分析 jinja 源码中 if/endif 的配对情况"""
import re

with open('jinja_source2.xml', 'r', encoding='utf-8') as f:
    xml = f.read()

# 提取所有 jinja 标签
tags = re.findall(r'\{%[^%]+%\}', xml)

# 追踪 if/endif 配对
stack = []
errors = []
for i, tag in enumerate(tags):
    tag_clean = re.sub(r'\s+', ' ', tag).strip()
    if 'if ' in tag_clean and 'endif' not in tag_clean:
        stack.append((i, tag_clean))
    elif 'endif' in tag_clean:
        if stack:
            stack.pop()
        else:
            errors.append((i, tag_clean, '多余的 endif，没有对应的 if'))

print('总标签数:', len(tags))
print('未关闭的 if:', len(stack))
print('多余的 endif:', len(errors))

if stack:
    print('\n=== 未关闭的 if ===')
    for idx, tag in stack:
        print(f'  标签#{idx}: {tag}')

if errors:
    print('\n=== 多余的 endif ===')
    for idx, tag, msg in errors:
        print(f'  标签#{idx}: {tag} ({msg})')

# 打印前 150 个标签的配对情况
print('\n=== 前 150 个标签 ===')
for i, tag in enumerate(tags[:150]):
    tag_clean = re.sub(r'\s+', ' ', tag).strip()
    marker = ''
    if 'if ' in tag_clean and 'endif' not in tag_clean:
        marker = ' <<IF'
    elif 'endif' in tag_clean:
        marker = ' <<ENDIF'
    print(f'{i:3d}: {tag_clean}{marker}')
