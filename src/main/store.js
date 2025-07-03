const Store = require("electron-store"); // 或 import Store from 'electron-store';
const store = new Store.default();

let userId = null;

const setUserId = (_userId) => {
	userId = _userId;
};

const getUserId = () => {
	return userId;
};

const setData = (key, value) => {
	store.set(key, value);
};

const getData = (key) => {
	return store.get(key);
};

const setUserData = (key, value) => {
	store.set(userId + key, value);
};

const getUserData = (key) => {
	return store.get(userId + key);
};

const deleteUserIdData = (key) => {
	store.delete(userId + key);
};

const getToken = () => {
	const userInfo = getUserData("userInfo");
	if (!userInfo) {
		return null;
	}
	return userInfo.token;
};

export default {
	setUserId,
	getUserId,
	setData,
	getData,
	setUserData,
	getUserData,
	deleteUserIdData,
	getToken
};
