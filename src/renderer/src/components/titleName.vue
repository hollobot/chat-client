<template>
	<div v-if="titleName" class="title">
		<div class="title-name">{{ titleName }}</div>
	</div>
</template>

<script setup>
	const props = defineProps({
		titleName: {
			type: String,
			default: null
		}
	});
</script>

<style lang="scss" scoped>
	.title {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		border-bottom: #e7e7e7 solid 1px;
		.title-name {
			height: 30px;
			margin-left: 20px;
			font-size: 20px;
			font-weight: 550;
		}
	}
</style>
