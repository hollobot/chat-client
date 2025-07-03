<template>
	<div class="layout">
		<div class="letf-content">
			<slot name="left-content">
				<div class="top">
					<div class="left-drag" />
					<slot name="contact-search"> </slot>
				</div>
				<div class="data-list scroll-content">
					<slot name="data-list"></slot>
				</div>
			</slot>
		</div>
		<div class="right-content">
			<slot name="right-content">
				<div class="right-drag">
					<slot name="right-drag"></slot>
				</div>
				<div class="right-no-drag">
					<slot name="right-no-drag"></slot>
				</div>
			</slot>
		</div>
		<windowControlButton></windowControlButton>
	</div>
</template>

<script setup>
	import windowControlButton from "@/components/windowControlButton.vue";
</script>

<style lang="scss" scoped>
	@use "sass:color";
	.layout {
		width: 100%;
		height: 100%;
		display: flex;
		.letf-content {
			width: 230px;
			height: 100%;
			border-right: 1px solid #07c160 !important;
			.top {
				height: 60px;
				.left-drag {
					height: 25px;
					/* 设置该属性表明这是可拖拽区域，用来移动窗口 */
					-webkit-app-region: drag;
				}
				background-color: #F7F7F7;
			}
			.data-list {
				height: calc(100vh - 60px);
				background-color: #E6E5E5;
			}
		}

		.right-content {
			background-color: #f5f5f5;
			width: calc(100% - 230px);
			height: 100%;
			.right-drag {
				position: relative; /* 父容器需要设置 relative */
				width: 100%;
				height: 60px;
				/* 设置该属性表明这是可拖拽区域，用来移动窗口 */
				-webkit-app-region: drag;
			}
			.right-no-drag {
				width: 100%;
				height: calc(100% - 60px);
			}
		}
	}
</style>
