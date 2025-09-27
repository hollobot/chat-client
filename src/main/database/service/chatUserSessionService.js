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

const saveOrUpdateChatSessionBatchInit = (chatSessionList) => {
	return new Promise(async (resolve, reject) => {
		try {
			for (let i = 0; i < chatSessionList.length; i++) {
				const sessionInfo = chatSessionList[i];
				sessionInfo.status = 1;
				let sessionData = await selectUserSessionByContactId(sessionInfo.contactId);
				if (sessionData) {
					await updateChatSeeion(sessionInfo);
				} else {
					await addChatSession(sessionInfo);
				}
			}
			resolve();
		} catch (error) {
			resolve();
		}
	});
};

const selectUserSessionByContactId = (contactId) => {
	const sql = "select * from chat_session_user where user_id= ? and contact_id= ?";
	return queryOne(sql, [store.getUserId(), contactId]);
};

const addChatSession = (sessionInfo) => {
	sessionInfo.userId = store.getUserId();
	return insertOrIgnore("chat_session_user", sessionInfo);
};

const updateChatSeeion = (sessionInfo) => {
	const whereData = {
		userId: store.getUserId(),
		contactId: sessionInfo.contactId
	};
	return update("chat_session_user", sessionInfo, whereData);
};

/**
 * 跟新未读取数据
 */
const updateNoReadCount = (contactId, noReadCount) => {
	let sql =
		"update chat_session_user set no_read_count = no_read_count + ? where user_id = ? and contact_id = ?";
	return run(sql, [noReadCount, store.getUserId(), contactId]);
};

const selectUserSessionList = () => {
	let sql = "select * from chat_session_user where user_id = ? and status = 1";
	return queryAll(sql, [store.getUserId()]);
};

const selectUserSession = (contactId) => {
	let sql = "select * from chat_session_user where user_id = ? and status = 1 and contact_id = ?";
	return queryOne(sql, [store.getUserId(),contactId]);
};

const delUserSession = (contactId) => {
	const whereData = {
		userId: store.getUserId(),
		contactId
	};
	const data = {
		status: 0
	};
	return update("chat_session_user", data, whereData);
};

const topUserSession = (contactId, topType) => {
	const whereData = {
		userId: store.getUserId(),
		contactId
	};
	const data = {
		topType
	};
	return update("chat_session_user", data, whereData);
};

const updateUserSessionInfo = async (
	currentChatSessionId,
	{ sessionId, contactName, lastMessage, lastReceiveTime, contactId, memberCount, status }
) => {
	const params = [lastMessage, lastReceiveTime];
	let sql = "update chat_session_user set last_message = ?,last_receive_time = ?";

	if (status) {
		sql += ",status = ?";
		params.push(status);
	}

	if (contactName) {
		sql += ",contact_name = ?";
		params.push(contactName);
	}

	if (memberCount) {
		sql += ",member_count = ?";
		params.push(memberCount);
	}

	if (currentChatSessionId !== sessionId) {
		sql += ",no_read_count = no_read_count + 1";
	}

	sql += " where session_id = ? and contact_id = ? and user_id = ?";
	params.push(sessionId);
	params.push(contactId);
	params.push(store.getUserId());

	await run(sql, params);
};

const saveSession = async (currentChatSessionId, sessionInfo) => {
	// 判断会话是否存在
	let contactId = sessionInfo.sendUserId;
	if (sessionInfo.recipientType == 1) {
		contactId = sessionInfo.recipientId;
	}
	let sessionData = await selectUserSessionByContactId(contactId);
	sessionInfo.contactId = contactId;
	if (sessionData) {
		return await updateUserSessionInfo(currentChatSessionId, sessionInfo);
	} else {
		sessionInfo.noReadCount = 1;
		sessionInfo.contactType = sessionInfo.recipientType;
		return await addChatSession(sessionInfo);
	}
};

/**
 * 清空该会话未读数据
 * @param {*} contactId
 */
const readAll = async (contactId) => {
	const sql =
		"update chat_session_user set no_read_count = 0 where user_id = ? and contact_id = ?";
	await run(sql, [store.getUserId(), contactId]);
};

/** 根据联系人id跟新联系人名称 （用户更改名称需要跟新为联系人身份的名称） */
const updateSessionContentName = async (contactName,contactId) => {
	const sql =
		"update chat_session_user set contact_name = ? where contact_id = ?";
	await run(sql, [contactName, contactId]);
}

export {
	saveOrUpdateChatSessionBatchInit,
	updateNoReadCount,
	selectUserSessionList,
	delUserSession,
	topUserSession,
	updateUserSessionInfo,
	readAll,
	saveSession,
	selectUserSessionByContactId,
	updateChatSeeion,
	selectUserSession,
	updateSessionContentName
};
