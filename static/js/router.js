import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.js';
import QoSGenerator from './views/QoSGenerator.js';
import MutualDataGenerator from './views/MutualDataGenerator.js';
import About from './views/About.js';

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
        meta: { title: '首页 - 铁路通信设计辅助台' }
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
        meta: { title: '互提资料生成（有线通信）' }
    },
    {
        path: '/about',
        name: 'About',
        component: About,
        meta: { title: '关于' }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    document.title = to.meta.title || '铁路通信设计辅助台';
    next();
});

export default router;
