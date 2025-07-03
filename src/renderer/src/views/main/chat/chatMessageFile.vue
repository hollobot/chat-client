<template>
	<div class="wechat-file-message">
		<div class="file-icon">
			<svg viewBox="0 0 24 24" width="40" height="40">
				<path
					fill="#10AEFF"
					d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M13,9V3.5L18.5,9H13z"
				/>
			</svg>
		</div>
		<div class="file-info">
			<div class="file-name">{{ data.fileName }}</div>
			<div class="file-size">{{ formatFileSize(data.fileSize) }}</div>
		</div>
		<div class="file-status">
			<div class="download-btn">下载</div>
		</div>
	</div>
</template>

<script setup>
	import { formatFileSize } from "@/utils/fileUtils";
	const props = defineProps({
		data: {
			type: Object,
			default: {}
		}
	});
</script>

<style lang="scss" scoped>
	.wechat-file-message {
		display: flex;
		align-items: center;
		padding: 10px 15px;
		background-color: #ffffff;
		border-radius: 8px;
		width: 200px;
		height: 60px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		font-family:
			-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		&:hover {
			background-color: #ebebeb;
		}
	}

	.file-icon {
		margin-right: 12px;
		flex-shrink: 0;
	}

	.file-info {
		flex-grow: 1;
		min-width: 0;
	}

	.file-name {
		font-size: 14px;
		color: #333;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-bottom: 2px;
	}

	.file-size {
		font-size: 12px;
		color: #999;
	}

	.file-status {
		margin-left: 10px;
		flex-shrink: 0;
	}

	.download-btn {
		background-color: #07c160;
		color: white;
		border-radius: 4px;
		padding: 5px 12px;
		font-size: 13px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.download-btn:hover {
		background-color: #06ad56;
	}
</style>
