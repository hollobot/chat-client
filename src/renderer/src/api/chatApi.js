import api from "@/utils/api.js";

export function send(messageInfo) {
	return api({
		method: "post",
		url: `/chat/send`,
		data: messageInfo,
		headers: {
			"Content-Type": "multipart/form-data" // 设置请求头为 multipart/form-data
		}
	});
}

export const fileConfig = () => {
	return api({
		method: "get",
		url: `/chat/fileConfig`
	});
};
