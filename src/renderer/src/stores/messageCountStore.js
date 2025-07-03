import { defineStore, storeToRefs } from "pinia";
import { useApplyStore } from "@/stores/applyStore";
const applyStore = useApplyStore();
import { useUserInfoStore } from "@/stores/userInfoStore";
const userInfoStore = useUserInfoStore();
const { userInfo } = storeToRefs(userInfoStore);

export const useMessageCountStore = defineStore("messageCountStore", {
	state: () => ({
		messageCount: {
			chatCount: 0,
			contactCount: 0,
			groupCount: 0
		}
	}),
	actions: {
		setCount(key, count, force) {
			if (force) {
				this.messageCount[key] = count;
			} else {
				const curCount = this.messageCount[key];
				this.messageCount[key] = count + curCount;
			}
			if (key == "contactCount") {
				applyStore.selectUserApplyList(userInfo.value.userId);
			} else if (key == "groupCount") {
				applyStore.selectGroupApplyList(userInfo.value.userId);
			}
		},

		getCount(key) {
			return this.messageCount[key];
		}
	}
});
