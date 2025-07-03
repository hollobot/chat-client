<template>
	<div class="badge" v-if="count > 0">
		{{ count > 99 ? "99+" : count }}
	</div>
</template>
<script setup>
	const props = defineProps({
		count: {
			type: Number,
			default: 0
		}
	});
</script>

<style lang="scss" scoped>
	.badge {
		/* 基础样式 */
		position: absolute;
		top: -8px;
		right: -8px;
		min-width: 16px;
		height: 16px;
		background: #ff3b30; /* 微信红 */
		border-radius: 10px;

		/* 文字样式 */
		color: white;
		font-size: 8px;
		line-height: 16px;
		text-align: center;

		/* 阴影效果 */
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

		/* 数字过渡动画 */
		transition: all 0.3s ease;
	}
</style>
