<template>
	<div :class="['chat-session', currentSession ? 'active' : '']">
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
			<Badge :count="sessionInfo.noReadCount"></Badge>
		</div>
		<div class="info">
			<div class="nick-name-time">
				<div class="nick-name benefits">{{ sessionInfo.contactName }}</div>
				<div class="time">{{ formatDate(sessionInfo.lastReceiveTime) }}</div>
			</div>
			<div class="last-message benefits" v-html="sessionInfo.lastMessage"></div>
		</div>
		<div v-if="sessionInfo.topType == 1" class="top iconfont icon-guding"></div>
	</div>
</template>

<script setup>
	import Badge from "@/components/badge.vue";
	import { onMounted } from "vue";
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import { formatDate } from "@/utils/timeUtils";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	const props = defineProps({
		sessionInfo: {
			type: Object,
			default: {
				contactId: "U00000000000",
				contactName: "刘骜机器人",
				contactType: 0,
				lastMessage: "欢迎使用chat聊天系统",
				lastReceiveTime: 1743151226312,
				memberCount: 0,
				noReadCount: 0,
				sessionId: "428e939b35e7cebfb444876e28a79dc5",
				status: 1,
				topType: 0,
				userId: "U46136020250"
			}
		},
		currentSession: {
			type: Boolean,
			default: false
		}
	});

	onMounted(() => {});
</script>

<style lang="scss" scoped>
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
				.time {
					width: 50px;
					line-height: 20px;
					opacity: 0.6;
					font-size: 12px;
					text-align: end;
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

		.top {
			position: absolute;
			right: 1px;
			top: 1px;
			opacity: 0.6;
			font-size: 12px;
		}
	}
	.chat-session:hover {
		background-color: #d9d8d8; /* 聚焦时的背景色 */
	}

	.active {
		background-color: #c8c6c5 !important;
	}
</style>
