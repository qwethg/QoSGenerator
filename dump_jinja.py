from docxtpl import DocxTemplate
import jinja2
import os

class MyDocx(DocxTemplate):
    def build_xml(self, context, jinja_env=None):
        xml = self.get_xml()
        xml = self.patch_xml(xml)
        with open("jinja_source.xml", "w", encoding="utf-8") as f:
            f.write(xml)
        try:
            template = jinja2.Template(xml)
        except Exception as e:
            raise e
        return template.render(context)

from app import generate_cross_data_docx

data = {
    "project_name": "测试湛海高铁",
    "design_stage": "施工图",
    "doc_id": "互提资料-测试01",
    "source_institute": "通号院",
    "source_profession": "有线通信",
    "has_fangjian": True,
    "has_dianli": True,
    "has_nuantong": False,
    "has_qianyin": False,
    "has_jiechuwang": False,
    "has_wuxian": False,
    "has_jixie": False,
    "has_cheliang": False,
}

# 直接加载模板，只检查语法，不生成
try:
    doc = MyDocx('templates_docx/互提资料模板-施工图-有线通信提站后.docx')
    doc.render(data)
except Exception as e:
    print("Error:", e)
    print("XML saved to jinja_source.xml")
