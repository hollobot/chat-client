// const getPageOffset = (totalCount, pageNo, pageSize = 5) => {
// 	const pageTotal =
// 		totalCount % pageSize == 0
// 			? totalCount / pageSize
// 			: Number.parseInt(totalCount / pageSize) + 1;

// 	if (pageNo < 1) {
// 		pageNo = 1;
// 	}

// 	let offset = totalCount - pageNo * pageSize;
// 	if (offset < 0) {
// 		pageSize = pageSize + offset;
// 		offset = 0;
// 	}

// 	return { pageTotal, offset, limit: pageSize };
// };
// const data = getPageOffset(14, 3, 5);
// console.log(data);

// const fs = require("fs");
// const path = require("path");

// const mkdirs = (dir) => {
// 	if (!fs.existsSync(dir)) {
// 		const parentDir = path.dirname(dir);
// 		console.log(parentDir);
// 		mkdirs(parentDir);
// 		fs.mkdirSync(dir);
// 	}
// };

// mkdirs("c:\\1");

// function getSessionId() {
// 	for (var t = "abcdefhijkmnprstwxyz2345678", c = t.length, l = "", i = 0; i < 32; i++)
// 		l += t.charAt(Math.floor(Math.random() * c));
// 	return l;
// }
// var result = getSessionId()
// console.log(result);
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfprobePath(ffprobe.path);
ffmpeg.setFfmpegPath(ffmpegPath);
/**
 * 获取文件类型
 * @videoPath 文件路径
 * @returns 返回视频文件格式codec_name
 */
function getVideoCodec(videoPath) {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(videoPath, (err, metadata) => {
			if (err) return reject(err);
			const videoStream = metadata.streams.find((s) => s.codec_type === "video");
			resolve(videoStream?.codec_name || "unknown");
		});
	});
}

/**
 * 生成视频封面
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
				folder: path.dirname(outputPath),
				size: "320x240"
			})
			.on("end", () => resolve(outputPath))
			.on("error", (err) => {
				console.error("生成缩略图失败:", err);
				reject(new Error(`无法生成缩略图: ${err.message}`));
			});
	});
}

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

// const data = generateCover(
// 	"D:\\23809\\Desktop\\程序\\唯美治愈树荫树林树叶绿叶空镜头_爱给网_aigei_com.mp4",
// 	"D:\\23809\\Desktop\\桌面",
// 	1
// );

const data = async () => {
	const d = await getVideoCodec(
		"D:\\23809\\Desktop\\桌面\\唯美治愈树荫树林树叶绿叶空镜头_爱给网_aigei_com.mp4_cover.jpg"
	);
	console.log(d);
	await generateThumbnail(
		"D:\\23809\\Desktop\\桌面\\唯美治愈树荫树林树叶绿叶空镜头_爱给网_aigei_com.mp4_cover.jpg",
		"D:\\23809\\Desktop\\桌面\\java.md_cover.jpg"
	);

	// await convertVideo(
	// 	"D:\\23809\\Desktop\\程序\\唯美治愈树荫树林树叶绿叶空镜头_爱给网_aigei_com.mp4",
	// 	"D:\\23809\\Desktop\\程序\\唯美治愈树荫树林树叶绿叶空镜头_爱给网_aigei_com1.mp4"
	// );
};
/**
 * 格式化文件大小为微信风格的显示格式
 * @param {number} bytes - 文件大小（字节数）
 * @returns {string} 格式化后的文件大小字符串
 */
const formatFileSize = (bytes) => {
	// 微信文件大小显示的单位阈值
	const units = [
		{ value: 1024 * 1024 * 1024, unit: "GB" }, // GB阈值 (1GB)
		{ value: 1024 * 1024, unit: "MB" }, // MB阈值 (1MB)
		{ value: 1024, unit: "KB" }, // KB阈值 (1KB)
		{ value: 0, unit: "B" } // 小于1KB显示B
	];

	// 查找合适的单位
	for (const { value, unit } of units) {
		if (bytes >= value) {
			// 计算大小并格式化
			const size = value > 0 ? (bytes / value).toFixed(1) : bytes;

			// 微信风格处理：
			// 1. 如果小数部分是.0，则去掉小数部分
			// 2. 最大显示到GB，不显示TB
			const formattedSize = size % 1 === 0 ? parseInt(size) : parseFloat(size);

			return `${formattedSize}${unit}`;
		}
	}

	return "0B"; // 默认返回
};

// 测试示例
console.log(formatFileSize(500)); // 500B
console.log(formatFileSize(1023)); // 1023B
console.log(formatFileSize(1024)); // 1KB
console.log(formatFileSize(1536)); // 1.5KB
console.log(formatFileSize(1048576)); // 1MB
console.log(formatFileSize(1572864)); // 1.5MB
console.log(formatFileSize(1073741824)); // 1GB
console.log(formatFileSize(1610612736)); // 1.5GB
