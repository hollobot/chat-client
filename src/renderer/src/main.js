import { createApp } from "vue";
import App from "./App.vue";
import router from "@/router";
const app = createApp(App);
import ElementPlus from "element-plus";
import { createPinia } from "pinia";
const pinia = createPinia();

import "element-plus/dist/index.css";
import "@/assets/element-plus/index.scss";
// import "@/assets/icon/iconfont.css";
import "@/assets/css/index.scss";
// import "element-plus/theme-chalk/dark/css-vars.css";

app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.mount("#app");

