<template>
	<template v-if="!showResizeOverlay">
		<div class="main">
			<div class="aside">
				<div class="avatar">
					<el-popover
						ref="visible"
						:show-arrow="false"
						:hide-after="0"
						:width="320"
						trigger="click"
					>
						<template #reference>
							<div class="avatar-image">
								<ShowLocalImage
									:width="35"
									:height="35"
									:file-id="userInfo.userId"
									part-type="avatar"
									:file-type="0"
									:force-get="avatarUpdateStore.get(userInfo.userId)"
								></ShowLocalImage>
							</div>
						</template>
						<div @click="hidePopover">
							<contactInfoCard
								:contactInfo="myInfo"
								:is-show="true"
							></contactInfoCard>
						</div>
					</el-popover>
				</div>
				<div class="aside-top">
					<div
						v-for="item in topMenuList"
						:class="[
							'menu iconfont',
							item.class,
							route.path.includes(item.path) ? 'is-click' : ''
						]"
						:title="item.title"
						@click="isClick(item)"
					>
						<Badge v-if="item.title == '聊天'" :count="messageCount.chatCount"></Badge>

						<Badge v-else-if="item.title == '通讯录'" :count="contactNoReadSum"></Badge>
					</div>
				</div>
				<div class="aside-bottom">
					<div
						v-for="item in bottomMenuList"
						:class="[
							'menu iconfont',
							item.class,
							route.path.includes(item.path) ? 'is-click' : ''
						]"
						:title="item.title"
						@click="isClick(item)"
					></div>
				</div>
			</div>
			<div class="content">
				<router-view />
			</div>
		</div>
	</template>
	<template v-if="showResizeOverlay">
		<transition name="fade">
			<div class="resize-overlay">
				<div class="pulse-loader">
					<div class="pulse-container">
						<div class="pulse-bubble pulse-bubble-1"></div>
						<div class="pulse-bubble pulse-bubble-2"></div>
						<div class="pulse-bubble pulse-bubble-3"></div>
					</div>
				</div>
			</div>
		</transition>
	</template>
</template>

<script setup>
	import { ref, onMounted, nextTick, computed } from "vue";
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import contactInfoCard from "@/components/contactInfoCard.vue";
	import { RouterView } from "vue-router";
	import { useRouter, useRoute } from "vue-router";
	const route = useRoute();
	const router = useRouter();
	import { getLocalItem } from "@/utils/storage";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { storeToRefs } from "pinia";
	const { userInfo } = storeToRefs(userInfoStore);
	import { useGlobalInfoStore } from "@/stores/globalInfoStore";
	const globalInfoStore = useGlobalInfoStore();
	import { setLocalItem } from "@/utils/storage";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import { fileConfig } from "@/api/chatApi";
	import { useSysSettingStore } from "@/stores/sysSettingStore";
	const sysSettingStore = useSysSettingStore();
	import { useMessageCountStore } from "@/stores/messageCountStore";
	const messageCountStore = useMessageCountStore();
	const { messageCount } = storeToRefs(messageCountStore);
	import Badge from "@/components/badge.vue";
	const showResizeOverlay = ref(false);
	import { useContactStore } from "@/stores/contactStore";
	const contactStore = useContactStore();

	const myInfo = ref();

	const visible = ref(); // 获取 el-popover 的引用

	// 计算未读联系人申请数
	const contactNoReadSum = computed(() => {
		return messageCount.value.contactCount + messageCount.value.groupCount;
	});
	// 隐藏 Popover
	const hidePopover = () => {
		visible.value.hide();
	};

	const topMenuList = ref([
		{
			path: "/main/chat",
			class: "icon-weixinxinxi1",
			title: "聊天"
		},
		{
			path: "/main/contact",
			class: "icon-fangkeguanli",
			title: "通讯录"
		}
		// {
		// 	path: "/main/undeveloped",
		// 	class: "icon-wechatEnshrine",
		// 	title: "收藏"
		// },
		// {
		// 	path: "/main/undeveloped",
		// 	class: "icon-weixinwenjian",
		// 	title: "文件"
		// },
		// {
		// 	path: "/main/undeveloped",
		// 	class: "icon-weixinpengyouquan",
		// 	title: "朋友圈"
		// },
		// {
		// 	path: "/main/undeveloped",
		// 	class: "icon-weixinshipinhao",
		// 	title: "视频号"
		// },
		// {
		// 	path: "/main/undeveloped",
		// 	class: "icon-weixinkanyikan",
		// 	title: "看一看"
		// },
		// {
		// 	path: "/main/undeveloped",
		// 	class: "icon-souyisou",
		// 	title: "搜一搜"
		// }
	]);

	const bottomMenuList = ref([
		{
			path: "/main/undeveloped",
			class: "icon-weixinxiaochengxu",
			title: "小程序面板"
		},
		{
			path: "/main/undeveloped",
			class: "icon-shouji",
			title: "手机"
		},
		{
			path: "/main/setting",
			class: "icon-shezhi",
			title: "设置"
		}
	]);

	/**
	 * 点击触发 动态变化class
	 * @param item
	 */
	const isClick = (item) => {
		router.push(item.path);
	};

	// 获取文件服务器端口
	const getFileServerProt = (userId) => {
		window.ipcRenderer.on("fileServerProtCallback", (e, prot) => {
			globalInfoStore.setInfo("fileServerProt", prot);
			setLocalItem("fileServerProt", prot);
		});

		window.ipcRenderer.send("fileServerProt", userId + "loaclServerProt");
	};

	const remover = () => {
		window.ipcRenderer.removeAllListeners("fileServerProtCallback");
		window.ipcRenderer.removeAllListeners("localCountApplyCallback");
		window.ipcRenderer.removeAllListeners("onReLoginCallback");
	};

	// 删除主进程store的session
	const delCurrentSession = () => {
		window.ipcRenderer.send("delCurrentSession");
	};

	// 获取联系人未读数
	const localCountApply = () => {
		window.ipcRenderer.send("localCountApply");
	};

	const onLocalCountApply = () => {
		window.ipcRenderer.on("localCountApplyCallback", (e, data) => {
			const { contactNoRead, groupNoRead } = data;
			messageCountStore.setCount("contactCount", contactNoRead, true);
			messageCountStore.setCount("groupCount", groupNoRead, true);
		});
	};

	// 监听重新登录
	const onReLoginCallback = () => {
		window.ipcRenderer.on("reLoginCallback", (e) => {
			router.push("/login");
		});
	};

	onMounted(async () => {
		// 删除当前选择会话
		delCurrentSession();
		remover();
		userInfoStore.setUserInfo(getLocalItem("userInfo"));
		// 显示加载遮罩
		showResizeOverlay.value = true;
		// 使用 setTimeout 延迟路由跳转，给遮罩动画和数据处理留出时间
		setTimeout(() => {
			showResizeOverlay.value = false;
		}, 1000);
		nextTick(() => {
			myInfo.value = {
				type: "USER", //联系人类型
				id: userInfo.value.userId,
				name: userInfo.value.nickName, //昵称
				areaName: userInfo.value.areaName, //地区名称
				sex: userInfo.value.sex, //用户性别
				status: "1"
			};
		});
		// 监听重新登录
		onReLoginCallback();
		// 获取文件服务器端口保存的本地
		getFileServerProt(userInfo.value.userId);
		// 获取后端服务器文件限制参数
		const data = await fileConfig();
		sysSettingStore.setSysSetting(data.data);
		onLocalCountApply();
		// 获取未读好友信息数量
		localCountApply();
		// 查询联系人保存到store里
		contactStore.selectUserList(userInfo.value.userId);
	});
</script>

<style lang="scss" scoped>
	.main {
		width: 100vw;
		height: 100vh;
		display: flex;
		overflow: hidden; //不允许出现滑动条

		.aside {
			width: 50px;
			height: 100%;
			background-color: #2e2e2e;
			display: flex;
			flex-direction: column;
			align-items: center;
			.avatar {
				/* 设置该属性表明这是可拖拽区域，用来移动窗口 */
				width: 100%;
				height: 100px !important;
				-webkit-app-region: drag;
				display: flex;
				justify-content: center;
				align-items: center;
				.avatar-image {
					-webkit-app-region: no-drag;
				}
			}
			.aside-top {
				width: 100%;
				flex: 1;
				display: flex;
				flex-direction: column;
				align-items: center;
				.is-click {
					color: #07c160 !important;
				}
				.menu {
					position: relative;
					opacity: 0.6; //字体透明度
					font-size: 18px;
					color: #dbdbdb;
					margin-bottom: 25px;
				}
				.menu:hover {
					opacity: 1; //字体透明度
				}
			}
			.aside-bottom {
				width: 100%;
				height: 120px;
				display: flex;
				flex-direction: column;
				align-items: center;
				.is-click {
					color: #07c160 !important;
				}
				.menu {
					opacity: 0.6; //字体透明度
					font-size: 18px;
					color: #dbdbdb;
					margin-bottom: 25px;
				}
				.menu:hover {
					opacity: 1; //字体透明度
				}
			}
		}
		.content {
			width: calc(100vw - 50px);
			height: 100%;
		}
	}

	/* 窗口尺寸变化遮罩层样式 */
	.resize-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.95);
		z-index: 9999;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.pulse-loader {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.pulse-container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 15px;
	}

	.pulse-bubble {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		margin: 0 3px;
		background-color: #07c160;
	}

	.pulse-bubble-1 {
		animation: pulse 0.6s ease 0s infinite alternate;
	}

	.pulse-bubble-2 {
		animation: pulse 0.6s ease 0.15s infinite alternate;
	}

	.pulse-bubble-3 {
		animation: pulse 0.6s ease 0.3s infinite alternate;
	}

	@keyframes pulse {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0.2;
			transform: scale(0.8);
		}
	}

	.loading-text {
		color: #07c160;
		font-size: 16px;
		margin-top: 10px;
	}

	/* 淡入淡出动画 */
	.fade-enter-active,
	.fade-leave-active {
		transition: opacity 0.3s ease;
	}

	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
	}
</style>
