<template>
	<el-scrollbar class="group-users" v-loading="loading" element-loading-text="加载中...">
		<template v-for="item in groupUserList" :key="item.id">
			<template v-if="item.status">
				<el-popover
					placement="auto-start"
					:offset="-30"
					:width="280"
					trigger="click"
					:hide-after="0"
					:show-arrow="false"
				>
					<template #reference>
						<div class="user-box cursor">
							<div>
								<ShowLocalImage
									:width="50"
									:height="50"
									:file-id="item.id"
									part-type="avatar"
									:file-type="0"
									:force-get="avatarUpdateStore.get(item.id)"
								></ShowLocalImage>
							</div>
							<span class="name">{{ item.name }}</span>
						</div>
					</template>
					<groupInUserInfo :user-contact-info="item" :userId="item.id" :name="item.name"></groupInUserInfo>
				</el-popover>
			</template>

			<template v-else>
				<el-popover
					ref="visible"
					placement="auto-start"
					:offset="-30"
					:width="320"
					trigger="click"
					:hide-after="0"
					:show-arrow="false"
				>
					<template #reference>
						<div class="user-box cursor">
							<div>
								<ShowLocalImage
									:width="50"
									:height="50"
									:file-id="item.id"
									part-type="avatar"
									:file-type="0"
									:force-get="avatarUpdateStore.get(item.id)"
								></ShowLocalImage>
							</div>
							<span class="name">{{ item.name }}</span>
						</div>
					</template>
					<contactInfoCard
						:contact-info="item"
						:is-emits="true"
						@close-popover="close"
					></contactInfoCard>
				</el-popover>
			</template>
		</template>

		<div class="user-box">
			<div class="iconfont icon-faqiqunliao"></div>
			<span class="name">添加</span>
		</div>
		<div class="user-box">
			<div class="iconfont icon-zuixiaohua"></div>
			<span class="name">移出</span>
		</div>
	</el-scrollbar>

	<div class="send-message">
		<el-button type="primary" @click="handleSendMessage">发消息</el-button>
	</div>

	<contactAddDialog :dialogInfo="dialogInfo"></contactAddDialog>
</template>

<script setup>
	import { nextTick, ref } from "vue";
	import { useRoute, onBeforeRouteUpdate, useRouter } from "vue-router";
	const router = useRouter();
	const route = useRoute();
	import contactInfoCard from "@/components/contactInfoCard.vue";
	import { selectGroup } from "@/api/groupContactApi";
	import groupInUserInfo from "./groupInUserInfo.vue";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { storeToRefs } from "pinia";
	const { userInfo } = storeToRefs(userInfoStore);
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import contactAddDialog from "@/components/contactAddDialog.vue";

	// 群聊用户列表
	const groupUserList = ref();

	// 添加用户props数据
	const dialogInfo = ref();
	const visible = ref(); // 获取 el-popover 的引用
	// 解决方案1：确保正确的 ref 引用和异步处理
	const close = (data) => {
		visible.value.forEach((popover) => {
			if (popover) {
				popover.hide(); // 隐藏所有 popover
			}
		});
		dialogInfo.value = data;
	};

	// 定位到发消息
	const handleSendMessage = () => {
		router.push({
			path: "/main/chat",
			query: {
				contactId: route.query.id,
				timeStamp: new Date().getTime()
			}
		});
	};

	const loading = ref(false); // 添加 loading 状态
	// 查询用户列表
	const selectGroupInfo = async (id) => {
		loading.value = true;
		try {
			const data = await selectGroup(id, userInfo.value.userId);
			groupUserList.value = data.data;
		} catch (error) {
			console.error("查询群组用户失败:", error);
		} finally {
			loading.value = false;
		}
	};

	nextTick(() => {
		selectGroupInfo(route.query.id);
	});

	/**
	 * to 新路由 from 旧路由
	 */
	onBeforeRouteUpdate((to, from, next) => {
		next(); // 确保路由跳转继续
		selectGroupInfo(to.query.id); // 每次路由更新时调用
	});
</script>

<style lang="scss" scoped>
	.group-users {
		:deep(.el-loading-mask) {
			background-color: #f5f5f5; // 修改背景颜色和透明度
		}
		height: calc(100% - 180px);
		:deep(.el-scrollbar__view) {
			padding: 30px 95px;
			display: flex;
			flex-wrap: wrap;
			align-content: flex-start; //多轴（多行start对其）
			gap: 5px;
			.user-box {
				height: 100px;
				width: 70px;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				gap: 10px;
				.iconfont {
					width: 48px;
					height: 48px;
					text-align: center;
					line-height: 48px;
					border: 1px dashed #000;
					border-radius: 4px; /* 设置圆角 */
				}

				.name {
					width: 50px;
					text-align: center;
					white-space: nowrap; /* 防止换行 */
					overflow: hidden; /* 隐藏超出部分 */
					text-overflow: ellipsis; /* 超出文本显示省略号 */
					opacity: 0.5;
				}
			}
			.user-box:hover {
				background-color: #dbdbdb; /* 聚焦时的背景色 */
			}
		}
	}

	.send-message {
		height: 180px;
		width: 100%;
		display: flex;
		justify-content: center;
		:deep(.el-button) {
			width: 150px;
			height: 40px;
			margin-top: 30px;
		}
	}
</style>
