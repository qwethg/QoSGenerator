import zipfile, re
from collections import Counter

path = 'templates_docx/htzl_yxtx_sgt.docx'
with zipfile.ZipFile(path) as z:
    xml = z.read('word/document.xml').decode('utf-8')

pattern = re.compile(r'\{%tr\s+(if\s+[^%]+|endif)\s*%\}')
matches = list(pattern.finditer(xml))

if_count = Counter()
endif_count = 0
for m in matches:
    tag = m.group(1)
    if tag.startswith('if '):
        cond = tag[3:].strip()
        if_count[cond] += 1
    else:
        endif_count += 1

print('=== 统计 ===')
print('共 %d 个 tr_if，%d 个 tr_endif' % (sum(if_count.values()), endif_count))
print()
print('=== 每个条件对应的 if 数量 ===')
for cond, n in sorted(if_count.items()):
    print('  has_%s: %d 个 if，需要 %d 个 endif' % (cond, n, n))

print()
print('总计需要补充 %d 个 tr_endif' % (sum(if_count.values()) - endif_count))
