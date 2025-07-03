import { name } from "@electron-toolkit/eslint-config";
import {
	createMemoryHistory,
	createRouter,
	createWebHashHistory,
	createWebHistory
} from "vue-router";

const routes = [
	{ path: "/", redirect: "/login" },
	{ path: "/login", component: () => import("@/views/login/login.vue") },
	{ path: "/register", component: () => import("@/views/login/register.vue") },
	{
		path: "/main",
		name: "main",
		redirect: "/main/chat",
		component: () => import("@/views/main/main.vue"),
		children: [
			{
				path: "chat",
				component: () => import("@/views/main/chat/chat.vue")
			},
			{
				path: "contact",
				redirect: "/main/contact/blank",
				component: () => import("@/views/main/contact/contact.vue"),
				children: [
					{
						path: "blank",
						component: () => import("@/components/blank.vue")
					},
					{
						path: "search",
						component: () => import("@/views/main/contact/search.vue")
					},
					{
						path: "newUserContact",
						component: () => import("@/views/main/contact/newUserContact.vue")
					},
					{
						path: "newGroup",
						component: () => import("@/views/main/contact/newGroup.vue")
					},
					{
						path: "userContactInfo",
						component: () => import("@/views/main/contact/userContactInfo.vue")
					},
					{
						path: "groupContactInfo",
						component: () => import("@/views/main/contact/groupContactInfo.vue")
					},
					{
						path: "newGroupContact",
						component: () => import("@/views/main/contact/newGroupContact.vue")
					}
				]
			},
			{
				path: "setting",
				redirect: "/main/setting/blank",
				component: () => import("@/views/main/setting/setting.vue"),
				children: [
					{
						path: "blank",
						component: () => import("@/components/blank.vue")
					},
					{
						path: "accountSetting",
						component: () => import("@/views/main/setting/accountSetting.vue")
					},
					{
						path: "accountSetting/updateInfo",
						component: () => import("@/views/main/setting/updateInfo.vue")
					},
					{
						path: "accountSetting/updatePwd",
						component: () => import("@/views/main/setting/updatePwd.vue")
					},

					{
						path: "fileSetting",
						component: () => import("@/views/main/setting/fileSetting.vue")
					},
					{
						path: "systemSetting",
						component: () => import("@/views/main/setting/systemSetting.vue")
					}
				]
			},

			{
				/**
					 :pathMatch：这是一个动态参数，表示这个部分的值会存储在路由匹配的参数中。
					pathMatch 是你自定义的名字，可以根据需要改成任何名称。
					(.*)：这个是一个正则表达式，.* 的意思是匹配任意字符，零次或多次。
					它可以匹配整个路径，直到路径的末尾。
					*：这个星号表示 Vue Router 会继续向后匹配，如果后面有其他路径，它也会被包含在内。
					虽然 :pathMatch(.*) 已经足够匹配所有路径，但 Vue Router
					需要这个 * 来确保它能捕获路径中的所有可能部分，包括子路径。
				 */
				path: "/:pathMatch(.*)*",
				name: "NotFound",
				component: () => import("@/components/layout.vue")
			}
		]
	},
	{
		path: "/showMedai",
		name: "showMedai",
		component: () => import("@/views/show/showMedia.vue")
	},
	{
		path: "/admin",
		name: "后台管理界面",
		component: () => import("@/views/admin/admin.vue"),
		redirect: "/admin/userList",
		children: [
			{
				name: "用户列表",
				path: "/admin/userList",
				component: () => import("@/views/admin/userList.vue")
			},
			{
				name: "群组列表",
				path: "/admin/groupList",
				component: () => import("@/views/admin/groupList.vue")
			},
			{
				name: "自定义账号列表",
				path: "/admin/customAccountList",
				component: () => import("@/views/admin/customAccountList.vue")
			},
			{
				name: "系统设置",
				path: "/admin/sysSetting",
				component: () => import("@/views/admin/sysSetting.vue")
			},
			{
				name: "版本管理",
				path: "/admin/versionManageList",
				component: () => import("@/views/admin/versionManageList.vue")
			}
		]
	}
];

const router = createRouter({
	// 设置路由模式
	history: createWebHashHistory(),
	routes
});

export default router;
