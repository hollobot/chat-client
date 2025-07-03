import api from "@/utils/api.js";

export function insertGroup(groupInfo) {
	return api({
		method: "post",
		url: `/group/add`,
		data: groupInfo,
		headers: {
			"Content-Type": "multipart/form-data" // 设置请求头为 multipart/form-data
		}
	});
}

export const selectGroupInfo = (groupId) => {
	return api({
		method: "get",
		url: `/group/info/${groupId}`
	});
};

export const disband = (data) => {
	return api({
		method: "post",
		url: `/group/disband`,
		data: data
	});
};

export const save = (data) => {
	return api({
		method: "post",
		url: `/group/save`,
		data: data,
		headers: {
			"Content-Type": "multipart/form-data" // 设置请求头为 multipart/form-data
		}
	});
};

