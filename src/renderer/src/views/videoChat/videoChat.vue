<template>
	<div class="videoChat">
		<div class="head drag">
			<h2>视频通话</h2>
			<div class="status">
				服务器状态: <span :class="connectionStatus">{{ connectionStatusText }}</span>
			</div>
		</div>
		<div class="content">
			<!-- 视频区域 -->
			<div class="video-container">
				<div class="video-wrapper">
					<video ref="localVideo" autoplay playsinline muted></video>
					<div class="video-label">本地视频</div>
				</div>
				<div class="video-wrapper">
					<video ref="remoteVideo" autoplay playsinline></video>
					<div class="video-label">远程视频</div>
				</div>
			</div>

			<!-- 控制按钮 -->
			<div class="controls">
				<button @click="startCall" :disabled="!canStartCall" class="call-btn">
					{{ isInCall ? "通话中..." : "开始呼叫" }}
				</button>
				<button @click="endCall" :disabled="!isInCall" class="end-btn">结束通话</button>
				<button @click="toggleVideo" :disabled="!localStream" class="toggle-btn">
					{{ videoEnabled ? "关闭摄像头" : "开启摄像头" }}
				</button>
				<button @click="toggleAudio" :disabled="!localStream" class="toggle-btn">
					{{ audioEnabled ? "静音" : "取消静音" }}
				</button>
			</div>

			<!-- 日志开关按钮 -->
			<div class="log-toggle" @click="showLogs = !showLogs">📝</div>

			<!-- 浮动日志面板 -->
			<div class="logs-panel" v-if="showLogs">
				<h5>消息日志</h5>
				<div class="log-container">
					<div v-for="(log, index) in logs" :key="index" class="log-item">
						{{ log }}
					</div>
				</div>
			</div>
		</div>
	</div>
	<windowControlButton :win-config="windowControl"></windowControlButton>
</template>
<script setup>
	import WindowControlButton from "@/components/windowControlButton.vue";
	import { onMounted, onUnmounted, ref, computed } from "vue";
	import { ElMessage } from "element-plus";

	// 响应式变量
	const localVideo = ref(null); // 本地视频DOM元素引用
	const remoteVideo = ref(null); // 远程视频DOM元素引用
	const currentUserId = ref(""); // 当前用户ID
	const targetUserId = ref(""); //目标用户ID（要呼叫的用户）
	const logs = ref([]); // 日志记录数组
	const isInCall = ref(false); // 是否正在通话
	const videoEnabled = ref(true); // 摄像头是否开启
	const audioEnabled = ref(true); // 麦克风是否开启
	const connectionStatus = ref("disconnected"); // WebSocket连接状态
	const showLogs = ref(false); // 日志

	// windowControlButton组件 配置
	const windowControl = {
		isShowPin: true,
		isShowMinimize: true,
		isShowMaximize: true,
		closeType: 0 // 0: 退出进程, 1: 托盘
	};

	const initData = ref();

	// WebRTC相关变量
	let localStream = null; // 本地媒体流
	let peer = null; // RTCPeerConnection实例

	// ICE服务器配置-用于NAT穿透
	const ICE_SERVERS = [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun1.l.google.com:19302" },
		{
			// 新增的TURN
			urls: "turn:openrelay.metered.ca:80",
			username: "openrelayproject",
			credential: "openrelayproject"
		}
	];

	// 计算连接状态属性
	const connectionStatusText = computed(() => {
		switch (connectionStatus.value) {
			case "connected":
				return "已连接";
			case "connecting":
				return "连接中...";
			case "disconnected":
				return "未连接";
			case "error":
				return "连接错误";
			default:
				return "未知状态";
		}
	});

	// 计算是否可以开始通话
	const canStartCall = computed(() => {
		return connectionStatus.value === "connected" && !isInCall.value;
	});

	// 日志记录函数
	function addLog(message) {
		const timestamp = new Date().toLocaleTimeString();
		logs.value.push(`[${timestamp}] ${message}`);
		console.log(`[WebRTC] ${message}`);

		// 保持最多50条日志
		if (logs.value.length > 50) {
			logs.value.shift();
		}
	}

	// 创建RTCPeerConnection
	async function createPeerConnection() {
		if (peer) {
			peer.close();
		}

		// 创建新的 P2P 连接
		// 使用增强的配置创建P2P连接
		peer = new RTCPeerConnection({
			iceServers: ICE_SERVERS,
			iceCandidatePoolSize: 10,
			iceTransportPolicy: "all",
			bundlePolicy: "max-bundle",
			rtcpMuxPolicy: "require"
		});

		// 添加本地媒体流轨道到 P2P 连接
		if (localStream) {
			localStream.getTracks().forEach((track) => {
				peer.addTrack(track, localStream);
			});
		}

		// 处理接收到的远程媒体流
		peer.ontrack = (event) => {
			addLog("收到远程流");
			if (remoteVideo.value) {
				remoteVideo.value.srcObject = event.streams[0];
			}
		};

		// 处理生成的 ICE 候选
		peer.onicecandidate = (event) => {
			if (event.candidate) {
				sendSignalMessage("candidate", event.candidate);
			}
		};

		// 监听 P2P 连接状态变化
		peer.onconnectionstatechange = () => {
			addLog(`P2P连接状态: ${peer.connectionState}`);

			if (peer.connectionState === "connected") {
				addLog("P2P连接建立成功");
			} else if (
				peer.connectionState === "failed" ||
				peer.connectionState === "disconnected"
			) {
				addLog("P2P连接失败或断开");
				endCall(false);
			}
		};
	}

	// 获取本地媒体流 （摄像头和麦克风）
	async function getLocalMedia() {
		try {
			// 如果已有媒体流，先停止所有轨道
			if (localStream) {
				localStream.getTracks().forEach((track) => track.stop());
			}

			// 请求用户媒体权限并获取流
			localStream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true
			});

			// 将本地流显示在视频元素中
			if (localVideo.value) {
				localVideo.value.srcObject = localStream;
			}

			addLog("获取本地媒体流成功");
			return true;
		} catch (error) {
			addLog(`获取媒体流失败: ${error.message}`);
			return false;
		}
	}

	// 开始通话（主叫方
	async function startCall() {
		if (!currentUserId.value || !targetUserId.value) {
			alert("请输入用户ID");
			return;
		}

		addLog(`开始呼叫用户: ${targetUserId.value}`);

		try {
			// 获取本地媒体流
			const mediaOk = await getLocalMedia();
			if (!mediaOk) return;

			// 创建 P2P 连接
			await createPeerConnection();

			// 创建呼叫 offer
			const offer = await peer.createOffer();
			await peer.setLocalDescription(offer);

			// 发送 offer 信令
			sendSignalMessage("offer", offer);
			isInCall.value = true;
			addLog("呼叫已发送，等待应答...");
		} catch (error) {
			addLog(`开始呼叫失败: ${error.message}`);
			isInCall.value = false;
		}
	}

	// 通过主进程发送信令消息
	function sendSignalMessage(signalType, signalData) {
		const message = {
			sendUserId: currentUserId.value,
			receiveUserId: targetUserId.value,
			signalType: signalType,
			signalData: JSON.stringify(signalData)
		};

		// 通过 IPC 发送信令消息到主进程
		window.ipcRenderer.send("webrtc:send-signal", message);
		addLog(`发送信令: ${signalType}`);
		return true;
	}

	// 设置 IPC 事件监听器
	function setupIpcListeners() {
		addLog("设置 IPC 事件监听器");
		// 监听连接状态变化
		window.ipcRenderer.on("webrtc:connection-status", (event, status) => {
			console.log("连接状态", status);
			connectionStatus.value = status;
			switch (status) {
				case "connected":
					addLog("信令服务器连接成功");
					break;
				case "connecting":
					addLog("正在连接信令服务器...");
					break;
				case "disconnected":
					addLog("服务器断开 连接失败。");
					break;
				case "error":
					addLog("信令服务器连接错误");
					break;
			}
		});

		// 监听收到的信令消息
		ipcRenderer.on("webrtc:signal-message", async (event, message) => {
			addLog(`收到信令: ${message.signalType}`);
			await handleSignalMessage(message);
		});

		// 监听连接错误
		ipcRenderer.on("webrtc:connection-error", (event, error) => {
			addLog(`连接错误: ${error}`);
			connectionStatus.value = "error";
		});
	}

	let flog = true;
	// 处理信令消息
	async function handleSignalMessage(message) {
		const { signalType, signalData, sendUserId } = message;

		// 不在线处理
		if (signalType == "notOnline" && flog) {
			flog = false;
			await notOnline();
			setTimeout(() => {
				isInCall.value = false;
				if (!flog) flog = true;
			}, 1000);
			return;
		}

		try {
			const data = JSON.parse(signalData);

			switch (signalType) {
				case "offer":
					await handleOffer(data, sendUserId);
					break;
				case "answer":
					await handleAnswer(data);
					break;
				case "candidate":
					await handleCandidate(data);
					break;
				case "end_call":
					await handleEndCall();
					break;
				default:
					addLog(`未知信令类型: ${signalType}`);
			}
		} catch (error) {
			addLog(`处理信令数据失败-${signalType}: ${error.message}`);
		}
	}

	// 处理收到的 offer（被呼叫方）
	async function handleOffer(offer, sendUserId) {
		try {
			addLog(`收到来自 ${sendUserId} 的呼叫`);

			// 如果已经在通话中，拒绝新的呼叫
			if (isInCall.value) {
				addLog("当前正在通话中，拒绝新的呼叫");
				return;
			}

			// 更新目标用户ID为呼叫方
			targetUserId.value = sendUserId;

			// 创建 P2P 连接
			await createPeerConnection();

			// 设置远程描述
			await peer.setRemoteDescription(new RTCSessionDescription(offer));

			// 创建并设置本地应答
			const answer = await peer.createAnswer();
			await peer.setLocalDescription(answer);

			// 发送应答信令
			sendSignalMessage("answer", answer);
			isInCall.value = true;
			addLog("已接受呼叫并发送应答");
		} catch (error) {
			addLog(`处理offer失败: ${error.message}`);
		}
	}

	// 处理收到的answer （呼叫方）
	async function handleAnswer(answer) {
		try {
			if (!peer) {
				addLog("无效的peer连接");
				return;
			}

			// 设置远程应答描述
			await peer.setRemoteDescription(new RTCSessionDescription(answer));
			addLog("收到应答，通话建立成功");
		} catch (error) {
			addLog(`处理answer失败: ${error.message}`);
		}
	}

	// 处理ICE候选
	async function handleCandidate(candidate) {
		try {
			if (!peer) {
				addLog("无效的peer连接");
				return;
			}

			// 添加 ICE 候选到 P2P 连接
			await peer.addIceCandidate(new RTCIceCandidate(candidate));
			addLog("添加ICE候选成功");
		} catch (error) {
			addLog(`添加ICE候选失败: ${error.message}`);
		}
	}

	// 处理结束通话
	async function handleEndCall() {
		addLog("对方结束了通话");
		await endCall(false);
	}

	// 结束通话
	async function endCall(sendSignal = true) {
		// 发送结束通话信令
		if (sendSignal && isInCall.value) {
			sendSignalMessage("end_call", {});
		}

		isInCall.value = false;

		// 关闭 P2P 连接
		if (peer) {
			peer.close();
			peer = null;
		}

		// 清空远程视频
		if (remoteVideo.value) {
			remoteVideo.value.srcObject = null;
		}

		addLog("通话已结束");

		// 关闭窗口
		window.ipcRenderer.send("sendWinControl", { action: "close", type: 0 });
	}

	// 不在线处理
	async function notOnline() {
		isInCall.value = false;
		ElMessage({
			message: "对方可能不在线"
		});
	}

	// 切换摄像头
	function toggleVideo() {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				videoEnabled.value = videoTrack.enabled;
				addLog(`摄像头${videoEnabled.value ? "开启" : "关闭"}`);
			}
		}
	}

	// 切换音频
	function toggleAudio() {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				audioEnabled.value = audioTrack.enabled;
				addLog(`麦克风${audioEnabled.value ? "开启" : "静音"}`);
			}
		}
	}

	// 删除监听事件
	const remover = () => {
		window.ipcRenderer.removeAllListeners("pageInitData");
		ipcRenderer.removeAllListeners("webrtc:connection-status");
		ipcRenderer.removeAllListeners("webrtc:signal-message");
		ipcRenderer.removeAllListeners("webrtc:connection-error");
	};

	// 组件挂载
	onMounted(async () => {
		// 移除 IPC 事件监听器
		remover();
		// 接受主进程发送过来的文件数据
		window.ipcRenderer.on("pageInitData", (e, data) => {
			initData.value = data;
			targetUserId.value = data.recipient;
			currentUserId.value = data.useId;
			console.log(data);
		});

		// 获取媒体流
		await getLocalMedia();

		// 设置 IPC 事件监听器
		setupIpcListeners();
	});

	onUnmounted(() => {
		// 停止所有媒体轨道
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
		}

		// 关闭 P2P 连接
		if (peer) {
			peer.close();
		}

		// 移除 IPC 事件监听器
		remover();
	});
</script>

<style lang="scss" scoped>
	.videoChat {
		user-select: none;
		height: 100vh;
		width: 100vw;
		display: flex;
		flex-direction: column;
		background: #f5f7fa;
		box-sizing: border-box;

		/* 顶部栏（透明，不挡操作） */
		.head {
			height: 36px;
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 15px 12px 0px 12px;
			color: #333;
			font-size: 14px;
			font-weight: 600;
			-webkit-app-region: drag; /* 允许拖动窗口 */

			h2 {
				margin: 0;
				font-size: 16px;
			}

			.status {
				font-size: 13px;
				margin-right: 40px;
				span {
					margin-left: 4px;
					font-weight: 600;
					&.connected {
						color: #28a745;
					}
					&.disconnected {
						color: #dc3545;
					}
					&.connecting {
						color: #ffc107;
					}
				}
			}
		}

		/* 内容区域 */
		.content {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;

			/* 视频区域占满剩余空间 */
			.video-container {
				flex: 1;
				display: flex;
				gap: 12px;
				padding: 8px;

				.video-wrapper {
					flex: 1;
					position: relative;
					background: #000;
					border-radius: 8px;
					overflow: hidden;
					box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

					video {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}

					.video-label {
						position: absolute;
						top: 6px;
						left: 6px;
						background: rgba(0, 0, 0, 0.55);
						color: #fff;
						padding: 2px 6px;
						border-radius: 4px;
						font-size: 12px;
					}
				}
			}

			/* 控制按钮固定在底部 */
			.controls {
				height: 100px;
				flex-shrink: 0;
				display: flex;
				justify-content: center;
				align-items: center;
				flex-wrap: wrap;
				gap: 12px;
				padding: 10px;

				button {
					height: 30px;
					width: 100px;
					padding: 8px 16px;
					border: none;
					border-radius: 6px;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s ease;
					color: #fff;

					&.call-btn {
						background: #28a745;
						&:hover:not(:disabled) {
							background: #218838;
						}
					}
					&.end-btn {
						background: #dc3545;
						&:hover:not(:disabled) {
							background: #c82333;
						}
					}
					&.toggle-btn {
						background: #17a2b8;
						&:hover:not(:disabled) {
							background: #138496;
						}
					}
					&:disabled {
						opacity: 0.55;
						cursor: not-allowed;
					}
				}
			}
		}

		/* 日志按钮 */
		.log-toggle {
			position: absolute;
			bottom: 16px;
			right: 16px;
			width: 40px;
			height: 40px;
			border-radius: 50%;
			background: #007bff;
			color: #fff;
			display: flex;
			justify-content: center;
			align-items: center;
			cursor: pointer;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
			font-size: 18px;
			transition: all 0.2s;

			&:hover {
				background: #0056b3;
			}
		}

		/* 浮动日志面板 */
		.logs-panel {
			user-select: text;
			position: absolute;
			bottom: 80px;
			right: 16px;
			width: 320px;
			max-height: 200px;
			background: #fff;
			border-radius: 8px;
			box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
			padding: 12px;
			font-size: 12px;
			display: flex;
			flex-direction: column;

			h5 {
				margin: 0 0 8px 0;
				font-size: 13px;
				font-weight: 600;
				color: #333;
			}

			.log-container {
				flex: 1;
				overflow-y: auto;
				border: 1px solid #eee;
				padding: 8px;
				border-radius: 6px;
				background: #fdfdfd;

				.log-item {
					margin: 2px 0;
					color: #555;
				}
			}
		}

		/* 小屏幕视频上下布局 */
		@media (max-width: 768px) {
			.content {
				.video-container {
					flex-direction: column;
				}
			}
		}
	}
</style>
