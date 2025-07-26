<template>
	<div class="file-setting" v-loading.fullscreen.lock="loading">
		<div class="setting-item">
			<div class="setting-label">文件管理</div>
			<div class="setting-content">
				<el-input
					v-model="filePath"
					disabled
					placeholder="请选择文件保存路径"
					readonly
				></el-input>
				<div class="path-desc">文件的默认保存位置</div>
				<div class="btn-group">
					<el-button @click="changePath">更改</el-button>
					<el-button @click="openFolder">打开文件夹</el-button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted } from "vue";
	import { ElMessage, ElLoading } from "element-plus";

	const loading = ref(null);

	// 文件路径
	const filePath = ref("");

	const onGetDatabaseFolderPathCallback = () => {
		window.ipcRenderer.on("getDatabaseFolderPathCallback", (e, folderPath) => {
			filePath.value = folderPath;
		});
	};

	const onMvFilesCallback = () => {
		window.ipcRenderer.once("mvFilesCallback", (e, { code, selectedPath }) => {
			// 关闭遮罩
			loading.value?.close();
			switch (code) {
				case 1:
					ElMessage.success("文件保存路径已更新");
					filePath.value = selectedPath;
					break;
				case 2:
					ElMessage.error("文件位置设置失败");
					break;
				case 3:
					ElMessage.warning("目标路径不能是源路径的子目录");
					break;
			}
		});
	};

	const remover = () => {
		window.ipcRenderer.removeAllListeners("getDatabaseFolderPathCallback");
	};

	// 更改文件路径
	const changePath = () => {
		// 调用主进程的对话框选择文件夹
		window.ipcRenderer.send("selectFolder");
		// 监听选择结果
		window.ipcRenderer.once("selectFolderCallback", async (e, result) => {
			if (!result.canceled && result.filePaths.length > 0) {
				const selectedPath = result.filePaths[0];
				// 开启遮罩
				loading.value = ElLoading.service({
					lock: true,
					text: "正在移动文件，请稍候...",
					background: "rgba(0, 0, 0, 0.5)"
				});
				// 保存文件路径，移动文件资源
				window.ipcRenderer.send("mvFiles", selectedPath);
				onMvFilesCallback();
			}
		});
	};

	// 打开文件夹
	const openFolder = () => {
		if (!filePath.value) {
			ElMessage.warning("请先设置文件保存路径");
			return;
		}
		// 调用主进程打开文件夹
		window.ipcRenderer.send("openFolder", filePath.value);
	};

	// 组件挂载时获取保存的文件路径
	onMounted(() => {
		// 销毁该组件的监听事件，防止重复监听
		remover();
		// 监听获取文件路径
		onGetDatabaseFolderPathCallback();
		// 从主进程获取保存的文件路径
		window.ipcRenderer.send("getDatabaseFolderPath");
	});
</script>

<style lang="scss" scoped>
	.file-setting {
		padding: 20px;

		.setting-item {
			margin-bottom: 20px;
		}

		.setting-label {
			font-size: 16px;
			font-weight: bold;
			margin-bottom: 15px;
		}

		.setting-content {
			.el-input {
				width: 100%;
				max-width: 500px;
			}

			.path-desc {
				color: #999;
				font-size: 12px;
				margin: 5px 0 15px 0;
			}

			.btn-group {
				display: flex;
				gap: 10px;
			}
		}
	}
</style>
