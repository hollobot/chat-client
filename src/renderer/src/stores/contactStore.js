import { defineStore } from "pinia";
import { selectUsers } from "@/api/userContactApi";
import { selectGroups } from "@/api/groupContactApi";
import { selectUserUnionGroup } from "@/api/userContactApi";

export const useContactStore = defineStore("useContactStore", {
	state: () => ({
		userList: [],
		groupList: [],
		myGroupList: [],
		searchDataList: [],
		searchKey: ""
	}),
	actions: {
		async selectUserList(userId) {
			const data = await selectUsers(userId);
			if (data.data == null) {
				return;
			}
			const updatedData = data.data.map(({ contactId, contactRemarks, ...rest }) => ({
				...rest, // 保留剩余的属性
				id: contactId, // 修改属性名
				name: contactRemarks,
				type: "USER" // 添加新属性
			}));
			this.userList = updatedData;
		},

		async selectGroupList(userId) {
			const data = await selectGroups(userId);
			if (data.data == null) {
				return;
			}
			// 1、我管理的群聊
			const myGroupContacts = data.data.myGroupContacts.map(
				({ groupId, groupRemarks, ...rest }) => ({
					...rest, // 保留剩余的属性
					id: groupId, // 修改属性名
					name: groupRemarks,
					type: "GROUP" // 添加新属性
				})
			);
			this.myGroupList = myGroupContacts;

			// 2、我加入的群聊
			const joinGroupContacts = data.data.joinGroupContacts.map(
				({ groupId, groupRemarks, ...rest }) => ({
					...rest, // 保留剩余的属性
					id: groupId, // 修改属性名
					name: groupRemarks,
					type: "GROUP" // 添加新属性
				})
			);
			this.groupList = joinGroupContacts;
		},

		async selectSearchDataList(id) {
			const data = await selectUserUnionGroup(id);
			this.searchDataList = data.data;
			this.searchKey = id;
		}
	}
});
