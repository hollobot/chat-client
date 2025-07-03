<template>
	<div class="search">
		<div class="search-input">
			<el-input
				v-model="inputModel"
				placeholder="请输入用户ID或群聊ID"
				@keyup.enter.native="search(inputModel)"
				clearable
			>
			</el-input>

			<el-button
				class="iconfont icon-weixinsousuoicon"
				type="primary"
				@click="search(inputModel)"
			></el-button>
		</div>

		<el-scrollbar class="search-centen">
			<div v-if="searchDataList && searchDataList.length == 0" class="not-search-contact">
				没有搜索到任何结果!
			</div>

			<div v-else v-for="item in searchDataList" class="contactInfo-card-container">
				<contactInfoCard
					:contactInfo="item"
					:styleInfo="styleInfo"
				></contactInfoCard>
			</div>
		</el-scrollbar>
	</div>
</template>

<script setup>
	import { ref } from "vue";
	import { ElMessage } from "element-plus";
	import contactInfoCard from "@/components/contactInfoCard.vue";
	import { useContactStore } from "@/stores/contactStore";
	const contactStore = useContactStore();
	import { storeToRefs } from "pinia";

	const { searchDataList } = storeToRefs(contactStore);

	const styleInfo = ref({
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
	});

	const inputModel = ref();

	const search = async (id) => {
		if (!id) {
			ElMessage.warning("请输入数据！");
			return;
		}
		contactStore.selectSearchDataList(id);
	};
</script>

<style lang="scss" scoped>
	.search {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		.search-input {
			width: 320px;
			height: 60px;
			display: flex;
			align-items: center;
			:deep(.el-input__wrapper) {
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
			}

			:deep(.el-button) {
				width: 100px;
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
			}
		}
		.search-centen {
			width: 320px;
			height: calc(100% - 60px);
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
			.not-search-contact {
				width: 200px;
				height: 30px;
				line-height: 30px;
				text-align: center;
				opacity: 0.4; //字体透明度
				font-weight: 200;
				font-size: 14px;
				margin: 30px auto;
				letter-spacing: 5px; //字体间距
			}
			.contactInfo-card-container {
				width: 320px;
				height: 100px;
			}
		}
	}
</style>
