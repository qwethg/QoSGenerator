# -*- coding: utf-8 -*-
"""验证新增专业与通用条款模块模板可正常渲染。"""

import unittest

from docx import Document

from app import generate_cross_data_docx


class NewProfessionsTemplateTest(unittest.TestCase):
    """覆盖新增专业模块的最小渲染场景。"""

    def test_new_professions_render_successfully(self):
        scenarios = [
            {"has_luji": True},
            {"has_suidao": True},
            {"has_qiaoliang": True},
            {"has_zhanchang": True},
            {"has_common": True},
        ]

        for flags in scenarios:
            with self.subTest(flags=flags):
                data = {"project_name": "模板修复测试"}
                data.update(flags)
                output, error = generate_cross_data_docx(data)
                self.assertIsNone(error, msg=error)
                self.assertIsNotNone(output)

    def test_selected_chapters_are_renumbered_continuously(self):
        data = {
            "project_name": "章节序号测试",
            "has_luji": True,
            "has_qiaoliang": True,
            "has_fangjian": True,
            "has_nuantong": True,
            "has_cheliang": True,
            "has_dianli": False,
            "has_suidao": False,
            "has_zhanchang": False,
            "has_qianyin": False,
            "has_jiechuwang": False,
            "has_wuxian": False,
            "has_jixie": False,
        }

        output, error = generate_cross_data_docx(data)
        self.assertIsNone(error, msg=error)
        self.assertIsNotNone(output)

        doc = Document(output)
        headings = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        selected_headings = [
            text for text in headings
            if text in {
                '一、通用要求',
                '二、路基专业',
                '三、桥梁专业',
                '四、房建',
                '五、暖通',
                '六、车辆',
            }
        ]

        self.assertEqual(
            selected_headings,
            ['一、通用要求', '二、路基专业', '三、桥梁专业', '四、房建', '五、暖通', '六、车辆']
        )
        self.assertNotIn('一、房建', headings)
        self.assertNotIn('四、桥梁专业', headings)
        self.assertNotIn('八、车辆', headings)


if __name__ == "__main__":
    unittest.main()
