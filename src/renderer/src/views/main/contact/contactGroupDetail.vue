<template>
	<div class="group-panel">
		<el-drawer v-model="showDrawer" :with-header="false" size="50%">
			<div class="update-info">
				<el-form
					:model="groupInfo"
					:rules="rules"
					label-width="100px"
					label-position="left"
				>
					<el-form-item class="no-drag group-avatar" required label="头像">
						<uploadImage
							ref="uploadRef"
							:avatar-width="'50px'"
							:avatar-value="avatar"
							@upload-file="getImage"
						/>
					</el-form-item>

					<el-form-item label="群昵称" required prop="groupName">
						<el-input v-model="groupInfo.groupName" placeholder="请输入昵称"></el-input>
					</el-form-item>

					<el-form-item label="加入权限" required prop="joinType">
						<el-switch
							v-model="groupInfo.joinType"
							:active-value="1"
							:inactive-value="0"
						>
							<template #active-action>
								<span class="custom-active-action">T</span>
							</template>
							<template #inactive-action>
								<span class="custom-inactive-action">F</span>
							</template>
						</el-switch>
						<span style="margin-left: 20px; font-size: 14px; opacity: 0.6"
							>进入群聊时需要管理员验证</span
						>
					</el-form-item>

					<el-form-item label="群公告" required prop="groupAnnouncement">
						<el-input
							v-model="groupInfo.groupAnnouncement"
							type="textarea"
							:show-word-limit="true"
							resize="none"
							maxlength="30"
							placeholder="请输入群公告"
							@keydown.enter.prevent
						></el-input>
						<!-- @keydown.enter.prevent  阻止回车换行 -->
					</el-form-item>

					<el-form-item>
						<el-button @Click="saveInfo(groupInfo)" type="primary"
							>保存群聊信息</el-button
						>
						<el-button @click="showDrawer = false" type="primary" plain>取消</el-button>
					</el-form-item>
				</el-form>
			</div>
		</el-drawer>
	</div>
</template>
<script setup>
	import { ref } from "vue";
	import uploadImage from "@/components/uploadImage.vue";
	import { getFileUrl, getFile } from "@/utils/fileUtils";
	import { selectGroupInfo, save } from "@/api/groupApi";
	import { useRoute } from "vue-router";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();

	const route = useRoute();
	const rules = ref();

	const showDrawer = ref(false);

	const groupInfo = ref({});

	const emit = defineEmits(["changeGroupList"]);

	let avatar = null;

	const show = async (data) => {
		showDrawer.value = true;
		if (data) {
			avatar = getFileUrl(data.id, "avatar", 0, true);
			groupInfo.value = await selectGroupInfo(data.id).then((res) => res.data);
		} else {
			avatar = getFileUrl(route.query.id, "avatar", 0, true);
			groupInfo.value = await selectGroupInfo(route.query.id).then((res) => res.data);
		}
	};

	defineExpose({
		show
	});

	/**
	 * 获取头像文件并赋值到value里面
	 * @param imageValue 头像文件
	 */
	const getImage = (imageValue) => {
		groupInfo.value.avatarFile = imageValue;
	};

	// 修改群聊信息
	const saveInfo = async (groupInfo) => {
		const data = await save(groupInfo);
		if (data.code === 200) {
			// 从服务器读取文件跟新本地头像文件
			const resp = await getFile(groupInfo.groupId, "avatar", 0, true);
			if (resp) {
				avatarUpdateStore.triggerUpdate(groupInfo.groupId);
				emit("changeGroupList", groupInfo);
			}
		}

		showDrawer.value = false;
	};
</script>
<style lang="scss" scoped></style>
