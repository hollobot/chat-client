<template>
	<RouterView></RouterView>
</template>

<script setup>
	import { RouterView } from "vue-router";
	import { useUserInfoStore } from "./stores/userInfoStore";
	import { getLocalItem } from "@/utils/storage";
	const userInfoStore = useUserInfoStore();
	userInfoStore.setUserInfo(getLocalItem("userInfo"));
</script>

<style lang="scss">
	.app {
		width: 100%;
		height: 100%;
	}
</style>

