import { useRouter } from 'vue-router';

export default {
    setup() {
        const router = useRouter();
        
        const tools = [
            {
                id: 'qos',
                title: 'QoS 审查卡片生成器',
                description: '自动化生成设计复核/审查卡片 docx 文件，支持所级、院级、公司级动态表格调整。',
                icon: 'ri-file-word-2-fill',
                color: 'var(--accent-moss)',
                path: '/qos'
            },
            {
                id: 'mutual-data',
                title: '互提资料生成器（有线通信）',
                description: '快速生成各阶段有线通信专业的互提资料 Word 文档，包含提站前、站后专业，支持根据需要调整。',
                icon: 'ri-file-transfer-fill',
                color: 'var(--accent-caramel)',
                path: '/mutual-data'
            }
        ];

        const navigateTo = (path) => {
            router.push(path);
        };

        return { tools, navigateTo };
    },
    template: `
        <div class="home-view">
            <div class="welcome-section">
                <h1 class="h1 font-bold tracking-tight">欢迎使用铁路通信辅助设计</h1>
                <p class="text-body text-secondary mt-2">选择下方工具开始您的工作，大幅提升文档生成效率。</p>
            </div>
            
            <div class="tools-grid">
                <div 
                    v-for="tool in tools" 
                    :key="tool.id" 
                    class="tool-card"
                    @click="navigateTo(tool.path)"
                >
                    <div class="tool-icon-wrapper" :style="{ backgroundColor: tool.color + '1A', color: tool.color }">
                        <i :class="tool.icon"></i>
                    </div>
                    <h3 class="h3 font-semibold">{{ tool.title }}</h3>
                    <p class="text-sm text-secondary leading-relaxed">{{ tool.description }}</p>
                    <div class="tool-action">
                        <span>进入工具</span>
                        <i class="ri-arrow-right-line"></i>
                    </div>
                </div>
            </div>
        </div>
    `
};


