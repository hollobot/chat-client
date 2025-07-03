<template>
	<FrameLayout>
		<template #search>
			<el-form :inline="true" :model="searchForm" class="search-form">
				<el-form-item label="UID">
					<el-input v-model="searchForm.groupId" placeholder="请输入UID"></el-input>
				</el-form-item>
				<el-form-item label="群名">
					<el-input v-model="searchForm.groupName" placeholder="请输入群名"></el-input>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="handleSearch">查询</el-button>
					<el-button @click="resetForm">重置</el-button>
				</el-form-item>
			</el-form>
		</template>

		<template #list>
			<div class="list">
				<div class="tabel-data">
					<el-table
						:data="tableData"
						style="width: 100%"
						v-loading="loading"
						max-height="500"
					>
						<el-table-column align="center" label="头像" width="70">
							<template #default="scope">
								<ShowLocalImage
									:width="40"
									:height="40"
									:file-id="scope.row.groupId"
									part-type="avatar"
									:file-type="0"
									:force-get="avatarUpdateStore.get(scope.row.groupId)"
									:isShow="true"
								></ShowLocalImage>
							</template>
						</el-table-column>
						<el-table-column align="center" label="UUID" prop="groupId" />
						<el-table-column align="center" label="群名" prop="groupName" />
						<el-table-column align="center" label="群主UUID" prop="ownerId" />
						<el-table-column align="center" label="群公告" prop="groupAnnouncement" />
						<el-table-column align="center" label="创群事件" prop="createTime" />
						<el-table-column align="center" label="加入权限" width="120">
							<template #default="scope">
								<el-tag :type="scope.row.joinType === 1 ? 'warning' : 'success'">
									{{ scope.row.joinType === 1 ? "需要审核" : "自由加入" }}
								</el-tag>
							</template>
						</el-table-column>
						<el-table-column align="center" label="群聊状态" width="80">
							<template #default="scope">
								<el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
									{{ scope.row.status === 1 ? "正常" : "解散" }}
								</el-tag>
							</template>
						</el-table-column>
						<el-table-column
							align="center"
							label="操作"
							width="180"
							class-name="operation-column"
						>
							<template #default="scope">
								<el-button
									type="danger"
									size="small"
									@click="handleStatusChange(scope.row)"
									plain
									:disabled="scope.row.status === 0"
								>
									{{ scope.row.status === 1 ? "解散群聊" : "已解散" }}
								</el-button>
							</template>
						</el-table-column>
					</el-table>
				</div>
				<div class="pagination-container">
					<el-pagination
						v-model:current-page="currentPage"
						v-model:page-size="pageSize"
						:page-sizes="[2, 5, 10, 20]"
						:total="total"
						layout="total, sizes, prev, pager, next, jumper"
						@size-change="handleSizeChange"
						@current-change="handleCurrentChange"
					/>
				</div>
			</div>
		</template>
	</FrameLayout>
</template>

<script setup>
	import { ref, onMounted } from "vue";
	import FrameLayout from "./frameLayout .vue";
	import ShowLocalImage from "@/components/showLocalImage.vue";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import { allGroup, changeGroupStatus } from "@/api/adminApi";
	import { ElMessage, ElMessageBox } from "element-plus";

	// 搜索表单数据
	const searchForm = ref({
		groupId: "",
		groupName: ""
	});

	// 表格数据
	const tableData = ref([]);
	const loading = ref(false);
	const currentPage = ref(1);
	const pageSize = ref(5);
	const total = ref(0);

	// 搜索方法
	const handleSearch = () => {
		getTableData();
	};

	// 重置表单
	const resetForm = () => {
		searchForm.value = {
			groupId: "",
			groupName: ""
		};
		getTableData();
	};

	// 获取表格数据
	const getTableData = async () => {
		loading.value = true;
		try {
			const data = await allGroup({
				pageNum: currentPage.value,
				pageSize: pageSize.value,
				...searchForm.value
			});
			tableData.value = data.data.list || [];
			total.value = data.data.total || 0;
		} catch (error) {
			console.error("获取用户列表失败:", error);
		} finally {
			loading.value = false;
		}
	};

	// 分页方法
	const handleSizeChange = (val) => {
		pageSize.value = val;
		getTableData();
	};

	const handleCurrentChange = (val) => {
		currentPage.value = val;
		getTableData();
	};

	// 账户状态
	const handleStatusChange = (groupInfo) => {
		ElMessageBox.confirm(`确定要解散该群聊吗？`, {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			type: "warning"
		}).then(async () => {
			const data = await changeGroupStatus(groupInfo);
			if (data.code === 200) {
				getTableData();
			}
		});
	};

	onMounted(() => {
		getTableData();
	});
</script>


<style lang="scss" scoped>
	.search-form {
		display: flex;
		align-items: center;
		.el-form-item {
			margin-bottom: 0;
			margin-right: 16px;
		}
	}

	.list {
		height: 100%;
		display: flex;
		flex-direction: column;

		.tabel-data {
			min-height: 520px;
		}

		.pagination-container {
			height: 60px;
			display: flex;
			justify-content: flex-end;
		}
	}
</style>
