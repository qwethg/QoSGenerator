import Layout from './components/Layout.js';
import { store } from './store.js';

export default {
    components: {
        Layout
    },
    setup() {
        store.applyTheme();
        return { store };
    },
    template: `
        <Layout>
            <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                    <component :is="Component" />
                </transition>
            </router-view>
            
            <!-- Global Notifications -->
            <div class="notifications-container">
                <transition-group name="fade">
                    <div 
                        v-for="notification in store.notifications" 
                        :key="notification.id"
                        class="notification"
                        :class="['notify-' + notification.type]"
                    >
                        <i v-if="notification.type === 'success'" class="ri-checkbox-circle-fill"></i>
                        <i v-else-if="notification.type === 'error'" class="ri-error-warning-fill"></i>
                        <i v-else class="ri-information-fill"></i>
                        <span>{{ notification.message }}</span>
                    </div>
                </transition-group>
            </div>
        </Layout>
    `
};
