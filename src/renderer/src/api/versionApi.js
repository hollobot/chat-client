import api from "@/utils/api.js";

/**
 * 分页条件查询应用版本列表
 */
export function allVersion(data) {
	return api({
		method: "post",
		url: `/version/all`,
		data: data
	});
}

/**
 * 添加应用版本
 */
export function addVersion(data) {
	return api({
		method: "post",
		url: `/version/add`,
		data: data
	});
}

/**
 * 修改应用版本
 */
export function saveVersion(data) {
	return api({
		method: "post",
		url: `/version/save`,
		data: data
	});
}

/**
 * 删除版本
 */
export function delVersion(id) {
	return api({
		method: "delete",
		url: `/version/del/${id}`
	});
}


/**
 * 获取最新发布版本
 */
export function latest(id,currentVersion) {
	return api({
		method: "get",
		url: `/version/latest/${id}/${currentVersion}`
	});
}