import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { store } from '../store.js';

export default {
    setup() {
        const route = useRoute();
        
        const menuItems = [
            { name: '控制台首页', path: '/', icon: 'ri-dashboard-line' },
            { name: 'QoS 卡片生成', path: '/qos', icon: 'ri-file-word-2-line' },
            { name: '互提资料生成', path: '/mutual-data', icon: 'ri-file-transfer-line' },
            { name: '关于与路线图', path: '/about', icon: 'ri-information-line' }
        ];

        return { store, route, menuItems };
    },
    template: `
        <div class="app-layout">
            <!-- Sidebar -->
            <aside class="sidebar" :class="{ 'sidebar-open': store.isSidebarOpen }">
                <div class="sidebar-header">
                    <div class="logo">
                        <i class="ri-pulse-fill text-moss"></i>
                        <span v-if="store.isSidebarOpen" class="font-bold tracking-tight">铁路通信辅助设计</span>
                    </div>
                </div>
                <nav class="sidebar-nav">
                    <router-link 
                        v-for="item in menuItems" 
                        :key="item.path" 
                        :to="item.path"
                        class="nav-item"
                        :class="{ 'active': route.path === item.path }"
                        :title="!store.isSidebarOpen ? item.name : ''"
                    >
                        <i :class="item.icon"></i>
                        <span v-if="store.isSidebarOpen">{{ item.name }}</span>
                    </router-link>
                </nav>
                <div class="sidebar-footer">
                    <button class="toggle-btn" @click="store.toggleSidebar()" :title="store.isSidebarOpen ? '收起侧边栏' : '展开侧边栏'">
                        <i :class="store.isSidebarOpen ? 'ri-indent-decrease' : 'ri-indent-increase'"></i>
                    </button>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="main-content" :class="{ 'content-expanded': !store.isSidebarOpen }">
                <!-- Top Navbar -->
                <header class="navbar">
                    <div class="navbar-left flex items-center gap-3">
                        <div class="flex items-center gap-2">
                            <span class="inline-block w-2 h-2 rounded-full bg-moss animate-pulse"></span>
                            <h2 class="h2 text-primary font-semibold tracking-tight">{{ route.meta.title || '工具台' }}</h2>
                        </div>
                    </div>
                    <div class="navbar-right flex items-center gap-3">
                        <button class="theme-toggle-btn" @click="store.toggleTheme()" :title="store.theme === 'blueprint' ? '切换为工程日间模式' : '切换为蓝图夜晚模式'">
                            <i :class="store.theme === 'blueprint' ? 'ri-sun-line text-amber-500' : 'ri-moon-clear-line text-cyan-400'"></i>
                            <span>{{ store.theme === 'blueprint' ? '日间' : '夜晚' }}</span>
                        </button>
                    </div>
                </header>

                <!-- Page Content Area -->
                <div class="page-container">
                    <slot></slot>
                </div>
            </main>
        </div>
    `
};

