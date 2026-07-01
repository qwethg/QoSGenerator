# -*- coding: utf-8 -*-
"""
Vercel Serverless 入口：复用根目录 app.py 中已定义的 Flask app。
Vercel 的 @vercel/python builder 会以 WSGI 方式调用此模块导出的 app 对象。
"""
from app import app  # noqa: F401
