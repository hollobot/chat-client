import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";
import { api } from "./src/renderer/src/constant/api";

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()]
	},
	preload: {
		plugins: [externalizeDepsPlugin()]
	},
	renderer: {
		//..other config
		css: {
			preprocessorOptions: {
				scss: {
					silenceDeprecations: ["legacy-js-api"]
					// 可选的全局样式引入
				}
			}
		},
		resolve: {
			alias: {
				"@": resolve("src/renderer/src")
			}
		},
		server: {
			host: "0.0.0.0",
			port: api.prot,
			// 是否开启 https
			https: false,
			headers: {
				// "Content-Security-Policy": "img-src 'self' http://127.0.0.1:*  data: blob:;"
			},
			proxy: {
				"/api": {
					target: "http://localhost:80", // 目标服务器地址
					changeOrigin: true, // 改变请求的源
					rewrite: (path) => path.replace(/^\/api/, "") // 可选：重写路径
				}
			}
		},
		plugins: [vue()]
	}
});

