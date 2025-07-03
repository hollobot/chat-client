<template>
	<el-dialog v-model="dialogVisible" :title="dialogTitle" width="600">
		<el-transfer
			v-model="selectValue"
			:titles="['全部', '已选']"
			:data="contactList"
			:props="{ key: 'id', label: 'name' }"
		>
			<template #default="{ option }">
				<div class="select-item">
					<div class="avatar">
						<ShowLocalImage
							:width="30"
							:height="30"
							:file-id="option.id"
							part-type="avatar"
							:file-type="0"
						></ShowLocalImage>
					</div>
					<div class="item-name">{{ option.name }}</div>
				</div>
			</template>
		</el-transfer>
		<template #footer>
			<div class="dialog-footer">
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" @click="submitData"> 发送请求 </el-button>
			</div>
		</template>
	</el-dialog>
</template>
<script setup>
	import { ref } from "vue";
	const dialogVisible = ref(false);
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import { ElMessage } from "element-plus";
	import { batchAddGroupContact } from "@/api/groupContactApi";

	const selectValue = ref([]);
	const contactList = ref();
	const dialogTitle = ref("添加成员");

	const props = defineProps({
		data: {
			type: Object,
			default: {}
		}
	});

	const fromData = ref({});
	const show = async ({ contactIds, groupId, groupName, ownerId, type, groupSessionId }) => {
		dialogTitle.value = type == 0 ? "移除成员" : "添加成员";
		dialogVisible.value = true;
		contactList.value = contactIds;
		fromData.value = {
			groupId,
			groupName,
			ownerId,
			type,
			userIds: [],
			names: [],
			groupSessionId,
			breakType: 0
		};
	};

	defineExpose({
		show
	});

	const submitData = async () => {
		if (selectValue.value.length == 0) {
			ElMessage.warning("请选择联系人");
			return;
		}
		const userNames = [];
		contactList.value.forEach((item) => {
			if (selectValue.value.includes(item.id)) {
				userNames.push(item.name);
			}
		});
		fromData.value.userIds = selectValue.value;
		fromData.value.names = userNames;
		const result = await batchAddGroupContact(fromData.value);
		dialogVisible.value = false;
		selectValue.value = [];
	};
</script>
<style lang="scss" scoped>
	:deep(.el-transfer-panel__item) {
		height: 40px;
		display: flex !important;
		align-items: center;
		gap: 10px;
		/* 覆盖原样式 */
		.el-checkbox__input {
			position: static !important; /* 或 relative、unset，根据你想要的布局 */
			top: auto !important;
		}
		.el-checkbox__label {
			padding: 0;
		}
		.select-item {
			height: 30px;
			display: flex;
			align-items: center;
			width: 100%;
			gap: 10px;
			.avatar {
				width: 30px;
				height: 30px;
			}
			.item-name {
				width: calc(100% - 30px);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}
</style>
