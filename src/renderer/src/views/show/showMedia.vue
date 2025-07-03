<template>
	<div class="media-window">
		<div class="win-title drag"></div>
		<div class="media-op no-drag">
			<!-- @dblclick.stop  监听双击事件 + 阻止冒泡。 -->
			<div
				:class="['iconfont icon-shangyizhang', currentIndex == 0 ? 'not-allow' : '']"
				@dblclick.stop
				title="上一张"
				@click="next(-1)"
			></div>

			<div
				:class="[
					'iconfont icon-xiayizhang',
					currentIndex >= allFileList.length - 1 ? 'not-allow' : ''
				]"
				@dblclick.stop
				title="下一张"
				@click="next(1)"
			></div>
			<template v-if="fileList[0].fileType == 0">
				<el-divider direction="vertical" />
				<div
					class="iconfont icon-fangda icon-base"
					@click.stop="changeSize(0.1)"
					@dblclick.stop
					title="放大"
				></div>
				<div
					class="iconfont icon-suoxiao icon-base"
					@click.stop="changeSize(-0.1)"
					@dblclick.stop
					title="缩小"
				></div>
				<el-divider direction="vertical" />
				<div
					:class="[
						'icon-base iconfont',
						isOnetoOne ? 'icon-yuanshidaxiao' : 'icon-shiyingchuangkou'
					]"
					@click.stop="resize"
					@dblclick.stop
					:title="isOnetoOne ? '图片使用窗口大小' : '图片原始大小'"
				></div>
				<div
					class="icon-base iconfont icon-zhengxuanzhuan"
					@click.stop="rotate"
					@dblclick.stop
					title="旋转"
				></div>
				<el-divider direction="vertical" />
			</template>
			<div
				class="icon-base iconfont icon-xiazai"
				@click.stop="downloadFile"
				@dblclick.stop
				title="另存为..."
			></div>
		</div>
		<div class="media-panel">
			<Viewer
				v-if="fileList[0].fileType == 0 && fileList[0].status == 1"
				:options="options"
				@inited="inited"
				:images="fileList"
			>
				<img v-show="false" :src="fileList[0].url" />
			</Viewer>
			<div
				ref="player"
				id="player"
				v-show="fileList[0].fileType == 1 && fileList[0].status == 1"
				style="width: 100%; height: 100%"
			></div>
			<div v-if="fileList[0].fileType == 2" class="file-panel">
				<div class="file-item">文件名：{{ fileList[0].fileName }}</div>
				<div class="file-item">文件大小：{{ fileList[0].fileSize }}</div>
				<div class="file-item donwload" @click="downloadFile">下载文件</div>
			</div>
			<div v-if="fileList[0].status == 0" class="loading">加载中....</div>
		</div>

		<WindowControlButton @close-callback="closeWin"></WindowControlButton>
	</div>
</template>
<script setup>
	import WindowControlButton from "@/components/windowControlButton.vue";
	import { onMounted, onUnmounted, ref } from "vue";
	import "viewerjs/dist/viewer.css";
	import { component as Viewer } from "v-viewer";
	import Dplayer from "dplayer";
	import { getLocalItem } from "@/utils/storage";

	const currentIndex = ref(0);
	const allFileList = ref([]);
	const fileList = ref([{ fileType: 0, status: 0 }]);

	const options = ref({
		inline: true, // 必需的内联模式
		toolbar: false, // 关闭工具栏
		navbar: false, // 关闭缩略图导航
		button: false, // 关闭所有操作按钮
		title: false, // 关闭标题显示
		zoomRatio: 0.1,
		zoomOnWheel: false,
		mousewheel: false // 禁用滚轮缩放（你用自定义实现）
	});

	const viewerMy = ref(null);
	const inited = (e) => {
		viewerMy.value = e;
	};

	// 切换
	const next = (index) => {
		if (
			currentIndex.value + index < 0 ||
			currentIndex.value + index > allFileList.value.length - 1
		) {
			return;
		}
		currentIndex.value += index;
		// 获取选中文件
		getCurrentFile();
	};

	// 放大缩小
	const changeSize = (zoomRatio) => {
		viewerMy.value.zoom(zoomRatio, true);
	};

	// 旋转
	const rotate = () => {
		viewerMy.value.rotate(90, true);
	};

	// 适应窗口
	const isOnetoOne = ref(false);
	const resize = () => {
		isOnetoOne.value = !isOnetoOne.value;
		if (!isOnetoOne.value) {
			// 适应窗口
			viewerMy.value.zoomTo(viewerMy.value.initialImageData.ratio, true);
		} else {
			// 原始大小
			viewerMy.value.zoomTo(1, true);
		}
	};

	// 滚轮缩放图片
	const onWheel = (e) => {
		if (fileList.value[0].fileType !== 0) {
			return;
		}
		if (e.deltaY < 0) {
			changeSize(0.1);
		} else {
			changeSize(-0.1);
		}
	};

	// 关闭
	const closeWin = () => {
		// 暂停
		dplayer.value.pause();
	};

	// 另存为
	const downloadFile = () => {
		const curFile = allFileList.value[currentIndex.value];
		window.ipcRenderer.send("downloadFile", {
			partType: curFile.partType,
			fileId: curFile.fileId
		});
	};

	// 获取文件
	const getCurrentFile = () => {
		// 不管怎么操作都需要暂停视频
		if (dplayer.value) {
			// 暂停
			dplayer.value.pause();
		}
		const curFile = allFileList.value[currentIndex.value];
		const url = getUrl(curFile);
		fileList.value.splice(0, 1, {
			url: url,
			fileType: curFile.fileType,
			status: 1,
			fileSize: curFile.fileSize,
			fileName: curFile.fileName
		});
		// 处理视频
		if (curFile.fileType == 1) {
			dplayer.value.switchVideo({
				url: url
			});
		}
	};

	const getUrl = (curFile) => {
		return `http://127.0.0.1:${getLocalItem("fileServerProt")}/file?
		fileId=${curFile.fileId}&partType=${curFile.partType}
		&fileType=${curFile.fileType}&showCover=false&forceGet=${curFile.forceGet}&_t=${Date.now()}`;
	};

	const player = ref();
	const dplayer = ref();
	const initPlayer = () => {
		dplayer.value = new Dplayer({
			element: player.value, //DOM 元素
			theme: "#b7daff", //主题风格
			screenshot: true, //开启截屏
			video: {
				url: ""
			}
		});
	};

	const remover = () => {
		window.ipcRenderer.removeAllListeners("pageInitData");
	};

	onMounted(() => {
		remover();
		// 初始化播放器
		initPlayer();
		// 添加滚轮事件监听
		window.addEventListener("wheel", onWheel);
		// 接受主进程发送过来的文件数据
		window.ipcRenderer.on("pageInitData", (e, data) => {

			const { fileList, currentFileId } = data;
			allFileList.value = fileList;
			if (fileList.length == 1) {
				currentIndex.value = 0;
			} else {
				const index = allFileList.value.findIndex((item) => {
					return item.fileId == currentFileId;
				});
				currentIndex.value = index;
			}
			// 获取当前文件
			getCurrentFile();
		});
	});

	onUnmounted(() => {
		window.ipcRenderer.removeAllListeners("pageInitData");
		window.removeEventListener("wheel", onWheel);
	});
</script>
<style lang="scss" scoped>
	.media-window {
		height: calc(100vh);
		background: #fff;
		z-index: 100;
		.win-title {
			height: 25px;
		}
		.media-op {
			z-index: 101;
			position: absolute;
			top: 0px;
			left: 5px;
			display: flex;
			align-items: center;
			.iconfont {
				opacity: 0.6;
				font-size: 12px;
				color: black;
				padding: 5px 8px;
				cursor: pointer; /* 点击 */
				&:hover {
					background-color: #ddd;
				}
			}
			.icon-base {
				font-size: 14px;
			}
			.not-allow {
				opacity: 0.1 !important;
				cursor: not-allowed; /* 不可操作 */
				&:hover {
					background-color: #fff;
				}
			}
		}
		.media-panel {
			height: calc(100% - 25px);
			display: flex;
			justify-content: center;
			align-items: center;
			:deep(.viewer-backdrop) {
				background: #f5f5f5;
			}
		}
	}
</style>
