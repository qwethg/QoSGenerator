# QoS 生成器 v2.1 — 渝昆高铁模板支持

## 任务
将渝昆高铁模板设为默认模板，适配其5表格结构。

## 渝昆高铁模板 vs 徐闻站模板
| 特征 | 徐闻站 | 渝昆高铁 |
|------|--------|---------|
| 表格数 | 4（无公司级） | 5（含公司级）✅ |
| 复核意见结构 | 标题行+数据行分离 | 标题+数据同一行 |
| 审查意见结构 | 标题行+数据行分离 | 标题行+数据行分离 |
| 项目名称 | 单一run | 可能拆分为多个run |

## 主要改动

### 后端 (app.py)
1. **DEFAULT_TEMPLATE** 改为 `渝昆高铁模板.docx`
2. **重写 `replace_project_fields`**：用正则位置匹配替代字符串replace，支持多run拆分的单元格值
3. **重写 `replace_review_opinions`**：自动识别标题+数据是否同行，分别处理
4. **重写 `replace_table_opinions`**：先找"对审查意见的答复"标题行，判断是否含数据，再决定替换标题行还是下一行
5. **新增 `fill_cell_with_review_header_and_opinions`**：保留"复核意见"标题+替换数据
6. **新增 `fill_cell_with_review_header_and_reply`**：保留"对复核意见的处理"标题+清空数据
7. **`append_gongsi_table`** 保留：徐闻站模板(4表格)时自动新建公司级表格

### 前端 (index.html)
- 模板下拉列表中默认模板标注"（默认）"并排在第一位

### /api/templates 响应
- 新增 `default` 字段返回默认模板名

## 验证结果
- ✅ 渝昆高铁模板：5表格全部正确（项目名、设计范围、图名、复核意见、三级审查意见、审查级别、终审级别）
- ✅ 徐闻站模板：向下兼容，自动新建公司级表格，5表格全部正确
- ✅ 签名图片移除
- ✅ 日期清空

## 文件
- `qos-generator/app.py` — 后端（完全重写替换逻辑）
- `qos-generator/templates/index.html` — 前端（默认模板标注）
- `qos-generator/templates_docx/渝昆高铁模板.docx` — 新增默认模板
- `qos-generator/templates_docx/徐闻站模板.docx` — 原有模板保留
