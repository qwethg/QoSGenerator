import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { store } from '../store.js';

export default {
    setup() {
        const route = useRoute();
        
        const menuItems = [
            { name: '首页', path: '/', icon: 'ri-home-5-line' },
            { name: 'QoS卡片生成', path: '/qos', icon: 'ri-file-word-2-line' },
            { name: '互提资料生成', path: '/mutual-data', icon: 'ri-file-transfer-line' }
        ];

        return { store, route, menuItems };
    },
    template: `
        <div class="app-layout">
            <!-- Sidebar -->
            <aside class="sidebar" :class="{ 'sidebar-open': store.isSidebarOpen }">
                <div class="sidebar-header">
                    <div class="logo">
                        <i class="ri-box-3-fill"></i>
                        <span v-if="store.isSidebarOpen">工程设计工具台</span>
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
                    <button class="toggle-btn" @click="store.toggleSidebar()">
                        <i :class="store.isSidebarOpen ? 'ri-arrow-left-s-line' : 'ri-arrow-right-s-line'"></i>
                    </button>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="main-content" :class="{ 'content-expanded': !store.isSidebarOpen }">
                <!-- Top Navbar -->
                <header class="navbar">
                    <div class="navbar-left">
                        <h2 class="h2">{{ route.meta.title || '工具台' }}</h2>
                    </div>
                    <div class="navbar-right">
                        <div class="user-profile">
                            <div class="avatar"><i class="ri-user-smile-line"></i></div>
                            <span class="user-name">设计师</span>
                        </div>
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
