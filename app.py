# -*- coding: utf-8 -*-
"""
QoS 审查卡片生成器 - Web 应用
基于 Flask 的单页 Web 应用，使用 docxtpl 生成 QoS docx 文件。
"""
import os
import io
from flask import Flask, request, jsonify, send_file, render_template
from docxtpl import DocxTemplate

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.jinja_env.auto_reload = True

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates_docx')
TEMPLATE_FILE = 'QoS模板.docx'


def generate_qos_docx(data):
    """根据 docxtpl 模板和数据生成 QoS docx 文件。"""
    template_path = os.path.join(TEMPLATE_DIR, TEMPLATE_FILE)
    if not os.path.exists(template_path):
        return None, f'模板文件不存在: {TEMPLATE_FILE}'

    try:
        from docxtpl import DocxTemplate, RichText
        
        # 1. 加载 docxtpl 模板
        doc = DocxTemplate(template_path)
        
        # 辅助函数：将多行文本转换为 RichText 以保留换行符
        def make_rt(text):
            if not text:
                return ''
            rt = RichText()
            # 兼容 \r\n 和 \n
            lines = text.replace('\r\n', '\n').split('\n')
            for i, line in enumerate(lines):
                if i > 0:
                    rt.add('\a')  # \a 在 docxtpl 中代表软回车 <w:br/>
                rt.add(line)
            return rt
            
        # 2. 准备上下文数据
        context = {
            'project_name': data.get('project_name', ''),
            'design_range': data.get('design_range', ''),
            'file_name': data.get('file_name', ''),
            'sheet_count': data.get('sheet_count', ''),
            'review_opinions_text': make_rt(data.get('review_opinions_text', '')),
            'audit_suoshi_text': make_rt(data.get('audit_suoshi_text', '')),
            'audit_yuan_text': make_rt(data.get('audit_yuan_text', '')),
            'audit_gongsi_text': make_rt(data.get('audit_gongsi_text', '')),
            'final_audit_level': data.get('final_audit_level', '院级'),
            # 提供默认的复核确认语
            'review_confirmation': data.get('review_confirmation') or '确认已修改。'
        }
        
        # 3. 渲染模板
        doc.render(context)
        
        # 4. 写入内存
        output = io.BytesIO()
        doc.save(output)
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
    print("QoS 审查卡片生成器 (docxtpl 实验分支)")
    print("=" * 50)
    print(f"模板文件: {TEMPLATE_FILE}")
    print(f"模板目录: {TEMPLATE_DIR}")
    print(f"访问地址: http://localhost:{port}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port, debug=False)
