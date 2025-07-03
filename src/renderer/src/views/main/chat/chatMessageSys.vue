<template>
	<ChatMessageTime :data="data"></ChatMessageTime>
	<div class="message-sys">{{ dataMessage.messageContent }}</div>
</template>
<script setup>
	import { computed } from "vue";
	import ChatMessageTime from "./chatMessageTime.vue";

	const props = defineProps({
		data: {
			typeof: Object,
			default: {}
		}
	});

	const dataMessage = computed(() => {
		const data = { ...props.data };
		if (data.messageType == 1) {
			data.messageContent = "添加好友成功，可以聊天了";
		}
		return data;
	});
</script>
<style lang="scss" scoped>
	.message-sys {
		text-align: center;
		font-size: 12px;
		color: #999999;
		margin-bottom: 20px;
	}
</style>
