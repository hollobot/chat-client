import { defineStore } from "pinia";
import { selectUserInfo } from "@/api/userApi";
import { setLocalItem } from "@/utils/storage";

export const useUserInfoStore = defineStore("useUserInfoStore", {
	state: () => ({
		userInfo: {}
	}),
	actions: {
		setUserInfo(user) {
			this.userInfo = user;
		},

		getUserInfo() {
			return this.userInfo;
		},

		/**
		 * 跟新本地持久化用户数据
		 */
		async changUserInfo() {
			// 1、查询数据
			const data = await selectUserInfo(this.userInfo.userId, this.userInfo.isAdmin);
			// 2、跟新localStorage数据
			setLocalItem("userInfo", data.data);
			// 3、跟新pinia数据
			this.userInfo = data.data;
		}
	}
});
