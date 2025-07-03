<template>
	<el-dialog
		class="scroll-content"
		:title="dialogTitle"
		v-model="dialogVisible"
		width="600px"
		:close-on-click-modal="false"
		@close="handleClose"
	>
		<el-form
			label-position="left"
			ref="formRef"
			:model="formData"
			:rules="rules"
			label-width="80px"
			:disabled="mode === 'view'"
		>
			<el-form-item label="版本号" prop="versionCode">
				<el-input v-model="formData.versionCode" placeholder="0.0.0" />
			</el-form-item>

			<el-form-item label="更新描述" prop="updateDescription">
				<el-input
					v-model="formData.updateDescription"
					type="textarea"
					:rows="4"
					placeholder="请输入更新描述"
				/>
			</el-form-item>

			<el-form-item label="文件类型" required prop="fileType">
				<el-radio-group v-model="formData.fileType">
					<el-radio :label="0">本地文件</el-radio>
					<el-radio :label="1">外链</el-radio>
				</el-radio-group>
			</el-form-item>

			<el-form-item v-if="formData.fileType === 1" label="外链地址" prop="externalUrl">
				<el-input
					v-model="formData.externalUrl"
					maxlength="500"
					placeholder="请输入外链地址"
				/>
			</el-form-item>

			<el-form-item v-if="formData.fileType === 0" label="本地文件" prop="localFile">
				<el-upload
					class="upload-demo"
					:auto-upload="false"
					:limit="1"
					:on-change="handleFileChange"
					:on-remove="handleFileRemove"
				>
					<template #trigger>
						<el-button type="primary">选择文件</el-button>
					</template>
					<template #tip>
						<div class="el-upload__tip">仅支持 .exe 文件</div>
					</template>
				</el-upload>
			</el-form-item>

			<el-form-item v-if="mode !== 'add'" label="发布类型" prop="status">
				<el-radio-group v-model="formData.status">
					<el-radio v-if="mode !== 'edit'" :label="0">未发布</el-radio>
					<el-radio :label="1">灰度发布</el-radio>
					<el-radio :label="2">全网发布</el-radio>
				</el-radio-group>
			</el-form-item>

			<el-form-item
				class="el-tag-items"
				v-if="formData.status === 1 && mode !== 'add'"
				label="灰度用户"
				prop="grayUidList"
			>
				<div class="flex gap-2">
					<el-tag
						v-for="uid in formData.grayUidList"
						:key="uid"
						:closable="mode !== 'view'"
						:disable-transitions="false"
						@close="handleDel(uid)"
					>
						{{ uid }}
					</el-tag>
					<el-input
						v-if="inputVisible"
						ref="InputRef"
						v-model="inputValue"
						class="w-20"
						size="small"
						@keyup.enter="handleInputConfirm"
						@blur="handleInputConfirm"
						autofocus
					/>
					<el-button v-else class="button-new-tag" size="small" @click="showInput">
						+ 添加用户ID
					</el-button>
				</div>
			</el-form-item>
		</el-form>

		<template #footer>
			<span class="dialog-footer">
				<el-button @click="handleClose">取消</el-button>
				<el-button v-if="mode !== 'view'" type="primary" @click="handleSubmit">
					确定
				</el-button>
			</span>
		</template>
	</el-dialog>
</template>

<script setup>
	import { ref, computed, watch, nextTick } from "vue";
	import { ElMessage } from "element-plus";
	import { addVersion, saveVersion } from "@/api/versionApi";

	const props = defineProps({
		visible: Boolean,
		mode: {
			type: String,
			default: "add", // add, edit, view  校验
			validator: (value) => ["add", "edit", "view"].includes(value)
		},
		data: {
			type: Object,
			default: {}
		}
	});

	const emit = defineEmits(["updateVisible", "success"]);

	// 创建一个 带 getter 和 setter 的响应式计算属性，它既可以读取值（get），也可以修改值（set）。
	const dialogVisible = computed({
		get: () => props.visible,
		set: (val) => emit("updateVisible", val)
	});

	const dialogTitle = computed(() => {
		const titles = {
			add: "新增版本",
			edit: "编辑发布版本",
			view: "查看版本"
		};
		return titles[props.mode];
	});

	const formRef = ref(null);

	const formData = ref({
		versionCode: "",
		updateDescription: "",
		fileType: 1,
		externalUrl: "",
		localFile: 0,
		status: 2, // 添加发布状态
		grayUidList: [], // 添加灰度用户列表
		grayUid: ""
	});

	const inputValue = ref("");
	const inputVisible = ref(false);
	const InputRef = ref();

	const handleDel = (uid) => {
		formData.value.grayUidList = formData.value.grayUidList.filter((item) => item !== uid);
	};

	const showInput = () => {
		inputVisible.value = true;
		nextTick(() => {
			InputRef.value.focus();
		});
	};

	const handleInputConfirm = () => {
		if (inputValue.value) {
			// 验证用户ID格式（示例：以U开头的数字）
			if (!/^U\d+$/.test(inputValue.value)) {
				ElMessage.warning("请输入正确的用户ID格式");
				return;
			}
			// 检查是否重复
			if (!formData.value.grayUidList.includes(inputValue.value)) {
				formData.value.grayUidList.push(inputValue.value);
			}
		}
		inputVisible.value = false;
		inputValue.value = "";
	};

	const rules = {
		versionCode: [
			{ required: true, message: "请输入版本号", trigger: "blur" },
			{ pattern: /^\d+\.\d+\.\d+$/, message: "版本号格式为：x.x.x", trigger: "blur" }
		],
		updateDescription: [{ required: true, message: "请输入更新描述", trigger: "blur" }],
		externalUrl: [
			{
				required: true,
				message: "请输入外链地址",
				trigger: "blur",
				when: (form) => form.fileType === 1
			},
			{
				min: 5,
				max: 500,
				message: "外链地址长度应在 5 到 500 个字符之间",
				trigger: "blur"
			}
		],
		localFile: [
			{
				required: true,
				message: "请选择文件",
				trigger: "change",
				when: (form) => form.fileType === 0
			}
		],
		status: [
			{
				required: true,
				message: "请选择发布类型",
				trigger: "change"
			}
		],
		grayUidList: [
			{
				type: "array",
				required: true,
				message: "请至少添加一个灰度用户",
				trigger: "blur",
				validator: (rule, value) => {
					if (formData.value.status === 1 && (!value || value.length === 0)) {
						return false;
					}
					return true;
				}
			}
		]
	};

	// 监听mode和data变化，初始化表单数据
	watch(
		() => ({ mode: props.mode, data: props.data }),
		({ mode, data }) => {
			if (mode !== "add" && data) {
				formData.value = {
					...data,
					grayUidList: data.grayUid ? data.grayUid.split(",") : []
				};
			} else {
				formData.value = {
					versionCode: "",
					updateDescription: "",
					fileType: 1,
					externalUrl: "",
					localFile: 0,
					status: 0, // 添加发布状态
					grayUidList: [], // 添加灰度用户列表
					grayUid: ""
				};
			}
		},
		{ immediate: true, deep: true }
	);

	// 处理文件上传
	const handleFileChange = (file) => {
		const isExe = file.raw.type === "" && file.raw.name.endsWith(".exe");
		if (!isExe) {
			ElMessage.error("只能上传 .exe 文件！");
			return false;
		}
		formData.value.localFile = file.raw;
	};

	// 清除文件
	const handleFileRemove = () => {
		formData.value.localFile = null;
	};

	// 取消文件
	const handleClose = () => {
		dialogVisible.value = false;
		if (formRef.value) {
			formRef.value.resetFields();
		}
	};

	// 提交
	const handleSubmit = async () => {
		if (!formRef.value) return;

		try {
			// 校验
			await formRef.value.validate();

			const grayUid = formData.value.grayUidList.join(",") || null;
			formData.value.grayUid = grayUid;
			let data = null;
			if (props.mode === "edit") {
				if (formData.value.status === 0) {
					ElMessage.error("请选择发布类型");
					retur;
				}
				data = await saveVersion(formData.value);
			} else if (props.mode === "add") {
				data = await addVersion(formData.value);
			}
			if (data.code === 200) {
				emit("success"); // 通过查询
				dialogVisible.value = false; //关闭弹窗
			}
		} catch (error) {
			console.error("表单验证失败:", error);
		}
	};
</script>

<style>
	#el-id-1301-34 {
		padding: 0 50px;
	}
	/* 修改弹窗内容区域的最大高度，避免内容过多时撑开 */
	.el-dialog {
		max-height: 77vh !important;
		overflow-y: auto;
	}
</style>
<style lang="scss" scoped>
	.flex.gap-2 {
		display: flex;
		align-items: center;
		flex-wrap: wrap; // 添加自动换行
		gap: 5px;
		border-radius: 4px;

		.el-tag {
			margin: 0;
			height: 24px;
			line-height: 24px;
			max-width: 100%; // 防止标签过长

			&:hover {
				background-color: #f5f7fa;
			}
		}

		.el-input {
			width: 120px;
			margin: 2px 0;
		}

		.button-new-tag {
			height: 24px;
			padding: 0 8px;
			margin: 2px 0;
		}
	}
</style>
