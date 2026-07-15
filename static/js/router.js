import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.js';
import QoSGenerator from './views/QoSGenerator.js';
import MutualDataGenerator from './views/MutualDataGenerator.js';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
        meta: { title: '首页 - 自动化工具台' }
    },
    {
        path: '/qos',
        name: 'QoS',
        component: QoSGenerator,
        meta: { title: 'QoS 审查卡片生成器' }
    },
    {
        path: '/mutual-data',
        name: 'MutualData',
        component: MutualDataGenerator,
        meta: { title: '互提资料（有线通信）' }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    document.title = to.meta.title || '工程设计自动化工具台';
    next();
});

export default router;
