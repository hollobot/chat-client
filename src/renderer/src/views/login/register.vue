<template>
	<div class="root">
		<div class="custom-titlebar">SwiftChat</div>
		<div class="content">
			<div class="avatar">
				<el-avatar shape="square" :size="70" :src="avatarPath" />
			</div>
			<el-form
				:rules="rules"
				:ref="formRef"
				class="el-from"
				:model="userInfoForm"
				status-icon
				:show-message="false"
				@validate="handleValidate"
			>
				<el-form-item class="el-form-item" prop="email">
					<el-input
						v-model="userInfoForm.email"
						class="el-input"
						placeholder="请输入邮箱"
						@focus="selected"
					>
						<template #prefix>
							<span class="iconfont icon-email"></span>
						</template>
					</el-input>
				</el-form-item>

				<el-form-item prop="password">
					<el-input
						v-model="userInfoForm.password"
						type="password"
						placeholder="请输入密码"
						@focus="selected"
						show-password
					>
						<template #prefix>
							<span class="iconfont icon-24gl-lock2"></span>
						</template>
					</el-input>
				</el-form-item>
				<el-form-item prop="checkPassword">
					<el-input
						v-model="userInfoForm.checkPassword"
						type="password"
						placeholder="确认输入密码"
						show-password
					>
						<template #prefix>
							<span class="iconfont icon-24gl-lock2"></span>
						</template>
					</el-input>
				</el-form-item>

				<el-form-item prop="checkCode" class="no-status-icon">
					<el-input v-model="userInfoForm.checkCode" placeholder="输入验证码">
						<template #prefix>
							<span class="iconfont icon-anquan"></span>
						</template>
						<template #suffix>
							<span @click="refreshCheckCode">
								<el-image
									style="width: 100px; height: 40px; cursor: pointer"
									alt="验证码"
									:src="checkCodeBase64"
								/>
							</span>
						</template>
					</el-input>
				</el-form-item>

				<el-form-item class="submit-button">
					<el-button
						style="height: 40px; width: 100%"
						type="primary"
						:disabled="flag"
						@click="submit"
						>注册</el-button
					>
				</el-form-item>
			</el-form>

			<el-link class="no-link" @click="toLogin">登录账户</el-link>
		</div>
	</div>
	<div ref="error" class="custom-error-message"></div>
</template>

<script setup>
	import { ref, watch,onMounted  } from "vue";
	import avatar from "@/assets/image/avatar/avatar.jpg";
	const avatarPath = ref(avatar);
	import { checkCode, register } from "@/api/userApi";
	import { useRouter } from "vue-router";
	const router = useRouter();
	import { ruleInfo, customCheck, ConfirmPassword, isSubmit } from "@/utils/checkUtils";

	const formRef = ref();
	const userInfoForm = ref({
		email: "",
		password: "",
		checkCode: "",
		codeKey: "",
		checkPassword: ""
	});
	const checkCodeBase64 = ref();

	const rules = ref({
		email: [{ validator: customCheck(ruleInfo.email), trigger: "blur" }],
		password: [{ validator: customCheck(ruleInfo.password), trigger: "blur" }],
		checkPassword: [
			{
				validator: ConfirmPassword(userInfoForm),
				trigger: "blur"
			}
		],
		checkCode: [{ validator: customCheck(ruleInfo.checkCode), trigger: ["change", "blur"]  }]
	});

	/**
	 * 输入框校验提示ref
	 */
	const error = ref();

	const isClick = ref({
		email: false,
		password: false,
		checkPassword: false,
		checkCode: false
	});

	// 默认是禁用提交按钮
	const flag = ref(false);

	/**
	 * 监听isClick。改变flag
	 */
	watch(
		isClick,
		(newValue) => {
			flag.value = isSubmit(newValue);
		},
		{ deep: true , immediate: true }
	);

	/**
	 * 获取验证码
	 */
	async function refreshCheckCode() {
		const data = await checkCode();
		const { codeBase64, codeKey } = data.data;
		// 保存codekey
		sessionStorage.setItem("codeKey", codeKey);
		checkCodeBase64.value = codeBase64;
	}

	/**
	 * 跳转注册
	 */
	const toLogin = () => {
		router.push({ path: "login" });
	};

	/**
	 * 注册
	 */
	const submit = async () => {
		userInfoForm.value.codeKey = sessionStorage.getItem("codeKey");
		const data = await register(userInfoForm.value);
		//1、判断状态码
		if (data.code !== 200) {
			return;
		}
		// 4、注册成功跳转
		router.push({ path: "login" });
	};

	/**
	 * 表单校验触发
	 * @param prop     prop
	 * @param isValid  bollean
	 * @param message  提示
	 */
	const handleValidate = (prop, isValid, message) => {
		const errorRef = error.value;
		if (!isValid) {
			errorRef.innerHTML = "&nbsp;&ensp;" + message;
			errorRef.style.cssText = "opacity: 1;transform: translateY(10px);";
			isClick.value[prop] = false;
		} else {
			errorRef.style.cssText = "opacity: 0;transform: translateY(-10px);";
			isClick.value[prop] = true;
		}
	};

	/**
	 * 鼠标选中输入框触发 触发去掉警告
	 */
	const selected = () => {
		const errorRef = error.value;
		errorRef.style.cssText = "opacity: 0;transform: translateY(-10px);";
	};

	
	onMounted(() => {
		// 获取验证码
		refreshCheckCode();
	});
</script>

<style lang="scss" scoped>
	.root {
		display: flex;
		flex-direction: column; // flex 布局竖直布局
		width: 350px; // 宽度
		height: 480px; // 高度
		background-color: white;
		color: black;
		overflow: hidden; //不允许出现滑动条

		.custom-titlebar {
			opacity: 0.6; //字体透明度
			display: flex;
			align-items: center;
			/* 高度与 main.js 中 titleBarOverlay.height 一致  */
			height: 35px;
			width: 100%;
			padding-left: 12px;
			font-size: 14px;
			user-select: none;
			/* 设置该属性表明这是可拖拽区域，用来移动窗口 */
			-webkit-app-region: drag;
		}
		.content {
			height: 100%;
			display: flex;
			flex-direction: column; // flex 布局竖直布局
			align-items: center;
			.avatar {
				margin-top: 4px;
				flex: 100;
			}
			.el-form {
				padding-top: 10px;
				width: 80%;
				flex: 287;
				display: flex;
				flex-direction: column; // flex 布局竖直布局

				/* 隐藏指定字段的状态图标 */
				.no-status-icon {
					:deep(.el-input__validateIcon) {
						/*
						display: none; 是一个常见的 CSS 属性，用于完全隐藏元素。
						使用这个样式时，被应用的元素会被从页面中移除，甚至不再占据空间。
						不同于 visibility: hidden;，后者会让元素不可见，但仍然占用空间。
						 */
						display: none;
					}
				}

				:deep(.el-form-item) {
					margin-bottom: 2px;
				}
				:deep(.el-input__wrapper) {
					height: 44px;
					border: none; /* 去掉边框 */
					box-shadow: none; /* 去掉可能存在的阴影 */
					border-radius: 0;
					border-bottom: 1px solid #07c160;
					display: flex;
					align-items: center;
				}

				.submit-button {
					margin-top: 10px;
				}
			}
			.no-link {
				flex: 60;
				font-size: 16px;
				padding-bottom: 20px;
			}
		}
	}
	.custom-error-message {
		font-size: 12px !important; /* 错误信息字体大小 */
		position: absolute;
		top: 110px;
		left: 46px;
		color: #f56c6c; /* 错误信息字体颜色 */
		font-size: 14px; /* 错误信息字体大小 */
		font-weight: normal; /* 错误信息加粗 */
		/* 动画效果：淡入淡出 */
		opacity: 0;
		transform: translateY(-10px); /* 初始位置稍微上移 */
		transition:
			opacity 0.5s ease,
			transform 0.5s ease; /* 动画时间和过渡效果 */
	}
</style>

