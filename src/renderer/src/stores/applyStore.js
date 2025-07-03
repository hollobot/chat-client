import { defineStore } from "pinia";
import { allUserApply } from "@/api/userApplyApi";
import { allGroupApply } from "@/api/groupApplyApi";

export const useApplyStore = defineStore("useApplyStore", {
	state: () => ({
		userApplyList: [],
		groupApplyList: []
	}),
	actions: {
		async selectUserApplyList(applicantUserId) {
			const data = await allUserApply(applicantUserId);
			this.userApplyList = data.data;
		},

		async selectGroupApplyList(applicantUserId) {
			const data = await allGroupApply(applicantUserId);
			this.groupApplyList = data.data;
		}
	}
});
	