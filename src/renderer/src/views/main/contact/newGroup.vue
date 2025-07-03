<template>
	<div class="new-group">
		<el-form
			:model="newGroupModel"
			ref="groupRef"
			:rules="rules"
			label-width="100px"
			label-position="left"
		>
			<el-form-item class="group-avatar" required label="群头像">
				<UploadImage ref="uploadRef" :avatar-width="'50px'" :is-init-show-image="false" @upload-file="getImage" />
			</el-form-item>

			<el-form-item label="群名称" prop="groupName">
				<el-input v-model="newGroupModel.groupName" placeholder="请输入群名称"></el-input>
			</el-form-item>

			<el-form-item required label="加入权限" prop="joinType">
				<el-radio-group v-model="newGroupModel.joinType">
					<el-radio value="0" size="small">直接加入</el-radio>
					<el-radio value="1" size="small">审核加入</el-radio>
				</el-radio-group>
			</el-form-item>

			<el-form-item label="公告" prop="announcement">
				<el-input
					ref="textareaRef"
					v-model="newGroupModel.announcement"
					type="textarea"
					:show-word-limit="true"
					maxlength="300"
					:autosize="{ minRows: 4, maxRows: 8 }"
					placeholder="请输入群公告"
				></el-input>
			</el-form-item>

			<el-form-item>
				<el-button @Click="resetGroupInfo(groupRef)">重置</el-button>
				<el-button @Click="createGroup(newGroupModel)" type="primary">创建</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>

<script setup>
	import { nextTick, ref } from "vue";
	import UploadImage from "@/components/uploadImage.vue";
	import { insertGroup } from "@/api/groupApi";
	import { ElMessage } from "element-plus";
	import { storeToRefs } from "pinia";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { useContactStore } from "@/stores/contactStore";
	const contactStore = useContactStore();

	const { userInfo } = storeToRefs(userInfoStore);

	const groupRef = ref();
	const newGroupModel = ref({
		ownerId: "",
		groupName: "",
		joinType: "0",
		announcement: "",
		avatarFile: ""
	});

	const uploadRef = ref();

	const rules = ref({
		groupName: [
			{
				required: true,
				message: "必填字段",
				trigger: "change"
			}
		],
		announcement: [
			{
				required: true,
				message: "必填字段",
				trigger: "change"
			}
		]
	});

	const getImage = (file) => {
		newGroupModel.value.avatarFile = file;
	};

	const createGroup = async (groupInfo) => {
		// 1、校验表单数据
		const valid = await groupRef.value.validate((valid) => {
			return valid;
		});

		if (!valid) {
			return;
		}

		// 2、校验头像
		if (!uploadRef.value.isEmptyAvatar()) {
			ElMessage.error("请设置群聊头像！");
		} else {
			//3、发送添加群聊信息
			const data = await insertGroup(groupInfo);

			//4、清空数据
			resetGroupInfo(groupRef.value);

			// 4、判断 刷新、跳转群聊
			if (data.code == 200) {
				contactStore.selectGroupList(userInfo.value.userId);
			}
		}
	};

	/**
	 * 重置数据
	 * 注意：
	 * 1、resetFields() 需要各个字段的prop属性和el-from 用:mode 不可用v-mode
	 * 2、通过ref实例操作子组件的元素，是需要子组件对其进行暴露的
	 */
	const resetGroupInfo = (fromRef) => {
		fromRef.resetFields();
		uploadRef.value.reset();
	};

	nextTick(() => {
		newGroupModel.value.ownerId = userInfo.value.userId;
	});
</script>

<style lang="scss" scoped>
	.new-group {
		height: 400px;
		margin: 50px auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		:deep(.el-form-item__content) {
			width: 250px;
			display: flex;
			justify-content: start;
		}
	}
</style>
