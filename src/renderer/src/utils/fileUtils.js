import axios from "axios";
import {getLocalItem} from "@/utils/storage"

// 明确访问 .value，并检查属性是否存在

export const getFile = async (fileId, partType, fileType, forceGet) => {
    const url = `http://127.0.0.1:${getLocalItem("fileServerProt")}/file?fileId=${fileId}&partType=${partType}&fileType=${fileType}&showCover=false&forceGet=${forceGet}&_t=${Date.now()}`;
	const response = await axios.get(url);
	return response.data;
};

export const getFileUrl = (fileId, partType, fileType, forceGet) => {
	const url = `http://127.0.0.1:${getLocalItem("fileServerProt")}/file?fileId=${fileId}&partType=${partType}&fileType=${fileType}&showCover=false&forceGet=${forceGet}&_t=${Date.now()}`;
	return url;	
};

/**
 * 格式化文件大小为微信风格的显示格式
 * @param {number} bytes - 文件大小（字节数）
 * @returns {string} 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes)=> {
  
	// 微信文件大小显示的单位阈值
	const units = [
	  { value: 1024 * 1024 * 1024, unit: 'GB' }, // GB阈值 (1GB)
	  { value: 1024 * 1024, unit: 'MB' },       // MB阈值 (1MB)
	  { value: 1024, unit: 'KB' },              // KB阈值 (1KB)
	  { value: 0, unit: 'B' }                   // 小于1KB显示B
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
  
	return '0B'; // 默认返回
  }
  

  