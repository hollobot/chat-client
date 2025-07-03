<template>
	<el-dialog
		ref="dialogRef"
		v-model="dialogVisible"
		:title="dialogInfo.title"
		width="300"
		draggable
	>
		<div class="application-content">
			<div class="prompt">{{ dialogInfo.prompt1 }}</div>
			<el-input
				class="application-input"
				ref="textareaRef"
				v-model="applicationModel.applyInfo"
				type="textarea"
				:show-word-limit="true"
				maxlength="100"
				:autosize="{ minRows: 2, maxRows: 4 }"
				placeholder="填写信息，增加申请成功几率。"
				@focus="scrollContent"
			></el-input>
			<div class="prompt remark">{{ dialogInfo.prompt2 }}</div>
			<el-input
				v-model="applicationModel.remark"
				@focus="remarkFocus"
				:placeholder="dialogInfo.remarkName"
			></el-input>
		</div>
		<template #footer>
			<div class="dialog-footer">
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" @click="submit"> 发送请求 </el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script setup>
	import { nextTick, ref, watch } from "vue";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { useContactStore } from "@/stores/contactStore";
	const contactStore = useContactStore();
	import { storeToRefs } from "pinia";
	import { addUserApply } from "@/api/userApplyApi";
	import { addGroupApply } from "@/api/groupApplyApi";
	import { selectUserInfo } from "@/api/userApi";

	const { userInfo } = storeToRefs(userInfoStore);

	const props = defineProps({
		dialogInfo: {
			type: Object,
			default: {
				type: "",
				id: "",
				title: "申请添加朋友",
				prompt1: "发送添加朋友申请",
				aplMsg: "您好！",
				prompt2: "备注名",
				remarkName: "hello",
				recipientSex: "",
				ownerId: "",
				groupName: "",
				joinType:""
			}
		}
	});

	const dialogRef = ref();
	const dialogVisible = ref(false);

	const textareaRef = ref();

	const applicationModel = ref();

	/**
	 * 监听props来判断是否父组件点击了
	 */
	watch(
		props,
		async () => {
			dialogVisible.value = true;
			const data = props.dialogInfo;
			if (props.dialogInfo.type === "USER") {
				applicationModel.value = {
					applicantUserId: userInfo.value.userId,
					recipientId: data.id,
					applyInfo: data.aplMsg,
					remark: "",
					nickName: userInfo.value.nickName,
					applicantSex: userInfo.value.sex,
					recipientSex: data.recipientSex,
					joinType: data.joinType
				};
				// 判断是否数据全面
				if(data.joinType === undefined || data.joinType === null) {
					const resp = await selectUserInfo(userInfo.value.userId, userInfo.value.isAdmin);
					applicationModel.value.joinType = resp.data.joinType;
					applicationModel.value.recipientSex = resp.data.sex;
				}
				
			} else {
				applicationModel.value = {
					applicantUserId: userInfo.value.userId,
					groupId: data.id,
					applyInfo: data.aplMsg,
					remark: "",
					nickName: userInfo.value.nickName,
					applicantSex: userInfo.value.sex,
					joinType: data.joinType,
					ownerId: data.ownerId,
					groupName: data.groupName,
					type: 0
				};
			}
		},
		{ deep: true }
	);

	/**
	 * 默认备注回填
	 */
	const remarkFocus = () => {
		if (!applicationModel.value.remark) {
			applicationModel.value.remark = props.dialogInfo.remarkName;
		}
	};

	/**
	 * 发送申请添加请求
	 */
	const submit = async () => {
		//1、关闭弹窗
		dialogVisible.value = false;

		//2、默认备注
		remarkFocus();

		// 3、判断是申请添加群聊还是用户
		if (props.dialogInfo.type === "USER") {
			// 申请添加用户
			const data = await addUserApply(applicationModel.value);
			// 刷新用户列表
			if (data.data) {
				contactStore.selectUserList(userInfo.value.userId);
			}
		} else {
			// 申请添加群聊
			const data = await addGroupApply(applicationModel.value);
			// 刷新群聊列表
			if (data.data) {
				contactStore.selectGroupList(userInfo.value.userId);
			}
		}

		// 4、刷新查询列表
		if (contactStore.searchKey) {
			contactStore.selectSearchDataList(contactStore.searchKey);
		}
	};

	/**
	 * 添加全局滑动条样式
	 */
	const scrollContent = () => {
		nextTick(() => {
			const textareaInner = textareaRef.value?.$el?.querySelector(".el-textarea__inner");
			if (textareaInner && !textareaInner.classList.contains("scroll-content")) {
				// 仅当没有添加过 'scroll-content' 类时才添加
				textareaInner.classList.add("scroll-content");
			}
		});
	};
</script>

<style lang="scss" scoped>
	.application-content {
		margin: auto;
		width: 250px;
		display: flex;
		flex-direction: column;
		gap: 10px;

		.prompt {
			opacity: 0.6; //字体透明度
		}
		.application-input {
			:deep(.el-textarea__inner) {
				max-height: 100px; /* 设置固定高度 */
			}
		}
		.remark {
			margin-top: 10px;
		}
	}
</style>
