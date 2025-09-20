const fs = require("fs");
const NODE_ENV = process.env.NODE_ENV;
const path = require("path");
const { app, ipcMain, shell, dialog } = require("electron");
const FormData = require("form-data"); //引入FormData模块（用于构建表单数据）
const axios = require("axios"); // 引|入axios库
import store from "./store";
const moment = require("moment");
moment.locale("zh-cn", {});
import { selectMessageInfo } from "./database/service/chatMessageService";
const ffmpeg = require("fluent-ffmpeg");
// const ffprobe = require("ffprobe-static");
const ffmpegPath = require("ffmpeg-static");
// ffmpeg.setFfprobePath(ffprobe.path);
ffmpeg.setFfmpegPath(ffmpegPath);

// server 服务器
const express = require("express");
const expressServer = express();

const cover_image_suffix = "_cover.jpg";
const image_suffix = ".jpg";

// 获取资源文件路径（兼容开发和生产环境）
function getAssetPath(filename) {
	if (NODE_ENV === "development") {
		return path.join("./src/assets/image/" + filename);
	} else {
		return path.join(process.resourcesPath,"app.asar.unpacked/resources/", filename);
	}
}

// 获取域名主机地址
const getDomain = () => {
	return NODE_ENV === "development"
		? `http://127.0.0.1:${store.getData("prot")}/api/api`
		: `${store.getData("prodDomain")}/api`;
};

// 上传文件到服务器
const uploadFile = async (uuid, savePath, coverSavePath) => {
	const formData = new FormData();
	formData.append("uuid", uuid);
	formData.append("file", fs.createReadStream(savePath));
	if (coverSavePath) {
		formData.append("cover", fs.createReadStream(coverSavePath));
	}
	const url = `${getDomain()}/chat/upload`;
	const token = store.getToken();
	const config = {
		headers: {
			"Content-Type": "multipart/form-data", // 设置请求头为 multipart/form-data
			Authorization: token
		}
	};
	await axios
		.post(url, formData, config)
		.then((response) => {
			console.log("文件成功上传服务器" + response.data);
		})
		.catch((error) => {
			console.log("文件上传失败：", error);
		});
};

const saveFileToLocal = async (uuid, filePath, fileType) => {
	let coverSavePath = null;
	// 获取文件移动路径
	let savePath = await getLocalStore("chat", false, uuid);
	fs.copyFileSync(filePath, savePath);
	if (fileType == 1) {
		// 视频添加缩略图
		coverSavePath = await generateThumbnail(
			filePath,
			savePath.substring(0, savePath.lastIndexOf(".")) + cover_image_suffix
		);
	}
	// 上传文件到服务器
	await uploadFile(uuid, savePath, coverSavePath);
};

// 获取本地文件路径
export const getLocalStore = async (partType, showCover, uuid) => {
	let localFolder = store.getUserData("localFileFolder");
	let localPath = null;
	switch (partType) {
		case "avatar":
			localFolder += "/avatar/";
			if (!fs.existsSync(localFolder)) {
				mkdirs(localFolder);
			}
			localPath = localFolder + uuid + image_suffix;
			break;
		case "chat":
			let messageInfo = await selectMessageInfo(uuid);
			const month = moment(Number.parseInt(messageInfo.sendTime)).format("YYYYMM");
			localFolder = localFolder + "/" + month;
			if (!fs.existsSync(localFolder)) {
				mkdirs(localFolder);
			}
			if (showCover) {
				localPath = localFolder + "/" + uuid + cover_image_suffix;
			} else {
				let fileSuffix = messageInfo.fileName;
				fileSuffix = fileSuffix.substring(fileSuffix.lastIndexOf("."));
				localPath = localFolder + "/" + uuid + fileSuffix;
			}

			break;
		case "tmp":
			localFolder += "/tmp/";
			if (!fs.existsSync(localFolder)) {
				mkdirs(localFolder);
			}
			localPath = localFolder + uuid;
			break;
	}
	return localPath;
};

const mkdirs = (dir) => {
	if (!fs.existsSync(dir)) {
		const parentDir = path.dirname(dir);
		mkdirs(parentDir);
		fs.mkdirSync(dir);
	}
};

/**
 * 获取文件类型
 * @videoPath 文件路径
 * @returns 返回视频文件格式codec_name
 */
/* function getVideoCodec(videoPath) {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(videoPath, (err, metadata) => {
			if (err) return reject(err);
			const videoStream = metadata.streams.find((s) => s.codec_type === "video");
			resolve(videoStream?.codec_name || "unknown");
		});
	});
} */

/**
 *添加缩略图
 * @param {*} videoPath   原文件路径
 * @param {*} outputPath  输出图片路径
 * @param {*} time 		时间戳
 * @returns 返回生成图片路径
 */
function generateThumbnail(videoPath, outputPath, time = "00:00:01") {
	return new Promise((resolve, reject) => {
		ffmpeg(videoPath)
			.screenshots({
				timestamps: [time],
				filename: path.basename(outputPath),
				folder: path.dirname(outputPath)
			})
			.on("end", () => resolve(outputPath))
			.on("error", (err) => {
				console.error("生成缩略图失败:", err);
				reject(new Error(`无法生成缩略图: ${err.message}`));
			});
	});
}

/**
 * 文件转码
 * @param {*} inputPath
 * @param {*} outputPath
 * @param {*} options
 * @returns
 */
function convertVideo(inputPath, outputPath, options = {}) {
	const defaultOptions = {
		videoCodec: "libx265",
		audioCodec: "aac",
		crf: 23,
		preset: "medium"
	};
	const mergedOptions = { ...defaultOptions, ...options };

	return new Promise((resolve, reject) => {
		ffmpeg(inputPath)
			.videoCodec(mergedOptions.videoCodec)
			.audioCodec(mergedOptions.audioCodec)
			.outputOptions(["-y", `-crf ${mergedOptions.crf}`, `-preset ${mergedOptions.preset}`])
			.output(outputPath)
			.on("end", () => resolve(outputPath))
			.on("error", (err) => {
				console.error("视频转码失败:", err);
				reject(new Error(`视频转码失败: ${err.message}`));
			})
			.run();
	});
}

let server = null;

// 启动服务
const startLocalServer = (serverPort) => {
	server = expressServer.listen(serverPort, () => {
		console.log("本地服务:http://127.0.0.1:" + serverPort + "开启");
	});
};

// 关闭服务
const stopLocalServer = () => {
	server?.close();
};

const FILE_TYPE_CONTENT_TYPE = { 0: "image/", 1: "video/", 2: "application/octet-stream" };

// 获取本地文件
expressServer.get("/file", async (req, resp) => {
	let { partType, fileType, fileId, showCover, forceGet } = req.query;
	if (!partType || !fileId) {
		resp.send("参数错误！");
		return;
	}

	showCover = showCover == "true" ? true : false;
	let localPath = await getLocalStore(partType, showCover, fileId);
	if (!fs.existsSync(localPath) || forceGet == "true") {
		await downloadFile(fileId, showCover, localPath, partType);
	}
	const fileSuffix = localPath.substring(localPath.lastIndexOf(".") + 1);
	const contentType = FILE_TYPE_CONTENT_TYPE[fileType] + fileSuffix;

	// 设置必要的头
	resp.setHeader("Access-Control-Allow-Origin", "*");
	resp.setHeader("Content-Type", contentType);
	// fs.createReadStream(localPath) 使用 Node.js 的 fs 模块创建一个 可读流（Readable Stream），从 localPath（本地文件路径）逐块读取文件内容。
	// .pipe(resp) 将可读流的数据 通过管道（pipe） 直接传输到 resp
	// 不是视频或者只要缩略图就直接正常返回文件管道流
	if (showCover || fileType != 1) {
		fs.createReadStream(localPath).pipe(resp);
		return;
	}
	// 如果是视频的话需要额外处理请求头里的range
	const stat = fs.statSync(localPath);
	const fileSize = stat.size;
	const range = req.headers.range; // bytes=0-1024
	if (range) {
		const parts = range.replace(/bytes=/, "").split("-");
		const start = parseInt(parts[0], 10);
		let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
		end = end > fileSize ? fileSize - 1 : end;
		const len = end - start + 1;
		const head = {
			"Content-Range": `bytes ${start}-${end}/${fileSize}`,
			"Accept-Ranges": "bytes",
			"Content-Length": len,
			"Content-Type": "video/mp4"
		};
		resp.writeHead(206, head);
		fs.createReadStream(localPath, { start, end }).pipe(resp);
	} else {
		fs.createReadStream(localPath).pipe(resp);
	}
});

// 从服务下载文件
const downloadFile = (fileId, showCover, savePath, partType) => {
	return new Promise(async (resolve, reject) => {
		try {
			const formData = new FormData();
			formData.append("fileId", fileId);
			formData.append("showCover", showCover + "");
			const url = `${getDomain()}/chat/download`;
			console.log("下载文件地址:", url);
			const token = store.getToken();
			const config = {
				headers: {
					"Content-Type": "multipart/form-data", // 设置请求头为 multipart/form-data
					Authorization: token
				},
				responseType: "stream"
			};
			const response = await axios.post(url, formData, config);
			const folder = savePath.substring(0, savePath.lastIndexOf("/"));
			if (!fs.existsSync(folder)) {
				mkdirs(folder);
			}
			// 文件流
			const stream = fs.createWriteStream(savePath);

			if (response.headers["content-type"] == "application/json") {
				if (partType == "avatar") {
					fs.createReadStream(getAssetPath("defaultAvatar.jpg")).pipe(stream);
				} else {
					fs.createReadStream(getAssetPath("404.jpg")).pipe(stream);
				}
			} else {
				response.data.pipe(stream);
			}
			stream.on("finish", () => {
				stream.close();
				resolve();
			});
		} catch (error) {
			console.error("下载失败:", error);
			reject(error);
		}
	});
};

const saveFile = async (data) => {
	const { partType, fileId } = data;
	// fileName 为另存为的默认路径
	let fileName = null;
	if (partType == "avatar") {
		fileName = fileId + image_suffix;
	} else if (partType == "chat") {
		let messageInfo = await selectMessageInfo(fileId);
		fileName = messageInfo.fileName;
	}
	const localPath = await getLocalStore(partType, false, fileId);
	const options = {
		title: "保存文件",
		defaultPath: fileName
	};
	let result = await dialog.showSaveDialog(options);
	// 点击取消或者选中文件路径为空return
	if (result.canceled || result.filePath == "") {
		return;
	}

	const filePath = result.filePath;
	fs.copyFileSync(localPath, filePath);
};

// 将内存文件转换的临时的本地文件
const saveTempFile = async (data) => {
	const { messageContent, fileSize, fileName, buffer } = data;
	const fileSuffix = fileName.substring(fileName.lastIndexOf("."));
	// 获取临时文件路径
	const savePath = await getLocalStore("tmp", false, "temp" + fileSuffix);
	// 存放临时文件
	fs.writeFileSync(savePath, buffer);
	// 返回临时文件的路径
	return { messageContent, fileSize, savePath, fileName };
};

export { saveFileToLocal, startLocalServer, stopLocalServer, saveFile, saveTempFile };

