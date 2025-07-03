<template>
	<!-- 自己发的消息 -->
	<div class="message-my" v-if="data.sendUserId == userInfo.userId">
		<div :class="['content-panel', data.messageType == 5 ? 'content-media' : 'content-text']">
			<div class="sending" v-if="data.status == 0">
				<el-skeleton :animated="true">
					<template #template>
						<el-skeleton-item variant="image" style="width: 100px; height: 100px" />
					</template>
				</el-skeleton>
			</div>
			<template v-else>
				<div
					class="content"
					v-if="data.messageType != 5"
					v-html="data.messageContent"
				></div>
				<div class="media" v-else @click="showDetail(data)">
					<div v-if="data.fileType == 0">
						<ChatMessageImage :data="data"></ChatMessageImage>
					</div>
					<div v-if="data.fileType == 1">
						<ChatMessageVideo :data="data"></ChatMessageVideo>
					</div>
					<div v-if="data.fileType == 2">
						<ChatMessageFile :data="data"></ChatMessageFile>
					</div>
				</div>
			</template>
			<el-popover
				ref="visible"
				:show-arrow="false"
				:hide-after="0"
				:width="250"
				trigger="click"
				placement="right-start"
			>
				<template #reference>
					<div class="avatar">
						<ShowLocalImage
							:width="35"
							:height="35"
							:file-id="data.sendUserId"
							part-type="avatar"
							:file-type="0"
							:force-get="avatarUpdateStore.get(data.sendUserId)"
						></ShowLocalImage>
					</div>
				</template>
				<div>
					<ChatUserCard :user-info="data" @close-popover="close"></ChatUserCard>
				</div>
			</el-popover>
		</div>
	</div>
	<!-- 对方的消息 -->
	<div class="messaget-other" v-else>
		<el-popover
			ref="visible"
			:show-arrow="false"
			:hide-after="0"
			:width="250"
			trigger="click"
			placement="right-start"
		>
			<template #reference>
				<div :class="['avatar', data.recipientType == 1 ? 'group-avatar' : '']">
					<ShowLocalImage
						:width="35"
						:height="35"
						:file-id="data.sendUserId"
						part-type="avatar"
						:file-type="0"
						:force-get="avatarUpdateStore.get(data.sendUserId)"
					></ShowLocalImage>
				</div>
			</template>
			<div>
				<ChatUserCard :user-info="data" @close-popover="close"></ChatUserCard>
			</div>
		</el-popover>

		<div
			:class="[
				'content-panel',
				data.messageType == 5 ? 'content-media' : 'content-text',
				data.recipientType == 1 ? 'content-group' : ''
			]"
		>
			<div class="nick-name" v-if="data.recipientType == 1">{{ data.sendUserNickName }}</div>

			<div class="sending" v-if="data.status == 0">
				<el-skeleton :animated="true">
					<template #template>
						<el-skeleton-item variant="image" style="width: 100px; height: 100px" />
					</template>
				</el-skeleton>
			</div>
			<template v-else>
				<div
					class="content"
					v-if="data.messageType != 5"
					v-html="data.messageContent"
				></div>
				<div class="media" v-else @click="showDetail(data)">
					<div v-if="data.fileType == 0">
						<ChatMessageImage :data="data"></ChatMessageImage>
					</div>
					<div v-if="data.fileType == 1">
						<ChatMessageVideo :data="data"></ChatMessageVideo>
					</div>
					<div v-if="data.fileType == 2">
						<ChatMessageFile :data="data"></ChatMessageFile>
					</div>
				</div>
			</template>
		</div>
	</div>
	<contactAddDialog :dialog-info="dialogInfo"></contactAddDialog>
</template>

<script setup>
	import { ref } from "vue";
	import { storeToRefs } from "pinia";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	const { userInfo } = storeToRefs(userInfoStore);
	import ChatMessageImage from "./chatMessageImage.vue";
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import ChatMessageVideo from "./chatMessageVideo.vue";
	import ChatMessageFile from "./chatMessageFile.vue";
	import ChatUserCard from "./chatUserCard.vue";
	import contactAddDialog from "@/components/contactAddDialog.vue";

	const dialogInfo = ref();

	const props = defineProps({
		data: {
			type: Object,
			default: {}
		},
		currentChatSession: {
			type: Object,
			default: {}
		}
	});

	const visible = ref();
	// 解决方案1：确保正确的 ref 引用和异步处理
	const close = (data) => {
		visible.value.hide();
		dialogInfo.value = data;
	};

	const emit = defineEmits(["showMediaDetail"]);

	const showDetail = (data) => {
		if (data.status == 0) {
			return;
		}
		emit("showMediaDetail", data.uuid);
	};
</script>

<style scoped lang="scss">
	// 通用消息容器样式（自己和对方消息共用）
	.message-my,
	.messaget-other {
		margin-top: 20px;
		display: flex;
		align-items: start;
		margin-bottom: 16px;
		padding: 0 10px;

		// 自己发送的消息样式（右侧显示）
		&.message-my {
			justify-content: flex-end;
			// 自己消息的气泡样式
			.content {
				--bag-color: #95ec69;
				background-color: var(--bag-color); // 微信绿色气泡
				color: #000;
				margin-right: 10px;
				position: relative;
				&::before {
					content: "";
					position: absolute;
					width: 8px; // 箭头宽度
					height: 8px; // 箭头高度
					background-color: var(--bag-color); // 继承气泡背景色
					transform: rotate(45deg);
					// top: 50%;
					// margin-top: -4px; // 垂直居中 (height/2)
					// left: -14px;
					right: -4px;
					top: 13px;
				}
				&:hover {
					--bag-color: #89d961;
					background-color: var(--bag-color);
				}
			}
		}

		// 对方发送的消息样式（左侧显示）
		&.messaget-other {
			justify-content: flex-start;
			// 对方消息的气泡样式
			.content {
				--bag-color: #ffffff;
				background-color: var(--bag-color);
				color: #000;
				margin-left: 10px;
				position: relative;
				&::after {
					content: "";
					position: absolute;
					width: 8px; // 箭头宽度
					height: 8px; // 箭头高度
					background-color: var(--bag-color);
					transform: rotate(45deg);
					left: -4px;
					top: 13px;
				}
				&:hover {
					--bag-color: #ebebeb;
					background-color: var(--bag-color);
				}
			}
			.group-avatar {
				margin-top: 13px;
			}
		}
	}

	// 内容面板通用样式
	.content-panel {
		display: flex;
		max-width: 70%; // 限制最大宽度
		position: relative;

		// 文字消息样式
		&.content-text {
			align-items: flex-start;
		}

		// 媒体消息样式（图片/视频等）
		&.content-media {
			align-items: flex-start;
			.sending {
				margin: 0 10px;
			}
			.media {
				margin: 0 10px;
			}
		}

		// 群组消息特有样式
		&.content-group {
			display: flex;
			flex-direction: column; // 纵向排列（昵称+内容）
			align-items: flex-start;
		}
	}

	.content-text {
		// 消息气泡通用样式
		.content {
			border-radius: 4px;
			word-break: break-word; // 长单词自动换行
			line-height: 1.5;
			padding: 5px 10px;
		}
	}

	// 群组消息的昵称样式
	.nick-name {
		height: 20px;
		line-height: 20px;
		font-size: 12px;
		color: #888;
		margin-bottom: 4px;
		margin-left: 10px;
	}
</style>
