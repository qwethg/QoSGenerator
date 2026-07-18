from docxtpl import DocxTemplate
import jinja2

class MyDocx(DocxTemplate):
    def render_xml_part(self, src_xml, part, context, jinja_env):
        src_xml = super().render_xml_part(src_xml, part, context, jinja_env)
        return src_xml
    
    def build_xml(self, context, jinja_env=None):
        xml = self.get_xml()
        xml = self.patch_xml(xml)
        
        # intercept here
        try:
            template = jinja_env.from_string(xml)
        except Exception as e:
            with open("jinja_source.txt", "w", encoding="utf-8") as f:
                f.write(xml)
            raise e
        return template.render(context)

doc = MyDocx('templates_docx/互提资料模板-施工图.docx')
try:
    doc.render({"has_fj": True, "has_dl": True, "has_cl": True})
except Exception as e:
    pass
