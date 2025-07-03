<template>
	<div class="control-button no-drag">
		<div
			v-if="winConfig.isShowPin"
			class="iconfont icon-guding"
			:style="isPin ? { backgroundColor: '#ddd', color: '#07c160' } : {}"
			:title="!isPin ? '置顶' : '取消置顶'"
			@click="pinWindow"
		></div>
		<div
			v-if="winConfig.isShowMinimize"
			class="iconfont icon-zuixiaohua"
			title="最小化"
			@click="minWindow"
		></div>
		<div
			v-if="winConfig.isShowMaximize"
			:class="['iconfont', isMax ? 'icon-zuidahua' : 'icon-3zuidahua-1']"
			:title="!isMax ? '最大化' : '向下还原'"
			@click="maxWindow"
		></div>
		<div class="icon-close iconfont icon-guanbi" title="关闭" @click="closeWindow"></div>
	</div>
</template>

<script setup>
	import { ref, onMounted } from "vue";
	import { isEmpty } from "@/utils/stringUtils";

	const isMax = ref(false);

	const isPin = ref(false);

	const props = defineProps({
		winConfig: {
			type: Object,
			default: {
				isShowPin: {
					type: Boolean,
					default: true
				},
				isShowMinimize: {
					type: Boolean,
					default: true
				},
				isShowMaximize: {
					type: Boolean,
					default: true
				},
				closeType: {
					type: Number,
					default: 1 //0:退掉进程 1：托盘
				}
			}
		}
	});

	const emit = defineEmits(["closeCallback"]);

	/**
	 * 初始化 是否置顶窗口
	 */
	const initPin = () => {
		const stringData = sessionStorage.getItem("pin");
		if (isEmpty(stringData)) {
			return;
		}
		isPin.value = !JSON.parse(stringData);
		pinWindow();
	};

	/**
	 * 点击控制窗口
	 * @param action
	 * @param closeType
	 */
	const controlClick = (action, type) => {
		window.ipcRenderer.send("sendWinControl", { action, type });
	};

	const closeWindow = () => {
		controlClick("close", props.winConfig.closeType.default);
		emit("closeCallback");
	};

	const pinWindow = () => {
		isPin.value = !isPin.value;
		controlClick("pin", isPin.value);
		sessionStorage.setItem("pin", JSON.stringify(isPin.value));
	};

	const minWindow = () => {
		controlClick("min");
	};

	const maxWindow = () => {
		isMax.value = !isMax.value;
		controlClick("max", isMax.value);
	};

	onMounted(() => {
		initPin();
	});
</script>

<style lang="scss" scoped>
	.control-button {
		position: absolute;
		top: 0px;
		right: 0px;
		z-index: 101;
		overflow: hidden;
		display: flex;
		.iconfont {
			opacity: 0.6;
			font-size: 12px;
			color: black;
			padding: 5px 10px;
			&:hover {
				background-color: #ddd;
			}
		}
		.icon-close {
			&:hover {
				background-color: #fb7373;
				color: #fff;
			}
		}
	}
</style>
