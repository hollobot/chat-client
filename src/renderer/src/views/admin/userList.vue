<template>
	<FrameLayout>
		<template #search>
			<el-form :inline="true" :model="searchForm" class="search-form">
				<el-form-item label="UID">
					<el-input v-model="searchForm.userId" placeholder="请输入UID"></el-input>
				</el-form-item>
				<el-form-item label="昵称">
					<el-input v-model="searchForm.nickName" placeholder="请输入昵称"></el-input>
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
									:file-id="scope.row.userId"
									part-type="avatar"
									:file-type="0"
									:force-get="avatarUpdateStore.get(scope.row.userId)"
									:isShow="true"
								></ShowLocalImage>
							</template>
						</el-table-column>
						<el-table-column align="center" label="UUID" prop="userId" />
						<el-table-column align="center" label="昵称" prop="nickName" />
						<el-table-column align="center" label="邮箱" prop="email" />
						<el-table-column align="center" label="地区" prop="areaName" />
						<el-table-column align="center" label="用户状态" width="80">
							<template #default="scope">
								<el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
									{{ scope.row.status === 1 ? "正常" : "禁用" }}
								</el-tag>
							</template>
						</el-table-column>
						<el-table-column align="center" label="在线状态" width="80">
							<template #default="scope">
								<el-tag :type="scope.row.onlineStatus ? 'success' : 'info'">
									{{ scope.row.onlineStatus ? "在线" : "离线" }}
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
								<div class="control-item">
									<el-popover
										ref="visible"
										:show-arrow="false"
										:hide-after="0"
										:width="30"
										trigger="click"
									>
										<template #reference>
											<div class="operation-btn">...</div>
										</template>
										<div class="select-item">
											<div
												:class="[
													!scope.row.status
														? 'success-item'
														: 'danger-item'
												]"
												@click="
													handleStatusChange(
														scope.row.userId,
														scope.row.status ? '禁用' : '启用'
													)
												"
											>
												{{ scope.row.status ? "禁用" : "启用" }}
											</div>
											<div
												v-if="scope.row.onlineStatus"
												class="danger-item"
												@click="handleOfflineTime(scope.row.userId)"
											>
												下线
											</div>
										</div>
									</el-popover>
								</div>
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
	import { allUser, changeUserStatus, offLine } from "@/api/adminApi";
	import { ElMessage, ElMessageBox } from "element-plus";
	import { getLocalItem } from "@/utils/storage";

	// 搜索表单数据
	const searchForm = ref({
		userId: "",
		nickName: ""
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
			userId: "",
			nickName: ""
		};
		getTableData();
	};

	// 过滤掉当前用户
	const filterThis = (data) => {
		const userInfo = getLocalItem("userInfo");
		const userId = userInfo?.userId;
		return data.filter((item) => {
			return item.userId !== userId;
		});
	};

	// 获取表格数据
	const getTableData = async () => {
		loading.value = true;
		try {
			const data = await allUser({
				pageNum: currentPage.value,
				pageSize: pageSize.value,
				...searchForm.value
			});

			const listData = filterThis(data.data.list || []);

			tableData.value = listData;
			total.value = data.data.total - 1 || 0;
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
	const handleStatusChange = (userId, type) => {
		ElMessageBox.confirm(`确定要${type}该账户吗？`, {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			type: "warning"
		}).then(async () => {
			const data = await changeUserStatus(userId);
			if (data.code === 200) {
				ElMessage({
					type: "success",
					message: "操作成功"
				});
				getTableData();
			}
		});
	};

	// 强制下线处理
	const handleOfflineTime = async (userId) => {
		ElMessageBox.confirm(`确定要强制下线该账户吗？`, {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			type: "warning"
		}).then(async () => {
			const data = await offLine(userId);
			if (data.code === 200) {
				getTableData();
			}
		});
	};

	onMounted(() => {
		getTableData();
	});
</script>

<style lang="scss">
	.el-popper {
		min-width: 80px !important;
	}

	/* 操作按钮基础样式 */
	.operation-btn {
		transition: all 0.3s ease;
		cursor: pointer;

		&:hover {
			transform: scale(1.1);
			color: #409eff !important;
		}
	}

	/* 通用选项样式 */
	.select-item {
		display: flex;
		flex-direction: column;
		gap: 5px;
		> div {
			border-radius: 4px;
			transition: all 0.3s ease;
			cursor: pointer;
			user-select: none;

			&:active {
				transform: scale(0.95);
			}
		}
	}

	/* 危险操作样式 */
	.danger-item {
		color: #f56c6c;
		position: relative;
		overflow: hidden;
		cursor: pointer;

		&:hover {
			background-color: #fef0f0;
			padding-left: 16px;

			&::before {
				transform: translateX(0);
				opacity: 1;
			}
		}

		&::before {
			content: "";
			position: absolute;
			left: 4px;
			top: 50%;
			width: 4px;
			height: 4px;
			background-color: #f56c6c;
			border-radius: 50%;
			transform: translateX(-10px);
			opacity: 0;
			transition: all 0.3s ease;
			margin-top: -2px;
		}
	}

	/* 成功操作样式 */
	.success-item {
		color: #67c23a;
		position: relative;
		overflow: hidden;

		&:hover {
			background-color: #f0f9eb;
			padding-left: 16px;

			&::before {
				transform: translateX(0);
				opacity: 1;
			}
		}

		&::before {
			content: "";
			position: absolute;
			left: 4px;
			top: 50%;
			width: 4px;
			height: 4px;
			background-color: #67c23a;
			border-radius: 50%;
			transform: translateX(-10px);
			opacity: 0;
			transition: all 0.3s ease;
			margin-top: -2px;
		}
	}
</style>

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
