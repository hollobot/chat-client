<template>
	<div class="chat-session" @click="handleSendMessage">
		<div v-if="sessionInfo.contactType == 1" class="type-label">群</div>
		<div class="avatar">
			<ShowLocalImage
				:width="40"
				:height="40"
				:file-id="sessionInfo.contactId"
				part-type="avatar"
				:file-type="0"
				:force-get="avatarUpdateStore.get(sessionInfo.contactId)"
			>
			</ShowLocalImage>
		</div>
		<div class="info">
			<div class="nick-name-time">
				<div class="nick-name benefits" v-html="sessionInfo.contactName"></div>
			</div>
			<div class="last-message benefits" v-html="sessionInfo.lastMessage"></div>
		</div>
	</div>
</template>
<script setup>
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import { useRouter } from "vue-router";
	const router = useRouter();

	const props = defineProps({
		sessionInfo: {
			type: Object,
			default: () => ({
				contactId: "U00000000000",
				contactName: "刘骜机器人",
				contactType: 0,
				lastMessage: "欢迎使用chat聊天系统"
			})
		}
	});

	const emits = defineEmits(["clearSearch"]);

	// 定位到发送消息方法
	const handleSendMessage = () => {
		// 清除搜索状态
		emits("clearSearch");
		router.push({
			path: "/main/chat",
			query: {
				contactId: props.sessionInfo.contactId,
				timeStamp: new Date().getTime()
			}
		});
	};
</script>

<style lang="scss" scoped>
	:deep(.highlight) {
		color: #19ad19 !important;
		padding: 0 2px;
	}

	.chat-session {
		position: relative;
		height: 60px;
		display: flex;
		align-items: center;

		.type-label {
			position: absolute;
			left: 1px;
			top: 1px;
			background-color: #6bbadd;
			font-size: 11px;
			color: white;
			border-radius: 3px;
		}

		.avatar {
			position: relative;
			flex-shrink: 0;
			margin: 10px;
		}

		.info {
			display: flex;
			flex-direction: column;
			height: 40px;
			width: calc(100% - 60px);
			.nick-name-time {
				height: 20px;
				width: 100%;
				display: flex;
				white-space: nowrap; /* 禁止换行 */
				.nick-name {
					width: 110px;
					line-height: 20px;
					font-size: 14px;
				}
			}
			.last-message {
				height: 20px;
				line-height: 20px;
				opacity: 0.6;
				font-size: 12px;
				flex: 1;
			}
		}
	}
	.chat-session:hover {
		background-color: #d9d8d8; /* 聚焦时的背景色 */
	}
</style>
