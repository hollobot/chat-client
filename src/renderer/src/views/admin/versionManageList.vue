<template>
	<FrameLayout>
		<template #search>
			<el-form :inline="true" :model="searchForm" class="search-form">
				<el-form-item label="跟新描述">
					<el-input
						v-model="searchForm.updateDescription"
						placeholder="请输跟新描述"
					></el-input>
				</el-form-item>
				<!-- 修改搜索表单中的发布状态选择 -->
				<el-form-item label="发布状态">
					<el-select
						v-model="searchForm.status"
						placeholder="请选择发布状态"
						clearable
						style="width: 200px"
					>
						<el-option
							v-for="item in statusOptions"
							:key="item.value"
							:label="item.label"
							:value="item.value"
						/>
					</el-select>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="handleSearch">查询</el-button>
					<el-button @click="resetForm">重置</el-button>
					<el-button @click="handleInsert">添加</el-button>
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
						<el-table-column align="center" label="VID" prop="id" />
						<el-table-column align="center" label="版本号" prop="versionCode" />
						<el-table-column align="center" label="跟新描述" prop="updateDescription" />
						<el-table-column align="center" label="创建时间" prop="createTime" />
						<el-table-column align="center" label="跟新时间" prop="updateTime" />
						<el-table-column align="center" label="发布状态" prop="status">
							<template #default="scope">
								<el-tag :type="getStatusType(scope.row.status)">
									{{ getStatusText(scope.row.status) }}
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
											<div class="operation-btn" style="cursor: pointer">
												...
											</div>
										</template>
										<div class="select-item">
											<!-- 修改发布按钮 -->
											<div
												v-if="scope.row.status === 0"
												class="warning-item"
												@click="handleEdit(scope.row)"
											>
												发布
											</div>

											<!-- 查看按钮 -->
											<div class="info-item" @click="handleView(scope.row)">
												查看
											</div>

											<!-- 删除按钮 -->
											<div
												v-if="scope.row.status === 0"
												class="danger-item"
												@click="handleDelete(scope.row.id)"
											>
												删除
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
	<EditVersion
		:visible="dialogVisible"
		:mode="dialogMode"
		:data="currentData"
		@update-visible="updateVisible"
		@success="success"
	/>
</template>

<script setup>
	import { ref, onMounted } from "vue";
	import FrameLayout from "./frameLayout .vue";
	import { allVersion, delVersion } from "@/api/versionApi";
	import { ElMessageBox } from "element-plus";
	import EditVersion from "./editVersion.vue";

	const dialogVisible = ref(false);
	const dialogMode = ref(null);
	const currentData = ref(null);

	const updateVisible = (value) => {
		dialogVisible.value = value;
	};

	// 添加发布状态选项
	const statusOptions = [
		{ label: "未发布", value: 0 },
		{ label: "灰度发布", value: 1 },
		{ label: "全网发布", value: 2 }
	];

	// 获取状态标签类型
	const getStatusType = (status) => {
		const types = {
			0: "info", // 未发布 - 灰色
			1: "warning", // 灰度发布 - 黄色
			2: "success" // 全网发布 - 绿色
		};
		return types[status] || "info";
	};

	// 获取状态显示文本
	const getStatusText = (status) => {
		const texts = {
			0: "未发布",
			1: "灰度发布",
			2: "全网发布"
		};
		return texts[status] || "未知状态";
	};

	// 搜索表单数据
	const searchForm = ref({
		status: null,
		updateDescription: ""
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
			status: null,
			updateDescription: ""
		};
		getTableData();
	};

	const success = () => {
		getTableData();
	};

	// 获取表格数据
	const getTableData = async () => {
		loading.value = true;
		try {
			const data = await allVersion({
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

	// 编辑发布操作
	const handleEdit = (row) => {
		dialogMode.value = "edit";
		currentData.value = row;
		dialogVisible.value = true;

		// TODO: 跳转到编辑页面或打开编辑弹窗
	};

	// 查看操作
	const handleView = (row) => {
		dialogMode.value = "view";
		currentData.value = row;
		dialogVisible.value = true;
		// TODO: 跳转到详情页面或打开详情弹窗
	};

	// 添加操作
	const handleInsert = () => {
		dialogMode.value = "add";
		currentData.value = null;
		dialogVisible.value = true;
	};

	// 删除操作
	const handleDelete = (id) => {
		ElMessageBox.confirm("确定要删除该版本吗？此操作不可恢复！", {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			type: "error"
		}).then(async () => {
			const data = await delVersion(id);
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
	/* 基础操作按钮样式 */
	@mixin operation-item($color, $bg-color) {
		color: $color;
		position: relative;
		overflow: hidden;
		cursor: pointer;

		&:hover {
			background-color: $bg-color;
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
			background-color: $color;
			border-radius: 50%;
			transform: translateX(-10px);
			opacity: 0;
			transition: all 0.3s ease;
			margin-top: -2px;
		}
	}

	/* 应用不同类型的样式 */
	.info-item {
		@include operation-item(#409eff, #ecf5ff);
	}

	.warning-item {
		@include operation-item(#e6a23c, #fdf6ec);
	}

	.danger-item {
		@include operation-item(#f56c6c, #fef0f0);
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

	/* 修改 el-popover 样式 */
	.el-popover {
		min-width: 80px !important;
		padding: 0 !important;
		border: none !important;
		border-radius: 8px !important;
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
