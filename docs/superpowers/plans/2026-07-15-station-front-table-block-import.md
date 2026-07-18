# Station Front Table Block Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为“施工图互提资料”的站前三张表块新增 Excel 导入、整块显隐和 Word 定点填充能力。

**Architecture:** 前端继续沿用现有 JSON 提交流程，在 `station_front.imported_tables` 中维护三张表块的导入状态和结构化行数据，并通过 SheetJS 在浏览器侧完成模板下载与 Excel 解析。后端继续使用 `docxtpl` 渲染原有上下文，再使用 `python-docx` 对渲染后的 Word 文档做表块定位、整块删除和表格覆盖，避免引入新的模板循环标签风险。

**Tech Stack:** Flask, docxtpl, python-docx, unittest, Vue 3 ESM, SheetJS CDN

---

## File Structure

- Modify: `d:\code\y20_QoSGenerator\app.py`
  - 继续承载互提资料文档生成主流程
  - 增加站前表块 payload 解析、表块定位、整块删除、表格覆盖辅助函数
- Modify: `d:\code\y20_QoSGenerator\static\js\views\MutualDataGenerator.js`
  - 增加三张表块的默认状态、列配置、模板下载、Excel 导入、清空逻辑和 UI
- Modify: `d:\code\y20_QoSGenerator\templates\index.html`
  - 通过 CDN 引入 SheetJS 浏览器版本
- Create: `d:\code\y20_QoSGenerator\test_station_front_table_blocks.py`
  - 覆盖三张表块的后端整块显隐与表格覆盖行为
- Reuse for regression: `d:\code\y20_QoSGenerator\test_new_professions_template.py`
  - 确认 `station_front.has_qlsstdsp` 和原有新增专业逻辑未回归

### Task 1: 打通单表块后端闭环

**Files:**
- Create: `d:\code\y20_QoSGenerator\test_station_front_table_blocks.py`
- Modify: `d:\code\y20_QoSGenerator\app.py`

- [ ] **Step 1: 先为“有线通信过轨里程表块”写失败测试**

```python
# d:\code\y20_QoSGenerator\test_station_front_table_blocks.py
import unittest

from docx import Document

from app import generate_cross_data_docx


def collect_texts(document):
    return [p.text.strip() for p in document.paragraphs if p.text.strip()]


class StationFrontTableBlockTest(unittest.TestCase):
    def test_cable_crossing_block_is_removed_when_not_imported(self):
        data = {
            "project_name": "过轨表块删除测试",
            "has_qiaoliang": True,
            "station_front": {
                "imported_tables": {
                    "cable_crossing_mileage": {
                        "enabled": False,
                        "rows": []
                    }
                }
            }
        }

        output, error = generate_cross_data_docx(data)
        self.assertIsNone(error, msg=error)

        doc = Document(output)
        texts = collect_texts(doc)

        self.assertNotIn("有线通信过轨里程表", texts)
        self.assertNotIn(
            "注：当房屋场坪、隧道救援点等位置变化时，过轨和引下槽里程需配合调整。",
            texts
        )

    def test_cable_crossing_block_is_filled_when_imported(self):
        data = {
            "project_name": "过轨表块填充测试",
            "has_qiaoliang": True,
            "station_front": {
                "imported_tables": {
                    "cable_crossing_mileage": {
                        "enabled": True,
                        "rows": [
                            {"mileage": "DK100+100", "remark": "桥头过轨", "count": "2"},
                            {"mileage": "DK101+800", "remark": "", "count": "4"},
                        ]
                    }
                }
            }
        }

        output, error = generate_cross_data_docx(data)
        self.assertIsNone(error, msg=error)

        doc = Document(output)
        texts = collect_texts(doc)

        self.assertIn("有线通信过轨里程表", texts)
        self.assertIn(
            "注：当房屋场坪、隧道救援点等位置变化时，过轨和引下槽里程需配合调整。",
            texts
        )

        table = next(
            tbl for tbl in doc.tables
            if "根数" in [cell.text.strip() for cell in tbl.rows[0].cells]
        )
        self.assertEqual(table.rows[1].cells[0].text.strip(), "1")
        self.assertEqual(table.rows[1].cells[1].text.strip(), "DK100+100")
        self.assertEqual(table.rows[1].cells[2].text.strip(), "桥头过轨")
        self.assertEqual(table.rows[1].cells[3].text.strip(), "2")
        self.assertEqual(table.rows[2].cells[0].text.strip(), "2")
        self.assertEqual(table.rows[2].cells[1].text.strip(), "DK101+800")
        self.assertEqual(table.rows[2].cells[3].text.strip(), "4")
```

- [ ] **Step 2: 运行新测试并确认当前实现失败**

Run:

```bash
python -m unittest test_station_front_table_blocks.py -v
```

Expected:

```text
FAIL: test_cable_crossing_block_is_removed_when_not_imported
FAIL: test_cable_crossing_block_is_filled_when_imported
```

- [ ] **Step 3: 在 `app.py` 中增加最小后端能力，只打通“有线通信过轨里程表块”**

```python
# d:\code\y20_QoSGenerator\app.py
TABLE_BLOCK_CONFIG = {
    'cable_crossing_mileage': {
        'title': '有线通信过轨里程表',
        'header_cells': ['序号', '里程', '备   注', '根数'],
        'title_note': '（区间无线GSM-R基站、直放站过轨已由无线通信专业计列，具体见无线区间设施设置里程表；不包含双线隧道综合洞室过轨里程，双线隧道综合洞室里程见隧道专业综合洞室里程表）',
        'trailing_note': '注：当房屋场坪、隧道救援点等位置变化时，过轨和引下槽里程需配合调整。'
    }
}


def normalize_imported_table_payload(station_front):
    imported_tables = station_front.get('imported_tables', {}) or {}
    result = {}
    for key in TABLE_BLOCK_CONFIG:
        payload = imported_tables.get(key, {}) or {}
        rows = payload.get('rows', []) or []
        result[key] = {
            'enabled': safe_bool(payload.get('enabled', False)) and bool(rows),
            'rows': rows if isinstance(rows, list) else [],
        }
    return result


def delete_block_paragraph(paragraph):
    element = paragraph._element
    parent = element.getparent()
    if parent is not None:
        parent.remove(element)


def delete_block_table(table):
    element = table._element
    parent = element.getparent()
    if parent is not None:
        parent.remove(element)


def apply_cable_crossing_block(document, payload):
    title = TABLE_BLOCK_CONFIG['cable_crossing_mileage']['title']
    paragraphs = document.paragraphs
    title_idx = next(i for i, p in enumerate(paragraphs) if p.text.strip() == title)
    target_table = next(
        tbl for tbl in document.tables
        if [cell.text.strip() for cell in tbl.rows[0].cells] == ['序号', '里程', '备   注', '根数']
    )

    if not payload['enabled']:
        delete_block_paragraph(paragraphs[title_idx + 2])
        delete_block_table(target_table)
        delete_block_paragraph(paragraphs[title_idx + 1])
        delete_block_paragraph(paragraphs[title_idx])
        return

    while len(target_table.rows) > 1:
        target_table._tbl.remove(target_table.rows[1]._tr)

    for index, row in enumerate(payload['rows'], start=1):
        cells = target_table.add_row().cells
        cells[0].text = str(index)
        cells[1].text = str(row.get('mileage', '')).strip()
        cells[2].text = str(row.get('remark', '')).strip()
        cells[3].text = str(row.get('count', '')).strip()
```

并在 `generate_cross_data_docx()` 中接入：

```python
station_front = data.get('station_front', {}) or {}
imported_tables = normalize_imported_table_payload(station_front)

rendered_doc = Document(output)
apply_cable_crossing_block(rendered_doc, imported_tables['cable_crossing_mileage'])
renumber_chapter_titles(rendered_doc, chapter_flags)
```

- [ ] **Step 4: 重新运行测试，确认单表块后端闭环成立**

Run:

```bash
python -m unittest test_station_front_table_blocks.py -v
```

Expected:

```text
OK
```

- [ ] **Step 5: 提交单表块后端闭环**

```bash
git add test_station_front_table_blocks.py app.py
git commit -m "feat: support cable crossing table block import"
```

### Task 2: 抽象三张表块共用后端能力

**Files:**
- Modify: `d:\code\y20_QoSGenerator\test_station_front_table_blocks.py`
- Modify: `d:\code\y20_QoSGenerator\app.py`

- [ ] **Step 1: 为另外两张表块补失败测试**

```python
# d:\code\y20_QoSGenerator\test_station_front_table_blocks.py
    def test_interval_branch_downlead_block_is_removed_when_not_imported(self):
        data = {
            "project_name": "分支引下槽删除测试",
            "has_luji": True,
            "station_front": {
                "imported_tables": {
                    "interval_branch_downlead": {
                        "enabled": False,
                        "rows": []
                    }
                }
            }
        }

        output, error = generate_cross_data_docx(data)
        self.assertIsNone(error, msg=error)

        doc = Document(output)
        texts = collect_texts(doc)
        self.assertNotIn("区间分支引下槽里程表", texts)
        self.assertNotIn(
            "（区间无线GSM-R基站、直放站引下槽的里程由无线通信专业计列，具体见无线通信过轨预留里程表）",
            texts
        )

    def test_bridge_reserved_downlead_block_is_filled_when_imported(self):
        data = {
            "project_name": "桥上预留引下填充测试",
            "has_qiaoliang": True,
            "station_front": {
                "imported_tables": {
                    "bridge_reserved_downlead": {
                        "enabled": True,
                        "rows": [
                            {"bridge_name": "特大桥A", "reserved_count": "2", "remark": "左右线各1处"}
                        ]
                    }
                }
            }
        }

        output, error = generate_cross_data_docx(data)
        self.assertIsNone(error, msg=error)

        doc = Document(output)
        texts = collect_texts(doc)
        self.assertIn("桥上预留引下位置表", texts)

        table = next(
            tbl for tbl in doc.tables
            if [cell.text.strip() for cell in tbl.rows[0].cells] == ['序号', '桥梁', '桥梁引下预留处数', '备注']
        )
        self.assertEqual(table.rows[1].cells[0].text.strip(), "1")
        self.assertEqual(table.rows[1].cells[1].text.strip(), "特大桥A")
        self.assertEqual(table.rows[1].cells[2].text.strip(), "2")
        self.assertEqual(table.rows[1].cells[3].text.strip(), "左右线各1处")
```

- [ ] **Step 2: 运行测试并确认新增场景失败**

Run:

```bash
python -m unittest test_station_front_table_blocks.py -v
```

Expected:

```text
FAIL: test_interval_branch_downlead_block_is_removed_when_not_imported
FAIL: test_bridge_reserved_downlead_block_is_filled_when_imported
```

- [ ] **Step 3: 把单表块逻辑抽成通用表块处理函数**

```python
# d:\code\y20_QoSGenerator\app.py
TABLE_BLOCK_CONFIG = {
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


def find_table_by_header(document, header_cells):
    for table in document.tables:
        if [cell.text.strip() for cell in table.rows[0].cells] == header_cells:
            return table
    raise ValueError(f'未找到表头: {header_cells}')


def find_paragraph_index(document, expected_text):
    for index, paragraph in enumerate(document.paragraphs):
        if paragraph.text.strip() == expected_text:
            return index
    raise ValueError(f'未找到段落: {expected_text}')


def apply_imported_table_block(document, config, payload):
    title_idx = find_paragraph_index(document, config['title'])
    target_table = find_table_by_header(document, config['header_cells'])

    title_note = config.get('title_note')
    trailing_note = config.get('trailing_note')

    if not payload['enabled']:
        if trailing_note:
            delete_block_paragraph(document.paragraphs[find_paragraph_index(document, trailing_note)])
        delete_block_table(target_table)
        if title_note:
            delete_block_paragraph(document.paragraphs[find_paragraph_index(document, title_note)])
        delete_block_paragraph(document.paragraphs[title_idx])
        return

    while len(target_table.rows) > 1:
        target_table._tbl.remove(target_table.rows[1]._tr)

    for index, row in enumerate(payload['rows'], start=1):
        cells = target_table.add_row().cells
        cells[0].text = str(index)
        for cell_index, key in enumerate(config['row_keys'], start=1):
            cells[cell_index].text = str(row.get(key, '')).strip()
```

并在文档渲染后统一调用：

```python
for block_key, config in TABLE_BLOCK_CONFIG.items():
    apply_imported_table_block(rendered_doc, config, imported_tables[block_key])
```

- [ ] **Step 4: 运行后端专用测试和既有回归测试**

Run:

```bash
python -m unittest test_station_front_table_blocks.py -v
python -m unittest test_new_professions_template.py -v
```

Expected:

```text
OK
OK
```

- [ ] **Step 5: 提交三张表块通用后端能力**

```bash
git add app.py test_station_front_table_blocks.py
git commit -m "feat: generalize station front table block rendering"
```

### Task 3: 接入前端 Excel 导入与模板下载

**Files:**
- Modify: `d:\code\y20_QoSGenerator\templates\index.html`
- Modify: `d:\code\y20_QoSGenerator\static\js\views\MutualDataGenerator.js`

- [ ] **Step 1: 先把 SheetJS 接进页面**

```html
<!-- d:\code\y20_QoSGenerator\templates\index.html -->
<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
```

把它放在主应用入口脚本前：

```html
<body>
    <div id="app"></div>
    <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
    <script type="module" src="/static/js/main.js"></script>
</body>
```

- [ ] **Step 2: 在视图文件中加入表块默认状态和列配置**

```javascript
// d:\code\y20_QoSGenerator\static\js\views\MutualDataGenerator.js
const STATION_FRONT_TABLE_CONFIGS = [
    {
        key: 'interval_branch_downlead',
        title: '区间分支引下槽里程表',
        hint: '导入后将显示该表及其配套说明文字',
        columns: [
            { key: 'mileage', label: '里程', required: true },
            { key: 'remark', label: '备注', required: false }
        ]
    },
    {
        key: 'bridge_reserved_downlead',
        title: '桥上预留引下位置表',
        hint: '导入后将显示该表及其配套说明文字',
        columns: [
            { key: 'bridge_name', label: '桥梁', required: true },
            { key: 'reserved_count', label: '桥梁引下预留处数', required: true },
            { key: 'remark', label: '备注', required: false }
        ]
    },
    {
        key: 'cable_crossing_mileage',
        title: '有线通信过轨里程表',
        hint: '导入后将显示该表及其配套说明文字',
        columns: [
            { key: 'mileage', label: '里程', required: true },
            { key: 'remark', label: '备注', required: false },
            { key: 'count', label: '根数', required: true }
        ]
    }
];

function createEmptyImportedTable() {
    return {
        enabled: false,
        file_name: '',
        row_count: 0,
        rows: []
    };
}

function createDefaultImportedTables() {
    const result = {};
    for (const config of STATION_FRONT_TABLE_CONFIGS) {
        result[config.key] = createEmptyImportedTable();
    }
    return result;
}
```

并把默认值挂进 `formData`：

```javascript
station_front: {
    has_qlsstdsp: false,
    imported_tables: createDefaultImportedTables()
}
```

- [ ] **Step 3: 加入模板下载、Excel 解析和清空处理函数**

```javascript
function buildTemplateRows(columns) {
    return [
        columns.reduce((row, column) => {
            row[column.label] = '';
            return row;
        }, {})
    ];
}

function downloadTableTemplate(config) {
    const worksheet = XLSX.utils.json_to_sheet(buildTemplateRows(config.columns));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${config.title}.xlsx`);
}

async function importTableFile(config, event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const workbook = XLSX.read(await file.arrayBuffer());
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const expectedHeaders = config.columns.map(column => column.label);
    const actualHeaders = Object.keys(rawRows[0] || {});
    if (expectedHeaders.join('|') !== actualHeaders.join('|')) {
        throw new Error(`${config.title}：列头不匹配，请使用下载模板`);
    }

    const rows = rawRows
        .map(rawRow => config.columns.reduce((normalized, column) => {
            normalized[column.key] = String(rawRow[column.label] ?? '').trim();
            return normalized;
        }, {}))
        .filter(row => Object.values(row).some(Boolean));

    for (const column of config.columns.filter(column => column.required)) {
        if (rows.some(row => !row[column.key])) {
            throw new Error(`${config.title}：${column.label}不能为空`);
        }
    }
    if (!rows.length) {
        throw new Error(`${config.title}：至少需要 1 行有效数据`);
    }

    formData.value.station_front.imported_tables[config.key] = {
        enabled: true,
        file_name: file.name,
        row_count: rows.length,
        rows
    };
}

function clearImportedTable(tableKey) {
    formData.value.station_front.imported_tables[tableKey] = createEmptyImportedTable();
}
```

- [ ] **Step 4: 启动本地页面并手工验证导入/清空能力**

Run:

```bash
python app.py
```

Manual checks:

```text
1. 打开互提资料页面
2. 看到三张表块导入卡片
3. 点击“下载模板”能得到对应 xlsx
4. 导入正确模板后显示“已导入 · N 行”
5. 点击“清空”后状态恢复为“未导入”
6. 导入错误列头时页面提示明确报错
```

- [ ] **Step 5: 提交前端导入基础能力**

```bash
git add templates/index.html static/js/views/MutualDataGenerator.js
git commit -m "feat: add station front excel import controls"
```

### Task 4: 完成前端 UI 展示与端到端回归

**Files:**
- Modify: `d:\code\y20_QoSGenerator\static\js\views\MutualDataGenerator.js`
- Reuse: `d:\code\y20_QoSGenerator\test_station_front_table_blocks.py`
- Reuse: `d:\code\y20_QoSGenerator\test_new_professions_template.py`

- [ ] **Step 1: 在“站前基础信息”卡片中渲染三张导入卡片**

```html
<!-- d:\code\y20_QoSGenerator\static\js\views\MutualDataGenerator.js -->
<div class="grid grid-cols-2 gap-4 mt-4">
    <div
        v-for="config in STATION_FRONT_TABLE_CONFIGS"
        :key="config.key"
        class="card border-left-moss"
    >
        <div class="card-body">
            <div class="flex items-center justify-between mb-2">
                <h4 class="h4">{{ config.title }}</h4>
                <span class="text-sm text-gray-500">
                    {{ formData.station_front.imported_tables[config.key].enabled
                        ? '已导入 · ' + formData.station_front.imported_tables[config.key].row_count + ' 行'
                        : '未导入' }}
                </span>
            </div>
            <p class="text-sm text-gray-500 mb-3">{{ config.hint }}</p>
            <p v-if="formData.station_front.imported_tables[config.key].file_name" class="text-sm mb-3">
                文件：{{ formData.station_front.imported_tables[config.key].file_name }}
            </p>
            <div class="flex gap-2">
                <button type="button" class="btn-secondary" @click="downloadTableTemplate(config)">下载模板</button>
                <label class="btn-secondary">
                    导入/替换 Excel
                    <input type="file" accept=".xlsx" hidden @change="(event) => importTableFile(config, event)">
                </label>
                <button type="button" class="btn-secondary" @click="clearImportedTable(config.key)">清空</button>
            </div>
        </div>
    </div>
</div>
```

并在 `setup()` 返回值中暴露：

```javascript
return {
    formData,
    isGenerating,
    generate,
    DEFAULT_ROOM_TYPES,
    STATION_FRONT_TABLE_CONFIGS,
    showStationFrontCard,
    downloadTableTemplate,
    importTableFile,
    clearImportedTable
};
```

- [ ] **Step 2: 做浏览器端端到端验证**

Run:

```bash
python app.py
```

Manual checks:

```text
1. 导入一张“有线通信过轨里程表”Excel 并生成文档
2. 确认 Word 中标题、说明、表格、注释一起出现
3. 清空该表后重新生成文档
4. 确认 Word 中该整块内容完全消失
5. 再分别验证“区间分支引下槽里程表”和“桥上预留引下位置表”
```

- [ ] **Step 3: 跑完整回归命令**

Run:

```bash
python -m unittest test_station_front_table_blocks.py -v
python -m unittest test_new_professions_template.py -v
python test_cross_data.py
```

Expected:

```text
所有单元测试通过
互提资料回归脚本通过
```

- [ ] **Step 4: 提交端到端完成版本**

```bash
git add app.py templates/index.html static/js/views/MutualDataGenerator.js test_station_front_table_blocks.py
git commit -m "feat: import station front table blocks from excel"
```

## Self-Review

- **Spec coverage:** 已覆盖三张表块的 Excel 导入、下载模板、浏览器侧解析、后端整块删除、Word 表格覆盖、UI 状态展示和回归验证；无遗漏到“说明文字与表格一体显隐”的核心要求。
- **Placeholder scan:** 计划未使用 TBD/TODO/类似 Task N 等占位表述；每个任务都包含了明确的文件、代码片段、命令和期望结果。
- **Type consistency:** 统一使用 `station_front.imported_tables`、`interval_branch_downlead`、`bridge_reserved_downlead`、`cable_crossing_mileage`、`enabled/file_name/row_count/rows` 这一套命名；后端配置和前端 payload 保持一致。
