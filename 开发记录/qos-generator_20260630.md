# QoS 文件生成器 Web 应用

## 任务背景
用户之前通过 Python 脚本生成 QoS（设计复核/审查卡片）docx 文件，方案已跑通。用户要求将其做成方便使用的、可部署为网页的小程序。

## 完成内容

### 技术方案
- **后端**: Python Flask（轻量级，单文件 app.py）
- **前端**: 原生 HTML/CSS/JS（无框架依赖，单页应用）
- **原理**: 复制参考 docx 模板 → 解压 XML → 文本替换 → 重新打包 docx，完整保留原始格式

### 文件结构
```
qos-generator/
├── app.py                  # Flask 后端（核心生成逻辑 + API路由）
├── requirements.txt        # Python 依赖（flask）
├── README.md              # 使用说明
├── templates/
│   └── index.html         # 前端单页应用
└── templates_docx/
    └── 徐闻站模板.docx     # 参考 docx 模板
```

### 功能
1. **表单填写**: 项目名称、设计范围、图名
2. **复核意见管理**（设表08）: 动态增删改，预设默认意见可一键加载
3. **审查意见管理**（设表09-1 所室级）: 动态增删改，预设默认意见可一键加载
4. **选项控制**: 可选移除签名图片
5. **自动处理**: 日期自动清空、年份自动更新为2026
6. **一键下载**: 点击按钮直接生成并下载 docx 文件
7. **模板管理**: 支持多个模板文件，从 templates_docx 目录自动加载

### API
- `GET /` - 前端页面
- `GET /api/templates` - 列出可用模板
- `POST /api/generate` - 生成 docx 文件（返回文件流）

### 验证结果
- ✅ Flask 服务正常启动（localhost:5000）
- ✅ 前端页面正常渲染
- ✅ API 生成测试通过（94KB docx，4个表格内容全部正确）
- ✅ 模板列表 API 正常

### 部署方式
- 本地开发: `python app.py`
- 生产部署: `gunicorn -w 4 -b 0.0.0.0:5000 app:app`
- Docker 部署: 支持（README 中有 Dockerfile）

## 输出目录
`C:\Users\YangYi\.qclaw\workspace-agent-844370f5\qos-generator\`

## 关键决策
- 选择 Flask 而非 Django/FastAPI：项目简单，单文件即可
- 前端不用框架：减少依赖，部署简单
- 保留原始 docx 格式：通过复制模板+XML文本替换，而非用 python-docx 重新生成
- 模板与代码分离：模板放 templates_docx/，方便替换
