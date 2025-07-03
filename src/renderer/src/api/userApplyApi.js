import api from "@/utils/api.js";

export function addUserApply(applyInfo) {
	return api({
		method: "post",
		url: "/userApply/add",
		data: applyInfo
	});
}

export function allUserApply(applicantUserId) {
	return api({
		method: "get",
		url: `/userApply/all/${applicantUserId}`
	});
}

export function checkUserApply(applyInfo) {
	return api({
		method: "post",
		url: "/userApply/check",
		data: applyInfo,
		headers: {
			"Content-Type": "multipart/form-data" // 设置请求头为 multipart/form-data
		}
	});
}
