# QoS 文件生成器 (QoS Generator)

为中铁二院通信部门定制的设计复核/审查卡片（QoS）自动化生成工具。基于 Flask 构建的单页 Web 应用，通过在 Web 表单中填写项目信息，即可自动生成并下载格式完好的 QoS Word 文档。

## ✨ 核心特性

- **零 Word 依赖**：无需安装 `python-docx` 或调用 Office COM 接口，直接通过底层的 `zipfile` 解析并操作 Word OpenXML，执行效率高，部署极轻量。
- **精准的占位符替换**：采用 `[[占位符]]` 语法进行全局替换，完美兼容 Word 跨 `<w:t>` 标签拆分文本的特性，完整保留原始模板的样式格式。
- **动态表格管理（终审级别控制）**：支持选择“所级”、“院级”（默认）或“公司级”终审。系统会根据所选级别，精准删除 Word 模板中多余的审查表格。同时会向上溯源，清理关联的“注：...”段落与分页符，**彻底杜绝多余空白页**的产生。
- **签名自动清理**：生成过程中自动扫描并移除模板中的预设签名图片，避免残留。
- **开箱即用**：前端支持快速加载默认审查意见文本，可一键完成填写与导出。

## 🛠 技术栈

- **后端**：Python 3.10+ / Flask 3.0+
- **前端**：原生 HTML5 / CSS3 / JavaScript
- **文档处理**：原生 `zipfile` + 正则表达式（直接操作 OpenXML）

## 📂 项目结构

```text
qos-generator/
├── api/
│   └── index.py               # Vercel Serverless 部署入口
├── templates/
│   └── index.html             # 前端单页应用界面
├── templates_docx/
│   └── QoS模板.docx           # 包含 [[占位符]] 的 Word 模板文件
├── 开发记录/                   # 历史开发与迭代文档
├── .gitignore
├── app.py                     # Flask 主程序（路由与 XML 处理核心逻辑）
├── README.md                  # 项目说明文档
├── requirements.txt           # Python 依赖包 (Flask)
├── runtime.txt                # Vercel Python 运行时版本指定
└── vercel.json                # Vercel 部署配置
```

## 🚀 快速开始

### 1. 本地运行

安装依赖并启动应用：

```bash
# 1. 安装依赖 (仅需要 Flask)
pip install -r requirements.txt

# 2. 启动服务
python app.py
```

启动后，在浏览器访问 `http://localhost:5000`。

### 2. 使用说明

1. 确保在 `templates_docx/` 目录下放置了正确的 `QoS模板.docx`。
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

## 📝 模板占位符参考

如需自行修改 Word 模板，请在对应位置插入以下占位符，生成器将自动执行替换：

- `[[这里填写项目名称及阶段]]`
- `[[这里填写设计范围]]`
- `[[这里填写完整图名或文件名]]`
- `[[这里填写张数]]`
- `[[这里填写复核意见]]`
- `[[这里填写所所审意见]]`
- `[[这里填写院审审查意见]]`
- `[[这里填写公司审审查意见]]`
- `[[这里填写终审级别]]`
