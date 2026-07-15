import zipfile, re
from collections import Counter

def extract_clean_tags(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml').decode('utf-8')
    raw = re.findall(r'\{\{[^}]+\}\}|\{%[^%]+%\}', xml)
    clean = []
    for t in raw:
        t = re.sub(r'<[^>]+>', '', t)
        t = re.sub(r'\s+', ' ', t).strip()
        if t:
            clean.append(t)
    return clean

with open('template_tags.txt', 'w', encoding='utf-8') as f:
    for path in ['templates_docx/互提资料模板-施工图.docx', 'templates_docx/互提资料模板-施工图-有线通信提站后.docx']:
        tags = extract_clean_tags(path)
        f.write(f'=== {path} ===\n')
        f.write(f'total: {len(tags)}, unique: {len(set(tags))}\n')
        c = Counter(tags)
        for t, n in sorted(c.items(), key=lambda x: x[0]):
            f.write(f'{n:2d}  {t}\n')
        f.write('\n')

print('saved to template_tags.txt')
