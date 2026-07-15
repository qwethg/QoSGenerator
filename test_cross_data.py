# -*- coding: utf-8 -*-
"""完整测试：模拟前端数据，验证章节和表格行控制"""
from app import generate_cross_data_docx

# 测试 1：全选（所有专业 + 所有房屋）
data1 = {
    "project_name": "测试全选项目",
    "design_stage": "施工图",
    "doc_id": "互提资料-全选01",
    "source_institute": "通号院",
    "source_profession": "有线通信",
    "has_fangjian": True,
    "has_dianli": True,
    "has_nuantong": True,
    "has_qianyin": True,
    "has_jiechuwang": True,
    "has_wuxian": True,
    "has_jixie": True,
    "has_cheliang": True,
    "rooms": {},
}

# 测试 2：部分选择（只选房建+电力，关闭部分房屋）
data2 = {
    "project_name": "测试部分选择",
    "design_stage": "施工图",
    "doc_id": "互提资料-部分02",
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
    "rooms": {
        "txz": {"enabled": True, "area": "2000", "staff": "20", "power": 120},
        "xhl_l": {"enabled": True},
        "xhl_m": {"enabled": False},
        "xhl_s": {"enabled": False},
        "xls": {"enabled": True},
    }
}

# 测试 3：只选非房建非电力专业
data3 = {
    "project_name": "测试其他专业",
    "design_stage": "施工图",
    "doc_id": "互提资料-其他03",
    "has_fangjian": False,
    "has_dianli": False,
    "has_nuantong": True,
    "has_qianyin": True,
    "has_jiechuwang": True,
    "has_wuxian": True,
    "has_jixie": True,
    "has_cheliang": True,
    "rooms": {},
}

for i, data in enumerate([data1, data2, data3], 1):
    out, err = generate_cross_data_docx(data)
    if err:
        print("测试%d 失败: %s" % (i, err))
    else:
        size = len(out.getvalue())
        filename = 'test_output_%d.docx' % i
        with open(filename, 'wb') as f:
            f.write(out.getvalue())
        print("测试%d 成功! 大小: %d 字节, 保存到 %s" % (i, size, filename))
