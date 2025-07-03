export const File_TYPE = {
	jpeg: 0,
	jpg: 0,
	png: 0,
	gif: 0,
	bmp: 0,
	webp: 0,
	mp4: 1,
	avi: 1,
	rmvb: 1,
	mkv: 1,
	mov: 1,
	0: "图片",
	1: "视频",
	2: "文件",
	图片: 0,
	视频: 1,
	文件: 2
};

export const getFileType = (suffix) => {
	if (!suffix) {
		return 2;
	}

	if (typeof suffix == "string") {
		suffix = suffix.toLowerCase();
	}

	const fileType = File_TYPE[suffix];

	return fileType == undefined ? 2 : fileType;
};

const fileTypeCategory = {
	image: "图片",
	video: "视频"
};

export function getFileCategory(type) {
	return fileTypeCategory[type] || "文件";
}
