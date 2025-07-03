import api from "@/utils/api.js";

/**
 * 查询通讯录群聊列表
 * @param {*} userId
 * @returns
 */
export function selectGroups(userId) {
	return api({
		method: "get",
		url: `/groupContact/groups/${userId}`
	});
}

/**
 * 查询群聊的用户信息
 * @param {*} groupId
 * @param {*} userId
 * @returns
 */
export function selectGroup(groupId, userId) {
	return api({
		method: "get",
		url: `/groupContact/group/${groupId}/${userId}`
	});
}

/**
 * 查询群聊人数
 * @param {*} groupId
 * @returns
 */
export function selectGroupUserNumber(groupId) {
	return api({
		method: "get",
		url: `/groupContact/count/${groupId}`
	});
}

export function batchAddGroupContact(data) {
	return api({
		method: "post",
		url: `/groupContact/batchUsers`,
		data: data
	});
}
