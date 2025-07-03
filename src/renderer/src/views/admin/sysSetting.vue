<template>
	<FrameLayout :is-show-search="false">
		<template #list>
			<el-form
				ref="formRef"
				:model="formData"
				:rules="rules"
				label-width="120px"
				class="setting-form"
				label-position="left"
			>
				<!-- 群组设置 -->
				<el-card class="setting-card">
					<template #header>
						<div class="card-header">
							<el-icon><User /></el-icon>
							<span>群组设置</span>
						</div>
					</template>

					<el-form-item label="最大群组数量" prop="maxGroupCount">
						<el-input-number
							v-model="formData.maxGroupCount"
							:min="1"
							:max="100"
							controls-position="right"
						/>
					</el-form-item>

					<el-form-item label="群聊最大人数" prop="maxGroupMemberCount">
						<el-input-number
							v-model="formData.maxGroupMemberCount"
							:min="2"
							:max="500"
							controls-position="right"
						/>
					</el-form-item>
				</el-card>

				<!-- 文件设置 -->
				<el-card class="setting-card">
					<template #header>
						<div class="card-header">
							<el-icon><Document /></el-icon>
							<span>文件设置</span>
						</div>
					</template>

					<el-form-item label="图片大小限制" prop="maxImageSize">
						<el-input-number
							v-model="formData.maxImageSize"
							:min="1"
							:max="100"
							controls-position="right"
						>
							<template #suffix>MB</template>
						</el-input-number>
					</el-form-item>

					<el-form-item label="视频大小限制" prop="maxVideoSize">
						<el-input-number
							v-model="formData.maxVideoSize"
							:min="1"
							:max="500"
							controls-position="right"
						>
							<template #suffix>MB</template>
						</el-input-number>
					</el-form-item>

					<el-form-item label="文件大小限制" prop="maxFileSize">
						<el-input-number
							v-model="formData.maxFileSize"
							:min="1"
							:max="500"
							controls-position="right"
						>
							<template #suffix>MB</template>
						</el-input-number>
					</el-form-item>
				</el-card>

				<!-- 机器人设置 -->
				<el-card class="setting-card">
					<template #header>
						<div class="card-header">
							<el-icon><Monitor /></el-icon>
							<span>机器人设置</span>
						</div>
					</template>

					<el-form-item label="机器人UUID" prop="robotUid" style="opacity: 0.6" required>
						<el-input v-model="formData.robotUid" disabled />
					</el-form-item>

					<el-form-item label="机器人昵称" prop="robotNickName">
						<el-input v-model="formData.robotNickName" />
					</el-form-item>

					<el-form-item label="机器人性别" prop="robotSex">
						<el-radio-group v-model="formData.robotSex">
							<el-radio :label="1">男</el-radio>
							<el-radio :label="0">女</el-radio>
						</el-radio-group>
					</el-form-item>

					<el-form-item label="所在地区" prop="robotAreaNameArray">
						<el-cascader
							v-model="formData.robotAreaNameArray"
							:options="areas"
							placeholder="请选择地区"
							filterable
						/>
					</el-form-item>

					<el-form-item label="个性签名" prop="robotPersonalSignature">
						<el-input v-model="formData.robotPersonalSignature" />
					</el-form-item>

					<el-form-item label="欢迎语" prop="robotWelcome">
						<el-input v-model="formData.robotWelcome" type="textarea" :rows="2" />
					</el-form-item>

					<el-form-item label="默认回复" prop="robotDefaultMessage">
						<el-input
							v-model="formData.robotDefaultMessage"
							type="textarea"
							:rows="2"
						/>
					</el-form-item>
				</el-card>

				<div class="form-footer">
					<el-button type="primary" @click="handleSubmit">保存设置</el-button>
					<el-button @click="resetForm">重置</el-button>
				</div>
			</el-form>
		</template>
	</FrameLayout>
</template>

<script setup>
	import { ref, onMounted } from "vue";
	import { ElMessage, ElMessageBox } from "element-plus";
	import { User, Document, Monitor } from "@element-plus/icons-vue";
	import FrameLayout from "./frameLayout .vue";
	import { areas } from "@/assets/data/areas";
	import { allSetting, saveStting } from "@/api/adminApi";

	const formRef = ref(null);

	const formData = ref({});

	const rules = {
		maxGroupCount: [
			{ required: true, message: "请输入最大群组数量", trigger: "blur" },
			{ type: "number", min: 1, message: "必须大于0", trigger: "blur" }
		],
		maxGroupMemberCount: [{ required: true, message: "请输入群聊最大人数", trigger: "blur" }],
		maxImageSize: [{ required: true, message: "请输入图片大小限制", trigger: "blur" }],
		maxVideoSize: [{ required: true, message: "请输入视频大小限制", trigger: "blur" }],
		maxFileSize: [{ required: true, message: "请输入文件大小限制", trigger: "blur" }],
		robotNickName: [{ required: true, message: "请输入机器人昵称", trigger: "blur" }],
		robotSex: [{ required: true, message: "请选择机器人性别", trigger: "blur" }],
		robotAreaNameArray: [{ required: true, message: "请选择地区", trigger: "blur" }],
		robotPersonalSignature: [{ required: true, message: "请输入个性签名", trigger: "blur" }],
		robotWelcome: [{ required: true, message: "请输入机器人欢迎语", trigger: "blur" }],
		robotDefaultMessage: [{ required: true, message: "请输入机器人默认回复", trigger: "blur" }]
	};

	/* 系统设置 */
	const handleSubmit = () => {
		ElMessageBox.confirm(`确定要修改系统配置吗？`, {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			type: "warning"
		}).then(async () => {
			if (checkFormData()) return;
			const resp = await saveStting(formData.value);
			if (resp.code === 200) {
				selectSetting();
			}
		});
	};

	/* 重置表单 */
	const resetForm = () => {
		ElMessageBox.confirm(`确定重置修改的设置？`, {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			type: "warning"
		}).then(async () => {
			const data = await selectSetting();
			if (data.code === 200) {
				ElMessage.success("已重置");
			} else {
				ElMessage.error("重置设置失败");
			}
		});
	};

	/* 获取系统设置参数 */
	const selectSetting = async () => {
		const resp = await allSetting();
		resp.data.robotAreaNameArray = resp.data.robotAreaName.split(" ");
		formData.value = resp.data;
		return resp;
	};

	// 页面加载时获取系统设置
	onMounted(() => {
		selectSetting();
	});

	// 表单数据校验方法
	const checkFormData = () => {
		const {
			maxGroupCount,
			maxGroupMemberCount,
			maxImageSize,
			maxVideoSize,
			maxFileSize,
			robotUid,
			robotNickName,
			robotSex,
			robotAreaNameArray,
			robotPersonalSignature,
			robotWelcome,
			robotDefaultMessage
		} = formData.value;

		// 检查数字类型的值
		if (!maxGroupCount || maxGroupCount <= 0) {
			ElMessage.warning("请设置有效的最大群组数量");
			return true;
		}

		if (!maxGroupMemberCount || maxGroupMemberCount <= 1) {
			ElMessage.warning("请设置有效的群聊最大人数");
			return true;
		}

		if (!maxImageSize || maxImageSize <= 0) {
			ElMessage.warning("请设置有效的图片大小限制");
			return true;
		}

		if (!maxVideoSize || maxVideoSize <= 0) {
			ElMessage.warning("请设置有效的视频大小限制");
			return true;
		}

		if (!maxFileSize || maxFileSize <= 0) {
			ElMessage.warning("请设置有效的文件大小限制");
			return true;
		}

		// 检查字符串类型的值
		if (!robotUid || robotUid.trim() === "") {
			ElMessage.warning("请输入机器人UUID");
			return true;
		}

		if (!robotNickName || robotNickName.trim() === "") {
			ElMessage.warning("请输入机器人昵称");
			return true;
		}

		// 检查性别值
		if (![0, 1].includes(robotSex)) {
			ElMessage.warning("请选择机器人性别");
			return true;
		}

		// 检查地区数组
		if (
			!robotAreaNameArray ||
			!Array.isArray(robotAreaNameArray) ||
			robotAreaNameArray.length === 0
		) {
			ElMessage.warning("请选择所在地区");
			return true;
		}

		if (!robotPersonalSignature || robotPersonalSignature.trim() === "") {
			ElMessage.warning("请输入个性签名");
			return true;
		}

		if (!robotWelcome || robotWelcome.trim() === "") {
			ElMessage.warning("请输入欢迎语");
			return true;
		}

		if (!robotDefaultMessage || robotDefaultMessage.trim() === "") {
			ElMessage.warning("请输入默认回复");
			return true;
		}
		formData.value.robotAreaName = robotAreaNameArray.join(" ");
		// 所有检查都通过
		return false;
	};
</script>

<style lang="scss" scoped>
	.setting-form {
		padding: 20px;

		.setting-card {
			margin-bottom: 20px;

			.card-header {
				display: flex;
				align-items: center;

				.el-icon {
					margin-right: 8px;
					font-size: 18px;
				}

				span {
					font-size: 16px;
					font-weight: bold;
				}
			}

			:deep(.el-form-item:last-child) {
				margin-bottom: 0;
			}
		}

		.form-footer {
			display: flex;
			justify-content: center;
			gap: 20px;
		}
	}
</style>
