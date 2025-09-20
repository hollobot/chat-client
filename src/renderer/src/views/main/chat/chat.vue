<template>
	<layout>
		<!-- 搜索 -->
		<template #contact-search>
			<div class="contact-search">
				<!-- keyup 键盘触发 -->
				<el-input
					v-model="searchInput"
					placeholder="搜索"
					clearable
					size="small"
					@keyup="searchContact"
				>
					<template #prefix>
						<span :class="['iconfont', 'icon-weixinsousuoicon']"></span>
					</template>
				</el-input>
				<div
					:class="['contact-add', 'iconfont', 'icon-faqiqunliao']"
					@click="searchContact"
				></div>
			</div>
		</template>

		<!-- 会话列表 -->
		<template #data-list>
			<el-scrollbar>
				<template v-if="!searchInput">
					<chatSession
						v-for="sessionInfo in chatSessionList"
						:key="sessionInfo.sessionId"
						:session-info="sessionInfo"
						:current-session="currentChatSession?.sessionId == sessionInfo.sessionId"
						@contextmenu.stop="onContextMenu(sessionInfo, $event)"
						@click="chatSessionListHandler(sessionInfo)"
					></chatSession>
				</template>
				<template v-if="searchInput">
					<SearchSession
						v-for="sessionInfo in searchList"
						:key="sessionInfo.sessionId"
						:session-info="sessionInfo"
						@clear-search="searchInput = null"
					></SearchSession>
				</template>
			</el-scrollbar>
		</template>

		<!-- 标题 -->
		<template #right-drag>
			<div v-if="currentChatSession" class="title">
				<div class="title-name">
					{{ currentChatSession.contactName }}
					{{
						currentChatSession.memberCount != 0
							? "(" + currentChatSession.memberCount + ")"
							: ""
					}}
				</div>
				<div
					v-if="currentChatSession.contactType == 1 && groupInfoInfo"
					class="no-drag iconfont icon-sangediandian"
					@click="showGroupDetail(currentChatSession)"
				></div>
			</div>
		</template>

		<!-- 聊天页面 -->
		<template #right-no-drag>
			<template v-if="currentChatSession">
				<el-scrollbar
					ref="scrollbarRef"
					class="scrollbar-message"
					:class="{ hidden: !isShowScrollbar }"
					@scroll="handleScroll"
				>
					<!-- 顶部加载动画 -->
					<div
						v-show="isLoadingHistory"
						class="history-loading iconfont icon-jiazai"
					></div>
					<template v-for="item in renderedTimeMessages" :key="item.messageId">
						<!-- 展示聊天消息时间 -->
						<ChatMessageTime v-show="item.showTime" :data="item"></ChatMessageTime>
						<!--
						1：//添加好友成功
						3://群创建成功
						8://解散群聊
						9://好友加入群组
						11://退出群聊 
						12://退出群聊(踢出)
						-->
						<template
							v-if="
								item.messageType == 1 ||
								item.messageType == 3 ||
								item.messageType == 8 ||
								item.messageType == 9 ||
								item.messageType == 10 ||
								item.messageType == 11 ||
								item.messageType == 12
							"
						>
							<ChatMessageSys :data="item"></ChatMessageSys>
						</template>
						<template
							v-if="
								item.messageType == 1 ||
								item.messageType == 2 ||
								item.messageType == 5
							"
						>
							<ChatMessage
								:data="item"
								:current-chat-session="currentChatSession"
								@show-media-detail="showMediaDetailHandler"
							></ChatMessage>
						</template>
					</template>
				</el-scrollbar>
				<div class="message-send">
					<MessageSend
						:current-chat-session="currentChatSession"
						@send-message-local="sendMessageLocalHandler"
					></MessageSend>
				</div>
			</template>
			<template v-else>
				<blank></blank>
			</template>
		</template>
	</layout>
	<ChatGroupDetail ref="chatGropDetailRef" @del-session="delGroupSession"></ChatGroupDetail>
</template>

<script setup>
	import { onMounted, ref, nextTick, computed, onUnmounted, watch } from "vue";
	import layout from "@/components/layout.vue";
	import ChatMessageTime from "./chatMessageTime.vue";
	import ChatMessageSys from "./chatMessageSys.vue";
	import ChatGroupDetail from "./chatGroupDetail.vue";
	import MessageSend from "./messageSend.vue";
	import ChatMessage from "@/views/main/chat/chatMessage.vue";
	import blank from "@/components/blank.vue";
	import SearchSession from "./searchSession.vue";
	import chatSession from "./chatSession.vue";
	import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";
	import ContextMenu from "@imengyu/vue3-context-menu";
	import { ElMessage, ElMessageBox } from "element-plus";
	import { useAvatarUpdateStore } from "@/stores/avatarUpdateStore";
	const avatarUpdateStore = useAvatarUpdateStore();
	import { useRoute } from "vue-router";
	const route = useRoute();
	import { storeToRefs } from "pinia";
	import { useUserInfoStore } from "@/stores/userInfoStore";
	const userInfoStore = useUserInfoStore();
	import { useContactStore } from "@/stores/contactStore";
	const contactStore = useContactStore();
	const { userInfo } = storeToRefs(userInfoStore);
	import { useMessageCountStore } from "@/stores/messageCountStore";
	const messageCountStore = useMessageCountStore();

	// 哪些消息需要铃声提示
	const audioMsgType = [1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 14];

	import msgAudio from "@/assets/media/消息铃声.mp3";
	let audio = new Audio(msgAudio);

	// 消息滑动窗口
	const scrollbarRef = ref();
	// 会话列表
	const chatSessionList = ref([]);

	// 当前会话消息列表
	const messageList = ref([]);

	// 选中会话信息
	const currentChatSession = ref(null);

	// 消息分页配置信息
	let messagePagingInfo = {
		totalPage: 0,
		pageNo: 1,
		maxMessageId: null,
		noData: false
	};

	const searchInput = ref(null); // 搜索输入框
	const searchList = ref([]); // 搜索结果列表
	const searchContact = () => {
		// 这里可以添加搜索逻辑
		searchList.value = chatSessionList.value
			.map((session) => {
				const matchName = session.contactName.includes(searchInput.value);
				const matchLastMessage = session.lastMessage?.includes(searchInput.value);

				if (matchName || matchLastMessage) {
					// 创建新对象，添加高亮字段
					return {
						...session,

						// 添加高亮的属性
						contactName: matchName
							? highlightText(session.contactName, searchInput.value)
							: session.contactName,
						lastMessage: matchLastMessage
							? highlightText(session.lastMessage, searchInput.value)
							: session.lastMessage
					};
				}
				return null; // 不匹配的返回 null
			})
			.filter(Boolean); // 过滤掉 null 值
	};

	// 添加高亮文本的方法
	const highlightText = (text, keyword) => {
		if (!keyword) return text;
		const reg = new RegExp(keyword, "gi");
		return text.replace(reg, (match) => `<span class="highlight">${match}</span>`);
	};

	/**
	 * 发送数据保存到主进程store里面
	 */
	const setCurrentChatSession = ({ contactId, sessionId }) => {
		window.ipcRenderer.send("setCurrentSession", { contactId, sessionId });
	};

	/**
	 * 点击用户会话
	 * @param sessionInfo
	 */
	const chatSessionListHandler = (sessionInfo) => {
		messagePagingInfo = { totalPage: 0, pageNo: 0, maxMessageId: null, noData: false };
		currentChatSession.value = sessionInfo;
		// 清空选中消息数的未读数
		messageCountStore.setCount("chatCount", -sessionInfo.noReadCount, false);
		sessionInfo.noReadCount = 0;
		messageList.value = [];
		// 发送查询当前会话消息
		loadChatMessage(sessionInfo.userId, sessionInfo.contactType);
		// 保存当前选中会话到主进程
		setCurrentChatSession(sessionInfo);
	};

	/**
	 * 发送获取消息事件
	 */
	const loadChatMessage = (userId, contactType) => {
		if (messagePagingInfo.noData) {
			return;
		}
		messagePagingInfo.pageNo++;
		window.ipcRenderer.send("loadChatMessage", {
			userId,
			contactType,
			sessionId: currentChatSession.value.sessionId,
			pageNo: messagePagingInfo.pageNo,
			maxMessageId: messagePagingInfo.maxMessageId
		});
	};

	/**
	 * 发送获取消息事件回调
	 */
	const onLoadChatMessage = () => {
		window.ipcRenderer.on("loadChatMessageCallback", async (e, result) => {
			const dataList = result.messageList;
			const pageNo = result.pageNo;
			const pageTotal = result.pageTotal;
			// 最后一页时
			if (pageNo == pageTotal) {
				messagePagingInfo.noData = true;
			}

			// 优化数据合并方式（保持响应式引用）
			messageList.value.unshift(...dataList); // 新数据在前插入前面
			messagePagingInfo.pageNo = pageNo;
			messagePagingInfo.pageTotal = pageTotal;

			// 如果是第一页时，需要重新确定maxMessageId
			if (pageNo == 1) {
				messagePagingInfo.maxMessageId =
					messageList.value.length <= 0
						? null
						: messageList.value[messageList.value.length - 1].messageId;
				//  滚动条滚动到最底部
				setScrollToTop();
			} else {
				// 等待 DOM 更新
				await nextTick();
				// 添加消息后的高度
				const wrap = scrollbarRef.value?.wrapRef;
				const newScrollHeight = wrap?.scrollHeight;
				const delta = newScrollHeight - oldScrollHeight;

				// 4. 设置新的 scrollTop，保持视觉不变
				scrollbarRef.value?.setScrollTop(delta);
			}
		});
	};

	/**
	 * 设置置顶会话
	 * @param data
	 */
	const setTop = (data) => {
		data.topType = data.topType == 0 ? 1 : 0;
		// 会话排序
		sortUserSession(chatSessionList.value);
		// 发送置顶事件
		window.ipcRenderer.send("topChatSession", {
			contactId: data.contactId,
			topType: data.topType
		});
	};

	/**
	 * 删除会话
	 * @param contactId
	 */
	const delSession = (contactId) => {
		window.ipcRenderer.send("delChatSession", contactId);
		filterSessionList(contactId);
		// 重置聊天消息界面
	};

	/**
	 * 过滤掉删除的会话
	 */
	const filterSessionList = (contactId) => {
		setTimeout(() => {
			chatSessionList.value = chatSessionList.value.filter((items) => {
				return items.contactId != contactId;
			});
		}, 100);
	};

	const onContextMenu = (data, e) => {
		ContextMenu.showContextMenu({
			// 坐标位置
			x: e.x,
			y: e.y,
			items: [
				{
					label: data.topType == 0 ? "置顶" : "取消置顶",
					onClick: () => {
						setTop(data);
					}
				},
				{
					label: "删除聊天",
					onClick: () => {
						ElMessageBox.confirm(`确定要删除聊天吗？`, {
							confirmButtonText: "删除",
							cancelButtonText: "取消",
							type: "warning"
						}).then(() => {
							delSession(data.contactId);
							ElMessage({
								type: "success",
								message: "删除成功"
							});
						});
					}
				}
			]
		});
	};

	/**
	 * 发送获取会话列表事件
	 */
	const localSession = () => {
		window.ipcRenderer.send("localSessionData");
	};

	const pendingContactId = ref(null); // 保存待处理的contactId
	/**
	 * 接收初始化会话列表
	 */
	const onLocalSessionDataCallback = () => {
		window.ipcRenderer.on("localSessionDataCallback", (e, sessionList) => {
			sortUserSession(sessionList);
			chatSessionList.value = sessionList;
			// 统计未读数
			// 计算未读总数
			const totalNoRead = chatSessionList.value.reduce((sum, item) => {
				return sum + (item.noReadCount || 0); // 处理可能的 undefined/null
			}, 0);
			messageCountStore.setCount("chatCount", totalNoRead, true);

			// 处理待处理的路由请求
			if (pendingContactId.value) {
				toSendMessage(pendingContactId.value);
				pendingContactId.value = null;
			}
		});
	};

	/**
	 * 会话列表排序
	 * @param dataList
	 */
	const sortUserSession = (dataList) => {
		dataList.sort((a, b) => {
			const topTypeResult = b["topType"] - a["topType"];
			if (topTypeResult == 0) {
				return b["lastReceiveTime"] - a["lastReceiveTime"];
			}
			return topTypeResult;
		});
	};

	/**
	 * 接收消息
	 */
	const groupInfoInfo = ref(true);
	const onReciveMessage = () => {
		window.ipcRenderer.on("reciveMessage", async (e, message) => {
			// 响铃
			if (audioMsgType.includes(message.messageType)) {
				playRing();
			}

			// 好友申请
			if (message.messageType == 4) {
				if (route.query && route.query.title == "新的朋友") {
					window.ipcRenderer.send("clearNoReadCount", {
						userId: userInfo.value.userId,
						type: "user"
					});
					messageCountStore.setCount("contactCount", 0, false);
					return;
				}
				messageCountStore.setCount("contactCount", 1, false);
				return;
			}
			// 好友申请
			if (message.messageType == 14) {
				if (route.query && route.query.title == "群聊通知") {
					window.ipcRenderer.send("clearNoReadCount", {
						userId: userInfo.value.userId,
						type: "group"
					});
					messageCountStore.setCount("groupCount", 0, false);
					return;
				}
				messageCountStore.setCount("groupCount", 1, false);
				return;
			}

			// 如果是媒体文件接受数据类型
			if (message.messageType == 6) {
				const messageInfo = messageList.value.find((item) => {
					if (item.uuid == message.uuid) {
						return item;
					}
				});
				messageInfo.status = 1;
				return;
			}

			// 强制下线
			if (message.messageType == 7) {
				ElMessage.error("您已被管理员下线");
				setTimeout(() => {
					window.ipcRenderer.send("reLogin");
				}, 1000);
				return;
			}

			// 联系人添加成功后跟新store
			switch (message.messageType) {
				case 1: //添加好友消息
					contactStore.selectUserList(userInfo.value.userId);
					break;
				case 9: // 好友加入群组
					contactStore.selectGroupList(userInfo.value.userId);
					break;
			}

			//  跟新群昵称
			if (message.messageType == 10) {
				avatarUpdateStore.triggerUpdate(message.recipientId);
			}

			const session = message.extendData;
			let curSession = chatSessionList.value.find((item) => {
				return item.sessionId == message.sessionId && item.userId == message.userId;
			});

			// 跟新渲染session
			if (!curSession) {
				chatSessionList.value.push(session);
			} else {
				// 将 session 对象中 拷贝 curSession
				Object.assign(curSession, session);
			}

			// 排序
			sortUserSession(chatSessionList.value);
			// 判断是否选中当前会话
			if (
				currentChatSession.value &&
				currentChatSession.value.sessionId == session.sessionId
			) {
				messageList.value.push(message);
				scrollToTop(); //接受消息回滚到最底部
				Object.assign(currentChatSession.value, session); //跟新会话信息
			} else {
				// 未选择会话需要提示气泡 未读消息提示
				switch (message.messageType) {
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
						messageCountStore.setCount("chatCount", 1, false);
						break;
				}
			}
		});
	};

	const onAddLocalMessageCallback = () => {
		window.ipcRenderer.on("addLocalMessageCallback", (e, { status, uuid }) => {
			const messageInfo = messageList.value.find((item) => {
				if (item.uuid == uuid) {
					return item;
				}
			});
			if (messageInfo) {
				messageInfo.status = status;
			}
		});
	};

	const playRing = () => {
		audio.currentTime = 0; // 每次从头播放
		audio.play().catch((err) => {
			console.log("播放失败：", err);
		});
	};
	
	// 发送消息更新自己的消息聊表、会话
	const sendMessageLocalHandler = (messageObj) => {
		messageList.value.push(messageObj);
		const sessionInfo = chatSessionList.value.find((item) => {
			return item.sessionId == messageObj.sessionId && item.userId == messageObj.userId;
		});
		sessionInfo.lastMessage = messageObj.messageContent;
		sessionInfo.lastReceiveTime = messageObj.sendTime;
		sortUserSession(chatSessionList.value);
		// 回滚到最底部
		scrollToTop();
	};

	let scrollToBottomLen = 0;
	// 滑动到最底部
	const scrollToTop = () => {
		if (scrollToBottomLen > 200) {
			return;
		}
		nextTick(() => {
			scrollbarRef.value?.scrollTo({
				top: scrollbarRef.value?.wrapRef.scrollHeight, // 滚动到最底部
				behavior: "smooth" // 平滑滚动
			});
		});
	};

	const isShowScrollbar = ref(false);
	// 设置到最低部
	const setScrollToTop = () => {
		isShowScrollbar.value = false;
		// 再延迟一帧，等所有内容真正渲染出来
		setTimeout(() => {
			const wrap = scrollbarRef.value?.wrapRef;
			if (wrap) {
				scrollbarRef.value?.setScrollTop(wrap.scrollHeight);
			}
			isShowScrollbar.value = true;
		}, 50); // 可以设置 50ms 看看差异
	};

	// 打开媒体消息预览窗口
	const showMediaDetailHandler = (messageUUid) => {
		let showFileList = messageList.value.filter((item) => {
			return item.messageType == 5;
		});
		// map()返回一个新的数组
		showFileList = showFileList.map((item) => {
			return {
				partType: "chat",
				fileId: item.uuid,
				fileType: item.fileType,
				fileName: item.fileName,
				fileSize: item.fileSize,
				forceGet: false
			};
		});

		window.ipcRenderer.send("newWindow", {
			windowId: "media",
			title: "图片查看",
			path: "/showMedai",
			data: {
				currentFileId: messageUUid,
				fileList: showFileList
			}
		});
	};

	const isLoadingHistory = ref(false);
	var oldScrollHeight = 0; // 整体高度
	// 记录加载开始时间
	const handleScroll = ({ scrollTop }) => {
		const wrap = scrollbarRef.value?.wrapRef;
		scrollToBottomLen = wrap?.scrollHeight - wrap?.clientHeight - scrollTop;
		if (
			scrollTop == 0 &&
			!isLoadingHistory.value &&
			!messagePagingInfo.noData &&
			messageList.value.length != 0
		) {
			oldScrollHeight = wrap?.scrollHeight;
			isLoadingHistory.value = true;
			// 等 500ms 展示动画
			setTimeout(() => {
				const wrap = scrollbarRef.value?.wrapRef;
				oldScrollHeight = wrap?.scrollHeight;
				// 这里发起加载历史消息
				loadChatMessage(
					currentChatSession.value.userId,
					currentChatSession.value.contactType
				);
				// 动画结束
				isLoadingHistory.value = false;
			}, 50);
		}
	};

	// 计算添加时间消息
	const renderedTimeMessages = computed(() => {
		return messageList.value.map((item, index, list) => {
			const showTime =
				index >= 1 &&
				item.sendTime - list[index - 1].sendTime > 300000 &&
				(item.messageType === 2 || item.messageType === 5);
			return { ...item, showTime };
		});
	});

	// 群详情
	const chatGropDetailRef = ref();
	const showGroupDetail = (currentChatSession) => {
		chatGropDetailRef.value.show(currentChatSession.contactId, currentChatSession.sessionId);
	};

	// 群聊退出删除群聊会话
	const delGroupSession = (contactId) => {
		delSession(contactId);
	};

	// 定位到发送消息界面
	const toSendMessage = (contactId) => {
		const curSession = chatSessionList.value.find((item) => {
			return item.contactId == contactId;
		});

		if (curSession) {
			// 点击会话
			chatSessionListHandler(curSession);
		} else {
			// 3. 如果没有找到会话,可以发送事件去创建新会话
			window.ipcRenderer.send("createNewSession", contactId);
			// 4. 监听会话创建成功的回调
			window.ipcRenderer.once("createNewSessionCallback", (e, newSession) => {
				if (newSession) {
					// 5. 将新会话添加到会话列表
					chatSessionList.value.push(newSession);
					// 6. 排序会话列表
					sortUserSession(chatSessionList.value);
					// 7. 设置当前会话
					chatSessionListHandler(newSession);
				}
			});
		}
	};

	watch(
		() => route.query,
		(newQuery) => {
			if (newQuery.timeStamp && newQuery.contactId) {
				if (chatSessionList.value.length > 0) {
					// 会话列表已加载,直接处理
					toSendMessage(newQuery.contactId);
				} else {
					// 会话列表未加载,保存待处理
					pendingContactId.value = newQuery.contactId;
				}
			}
		},
		{ immediate: true, deep: true }
	);

	const remover = () => {
		window.ipcRenderer.removeAllListeners("localSessionDataCallback");
		window.ipcRenderer.removeAllListeners("reciveMessage");
		window.ipcRenderer.removeAllListeners("loadChatMessageCallback");
		window.ipcRenderer.removeAllListeners("addLocalMessageCallback");
	};

	onMounted(() => {
		remover();
		onLocalSessionDataCallback();
		onReciveMessage();
		onLoadChatMessage();
		onAddLocalMessageCallback();
		// 获取会话
		localSession();
	});

	onUnmounted(() => {
		window.ipcRenderer.send("setCurrentSession", {});
		currentChatSession.value = null;
		// 清除预备路由
		pendingContactId.value = null;
	});
</script>

<style lang="scss" scoped>
	.contact-search {
		height: 35px;
		display: flex;
		align-items: start;
		padding-left: 10px;
		:deep(.el-input__wrapper) {
			background-color: #e2e2e2;
		}

		.contact-add {
			background-color: #e2e2e2;
			padding: 3px;
			margin: 0 10px;
			border-radius: 3px;
		}
	}

	.title {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		border-bottom: #e7e7e7 solid 1px;
		.title-name {
			height: 30px;
			margin-left: 20px;
			font-size: 20px;
			font-weight: 550;
		}
		.iconfont {
			position: absolute;
			right: 10px;
			bottom: 10px;
			opacity: 0.8;
		}
	}

	.scrollbar-message {
		height: calc(100% - 130px);
		.history-loading {
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 14px;
			height: 14px;
			opacity: 0.6;
		}
	}

	.scrollbar-message.hidden {
		visibility: hidden; /* 隐藏可见性，但保留布局空间 */
	}

	.message-send {
		border-top: #e7e7e7 solid 1px;
		height: 130px;
	}
</style>
