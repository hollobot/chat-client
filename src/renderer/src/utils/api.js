import axios from "axios";
import { ElMessage } from "element-plus";
import router from "@/router"; // 确保路径正确

// 白名单
const whiteList = ["/userContact/users/","/groupContact/groups/","/userApply/all/","/groupApply/all/"];

// 用于存储正在进行的请求
const pendingRequests = new Map();

// 生成请求的唯一键
const generateRequestKey = (config) => {
	const { url, method, params, data } = config;
	return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
};

// 检查是否有相同的请求正在进行中
const hasPendingRequest = (config) => {
	const requestKey = generateRequestKey(config);
	return pendingRequests.has(requestKey);
};

// 添加请求到正在进行的请求映射表
const addPendingRequest = (config) => {
	const requestKey = generateRequestKey(config);
	config._requestKey = requestKey; // 在config中存储请求键，用于后续移除
	pendingRequests.set(requestKey, true);
};

// 从正在进行的请求映射表中移除请求
const removePendingRequest = (config) => {
	const requestKey = config._requestKey || generateRequestKey(config);
	pendingRequests.delete(requestKey);
};

const api = axios.create({
	baseURL: "/api/api"
});

// 添加请求拦截器
api.interceptors.request.use(
	function (config) {
		// 检查是否有相同的请求正在进行中
		if (hasPendingRequest(config)) {
			// 如果有相同的请求正在进行中，提示用户不要重复提交
			ElMessage({
				message: "请勿重复点击",
				type: "warning"
			});

			// 取消当前请求
			return Promise.reject({
				message: "重复请求已被拦截",
				duplicateRequest: true,
				config: config
			});
		}

		if (!whiteList.some((url) => config.url.includes(url))) {
			// 添加请求到正在进行的请求映射表
			addPendingRequest(config);
		}

		// 在发送请求之前做些什么
		// 从本地存储（或其他地方）获取 token
		const token = localStorage.getItem("token"); // 假设 token 存储在 localStorage 中
		if (token) {
			config.headers.Authorization = token;
		}
		return config;
	},
	function (error) {
		// 对请求错误做些什么
		return Promise.reject(error);
	}
);

// 添加响应拦截器
api.interceptors.response.use(
	function (response) {
		// 请求完成后，从正在进行的请求映射表中移除
		removePendingRequest(response.config);

		const data = response.data;
		if (data.message == null) {
			return data;
		}
		if (data.code === 200) {
			ElMessage({
				message: data.message,
				type: "success"
			});
		} else if (data.code === 401 || data.code === 402) {
			router.push({ path: "/login" });
			ElMessage({
				message: data.message,
				type: "error"
			});
		} else {
			ElMessage({
				message: data.message,
				type: "error"
			});
		}
		// 2xx 范围内的状态码都会触发该函数。
		// 对响应数据做点什么
		return data;
	},
	function (error) {
		// 如果有响应配置，则从正在进行的请求映射表中移除
		console.log(error);
		console.log(pendingRequests);
		if (error.config) {
			removePendingRequest(error.config);
			console.log(pendingRequests);
		}

		// 如果是重复请求被拦截，不显示错误消息
		if (error.duplicateRequest) {
			console.log("重复请求已被拦截:", error.message);
			return Promise.reject(error);
		}

		// 超出 2xx 范围的状态码都会触发该函数。
		// 对响应错误做点什么
		ElMessage({
			message: "请求失败，请规范操作！",
			type: "error"
		});
		console.log(error.message);
		return Promise.reject(error);
	}
);

export default api;
