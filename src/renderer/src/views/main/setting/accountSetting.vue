<template>
	<div class="user-contact-info">
		<div class="info-top">
			<div class="avater">
				<ShowLocalImage
					:width="60"
					:height="60"
					:file-id="userInfo.userId"
					part-type="avatar"
					:file-type="0"
					:force-get="avatarUpdateStore.get(userInfo.userId)"
				></ShowLocalImage>
			</div>
			<div class="info-top-centent">
				<div class="remarks info" :title="userInfo.nickName">
					<span class="benefits">{{ userInfo.nickName }}</span>
					<span
						:class="[
							'iconfont',
							userInfo.sex === 0 ? 'icon-xingbienv' : 'icon-xingbienan'
						]"
						:style="userInfo.sex === 0 ? { color: '#E91E63' } : { color: '#4A90E2' }"
					/>
				</div>

				<div class="text info">账号：{{ userInfo.userId }}</div>
				<div class="text info">地区：{{ userInfo.areaName }}</div>
			</div>

			<el-popover
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

				<div class="operation">
					<span
						class="text borderBottom"
						@click="toRouter('/main/setting/accountSetting/updateInfo', '修改个人信息')"
						>修改个人信息</span
					>
					<span
						class="text borderBottom"
						@click="toRouter('/main/setting/accountSetting/updatePwd', '修改密码')"
						>修改密码</span
					>
				</div>
			</el-popover>
		</div>
		<div class="info-content">
			<div class="top">
				<div class="info-lable">朋友权限</div>
				<div class="info-text">
					{{ userInfo.joinType == 1 ? "加我为好友时需要验证" : "加我为好友时无需验证" }}
				</div>
			</div>

			<div class="bottom">
				<div class="info-lable">个性签名</div>
				<div class="info-text benefits" :title="userInfo.personalSignature">
					{{ userInfo.personalSignature }}
				</div>
			</div>
		</div>
		<div class="logout">
			<el-button type="primary" plain @click="logout">退出登录</el-button>
		</div>
	</div>
</template>

<script setup>
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { storeToRefs } from "pinia";
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import { useRouter } from "vue-router";
	const router = useRouter();
	import { userLogout } from "@/api/userApi";
	import { ElMessage } from "element-plus";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();

	const { userInfo } = storeToRefs(userInfoStore);

	const toRouter = (path, title) => {
		router.push({
			path: path,
			query: {
				title: title
			}
		});
	};

	/**
	 * 退出
	 */
	const logout = async () => {
		// 1、调用退出接口
		const data = await userLogout();
		// 2、判断是否退出成功
		if (!data.data) {
			ElMessage({
				message: "退出失败！",
				type: "error"
			});
			return;
		}
		ElMessage({
			message: "退出成功！",
			type: "success"
		});

		// 3、删除本地token信息
		localStorage.removeItem("token");
		// 4、退出登录
		window.ipcRenderer.send("reLogin");
	};
</script>

<style lang="scss">
	@use "sass:color";
	.custom-popover {
		min-width: 60px !important;
		width: 110px !important;
		padding: 0 !important;
	}
	.operation {
		display: flex;
		width: 110px;
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
		width: 300px;
		height: 400px;
		margin: 30px auto;
		display: flex;
		flex-direction: column;
		gap: 10px;
		.info-top {
			height: 100px;
			position: relative;
			display: flex;
			.avater {
				height: 60px;
				width: 60px;
				margin: 0 20px 0 0;
			}
			.info-top-centent {
				overflow: hidden; /* 超出部分隐藏 */
				width: calc(100% - 120px);
				height: 60px;
				display: flex;
				flex-direction: column;
				align-items: start;
				justify-content: center;
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
					opacity: 0.6; //字体透明度
				}

				.info-text {
					padding: 0px 10px;
				}
			}

			.bottom {
				border-bottom: 1px solid color.scale(black, $lightness: 85%);
				padding: 20px 0px;
				display: flex;
				justify-content: start;
				.info-lable {
					flex-shrink: 0; /* 防止被挤压 */
					width: 80px;
					opacity: 0.6; //字体透明度
				}

				.info-text {
					width: 100%;
					padding: 0px 10px;
				}
			}
		}

		.logout {
			margin-top: 30px;
			display: flex;
			justify-content: center;
		}
	}
</style>
