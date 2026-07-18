# -*- coding: utf-8 -*-
"""
QoS 审查卡片及互提资料生成器 - 路由入口
本文件仅作为 Flask 路由层和 Web 服务入口，所有核心文档生成逻辑均已剥离至 services 包中。
"""
import os
from flask import Flask, request, jsonify, send_file, render_template

# 从服务包中导入渲染逻辑，并在此重导以维持现有测试脚本 (test_*.py) 的前向兼容
from services.docx_renderer import generate_qos_docx, generate_cross_data_docx

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.jinja_env.auto_reload = True

# 保持部分展示信息所需的常量
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates_docx')
TEMPLATE_FILE = 'QoS模板.docx'


def translate_error(error_msg):
    """
    将底层的渲染错误信息转换为对普通用户友好的中文业务提示。
    """
    if not error_msg:
        return "未知渲染错误"

    error_str = str(error_msg)

    # 1. 拦截 Jinja2 模板语法错误
    if "TemplateSyntaxError" in error_str:
        # 尝试提取具体的语法错因
        reason = error_str.split("TemplateSyntaxError:")[-1].strip()
        reason = reason.split("\n")[0]  # 仅取第一行
        return f"模板语法错误：检测到 Word 模板中的 Jinja2 标签语法不正确（可能存在未配对的 %if%/%endif% 或 %for%/%endfor% 段落标记）。错误详情: {reason}"

    # 2. 拦截模板文件找不到的错误
    if "FileNotFoundError" in error_str or "模板文件不存在" in error_str:
        return "模板文件缺失：服务器未找到指定的 Word 模板文件，请联系管理员确认 templates_docx/ 目录下的模板完整性。"

    # 3. 拦截读写权限错误
    if "PermissionError" in error_str or "Permission denied" in error_str:
        return "文件访问受限：服务器无权读取模板或保存临时文件，请确保模板文件未被其他程序（如 Word）独占打开，且 templates_docx/ 目录具备读写权限。"

    # 4. 如果是普通的不包含堆栈的自定义字符串错，直接作为友好消息返回
    if "Traceback" not in error_str:
        return f"生成失败：{error_str}"

    # 5. 其他未知异常，提取报错堆栈的最后一行
    lines = [line.strip() for line in error_str.split("\n") if line.strip()]
    last_line = lines[-1] if lines else error_str
    return f"文档生成失败：在处理模板时发生未预料的系统错误。请检查输入数据格式。详情: {last_line}"


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    """单页应用静态 HTML 兜底路由"""
    # 如果请求的是 API，就不走这里
    if path.startswith('api/'):
        return "Not Found", 404
    return render_template('index.html')


@app.route('/api/generate/<doc_type>', methods=['POST'])
def api_generate(doc_type):
    """自动生成文档接口，处理业务化异常转换"""
    data = request.json
    
    if doc_type == 'qos':
        output, error = generate_qos_docx(data)
        filename = f"QoS-{data.get('project_name', 'output')}.docx"
    elif doc_type == 'cross_data':
        output, error = generate_cross_data_docx(data)
        filename = f"互提资料-{data.get('project_name', 'output')}.docx"
    else:
        return jsonify({'error': '未知的文档类型'}), 400

    if error:
        # 将原始错误转换为友好的业务提示
        friendly_error = translate_error(error)
        # 控制台打印原始错误以供开发排查
        print(f"[Error Details]:\n{error}")
        return jsonify({'error': friendly_error}), 500

    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )


if __name__ == '__main__':
    # 获取环境变量注入端口，本地默认 5000
    port = int(os.environ.get('PORT', 5000))
    os.makedirs(TEMPLATE_DIR, exist_ok=True)
    print("=" * 50)
    print("QoS 审查卡片生成器 (标准化重构版本)")
    print("=" * 50)
    print(f"模板文件: {TEMPLATE_FILE}")
    print(f"模板目录: {TEMPLATE_DIR}")
    print(f"访问地址: http://localhost:{port}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port, debug=False)
