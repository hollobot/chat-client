import api from "@/utils/api.js";

export function checkCode() {
	return api({
		method: "get",
		url: "/account/code"
	});
}

export function login(userInfo) {
	return api({
		method: "post",
		url: "/account/login",
		data: userInfo
	});
}

export function register(userInfo) {
	return api({
		method: "post",
		url: "/account/register",
		data: userInfo
	});
}

/**
 * 修改用户信息
 * @param {*} userFormData
 * @returns
 */
export function updateInfo(userFormData) {
	return api({
		method: "post",
		url: "/account/update",
		data: userFormData,
		headers: {
			"Content-Type": "multipart/form-data" // 设置请求头为 multipart/form-data
		}
	});
}

/**
 * 查询用户信息
 */
export function selectUserInfo(userId, isAdmin) {
	return api({
		method: "get",
		url: `/account/user/${userId}/${isAdmin}`
	});
}

/**
 * 修改密码
 */
export function updatePwd(userInfo) {
	return api({
		method: "post",
		url: "/account/changePwd",
		data: userInfo,
		headers: {
			"Content-Type": "multipart/form-data" // 设置请求头为 multipart/form-data
		}
	});
}

/**
 * 用户退出
 */
export function userLogout() {
	return api({
		method: "get",
		url: "/account/logout"
	});
}


