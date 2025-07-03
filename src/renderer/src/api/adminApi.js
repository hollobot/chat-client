import api from "@/utils/api.js";

/**
 * 条件查询用户列表
 */
export function allUser(data) {
	return api({
		method: "post",
		url: "/admin/user/all",
		data:data
	});
}

/**
 * 账户状态设置
 */
export function changeUserStatus(userId) {
	return api({
		method: "get",
		url: `/admin/user/status/${userId}`
	});
}


/**
 * 强制下线
 */
export function offLine(userId) {
	return api({
		method: "get",
		url: `/admin/user/offLine/${userId}`
	});
}


/**
 * 分页条件查询自定义账户列表
 */
export function allCustom(data) {
	return api({
		method: "post",
		url: `/admin/custom/all`,
		data: data
	});
}

/**
 * 添加自定义账户
 */
export function addCustom(data) {
	return api({
		method: "post",
		url: `/admin/custom/add`,
		data: data
	});
}

/**
 * 删除自定义账户
 */
export function delCustom(customAccountId) {
	return api({
		method: "get",
		url: `/admin/custom/del/${customAccountId}`,
	});
}

/**
 * 分页条件查询群聊列表
 */
export function allGroup(data) {
	return api({
		method: "post",
		url: `/admin/group/all`,
		data: data
	});
}

/**
 * 解散群聊
 */
export function changeGroupStatus(groupInfo) {
	return api({
		method: "post",
		url: `/admin/group/status`,
		data: groupInfo
	});
}

/**
 * 查询设置参数
 */
export function allSetting() {
	return api({
		method: "get",
		url: `/admin/setting/all`,
	});
}

/**
 * 修改系统设置
 */
export function saveStting(data) {
	return api({
		method: "post",
		url: `/admin/setting/save`,
		data: data
	});
}