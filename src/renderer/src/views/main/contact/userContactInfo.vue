<template>
	<div
		class="user-contact-info"
		:style="userId ? { width: '250px', height: '380px', margin: 'auto' } : {}"
	>
		<div class="info-top">
			<div class="avater">
				<ShowLocalImage
					:width="60"
					:height="60"
					:file-id="userId ? userId : route.query.id"
					part-type="avatar"
					:file-type="0"
					:force-get="avatarUpdateStore.get(userId ? userId : route.query.id)"
				></ShowLocalImage>
			</div>
			<div class="info-top-centent">
				<div class="remarks info" :title="name ? name : route.query.name">
					<span class="benefits">{{ name ? name : route.query.name }}</span>
					<span
						:class="[
							'iconfont',
							userContactInfo?.sex == 0 ? 'icon-xingbienv' : 'icon-xingbienan'
						]"
						:style="
							userContactInfo?.sex == 0 ? { color: '#E91E63' } : { color: '#4A90E2' }
						"
					/>
				</div>

				<div class="text info benefits" :title="userContactInfo.nickName">
					昵称：{{ userContactInfo.nickName }}
				</div>
				<div class="text info">账号：{{ userContactInfo.userId }}</div>
				<div class="text info">地区：{{ userContactInfo.areaName }}</div>
			</div>

			<el-popover
				ref="visible"
				:width="130"
				popper-class="custom-popover"
				placement="bottom-start"
				trigger="click"
				:show-arrow="false"
				:hide-after="0"
			>
				<template #reference>
					<div class="icon iconfont icon-gengduo" title="更多"></div>
				</template>

				<div class="operation" @click="hidePopover">
					<span class="text">设置备注和标签</span>
					<span class="text borderBottom">设置朋友权限</span>
					<span class="text borderBottom">把他推荐给朋友</span>
					<span class="text borderBottom">设为星标朋友</span>
					<span
						class="text borderBottom"
						@click="changeContactStatus(4, userContactInfo.userId)"
						>加入黑名单</span
					>
					<span
						class="text borderBottom"
						@click="changeContactStatus(2, userContactInfo.userId)"
						>删除联系人</span
					>
				</div>
			</el-popover>
		</div>
		<div class="info-content">
			<div class="top">
				<div class="info-lable">
					<span>备注</span>
					<span>标签</span>
				</div>
				<div class="info-text">
					<span class="benefits">{{ name ? name : route.query.name }}</span>
					<span>家人</span>
				</div>
			</div>

			<div class="bottom">
				<div class="info-lable">
					<span>个性签名</span>
					<span>来源</span>
				</div>
				<div class="info-text">
					<span>{{
						userContactInfo.personalSignature
							? userContactInfo.personalSignature
							: "no signature"
					}}</span>
					<span>通过搜索手机号添加</span>
				</div>
			</div>
		</div>
		<div class="info-bottom">
			<div class="icon" @click="handleSendMessage">
				<span class="iconfont icon-weixinxinxi1"></span>
				<span class="text">发消息</span>
			</div>
			<div class="icon">
				<span class="iconfont icon-dianhua3"></span>
				<span class="text">语言聊天</span>
			</div>
			<div class="icon" @click="videoChat">
				<span class="iconfont icon-video"></span>
				<span class="text">视频聊天</span>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, defineProps } from "vue";
	import { ElMessageBox } from "element-plus";
	import { useRoute, useRouter, onBeforeRouteUpdate } from "vue-router";
	const route = useRoute();
	const router = useRouter();
	import { selectUser } from "@/api/userContactApi";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	import { useContactStore } from "@/stores/contactStore";
	const contactInfo = useContactStore();
	const userInfoStore = useUserInfoStore();
	import { storeToRefs } from "pinia";
	const { userInfo } = storeToRefs(userInfoStore);
	import { changeStatus } from "@/api/userContactApi";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import ShowLocalImage from "@/components/showLocalImage.vue";

	const visible = ref(); // 获取 el-popover 的引用

	// 隐藏 Popover
	const hidePopover = () => {
		visible.value.hide();
	};

	const userContactInfo = ref({
		userId: "",
		personalSignature: "",
		nickName: "",
		areaName: "",
		sex: 1
	});

	const props = defineProps({
		userId: {
			type: String,
			default: null
		},
		name: {
			type: String,
			default: null
		}
	});

	const selectUserInfo = async (id) => {
		const data = await selectUser(id);
		userContactInfo.value = data.data;
	};

	selectUserInfo(props.userId ? props.userId : route.query.id);

	/**
	 * to 新路由 from 旧路由
	 */
	onBeforeRouteUpdate((to, from, next) => {
		next(); // 确保路由跳转继续
		if (to.query.id.substring(0, 1) === "U") {
			selectUserInfo(to.query.id); // 每次路由更新时调用
		}
	});

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

	/**
	 * 删除拉黑联系人
	 * @param contactId
	 */
	const changeContactStatus = async (status, contactId) => {
		// 确认弹窗的配置
		const confirmConfig = {
			2: {
				title: "删除提示",
				message: "确定要删除该好友吗？",
				type: "warning",
				confirmButtonText: "确定删除",
				cancelButtonText: "取消"
			},
			4: {
				title: "拉黑提示",
				message: "确定要将该好友拉入黑名单吗？",
				type: "warning",
				confirmButtonText: "确定拉黑",
				cancelButtonText: "取消"
			}
		};
		try {
			// 显示确认弹窗
			await ElMessageBox.confirm(confirmConfig[status].message, confirmConfig[status].title, {
				confirmButtonText: confirmConfig[status].confirmButtonText,
				cancelButtonText: confirmConfig[status].cancelButtonText,
				type: confirmConfig[status].type,
				draggable: true
			});

			// 用户确认后执行操作
			const data = await changeStatus({
				status,
				userId: userInfo.value.userId,
				contactId
			});

			// 删除拉黑操作成功刷新列表、路由跳转
			if (data.code === 200) {
				// 1、数据刷新
				contactInfo.selectUserList(userInfo.value.userId);
				// 2、路由跳转
				router.push("/main/contact/blank");
			}
		} catch (error) {
			// 用户取消操作，不做任何处理
			if (error === "cancel") return;
			// 其他错误处理
			console.error("操作失败:", error);
		}
	};


	/**
	 * 视频聊天
	 */
	const videoChat = () =>{
		const params = {
			useId:userInfo.value.userId,
			recipient:userContactInfo.value.userId
		}

		// TODO 发送添加视频窗口到主进程
		window.ipcRenderer.send("newWindow", {
			windowId: "videoChat",
			title: "视频通话",
			path: "/videoChat",
			data: params
		});
	}
</script>

<style lang="scss">
	@use "sass:color";
	.custom-popover {
		min-width: 100px !important;
		padding: 0 !important;
	}
	.operation {
		display: flex;
		flex-direction: column;
		.text {
			padding: 5px 0 5px 10px;
			cursor: pointer;
		}
		.borderBottom {
			border-bottom: 1px solid color.scale(black, $lightness: 85%);
		}

		.text:hover {
			background-color: #dddbdb; /* 聚焦时的背景色 */
		}
	}

	.user-contact-info {
		width: 400px;
		height: 400px;
		margin: 30px auto;
		display: flex;
		flex-direction: column;
		justify-content: start;
		.info-top {
			height: 100px;
			border-bottom: 1px solid color.scale(black, $lightness: 85%);
			position: relative;
			display: flex;
			.avater {
				height: 60px;
				width: 60px;
				margin: 10px 20px 0 0;
			}
			.info-top-centent {
				overflow: hidden; /* 超出部分隐藏 */
				width: calc(100% - 120px);
				height: 80px;
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				justify-content: flex-start;
				padding: 0px 10px;
				.info {
					margin-bottom: 3px;
				}
				.remarks {
					width: 100%;
					height: 23.2px;
					font-size: 20px;
					font-weight: 500;
					display: flex;
					.iconfont {
						font-size: 20px;
					}
				}
				.text {
					height: 14.4px;
					font-size: 13px;
					opacity: 0.6; //字体透明度
				}
			}
			.icon {
				width: 17px;
				height: 17px;
				text-align: center;
				line-height: 17px;
				position: absolute;
				top: 0;
				right: 0;
				opacity: 0.3; //字体透明度
			}

			.icon:hover {
				background-color: #a09f9f; /* 聚焦时的背景色 */
			}
		}

		.info-content {
			.top {
				border-bottom: 1px solid color.scale(black, $lightness: 85%);
				display: flex;
				padding: 20px 0px;
				.info-lable {
					width: 80px;
					display: flex;
					flex-direction: column;
					gap: 15px;
					opacity: 0.6; //字体透明度
				}

				.info-text {
					padding: 0px 10px;
					display: flex;
					flex-direction: column;
					gap: 15px;
				}
			}
			.bottom {
				border-bottom: 1px solid color.scale(black, $lightness: 85%);
				display: flex;
				padding: 20px 0px;
				.info-lable {
					width: 80px;
					display: flex;
					flex-direction: column;
					gap: 15px;
					opacity: 0.6; //字体透明度
				}

				.info-text {
					padding: 0px 10px;
					display: flex;
					flex-direction: column;
					gap: 15px;
				}
			}
		}

		.info-bottom {
			width: 100%;
			height: 100px;
			display: flex;
			align-items: center;
			justify-content: space-around;
			.icon {
				width: 70px;
				height: 50px;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				color: #576b95;
				gap: 5px;
				cursor: pointer;
				.iconfont {
					font-weight: 200;
					font-size: 20px;
				}
				.text {
					font-size: 12px;
					font-weight: 200;
				}
			}

			.icon:hover {
				background-color: #dbdbdb; /* 聚焦时的背景色 */
			}
		}
	}
</style>
