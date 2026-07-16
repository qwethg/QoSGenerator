# d:\code\y20_QoSGenerator\test_station_front_table_blocks.py
import unittest

from docx import Document

from app import generate_cross_data_docx


def collect_texts(document):
    return [p.text.strip() for p in document.paragraphs if p.text.strip()]


class StationFrontTableBlockTest(unittest.TestCase):
    def test_cable_crossing_block_is_removed_when_not_imported(self):
        data = {
            "project_name": "过轨表块删除测试",
            "has_qiaoliang": True,
            "station_front": {
                "imported_tables": {
                    "cable_crossing_mileage": {
                        "enabled": False,
                        "rows": []
                    }
                }
            }
        }

        output, error = generate_cross_data_docx(data)
        self.assertIsNone(error, msg=error)

        doc = Document(output)
        texts = collect_texts(doc)

        self.assertNotIn("有线通信过轨里程表", texts)
        self.assertNotIn(
            "注：当房屋场坪、隧道救援点等位置变化时，过轨和引下槽里程需配合调整。",
            texts
        )

    def test_cable_crossing_block_is_filled_when_imported(self):
        data = {
            "project_name": "过轨表块填充测试",
            "has_qiaoliang": True,
            "station_front": {
                "imported_tables": {
                    "cable_crossing_mileage": {
                        "enabled": True,
                        "rows": [
                            {"mileage": "DK100+100", "remark": "桥头过轨", "count": "2"},
                            {"mileage": "DK101+800", "remark": "", "count": "4"},
                        ]
                    }
                }
            }
        }

        output, error = generate_cross_data_docx(data)
        self.assertIsNone(error, msg=error)

        doc = Document(output)
        texts = collect_texts(doc)

        self.assertIn("有线通信过轨里程表", texts)
        self.assertIn(
            "注：当房屋场坪、隧道救援点等位置变化时，过轨和引下槽里程需配合调整。",
            texts
        )

        table = next(
            tbl for tbl in doc.tables
            if "根数" in [cell.text.strip() for cell in tbl.rows[0].cells]
        )
        self.assertEqual(table.rows[1].cells[0].text.strip(), "1")
        self.assertEqual(table.rows[1].cells[1].text.strip(), "DK100+100")
        self.assertEqual(table.rows[1].cells[2].text.strip(), "桥头过轨")
        self.assertEqual(table.rows[1].cells[3].text.strip(), "2")
        self.assertEqual(table.rows[2].cells[0].text.strip(), "2")
        self.assertEqual(table.rows[2].cells[1].text.strip(), "DK101+800")
        self.assertEqual(table.rows[2].cells[3].text.strip(), "4")
