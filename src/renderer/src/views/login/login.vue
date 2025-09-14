<template>
	<div class="root">
		<div class="custom-titlebar">SwiftChat</div>
		<div class="content">
			<div class="avatar">
				<el-avatar shape="square" :size="70" :src="avatarPath" />
			</div>
			<el-form
				:rules="rules"
				ref="formRef"
				class="el-from"
				:model="userInfoForm"
				:show-message="false"
				status-icon
				@validate="handleValidate"
			>
				<el-form-item class="el-form-item" prop="email">
					<el-autocomplete
						v-model="userInfoForm.email"
						popper-class="my-autocomplete"
						placeholder="请输入邮箱"
						:trigger-on-focus="false"
						:fetch-suggestions="queryEmailHistory"
						@focus="selected"
						@blur="getAvatar(userInfoForm.email)"
						@select="handleSelect"
						@keyup.enter="submit"
					>
						<template #prefix>
							<span class="iconfont icon-email"></span>
						</template>
					</el-autocomplete>
				</el-form-item>

				<el-form-item prop="password">
					<el-input
						v-model="userInfoForm.password"
						type="password"
						placeholder="请输入密码"
						@focus="selected"
						show-password
						@keyup.enter="submit"
					>
						<template #prefix>
							<span class="iconfont icon-24gl-lock2"></span>
						</template>
					</el-input>
				</el-form-item>

				<el-form-item prop="checkCode" class="no-status-icon">
					<el-input
						v-model="userInfoForm.checkCode"
						placeholder="输入验证码"
						@keyup.enter="submit"
					>
						<template #prefix>
							<span class="iconfont icon-anquan"></span>
						</template>
						<template #suffix>
							<el-image
								style="width: 100px; height: 40px; cursor: pointer"
								:src="checkCodeBase64"
								@click="refreshCheckCode"
							/>
						</template>
					</el-input>
				</el-form-item>

				<el-form-item class="submit-button">
					<el-button
						style="height: 40px; width: 100%"
						type="primary"
						:disabled="flag"
						@click="submit"
						>登录</el-button
					>
				</el-form-item>
			</el-form>

			<el-link class="no-link" @click="toRegister">没有账户点击注册</el-link>
		</div>
	</div>
	<div ref="error" class="custom-error-message"></div>
	<windowControlButton :win-config="windowControl"></windowControlButton>
	<!-- 自定义 Loading 组件 -->
	<LoadingOverlay :visible="isLoading" :text="loadingText" />
</template>

<script setup>
	import { onMounted, ref, watch } from "vue";
	import avatar from "@/assets/image/avatar/avatar.jpg";
	import LoadingOverlay from "@/components/LoadingOverlay.vue";
	const avatarPath = ref(avatar);
	import { checkCode, login } from "@/api/userApi";
	import { useRouter } from "vue-router";
	const router = useRouter();
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { ruleInfo, customCheck, isSubmit } from "@/utils/checkUtils";
	import windowControlButton from "@/components/windowControlButton.vue";
	import { setLocalItem } from "@/utils/storage";
	import { api } from "@/constant/api";

	const isLoading = ref(false);

	const loadingText = ref("登录中。。。");

	/**
	 * 窗口右上角控制按钮
	 */
	const windowControl = ref({
		isShowPin: false,
		isShowMinimize: false,
		isShowMaximize: false,
		closeType: 0
	});

	const formRef = ref();
	const userInfoForm = ref({
		email: "",
		password: "",
		checkCode: "",
		codeKey: ""
	});
	const checkCodeBase64 = ref();

	const rules = ref({
		email: [{ validator: customCheck(ruleInfo.email), trigger: "blur" }],
		password: [{ validator: customCheck(ruleInfo.password), trigger: "blur" }],
		checkCode: [{ validator: customCheck(ruleInfo.checkCode), trigger: ["change", "blur"] }]
	});

	const error = ref();

	//判断校验是否全部正确
	const isClick = ref({
		email: false,
		password: false,
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
			// newValue isClick.value 数据了
			flag.value = isSubmit(newValue);
		},
		{ deep: true, immediate: true }
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
	const toRegister = () => {
		router.push({ path: "register" });
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
	 * 鼠标选中输入框触发
	 */
	const selected = () => {
		const errorRef = error.value;
		errorRef.style.cssText = "opacity: 0;transform: translateY(-10px);";
	};

	// 获取头像 鼠标离开输入框触发
	const getAvatar = async (email) => {
		const result = await window.ipcRenderer.invoke("getAvatar", email);
		if (result) {
			avatarPath.value = result;
		}
	};

	// 处理选择事件
	const queryEmailHistory = async (queryString, cb) => {
		const data = await window.ipcRenderer.invoke("getEmailHistory", queryString);
		if (data.length === 0) {
			cb([]);
		} else {
			const suggestions = data.map((item) => ({
				value: item.email // 必需的，用于填充输入框
			}));
			cb(suggestions);
		}
	};

	// 选择邮箱时触发
	const handleSelect = (item) => {
		userInfoForm.value.email = item.value;
		getAvatar(item.value);
	};

	/**
	 * 登录
	 */
	const submit = async () => {
		if (flag.value) {
			return;
		}

		userInfoForm.value.codeKey = sessionStorage.getItem("codeKey");
		const data = await login(userInfoForm.value);

		//1、判断状态码
		if (data.code !== 200) {
			return;
		}

		// 开启遮罩
		isLoading.value = true;

		try {
			// 3、存入token
			localStorage.setItem("token", data.data.token);
			// 4、保存用户登录基础信息
			userInfoStore.setUserInfo(data.data);
			setLocalItem("userInfo", data.data);

			// 5、发送给主进程创建main窗口
			window.ipcRenderer.send("toMain", data.data);

			// 6、初始数据给主进程
			init();

			// 登录成功跳转（组件销毁）
			router.push("/main");
		} catch (e) {
			log.error("登录失败", e);
		} finally {
		}
	};

	const init = () => {
		// 发送初始化数据给主进程
		window.ipcRenderer.send("setLocalStore", { key: "prot", value: api.prot });
		window.ipcRenderer.send("setLocalStore", { key: "prodDomain", value: api.prodDomain });
		window.ipcRenderer.send("setLocalStore", { key: "devDomain", value: api.devDomain });
		window.ipcRenderer.send("setLocalStore", { key: "prodWsDomain", value: api.prodWsDomain });
		window.ipcRenderer.send("setLocalStore", { key: "devWsDomain", value: api.devWsDomain });
	};

	onMounted(() => {
		// 获取验证码
		refreshCheckCode();
	});
</script>

<style lang="scss">
	/* 方法3: 全局覆盖（最强选择器） */
	.el-autocomplete-suggestion li:hover {
		background-color: #e6f9ef;
		border-left: 3px solid #409eff;
		padding-left: 12px;
		transition: all 0.2s ease;
	}
</style>
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
			width: 90%;
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

				.custom-error {
					color: red;
					font-size: 10px;
				}

				.submit-button {
					margin-top: 58.5px;
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
		font-size: 12px !important;
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
