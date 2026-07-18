# -*- coding: utf-8 -*-
"""
配置加载器模块
负责加载 business_settings.json 配置文件，并提供降级硬编码默认配置，防止文件缺失导致崩溃。
"""
import os
import json

# ==================== 硬编码默认配置（当 JSON 文件缺失或解析失败时使用） ====================

DEFAULT_CHAPTER_TITLE_ORDER = [
    ('has_common', '通用要求'),
    ('has_luji', '路基专业'),
    ('has_suidao', '隧道专业'),
    ('has_qiaoliang', '桥梁专业'),
    ('has_zhanchang', '站场专业'),
    ('has_fangjian', '房建'),
    ('has_dianli', '电力'),
    ('has_nuantong', '暖通'),
    ('has_qianyin', '牵引变电'),
    ('has_jiechuwang', '接触网'),
    ('has_wuxian', '无线通信'),
    ('has_jixie', '机械'),
    ('has_cheliang', '车辆'),
]

DEFAULT_CHINESE_SECTION_NUMBERS = [
    '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三'
]

DEFAULT_ROOM_ORDERS = {
    'fj': [
        'txz', 'xhl_l', 'xhl_m', 'xhl_s', 'xls', 'yrj', 'zf', 'zjz',
        'pcs', 'hyl', 'ds', 'hzgs', 'txcj', 'txgq', 'dlpds', 'dqhst',
        'txyrjx', 'txzbgq', 'txjz'
    ],
    'dl': [
        'txz', 'xhl_l', 'xhl_m', 'xhl_s', 'xls', 'yrj', 'zf', 'zjz',
        'pcs', 'hyl', 'ds', 'hzgs', 'txcj', 'txgq', 'dlpds', 'dqhst',
        'txyrjx', 'txiz'
    ],
    'me': ['txcj', 'txgq']
}

DEFAULT_ROOM_DEFAULTS = {
    'txz': {
        'name': '通信站',
        'area': '1900', 'staff': '15', 'loc': '枢纽所在地',
        'power': 100, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '',
    },
    'xhl_l': {
        'name': '信号楼（大）',
        'area': '120', 'staff': '', 'loc': '车站',
        'power': 45, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '枢纽重要站点',
    },
    'xhl_m': {
        'name': '信号楼（中）',
        'area': '100', 'staff': '', 'loc': '车站',
        'power': 25, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '视频节点、市级',
    },
    'xhl_s': {
        'name': '信号楼（小）',
        'area': '80', 'staff': '', 'loc': '车站',
        'power': 15, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '其他',
    },
    'xls': {
        'name': '线路所通信机械室',
        'area': '80', 'staff': '', 'loc': '线路所',
        'power': 25, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '',
    },
    'yrj': {
        'name': '通信引入间',
        'area': '15', 'staff': '', 'loc': '引入间',
        'power': 5, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '',
    },
    'zf': {
        'name': '站房通信机械室',
        'area': '80', 'staff': '', 'loc': '站房',
        'power': 15, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '不含信号楼的站房',
    },
    'zjz': {
        'name': '信号中继站通信机械室',
        'area': '60', 'staff': '', 'loc': '中继站',
        'power': 15, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '',
    },
    'pcs': {
        'name': '公安派出所通信机械室',
        'area': '30', 'staff': '', 'loc': '公安派出所',
        'power': 10, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '',
    },
    'hyl': {
        'name': '货运楼通信机械室',
        'area': '60', 'staff': '', 'loc': '货运楼',
        'power': 15, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '',
    },
    'ds': {
        'name': '动车所、综合维修段等通信机械室',
        'area': '80', 'staff': '', 'loc': '动车所/综合维修段',
        'power': 15, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '',
    },
    'hzgs': {
        'name': '单身宿舍、办公楼配线间',
        'area': '10', 'staff': '', 'loc': '单身宿舍/办公楼',
        'power': 2, 'power_level': '—', 'voltage': 'AC 220V±10%',
        'power_remark': '公司管理',
    },
    'txcj': {
        'name': '存车场生产办公楼通信机械室',
        'area': '60', 'staff': '', 'loc': '存车场',
        'power': 15, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '',
    },
    'txgq': {
        'name': '综合维修工区办公楼通信机械室',
        'area': '60', 'staff': '', 'loc': '综合维修工区',
        'power': 15, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '',
    },
    'dlpds': {
        'name': '电力配电所通信机械室',
        'area': '30', 'staff': '', 'loc': '电力配电所',
        'power': 10, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '箱式机房设于主控室',
    },
    'dqhst': {
        'name': '电气化所亭通信机械室',
        'area': '30', 'staff': '', 'loc': '电气化所亭',
        'power': 10, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '箱式机房设于主控室',
    },
    'txyrjx': {
        'name': '车辆探测站（5T机房）',
        'area': '10', 'staff': '', 'loc': '车辆探测站',
        'power': 2, 'power_level': '—', 'voltage': 'AC 220V±10%',
        'power_remark': '通信设备用插座',
    },
    'txzbgq': {
        'name': '未设工区的地点通信值班工区',
        'area': '10', 'staff': '', 'loc': '通信值班工区',
        'power': 2, 'power_level': '—', 'voltage': 'AC 220V±10%',
        'power_remark': '',
    },
    'txiz': {
        'name': '区间基站通信机械室',
        'area': '', 'staff': '', 'loc': '区间基站',
        'power': None, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '由无线专业一并提出',
    },
    'txjz': {
        'name': '区间基站通信机械室（房建）',
        'area': '', 'staff': '', 'loc': '区间基站',
        'power': None, 'power_level': '一级', 'voltage': 'AC 380V±10%',
        'power_remark': '由无线专业一并提出',
    },
}

DEFAULT_CABLE_TRENCH_DEFAULTS = {
    'trench_txz_width': 500,
    'trench_txz_depth': 400,
    'trench_mid_width': 400,
    'trench_mid_depth': 400,
    'branch_dist_min': 2,
    'branch_txz_width': 500,
    'branch_txz_depth': 400,
    'branch_major_width': 400,
    'branch_major_depth': 400,
    'trough_width': 250,
    'trough_depth': 150,
}

DEFAULT_TABLE_BLOCK_CONFIG = {
    'interval_branch_downlead': {
        'title': '区间分支引下槽里程表',
        'header_cells': ['序号', '里程', '备注'],
        'title_note': '（区间无线GSM-R基站、直放站引下槽的里程由无线通信专业计列，具体见无线通信过轨预留里程表）',
        'trailing_note': None,
        'row_keys': ['mileage', 'remark'],
    },
    'bridge_reserved_downlead': {
        'title': '桥上预留引下位置表',
        'header_cells': ['序号', '桥梁', '桥梁引下预留处数', '备注'],
        'title_note': None,
        'trailing_note': None,
        'row_keys': ['bridge_name', 'reserved_count', 'remark'],
    },
    'cable_crossing_mileage': {
        'title': '有线通信过轨里程表',
        'header_cells': ['序号', '里程', '备   注', '根数'],
        'title_note': '（区间无线GSM-R基站、直放站过轨已由无线通信专业计列，具体见无线区间设施设置里程表；不包含双线隧道综合洞室过轨里程，双线隧道综合洞室里程见隧道专业综合洞室里程表）',
        'trailing_note': '注：当房屋场坪、隧道救援点等位置变化时，过轨和引下槽里程需配合调整。',
        'row_keys': ['mileage', 'remark', 'count'],
    },
}

# ==================== 配置读取逻辑 ====================

class Settings:
    def __init__(self):
        # 默认初始化为硬编码配置
        self.chapter_title_order = DEFAULT_CHAPTER_TITLE_ORDER
        self.chinese_section_numbers = DEFAULT_CHINESE_SECTION_NUMBERS
        self.room_orders = DEFAULT_ROOM_ORDERS
        self.room_defaults = DEFAULT_ROOM_DEFAULTS
        self.cable_trench_defaults = DEFAULT_CABLE_TRENCH_DEFAULTS
        self.table_block_config = DEFAULT_TABLE_BLOCK_CONFIG

        # 获取配置 JSON 的绝对路径
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.config_path = os.path.join(base_dir, 'config', 'business_settings.json')
        self.load_from_json()

    def load_from_json(self):
        """尝试从 JSON 文件加载配置，如果失败则保留默认硬编码值"""
        if not os.path.exists(self.config_path):
            # 找不到文件时，默认保持硬编码
            return

        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 安全加载各个字段
            if 'chapter_title_order' in data:
                # JSON 中的数组转换为元组列表
                self.chapter_title_order = [tuple(item) for item in data['chapter_title_order']]
            if 'chinese_section_numbers' in data:
                self.chinese_section_numbers = data['chinese_section_numbers']
            if 'room_orders' in data:
                self.room_orders = data['room_orders']
            if 'room_defaults' in data:
                self.room_defaults = data['room_defaults']
            if 'cable_trench_defaults' in data:
                self.cable_trench_defaults = data['cable_trench_defaults']
            if 'table_block_config' in data:
                self.table_block_config = data['table_block_config']

        except Exception as e:
            # 发生解析错误时不崩溃，打印警告并使用降级配置
            print(f"[Warning] 无法解析配置文件 business_settings.json, 将降级使用内置默认配置。错误详情: {e}")

# 单例配置对象
settings = Settings()
