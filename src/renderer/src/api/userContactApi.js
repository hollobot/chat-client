import api from "@/utils/api.js";

/**
 * 根据id查找用户和群聊
 * @param {*} id
 * @returns
 */
export function selectUserUnionGroup(id) {
	return api({
		method: "get",
		url: `/userContact/search/${id}`
	});
}

/**
 * 查询通讯录用户信息
 * @param {*} id
 * @returns
 */
export function selectUsers(id, status = null) {
	return api({
		method: "get",
		url: `/userContact/users/${id}/${status}`
	});
}

/**
 * 查询通讯录联系人
 * @param {*} id
 * @returns
 */
export function selectUser(id) {
	return api({
		method: "get",
		url: `/userContact/user/${id}`
	});
}

/**
 * 改变联系人状态
 * @param {} data
 * @returns
 */
export function changeStatus(data) {
	return api({
		method: "post",
		url: "/userContact/status",
		data: data,
		headers: {
			"Content-Type": "multipart/form-data" // 设置请求头为 multipart/form-data
		}
	});
}
