import api from "@/utils/api.js";

export function addGroupApply(applyInfo) {
	return api({
		method: "post",
		url: "/groupApply/add",
		data: applyInfo
	});
}

export function allGroupApply(applicantUserId) {
	return api({
		method: "get",
		url: `/groupApply/all/${applicantUserId}`
	});
}

export function checkGroupApply(applyInfo) {
	return api({
		method: "post",
		url: "/groupApply/check",
		data: applyInfo,
		headers: {
			"Content-Type": "multipart/form-data" // 设置请求头为 multipart/form-data
		}
	});
}
