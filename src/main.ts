import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from './store'
import './style.css'
import 'virtual:uno.css'

const app = createApp(App)

app.use(pinia).mount('#app')
