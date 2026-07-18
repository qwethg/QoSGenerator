import { reactive } from 'vue';

export const store = reactive({
    isSidebarOpen: true,
    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    },
    
    // 全局通知系统
    notifications: [],
    notify(message, type = 'info', duration = 3000) {
        const id = Date.now();
        this.notifications.push({ id, message, type });
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(id);
            }, duration);
        }
    },
    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    },

    // 主题切换系统
    theme: localStorage.getItem('theme') || 'light',
    toggleTheme() {
        const nextTheme = this.theme === 'light' ? 'blueprint' : 'light';
        this.setTheme(nextTheme);
    },
    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('theme', theme);
        this.applyTheme();
    },
    applyTheme() {
        if (this.theme === 'blueprint') {
            document.documentElement.classList.add('blueprint-theme');
        } else {
            document.documentElement.classList.remove('blueprint-theme');
        }
    }
});
