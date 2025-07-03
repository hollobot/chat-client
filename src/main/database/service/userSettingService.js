import {
	run,
	queryOne,
	queryCount,
	queryAll,
	insert,
	insertOrIgnore,
	insertOrReplace,
	update
} from "../db";

import store from "../../store";
import { startLocalServer } from "../../file";
const os = require("os");
// 获取系统用户的个人文件夹 C:\Users\用户名
const userDir = os.homedir();

/**
 *
 * @param {*} userId
 * @param {*} noReadCount
 * @param {*} type 1:累加 0:赋值
 * @param {*} param 数据库字段
 * @returns
 */
const updateContactNoReadCount = (userId, noReadCount, type, param) => {
	return new Promise(async (resolve, reject) => {
		let sql = null;
		// 刷新未读取数据数量
		if (type) {
			sql = `update user_setting set ${param} = ${param} + ? where user_id = ?`;
		} else {
			sql = `update user_setting set ${param} = ? where user_id = ?`;
		}
		await run(sql, [noReadCount, userId]);
		resolve();
	});
};

const addUserSetting = async (userId, email) => {
	let sql = "select max(server_port) server_port from user_setting";
	// 1、查询本地客户端最大端口号
	let { serverPort } = await queryOne(sql);
	// 2、判断客户端是否存在用户服务
	if (serverPort) {
		serverPort++;
	} else {
		serverPort = 10240;
	}
	const sysSetting = {
		localFileFolder: userDir + "\\.chat\\fileStorage\\"
	};
	let resultServerProt = null;
	let localFileFolder = sysSetting.localFileFolder + userId;

	// 3、查询是本地否存在当前用户配置
	sql = "select * from user_setting where user_id = ?";
	const userSetting = await queryOne(sql, userId);
	if (userSetting) {
		resultServerProt = userSetting.serverPort;
		localFileFolder = JSON.parse(userSetting.sysSetting).localFileFolder + userId;
		await update("user_setting", { email: email }, { userId: userId });
	} else {
		await insertOrIgnore("user_setting", {
			userId: userId,
			email: email,
			sysSetting: JSON.stringify(sysSetting),
			contactNoRead: 0,
			groupNoRead: 0,
			serverPort: serverPort
		});
		resultServerProt = serverPort;
	}
	store.setUserData("loaclServerProt", resultServerProt);
	store.setUserData("localFileFolder", localFileFolder);
	startLocalServer(resultServerProt);
};

// 查询联系人未读数量
const selectSettingInfoByUserID = (userId) => {
	let sql = "select * from user_setting where user_id = ?";
	return queryOne(sql, [userId]);
};

// 根据邮箱查询联系人未读数量
const selectSettingInfoByEmail = (email) => {
	let sql = "select * from user_setting where email = ?";
	return queryOne(sql, [email]);
};

// 根据邮箱查询联系人未读数量
const selectAllEmail = () => {
	let sql = "select email from user_setting";
	return queryAll(sql);
};


// 查询本地文件路径
const selectFolder = async (userId) => {
	let sql = "select sys_setting from user_setting where user_id = ?";
	const result = await queryOne(sql, [userId]);
	return JSON.parse(result.sysSetting).localFileFolder;
};

// 修改本地路径
const updateFilePath = ({ userId, selectedPath }) => {
	const sysSetting = {
		localFileFolder: selectedPath
	};
	return update(
		"user_setting",
		{ sysSetting: JSON.stringify(sysSetting) },
		{ userId: userId }
	);
};

export {
	updateContactNoReadCount,
	addUserSetting,
	selectSettingInfoByUserID,
	selectSettingInfoByEmail,
	selectFolder,
	updateFilePath,
	selectAllEmail
};
