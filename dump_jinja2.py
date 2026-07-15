# -*- coding: utf-8 -*-
"""
dump 模板预处理后的 jinja 源码，定位 endif 错误位置
"""
from docxtpl import DocxTemplate
import jinja2

class MyDocx(DocxTemplate):
    def build_xml(self, context, jinja_env=None):
        xml = self.get_xml()
        xml = self.patch_xml(xml)
        with open("jinja_source2.xml", "w", encoding="utf-8") as f:
            f.write(xml)
        try:
            template = jinja2.Template(xml)
        except Exception as e:
            print("Error:", e)
            print("XML saved to jinja_source2.xml")
            return xml
        return template.render(context)

data = {
    "project_name": "test",
    "has_fangjian": True,
    "has_dianli": True,
    "has_nuantong": False,
    "has_qianyin": False,
    "has_jiechuwang": False,
    "has_wuxian": False,
    "has_jixie": False,
    "has_cheliang": False,
}

doc = MyDocx('templates_docx/互提资料模板-施工图-有线通信提站后.docx')
doc.render(data)
