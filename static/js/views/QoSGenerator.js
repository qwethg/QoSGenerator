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

        return { formData, isGenerating, levelHint, showYuan, showGongsi, generate };
    },
    template: `
        <div class="qos-view max-w-4xl mx-auto">
            <div class="card mb-6">
                <div class="card-header">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-information-line text-moss"></i> 项目信息
                    </h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">项目名称及阶段 <span class="required">*</span></label>
                            <input v-model="formData.project_name" type="text" class="form-input" placeholder="如：厦深动环改造施工图">
                        </div>
                        <div class="form-group">
                            <label class="form-label">设计范围 <span class="required">*</span></label>
                            <input v-model="formData.design_range" type="text" class="form-input" placeholder="如：厦深线">
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
                                <span>所级</span>
                            </label>
                            <label class="radio-label">
                                <input v-model="formData.final_audit_level" type="radio" value="院级">
                                <span>院级</span>
                            </label>
                            <label class="radio-label">
                                <input v-model="formData.final_audit_level" type="radio" value="公司级">
                                <span>公司级</span>
                            </label>
                        </div>
                        <div class="hint-box mt-2">
                            <i class="ri-lightbulb-line"></i> {{ levelHint }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-6 border-left-moss">
                <div class="card-header">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-edit-2-line text-moss"></i> 复核意见（设表08-1/2）
                    </h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">复核意见内容</label>
                        <textarea v-model="formData.review_opinions_text" class="form-textarea" placeholder="每行一条意见，序号请自行编写..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">复核确认意见</label>
                        <input v-model="formData.review_confirmation" type="text" class="form-input" placeholder="如：确认已修改。">
                    </div>
                </div>
            </div>

            <div class="card mb-6 border-left-moss">
                <div class="card-header">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-shield-check-line text-moss"></i> 所室级审查意见（设表09-1）
                    </h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">审查意见内容</label>
                        <textarea v-model="formData.audit_suoshi_text" class="form-textarea" placeholder="每行一条意见，序号请自行编写..."></textarea>
                    </div>
                </div>
            </div>

            <transition name="fade">
                <div v-if="showYuan" class="card mb-6 border-left-ink">
                    <div class="card-header">
                        <h3 class="h3 flex items-center gap-2">
                            <i class="ri-shield-star-line text-ink"></i> 院级审查意见（设表09-1）
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">审查意见内容</label>
                            <textarea v-model="formData.audit_yuan_text" class="form-textarea" placeholder="每行一条意见，序号请自行编写..."></textarea>
                        </div>
                    </div>
                </div>
            </transition>

            <transition name="fade">
                <div v-if="showGongsi" class="card mb-6 border-left-caramel">
                    <div class="card-header">
                        <h3 class="h3 flex items-center gap-2">
                            <i class="ri-building-line text-caramel"></i> 公司级审查意见（设表09-1）
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">审查意见内容</label>
                            <textarea v-model="formData.audit_gongsi_text" class="form-textarea" placeholder="每行一条意见，序号请自行编写..."></textarea>
                        </div>
                    </div>
                </div>
            </transition>

            <div class="flex justify-center mt-8">
                <button @click="generate" :disabled="isGenerating" class="btn btn-primary btn-large">
                    <i :class="isGenerating ? 'ri-loader-4-line spin' : 'ri-file-word-2-line'"></i>
                    {{ isGenerating ? '生成中...' : '生成 QoS 文件' }}
                </button>
            </div>
        </div>
    `
};
