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
import { updateNoReadCount } from "./chatUserSessionService";

/**
 * 插入消息数据
 */
const saveMessage = (messageInfo) => {
	return insertOrReplace("chat_message", messageInfo);
};

const saveMessageBatchInit = (chatMessageList) => {
	return new Promise(async (resolve, reject) => {
		// 1、统计未读数据
		const chatSessionCountMap = {};
		for (let i = 0; i < chatMessageList.length; i++) {
			const sessionInfo = chatMessageList[i];
			let contactId =
				sessionInfo.recipientType == 1 ? sessionInfo.recipientId : sessionInfo.sendUserId;
			let noReadCount = chatSessionCountMap[contactId];
			if (noReadCount) {
				chatSessionCountMap[contactId] = noReadCount + 1;
			} else {
				chatSessionCountMap[contactId] = 1;
			}
			// 插入数据
			sessionInfo.userId = store.getUserId();
			await saveMessage(sessionInfo);
		}
		// 2、将上面统计的数据跟新到本地数据库里
		for (let contactId in chatSessionCountMap) {
			await updateNoReadCount(contactId, chatSessionCountMap[contactId]);
		}
		resolve();
	});
};

const selectMessagePageList = (query) => {
	return new Promise(async (resolve, reject) => {
		const { userId, contactType, sessionId, pageNo, maxMessageId } = query;
		let sql = "select count(*) from chat_message where session_id = ? and user_id = ?";
		let params = [sessionId, userId];
		const totalCount = await queryCount(sql, params);
		const { pageTotal, offset, limit } = getPageOffset(totalCount, pageNo);
		sql = "select * from chat_message where session_id = ? and user_id = ?";
		if (maxMessageId) {
			sql += " and message_id <= ?";
			params.push(maxMessageId);
		}
		sql += " order by message_id limit ?,?";
		params.push(offset, limit);
		const messageList = await queryAll(sql, params);
		resolve({ messageList, pageTotal, pageNo });
	});
};

const getPageOffset = (totalCount, pageNo, pageSize = 20) => {
	const pageTotal =
		totalCount % pageSize == 0
			? totalCount / pageSize
			: Number.parseInt(totalCount / pageSize) + 1;

	if (pageNo < 1) {
		pageNo = 1;
	}

	let offset = totalCount - pageNo * pageSize;
	if (offset < 0) {
		pageSize = pageSize + offset;
		offset = 0;
	}
	console.log(pageTotal, offset, pageSize);
	return { pageTotal, offset, limit: pageSize };
};

const updateMessage = (data, whereData) => {
	whereData.userId = store.getUserId();
	return update("chat_message", data, whereData);
};

const selectMessageInfo = (uuid) => {
	const sql = "select * from chat_message where uuid = ? and user_id = ?";
	return queryOne(sql, [uuid, store.getUserId()]);
};

export {
	saveMessageBatchInit,
	selectMessagePageList,
	saveMessage,
	updateMessage,
	selectMessageInfo
};
