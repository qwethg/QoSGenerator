import { ref, computed, watch } from 'vue';
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

// 站前三张表块的列配置
const STATION_FRONT_TABLE_CONFIGS = [
    {
        key: 'interval_branch_downlead',
        title: '区间分支引下槽里程表',
        hint: '导入后将显示该表及其配套说明文字',
        columns: [
            { key: 'mileage', label: '里程', required: true },
            { key: 'remark', label: '备注', required: false }
        ]
    },
    {
        key: 'bridge_reserved_downlead',
        title: '桥上预留引下位置表',
        hint: '导入后将显示该表及其配套说明文字',
        columns: [
            { key: 'bridge_name', label: '桥梁', required: true },
            { key: 'reserved_count', label: '桥梁引下预留处数', required: true },
            { key: 'remark', label: '备注', required: false }
        ]
    },
    {
        key: 'cable_crossing_mileage',
        title: '有线通信过轨里程表',
        hint: '导入后将显示该表及其配套说明文字',
        columns: [
            { key: 'mileage', label: '里程', required: true },
            { key: 'remark', label: '备注', required: false },
            { key: 'count', label: '根数', required: true }
        ]
    }
];

// 创建空的导入表块状态
function createEmptyImportedTable() {
    return {
        enabled: false,
        file_name: '',
        row_count: 0,
        rows: []
    };
}

// 创建三张表块的默认状态
function createDefaultImportedTables() {
    const result = {};
    for (const config of STATION_FRONT_TABLE_CONFIGS) {
        result[config.key] = createEmptyImportedTable();
    }
    return result;
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
            },

            // 站前基础信息
            station_front: {
                has_qlsstdsp: false,
                imported_tables: createDefaultImportedTables()
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

        // 站前基础信息卡片显示条件：勾选了路基/站场/桥梁/隧道任意一个
        const showStationFrontCard = computed(() => (
            formData.value.has_luji ||
            formData.value.has_zhanchang ||
            formData.value.has_qiaoliang ||
            formData.value.has_suidao
        ));

        // 取消桥梁专业时，自动清空桥梁疏散通道视频选项
        watch(
            () => formData.value.has_qiaoliang,
            (enabled) => {
                if (!enabled) {
                    formData.value.station_front.has_qlsstdsp = false;
                }
            }
        );

        // 生成模板的数据行（空行）
        function buildTemplateRows(columns) {
            return [
                columns.reduce((row, column) => {
                    row[column.label] = '';
                    return row;
                }, {})
            ];
        }

        // 下载 Excel 模板
        function downloadTableTemplate(config) {
            const worksheet = XLSX.utils.json_to_sheet(buildTemplateRows(config.columns));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            XLSX.writeFile(workbook, `${config.title}.xlsx`);
        }

        // 导入 Excel 文件并解析为结构化数据
        async function importTableFile(config, event) {
            const file = event.target.files?.[0];
            if (!file) return;

            try {
                const workbook = XLSX.read(await file.arrayBuffer());
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                // 空数据行检查（只有表头无数据行时给出明确提示）
                if (rawRows.length === 0) {
                    throw new Error(`${config.title}：至少需要 1 行有效数据`);
                }

                // 校验列头是否匹配
                const expectedHeaders = config.columns.map(column => column.label);
                const actualHeaders = Object.keys(rawRows[0]);
                if (expectedHeaders.join('|') !== actualHeaders.join('|')) {
                    throw new Error(`${config.title}：列头不匹配，请使用下载模板`);
                }

                // 转换并过滤空行
                const rows = rawRows
                    .map(rawRow => config.columns.reduce((normalized, column) => {
                        normalized[column.key] = String(rawRow[column.label] ?? '').trim();
                        return normalized;
                    }, {}))
                    .filter(row => Object.values(row).some(Boolean));

                // 校验必填列
                for (const column of config.columns.filter(column => column.required)) {
                    if (rows.some(row => !row[column.key])) {
                        throw new Error(`${config.title}：${column.label}不能为空`);
                    }
                }
                if (!rows.length) {
                    throw new Error(`${config.title}：至少需要 1 行有效数据`);
                }

                // 写入 formData
                formData.value.station_front.imported_tables[config.key] = {
                    enabled: true,
                    file_name: file.name,
                    row_count: rows.length,
                    rows
                };
                store.notify(`${config.title}：已导入 ${rows.length} 行数据`, 'success');
            } catch (error) {
                store.notify(error.message, 'error');
            } finally {
                // 清空 input 的 value，允许重新导入同一文件
                event.target.value = '';
            }
        }

        // 清空已导入的表块
        function clearImportedTable(tableKey) {
            formData.value.station_front.imported_tables[tableKey] = createEmptyImportedTable();
            store.notify('已清空导入数据', 'info');
        }

        return {
            formData,
            isGenerating,
            generate,
            DEFAULT_ROOM_TYPES,
            STATION_FRONT_TABLE_CONFIGS,
            showStationFrontCard,
            downloadTableTemplate,
            importTableFile,
            clearImportedTable
        };
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

            <!-- 站前基础信息 -->
            <div v-if="showStationFrontCard" class="card mb-6 border-left-caramel">
                <div class="card-header">
                    <h3 class="h3 flex items-center gap-2">
                        <i class="ri-road-map-line text-caramel"></i> 站前基础信息
                    </h3>
                </div>
                <div class="card-body">
                    <p class="text-sm text-gray-500 mb-4" style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);">
                        根据已勾选的站前专业补充互提资料条目，未勾选的项目不会输出到文档。
                    </p>
                    <div v-if="formData.has_qiaoliang" class="grid grid-cols-2 gap-3">
                        <label class="profession-checkbox" :class="{ 'active': formData.station_front.has_qlsstdsp }">
                            <input v-model="formData.station_front.has_qlsstdsp" type="checkbox">
                            <span>有桥梁疏散通道视频</span>
                        </label>
                    </div>
                    <!-- 站前三张表块导入 -->
                    <div class="grid grid-cols-1 gap-4 mt-4">
                        <div
                            v-for="config in STATION_FRONT_TABLE_CONFIGS"
                            :key="config.key"
                            class="import-card"
                            :class="{ 'import-card-active': formData.station_front.imported_tables[config.key].enabled }"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="h4">{{ config.title }}</h4>
                                <span class="import-status" :class="formData.station_front.imported_tables[config.key].enabled ? 'import-status-active' : ''">
                                    {{ formData.station_front.imported_tables[config.key].enabled
                                        ? '已导入 · ' + formData.station_front.imported_tables[config.key].row_count + ' 行'
                                        : '未导入' }}
                                </span>
                            </div>
                            <p class="text-sm mb-2" style="color: var(--text-secondary); font-size: 0.8125rem;">{{ config.hint }}</p>
                            <p v-if="formData.station_front.imported_tables[config.key].file_name" class="text-sm mb-2" style="color: var(--text-tertiary); font-size: 0.8125rem;">
                                <i class="ri-file-excel-line"></i> {{ formData.station_front.imported_tables[config.key].file_name }}
                            </p>
                            <div class="flex gap-2">
                                <button type="button" class="btn-secondary btn-sm" @click="downloadTableTemplate(config)">
                                    <i class="ri-download-line"></i> 下载模板
                                </button>
                                <label class="btn-secondary btn-sm">
                                    <i class="ri-upload-line"></i> 导入/替换
                                    <input type="file" accept=".xlsx" hidden @change="(event) => importTableFile(config, event)">
                                </label>
                                <button type="button" class="btn-secondary btn-sm" @click="clearImportedTable(config.key)" :disabled="!formData.station_front.imported_tables[config.key].enabled">
                                    <i class="ri-delete-bin-line"></i> 清空
                                </button>
                            </div>
                        </div>
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
