<template>
   <el-avatar shape="square" :size="35" :src="avatar" />
</template>

<script setup>
    import avatar from "@/assets/image/avatar/avatar.jpg"

	const props = defineProps({
		userId: {
			type: String,
			default: ""
		},
	});

</script>

<style lang="scss" scoped></style>
