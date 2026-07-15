import { ref } from 'vue';
import { store } from '../store.js';

// 房屋类型默认配置（与后端 ROOM_DEFAULTS 保持一致）
const DEFAULT_ROOM_TYPES = [
    { key: 'txz', label: '通信站', area: '1900', staff: '15', loc: '枢纽所在地', power: 100, power_remark: '' },
    { key: 'xhl_l', label: '信号楼（大）', area: '120', staff: '', loc: '车站', power: 45, power_remark: '枢纽重要站点' },
    { key: 'xhl_m', label: '信号楼（中）', area: '100', staff: '', loc: '车站', power: 25, power_remark: '视频节点、市级' },
    { key: 'xhl_s', label: '信号楼（小）', area: '80', staff: '', loc: '车站', power: 15, power_remark: '其他' },
    { key: 'xls', label: '线路所通信机械室', area: '80', staff: '', loc: '线路所', power: 25, power_remark: '' },
    { key: 'yrj', label: '车站引入所厅通信引入间', area: '15', staff: '', loc: '引入所', power: 5, power_remark: '' },
    { key: 'zf', label: '站房通信机械室', area: '80', staff: '', loc: '站房', power: 15, power_remark: '不含信号楼的站房' },
    { key: 'zjz', label: '信号中继站通信机械室', area: '60', staff: '', loc: '中继站', power: 15, power_remark: '' },
    { key: 'pcs', label: '公安派出所通信机械室', area: '30', staff: '', loc: '公安派出所', power: 10, power_remark: '' },
    { key: 'hyl', label: '货运楼通信机械室', area: '60', staff: '', loc: '货运楼', power: 15, power_remark: '' },
    { key: 'ds', label: '动车所、综合维修段等通信机械室', area: '80', staff: '', loc: '动车所/综合维修段', power: 15, power_remark: '' },
    { key: 'hzgs', label: '单身宿舍、办公楼配线间', area: '10', staff: '', loc: '单身宿舍/办公楼', power: 2, power_remark: '公司管理' },
    { key: 'txcj', label: '存车场生产办公楼通信机械室', area: '60', staff: '', loc: '存车场', power: 15, power_remark: '' },
    { key: 'txgq', label: '综合维修工区办公楼通信机械室', area: '60', staff: '', loc: '综合维修工区', power: 15, power_remark: '' },
    { key: 'dlpds', label: '电力配电所通信机械室', area: '30', staff: '', loc: '电力配电所', power: 10, power_remark: '箱式机房设于主控室' },
    { key: 'dqhst', label: '电气化所亭通信机械室', area: '30', staff: '', loc: '电气化所亭', power: 10, power_remark: '箱式机房设于主控室' },
    { key: 'txyrjx', label: '车辆探测站（5T机房）', area: '10', staff: '', loc: '车辆探测站', power: 2, power_remark: '通信设备用插座' },
    { key: 'txzbgq', label: '未设工区的地点通信值班工区', area: '10', staff: '', loc: '通信值班工区', power: 2, power_remark: '' },
    { key: 'txjz', label: '区间基站通信机械室', area: '', staff: '', loc: '区间基站', power: null, power_remark: '由无线专业一并提出' },
];

// 初始化房屋配置对象
function createDefaultRooms() {
    const rooms = {};
    for (const rt of DEFAULT_ROOM_TYPES) {
        rooms[rt.key] = {
            enabled: true,
            name: rt.label,
            area: rt.area,
            staff: rt.staff,
            loc: rt.loc,
            power: rt.power,
            power_remark: rt.power_remark
        };
    }
    return rooms;
}

export default {
    setup() {
        const formData = ref({
            // 基础信息
            project_name: '',
            design_stage: '施工图',
            railway_type: '高速铁路',
            doc_id: '**施通-001',
            source_institute: '通号院',
            source_profession: '有线通信',

            // 专业章节开关（12 个专业）
            has_fangjian: true,
            has_dianli: true,
            has_nuantong: true,
            has_qianyin: true,
            has_jiechuwang: true,
            has_wuxian: true,
            has_jixie: true,
            has_cheliang: true,
            has_luji: true,
            has_suidao: true,
            has_qiaoliang: true,
            has_zhanchang: true,

            // 房屋类型配置
            rooms: createDefaultRooms(),

            // 电缆沟/分支槽参数
            cable_trench: {
                trench_txz_width: 500,
                trench_txz_depth: 400,
                trench_mid_width: 400,
                trench_mid_depth: 400,
                branch_dist_min: 2,
                branch_txz_width: 500,
                branch_txz_depth: 400,
                branch_major_width: 400,
                branch_major_depth: 400,
                trough_width: 250,
                trough_depth: 150
            }
        });

        const isGenerating = ref(false);

        const generate = async () => {
            if (!formData.value.project_name.trim()) {
                store.notify('请填写项目名称', 'error');
                return;
            }

            isGenerating.value = true;
            store.notify('正在生成互提资料...', 'info');

            try {
                const response = await fetch('/api/generate/cross_data', {
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
                a.download = `互提资料-${formData.value.project_name}.docx`;
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

        return { formData, isGenerating, generate, DEFAULT_ROOM_TYPES };
    },
    template: `
        <div class="mutual-data-view max-w-4xl mx-auto pb-12">
            <!-- 基础信息 -->
            <div class="card mb-6">
                <div class="card-header">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-information-line text-moss"></i> 基础信息
                    </h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">项目名称 <span class="required">*</span></label>
                            <input v-model="formData.project_name" type="text" class="form-input" placeholder="如：湛海高铁">
                        </div>
                        <div class="form-group">
                            <label class="form-label">文档编号</label>
                            <input v-model="formData.doc_id" type="text" class="form-input" placeholder="如：互提资料-001">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div class="form-group">
                            <label class="form-label">设计阶段 <span class="required">*</span></label>
                            <div class="radio-group mt-2">
                                <label class="radio-label">
                                    <input v-model="formData.design_stage" type="radio" value="施工图">
                                    <span>施工图</span>
                                </label>
                                <label class="radio-label">
                                    <input v-model="formData.design_stage" type="radio" value="初步设计">
                                    <span>初步设计</span>
                                </label>
                                <label class="radio-label">
                                    <input v-model="formData.design_stage" type="radio" value="可研">
                                    <span>可研</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">铁路类型 <span class="required">*</span></label>
                            <div class="radio-group mt-2">
                                <label class="radio-label">
                                    <input v-model="formData.railway_type" type="radio" value="高速铁路">
                                    <span>高速铁路</span>
                                </label>
                                <label class="radio-label">
                                    <input v-model="formData.railway_type" type="radio" value="普速铁路">
                                    <span>普速铁路</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div class="form-group">
                            <label class="form-label">提供单位</label>
                            <input v-model="formData.source_institute" type="text" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">提供专业</label>
                            <input v-model="formData.source_profession" type="text" class="form-input">
                        </div>
                    </div>
                </div>
            </div>

            <!-- 专业开关 -->
            <div class="card mb-6 border-left-caramel">
                <div class="card-header">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-toggle-line text-caramel"></i> 接收专业配置
                    </h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-4 gap-3">
                        <label class="profession-checkbox" :class="{ 'active': formData.has_luji }">
                            <input v-model="formData.has_luji" type="checkbox">
                            <span>提路基专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_suidao }">
                            <input v-model="formData.has_suidao" type="checkbox">
                            <span>提隧道专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_qiaoliang }">
                            <input v-model="formData.has_qiaoliang" type="checkbox">
                            <span>提桥梁专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_zhanchang }">
                            <input v-model="formData.has_zhanchang" type="checkbox">
                            <span>提站场专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_fangjian }">
                            <input v-model="formData.has_fangjian" type="checkbox">
                            <span>提房建专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_dianli }">
                            <input v-model="formData.has_dianli" type="checkbox">
                            <span>提电力专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_nuantong }">
                            <input v-model="formData.has_nuantong" type="checkbox">
                            <span>提暖通专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_qianyin }">
                            <input v-model="formData.has_qianyin" type="checkbox">
                            <span>提牵引变电专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_jiechuwang }">
                            <input v-model="formData.has_jiechuwang" type="checkbox">
                            <span>提接触网专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_wuxian }">
                            <input v-model="formData.has_wuxian" type="checkbox">
                            <span>提无线通信专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_jixie }">
                            <input v-model="formData.has_jixie" type="checkbox">
                            <span>提机械专业</span>
                        </label>
                        <label class="profession-checkbox" :class="{ 'active': formData.has_cheliang }">
                            <input v-model="formData.has_cheliang" type="checkbox">
                            <span>提车辆专业</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- 房屋类型配置 -->
            <div class="card mb-6 border-left-moss">
                <div class="card-header">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-building-4-line text-moss"></i> 房屋类型配置
                    </h3>
                </div>
                <div class="card-body">
                    <p class="text-sm text-gray-500 mb-4" style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">
                        勾选需要生成的房屋类型，直接在表格中修改参数。取消勾选则对应行不会生成。
                    </p>
                    <div class="table-container">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 border-b border-gray-200">
                                    <th class="p-2 text-center" style="width: 50px;">勾选</th>
                                    <th class="p-2" style="width: 25%;">房屋名称</th>
                                    <th class="p-2" style="width: 20%;">设置地点</th>
                                    <th class="p-2 text-center" style="width: 12%;">面积(㎡)</th>
                                    <th class="p-2 text-center" style="width: 10%;">定员</th>
                                    <th class="p-2 text-center" style="width: 12%;">用电量(kW)</th>
                                    <th class="p-2" style="width: 21%;">备注</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="rt in DEFAULT_ROOM_TYPES" :key="rt.key"
                                    class="border-b border-gray-100 transition-opacity duration-200"
                                    :class="{ 'opacity-40 bg-gray-50/50': !formData.rooms[rt.key].enabled }">
                                    <td class="p-2 text-center" style="width: 50px;">
                                        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                                            <input v-model="formData.rooms[rt.key].enabled" type="checkbox" class="room-checkbox">
                                        </div>
                                    </td>
                                    <td class="p-2 text-[0.875rem] font-medium text-gray-700" style="padding-left: 12px;">{{ rt.label }}</td>
                                    <td class="p-2"><input v-model="formData.rooms[rt.key].loc" type="text" class="form-input py-1.5 px-2.5 text-[0.875rem] w-full bg-transparent hover:bg-white focus:bg-white" :disabled="!formData.rooms[rt.key].enabled"></td>
                                    <td class="p-2"><input v-model="formData.rooms[rt.key].area" type="text" class="form-input py-1.5 px-2.5 text-[0.875rem] w-full text-center bg-transparent hover:bg-white focus:bg-white" :disabled="!formData.rooms[rt.key].enabled"></td>
                                    <td class="p-2"><input v-model="formData.rooms[rt.key].staff" type="text" class="form-input py-1.5 px-2.5 text-[0.875rem] w-full text-center bg-transparent hover:bg-white focus:bg-white" :disabled="!formData.rooms[rt.key].enabled"></td>
                                    <td class="p-2"><input v-model="formData.rooms[rt.key].power" type="text" class="form-input py-1.5 px-2.5 text-[0.875rem] w-full text-center bg-transparent hover:bg-white focus:bg-white" :disabled="!formData.rooms[rt.key].enabled"></td>
                                    <td class="p-2"><input v-model="formData.rooms[rt.key].power_remark" type="text" class="form-input py-1.5 px-2.5 text-[0.875rem] w-full bg-transparent hover:bg-white focus:bg-white" :disabled="!formData.rooms[rt.key].enabled"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 电缆沟参数 -->
            <div class="card mb-6 border-left-ink">
                <div class="card-header">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-ruler-line text-ink"></i> 电缆沟与分支槽参数
                    </h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-6">
                        
                        <!-- 站台沟 -->
                        <div class="cable-card">
                            <h4 class="cable-title">
                                <i class="ri-drag-move-line"></i> 站台沟 (mm)
                            </h4>
                            <div class="cable-row">
                                <span class="cable-label">通信站</span>
                                <div class="cable-inputs">
                                    <div class="cable-input-group"><span class="cable-input-prefix">宽</span><input v-model.number="formData.cable_trench.trench_txz_width" type="number" class="cable-input"></div>
                                    <div class="cable-input-group"><span class="cable-input-prefix">深</span><input v-model.number="formData.cable_trench.trench_txz_depth" type="number" class="cable-input"></div>
                                </div>
                            </div>
                            <div class="cable-row">
                                <span class="cable-label">中间站</span>
                                <div class="cable-inputs">
                                    <div class="cable-input-group"><span class="cable-input-prefix">宽</span><input v-model.number="formData.cable_trench.trench_mid_width" type="number" class="cable-input"></div>
                                    <div class="cable-input-group"><span class="cable-input-prefix">深</span><input v-model.number="formData.cable_trench.trench_mid_depth" type="number" class="cable-input"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 分支槽 -->
                        <div class="cable-card">
                            <h4 class="cable-title">
                                <i class="ri-node-tree"></i> 分支槽 (mm)
                            </h4>
                            <div class="cable-row">
                                <span class="cable-label">通信站</span>
                                <div class="cable-inputs">
                                    <div class="cable-input-group"><span class="cable-input-prefix">宽</span><input v-model.number="formData.cable_trench.branch_txz_width" type="number" class="cable-input"></div>
                                    <div class="cable-input-group"><span class="cable-input-prefix">深</span><input v-model.number="formData.cable_trench.branch_txz_depth" type="number" class="cable-input"></div>
                                </div>
                            </div>
                            <div class="cable-row">
                                <span class="cable-label">主要房屋</span>
                                <div class="cable-inputs">
                                    <div class="cable-input-group"><span class="cable-input-prefix">宽</span><input v-model.number="formData.cable_trench.branch_major_width" type="number" class="cable-input"></div>
                                    <div class="cable-input-group"><span class="cable-input-prefix">深</span><input v-model.number="formData.cable_trench.branch_major_depth" type="number" class="cable-input"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 场坪槽与其它 (跨两列显示) -->
                        <div class="cable-card" style="grid-column: span 2;">
                            <h4 class="cable-title">
                                <i class="ri-layout-masonry-line"></i> 场坪槽与其它
                            </h4>
                            <div class="grid grid-cols-2 gap-6">
                                <div class="cable-row" style="margin-bottom: 0;">
                                    <span class="cable-label">房屋场坪槽</span>
                                    <div class="cable-inputs">
                                        <div class="cable-input-group"><span class="cable-input-prefix">宽</span><input v-model.number="formData.cable_trench.trough_width" type="number" class="cable-input"></div>
                                        <div class="cable-input-group"><span class="cable-input-prefix">深</span><input v-model.number="formData.cable_trench.trough_depth" type="number" class="cable-input"></div>
                                    </div>
                                </div>
                                <div class="cable-row" style="margin-bottom: 0;">
                                    <span class="cable-label">双槽最小间距</span>
                                    <div class="cable-inputs">
                                        <div class="cable-input-group">
                                            <input v-model.number="formData.cable_trench.branch_dist_min" type="number" class="cable-input">
                                            <span class="cable-input-prefix" style="margin-left:4px; margin-right:0;">m</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div class="flex justify-center mt-8">
                <button @click="generate" :disabled="isGenerating" class="btn btn-primary btn-large">
                    <i :class="isGenerating ? 'ri-loader-4-line spin' : 'ri-file-word-2-line'"></i>
                    {{ isGenerating ? '生成中...' : '生成互提资料单' }}
                </button>
            </div>
        </div>
    `
};
