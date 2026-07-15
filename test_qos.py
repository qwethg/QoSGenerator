from docxtpl import DocxTemplate
doc = DocxTemplate('templates_docx/QoS模板.docx')
doc.render({'final_audit_level': '院级'})
