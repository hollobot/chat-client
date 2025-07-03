<template>
	<div
		v-if="contactInfo.type === 'USER'"
		class="list-data"
		:style="{ backgroundColor: backgroundColor }"
	>
		<div class="avatar">
			<ShowLocalImage
				:width="styleInfo.avatar.size"
				:height="styleInfo.avatar.size"
				:file-id="contactInfo.id"
				part-type="avatar"
				:file-type="0"
				:force-get="avatarUpdateStore.get(contactInfo.id)"
				:isShow="isShow"
			></ShowLocalImage>
		</div>
		<div
			v-if="styleInfo.info.isShow"
			class="info"
			:style="{
				width: styleInfo.info.width,
				height: styleInfo.avatar.size + 'px',
				paddingLeft: styleInfo.info.paddingLeft
			}"
		>
			<div class="info-title" :title="contactInfo.name">
				<span class="benefits">{{ contactInfo.name }}</span>
				<span
					:class="[
						'iconfont',
						contactInfo.sex === 0 ? 'icon-xingbienv' : 'icon-xingbienan'
					]"
					:style="contactInfo.sex === 0 ? { color: '#E91E63' } : { color: '#4A90E2' }"
				/>
			</div>
			<div class="info-text">ID:&nbsp;{{ contactInfo.id }}</div>
			<div class="info-text benefits">
				地区:&nbsp;{{ contactInfo.areaName ? contactInfo.areaName : "-" }}
			</div>
		</div>

		<div
			v-else
			class="info"
			:style="{
				width: styleInfo.info.width,
				height: styleInfo.avatar.size + 'px',
				paddingLeft: styleInfo.info.paddingLeft
			}"
		>
			<div class="benefits">
				{{ contactInfo.name }}
			</div>
		</div>

		<template v-if="styleInfo.button.isShow">
			<el-button
				v-if="contactInfo.status == 0"
				class="info-button"
				type="primary"
				plain
				@click="openAddUserWindow"
				:style="{ width: styleInfo.button.width }"
			>
				添加
			</el-button>
			<el-button
				v-else-if="contactInfo.status == 1"
				class="info-button"
				type="primary"
				@click="sendMessage(contactInfo.id)"
				:style="{ width: styleInfo.button.width }"
			>
				发消息
			</el-button>
			<el-button
				v-else
				class="info-button"
				type="info"
				:style="{ width: styleInfo.button.width }"
				disabled
			>
				申请中
			</el-button>
		</template>
	</div>

	<div v-else class="list-data" :style="{ backgroundColor: backgroundColor }">
		<div class="avatar">
			<ShowLocalImage
				:width="styleInfo.avatar.size"
				:height="styleInfo.avatar.size"
				:file-id="contactInfo.id"
				part-type="avatar"
				:file-type="0"
				:force-get="avatarUpdateStore.get(contactInfo.id)"
				:isShow="isShow"
			></ShowLocalImage>
		</div>

		<div
			v-if="styleInfo.info.isShow"
			class="info"
			:style="{
				width: styleInfo.info.width,
				height: styleInfo.avatar.size + 'px',
				paddingLeft: styleInfo.info.paddingLeft
			}"
		>
			<div class="info-title" :title="contactInfo.name">
				<span class="benefits">{{ contactInfo.name }}</span>
				<span
					:class="['info-label', 'iconfont', 'icon-qunliao']"
					:style="{ color: '#4CAF50' }"
				/>
			</div>
			<div class="info-text">ID:&nbsp;{{ contactInfo.id }}</div>
			<div
				class="info-text benefits"
				:title="contactInfo.groupAnnouncement ? contactInfo.groupAnnouncement : '-'"
			>
				群公告:&nbsp;{{
					contactInfo.groupAnnouncement ? contactInfo.groupAnnouncement : "-"
				}}
			</div>
		</div>

		<div
			v-else
			class="info"
			:style="{
				width: styleInfo.info.width,
				height: styleInfo.avatar.size + 'px',
				paddingLeft: styleInfo.info.paddingLeft
			}"
		>
			<div class="info-title benefits">
				{{ contactInfo.name }}
			</div>
		</div>

		<template v-if="styleInfo.button.isShow">
			<el-button
				v-if="contactInfo.status == 0"
				class="info-button"
				type="primary"
				plain
				:style="{ width: styleInfo.button.width }"
				@click="openAddUserWindow"
			>
				添加
			</el-button>
			<el-button
				v-else-if="contactInfo.status == 1"
				class="info-button"
				type="primary"
				:style="{ width: styleInfo.button.width }"
				@click="sendMessage(contactInfo.id)"
			>
				发消息
			</el-button>
			<el-button
				v-else
				class="info-button"
				type="info"
				:style="{ width: styleInfo.button.width }"
				disabled
			>
				申请中
			</el-button>
		</template>
	</div>
	<contactAddDialog :dialogInfo="dialogInfo"></contactAddDialog>
</template>

<script setup>
	import contactAddDialog from "@/components/contactAddDialog.vue";
	import { useRouter } from "vue-router";
	const router = useRouter();
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { storeToRefs } from "pinia";
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import { ref } from "vue";

	const { userInfo } = storeToRefs(userInfoStore);

	const props = defineProps({
		isShow: {
			type: Boolean,
			default: false
		},
		contactInfo: {
			type: Object,
			default: {
				type: "", //联系人类型
				id: "",
				name: "", //昵称
				areaName: "", //地区名称
				groupAnnouncement: "", //群聊公告
				sex: "", //用户性别
				joinType: "", //加入类型 是否需要同意
				status: "", // 状态 0：添加 1：发消息 2：申请中
				ownerId: "", //群主id
				groupName: "" //群聊名称
			}
		},
		styleInfo: {
			type: Object,
			default: {
				avatar: {
					size: 60
				},
				info: {
					isShow: true,
					paddingLeft: "10px",
					width: "140px"
				},
				button: {
					isShow: true,
					width: "74px"
				}
			}
		},
		backgroundColor: {
			type: String,
			default: "#fefefe"
		},
		isEmits: {
			type: Boolean,
			default: false
		}
	});

	const emits = defineEmits(["closePopover"]);
	/**
	 * 打开添加用户窗口
	 */
	const dialogInfo = ref();
	const openAddUserWindow = () => {
		// 关闭popover
		// 触发父组件的closePopover事件
		if (props.isEmits) {
			emits("closePopover", {
				type: props.contactInfo.type,
				id: props.contactInfo.id,
				title: props.contactInfo.type === "USER" ? "申请添加朋友" : "申请进入群聊",
				prompt1:
					props.contactInfo.type === "USER" ? "发送添加朋友申请" : "发送加入群聊申请",
				aplMsg: "您好！我是" + userInfo.value.nickName,
				prompt2: "备注",
				remarkName: props.contactInfo.name,
				joinType: props.contactInfo.joinType,
				recipientSex: props.contactInfo.sex,
				ownerId: props.contactInfo.ownerId,
				groupName: props.contactInfo.name
			});
		} else {
			dialogInfo.value = {
				type: props.contactInfo.type,
				id: props.contactInfo.id,
				title: props.contactInfo.type === "USER" ? "申请添加朋友" : "申请进入群聊",
				prompt1:
					props.contactInfo.type === "USER" ? "发送添加朋友申请" : "发送加入群聊申请",
				aplMsg: "您好！我是" + userInfo.value.nickName,
				prompt2: "备注",
				remarkName: props.contactInfo.name,
				joinType: props.contactInfo.joinType,
				recipientSex: props.contactInfo.sex,
				ownerId: props.contactInfo.ownerId,
				groupName: props.contactInfo.name
			};
		}
	};

	// 方法
	const sendMessage = (contacId) => {
		router.push({
			path: "/main/chat",
			query: {
				contactId: contacId,
				timeStamp: new Date().getTime()
			}
		});
	};
</script>

<style lang="scss" scoped>
	.list-data {
		padding: 10px;
		display: flex;
		align-items: center;
		justify-content: space-around;
		border-radius: 5px;

		.avatar {
			flex-shrink: 0; /* 防止头像区域被压缩 */
		}
		.info {
			height: 60px;
			width: 140px;
			padding-left: 10px;
			display: flex;
			flex-direction: column;
			justify-content: center;
			gap: 3px;

			.info-title {
				height: 18.4px;
				width: 80%;
				display: flex;
				flex-wrap: nowrap;
				align-items: center;
				font-weight: 400;
				.iconfont {
					font-size: 18px;
				}
			}
			.info-text {
				height: 13.6px;
				font-size: 12px;
				opacity: 0.6; //字体透明度
			}
		}
	}
</style>
