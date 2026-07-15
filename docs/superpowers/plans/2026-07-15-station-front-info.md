# 施工图互提资料站前基础信息扩展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为“施工图互提资料”新增“站前基础信息”卡片，支持通过 `station_front.has_qlsstdsp` 控制桥梁疏散通道视频条目输出，并保留后续站前子项的扩展空间。

**Architecture:** 前端继续沿用 `MutualDataGenerator.js` 的单文件表单组织方式，在 `formData` 下新增 `station_front` 分组，并通过条件渲染和监听联动控制卡片显示与字段清理。后端继续在 `generate_cross_data_docx()` 中组装模板上下文，从 `station_front` 分组读取值并映射到模板顶层变量 `has_qlsstdsp`，保证模板写法无需调整。

**Tech Stack:** Vue 组合式组件模板、原生 CSS 工具类、Flask、docxtpl、python unittest、python-docx

---

### Task 1: 补充后端映射测试

**Files:**
- Modify: `d:\code\y20_QoSGenerator\test_new_professions_template.py`
- Modify: `d:\code\y20_QoSGenerator\app.py`

- [ ] **Step 1: 在 `test_new_professions_template.py` 增加失败测试，先锁定 `station_front` 到模板变量的映射行为**

```python
    def test_station_front_bridge_video_flag_is_read_from_nested_group(self):
        data = {
            "project_name": "站前基础信息测试",
            "has_qiaoliang": True,
            "station_front": {
                "has_qlsstdsp": True
            }
        }

        output, error = generate_cross_data_docx(data)

        self.assertIsNone(error, msg=error)
        self.assertIsNotNone(output)
```

- [ ] **Step 2: 运行单测，确认它在实现前失败或暴露缺失行为**

Run:

```bash
python -m unittest test_new_professions_template.NewProfessionsTemplateTest.test_station_front_bridge_video_flag_is_read_from_nested_group
```

Expected:

```text
FAIL 或 ERROR，原因是后端尚未处理 station_front.has_qlsstdsp
```

- [ ] **Step 3: 在 `app.py` 的 `generate_cross_data_docx()` 中加入 `station_front` 分组读取和模板变量映射**

```python
        station_front = data.get('station_front', {}) or {}
        station_front_flags = {
            'has_qlsstdsp': safe_bool(station_front.get('has_qlsstdsp', False)),
        }

        context = {
            'project_name': data.get('project_name', ''),
            'design_stage': data.get('design_stage', '施工图'),
            'doc_id': data.get('doc_id', ''),
            'source_institute': data.get('source_institute', '通号院'),
            'source_profession': data.get('source_profession', '有线通信'),
        }
        context.update(chapter_flags)
        context.update(station_front_flags)
```

- [ ] **Step 4: 再次运行单测，确认新增映射已生效**

Run:

```bash
python -m unittest test_new_professions_template.NewProfessionsTemplateTest.test_station_front_bridge_video_flag_is_read_from_nested_group
```

Expected:

```text
.
----------------------------------------------------------------------
Ran 1 test in X.XXXs

OK
```

- [ ] **Step 5: 提交当前测试与后端改动**

```bash
git add test_new_professions_template.py app.py
git commit -m "feat: support station front bridge video flag"
```

### Task 2: 实现前端站前基础信息卡片

**Files:**
- Modify: `d:\code\y20_QoSGenerator\static\js\views\MutualDataGenerator.js`
- Modify: `d:\code\y20_QoSGenerator\static\css\style.css`（仅在现有样式不足时）

- [ ] **Step 1: 在 `MutualDataGenerator.js` 中新增失败前置点，先把目标结构写进 `formData` 默认值**

```js
            station_front: {
                has_qlsstdsp: false
            },

            // 房屋类型配置
            rooms: createDefaultRooms(),
```

- [ ] **Step 2: 在脚本区补充派生显示条件和桥梁取消时的自动清空联动**

```js
import { computed, ref, watch } from 'vue';

        const showStationFrontCard = computed(() => (
            formData.value.has_luji ||
            formData.value.has_zhanchang ||
            formData.value.has_qiaoliang ||
            formData.value.has_suidao
        ));

        watch(
            () => formData.value.has_qiaoliang,
            (enabled) => {
                if (!enabled) {
                    formData.value.station_front.has_qlsstdsp = false;
                }
            }
        );

        return {
            formData,
            isGenerating,
            generate,
            DEFAULT_ROOM_TYPES,
            showStationFrontCard
        };
```

- [ ] **Step 3: 在模板中于“接收专业配置”后、“房屋类型配置”前插入站前基础信息卡片**

```html
            <div v-if="showStationFrontCard" class="card mb-6 border-left-caramel">
                <div class="card-header">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-road-map-line text-caramel"></i> 站前基础信息
                    </h3>
                </div>
                <div class="card-body">
                    <p class="text-sm text-gray-500 mb-4" style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">
                        根据已勾选的站前专业补充互提资料条目，未勾选的项目不会输出到文档。
                    </p>
                    <div v-if="formData.has_qiaoliang" class="grid grid-cols-2 gap-3">
                        <label class="profession-checkbox" :class="{ 'active': formData.station_front.has_qlsstdsp }">
                            <input v-model="formData.station_front.has_qlsstdsp" type="checkbox">
                            <span>有桥梁疏散通道视频</span>
                        </label>
                    </div>
                </div>
            </div>
```

- [ ] **Step 4: 如新卡片在现有样式下表现正常，则不修改 `style.css`；如布局需要收口，仅补最小样式**

```css
.station-front-hint {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
}
```

- [ ] **Step 5: 运行前端静态诊断，确认没有语法错误**

Run:

```bash
npx eslint static/js/views/MutualDataGenerator.js
```

Expected:

```text
若项目未配置 eslint，则改用编辑器诊断为 0；若已配置，则无 error
```

- [ ] **Step 6: 提交前端改动**

```bash
git add static/js/views/MutualDataGenerator.js static/css/style.css
git commit -m "feat: add station front info card"
```

### Task 3: 回归验证与文档确认

**Files:**
- Modify: `d:\code\y20_QoSGenerator\test_new_professions_template.py`
- Modify: `d:\code\y20_QoSGenerator\docs\superpowers\specs\2026-07-15-station-front-info-design.md`（仅在实现与设计不一致时）

- [ ] **Step 1: 为嵌套字段补充回归测试，覆盖默认值与空对象兜底**

```python
    def test_station_front_defaults_to_false_when_group_missing(self):
        data = {
            "project_name": "站前默认值测试",
            "has_qiaoliang": True
        }

        output, error = generate_cross_data_docx(data)

        self.assertIsNone(error, msg=error)
        self.assertIsNotNone(output)
```

- [ ] **Step 2: 运行互提资料相关测试集，确认新增逻辑不影响原有章节渲染**

Run:

```bash
python -m unittest test_new_professions_template
```

Expected:

```text
所有测试通过，包含新增的 station_front 场景
```

- [ ] **Step 3: 用现有脚本做一次生成验证，确认 `station_front` 字段不会破坏文档生成**

Run:

```bash
python test_cross_data.py
```

Expected:

```text
输出测试 docx 文件，控制台显示“测试X 成功”
```

- [ ] **Step 4: 检查改动文件诊断并整理最终变更说明**

Run:

```bash
git diff -- static/js/views/MutualDataGenerator.js app.py test_new_professions_template.py
```

Expected:

```text
仅包含 station_front 分组、站前基础信息卡片、桥梁视频字段映射及对应测试
```

- [ ] **Step 5: 提交最终回归验证结果**

```bash
git add test_new_professions_template.py
git commit -m "test: cover station front nested flags"
```
