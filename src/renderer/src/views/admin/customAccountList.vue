<template>
	<FrameLayout>
		<template #search>
			<el-form :inline="true" :model="searchForm" class="search-form">
				<el-form-item label="UID">
					<el-input v-model="searchForm.userId" placeholder="请输入UID"></el-input>
				</el-form-item>
				<el-form-item label="邮箱">
					<el-input v-model="searchForm.email" placeholder="请输入邮箱"></el-input>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="handleSearch">查询</el-button>
					<el-button @click="resetForm">重置</el-button>
					<el-button @click="dialogVisible = true">添加</el-button>
				</el-form-item>
			</el-form>

			<!-- 对话框 -->
			<el-dialog v-model="dialogVisible" title="添加自定义账户" width="500">
				<!-- 账户信息 -->
				<el-form :model="customInfo" class="search-form">
					<el-form-item label="邮箱">
						<el-input v-model="customInfo.email" placeholder="请输入邮箱"></el-input>
					</el-form-item>
					<el-form-item label="UUID">
						<el-input
							v-model="customInfo.userId"
							placeholder="请输入11位UUID"
						></el-input>
					</el-form-item>
				</el-form>
				<!-- 操作按钮 -->
				<template #footer>
					<div class="dialog-footer">
						<el-button @click="((dialogVisible = false), resetFormCustom())"
							>取消</el-button
						>
						<el-button type="primary" @click="add(customInfo)"> 确定 </el-button>
					</div>
				</template>
			</el-dialog>
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
						<el-table-column align="center" label="编号" prop="customAccountId" />
						<el-table-column align="center" label="邮箱" prop="email" />
						<el-table-column align="center" label="UUID" prop="userId" />
						<el-table-column align="center" label="状态" width="80">
							<template #default="scope">
								<el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
									{{ scope.row.status === 1 ? "未使用" : "已使用" }}
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
									@click="del(scope.row.customAccountId)"
									plain
									:disabled="scope.row.status === 0"
								>
									删除
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
	import { allCustom, addCustom, delCustom } from "@/api/adminApi";
	import { ElMessage, ElMessageBox } from "element-plus";

	const dialogVisible = ref(false);
	// 搜索表单数据
	const searchForm = ref({
		userId: "",
		email: ""
	});

	const customInfo = ref({
		userId: "",
		email: ""
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
			email: ""
		};
		getTableData();
	};

	const resetFormCustom = () => {
		customInfo.value = {
			userId: "",
			email: ""
		};
	};

	// 获取表格数据
	const getTableData = async () => {
		loading.value = true;
		try {
			const data = await allCustom({
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

	// 删除
	const del = (customAccountId) => {
		ElMessageBox.confirm(`确定要删除该账户吗？`, {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			type: "warning"
		}).then(async () => {
			const data = await delCustom(customAccountId);
			if (data.code === 200) {
				getTableData();
			}
		});
	};

	// 添加
	const add = async (info) => {
		dialogVisible.value = false;
		resetFormCustom();
		const data = await addCustom(info);
		if (data.code === 200) {
			getTableData();
		}
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
