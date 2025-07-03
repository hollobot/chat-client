<template>
	<div class="admin-container">
		<!-- 侧边栏 -->
		<el-container>
			<el-header height="40px" class="drag">
				<div class="header-title">管理员</div>
			</el-header>

			<!-- 主要内容区 -->
			<el-container>
				<el-aside width="150px">
					<el-menu class="admin-menu" router>
						<el-menu-item
							v-for="menu in menuItems"
							:index="menu.index"
							:class="['menu', menu.index === route.path ? 'active' : '']"
							:key="menu.index"
						>
							<div
								class="iconfont"
								:class="menu.icon"
								:style="{ backgroundColor: menu.color }"
							></div>
							<div>{{ menu.label }}</div>
						</el-menu-item>
					</el-menu>
				</el-aside>
				<el-main>
					<router-view></router-view>
				</el-main>
			</el-container>
		</el-container>
	</div>
	<WindowControlButton :win-config="windowControl"></WindowControlButton>
</template>

<script setup>
	import { useRoute } from "vue-router";
	import WindowControlButton from "@/components/windowControlButton.vue";

	const route = useRoute();

	const windowControl = {
		isShowPin: true,
		isShowMinimize: true,
		closeType: 0 // 0: 退出进程, 1: 托盘
	};

	const menuItems = [
		{
			index: "/admin/userList",
			icon: "icon-yonghu",
			label: "用户管理",
			color: "#FFA135"
		},
		{
			index: "/admin/customAccountList",
			icon: "icon-zidingyiyonghu",
			label: "账户管理",
			color: "#FF9CB2"
		},
		{
			index: "/admin/groupList",
			icon: "icon-kehuqunzu",
			label: "群组管理",
			color: "#0980F4"
		},
		{
			index: "/admin/sysSetting",
			icon: "icon-shezhi1",
			label: "系统设置",
			color: "#FF6050"
		},
		{
			index: "/admin/versionManageList",
			icon: "icon-reset",
			label: "版本管理",
			color: "#00A95A"
		}
	];

</script>

<style lang="scss" scoped>
	.admin-container {
		height: 100%;
		width: 100%;
		overflow: hidden !important;
		background-color: #f5f5f5;

		.el-header {
			border-bottom: 1px solid #c1c1bf;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 20px;

			.header-title {
				font-size: 14px;
				font-weight: bold;
			}
		}

		.el-menu {
			transition: none !important;
			height: 100vh;
			background-color: #e6e5e5;
			.active {
				background-color: #c4c4c4;
			}
			.menu {
				display: flex;
				align-items: center;

				&:hover {
					background-color: #dbdada;
				}
				.iconfont {
					width: 30px;
					height: 30px;
					color: #fcfffb;
					margin-right: 10px;
					text-align: center;
					line-height: 30px;
				}
			}
		}

		.el-main {
			height: 92vh;
			padding: 10px;
			background-color: #f5f5f5;
			overflow: hidden;
		}
	}
</style>
