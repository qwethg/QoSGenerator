# 铁路通信设计辅助台

为中铁二院通信部门定制的 Word 文档自动化生成工具。基于 Flask + Vue 3 构建 of 的单页 Web 应用，通过在 Web 表单中填写项目信息，即可自动生成并下载格式完好的 Word 文档。

项目近期进行了**前后端分层重构与业务外部化**，并对前端视觉进行了**科技感蓝图风格暗黑主题**升级。

---

## 功能模块

### 1. QoS 审查卡片生成器
- **卡片渲染**：填写项目名称、图名、各级审查意见，选择终审级别（所级/院级/公司级），自动生成排版完整的 Word 文件。根据所选级别智能剔除多余表格和分页符，杜绝空白页。
- **意见片段抽屉 (NEW)**：内置科室常用审查语与复核确认意见侧边抽屉，支持一键点击填入，极大地简化了文字录入量。

### 2. 互提资料生成器（有线通信专业）
有线通信专业向其他专业提交互提资料的自动化工具。覆盖：
- **13 个专业**：房建、电力、暖通、牵引变电、接触网、无线通信、机械、车辆、路基、隧道、桥梁、站场，以及自动推导的通用要求。
- **19 种机房房屋**：内置默认面积、定员、用电量、供电等级、电压参数，自动计算散热量（用电量 × 90%），并按专业分类自动排序输出序号表格。
- **电缆沟参数 (SVG 预览 NEW)**：支持主沟、分支槽、线槽尺寸调整。前端提供**动态 SVG 电缆沟剖面示意图**，尺寸变化时即时重绘，方便工程师直观把控比例。
- **章节连续编号**：通过 Word 原生“多级列表-自动编号”机制，按勾选的专业自动重排大纲序号，完美保留段落样式与悬挂缩进。
- **段落/表格行动态控制**：未选专业自动隐藏对应章节段落（`{%p` 标签控制）和表格行（`{%tr` 标签控制）。
- **数据表 Excel 导入 (HUD 提示 NEW)**：支持从 Excel 导入过轨里程表、区间分支引下槽里程表、桥上预留引下位置表，自动填入 Word 对应表格。导入卡片提供**悬浮 HUD 指示气泡**，直观展示 Excel 列名格式要求。

---

## 技术栈

- **后端**：Python 3.10+ / Flask 3.0+
- **前端**：Vue 3 + Vue Router 4（CDN 引入，原生 ES Module 运行，无需前端构建打包）+ SheetJS（Excel 解析）
- **文档处理**：`docxtpl`（基于 python-docx + jinja2）

---

## 项目结构

```text
qos-generator/
├── api/
│   └── index.py                    # Vercel Serverless 部署入口
├── config/                         # 业务配置文件目录 (NEW)
│   └── business_settings.json      # 业务规则与机房参数统一外部化配置
├── services/                       # 后端业务分层服务 (NEW)
│   ├── __init__.py
│   ├── config_loader.py            # 业务配置加载器（带硬编码默认降级）
│   ├── docx_renderer.py            # 渲染引擎（处理QoS卡片、互提资料生成流程）
│   └── xml_helper.py               # 底层XML净化与数据追加（清理断裂标签、插表）
├── static/                         # 前端静态资源
│   ├── css/
│   │   └── style.css               # 蓝图风格暗黑主题样式
│   └── js/
│       ├── main.js                 # Vue 应用入口
│       ├── router.js               # 路由（/qos、/mutual-data、/about）
│       ├── App.js                  # 根组件
│       ├── store.js                # 状态管理
│       ├── components/
│       │   └── Layout.js           # 页面布局组件
│       └── views/
│           ├── Home.js             # 首页
│           ├── QoSGenerator.js     # QoS 生成器页面（含常用意见抽屉）
│           ├── MutualDataGenerator.js  # 互提资料生成器页面（含动态SVG预览与HUD）
│           └── About.js            # 关于与版本说明页面
├── templates/
│   └── index.html                  # 单页应用入口 HTML
├── templates_docx/                 # Word 模板（含 Jinja2 占位符）
│   ├── QoS-template.docx          # QoS 审查卡片模板
│   └── htzl_yxtx_sgt.docx         # 互提资料模板（施工图-有线通信提站后）
├── tools/                          # 历史开发与模板排障工具脚本
│   ├── analyze/                    # 模板分析、标签检查
│   ├── fix/                        # 模板断裂标签自动修复
│   └── dump/                       # 模板预处理 XML 导出
├── 开发记录/                       # 历史迭代文档与排障经验
│   ├── 项目目录整理_20260718.md
│   └── 前后端重构与蓝图风格升级_20260719.md  # 本轮重构日志 (NEW)
├── app.py                          # Flask 主程序入口（仅做控制器分发与报错翻译）
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

---

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

1. 模板文件放在 `templates_docx/` 目录下。
2. 主页选择对应功能模块。
3. 填写/勾选项目信息、专业选项与机房参数。
4. 点击生成按钮，浏览器将自动下载格式化的 `.docx` 文件。

### 运行回归测试

在修改任何后端逻辑或配置文件后，请运行以下测试以确保功能正常：

```bash
python -m unittest discover -s . -p "test_*.py"
```

---

## 维护与开发指南

项目支持高度的自定义扩展。关于如何新增房屋、如何新增专业、如何在 Word 模板中书写控制标签、如何使用排障脚本修复断裂的模板标签等，请参阅：

- 📖 **[铁路通信设计辅助台 - 后续开发与维护指南](docs/future_development_guide.md)**
- 📝 **[开发记录：前后端重构与蓝图风格升级 (2026-07-19)](开发记录/前后端重构与蓝图风格升级_20260719.md)**

---

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
