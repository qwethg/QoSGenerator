/**
 * 关于页面：展示本项目的真实信息、技术栈与未来计划
 */
export default {
    setup() {
        const version = 'v0.2.0';

        const techStack = [
            { name: 'Python', color: '#3776ab' },
            { name: 'Flask', color: '#3e8c95' },
            { name: 'Vue 3', color: '#42b883' },
            { name: 'docxtpl', color: '#5d6a4c' },
            { name: 'python-docx', color: '#2d5996' }
        ];

        const features = [
            {
                title: 'QoS 审查卡片生成',
                desc: '基于 docxtpl 模板引擎，按所级 / 院级 / 公司级动态渲染审查表格，自动剔除多余空白页。'
            },
            {
                title: '互提资料生成（有线通信）',
                desc: '覆盖站前、站后多个专业，支持房屋类型、电缆沟、过轨里程等参数配置，一键生成 Word 文档。'
            },
        ];

        const roadmap = [
            '完善预可研、可研、初设的铁路有线通信专业的互提资料生成',
            '输入资料的数据清洗与校验',
            '自动生成技术规格书',
            '持续优化界面交互体验',
            '补充更多设计辅助小工具'
        ];

        return { version, techStack, features, roadmap };
    },
    template: `
        <div class="about-view">
            <!-- 程序信息卡片 -->
            <div class="about-card about-card-hero">
                <div class="about-card-bg-icon">
                    <i class="ri-train-line"></i>
                </div>
                <div class="about-card-header">
                    <div class="about-icon blue">
                        <i class="ri-information-line"></i>
                    </div>
                    <div class="about-card-titles">
                        <h2 class="h3">关于</h2>
                        <p class="about-card-subtitle">铁路通信工程设计小工具台</p>
                    </div>
                </div>

                <div class="about-section">
                    <span class="about-section-label">版本</span>
                    <span class="about-version">{{ version }}</span>
                </div>

                <div class="about-divider"></div>

                <div class="about-section about-section-vertical">
                    <h3 class="h4 about-section-title">简介</h3>
                    <p class="about-text">
                        这是一个为铁路通信工程设计工作开发的辅助工具台，主要解决日常设计文档生成中重复、机械、容易出错的问题。
                        目前聚焦在两类输出：QoS 审查/复核卡片，以及有线通信专业的互提资料 Word 文档。
                        通过 Web 表单填写项目信息，后端基于 Word 模板自动渲染，省去在 Word 中反复排版和复制粘贴的时间。
                    </p>
                </div>

                <div class="about-divider"></div>

                <div class="about-section about-section-vertical">
                    <h3 class="h4 about-section-title">当前功能</h3>
                    <div class="about-features">
                        <div v-for="item in features" :key="item.title" class="about-feature-item">
                            <i class="ri-check-line about-feature-check"></i>
                            <div>
                                <p class="about-feature-title">{{ item.title }}</p>
                                <p class="about-feature-desc">{{ item.desc }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="about-divider"></div>

                <div class="about-section about-section-vertical">
                    <h3 class="h4 about-section-title">技术栈</h3>
                    <div class="about-tags">
                        <span
                            v-for="item in techStack"
                            :key="item.name"
                            class="about-tag"
                            :style="{ color: item.color, borderColor: item.color + '40' }"
                        >{{ item.name }}</span>
                    </div>
                    <p class="about-stack-note">
                        后端使用 Python + Flask 处理模板渲染与文件下载；前端使用 Vue 3 单页应用；
                        Word 文档基于 docxtpl / python-docx 在服务端生成，无需调用 Office COM 接口。
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
                        <h2 class="h3">未来计划</h2>
                    </div>
                </div>
                <ol class="about-roadmap">
                    <li v-for="(item, index) in roadmap" :key="index" class="about-roadmap-item">
                        <span class="about-roadmap-number">{{ index + 1 }}</span>
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
                        <h2 class="h3">开发者信息</h2>
                        <p class="about-card-subtitle">YY · 铁路通信设计人员</p>
                    </div>
                </div>

                <div class="about-section">
                    <span class="about-section-label">姓名</span>
                    <span class="about-section-value">YY</span>
                </div>

                <div class="about-divider"></div>

                <div class="about-section">
                    <span class="about-section-label">简介</span>
                    <span class="about-section-value">干了几年的铁路通信设计人员，想少做一点重复工作。</span>
                </div>

                <div class="about-divider"></div>

                <div class="about-section about-section-contact">
                    <span class="about-section-label">联系邮箱</span>
                    <a href="mailto:qwethg@live.cn" class="about-link">qwethg@live.cn</a>
                </div>
            </div>
        </div>
    `
};
