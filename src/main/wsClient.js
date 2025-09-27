import WebSocket from "ws";
import store from "./store";
import { getWindowsMap } from "./windowProxy";
import { openWindow } from "./ipc";
import {
	saveOrUpdateChatSessionBatchInit,
	saveSession,
	selectUserSessionByContactId,
	selectUserSessionList
} from "./database/service/chatUserSessionService";
import {
	saveMessage,
	saveMessageBatchInit,
	updateMessage
} from "./database/service/chatMessageService";
import { updateContactNoReadCount } from "./database/service/userSettingService";

// 地址环境
const NODE_ENV = process.env.NODE_ENV;

let ws = null;
// 重连次数
let maxReConnectCount = null;
// 锁
let lockReConnect = false;
let wsUrl = null;
// 与渲染进程交互
let sender = null;
// 是否重连
let needReconnect = null;
let heartbeatInterval = null; // 用来保存发送心跳定时器ID

// 连接状态 默认未连接
const connectionStatus = "disconnected";

export const initWs = (userInfo, _sender) => {
	wsUrl =
		NODE_ENV === "development" ? store.getData("devWsDomain") : store.getData("prodWsDomain");
	sender = _sender;
	needReconnect = true;
	maxReConnectCount = 5;
	createWs(userInfo.token);
};

const createWs = (token) => {
	if (wsUrl == null) {
		return;
	}
	// 1、连接websocket
	console.log("连接ws");
	console.log(wsUrl);
	updateConnectionStatus("connecting");
	ws = new WebSocket(wsUrl + "?token=" + token, {
		handshakeTimeout: 10000, // 10秒超时
		perMessageDeflate: false // 禁用压缩
	});

	// 连接打开时触发
	ws.onopen = function () {
		console.log("WebSocket 连接已打开");
		// 重置重连次数
		maxReConnectCount = 5;
		lockReConnect = false;
		ws.send("Hello, Server!");
		// 跟新状态，并反馈给渲染进程
		updateConnectionStatus("connected");
	};

	// 接收消息时触发回调函数
	ws.onmessage = async function (event) {
		try {
			console.log("接收消息：\n" + event.data);
			const message = JSON.parse(event.data);
			const messageType = message.messageType;

			switch (messageType) {
				// 初始化消息
				case 0:
					// 1、保存会话信息
					await saveOrUpdateChatSessionBatchInit(
						message.extendData.chatSessionUserList ?? []
					);
					// 2、保存信息
					await saveMessageBatchInit(message.extendData.chatMessageList ?? []);
					// 3、跟新联系人申请数量
					await updateContactNoReadCount(
						store.getUserId(),
						message.extendData.applyUserCount,
						1,
						"contact_no_read"
					);
					await updateContactNoReadCount(
						store.getUserId(),
						message.extendData.applyGroupCount,
						1,
						"group_no_read"
					);
					
					// 4、通知渲染进程跟新会话列表
					updateLocalSessionData(sender);
					break;

				case 4: //好友申请
					await updateContactNoReadCount(store.getUserId(), 1, 1, "contact_no_read");
					sender.send("reciveMessage", message);
					break;
				case 14: //用户群聊申请
					await updateContactNoReadCount(store.getUserId(), 1, 1, "group_no_read");
					sender.send("reciveMessage", message);
					break;
				case 6: // 文件上传完成
					await updateMessage({ status: 1 }, { uuid: message.uuid });
					sender.send("reciveMessage", message);
					break;
				case 7: // 强制下线
					sender.send("reciveMessage", message);
					break;

				case 1: //添加好友消息
				case 2: // 文本消息
				case 3: // 群组已经创建
				case 5: // 媒体消息
				case 8: //群聊解散
				case 9: // 好友加入群组
				case 10: // 群聊信息跟新
				case 11: // 退出了群聊
				case 12: // 被管理员移出了群聊
				case 13: // 添加好友成功消息
					message.userId = store.getUserId();
					//群聊接收消息处理，如果是自己发送的不处理
					if (
						message.sendUserId == store.getUserId() &&
						message.recipientType == 1 &&
						(message.messageType == 2 || message.messageType == 5)
					) {
						break;
					}
					const sessionInfo = {};
					// 媒体消息
					if (message.extendData && typeof message.extendData === "object") {
						Object.assign(sessionInfo, message.extendData);
					} else {
						Object.assign(sessionInfo, message);
						// 不是群聊需要跟新发送的用户名
						if (message.recipientType == 0) {
							sessionInfo.contactName = message.sendUserNickName;
						}
						sessionInfo.lastMessage = message.lastMessage;
						sessionInfo.lastReceiveTime = message.sendTime;
					}

					// 退出加入群聊需要跟新群聊人数
					if (messageType == 9 || messageType == 11 || messageType == 12) {
						sessionInfo.memberCount = message.memberCount;
					}

					// 群聊退出加入系列操作需要跟新status
					if (messageType == 8) {
						sessionInfo.status = 0;
					} else if (
						(messageType == 11 || messageType == 12) &&
						message.sendUserId == store.getUserId()
					) {
						sessionInfo.status = 0;
					} else if (messageType == 9 && message.sendUserId == store.getUserId()) {
						sessionInfo.status = 1;
					}

					let contactId = message.sendUserId;

					if (
						messageType == 1 &&
						message.contactIdTemp &&
						sessionInfo.sendUserId == sessionInfo.recipientId
					) {
						sessionInfo.sendUserId = message.contactIdTemp;
						contactId = sessionInfo.sendUserId;
					}

					// 修改本地会话信息
					await saveSession(store.getUserData("currentChatSessionId"), sessionInfo);
					// 写入本地消息
					await saveMessage(message);
					if (message.recipientType == 1) {
						contactId = message.recipientId;
					}
					const session = await selectUserSessionByContactId(contactId);
					if (
						message.recipientType == 1 &&
						(message.messageType == 2 || message.messageType == 5)
					) {
						session.lastMessage = message.sendUserNickName + ":" + session.lastMessage;
					}
					message.extendData = session;
					// 发送渲染进程渲染界面
					sender.send("reciveMessage", message);
					break;
				case 15: // 视频通话
					let videoChatWindow = getWindowsMap("videoChat");

					if (!videoChatWindow) {
						// 创建窗口
						await videoChat(message.receiveUserId, message.sendUserId);
						videoChatWindow = getWindowsMap("videoChat");
						// 阻塞等待窗口初始化完成
						await new Promise((resolve) => {
							// 方式1: 等待DOM加载完成
							setTimeout(resolve, 2000);
						});

						videoChatWindow.webContents.send("webrtc:signal-message", message);
					} else {
						// 直接发送消息
						videoChatWindow.webContents.send("webrtc:signal-message", message);
					}
					break;
			}
		} catch (error) {
			console.error("消息处理错误:", error);
		}
	};

	// 连接关闭时触发
	ws.onclose = function (event) {
		console.log("WebSocket 连接已关闭，代码:", event.code, "原因:", event.reason);
		updateConnectionStatus("connecting");
		reConnect();
	};

	// 错误处理
	ws.onerror = function (error) {
		console.error("WebSocket 错误:", error);
		if (error.error && error.error.code === "ETIMEDOUT") {
			console.log("连接超时，尝试重连...");
		}
		updateConnectionStatus("connecting");
		reConnect();
	};

	// 判断是否已经开启定时器
	if (!heartbeatInterval) {
		// 5s发送一次心跳
		heartbeatInterval = setInterval(() => {
			// 检查连接是否已打开
			if (ws != null && ws.readyState == 1) {
				console.log("发送心跳");
				ws.send("heart beat");
				// 反馈给渲染进程心跳
				updateConnectionStatus("connected");
			}
		}, 5000);
	}
};

const reConnect = () => {
	if (!needReconnect) {
		console.log("服务器断开，无需重连");
		return;
	}
	// 判断是否有其他占用重连
	if (lockReConnect) {
		return;
	}
	// 开始重连，马上设置lockReConnect 表示正常重连
	lockReConnect = true;
	if (maxReConnectCount > 0) {
		maxReConnectCount--;
		setTimeout(() => {
			// 重连
			createWs(store.getToken());
			lockReConnect = false;
		}, 5000);
	} else {
		console.log("连接超时");
		// 跟新状态，并反馈给渲染进程
		updateConnectionStatus("disconnected");
	}
};

// 停止心跳
export const stopHeartbeat = () => {
	console.log("发送心跳定时器:" + heartbeatInterval);
	if (heartbeatInterval) {
		// 清除定时器
		clearInterval(heartbeatInterval);
		heartbeatInterval = null; // 可选：清除变量引用
		console.log("心跳已停止");
		// 关闭重连
		needReconnect = false;
	}
	ws.close();
	// 跟新状态，并反馈给渲染进程
	updateConnectionStatus("disconnected");
};

export const closeWs = () => {
	stopHeartbeat();
};

/**
 * 发送信令消息到服务器
 * @param {Object} message - 信令消息对象
 */
export const sendSignalMessage = (message) => {
	if (!ws || ws.readyState !== WebSocket.OPEN) {
		sender.send("webrtc:connection-error", "WebSocket not connected");
		return false;
	}

	try {
		const messageString = JSON.stringify(message);
		// 发送信令消息到服务器
		ws.send(messageString);
		console.log(`Signal message sent: ${message.signalType}`);
		return true;
	} catch (error) {
		sender.send("webrtc:connection-error", "Failed to send signal message");
		return false;
	}
};

/**
 * 更新连接状态并通知渲染进程
 * @param {string} status - 连接状态
 */
const updateConnectionStatus = (status) => {
	connectionStatus = status;
	const videoChatWindow = getWindowsMap("videoChat");
	if (videoChatWindow) {
		videoChatWindow.webContents.send("webrtc:connection-status", status);
	}
};

// 打开视频聊天窗口
const videoChat = async (useId, recipient) => {
	const param = {
		windowId: "videoChat",
		title: "视频通话",
		path: "/videoChat",
		data: { useId, recipient }
	};
	await openWindow(param);
};

// 跟新会话
const updateLocalSessionData = async (e) => {
	const sessionList = await selectUserSessionList();
	e.send("localSessionDataCallback", sessionList);
};
