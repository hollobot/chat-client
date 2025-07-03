<template>
	<div>
		<ShowLocalImage
			:file-id="data.uuid"
			part-type="chat"
			:file-type="data.fileType"
		></ShowLocalImage>
	</div>
</template>

<script setup>
	import ShowLocalImage from "@/components/showLocalImage.vue";

	const props = defineProps({
		data: {
			type: Object,
			default: {}
		}
	});
</script>

<style lang="scss" scoped></style>
