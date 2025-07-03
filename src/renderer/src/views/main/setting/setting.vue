<template>
	<div class="setting">
		<layout>
			<template #contact-search>
				<div class="setting-title drag">设置</div>
			</template>
			<template #data-list>
				<div
					:class="[
						'set-box',
						route.path.split('/', 4).join('/') == item.path ? 'selected-set-box' : ''
					]"
					v-for="item in settingList"
					@click="handleSettingClick(item)"
				>
					<div
						:class="['iconfont', item.icon]"
						:style="{
							backgroundColor: item.color
						}"
					></div>
					<div>{{ item.name }}</div>
				</div>
			</template>

			<template #right-drag>
				<titleName :title-name="route.query.title"></titleName>
			</template>
			<template #right-no-drag>
				<router-view></router-view>
			</template>
		</layout>
	</div>
</template>

<script setup>
	import layout from "@/components/layout.vue";
	import titleName from "@/components/titleName.vue";
	import { ref } from "vue";
	import { useRouter, useRoute } from "vue-router";
	const router = useRouter();
	const route = useRoute();
	const settingList = ref([
		{
			name: "账号设置",
			icon: "icon-xitongshezhi-zhanghaoshezhi",
			path: "/main/setting/accountSetting",
			color: "#1485ee"
		},
		{
			name: "文件管理",
			icon: "icon-wenjianguanli",
			path: "/main/setting/fileSetting",
			color: "#08bf61"
		},
		{
			name: "关于系统",
			icon: "icon-guanyuxitong",
			path: "/main/setting/systemSetting",
			color: "#fa9d3b"
		}
	]);

	const handleSettingClick = (settingInfo) => {
		router.push({
			path: settingInfo.path,
			query: {
				title: settingInfo.name
			}
		});
	};
</script>

<style lang="scss" scoped>
	.setting {
		height: 100%;
		:deep(.layout) {
			background-color: #f5f5f5 !important;
		}
		:deep(.top) {
			background-color: #f5f2f2 !important;
		}
		.setting-title {
			width: 100%;
			height: 100%;
			margin-right: 10px;
			font-size: 20px;
			text-align: center;
			letter-spacing: 10px;
		}

		.set-box {
			padding: 10px;
			height: 40px;
			display: flex;
			align-items: center;
			gap: 15px;

			.iconfont {
				padding: 10px;
				color: white;
				font-size: 16px;
			}
		}

		.set-box:hover {
			background-color: #dbdada; /* 聚焦时的背景色 */
		}

		.selected-set-box {
			background-color: #c4c4c4;
		}
	}
</style>
