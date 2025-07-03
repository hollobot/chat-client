import { app, shell, BrowserWindow, Tray, Menu } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import {
	openWindow,
	winToMain,
	winControl,
	onGetFileServerProt,
	onSetLocalStore,
	onStopHeartbeat,
	onLocalSessionData,
	onTopChatSession,
	onDelChatSessionn,
	onLoadChatMessage,
	onAddLocalMessage,
	onSetCurrentSession,
	onNewWindow,
	onDownloadFile,
	onSaveMemoryFileToLocal,
	onLocalCountApply,
	onClearNoReadCount,
	onDelCurrentSession,
	onReLogin,
	onGetLocalFileFolder,
	onSelectFolder,
	onOpenFolder,
	onGetDatabaseFolderPath,
	onMvFiles,
	onCreateNewSession,
	onGetAvatar,
	onGetEmailHistory,
	onGetAppVersion,
	OnOpenUpdateUrl
} from "./ipc";
import { setWindowsMap } from "./windowProxy";

function createWindow() {
	const windowInit = (win) => {
		// TODO
		// win.setSize(863, 600);
		win.setSize(700, 550);
		win.setResizable(true);
		win.center();
		win.setMaximizable(true);
		win.setMinimumSize(700, 550);
	};

	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 350, // 宽度
		height: 480, // 高度
		resizable: false, // 禁止用户调整窗口大小
		center: true, // 窗口居中
		title: "微信登录",
		show: false, //窗口会立即显示，而不等内容加载完成
		// frame: false, // 隐藏默认窗口边框，启用自定义标题栏
		autoHideMenuBar: true, // 是否隐藏菜单栏
		titleBarStyle: "hidden",

		...(process.platform === "linux" ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			sandbox: false,
			contextIsolation: false, //关闭上下文隔离
			nodeIntegration: true, // ✅ 启用 Node.js 集成
			webSecurity: true // 防止跨站脚本攻击（XSS）、跨站请求伪造（CSRF）
		}
	});

	// 将主窗口添加到map里
	setWindowsMap("main", mainWindow);

	const createTray = (win, type = "login", isAdmin = false) => {
		// 创建托盘图标
		const tray = new Tray(join(__dirname, "../../src/assets/image/avatar.jpg"));

		let menuTemplate = [
			{
				label: "显示窗口",
				click: () => {
					win.setSkipTaskbar(false); // 重新添加到任务栏
					win.show(); // 显示窗口
				}
			},
			{
				label: "退出",
				click: () => {
					app.quit();
				}
			}
		];

		// 如果是主界面，添加后台运行选项
		if (type === "main" && isAdmin) {
			menuTemplate.push({
				label: "管理后台",
				click: () => {
					createAdminWindow();
				}
			});
		}
		// 托盘菜单
		const contextMenu = Menu.buildFromTemplate(menuTemplate);

		// 设置托盘图标提示文本
		tray.setToolTip("聊天客户端");
		// 设置托盘菜单
		tray.setContextMenu(contextMenu);

		// 添加托盘双击事件
		tray.on("double-click", () => {
			win.setSkipTaskbar(false); // 恢复任务栏显示
			win.show(); // 显示窗口
		});

		// 保存托盘引用 后续可以通过 mainWindow.tray 访问托盘对象
		win.tray = tray;
	};

	//调用托盘
	createTray(mainWindow);

	mainWindow.on("ready-to-show", () => {
		// 显示窗口
		mainWindow.show();
		// 打开开发者工具
		// mainWindow.webContents.openDevTools();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	/**
	 * 进入main界面
	 */
	winToMain((userInfo) => {
		windowInit(mainWindow);
		// 创建新的托盘
		if (mainWindow.tray) {
			mainWindow.tray.destroy();
		}
		createTray(mainWindow, "main", userInfo.isAdmin);
	});

	const createAdminWindow = () => {
		openWindow({
			windowId: "admin",
			title: "后台管理系统",
			path: "/admin",
			width: 1200,
			height: 700
		});
	};

	winControl((e, config) => {
		const { action, type } = config;
		const webContents = e.sender;
		const win = BrowserWindow.fromWebContents(webContents);
		switch (action) {
			case "close": {
				if (type === 1) {
					//将窗口从任务栏中移除。
					win.setSkipTaskbar(true);
					//窗口从屏幕上消失，但仍在运行。
					win.hide();
				} else {
					win.close();
				}
				break;
			}
			case "min": {
				win.minimize();
				break;
			}
			case "max": {
				if (type) {
					win.maximize();
				} else {
					win.unmaximize();
				}
				break;
			}
			case "pin": {
				// 将窗口置顶
				win.setAlwaysOnTop(type);
				break;
			}
		}
	});

	onGetFileServerProt();
	onSetLocalStore();
	onStopHeartbeat();
	onLocalSessionData();
	onTopChatSession();
	onDelChatSessionn();
	onLoadChatMessage();
	onAddLocalMessage();
	onSetCurrentSession();
	onNewWindow();
	onDownloadFile();
	onSaveMemoryFileToLocal();
	onLocalCountApply();
	onClearNoReadCount();
	onDelCurrentSession();
	onReLogin(() => {
		// 重新登录后重置窗口大小
		mainWindow.setMinimumSize(200, 400);
		mainWindow.setSize(350, 480);
		mainWindow.center(); // 窗口居中
		mainWindow.setResizable(false);
	});
	onGetLocalFileFolder();
	onSelectFolder();
	onOpenFolder();
	onGetDatabaseFolderPath();
	onMvFiles();
	onCreateNewSession();
	onGetAvatar();
	onGetEmailHistory();
	onGetAppVersion();
	OnOpenUpdateUrl();

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
		mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId("com.electron");

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on("browser-window-created", (_, window) => {
		optimizer.watchWindowShortcuts(window);
	});

	createWindow();

	app.on("activate", function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

