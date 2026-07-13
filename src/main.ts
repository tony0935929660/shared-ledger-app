import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'
import App from './App.vue'
import { vuetify } from './app/plugins/vuetify'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(vuetify)
app.use(router)

async function bootstrapApp(): Promise<void> {
	const authStore = useAuthStore(pinia)
	await authStore.initialize()
	app.mount('#app')
}

void bootstrapApp()
