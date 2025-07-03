<template>
	<div class="list-data">
		<template v-if="applyInfo.type == 1">
			<div class="avatar">
				<ShowLocalImage
					:width="styleInfo.avatar.size"
					:height="styleInfo.avatar.size"
					:file-id="applyInfo.recipientId"
					part-type="avatar"
					:file-type="0"
					:force-get="avatarUpdateStore.get(applyInfo.recipientId)"
				></ShowLocalImage>
			</div>
			<div
				class="info"
				:style="{
					width: styleInfo.info.width,
					height: styleInfo.avatar.size + 'px',
					paddingLeft: styleInfo.info.paddingLeft
				}"
			>
				<div class="info-title" :title="applyInfo.remark">
					<span class="benefits">{{ applyInfo.remark }}</span>
					<span
						:class="[
							'iconfont',
							applyInfo.recipientSex == 0 ? 'icon-xingbienv' : 'icon-xingbienan'
						]"
						:style="
							applyInfo.recipientSex == 0
								? { color: '#E91E63' }
								: { color: '#4A90E2' }
						"
					/>
				</div>
				<div class="info-text">留言:&nbsp;{{ applyInfo.applyInfo }}</div>
				<div class="info-text">正在验证您的邀请:&nbsp;{{ applyInfo.applyTime }}</div>
			</div>

			<el-button
				v-if="applyInfo.status == 0"
				class="no-border"
				type="primary"
				:style="{ width: styleInfo.button.width }"
				disabled
			>
				等待验证
			</el-button>
			<el-button
				v-else-if="applyInfo.status == 1"
				class="no-border"
				type="primary"
				:style="{ width: styleInfo.button.width }"
				disabled
			>
				已同意
			</el-button>
			<el-button
				v-else
				class="no-border"
				type="info"
				:style="{ width: styleInfo.button.width }"
				disabled
			>
				被拒绝
			</el-button>
		</template>

		<template v-else>
			<div class="avatar">
				<ShowLocalImage
					:width="styleInfo.avatar.size"
					:height="styleInfo.avatar.size"
					:file-id="applyInfo.applicantUserId"
					part-type="avatar"
					:file-type="0"
					:force-get="avatarUpdateStore.get(applyInfo.applicantUserId)"
				></ShowLocalImage>
			</div>

			<div
				class="info"
				:style="{
					width: styleInfo.info.width,
					height: styleInfo.avatar.size + 'px',
					paddingLeft: styleInfo.info.paddingLeft
				}"
			>
				<div class="info-title" :title="applyInfo.nickName">
					<span class="benefits">{{ applyInfo.nickName }}</span>
					<span
						:class="[
							'iconfont',
							applyInfo.applicantSex == 0 ? 'icon-xingbienv' : 'icon-xingbienan'
						]"
						:style="
							applyInfo.applicantSex == 0
								? { color: '#E91E63' }
								: { color: '#4A90E2' }
						"
					/>
				</div>
				<div class="info-text">留言:&nbsp;{{ applyInfo.applyInfo }}</div>
				<div class="info-text">请求加为好友:&nbsp;{{ applyInfo.applyTime }}</div>
			</div>

			<el-dropdown v-if="applyInfo.status == 0" placement="bottom" @command="handlerClick">
				<el-button
					class="info-button"
					type="primary"
					plain
					:style="{ width: styleInfo.button.width }"
				>
					审核
				</el-button>
				<template #dropdown>
					<el-dropdown-menu>
						<el-dropdown-item command="1">同意</el-dropdown-item>
						<el-dropdown-item command="2" divided>拒绝</el-dropdown-item>
					</el-dropdown-menu>
				</template>
			</el-dropdown>

			<el-button
				v-else-if="applyInfo.status == 1"
				class="no-border"
				type="primary"
				:style="{ width: styleInfo.button.width }"
				disabled
			>
				已同意
			</el-button>
			<el-button
				v-else
				class="no-border"
				type="info"
				:style="{ width: styleInfo.button.width }"
				disabled
			>
				已拒绝
			</el-button>
		</template>
	</div>
</template>

<script setup>
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import { storeToRefs } from "pinia";
	import { useApplyStore } from "@/stores/applyStore";
	const applyStore = useApplyStore();
	import { useContactStore } from "@/stores/contactStore";
	const contactStore = useContactStore();
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { checkUserApply } from "@/api/userApplyApi";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();

	const { userInfo } = storeToRefs(userInfoStore);

	const props = defineProps({
		applyInfo: {
			type: Object,
			default: {
				type: "", // 常量值 1:发送 或 0:接收
				applicantUserId: "", // 申请人用户ID
				recipientId: "", // 接收人ID
				status: "", // 申请状态 0：申请中，1：申请成功，2：申请失败
				applyTime: "", // 申请时间
				applyInfo: "", // 申请信息
				nickName: "", //昵称
				remack: "", //备注
				applicantSex: "", // 性别
				recipientSex: ""
			}
		},
		styleInfo: {
			type: Object,
			default: {
				avatar: {
					size: 60
				},
				info: {
					paddingLeft: "10px",
					width: "140px"
				},
				button: {
					width: "74px"
				}
			}
		}
	});

	const handlerClick = async (flag) => {
		const data = await checkUserApply({
			applicantUserId: props.applyInfo.applicantUserId,
			recipientId: props.applyInfo.recipientId,
			status: flag
		});

		if (data.data) {
			// 查询申请列表
			applyStore.selectUserApplyList(userInfo.value.userId);
			// 查询用户列表列表
			contactStore.selectUserList(userInfo.value.userId);
		}
	};
</script>

<style lang="scss" scoped>
	.list-data {
		padding: 10px;
		display: flex;
		align-items: center;
		border-radius: 5px;
		background-color: white;
		margin-bottom: 10px;

		.avatar {
			flex-shrink: 0; /* 防止头像区域被压缩 */
		}
		.info {
			flex: 1;
			height: 60px;
			padding-left: 10px;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			justify-content: center;
			gap: 3px;

			.info-title {
				width: 80%;
				display: flex;
				align-items: center;
				font-weight: 400;
				.iconfont {
					font-size: 18px;
				}
			}
			.info-text {
				font-size: 12px;
				opacity: 0.6; //字体透明度
			}
		}
		.no-border {
			color: black;
			opacity: 0.6;
			font-weight: 300;
			background-color: transparent !important;
			border: none !important;
			box-shadow: none !important; /* 如果有阴影，也可以去掉 */
		}
	}
</style>
