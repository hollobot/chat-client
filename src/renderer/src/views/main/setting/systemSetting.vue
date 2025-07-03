<template>
	<div class="system-setting">
		<el-card class="setting-card">
			<template #header>
				<div class="card-header">
					<el-icon><Refresh /></el-icon>
					<span>版本更新</span>
				</div>
			</template>

			<div class="version-info">
				<div class="current-version">
					<span class="label">当前版本：</span>
					<el-tag size="small">v{{ currentVersion }}</el-tag>
				</div>

				<div class="check-update">
					<el-button type="primary" :loading="checking" @click="checkUpdate">
						检查更新
					</el-button>
					<span class="last-check" v-if="lastCheckTime">
						上次检查：{{ lastCheckTime }}
					</span>
				</div>

				<!-- 有新版本时显示 -->
				<div v-if="hasNewVersion" class="update-info">
					<el-alert type="success" :closable="false" show-icon>
						<div class="new-version-info">
							<p>发现新版本：v{{ latestVersion.versionCode }}</p>
							<div class="update-description">
								<p class="title">更新内容：</p>
								<div class="content">{{ latestVersion.updateDescription }}</div>
							</div>
							<div class="actions">
								<el-button type="primary" :loading="updating" @click="handleUpdate">
									立即更新
								</el-button>
								<el-button @click="handleIgnore">暂不更新</el-button>
							</div>
						</div>
					</el-alert>
				</div>
			</div>
		</el-card>
	</div>
</template>

<script setup>
	import { ref, onMounted } from "vue";
	import { storeToRefs } from "pinia";
	import { ElMessage } from "element-plus";
	import { Refresh } from "@element-plus/icons-vue";
	import { latest } from "@/api/versionApi";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	const { userInfo } = storeToRefs(userInfoStore);

	const latestVersion = ref(null);

	const currentVersion = ref("");
	// 防止重复点击检测
	const checking = ref(false);
	// 防止重复点击跟新
	const updating = ref(false);
	// 检测跟新时间
	const lastCheckTime = ref("");
	// 显示最新版本信息
	const hasNewVersion = ref(false);

	// 检查更新
	const checkUpdate = async () => {
		if (checking.value) return;
		checking.value = true;
		try {
			// TODO: 调用检查更新接口
			const data = await latest(userInfo.value.userId, currentVersion.value);

			// 模拟发现新版本
			if (data.data) {
				latestVersion.value = data.data;
				// 等待一秒
				await new Promise((resolve) => setTimeout(resolve, 1000));
				hasNewVersion.value = true;
				lastCheckTime.value = new Date().toLocaleString();
				ElMessage.success("发现新版本");
			} else {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				ElMessage.success("已是最新版本");
			}
		} catch (error) {
			ElMessage.error("检查更新失败");
		} finally {
			checking.value = false;
		}
	};

	// 执行更新
	const handleUpdate = async () => {
		if (updating.value) return;
		updating.value = true;
		try {
			ElMessage.success("即将跳转");
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toUrl(latestVersion.value.externalUrl);
		} catch (error) {
			ElMessage.error("更新失败");
		} finally {
			updating.value = false;
		}
	};

	// 忽略更新
	const handleIgnore = () => {
		hasNewVersion.value = false;
	};

	// 获取版本
	const getAppVersion = async () => {
		try {
			const version = await ipcRenderer.invoke("getAppVersion");
			currentVersion.value = version;
		} catch (error) {
			console.error("Failed to get version:", error);
		}
	};

	// 跳转外链
	const toUrl = async (url) => {
		const data = await window.ipcRenderer.invoke("openUpdateUrl", url);
	};

	// 组件挂载时检查更新
	onMounted(() => {
		getAppVersion();
	});
</script>

<style lang="scss" scoped>
	.system-setting {
		padding: 20px;

		.setting-card {
			.card-header {
				display: flex;
				align-items: center;
				gap: 8px;
				font-size: 16px;
				font-weight: 500;

				.el-icon {
					font-size: 18px;
				}
			}
		}

		.version-info {
			.current-version {
				margin-bottom: 16px;
				display: flex;
				align-items: center;
				gap: 8px;

				.label {
					color: #606266;
				}
			}

			.check-update {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 20px;

				.last-check {
					color: #909399;
					font-size: 13px;
				}
			}

			.update-info {
				margin: 20px 0;

				.new-version-info {
					.update-description {
						margin: 12px 0;

						.title {
							font-weight: 500;
							margin-bottom: 8px;
						}

						.content {
							white-space: pre-line;
							color: #606266;
							background: #f5f7fa;
							padding: 12px;
							border-radius: 4px;
							font-size: 13px;
						}
					}

					.actions {
						margin-top: 16px;
						display: flex;
						gap: 12px;
					}
				}
			}

			.update-settings {
				margin-top: 30px;

				:deep(.el-divider__text) {
					font-size: 14px;
					font-weight: 500;
				}

				.el-form {
					max-width: 400px;
					margin-top: 20px;
				}
			}
		}
	}
</style>
