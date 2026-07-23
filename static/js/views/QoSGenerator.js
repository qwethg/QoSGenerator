import { ref, computed } from 'vue';
import { store } from '../store.js';

export default {
    setup() {
        const formData = ref({
            project_name: '',
            design_range: '',
            file_name: '施工图',
            sheet_count: '',
            final_audit_level: '院级',
            review_opinions_text: '',
            review_confirmation: '确认已修改。',
            audit_suoshi_text: '',
            audit_yuan_text: '',
            audit_gongsi_text: ''
        });

        const isGenerating = ref(false);

        const levelHint = computed(() => {
            const map = {
                '所级': '生成表格：复核卡片 + 所室级审查',
                '院级': '生成表格：复核卡片 + 所室级审查 + 院级审查',
                '公司级': '生成表格：复核卡片 + 所室级审查 + 院级审查 + 公司级审查'
            };
            return map[formData.value.final_audit_level];
        });

        const showYuan = computed(() => ['院级', '公司级'].includes(formData.value.final_audit_level));
        const showGongsi = computed(() => formData.value.final_audit_level === '公司级');

        const generate = async () => {
            if (!formData.value.project_name.trim()) {
                store.notify('请填写项目名称及阶段', 'error');
                return;
            }
            if (!formData.value.design_range.trim()) {
                store.notify('请填写设计范围', 'error');
                return;
            }

            isGenerating.value = true;
            store.notify('正在生成 QoS 文件...', 'info');

            try {
                const response = await fetch('/api/generate/qos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData.value)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || '生成失败');
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `QoS-${formData.value.project_name}.docx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                store.notify('文件已成功生成并开始下载', 'success');
            } catch (error) {
                store.notify(error.message, 'error');
            } finally {
                isGenerating.value = false;
            }
        };

        const searchQuery = ref('');

        const filteredOpinionGroups = computed(() => {
            if (!searchQuery.value.trim()) return opinionGroups;
            const query = searchQuery.value.trim().toLowerCase();
            return opinionGroups.map(group => ({
                title: group.title,
                items: group.items.filter(item => item.toLowerCase().includes(query))
            })).filter(group => group.items.length > 0);
        });

        const drawer = ref({
            isOpen: false,
            activeKey: ''
        });

        const openDrawer = (key) => {
            drawer.value.isOpen = true;
            drawer.value.activeKey = key;
        };

        const closeDrawer = () => {
            drawer.value.isOpen = false;
            searchQuery.value = '';
        };

        const opinionGroups = [
            {
                title: '设表 08 设计复核意见',
                items: [
                    '图纸目录与图纸内容、图号应核对一致。',
                    '系统图与平面图的设备接口对应关系应核对一致，确保端口及数量正确。',
                    '电缆清册中的光电缆长度应合理留有富余量，避免施工短缺。',
                    '应核对平面图中设备排列顺序与配线架走向的一致性。',
                    '桥梁、隧道引下预留位置应核对无遗漏，且满足限界要求。',
                    '电源引入容量及电压等级应与电力专业互提资料核对确认一致。'
                ]
            },
            {
                title: '设表 09 所室级审查意见',
                items: [
                    '本工程设计范围、设计标准和采用的规范符合国家及行业现行标准。',
                    '有线通信系统方案基本合理，平面布置符合防火、防雷和通风散热要求。',
                    '与房建、电力、暖通等站后专业互提资料齐全，接口交代清晰。',
                    '与路基、桥梁、隧道等站前专业互提电缆槽/洞口资料已校核无误。',
                    '说明书表述详实，图纸表达清晰度符合施工图设计深度要求。'
                ]
            },
            {
                title: '设表 09 院级审查意见',
                items: [
                    '同意所室级审查意见。设计方案合理，基本满足设计合同要求。',
                    '主要技术经济指标基本合理，控制保护及防雷接地措施符合安全规范。',
                    '应进一步核实与既有线接轨处的通信接口协议，补充安全过渡方案。',
                    '图纸设计深度满足现场施工安装要求，同意修改后出版。'
                ]
            },
            {
                title: '设表 09 公司级审查意见',
                items: [
                    '同意院、所两级审查意见。本阶段设计文件符合规范，可交付出版。',
                    '针对营业线施工安全，应在说明书中进一步强调营业线安全防护措施与交底要求。',
                    '重点设备选型及概算造价控制符合建设单位控制性文件要求。'
                ]
            }
        ];

        const insertOpinion = (text) => {
            const key = drawer.value.activeKey;
            if (!key) return;

            let currentVal = formData.value[key] || '';
            currentVal = currentVal.trim();

            const lines = currentVal ? currentVal.split('\n') : [];
            const nextNum = lines.length + 1;

            const formattedText = `${nextNum}. ${text}`;

            if (currentVal) {
                formData.value[key] = currentVal + '\n' + formattedText;
            } else {
                formData.value[key] = formattedText;
            }

            store.notify(`已插入复核意见 #${nextNum}`, 'success', 1200);
        };

        return { 
            formData, 
            isGenerating, 
            levelHint, 
            showYuan, 
            showGongsi, 
            generate,
            drawer,
            searchQuery,
            filteredOpinionGroups,
            openDrawer,
            closeDrawer,
            insertOpinion
        };
    },
    template: `
        <div class="qos-view max-w-4xl mx-auto">
            <div class="card mb-6">
                <div class="card-header flex justify-between items-center">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-information-line text-moss"></i> 
                        <span>项目基本信息</span>
                    </h3>
                    <span class="text-xs text-tertiary font-mono">QoS-STATION-FORM</span>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">项目名称及阶段 <span class="required">*</span></label>
                            <input v-model="formData.project_name" type="text" class="form-input" placeholder="如：厦深动环改造施工图">
                        </div>
                        <div class="form-group">
                            <label class="form-label">设计范围 <span class="required">*</span></label>
                            <input v-model="formData.design_range" type="text" class="form-input" placeholder="如：厦深线 K12+000 ~ K45+200">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">图名或文件名</label>
                            <input v-model="formData.file_name" type="text" class="form-input" placeholder="如：施工图">
                        </div>
                        <div class="form-group">
                            <label class="form-label">图号或图纸张数</label>
                            <input v-model="formData.sheet_count" type="text" class="form-input" placeholder="如：1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">终审级别 <span class="required">*</span></label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input v-model="formData.final_audit_level" type="radio" value="所级">
                                <span>所级 (设表08 + 所室级)</span>
                            </label>
                            <label class="radio-label">
                                <input v-model="formData.final_audit_level" type="radio" value="院级">
                                <span>院级 (含院级审查)</span>
                            </label>
                            <label class="radio-label">
                                <input v-model="formData.final_audit_level" type="radio" value="公司级">
                                <span>公司级 (全流程审签)</span>
                            </label>
                        </div>
                        <div class="hint-box mt-3">
                            <i class="ri-lightbulb-line text-caramel"></i> {{ levelHint }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-6 border-left-moss">
                <div class="card-header flex justify-between items-center">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-edit-2-line text-moss"></i> 
                        <span>复核意见（设表 08-1/2）</span>
                    </h3>
                    <button type="button" class="btn btn-secondary btn-sm" @click="openDrawer('review_opinions_text')">
                        <i class="ri-book-read-line text-moss"></i> 常用句库抽屉
                    </button>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">复核意见内容</label>
                        <textarea v-model="formData.review_opinions_text" class="form-textarea" placeholder="每行一条意见，点击常用句库可自动编号追加..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">复核确认意见</label>
                        <input v-model="formData.review_confirmation" type="text" class="form-input" placeholder="如：确认已修改。">
                    </div>
                </div>
            </div>

            <div class="card mb-6 border-left-moss">
                <div class="card-header flex justify-between items-center">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-shield-check-line text-moss"></i> 
                        <span>所室级审查意见（设表 09-1）</span>
                    </h3>
                    <button type="button" class="btn btn-secondary btn-sm" @click="openDrawer('audit_suoshi_text')">
                        <i class="ri-book-read-line text-moss"></i> 常用句库抽屉
                    </button>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">审查意见内容</label>
                        <textarea v-model="formData.audit_suoshi_text" class="form-textarea" placeholder="每行一条意见，点击常用句库可自动编号追加..."></textarea>
                    </div>
                </div>
            </div>

            <transition name="fade">
                <div v-if="showYuan" class="card mb-6 border-left-ink">
                    <div class="card-header flex justify-between items-center">
                        <h3 class="h3 flex items-center gap-2">
                            <i class="ri-shield-star-line text-ink"></i> 
                            <span>院级审查意见（设表 09-1）</span>
                        </h3>
                        <button type="button" class="btn btn-secondary btn-sm" @click="openDrawer('audit_yuan_text')">
                            <i class="ri-book-read-line text-ink"></i> 常用句库抽屉
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">审查意见内容</label>
                            <textarea v-model="formData.audit_yuan_text" class="form-textarea" placeholder="每行一条意见，点击常用句库可自动编号追加..."></textarea>
                        </div>
                    </div>
                </div>
            </transition>

            <transition name="fade">
                <div v-if="showGongsi" class="card mb-6 border-left-caramel">
                    <div class="card-header flex justify-between items-center">
                        <h3 class="h3 flex items-center gap-2">
                            <i class="ri-building-line text-caramel"></i> 
                            <span>公司级审查意见（设表 09-1）</span>
                        </h3>
                        <button type="button" class="btn btn-secondary btn-sm" @click="openDrawer('audit_gongsi_text')">
                            <i class="ri-book-read-line text-caramel"></i> 常用句库抽屉
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">审查意见内容</label>
                            <textarea v-model="formData.audit_gongsi_text" class="form-textarea" placeholder="每行一条意见，点击常用句库可自动编号追加..."></textarea>
                        </div>
                    </div>
                </div>
            </transition>

            <div class="flex justify-center mt-8 mb-12">
                <button @click="generate" :disabled="isGenerating" class="btn btn-primary btn-large" :class="{ 'is-generating': isGenerating }">
                    <i :class="isGenerating ? 'ri-loader-4-line spin' : 'ri-file-word-2-line'"></i>
                    <span>{{ isGenerating ? '正在生成 QoS 文档...' : '生成并下载 QoS 审查卡片' }}</span>
                </button>
            </div>

            <!-- QoS Quick Snippets Drawer -->
            <div class="qos-drawer" :class="{ 'open': drawer.isOpen }">
                <div class="qos-drawer-header">
                    <h4 class="h4 flex items-center gap-2">
                        <i class="ri-book-read-line text-moss"></i>
                        <span>常用审查意见词库</span>
                    </h4>
                    <button class="drawer-close-btn" @click="closeDrawer" title="关闭抽屉">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
                <div class="px-6 pt-4 pb-2">
                    <div class="relative">
                        <input v-model="searchQuery" type="text" class="form-input text-xs pl-8" placeholder="搜索意见常用语关键词...">
                        <i class="ri-search-line absolute left-2.5 top-2.5 text-tertiary text-xs"></i>
                    </div>
                </div>
                <div class="qos-drawer-body">
                    <div v-for="group in filteredOpinionGroups" :key="group.title" class="opinion-group">
                        <h5 class="opinion-group-title">{{ group.title }}</h5>
                        <div class="opinion-list">
                            <div v-for="item in group.items" :key="item" class="opinion-item" @click="insertOpinion(item)">
                                <i class="ri-add-line opinion-add-icon"></i>
                                <span class="opinion-item-text">{{ item }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-if="filteredOpinionGroups.length === 0" class="text-xs text-tertiary text-center py-6">
                        未匹配到相关意见，请尝试其他关键词
                    </div>
                </div>
            </div>
            <!-- Drawer Backdrop -->
            <div class="drawer-backdrop" v-if="drawer.isOpen" @click="closeDrawer"></div>
        </div>
    `
};

