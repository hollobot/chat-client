<template>
	<layout>
		<!-- 搜索 -->
		<template #contact-search>
			<div class="contact-search">
				<el-input
					v-model="searchInput"
					placeholder="搜索"
					clearable
					size="small"
					@keyup="searchContact"
				>
					<template #prefix>
						<span :class="['iconfont', 'icon-weixinsousuoicon']"></span>
					</template>
				</el-input>
				<div
					:class="['contact-add', 'iconfont', 'icon-tianjialianxiren']"
					@click="toAddContact"
				></div>
			</div>
		</template>

		<!-- 联系人列表 -->
		<template #data-list>
			<template v-if="!searchInput">
				<!-- 操作栏 -->
				<div v-for="item in handleContactList" :key="item.title" class="data-box">
					<div class="title">
						{{ item.name }}
					</div>

					<template v-for="contactInfo in item.children">
						<div
							:class="[
								'contact-info',
								route.path === contactInfo.path ? 'select-contact-info' : ''
							]"
							@click="handleContactClick(contactInfo)"
						>
							<div
								:class="['prefix-box', 'iconfont', contactInfo.icon]"
								:style="{
									backgroundColor: contactInfo.color
								}"
							>
								<Badge
									v-if="contactInfo.name == '新的朋友'"
									:count="messageCountStore.getCount('contactCount')"
								></Badge>
								<Badge
									v-if="contactInfo.name == '群聊通知'"
									:count="messageCountStore.getCount('groupCount')"
								></Badge>
							</div>
							<div>
								{{ contactInfo.name }}
							</div>
						</div>
					</template>
				</div>
				<!-- 联系人栏 -->
				<div v-for="item in contactList" :key="item.name" class="data-box">
					<div class="title">
						{{ item.name }}
					</div>
					<template v-if="item.children.length > 0">
						<div
							v-for="contactInfo in item.children"
							:key="contactInfo.id"
							:class="[
								'contact-card',
								route.query.id === contactInfo.id ? 'select-contact-info' : ''
							]"
							@click="ContactClick(contactInfo, item.path, item.name)"
						>
							<contactInfoCard
								:contactInfo="contactInfo"
								:styleInfo="styleInfo"
								:background-color="'color.scale(#dbdada, $lightness: 8%)'"
							>
							</contactInfoCard>
						</div>
					</template>

					<template v-else>
						<div class="not-contact">{{ item.notContact }}</div>
					</template>
				</div>
			</template>
			<template v-if="searchInput">
				<SearchContact
					v-for="contact in searchList"
					:key="contact.id"
					:contact-info="contact"
					@clear-search="searchInput = null"
				>
				</SearchContact>
			</template>
		</template>

		<!-- 标题 -->
		<template #right-drag>
			<titleName :title-name="route.query.title"></titleName>
			<div
				@click="showGroupUpdate"
				class="no-drag iconfont icon-sangediandian"
				v-if="route.query.lable && route.query.lable == '我管理的群聊'"
			></div>
		</template>

		<!-- 联系人详情 -->
		<template #right-no-drag>
			<router-view></router-view>
		</template>
	</layout>
	<ContactGroupDetail
		ref="contactGroupDetailRef"
		@change-group-list="onChangeGroupList"
	></ContactGroupDetail>
</template>

<script setup>
	import SearchContact from "./searchContact.vue";
	import Badge from "@/components/badge.vue";
	import ContactGroupDetail from "./contactGroupDetail.vue";
	import { ref, onMounted, nextTick } from "vue";
	import layout from "@/components/layout.vue";
	import { useRouter, useRoute } from "vue-router";
	const router = useRouter();
	const route = useRoute();
	import titleName from "@/components/titleName.vue";
	import { storeToRefs } from "pinia";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { selectGroupUserNumber } from "@/api/groupContactApi";
	import contactInfoCard from "@/components/contactInfoCard.vue";
	import { useContactStore } from "@/stores/contactStore";
	const contactStore = useContactStore();
	import { useMessageCountStore } from "@/stores/messageCountStore";
	const messageCountStore = useMessageCountStore();

	const { userInfo } = storeToRefs(userInfoStore);
	const { userList, groupList, myGroupList } = storeToRefs(contactStore);

	/**
	 * 联系人列表
	 */
	const handleContactList = ref([
		{
			name: "新的朋友",
			children: [
				{
					name: "添加好友",
					title: "添加好友",
					icon: "icon-weixinsousuoicon",
					path: "/main/contact/search",
					color: "#fa9d3b"
				},
				{
					name: "新的朋友",
					title: "新的朋友",
					icon: "icon-zhifeiji",
					path: "/main/contact/newUserContact",
					color: "#08bf61"
				}
			]
		},
		{
			name: "我的群聊",
			children: [
				{
					name: "新建群聊",
					title: "新建群聊",
					icon: "icon-tianjiaqunliao",
					path: "/main/contact/newGroup",
					color: "#1485ee"
				},
				{
					name: "群聊通知",
					title: "群聊通知",
					icon: "icon-qunliao1",
					path: "/main/contact/newGroupContact",
					color: "#08bf61"
				}
			]
		}
	]);

	const contactList = ref([
		{
			name: "我管理的群聊",
			children: myGroupList,
			notContact: "暂无管理群聊",
			path: "/main/contact/groupContactInfo"
		},
		{
			name: "加入的群聊",
			children: groupList,
			notContact: "暂无加入群聊",
			path: "/main/contact/groupContactInfo"
		},
		{
			name: "联系人",
			children: userList,
			notContact: "暂无联系人",
			path: "/main/contact/userContactInfo"
		}
	]);

	const styleInfo = ref({
		avatar: {
			size: 40
		},
		info: {
			isShow: false,
			paddingLeft: "10px",
			width: "140px"
		},
		button: {
			isShow: false
		}
	});

	/**
	 * 点击跳转路由
	 * @param contactInfo
	 */
	const handleContactClick = (contactInfo) => {
		let type = "user";
		if (contactInfo.title == "新的朋友") {
			messageCountStore.setCount("contactCount", 0, true);
		} else if (contactInfo.title == "群聊通知") {
			messageCountStore.setCount("groupCount", 0, true);
			type = "group";
		}
		window.ipcRenderer.send("clearNoReadCount", {
			userId: userInfo.value.userId,
			type: type
		});
		router.push({
			path: contactInfo.path,
			query: {
				title: contactInfo.title
			}
		});
	};

	const searchInput = ref(null); // 搜索输入框
	const searchList = ref([]); // 搜索结果列表
	// 合并所有联系人列表
	const allContactList = ref([...userList.value, ...groupList.value, ...myGroupList.value]);
	const searchContact = () => {
		searchList.value = allContactList.value
			.map((contact) => {
				const matchName = contact.name.includes(searchInput.value);
				if (matchName) {
					// 创建新对象，添加高亮字段
					return {
						...contact,
						// 添加高亮的属性
						name: highlightText(contact.name, searchInput.value)
					};
				}
				return null; // 不匹配的返回 null
			})
			.filter(Boolean); // 过滤掉 null 值
	};

	// 添加高亮文本的方法
	const highlightText = (text, keyword) => {
		if (!keyword) return text;
		const reg = new RegExp(keyword, "gi");
		return text.replace(reg, (match) => `<span class="highlight">${match}</span>`);
	};

	const toAddContact = () => {
		router.push({
			path: "/main/contact/search",
			query: {
				title: "添加好友"
			}
		});
	};

	/**
	 * 点击用户、群聊路由跳转
	 * @param contactInfo 联系人信息
	 * @param path 路由路径
	 */
	const myAdminGroupInfo = ref();

	const ContactClick = async (contactInfo, path, titleName) => {
		if (contactInfo.type === "USER") {
			router.push({
				path: path,
				query: {
					name: contactInfo.name,
					id: contactInfo.id
				}
			});
		} else {
			// 1、查询群聊人数
			const count = (await selectGroupUserNumber(contactInfo.id)).data;
			myAdminGroupInfo.value = contactInfo;
			router.push({
				path: path,
				query: {
					title: contactInfo.name + `(${count})`,
					id: contactInfo.id,
					lable: titleName
				}
			});
		}
	};

	const contactGroupDetailRef = ref();
	const showGroupUpdate = () => {
		contactGroupDetailRef.value.show(myAdminGroupInfo.value);
	};

	// 修改群聊列表卡片名称
	const onChangeGroupList = (groupInfo) => {
		const group = myGroupList.value.find((item) => {
			return item.id == groupInfo.groupId;
		});
		group.name = groupInfo.groupName;
	};

	onMounted(() => {
		nextTick(async () => {
			await contactStore.selectUserList(userInfo.value.userId);
			await contactStore.selectGroupList(userInfo.value.userId);
		});
	});
</script>

<style lang="scss" scoped>
	@use "sass:color";

	.contact-search {
		height: 35px;
		display: flex;
		align-items: start;
		padding-left: 10px;
		:deep(.el-input__wrapper) {
			background-color: #e2e2e2;
		}

		.contact-add {
			background-color: #e2e2e2;
			padding: 3px;
			margin: 0 10px;
			border-radius: 3px;
		}
	}

	.data-box {
		width: 100%;
		border-top: 1px solid #dcdada;
		.title {
			padding: 10px;
			opacity: 0.5; //字体透明度
			font-size: 12px;
		}

		.contact-info {
			font-size: 14px;
			padding: 10px;
			display: flex;
			align-items: center;
			gap: 10px;
			transition:
				background-color 0.3s,
				color 0.3s; /* 添加过渡效果 */
			.prefix-box {
				position: relative;
				padding: 10px;
				color: white;
			}
		}

		.select-contact-info {
			background-color: #c4c4c4 !important;
		}

		.contact-info:hover {
			background-color: #dbdada; /* 聚焦时的背景色 */
		}

		.not-contact {
			height: 20px;
			width: 100px;
			line-height: 20px;
			margin: 10px calc((230px - 100px) / 2);
			font-size: 10px;
			opacity: 0.3; //字体透明度
			text-align: center; /* 水平居中 */
		}
		.contact-card {
			width: 100%;
			height: 57px;
			display: flex;
			justify-content: start;
		}
		.contact-card:hover {
			background-color: #dddbda; /* 聚焦时的背景色 */
		}
	}

	.icon-sangediandian {
		position: absolute;
		right: 10px;
		bottom: 10px;
	}
</style>
