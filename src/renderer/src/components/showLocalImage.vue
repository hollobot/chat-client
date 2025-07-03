<template>
	<div class="image-panel" @click="showIamgeHandler">
		<img
			:src="serverUrl"
			:style="{ width: width + 'px', height: height + 'px' }"
			fit="cover"
		>
			<!-- <template #error>
				<div class="iconfont icon-tupianjiazaishibai"></div>
			</template> -->
		</img>
		<div class="play-panel" v-if="showPlay">
			<span class="iconfont icon-bofang"></span>
		</div>
	</div>
</template>

<script setup>
	import { computed } from "vue";
	import { useGlobalInfoStore } from "@/stores/globalInfoStore";
	const globalInfoStore = useGlobalInfoStore();
	import { storeToRefs } from "pinia";
	const { globalInfo } = storeToRefs(globalInfoStore);
	import { getFile } from "@/utils/fileUtils";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import {getLocalItem} from "@/utils/storage"

	const props = defineProps({
		width: {
			type: Number,
			default: 120
		},
		height: {
			type: Number,
			default: undefined
		},
		showPlay: {
			type: Boolean,
			default: false
		},
		fileId: {
			type: String,
			default: undefined
		},
		partType: {
			type: String,
			default: "avatar"
		},
		fileType: {
			type: Number,
			default: 0
		},
		forceGet: {
			type: Number,
			default: 0
		},
		showCover: {
			type: Boolean,
			default: false
		},
		isShow: {
			type: Boolean,
			default: false
		}
	});

	const serverUrl = computed(() => {
		if (!props.fileId) {
			return "";
		}
		// console.log(`http://127.0.0.1:${globalInfo.value.fileServerProt}/file?
		// fileId=${props.fileId}&partType=${props.partType}
		// &fileType=${props.fileType}&showCover=${props.showCover}&forceGet=${props.forceGet}`);

		const prot = globalInfo.value.fileServerProt || getLocalItem("fileServerProt");

		return `http://127.0.0.1:${prot}/file?
		fileId=${props.fileId}&partType=${props.partType}
		&fileType=${props.fileType}&showCover=${props.showCover}&forceGet=${props.forceGet}&_t=${Date.now()}`;
	});

	// 查看图片强制去服务器获取刷新本地图片
	const showIamgeHandler = async () => {
		const { fileId, partType, fileType, isShow } = props;
		if (!isShow) {
			const resp = await getFile(fileId, partType, fileType, true);
			if (resp) {
				avatarUpdateStore.triggerUpdate(fileId);
			}
			return;
		}

		window.ipcRenderer.send("newWindow", {
			windowId: "media",
			title: "头像查看",
			path: "/showMedai",
			data: {
				currentFileId: fileId,
				fileList: [
					{
						fileId: fileId,
						fileType: fileType,
						partType: partType,
						status: 1,
						forceGet: true
					}
				]
			}
		});
	};
</script>

<style lang="scss" scoped>
	.image-panel {
		width: 100%;
		height: 100%;
		position: relative;
		cursor: pointer; /* 可选：添加指针样式表示可点击 */

		.play-panel {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 1000;
		}

		.iconfont {
			font-size: 40px; /* 调整大小 */
			color: white;
			z-index: 10001; /* 可选：提高图标层级 */
		}
	}
</style>
