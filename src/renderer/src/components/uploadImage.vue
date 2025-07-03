<template>
	<!-- 上传组件 -->
	<!-- accept 点击上传文件，会自定选择需要那些类型文件 -->
	<el-upload
		action="#"
		:show-file-list="false"
		:auto-upload="false"
		:on-change="handleFileChange"
		accept=".jpg,.png"
		:style="{ width: avatarWidth, height: avatarWidth }"
	>
		<!-- 头像展示 -->
		<el-image
			v-if="avatarValue"
			:style="{ width: avatarWidth, height: avatarWidth }"
			:src="avatarUrl"
		/>

		<div
			v-else
			class="iconfont icon-faqiqunliao avatar-uploader-icon"
			:style="{
				width: avatarWidth,
				height: avatarWidth,
				lineHeight: avatarWidth
			}"
		></div>
	</el-upload>
</template>

<script setup>
	import { nextTick, ref } from "vue";
	import { ElMessage } from "element-plus";

	// 头像的 URL
	const avatarUrl = ref(null);

	const emits = defineEmits(["upload-file"]);

	const props = defineProps({
		avatarWidth: {
			type: String,
			default: "60px"
		},
		avatarValue: {
			type: String,
			default: null
		}
	});

	const avatarValue = ref(props.avatarValue);

	/**
	 * 文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用
	 * @param file 上传的文件
	 */
	const handleFileChange = (file) => {
		// 1、判断格式是否正确
		const allowedTypes = ["image/jpg", "image/jpeg", "image/png"];
		const isAllowedType = allowedTypes.includes(file.raw.type);
		const isWithinSize = file.raw.size / 1024 / 1024 < 5; // 限制 5MB

		if (!isAllowedType) {
			ElMessage.error("仅支持 JPG 和 PNG 格式的图片！");
			return;
		}
		if (!isWithinSize) {
			ElMessage.error("图片大小不能超过 5MB");
			return;
		}

		// 2、生成文件的临时 URL 用于预览
		const reader = new FileReader();
		reader.onload = (e) => {
			avatarUrl.value = e.target.result;
		};
		reader.readAsDataURL(file.raw);

		// 3、发送自定义事件，传输头像文件
		emits("upload-file", file.raw);
		//  4、保存文件数据
		avatarValue.value = file.raw;
	};

	const reset = () => {
		avatarUrl.value = null;
	};

	const isEmptyAvatar = () => {
		return Boolean(avatarUrl.value);
	};

	const getAvatarUrl = () => {
		return avatarValue.value;
	};

	// 暴露 reset 方法
	defineExpose({
		reset,
		isEmptyAvatar,
		getAvatarUrl
	});

	nextTick(() => {
		avatarUrl.value = props.avatarValue;
	});
</script>

<style lang="scss" scoped>
	.avatar {
		object-fit: cover; //图片覆盖整个区域
		cursor: pointer; //鼠标指针变为手型
	}
	.avatar-uploader-icon {
		font-size: 24px;
		color: #8c939d;
		text-align: center;
		border: 1px dashed #d9d9d9;
		cursor: pointer; //鼠标指针变为手型
	}
</style>
