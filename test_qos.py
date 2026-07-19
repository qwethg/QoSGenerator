from docxtpl import DocxTemplate
doc = DocxTemplate('templates_docx/QoS-template.docx')
doc.render({'final_audit_level': '院级'})
