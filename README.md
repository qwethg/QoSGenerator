# 工程设计自动化工具台

为中铁二院通信部门定制的 Word 文档自动化生成工具。基于 Flask + Vue 3 构建的单页 Web 应用，通过在 Web 表单中填写项目信息，即可自动生成并下载格式完好的 Word 文档。

## 功能模块

### 1. QoS 审查卡片生成器

复核/审查卡片（QoS）生成工具。填写项目名称、图名、各级审查意见，选择终审级别（所级/院级/公司级），自动生成排版完整的 Word 文件。根据所选级别智能剔除多余表格和分页符，杜绝空白页。

### 2. 互提资料生成器（有线通信专业）

有线通信专业向其他专业提交互提资料的自动化工具。覆盖：

- **13 个专业**：房建、电力、暖通、牵引变电、接触网、无线通信、机械、车辆、路基、隧道、桥梁、站场，以及自动推导的通用要求
- **19 种机房房屋**：内置默认面积、定员、用电量、供电等级、电压参数，自动计算散热量（用电量 × 90%），按专业分类输出序号表格
- **电缆沟参数**：主沟、分支槽、线槽尺寸模板变量
- **站前基础信息**：桥梁疏散通道视频等子项开关
- **数据表导入**：支持从 Excel 导入过轨里程表、区间分支引下槽里程表、桥上预留引下位置表，填入对应 Word 表格
- **章节连续编号**：按勾选的专业自动重排"一、二、三…"中文序号
- **段落/表格行动态控制**：未选专业自动隐藏对应章节和表格行

## 技术栈

- **后端**：Python 3.10+ / Flask 3.0+
- **前端**：Vue 3 + Vue Router 4（CDN 引入，无需构建）+ SheetJS（Excel 解析）
- **文档处理**：`docxtpl`（基于 python-docx + jinja2）

## 项目结构

```text
qos-generator/
├── api/
│   └── index.py                    # Vercel Serverless 部署入口
├── static/                         # 前端静态资源
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js                 # Vue 应用入口
│       ├── router.js               # 路由（/qos、/mutual-data）
│       ├── App.js                  # 根组件
│       ├── store.js                # 状态管理
│       ├── components/
│       │   └── Layout.js           # 页面布局组件
│       └── views/
│           ├── Home.js             # 首页
│           ├── QoSGenerator.js     # QoS 生成器页面
│           ├── MutualDataGenerator.js  # 互提资料生成器页面
│           └── About.js            # 关于页面
├── templates/
│   └── index.html                  # 单页应用入口 HTML
├── templates_docx/                 # Word 模板（含 Jinja2 占位符）
│   ├── QoS模板.docx               # QoS 审查卡片模板
│   └── htzl_yxtx_sgt.docx         # 互提资料模板（施工图-有线通信提站后）
├── tools/                          # 开发工具脚本
│   ├── analyze/                    # 模板分析与排障
│   ├── fix/                        # 模板修复脚本
│   └── dump/                       # 模板预处理 XML 导出
├── 开发记录/                       # 历史迭代文档与排障经验
├── app.py                          # Flask 主程序（路由与 docxtpl 渲染逻辑）
├── test_cross_data.py              # 互提资料回归测试
├── test_new_professions_template.py  # 新增专业+站前信息单元测试
├── test_station_front_table_blocks.py  # 站前数据表导入单元测试
├── test_qos.py                     # QoS 模板语法测试
├── test_gen.py                     # 旧版互提资料测试（兼容）
├── requirements.txt
├── runtime.txt
├── vercel.json
└── README.md
```

## 快速开始

### 本地运行

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动服务
python app.py
```

浏览器访问 `http://localhost:5000`。

### 使用说明

1. 模板文件放在 `templates_docx/` 目录下
2. 主页选择对应功能模块
3. 填写/勾选项目信息和专业选项
4. 点击生成按钮，浏览器自动下载 `.docx` 文件

### 运行测试

```bash
# 验证互提资料模板渲染
python -m unittest test_new_professions_template.py

# 验证站前数据表导入
python -m unittest test_station_front_table_blocks.py

# 回归验证互提资料整体功能
python test_cross_data.py
```

## 部署

### Vercel

项目已配置好 `vercel.json`，直接导入 GitHub 仓库即可部署为 Serverless Function。

### Docker

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt gunicorn
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## 互提资料模板变量参考

### 基础信息
- `{{ project_name }}` — 项目名称
- `{{ design_stage }}` — 设计阶段（施工图）
- `{{ doc_id }}` — 文档编号
- `{{ source_institute }}` — 提出单位
- `{{ source_profession }}` — 提出专业

### 专业章节开关（{%p if %}
- `has_fangjian`、`has_dianli`、`has_nuantong`、`has_qianyin`、`has_jiechuwang`、`has_wuxian`、`has_jixie`、`has_cheliang`
- `has_luji`、`has_suidao`、`has_qiaoliang`、`has_zhanchang`
- `has_common` — 通用要求（后端自动推导，勾选上述四站前专业任一即启用）

### 房屋变量（以 txz 为例，共 19 种房屋）
- `{{ has_txz }}` — 房屋启用开关
- `{{ area_txz }}`、`{{ loc_txz }}`、`{{ staff_txz }}` — 面积/位置/定员
- `{{ p_txz }}`、`{{ h_txz }}` — 用电量/散热量
- `{{ idx_txz }}`、`{{ idx_el_txz }}`、`{{ idx_me_txz }}` — 房建/电力/机械表序号

### 电缆沟参数
- `{{ trench_txz_width }}`、`{{ trench_txz_depth }}`、`{{ trench_mid_width }}`、`{{ trench_mid_depth }}`
- `{{ branch_dist_min }}`、`{{ branch_txz_width }}`、`{{ branch_txz_depth }}`
- `{{ branch_major_width }}`、`{{ branch_major_depth }}`、`{{ trough_width }}`、`{{ trough_depth }}`

### 站前基础信息
- `{{ has_qlsstdsp }}` — 桥梁疏散通道视频

### 标签选型规则

| 位置 | 标签 | 说明 |
|------|------|------|
| 普通段落/章节 | `{%p if has_xxx %}...{%p endif %}` | 控制整段显示 |
| 表格行 | `{%tr if has_xxx %}...{%tr endif %}` | 控制表行显示 |

> ⚠️ 混用会导致 Jinja 编译报错或渲染异常。普通段落误写为 `{%tr` 是常见的 `TemplateSyntaxError` 根因。

## 排障参考

`tools/` 目录下保留了模板排障所用的分析、修复和导出脚本。常见排障步骤：

1. `tools/dump/dump_jinja2.py` — 导出 docxtpl 预处理后的 XML
2. `tools/analyze/analyze_jinja.py` — 检查 if/endif 配对
3. 直接解压 `.docx`，查看 `word/document.xml` 中 Jinja 标签是否被 Word 拼写检查拆分为多个 `<w:r>`

详见 `开发记录/互提资料功能沉淀_20260715.md` 中第 4 节"模板排障 SOP"和第 10 节"标签拆分排查经验"。
