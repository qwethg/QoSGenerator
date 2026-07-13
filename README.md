# QoS 文件生成器 (QoS Generator)

为中铁二院通信部门定制的设计复核/审查卡片（QoS）自动化生成工具。基于 Flask 构建的单页 Web 应用，通过在 Web 表单中填写项目信息，即可自动生成并下载格式完好的 QoS Word 文档。

## ✨ 核心特性

- **现代化的模板引擎**：基于 `docxtpl` (python-docx-template) 构建，无需调用底层 Office COM 接口，直接在服务器端高速渲染生成。
- **Jinja2 语法驱动**：采用标准的 `{{ 变量名 }}` 语法进行占位符替换，完美兼容中英文和各种排版样式。自动处理多行文本转换，意见框中的换行符能被完美保留到生成的 Word 中。
- **动态表格与段落管理**：利用 Jinja2 的 `{%p if ... %}` 段落控制语法，支持选择“所级”、“院级”（默认）或“公司级”终审。系统会根据所选级别，在模板渲染时自动剔除多余的审查表格、说明段落及关联的分页符，**彻底杜绝多余空白页**的产生，且后端代码保持极度精简。
- **多模板高扩展性**：采用统一的数据上下文映射，未来可无缝拓展如“互提资料”等其他业务模板。
- **开箱即用**：前端支持快速加载默认审查意见文本，可一键完成填写与导出。

## 🛠 技术栈

- **后端**：Python 3.10+ / Flask 3.0+
- **前端**：原生 HTML5 / CSS3 / JavaScript
- **文档处理**：`docxtpl` (基于 `python-docx` 和 `jinja2`)

## 📂 项目结构

```text
qos-generator/
├── api/
│   └── index.py               # Vercel Serverless 部署入口
├── templates/
│   └── index.html             # 前端单页应用界面
├── templates_docx/
│   └── QoS模板.docx           # 包含 Jinja2 占位符的 Word 模板文件
├── 开发记录/                   # 历史开发与迭代文档
├── .gitignore
├── app.py                     # Flask 主程序（路由与 docxtpl 渲染逻辑）
├── README.md                  # 项目说明文档
├── requirements.txt           # Python 依赖包
├── runtime.txt                # Vercel Python 运行时版本指定
└── vercel.json                # Vercel 部署配置
```

## 🚀 快速开始

### 1. 本地运行

安装依赖并启动应用：

```bash
# 1. 安装依赖 (包含 Flask 和 docxtpl)
pip install -r requirements.txt

# 2. 启动服务
python app.py
```

启动后，在浏览器访问 `http://localhost:5000`。

### 2. 使用说明

1. 确保在 `templates_docx/` 目录下放置了配置好 Jinja2 占位符的 `QoS模板.docx`。
2. 浏览器访问主页，填写项目名称、设计范围、图名及张数等信息。
3. 选择**终审级别**（所级 / 院级 / 公司级）。
4. 在下方文本框填写或编辑各级复核与审查意见（点击右上角“加载默认”可快速填充常用意见）。
5. 点击 **“生成 QoS 文件”**，浏览器将自动下载处理好的 `.docx` 文件。

## ☁️ 部署指南

### Vercel 一键部署 (推荐)

本项目已配置好完整的 Vercel 支持，可以直接部署为 Serverless Function：

1. Fork 本仓库或推送到你的 GitHub。
2. 在 Vercel 控制台导入该项目。
3. Vercel 会自动识别 `vercel.json` 并进行部署。无需额外配置。

### Docker 部署

如果你倾向于容器化部署，可以使用以下 Dockerfile 参考：

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt gunicorn
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## 📝 模板占位符参考 (基于 docxtpl)

如需自行修改 Word 模板，请在对应位置插入以下占位符变量，生成器将自动映射数据并执行替换：

### 基础文本变量
保持您想要的字体和格式，直接输入：
- 项目名称：`{{ project_name }}`
- 设计范围：`{{ design_range }}`
- 图名：`{{ file_name }}`
- 张数：`{{ sheet_count }}`
- 复核意见：`{{ review_opinions_text }}`
- 所审意见：`{{ audit_suoshi_text }}`
- 院审意见：`{{ audit_yuan_text }}`
- 公司审意见：`{{ audit_gongsi_text }}`
- 复核确认：`{{ review_confirmation }}`

### 动态表格控制标签
用于根据“终审级别”自动隐藏多余表格及说明（请确保占位符独占一空行，`{%p` 代表删除该段落及回车，防空白页）：

**控制院级表格显示：**
```text
{%p if final_audit_level == '院级' or final_audit_level == '公司级' %}
(此处为院级表格和关联文字)
{%p endif %}
```

**控制公司级表格显示：**
```text
{%p if final_audit_level == '公司级' %}
(此处为公司级表格和关联文字)
{%p endif %}
```
