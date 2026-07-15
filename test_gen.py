import json
import requests
import io
import docxtpl

from app import generate_cross_data_docx

data = {
    "project_name": "测试湛海高铁",
    "design_stage": "施工图",
    "doc_id": "互提资料-测试01",
    "has_fj": True,
    "has_dl": True,
    "has_cl": False,
    "fj_rooms": [
        {"location": "测试楼", "name": "机械室", "area": "100", "remark": "测试备注"}
    ],
    "dl_rooms": [
        {"location": "测试楼", "name": "机械室", "area": "20", "remark": "双路供电"}
    ]
}

out, err = generate_cross_data_docx(data)
if err:
    print("Error:", err)
else:
    print("Success! Size:", len(out.getvalue()))
