# -*- coding: utf-8 -*-
"""
QoS 审查卡片生成器 - Web 应用
基于 Flask 的单页 Web 应用，使用预定义模板（含 [[占位符]]）生成 QoS docx 文件。
终审级别控制表格截止范围：所级(表1-3) / 院级(表1-4) / 公司级(表1-5)。
"""
import os
import zipfile
import re
import io
from flask import Flask, request, jsonify, send_file, render_template

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.jinja_env.auto_reload = True

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates_docx')
TEMPLATE_FILE = 'QoS模板.docx'


def replace_all_placeholders(doc_xml, replacements):
    """
    批量替换跨 <w:t> 标签拆分的 [[占位符]]。
    正则匹配 [[ 到 ]] 的跨标签块，提取占位符文字，替换为对应内容。
    """
    pattern = r'\[\[.*?\]\]'

    def replace_match(m):
        block = m.group(0)
        texts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', block)
        if not texts:
            full_text = block
        else:
            full_text = ''.join(texts)
        if full_text.startswith('[['):
            full_text = full_text[2:]
        if full_text.endswith(']]'):
            full_text = full_text[:-2]
        placeholder = full_text

        if placeholder in replacements:
            new_text = replacements[placeholder]
            rpr_match = re.search(r'<w:rPr>.*?</w:rPr>', block, re.DOTALL)
            rpr = rpr_match.group(0) if rpr_match else ''
            return f'<w:r>{rpr}<w:t>{new_text}</w:t></w:r>'
        else:
            return block

    return re.sub(pattern, replace_match, doc_xml, flags=re.DOTALL)


def text_to_xml_runs(text, rpr=''):
    """将多行文本转为 OpenXML runs（换行用 <w:br/>）"""
    if not text:
        return ''
    lines = text.split('\n')
    runs = ''
    for i, line in enumerate(lines):
        if i > 0:
            runs += '<w:r><w:br/></w:r>'
        # XML 转义
        escaped = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        runs += f'<w:r>{rpr}<w:t xml:space="preserve">{escaped}</w:t></w:r>'
    return runs


def remove_tables_by_level(doc_xml, final_level):
    """
    根据终审级别删除多余的表格，同时清除关联的分页符段落，避免空白页。

    模板有 5 张表（0-indexed）：
      0:设表08-1/2  1:设表08-2/2  2:设表09-1所室级  3:院级  4:公司级

    模板表间结构（设表09-1 类型）：
      [表] → [注:1 段] → [2. 段] → [3. 段(含分页符)] → [下张表]
    表1后 是 [注:对复核意见的处理] → [分页符] → [下张表]（只有1个注段）

    策略：删表时把该表后面紧跟的所有"注"段落（1+2+3）整体删除。
    即找含分页符的段，然后向前回溯拼接的所有 <w:p> 段落一起删。
    """
    tbl_starts = [m.start() for m in re.finditer(r'<w:tbl>', doc_xml)]
    tbl_ends = [m.end() for m in re.finditer(r'</w:tbl>', doc_xml)]

    if len(tbl_starts) < 5:
        return doc_xml

    keep = {0, 1, 2}
    if final_level in ('院级', '公司级'):
        keep.add(3)
    if final_level == '公司级':
        keep.add(4)

    p_open_pattern = re.compile(r'<w:p(?:\s[^>]*)?>')
    p_close_pattern = re.compile(r'</w:p>')

    def find_para_start(xml, pos, search_from=0):
        """向前找最近 <w:p> 开标签位置（不是 <w:pPr>）。"""
        while pos > search_from:
            # 找 <w:p (不是 <w:pPr)
            idx = -1
            tmp = search_from
            while tmp < pos:
                p_idx = xml.find('<w:p', tmp, pos)
                if p_idx == -1:
                    break
                # 检查下一个字符
                if xml[p_idx:p_idx+4] == '<w:p' and (p_idx + 4 >= len(xml) or xml[p_idx+4] in ('>', ' ')):
                    # 确认不是 <w:pPr
                    if not xml[p_idx:p_idx+5].startswith('<w:pPr'):
                        idx = p_idx
                        break
                tmp = p_idx + 4
            return idx
        return -1

    def find_para_end(xml, pos, search_to):
        """向后找最近 </w:p> 结束位置。"""
        return xml.find('</w:p>', pos, search_to) + len('</w:p>')

    del_units = []
    for i in range(len(tbl_starts)):
        if i in keep:
            continue

        tbl_s = tbl_starts[i]
        tbl_e = tbl_ends[i]
        prev_end = tbl_ends[i - 1] if i > 0 else 0

        # ===== 删表后面的整组注段 =====
        # 找表后到下一张表之间的结构。表09-1类型表后是：
        #   [注:1 段] [2.段] [3.段(含分页符)]
        # 表08-2/2 类型表后是：
        #   [注:对复核意见段(含分页符)]
        # 不管哪种，都是：1+ 个段落，其中最后一个含分页符
        next_start = tbl_starts[i + 1] if i < len(tbl_starts) - 1 else len(doc_xml)
        del_end = tbl_e
        if i < len(tbl_starts) - 1:
            # 找表后第一个 <w:p 开标签（下一个 <w:p 是注段组的第一段）
            first_para_start = -1
            for m in p_open_pattern.finditer(doc_xml, tbl_e, next_start):
                p_s = m.start()
                # 排除 <w:pPr
                if doc_xml[p_s:p_s+5].startswith('<w:pPr'):
                    continue
                first_para_start = p_s
                break
            if first_para_start != -1:
                # 从 first_para_start 开始扫描所有 <w:p>段落，找到含分页符的最后一个
                # 段1+2+3都在 first_para_start 之后连续
                pos = first_para_start
                last_p_end = pos
                has_pb_in_group = False
                while pos < next_start:
                    # 找下一个 <w:p 或 <w:pPr
                    next_p = doc_xml.find('<w:p', pos, next_start)
                    if next_p == -1:
                        break
                    # 跳过 <w:pPr（不是真正的段开始）
                    if doc_xml[next_p:next_p+5].startswith('<w:pPr'):
                        pos = next_p + 5
                        continue
                    # 找这个段的 </w:p>
                    para_end = doc_xml.find('</w:p>', next_p, next_start)
                    if para_end == -1:
                        break
                    para_end += len('</w:p>')
                    para_xml = doc_xml[next_p:para_end]
                    if '<w:br' in para_xml and 'w:type="page"' in para_xml:
                        last_p_end = para_end
                        has_pb_in_group = True
                        break  # 找到含分页符的段，停止
                    last_p_end = para_end
                    pos = para_end
                if has_pb_in_group:
                    del_end = last_p_end

        # ===== 删表前面的分页段（不变）=====
        del_start = tbl_s
        pb_pattern = re.compile(r'<w:br\s+w:type="page"\s*/>')
        for m in pb_pattern.finditer(doc_xml, prev_end, tbl_s):
            pb_pos = m.start()
            pos = pb_pos
            para_start = -1
            while pos > prev_end:
                p_idx = -1
                tmp = prev_end
                while tmp < pos:
                    pi = doc_xml.find('<w:p', tmp, pos)
                    if pi == -1:
                        break
                    if doc_xml[pi:pi+5].startswith('<w:pPr'):
                        tmp = pi + 5
                        continue
                    if doc_xml[pi:pi+4] == '<w:p' and (pi + 4 >= len(doc_xml) or doc_xml[pi+4] in ('>', ' ')):
                        p_idx = pi
                        break
                    tmp = pi + 4
                if p_idx == -1:
                    break
                para_start = p_idx
                break
            if para_start != -1:
                del_start = para_start
            break

        del_units.append((del_start, del_end))

    # 合并重叠或相邻的删除单元
    del_units.sort()
    merged = []
    for start, end in del_units:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))

    # 从后往前删除
    result = doc_xml
    for start, end in sorted(merged, key=lambda x: -x[0]):
        result = result[:start] + result[end:]

    return result


def generate_qos_docx(data):
    """根据模板和数据生成 QoS docx 文件。"""
    template_path = os.path.join(TEMPLATE_DIR, TEMPLATE_FILE)
    if not os.path.exists(template_path):
        return None, f'模板文件不存在: {TEMPLATE_FILE}'

    try:
        with zipfile.ZipFile(template_path, 'r') as z:
            doc_xml = z.read('word/document.xml').decode('utf-8')

        final_level = data.get('final_audit_level', '院级')

        # 先删除多余的表格（在替换占位符之前，因为删除后占位符也会被删掉）
        doc_xml = remove_tables_by_level(doc_xml, final_level)

        # 意见文本：用户直接在文本框输入，保持原样（含换行）
        review_text = data.get('review_opinions_text', '')
        suoshi_text = data.get('audit_suoshi_text', '')
        yuan_text = data.get('audit_yuan_text', '')
        gongsi_text = data.get('audit_gongsi_text', '')

        # 构建替换映射
        replacements = {
            '这里填写项目名称及阶段': data.get('project_name', ''),
            '这里填写设计范围': data.get('design_range', ''),
            '这里填写完整图名或文件名': data.get('file_name', ''),
            '这里填写张数': data.get('sheet_count', ''),
            '这里填写复核意见': review_text,
            '这里填写所所审意见': suoshi_text,
            '这里填写院审审查意见': yuan_text,
            '这里填写公司审审查意见': gongsi_text,
            '这里填写终审级别': final_level,
        }

        # 批量替换所有占位符
        doc_xml = replace_all_placeholders(doc_xml, replacements)

        # 复核确认意见
        confirmation = data.get('review_confirmation', '')
        if confirmation:
            doc_xml = doc_xml.replace('确认已修改。', confirmation, 1)

        # 移除签名图片
        doc_xml = re.sub(r'<w:drawing>.*?</w:drawing>', '', doc_xml, flags=re.DOTALL)

        # 写入输出
        output = io.BytesIO()
        with zipfile.ZipFile(template_path, 'r') as zin:
            with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zout:
                for item in zin.namelist():
                    if item == 'word/document.xml':
                        zout.writestr(item, doc_xml.encode('utf-8'))
                    else:
                        zout.writestr(item, zin.read(item))

        output.seek(0)
        return output, None

    except Exception as e:
        import traceback
        return None, traceback.format_exc()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/generate', methods=['POST'])
def api_generate():
    data = request.json
    output, error = generate_qos_docx(data)

    if error:
        return jsonify({'error': error}), 500

    filename = f"QoS-{data.get('project_name', 'output')}.docx"
    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )


if __name__ == '__main__':
    # Vercel/容器部署：通过 PORT 环境变量注入端口；本地默认 5000
    port = int(os.environ.get('PORT', 5000))
    os.makedirs(TEMPLATE_DIR, exist_ok=True)
    print("=" * 50)
    print("QoS 审查卡片生成器")
    print("=" * 50)
    print(f"模板文件: {TEMPLATE_FILE}")
    print(f"模板目录: {TEMPLATE_DIR}")
    print(f"访问地址: http://localhost:{port}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port, debug=False)
