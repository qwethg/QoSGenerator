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

    # 下述章节序号重排测试在取消 Python 端重排后废弃（现已改由 Word 内部自动编号处理）
    # def test_selected_chapters_are_renumbered_continuously(self):
    #     data = {
    #         "project_name": "章节序号测试",
    #         "has_luji": True,
    #         "has_qiaoliang": True,
    #         "has_fangjian": True,
    #         "has_nuantong": True,
    #         "has_cheliang": True,
    #         "has_dianli": False,
    #         "has_suidao": False,
    #         "has_zhanchang": False,
    #         "has_qianyin": False,
    #         "has_jiechuwang": False,
    #         "has_wuxian": False,
    #         "has_jixie": False,
    #     }
    # 
    #     output, error = generate_cross_data_docx(data)
    #     self.assertIsNone(error, msg=error)
    #     self.assertIsNotNone(output)
    # 
    #     doc = Document(output)
    #     headings = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    #     selected_headings = [
    #         text for text in headings
    #         if text in {
    #             '一、通用要求',
    #             '二、路基专业',
    #             '三、桥梁专业',
    #             '四、房建',
    #             '五、暖通',
    #             '六、车辆',
    #         }
    #     ]
    # 
    #     self.assertEqual(
    #         selected_headings,
    #         ['一、通用要求', '二、路基专业', '三、桥梁专业', '四、房建', '五、暖通', '六、车辆']
    #     )
    #     self.assertNotIn('一、房建', headings)
    #     self.assertNotIn('四、桥梁专业', headings)
    #     self.assertNotIn('八、车辆', headings)

    def test_station_front_bridge_video_flag_is_read_from_nested_group(self):
        """站前基础信息：桥梁疏散通道视频标志从 station_front 分组读取"""
        data = {
            "project_name": "站前基础信息测试",
            "has_qiaoliang": True,
            "station_front": {
                "has_qlsstdsp": True
            }
        }

        output, error = generate_cross_data_docx(data)

        self.assertIsNone(error, msg=error)
        self.assertIsNotNone(output)

    def test_station_front_defaults_to_false_when_group_missing(self):
        """站前基础信息：前端未传 station_front 分组时，不应崩溃"""
        data = {
            "project_name": "站前默认值测试",
            "has_qiaoliang": True
        }

        output, error = generate_cross_data_docx(data)

        self.assertIsNone(error, msg=error)
        self.assertIsNotNone(output)


if __name__ == "__main__":
    unittest.main()
