<template>
	<div class="message-send">
		<div class="topbar">
			<el-popover
				popper-class="expression"
				placement="top"
				width="400"
				height="300"
				trigger="click"
				ref="visible"
				:hide-after="0"
			>
				<template #reference>
					<span @click="addClickEvent" class="iconfont icon-xiaolian"></span>
				</template>
				<template #default>
					<el-tabs v-model="activeName">
						<el-tab-pane
							v-for="emojis in emojiList"
							:label="emojis.category"
							:name="emojis.category"
							class="expression-tabs scroll-content"
						>
							<div
								class="emoji-box"
								v-for="emoji in emojis.emojis"
								:title="emoji.name"
								@click="hidePopover(emoji.emoji)"
							>
								{{ emoji.emoji }}
							</div>
						</el-tab-pane>
					</el-tabs>
				</template>
			</el-popover>

			<el-upload
				class="upload-file"
				ref="fileRef"
				multiple
				:show-file-list="false"
				:limit="limit"
				:http-request="uplocadFile"
				:on-exceed="uploadExceed"
			>
				<div class="iconfont icon-wenjianjia"></div>
			</el-upload>
		</div>
		<el-input
			v-model="messageContent"
			:show-word-limit="true"
			maxlength="500"
			type="textarea"
			class="input-area"
			@drop="dropHandler"
			@paste="pasteFile"
			@keydown="handleKeydown"
		/>
		<div class="send-btn">
			<el-popover
				popper-class="expression"
				placement="top"
				trigger="click"
				:visible="showSendPopover"
			>
				<template #reference>
					<el-button @click="debouncedSendMessage">发送</el-button>
				</template>
				<template #default>
					<span class="empty-msg">不能发送空白消息</span>
				</template>
			</el-popover>
		</div>
	</div>
</template>

<script setup>
	import { onMounted, onUnmounted, ref, nextTick } from "vue";
	import { emojiList } from "@/assets/data/areas";
	import { ElMessage, ElMessageBox } from "element-plus";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	import { storeToRefs } from "pinia";
	const userInfoStore = useUserInfoStore();
	import { send } from "@/api/chatApi";
	import { escapeHtml } from "@/utils/stringUtils";
	import { getFileType, File_TYPE, getFileCategory } from "@/constant/fileConst";
	import { useSysSettingStore } from "@/stores/sysSettingStore";
	const sysSettingStore = useSysSettingStore();
	import { debounce } from "lodash-es"; // 添加 lodash-es 导入

	// 用来获取客户上传文件的路径
	const { webUtils } = require("electron");

	const emit = defineEmits(["sendMessageLocal"]);

	const { userInfo } = storeToRefs(userInfoStore);

	const activeName = ref("笑脸");

	const messageContent = ref("");

	const showSendPopover = ref(false);

	const visible = ref();
	// 隐藏 Popover
	const hidePopover = (value) => {
		messageContent.value = messageContent.value + value;
		visible.value.hide();
	};

	const props = defineProps({
		currentChatSession: {
			type: Object,
			default: {}
		}
	});

	// 处理键盘事件
	const handleKeydown = async (e) => {
		// 如果是 shift + enter
		if (e.shiftKey && e.key === "Enter") {
			e.preventDefault(); // 阻止默认行为
			const cursorPosition = e.target.selectionStart;
			messageContent.value =
				messageContent.value.slice(0, cursorPosition) +
				"\n" +
				messageContent.value.slice(cursorPosition);
			// 下一帧更新光标位置
			await nextTick(() => {
				e.target.selectionStart = e.target.selectionEnd = cursorPosition + 1;
				e.target.focus(); // 确保输入框保持焦点
				// 强制滚动到光标位置
				e.target.scrollTop = e.target.scrollHeight;
			});
			return;
		}

		// 如果只是回车
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault(); // 阻止默认换行
			debouncedSendMessage(e);
		}
	};

	let flog = ref(false);
	// 创建防抖后的发送消息函数
	const debouncedSendMessage = debounce((e) => {
		if (flog.value) return;
		flog.value = true;
		messageContent.value = messageContent.value.trim();
		if (!messageContent.value) {
			showSendPopover.value = true;
			setTimeout(() => {
				showSendPopover.value = false;
			}, 2000);
			flog.value = false;
			return;
		}
		sendMessageDo({ messageContent: messageContent.value, messageType: 2 }, true);
	}, 100); // 300 毫秒的防抖延时

	const sendMessageDo = async (
		messageObj = {
			messageContent,
			messageType,
			localFilePath,
			fileSize,
			fileName,
			filePath,
			fileType
		},
		cleanMsgContent = true
	) => {
		// 判断文件大小
		if (
			messageObj.messageType == 5 &&
			!checkFileSize(messageObj.fileType, messageObj.fileSize, messageObj.fileName)
		) {
			return;
		}
		if (messageObj.messageType == 5 && messageObj.fileSize == 0) {
			ElMessage.warning(`${messageObj.fileName}是一个空文件，无法发送`);
			return;
		}

		messageObj.sessionId = props.currentChatSession.sessionId;
		messageObj.sendUserId = userInfo.value.userId;
		messageObj.userId = userInfo.value.userId;

		// 发送http请求发送信息
		const data = await send({
			uuid: crypto.randomUUID(),
			contactId: props.currentChatSession.contactId,
			messageContent: escapeHtml(messageObj.messageContent),
			messageType: messageObj.messageType,
			fileSize: messageObj.fileSize,
			fileName: messageObj.fileName,
			fileType: messageObj.fileType
		});

		//  是否清空文本内容
		if (cleanMsgContent) {
			messageContent.value = "";
		}

		if (data.code == 901 || data.code == 902) {
			// 不是好友提示
			ElMessage({
				message: data.data.message,
				type: "error"
			});
			return;
		}

		if (data.data == null) {
			const data = {
				lastMessage: messageObj.messageContent,
				recipientId: messageObj.sendUserId,
				recipientType: 0,
				sendTime: Date.now(),
				sendUserNickName: userInfo.value.nickName,
				status: 1,
				uuid: crypto.randomUUID()
			};
			Object.assign(messageObj, data);
		} else {
			Object.assign(messageObj, data.data);
		}

		// 跟新本地消息
		emit("sendMessageLocal", messageObj);
		// 插入数据到本地数据库里、如果是文件还会上传服务器
		window.ipcRenderer.send("addLocalMessage", messageObj);
		flog.value = false; // 重置发送状态
	};

	// 选择文件传输
	const fileRef = ref();
	const uplocadFile = (fileObj) => {
		const file = fileObj.file;
		const path = webUtils.getPathForFile(file);
		file.path = path;
		uplocadFileDo(file);
		fileRef.value.clearFiles();
	};

	const uplocadFileDo = (file) => {
		const fileType = getFileTypeByName(file.name);
		sendMessageDo(
			{
				messageContent: `[${File_TYPE[fileType]}]`,
				messageType: 5,
				fileSize: file.size,
				fileName: file.name,
				filePath: file.path,
				fileType: fileType
			},
			false
		);
	};

	const getFileTypeByName = (fileName) => {
		const fileSuffix = fileName.substr(fileName.lastIndexOf(".") + 1);
		return getFileType(fileSuffix);
	};

	// 上传文件触发
	const uploadExceed = (files) => {
		checkFileLimit(files);
	};

	// 校验发送的文件大小
	const checkFileSize = (fileType, fileSize, fileName) => {
		const arrFileType = ["maxImageSize", "maxVideoSize", "maxFileSize"];
		const SIZE_MB = fileSize / (1024 * 1024);
		const sysSetting = sysSettingStore.getSysSetting();
		const fileMaxSize = sysSetting[arrFileType[fileType]];
		if (SIZE_MB > fileMaxSize) {
			ElMessageBox.alert(`文件"${fileName}"超出最大${fileMaxSize}MB限制`, "提示", {
				confirmButtonText: "OK"
			});
			return false;
		}
		return true;
	};

	// 校验文件数量
	const limit = ref(7);
	const checkFileLimit = (files) => {
		if (files.length > limit.value) {
			checkFileSize();
			ElMessageBox.alert(`一次最多选中${limit.value}个文件`, "提示", {
				confirmButtonText: "OK"
			});
			return false;
		}
		return true;
	};

	// 当用户 释放鼠标，将文件/元素放入目标区域时触发。
	const dropHandler = (event) => {
		event.preventDefault();
		const files = event.dataTransfer.files;
		if (!checkFileLimit(files)) {
			return;
		}
		for (let i = 0; i < files.length; i++) {
			const path = webUtils.getPathForFile(files[i]);
			files[i].path = path;
			uplocadFileDo(files[i]);
		}
	};

	// 监听用户的 粘贴（Ctrl+V 或右键粘贴） 事件
	const pasteFile = (event) => {
		let items = event.clipboardData && event.clipboardData.items;
		for (const item of items) {
			// 只处理文件
			if (item.kind != "file") {
				continue;
			}
			const file = item.getAsFile();
			// 尝试获取文件的本地路径（webUtils 是 Electron 的工具）
			const path = webUtils.getPathForFile(file);
			// 存在硬盘里
			if (path) {
				file.path = path;
				uplocadFileDo(file);
			} else {
				// 内存上没有路径
				const messageContent = getFileCategory(
					file.type.substring(0, file.type.lastIndexOf("/"))
				);
				// ⬇️ 转成 ArrayBuffer，再传给主进程
				file.arrayBuffer().then((buffer) => {
					window.ipcRenderer.send("saveMemoryFileToLocal", {
						messageContent: messageContent,
						fileSize: file.size,
						fileName: file.name,
						buffer: Buffer.from(buffer)
					});
				});
			}
		}
	};

	onMounted(() => {
		window.ipcRenderer.on("saveMemoryFileToLocalCallback", (e, data) => {
			const { messageContent, size, fileName, savePath } = data;
			// 先发送消息
			sendMessageDo(
				{
					messageContent: `[${messageContent}]`,
					filePath: savePath,
					messageType: 5,
					fileSize: size,
					fileName: fileName,
					fileType: File_TYPE[messageContent]
				},
				false
			);
		});
	});

	onUnmounted(() => {
		window.ipcRenderer.removeAllListeners("saveMemoryFileToLocalCallback");
	});
</script>

<style lang="scss" scoped>
	.expression {
		.expression-tabs {
			width: 100%;
			height: 300px;
			display: flex;
			flex-wrap: wrap;
			.emoji-box {
				cursor: pointer; /* 鼠标悬停时显示手指形状 */
				width: 30px;
				height: 30px;
				font-size: 18px;
				line-height: 30px;
				text-align: center;
				&:hover {
					background-color: #f2f2f2;
				}
			}
		}
	}
	.message-send {
		.topbar {
			margin: 10px 20px 5px 20px;
			height: 20px;
			display: flex;
			.iconfont {
				width: 20px;
				height: 20px;
				opacity: 0.8;
				cursor: pointer; /* 鼠标悬停时显示手指形状 */
			}
			.icon-xiaolian {
				margin-right: 15px;
			}

			.upload-file {
				.iconfont {
					color: black;
				}
			}
		}
		.input-area {
			:deep(.el-textarea__inner) {
				padding-right: 15px; /* 给滚动条留出空间 */
				width: calc(100% - 20px);
				margin: 0 10px;
				height: 40px;
				resize: none;
				box-shadow: none;
				background-color: #f5f5f5;
				overflow: hidden; /* 默认隐藏滚动条 */
				transition: overflow 0.3s; /* 平滑过渡效果 */
				&:hover {
					overflow-y: auto; /* 鼠标悬停时显示滚动条 */
				}
				&::-webkit-scrollbar {
					width: 5px; /* 必须设置滚动条宽度 */
				}

				&::-webkit-scrollbar-thumb {
					background-color: #d2d2d2; /* 滑块的默认颜色 */
					border-radius: 4px;
					height: 20px;
				}
			}
		}
		.send-btn {
			display: flex;
			justify-content: end;
			.el-button {
				margin: 10px 40px;
				height: 30px;
				width: 100px;
				color: #07c160;
				background-color: #e9e9e9;
				font-size: 16px;
				&:hover {
					background-color: #d2d2d2;
				}
			}
		}
	}
</style>
