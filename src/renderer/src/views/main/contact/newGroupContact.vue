<template>
	<el-scrollbar class="el-scrollbar" v-if="groupApplyList.length > 0">
		<template v-for="item in groupApplyList">
			<groupApplyInfoCard :apply-info="item"></groupApplyInfoCard>
		</template>
	</el-scrollbar>

	<template v-else>
		<div class="not-new-contact">暂无申请</div>
	</template>
</template>

<script setup>
	import { useApplyStore } from "@/stores/applyStore";
	const applyStore = useApplyStore();
	import { storeToRefs } from "pinia";
	import groupApplyInfoCard from "@/components/groupApplyInfoCard.vue";
	const { groupApplyList } = storeToRefs(applyStore);
</script>

<style lang="scss" scoped>
	.el-scrollbar {
		display: flex;
		flex-direction: column;
		padding: 20px;
	}
	.not-new-contact {
		width: 80px;
		height: 30px;
		text-align: center;
		opacity: 0.4; //字体透明度
		font-weight: 200;
		font-size: 14px;
		margin: 30px auto;
		letter-spacing: 5px; //字体间距
	}
</style>
