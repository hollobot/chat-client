import { ipcMain, BrowserWindow, dialog, shell } from "electron";
import fs from "fs-extra";
const pkg = require("../../package.json");
import { is } from "@electron-toolkit/utils";
import store from "./store";
import { initWs } from "./wsClient";
const path = require("path");
import {
	addUserSetting,
	selectSettingInfoByUserID,
	updateContactNoReadCount,
	selectFolder,
	updateFilePath,
	selectSettingInfoByEmail,
	selectAllEmail
} from "./database/service/userSettingService";
import { join } from "path";
const NODE_ENV = process.env.NODE_ENV;
import { saveTempFile } from "./file";

import {
	selectMessagePageList,
	saveMessage,
	updateMessage
} from "./database/service/chatMessageService";
import { stopHeartbeat, closeWs } from "./wsClient";
import {
	selectUserSessionList,
	delUserSession,
	topUserSession,
	updateUserSessionInfo,
	readAll,
	updateChatSeeion,
	selectUserSession
} from "./database/service/chatUserSessionService";
import { saveFile, saveFileToLocal, stopLocalServer } from "./file";
import { delWindowsMap, getWindowsMap, setWindowsMap, windowsMap } from "./windowProxy";

/**
 * 登录成功进入main页面
 * @param {fun} callback
 */
export const winToMain = (callback) => {
	ipcMain.on("toMain", (e, userInfo) => {
		// 1、保存信息
		store.setUserId(userInfo.userId);
		store.setUserData("userInfo", userInfo);
		callback(userInfo);
		// 2、ws 初始化操作
		initWs(userInfo, e.sender);
		// 3、添加用户配置
		addUserSetting(userInfo.userId, userInfo.email);
	});
};

/**
 * 窗口导航控制操作
 * @param {fun} callback
 */
export const winControl = (callback) => {
	ipcMain.on("sendWinControl", (e, config) => {
		callback(e, config);
	});
};

export const onSetLocalStore = () => {
	ipcMain.on("setLocalStore", (e, { key, value }) => {
		console.log("保存信息:  " + key + "->" + value);
		store.setData(key, value);
	});
};

export const onGetFileServerProt = () => {
	ipcMain.on("fileServerProt", async (e, key) => {
		e.sender.send("fileServerProtCallback", store.getData(key));
	});
};

export const onLocalSessionData = () => {
	ipcMain.on("localSessionData", async (e) => {
		const sessionList = await selectUserSessionList();
		e.sender.send("localSessionDataCallback", sessionList);
	});
};

/**
 * 停止心跳
 */
export const onStopHeartbeat = () => {
	ipcMain.on("stopHeartbeat", (e) => {
		stopHeartbeat();
	});
};

export const onTopChatSession = () => {
	ipcMain.on("topChatSession", (e, { contactId, topType }) => {
		topUserSession(contactId, topType);
	});
};

export const onDelChatSessionn = () => {
	ipcMain.on("delChatSession", (e, contactId) => {
		delUserSession(contactId);
	});
};

export const onLoadChatMessage = () => {
	ipcMain.on("loadChatMessage", async (e, pageInfo) => {
		const result = await selectMessagePageList(pageInfo);
		e.sender.send("loadChatMessageCallback", result);
	});
};

export const onSetCurrentSession = () => {
	ipcMain.on("setCurrentSession", (e, { contactId, sessionId }) => {
		if (sessionId) {
			store.setUserData("currentChatSessionId", sessionId);
			// 修改会话，全部已读
			readAll(contactId);
		} else {
			store.deleteUserIdData("currentChatSessionId");
		}
	});
};

export const onAddLocalMessage = () => {
	ipcMain.on("addLocalMessage", async (e, messageDto) => {
		// 1、保存消息
		await saveMessage(messageDto);
		// 如果是媒体消息，需要把媒体文件保存到本地中
		if (messageDto.messageType == 5) {
			// 文件存入到本地，上传服务器
			await saveFileToLocal(messageDto.uuid, messageDto.filePath, messageDto.fileType);
			// 修改消息状态
			await updateMessage({ status: 1 }, { uuid: messageDto.uuid });
		}
		// 2、跟新会话
		messageDto.lastReceiveTime = messageDto.sendTime;
		messageDto.contactId = messageDto.recipientId;
		await updateUserSessionInfo(store.getUserData("currentChatSessionId"), messageDto);
		// 3、发送给渲染进程跟新消息列表
		e.sender.send("addLocalMessageCallback", { status: 1, uuid: messageDto.uuid });
	});
};

export const onNewWindow = () => {
	ipcMain.on("newWindow", (e, config) => {
		openWindow(config);
	});
};

export const openWindow = ({ windowId, title = "chat", path, width = 800, height = 560, data }) => {
	console.log("打开窗口: " + JSON.stringify(windowsMap));
	let newWindow = getWindowsMap(windowId);
	// 没有窗口创建窗口
	if (!newWindow) {
		newWindow = new BrowserWindow({
			width: width, // 宽度
			height: height, // 高度
			resizable: true, // 禁止用户调整窗口大小
			center: true, // 窗口居中
			title: title,
			show: false, //窗口会立即显示，而不等内容加载完成
			// frame: false, // 隐藏默认窗口边框，启用自定义标题栏
			autoHideMenuBar: true, // 是否隐藏菜单栏
			titleBarStyle: "hidden",
			maximizable: false,
			webPreferences: {
				preload: join(__dirname, "../preload/index.js"),
				sandbox: false,
				contextIsolation: false, //关闭上下文隔离
				nodeIntegration: true, // ✅ 启用 Node.js 集成
				webSecurity: true // 防止跨站脚本攻击（XSS）、跨站请求伪造（CSRF）
			}
		});
		setWindowsMap(windowId, newWindow);
		newWindow.setMinimumSize(600, 484);
		// 使用 Vite 开发服务器提供的 URL
		// 例如: http://localhost:5173/index.html#/admin
		// 判断是否是生产环境
		if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
			newWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/index.html#${path}`);
		} else {
			newWindow.loadFile(join(__dirname, "../renderer/index.html"), { hash: path });
		}

		if (NODE_ENV === "development") {
			// 打开开发者工具
			// newWindow.webContents.openDevTools();
		}

		newWindow.on("ready-to-show", () => {
			newWindow.setTitle(title);
			// 显示窗口
			newWindow.show();
		});
		newWindow.once("show", () => {
			setTimeout(() => {
				// 发送给渲染进程
				newWindow.webContents.send("pageInitData", data);
			}, 500);
		});
		// 监听窗口关闭
		newWindow.on("closed", () => {
			delWindowsMap(windowId);
		});
	} else if (windowId === "media") {
		newWindow.show();
		// 是否移除任务栏
		newWindow.setSkipTaskbar(false);
		// 发送给渲染进程
		newWindow.webContents.send("pageInitData", data);
	} else if (windowId === "admin") {
		// 显示窗口
		newWindow.show();
		// 恢复最小化状态
		if (newWindow.isMinimized()) {
			newWindow.restore();
		}
		// 聚焦窗口
		newWindow.focus();
	}
};

// 保存文件
export const onDownloadFile = () => {
	ipcMain.on("downloadFile", (e, data) => {
		saveFile(data);
	});
};

export const onSaveMemoryFileToLocal = () => {
	ipcMain.on("saveMemoryFileToLocal", async (e, data) => {
		const result = await saveTempFile(data);
		e.sender.send("saveMemoryFileToLocalCallback", result);
	});
};

// 查询未读数据
export const onLocalCountApply = () => {
	ipcMain.on("localCountApply", async (e) => {
		const data = await selectSettingInfoByUserID(store.getUserId());
		e.sender.send("localCountApplyCallback", data);
	});
};

export const onClearNoReadCount = () => {
	ipcMain.on("clearNoReadCount", (e, { userId, type }) => {
		if (type == "user") {
			updateContactNoReadCount(userId, 0, 0, "contact_no_read");
		} else if (type == "group") {
			updateContactNoReadCount(userId, 0, 0, "group_no_read");
		}
	});
};

export const onDelCurrentSession = () => {
	ipcMain.on("delCurrentSession", (e) => {
		store.deleteUserIdData("currentChatSessionId");
	});
};

export const onReLogin = (callback) => {
	ipcMain.on("reLogin", (e) => {
		callback();
		closeWs();
		stopLocalServer();
		e.sender.send("reLoginCallback");
	});
};

export const onGetLocalFileFolder = () => {
	ipcMain.on("getLocalFileFolder", (e) => {
		const path = store.getUserData("localFileFolder");
		e.sender.send("onGetLocalFileFolderCallback", path);
	});
};

// 选择文件夹   dialog 是 Electron 提供的 原生对话框模块，比如：打开文件/文件夹选择框 dialog.showOpenDialog()
export const onSelectFolder = () => {
	ipcMain.on("selectFolder", async (e) => {
		// 这是 Electron 提供的 主进程 API，用于弹出一个 文件或文件夹选择对话框。
		const result = await dialog.showOpenDialog({
			// 允许选择文件夹
			properties: ["openDirectory"]
		});
		e.sender.send("selectFolderCallback", result);
	});
};

// 打开文件夹 shell 用于调用操作系统的“外部行为”，比如： 打开某个文件或文件夹 shell.openPath(path)
export const onOpenFolder = () => {
	ipcMain.on("openFolder", (e, folderPath) => {
		shell.openPath(folderPath);
	});
};

// 获取数据库的文件缓存路径
export const onGetDatabaseFolderPath = () => {
	ipcMain.on("getDatabaseFolderPath", async (e) => {
		const folderPath = await selectFolder(store.getUserId());
		e.sender.send("getDatabaseFolderPathCallback", folderPath);
	});
};

export const onMvFiles = () => {
	ipcMain.on("mvFiles", async (e, selectedPath) => {
		let code = 1; //成功

		selectedPath += "\\";
		const curFilePath = store.getUserData("localFileFolder");
		// 获取当前文件夹名
		const folderName = path.basename(curFilePath);
		const destPath = path.join(selectedPath, folderName);

		// 防止无限递归复制到自身目录
		if (path.resolve(destPath).startsWith(path.resolve(curFilePath))) {
			code = 3;
			console.error("目标路径不能是源路径的子目录");
			e.sender.send("mvFilesCallback", { code, selectedPath });
			return;
		}

		try {
			// 尝试移动整个目录
			await fs.copy(curFilePath, destPath, { overwrite: true, errorOnExist: false });
		} catch (err) {
			code = 2;
			console.error("移动文件夹失败：", err);
			e.sender.send("mvFilesCallback", { code, selectedPath });
			return;
		}
		// 设置store
		store.setUserData("localFileFolder", destPath);
		// 修改数据库
		updateFilePath({ userId: store.getUserId(), selectedPath });
		e.sender.send("mvFilesCallback", { code, selectedPath });
	});
};

// 创建新的会话
export const onCreateNewSession = () => {
	ipcMain.on("createNewSession", async (e, contactId) => {
		await updateChatSeeion({ contactId, status: 1 });
		const session = await selectUserSession(contactId);
		e.sender.send("createNewSessionCallback", session);
	});
};

export const onGetAvatar = () => {
	ipcMain.handle("getAvatar", async (e, email) => {
		try {
			const data = await selectSettingInfoByEmail(email);
			if (!data) {
				return;
			}
			const userId = data.userId;
			const avatarPath = path.join(
				JSON.parse(data.sysSetting).localFileFolder,
				`${userId}\\avatar`,
				`\\${userId}.jpg`
			);

			// 检查文件是否存在
			if (!fs.existsSync(avatarPath)) {
				return null;
			}

			// 读取图片文件并转换为 base64
			const imageBuffer = fs.readFileSync(avatarPath);
			const imageBase64 = imageBuffer.toString("base64");

			return `data:image/jpeg;base64,${imageBase64}`;
		} catch (error) {
			console.error("获取头像失败:", error);
			return null;
		}
	});
};

export const onGetEmailHistory = () => {
	ipcMain.handle("getEmailHistory", async (e, queryString) => {
		try {
			// 获取所有邮箱历史记录
			const data = await selectAllEmail();
			// 筛选数据 如果没有数据，直接返回空数组
			return data.filter((item) =>
				item.email.toLowerCase().includes(queryString.toLowerCase())
			);
		} catch (error) {
			console.error("获取邮箱历史失败:", error);
			return [];
		}
	});
};

// 获取客户端version
export const onGetAppVersion = () => {
	// 监听版本请求
	ipcMain.handle("getAppVersion", () => {
		return pkg.version;
	});
};

// 打开浏览器
export const OnOpenUpdateUrl = () => {
	ipcMain.handle("openUpdateUrl", async (event, url) => {
		console.log(url)
		try {
			// 打开浏览器地址
			await shell.openExternal(url);
			return { success: true };
		} catch (error) {
			console.error("Failed to open URL:", error);
			return { success: false, error: error.message };
		}
	});
};
