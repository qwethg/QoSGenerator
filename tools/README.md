# tools/ — 开发工具脚本

本项目在模板调试过程中积累了多轮分析、修复和导出脚本，按用途分类收纳于此。

> ⚠️ 这些脚本大多使用相对路径引用 `templates_docx/` 下的模板文件。运行前请确认当前工作目录为项目根目录 `y20_QoSGenerator/`（如 `python tools/analyze/analyze_jinja.py` 可能需要在根目录执行，或手动调整模板路径）。

## analyze/ — 模板分析

| 脚本 | 用途 |
|------|------|
| `analyze_jinja.py` | 从 `jinja_source2.xml` 提取 Jinja 标签，检查 if/endif 配对情况 |
| `analyze_template.py` | 从模板 docx 中提取所有 Jinja/变量占位符，按变量类型分组统计 |
| `analyze_tables.py` | 分析模板中每个 `{%tr %}` 标签所在表格、行、单元格位置 |
| `check_endif.py` | 统计模板中 `{%tr if %}` 与 `{%tr endif %}` 的数量，输出缺失情况 |
| `check_patch.py` | 检查 docxtpl `patch_xml()` 前后 `{%tr %}` 标签的变化（看看 docxtpl 做了什么） |
| `check_patch_detail.py` | `check_patch.py` 的详细版，输出 patched XML 中所有 if 标签的实际形态 |
| `check_tag_form.py` | 检查 `{%tr %}` 标签在 XML 中的实际形态（是否被 Word 拆分） |
| `check_template_tags.py` | 对比两个模板的所有标签，输出统计结果 |
| `compare_patch.py` | 对比两个模板 patch 前后的 if/endif 数量 |

## fix/ — 模板修复

| 脚本 | 用途 |
|------|------|
| `fix_extra_endif.py` | 删除模板中多余的 `{%tr endif %}`（无对应 `{%tr if %}` 的） |
| `fix_new_profession_tags.py` | 修复新增专业模块中误用 `{%tr %}` 的标签，统一改为 `{%p %}` |
| `fix_template_v2.py` | 为每个 `{%tr if %}` 行补充缺失的 `{%tr endif %}`（XML 级别操作） |
| `fix_template_v3.py` | 为每个 `{%tr if %}` 行补充 `{%tr endif %}`（使用 python-docx，阶段版本） |
| `fix_template_v4.py` | 合并被 Word 拆分的标签 + 将 `{%tr if/endif %}` 正确拆分为独立行 |
| `fix_var_space.py` | 修复模板中 `{{ idx_ txyrjx }}` 的空格问题（文本级） |
| `fix_var_space2.py` | 修复模板中 `{{ idx_ txyrjx }}` 的空格问题（XML 级，更彻底） |
| `make_template.py` | 从旧模板（`.bak`）批量替换为 Jinja 占位符，生成新模板 |

## dump/ — 模板 XML 导出

| 脚本 | 用途 |
|------|------|
| `dump_jinja.py` | 导出互提资料模板 docxtpl 预处理后的 Jinja 源码为 `jinja_source.xml` |
| `dump_jinja2.py` | 同上，导出为 `jinja_source2.xml`（不同模板入口） |
| `dump_xml.py` | 使用自定义 DocxTemplate 子类截取 `patch_xml()` 后的 XML |
