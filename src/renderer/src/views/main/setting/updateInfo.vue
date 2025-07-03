<template>
	<div class="update-info">
		<el-form :model="userInfoModel" :rules="rules" label-width="100px" label-position="left">
			<el-form-item class="group-avatar" required label="头像">
				<uploadImage
					ref="uploadRef"
					:avatar-width="'50px'"
					:avatar-value="avatar"
					@upload-file="getImage"
				/>
			</el-form-item>

			<el-form-item label="昵称" required prop="nickName">
				<el-input v-model="userInfoModel.nickName" placeholder="请输入昵称"></el-input>
			</el-form-item>

			<el-form-item required label="性别" prop="sex">
				<el-radio-group v-model="userInfoModel.sex">
					<el-radio :value="1" size="small">男</el-radio>
					<el-radio :value="0" size="small">女</el-radio>
				</el-radio-group>
			</el-form-item>

			<el-form-item label="朋友权限" required prop="joinType">
				<el-switch v-model="userInfoModel.joinType" :active-value="1" :inactive-value="0">
					<template #active-action>
						<span class="custom-active-action">T</span>
					</template>
					<template #inactive-action>
						<span class="custom-inactive-action">F</span>
					</template>
				</el-switch>
				<span style="margin-left: 20px; font-size: 14px; opacity: 0.6"
					>加我为好友时需要验证</span
				>
			</el-form-item>

			<el-form-item label="地区" required prop="areaName">
				<el-cascader
					v-model="userInfoModel.areaName"
					:options="areas"
					placeholder="请选择地区"
					filterable
				/>
			</el-form-item>

			<el-form-item
				class="personal-signature"
				label="个性签名"
				required
				prop="personalSignature"
			>
				<el-input
					v-model="userInfoModel.personalSignature"
					type="textarea"
					:show-word-limit="true"
					resize="none"
					maxlength="30"
					placeholder="请输入个性签名"
					@keydown.enter.prevent
				></el-input>
				<!-- @keydown.enter.prevent  阻止回车换行 -->
			</el-form-item>

			<el-form-item>
				<el-button @Click="saveInfo" type="primary">保存个人信息</el-button>
				<el-button @click="closeUpdate" type="primary" plain>取消</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>

<script setup>
	import { useRouter } from "vue-router";
	const router = useRouter();
	import { areas } from "@/assets/data/areas";
	import { nextTick, ref } from "vue";
	import uploadImage from "@/components/uploadImage.vue";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { storeToRefs } from "pinia";
	const { userInfo } = storeToRefs(userInfoStore);
	import { getFileUrl, getFile } from "@/utils/fileUtils";
	import { updateInfo } from "@/api/userApi";
	const avatar = getFileUrl(userInfo.value.userId, "avatar", 0, true);
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();

	const uploadRef = ref();

	const userInfoModel = ref({
		userId: "",
		nickName: "",
		sex: "",
		joinType: "",
		areaName: [],
		personalSignature: "",
		avatarFile: ""
	});

	const rules = ref();

	/**
	 * 获取头像文件并赋值到value里面
	 * @param imageValue 头像文件
	 */
	const getImage = (imageValue) => {
		userInfoModel.value.avatarFile = imageValue;
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
	 * 修改信息
	 */
	const saveInfo = async () => {
		const data = await updateInfo(userInfoModel.value);
		if (data.code === 200) {
			// 从服务器读取文件跟新本地头像文件
			const resp = await getFile(userInfo.value.userId, "avatar", 0, true);

			if (resp) {
				// 1、跟新本地持久化用户数据
				userInfoStore.changUserInfo();
				// 强制刷新图片
				avatarUpdateStore.triggerUpdate(userInfo.value.userId);
				// 2、跳转路由
				closeUpdate();
			}
		}
	};

	nextTick(async () => {
		userInfoModel.value = {
			userId: userInfo.value.userId,
			nickName: userInfo.value.nickName,
			sex: userInfo.value.sex,
			joinType: userInfo.value.joinType,
			areaName: userInfo.value.areaName != null ? userInfo.value.areaName.split(" ") : "", // 将字符串转换为数组
			personalSignature: userInfo.value.personalSignature
		};
	});
</script>

<style lang="scss" scoped>
	.update-info {
		width: 300px;
		margin: 20px auto;

		.personal-signature {
			:deep(.el-textarea__inner) {
				max-height: 50px;
			}
		}
	}
</style>
