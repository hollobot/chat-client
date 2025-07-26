import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";
import { api } from "./src/renderer/src/constant/api";

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()]
		//选项来分别指定主进程、渲染器和预加载脚本的输出目录
		// build: {
		// 	outDir: "dist/main"
		// }
	},
	preload: {
		plugins: [externalizeDepsPlugin()]
		// build: {
		// 	outDir: "dist/preload"
		// }
	},
	renderer: {
		// build: {
		// 	outDir: "dist/renderer"
		// },
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
			proxy: {
				"/api": {
					target: api.devDomain, // 目标服务器地址
					changeOrigin: true, // 改变请求的源
					rewrite: (path) => path.replace(/^\/api/, "") // 可选：重写路径
				}
			}
		},
		plugins: [vue()]
	}
});


