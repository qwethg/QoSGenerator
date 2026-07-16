# -*- coding: utf-8 -*-
"""修复模板中 {{ idx_ txyrjx }} 的空格问题"""
import zipfile, re, os, tempfile, shutil

src = 'templates_docx/htzl_yxtx_sgt.docx'

with zipfile.ZipFile(src) as z:
    files = {name: z.read(name) for name in z.namelist()}

xml = files['word/document.xml'].decode('utf-8')
# 修复 {{ idx_ txyrjx }} -> {{ idx_txyrjx }}
fixed_xml = xml.replace('idx_ txyrjx', 'idx_txyrjx')
count = xml.count('idx_ txyrjx')
print('修复了 %d 处 idx_ txyrjx' % count)

files['word/document.xml'] = fixed_xml.encode('utf-8')

tmp_fd, tmp_path = tempfile.mkstemp(suffix='.docx')
os.close(tmp_fd)

with zipfile.ZipFile(tmp_path, 'w', zipfile.ZIP_DEFLATED) as zout:
    for name, data in files.items():
        zout.writestr(name, data)

shutil.move(tmp_path, src)
print('已保存')
