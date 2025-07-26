<template>
	<div class="update-pwd">
		<el-form
			:model="updatePwdModel"
			label-width="70px"
			label-position="left"
			:rules="rules"
			@validate="handleValidate"
		>
			<el-form-item label="账号" style="opacity: 0.6">
				<el-input v-model="updatePwdModel.userId" disabled></el-input>
			</el-form-item>
			<el-form-item label="原密码" prop="oldPwd">
				<el-input v-model="updatePwdModel.oldPwd" placeholder="填写原密码"></el-input>
			</el-form-item>
			<el-form-item label="新密码" prop="newPwd">
				<el-input v-model="updatePwdModel.newPwd" placeholder="填写新密码"></el-input>
			</el-form-item>
			<el-form-item label="确认密码" prop="checkPwd">
				<el-input v-model="updatePwdModel.checkPwd" placeholder="再次填写确认"></el-input>
			</el-form-item>
		</el-form>
		<span class="text-prompt" :style="{ color: flag ? 'red' : '' }">
			密码必须是8-16位英文字母、数字、字符组合 (不能是纯数字)
		</span>
		<div class="operation-button">
			<el-button type="primary" @click="updatePassword" :disabled="flag">修改密码</el-button>
			<el-button type="primary" plain @click="closeUpdate">取消</el-button>
		</div>
	</div>
</template>

<script setup>
	import { nextTick, ref, watch } from "vue";
	import { useRouter } from "vue-router";
	const router = useRouter();
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { storeToRefs } from "pinia";
	const { userInfo } = storeToRefs(userInfoStore);
	import { updatePwd, userLogout } from "@/api/userApi";
	import { updatePwdRuleInfo, customCheck, ConfirmNewPwd, isSubmit } from "@/utils/checkUtils";

	// 默认是禁用提交按钮
	const flag = ref(true);

	const updatePwdModel = ref({
		userId: "",
		oldPwd: "",
		newPwd: "",
		checkPwd: ""
	});

	const rules = ref({
		oldPwd: [{ validator: customCheck(updatePwdRuleInfo.oldPwd), trigger: "blur" }],
		newPwd: [
			{
				validator: customCheck(updatePwdRuleInfo.newPwd),
				trigger: "blur"
			}
		],
		checkPwd: [{ validator: ConfirmNewPwd(updatePwdModel), trigger: "blur" }]
	});

	const isClick = ref({
		oldPwd: false,
		newPwd: false,
		checkPwd: false
	});

	/**
	 * 监听isClick。改变flag
	 */
	watch(
		isClick,
		(newValue) => {
			// newValue isClick.value 数据了
			flag.value = isSubmit(newValue);
		},
		{ deep: true }
	);

	/**
	 * 表单校验触发
	 * @param prop     prop
	 * @param isValid  bollean
	 * @param message  提示
	 */
	const handleValidate = (prop, isValid, message) => {
		if (!isValid) {
			isClick.value[prop] = false;
		} else {
			isClick.value[prop] = true;
		}
	};

	const closeUpdate = () => {
		router.push({
			path: "/main/setting/accountSetting",
			query: {
				title: "账号设置"
			}
		});
	};

	/**
	 * 修改密码
	 */
	const updatePassword = async () => {
		// 1、调用修改密码接口
		const data = await updatePwd(updatePwdModel.value);
		// 2、判断是否修改密码成功
		if (data.code !== 200) {
			return;
		}
		// 3、调用退出接口
		await userLogout();
		// 4、删除本地token
		localStorage.removeItem("token");
		// 5、跳转登录页面
		router.push("/login");
	};

	nextTick(() => {
		updatePwdModel.value.userId = userInfo.value.userId;
	});
</script>

<style lang="scss" scoped>
	.update-pwd {
		width: 350px;
		margin: 40px auto;

		.text-prompt {
			font-size: 12px;
			opacity: 0.6;
		}

		.operation-button {
			margin: 30px 0 0 70px;
			display: flex;
			align-items: center;
			justify-content: flex-start;
		}
	}
</style>
