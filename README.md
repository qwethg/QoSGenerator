# QoS 文件生成器

基于 Flask 的 Web 应用，填写表单即可生成设计复核/审查卡片（QoS）docx 文件。

## 快速开始

### 1. 安装依赖

```bash
pip install flask
```

### 2. 放置模板文件

将原始 QoS docx 参考文件放入 `templates_docx/` 目录：

```
qos-generator/
├── app.py
├── requirements.txt
├── templates/
│   └── index.html
├── templates_docx/          ← 放模板 docx 文件
│   └── 徐闻站模板.docx
└── README.md
```

### 3. 启动

```bash
python app.py
```

浏览器访问 http://localhost:5000

## 使用方法

1. 选择模板文件
2. 填写项目名称、设计范围、图名
3. 点击"加载默认"填充预设复核/审查意见，或手动添加/编辑
4. 点击"生成 QoS 文件"
5. 浏览器自动下载生成的 docx 文件

## 功能

- ✅ 基于参考 docx 模板替换文本，完整保留原始格式
- ✅ 支持自定义项目名称、设计范围、图名
- ✅ 动态添加/删除/编辑复核意见（设表08）
- ✅ 动态添加/删除/编辑审查意见（设表09-1 所室级）
- ✅ 可选移除签名图片
- ✅ 自动清空签署日期
- ✅ 一键下载生成的文件

## 部署

### 本地开发
```bash
python app.py
```

### 生产部署（gunicorn）
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker 部署
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install flask gunicorn
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```
