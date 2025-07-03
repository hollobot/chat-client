<template>
	<div class="chat-user-card">
		<!-- 用户信息区域 -->
		<div class="user-info">
			<div class="avatar-container">
				<ShowLocalImage
					:width="60"
					:height="60"
					:file-id="userInfo.sendUserId"
					part-type="avatar"
					:file-type="0"
					:force-get="avatarUpdateStore.get(userInfo.sendUserId)"
					:isShow="true"
				></ShowLocalImage>
			</div>

			<div class="user-details">
				<div class="nickname-row">
					<span class="nickname">{{ userInfo.sendUserNickName }} </span>
					<span
						:class="['iconfont', userSex == 0 ? 'icon-xingbienv' : 'icon-xingbienan']"
						:style="userSex == 0 ? { color: '#E91E63' } : { color: '#4A90E2' }"
					/>
				</div>

				<div class="info-row">
					<span class="label">昵称：</span>
					<span class="value">{{ userInfo.sendUserNickName }}</span>
				</div>

				<div class="info-row">
					<span class="label">地址：</span>
					<span class="value">{{ userAreaName }}</span>
				</div>
			</div>
		</div>

		<el-divider border-style="double" />

		<!-- 操作按钮 -->
		<div class="action-section">
			<el-button v-if="isContact" @click="handleSendMessage" class="chat-btn"
				>发消息</el-button
			>
			<el-button v-else class="chat-btn" @click="handleAddContact">添加到通讯录</el-button>
		</div>
	</div>
</template>

<script setup>
	import { defineProps, computed } from "vue";
	import { storeToRefs } from "pinia";
	import { useContactStore } from "@/stores/contactStore";
	const contactStore = useContactStore();
	const { userList } = storeToRefs(contactStore);
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import { useRouter } from "vue-router";
	const router = useRouter();

	// 定义props
	const props = defineProps({
		userInfo: {
			type: Object,
			default: {
				sendUserId: "",
				sendUserNickName: ""
			}
		}
	});

	const isContact = computed(() => {
		return userList.value.some((user) => user.id === props.userInfo.sendUserId);
	});

	// 从userList中获取当前用户的完整信息
	const currentUser = computed(() => {
		return userList.value.find((user) => user.id === props.userInfo.sendUserId);
	});

	// 获取性别信息
	const userSex = computed(() => {
		return currentUser.value?.sex;
	});

	// 获取地区信息
	const userAreaName = computed(() => {
		return currentUser.value?.areaName || "";
	});

	// 获取地区信息
	const joinType = computed(() => {
		return currentUser.value?.joinType;
	});

	// 定位到发送消息方法
	const handleSendMessage = () => {
		router.push({
			path: "/main/chat",
			query: {
				contactId: props.userInfo.sendUserId,
				timeStamp: new Date().getTime()
			}
		});
	};

	const emits = defineEmits(["closePopover"]);

	// 添加联系人
	const handleAddContact = () => {
		// 关闭popover
		// 触发父组件的closePopover事件
		emits("closePopover", {
			type: "USER",
			id: props.userInfo.sendUserId,
			title: "申请添加朋友",
			prompt1: "发送添加朋友申请",
			aplMsg: "您好！",
			prompt2: "备注名",
			remarkName: props.userInfo.sendUserNickName,
			recipientsex: userSex.value,
			joinType: joinType.value
		});
	};
</script>

<style lang="scss" scoped>
	.chat-user-card {
		margin: auto;
		width: 90%;
		background: #fff;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;

		.user-info {
			width: 100%;
			display: flex;
			gap: 15px;
			.avatar-container {
				width: 60px;
				height: 60px;
			}

			.user-details {
				flex: 1;
				display: flex;
				flex-direction: column;

				.nickname-row {
					font-size: 16px;
					display: flex;
					.iconfont {
						padding: 1.5px;
					}
				}

				.info-row {
					opacity: 0.6;
					font-size: 12px;
					display: flex;
				}
			}
		}

		:deep(.el-divider--horizontal) {
			margin: 10px 0 15px 0;
		}

		.action-section {
			.chat-btn {
				height: 36px;
				background: #07c160;
				color: #fff;
				border: none;
				border-radius: 4px;
				font-size: 14px;
				font-weight: 500;
				cursor: pointer;
				transition: background-color 0.2s ease;

				&:hover {
					background: #06ad56;
				}

				&:active {
					background: #059a4f;
				}
			}
		}
	}
</style>
