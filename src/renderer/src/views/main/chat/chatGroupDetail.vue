<template>
	<div class="group-panel">
		<el-drawer v-model="showDrawer" ref="drawerRef" :with-header="false">
			<div class="group-panel-body no-drag">
				<!-- 搜索 -->
				<el-input
					v-model="search"
					placeholder="搜索群成员"
					class="search-input"
					size="small"
				/>
				<!-- 成员头像列表 -->
				<div class="avatar-list">
					<div v-for="member in memberList" :key="member.id" class="user-box">
						<ShowLocalImage
							:width="40"
							:height="40"
							:file-id="member.id"
							part-type="avatar"
							:file-type="0"
						></ShowLocalImage>
						<div class="name">{{ member.name }}</div>
					</div>
					<div v-if="isOwner && isInMemberList" class="user-box" @click="addUser">
						<div class="iconfont icon-faqiqunliao"></div>
						<span class="name">添加</span>
					</div>
					<div v-if="isOwner && isInMemberList" class="user-box" @click="delUser">
						<div class="iconfont icon-zuixiaohua"></div>
						<span class="name">移出</span>
					</div>
				</div>

				<!-- 分隔线 -->
				<el-divider />

				<!-- 群设置项 -->
				<div class="group-setting">
					<div class="setting-item">
						<div class="setting-label">群号：</div>
						<div class="setting-desc">{{ groupInfo.groupId }}</div>
					</div>
					<div class="setting-item">
						<div class="setting-label">群名称：</div>
						<div class="setting-desc" :title="groupInfo.groupName">
							{{ groupInfo.groupName }}
						</div>
					</div>
					<div class="setting-item">
						<div class="setting-label">群公告：</div>
						<div class="setting-desc" :title="groupInfo.groupAnnouncement">
							{{ groupInfo.groupAnnouncement }}
						</div>
					</div>
					<div class="setting-item">
						<div class="setting-label">创建时间：</div>
						<div class="setting-desc" :title="groupInfo.createTime">
							{{ groupInfo.createTime }}
						</div>
					</div>
				</div>
				<el-divider />
				<div v-if="!isOwner && isInMemberList" class="handler" @click="breakGroup">
					退出群聊
				</div>
				<div v-if="isOwner && isInMemberList" class="handler" @click="disbandGroup">
					解散群聊
				</div>
			</div>
		</el-drawer>
	</div>
	<SelectUser :data="groupInfo" ref="selectUserRef"></SelectUser>
</template>
<script setup>
	import { ref, computed } from "vue";
	import { selectGroupInfo } from "@/api/groupApi";
	import { selectGroup } from "@/api/groupContactApi";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { storeToRefs } from "pinia";
	const { userInfo } = storeToRefs(userInfoStore);
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import SelectUser from "./selectUser.vue";
	import { batchAddGroupContact } from "@/api/groupContactApi";
	import { ElMessageBox } from "element-plus";
	import { disband } from "@/api/groupApi";
	import { useContactStore } from "@/stores/contactStore";
	const contactStore = useContactStore();
	const { userList } = storeToRefs(contactStore);
	import { useSysSettingStore } from "@/stores/sysSettingStore";
	const sysSettingStore = useSysSettingStore();
	const { sysSetting } = storeToRefs(sysSettingStore);

	const showDrawer = ref(false);
	const memberList = ref([]);
	const groupInfo = ref({});

	const emit = defineEmits(["delSession"]);

	const isOwner = computed(() => {
		return groupInfo.value.ownerId == userInfo.value.userId;
	});

	const isInMemberList = computed(() => {
		return memberList.value.some((member) => member.id === userInfo.value.userId);
	});

	const show = async (groupId, groupSessionId) => {
		showDrawer.value = true;
		const group = await selectGroupInfo(groupId);
		groupInfo.value = { groupSessionId, ...group.data };
		const userList = await selectGroup(groupId, userInfo.value.userId);
		memberList.value = userList.data;
	};

	defineExpose({
		show
	});

	const search = ref();

	const selectUserRef = ref();
	const addUser = async () => {
		// 查询用户联系人
		let contactList = userList.value;
		// 已在群聊的用户id

		const userIds = memberList.value.map((item) => {
			return item["id"];
		});

		// 用 Set 包装一下，查找 O(1)
		const userIdSet = new Set(userIds);

		// 过滤出 contactId 已经存在 userIds 里的那些
		contactList = contactList.filter((contact) => {
			return !userIdSet.has(contact.id) && contact.id !== sysSetting.value.robotUid;
		});

		const { groupId, groupName, ownerId, groupSessionId } = groupInfo.value;
		selectUserRef.value.show({
			contactIds: contactList,
			groupId,
			groupName,
			ownerId,
			type: 1,
			groupSessionId
		});
		showDrawer.value = false;
	};

	const delUser = async () => {
		const userList = memberList.value.filter((user) => {
			return user["id"] != groupInfo.value.ownerId;
		});
		const { groupId, groupName, ownerId, groupSessionId } = groupInfo.value;
		selectUserRef.value.show({
			contactIds: userList,
			groupId,
			groupName,
			ownerId,
			type: 0,
			groupSessionId
		});
		showDrawer.value = false;
	};

	// 退出群聊
	const breakGroup = () => {
		ElMessageBox.confirm(`确定要退出群聊吗？`, {
			confirmButtonText: "删除",
			cancelButtonText: "取消",
			type: "warning"
		}).then(async () => {
			const { groupId, groupName, ownerId, groupSessionId } = groupInfo.value;
			const data = {
				groupId,
				groupName,
				ownerId,
				type: 0,
				userIds: [userInfo.value.userId],
				names: [userInfo.value.nickName],
				groupSessionId,
				breakType: 1
			};
			const result = await batchAddGroupContact(data);
			if (result.code == 200) {
				emit("delSession", groupId);
			}
			showDrawer.value = false;
		});
	};

	// 解散群聊
	const disbandGroup = async () => {
		ElMessageBox.confirm(`确定要解散群聊吗？`, {
			confirmButtonText: "删除",
			cancelButtonText: "取消",
			type: "warning"
		}).then(async () => {
			const { groupId, groupName, ownerId, groupSessionId } = groupInfo.value;
			// 已在群聊的用户id
			const userIds = memberList.value.map((item) => {
				return item["id"];
			});
			const param = {
				groupId,
				groupName,
				ownerId,
				type: 0,
				userIds,
				groupSessionId
			};
			const data = await disband(param);
			showDrawer.value = false;
			if (data.code == 200) {
				refreshMemberList();
			}
		});
	};

	const refreshMemberList = async () => {
		const userList = await selectGroup(groupId, userInfo.value.userId);
		memberList.value = userList.data;
	};
</script>
<style lang="scss" scoped>
	.group-panel-body {
		padding: 12px;
		font-size: 14px;
		overflow-y: auto;
		height: 100%;

		.search-input {
			margin-bottom: 12px;
		}

		.avatar-list {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			margin-bottom: 12px;

			.user-box {
				height: 80;
				width: 60;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				gap: 5px;
				.iconfont {
					width: 40px;
					height: 40px;
					text-align: center;
					line-height: 40px;
					border: 1px dashed #000;
					border-radius: 4px; /* 设置圆角 */
					cursor: pointer;
				}
				.name {
					font-size: 12px;
					opacity: 0.6;
				}
			}
		}

		.group-setting {
			display: flex;
			flex-direction: column;
			gap: 16px;

			.setting-item {
				display: flex;
				justify-content: space-between;
				align-items: center;

				.setting-label {
					font-weight: 500;
				}

				.setting-desc {
					color: #999;
					font-size: 12px;
					max-width: calc(100% - 70px); // 根据实际宽度调整
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					cursor: pointer;
				}
			}
		}

		.handler {
			height: 40px;
			color: red;
			font-size: 14px;
			text-align: center;
			line-height: 40px;
			border-radius: 4px; /* 设置圆角 */
			cursor: pointer;
			opacity: 0.6;
			&:hover {
				opacity: 1;
			}
		}
	}
</style>
