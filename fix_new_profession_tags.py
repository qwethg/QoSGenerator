# -*- coding: utf-8 -*-
"""修复新增专业模块误用 {%tr %} 的模板标签。"""

import os
import shutil
import tempfile
import zipfile
from copy import deepcopy

from lxml import etree


DOCX_PATH = r"templates_docx/互提资料模板-施工图-有线通信提站后.docx"
FIXED_DOCX_PATH = r"templates_docx/互提资料模板-施工图-有线通信提站后-修复版.docx"
BACKUP_PATH = DOCX_PATH + ".bak_new_professions"
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_NS = "http://www.w3.org/XML/1998/namespace"

TARGET_REPLACEMENTS = {
    "{%tr if has_common %}": "{%p if has_common %}",
    "{%tr if has_luji %}": "{%p if has_luji %}",
    "{%tr if has_suidao %}": "{%p if has_suidao %}",
    "{%tr if has_qiaoliang %}": "{%p if has_qiaoliang %}",
    "{%tr if has_zhanchang %}": "{%p if has_zhanchang %}",
    "{%tr endif %}": "{%p endif %}",
}


def w(tag):
    return f"{{{W_NS}}}{tag}"


def get_paragraph_text(paragraph):
    return "".join(node.text or "" for node in paragraph.iter(w("t"))).strip()


def replace_paragraph_text(paragraph, new_text):
    runs = paragraph.findall(w("r"))
    first_rpr = None
    if runs:
        first_rpr = runs[0].find(w("rPr"))
    for run in runs:
        paragraph.remove(run)

    new_run = etree.SubElement(paragraph, w("r"))
    if first_rpr is not None:
        new_run.append(deepcopy(first_rpr))
    new_text_node = etree.SubElement(new_run, w("t"))
    new_text_node.set(f"{{{XML_NS}}}space", "preserve")
    new_text_node.text = new_text


def main():
    if not os.path.exists(BACKUP_PATH):
        shutil.copy2(DOCX_PATH, BACKUP_PATH)
        print("已创建备份:", BACKUP_PATH)
    else:
        print("使用已有备份:", BACKUP_PATH)

    with zipfile.ZipFile(DOCX_PATH) as zf:
        xml_bytes = zf.read("word/document.xml")

    root = etree.fromstring(xml_bytes)

    replacements = []
    tracked_starts = {
        "{%tr if has_common %}",
        "{%tr if has_luji %}",
        "{%tr if has_suidao %}",
        "{%tr if has_qiaoliang %}",
        "{%tr if has_zhanchang %}",
    }
    pending_new_section = False

    for index, paragraph in enumerate(root.iter(w("p"))):
        text = get_paragraph_text(paragraph)
        if text in tracked_starts:
            replace_paragraph_text(paragraph, TARGET_REPLACEMENTS[text])
            replacements.append((index, text, TARGET_REPLACEMENTS[text]))
            pending_new_section = True
            continue

        if pending_new_section and text == "{%tr endif %}":
            replace_paragraph_text(paragraph, "{%p endif %}")
            replacements.append((index, text, "{%p endif %}"))
            pending_new_section = False

    if pending_new_section:
        raise RuntimeError("存在未闭合的新专业段落标签，未找到对应的 {%tr endif %}")

    if not replacements:
        raise RuntimeError("未找到需要修复的新增专业标签")

    tmp_dir = os.path.dirname(os.path.abspath(FIXED_DOCX_PATH))
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".docx", dir=tmp_dir)
    os.close(tmp_fd)

    try:
        with zipfile.ZipFile(DOCX_PATH, "r") as zin:
            with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zout:
                for item in zin.infolist():
                    if item.filename == "word/document.xml":
                        xml_out = etree.tostring(
                            root,
                            encoding="UTF-8",
                            xml_declaration=True,
                            standalone=True,
                        )
                        zout.writestr(item, xml_out)
                    else:
                        zout.writestr(item, zin.read(item.filename))
        shutil.move(tmp_path, FIXED_DOCX_PATH)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    print("已输出修复模板:", FIXED_DOCX_PATH)
    print("已完成修复，共替换标签:", len(replacements))
    for index, old_text, new_text in replacements:
        print(f"  段落#{index}: {old_text} -> {new_text}")


if __name__ == "__main__":
    main()
