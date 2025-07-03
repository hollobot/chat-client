<template>
	<div class="message-time">{{ formatDate(data.sendTime) }}</div>
</template>
<script setup>
	import { formatDate } from "@/utils/timeUtils";
	const props = defineProps({
		data: {
			typeof: Object,
			default: {}
		}
	});
</script>
<style lang="scss" scoped>
	.message-time {
		background: #dadada;
		width: fit-content; /* 宽度适应内容 */
		color: #fafafa;
		font-size: 12px;
		padding: 2px 5px;
		border-radius: 3px;
		margin: 10px auto;
	}
</style>
