<template>
	<div class="admin-frame-layout">
		<div class="search-page" v-if="isShowSearch">
			<slot name="search"></slot>
		</div>
		<div class="list-page scroll-content">
			<slot name="list"></slot>
		</div>
	</div>
</template>
<script setup>
	const props = defineProps({
		isShowSearch: {
			type: Boolean,
			default: true
		}
	});
</script>
<style lang="scss" scoped>
	.admin-frame-layout {
		height: 100%;
		.search-page {
			padding: 0 20px;
			height: 50px;
			background-color: #fff;
			border-radius: 4px;
			box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
			margin-bottom: 10px;
			display: flex;
			align-items: center;
		}

		.list-page {
			margin-bottom: 10px;
			height: calc(100% - 4px);
			background-color: #fff;
			border-radius: 4px;
			box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
			overflow-y: auto;
		}
	}
</style>
