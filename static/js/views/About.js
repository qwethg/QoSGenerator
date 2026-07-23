/**
 * 关于页面：展示本项目的真实信息、技术栈与未来计划
 */
export default {
    setup() {
        const version = 'v0.2.0 (Blueprint Studio Build)';

        const techStack = [
            { name: 'Python 3.10+', color: 'var(--accent-ink)' },
            { name: 'Flask 3.0+', color: 'var(--accent-moss)' },
            { name: 'Vue 3 + ES Module', color: '#42b883' },
            { name: 'docxtpl + jinja2', color: 'var(--accent-caramel)' },
            { name: 'SheetJS / XLSX', color: '#107c41' },
            { name: 'XML 结构净化', color: 'var(--accent-moss-light)' }
        ];

        const features = [
            {
                title: 'QoS 审查卡片自动化生成',
                desc: '基于 docxtpl 渲染引擎，动态控制设表 08/09 的多级表块剔除，配合常用审查意见库抽屉实现一键快捷录入。'
            },
            {
                title: '有线通信专业多专业互提资料生成',
                desc: '支持站前站后 13 个交叉专业与 19 种工程机房的配置联动，内建散热量自动推导、动态 SVG 电缆沟剖面预览及 Excel 指示 HUD。'
            },
        ];

        const roadmap = [
            '完善预可研、可研、初设等多阶段铁路有线通信专业的互提资料生成模板',
            '增加工程输入数据的智能格式清洗与规则自动校验校验器',
            '推出通信专业技术规格书与接口协议自动匹配工具模块',
            '持续优化动态 SVG 电缆沟标注与交互式剖面缩放体验',
            '扩展铁路通信常备设备清单与计算小工具集'
        ];

        return { version, techStack, features, roadmap };
    },
    template: `
        <div class="about-view max-w-4xl mx-auto pb-12">
            <!-- 程序信息卡片 -->
            <div class="about-card about-card-hero">
                <div class="about-card-bg-icon">
                    <i class="ri-train-line"></i>
                </div>
                <div class="about-card-header">
                    <div class="about-icon blue">
                        <i class="ri-cpu-line"></i>
                    </div>
                    <div class="about-card-titles">
                        <h2 class="h3 font-bold">关于铁路通信辅助设计</h2>
                    </div>
                </div>

                <div class="about-section">
                    <span class="about-section-label">内部版本号</span>
                    <span class="about-version font-mono">{{ version }}</span>
                </div>

                <div class="about-divider"></div>

                <div class="about-section about-section-vertical">
                    <h3 class="h4 about-section-title font-semibold">软件简介与定位</h3>
                    <p class="about-text leading-relaxed">
                        本系统为铁路通信设计研发的标准化生产力工具，旨在消除日常设计文档编排中繁琐、机械、易出现排版缺陷的重复劳动。
                        目前核心覆盖两大生产环节：<strong>QoS 审查/复核卡片（设表08/09）</strong>与<strong>有线通信专业互提资料 Word 文档</strong>。
                        通过结构化表单录入项目参数，服务端基于 docxtpl 与 XML 动态节点净化引擎自动完成段落编号与表格剔除，直接输出出版级 Word 文档。
                    </p>
                </div>

                <div class="about-divider"></div>

                <div class="about-section about-section-vertical">
                    <h3 class="h4 about-section-title font-semibold">核心功能亮点</h3>
                    <div class="about-features">
                        <div v-for="item in features" :key="item.title" class="about-feature-item">
                            <i class="ri-checkbox-circle-fill about-feature-check text-moss"></i>
                            <div>
                                <p class="about-feature-title font-semibold">{{ item.title }}</p>
                                <p class="about-feature-desc">{{ item.desc }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="about-divider"></div>

                <div class="about-section about-section-vertical">
                    <h3 class="h4 about-section-title font-semibold">技术栈架构</h3>
                    <div class="about-tags">
                        <span
                            v-for="item in techStack"
                            :key="item.name"
                            class="about-tag font-mono text-xs"
                            :style="{ color: item.color, borderColor: item.color + '40' }"
                        >{{ item.name }}</span>
                    </div>
                    <p class="about-stack-note mt-2">
                        轻量化架构理念：前端采用 Vue 3 CDN 原生 ES Module 模式，无需复杂工具链构建打包；
                        后端纯 Python Flask 提供 REST API 服务与文件流下载，保证极其稳定可靠的跨平台部署支持。
                    </p>
                </div>
            </div>

            <!-- 未来计划卡片 -->
            <div class="about-card">
                <div class="about-card-header">
                    <div class="about-icon green">
                        <i class="ri-roadmap-line"></i>
                    </div>
                    <div class="about-card-titles">
                        <h2 class="h3 font-bold">版本演进与路线图 (Roadmap)</h2>
                    </div>
                </div>
                <ol class="about-roadmap">
                    <li v-for="(item, index) in roadmap" :key="index" class="about-roadmap-item">
                        <span class="about-roadmap-number font-mono">{{ index + 1 }}</span>
                        <span class="about-roadmap-text">{{ item }}</span>
                    </li>
                </ol>
            </div>

            <!-- 开发者信息卡片 -->
            <div class="about-card about-card-accent">
                <div class="about-card-header">
                    <div class="about-icon amber">
                        <i class="ri-user-3-line"></i>
                    </div>
                    <div class="about-card-titles">
                        <h2 class="h3 font-bold">开发者信息</h2>
                        <p class="about-card-subtitle">YY · 铁路通信设计工程师</p>
                    </div>
                </div>

                <div class="about-section">
                    <span class="about-section-label">开发者</span>
                    <span class="about-section-value font-semibold">YY</span>
                </div>

                <div class="about-divider"></div>

                <div class="about-section">
                    <span class="about-section-label">设计初心</span>
                    <span class="about-section-value">“做一款懂铁路通信工程师习惯的辅助台，把重复机械的劳动交给自动化。”</span>
                </div>

                <div class="about-divider"></div>

                <div class="about-section about-section-contact">
                    <span class="about-section-label">反馈邮箱</span>
                    <a href="mailto:qwethg@live.cn" class="about-link font-mono">qwethg@live.cn</a>
                </div>
            </div>
        </div>
    `
};

