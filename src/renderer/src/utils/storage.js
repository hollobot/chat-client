import { isEmpty } from "@/utils/stringUtils";

export const getLocalItem = (key) => {
	const dataSting = localStorage.getItem(key);
	if (isEmpty(dataSting)) {
		return;
	}
	return JSON.parse(dataSting);
};

export const setLocalItem = (key, value) => {
	const dataSting = JSON.stringify(value);
	if (isEmpty(dataSting)) {
		return;
	}
	localStorage.setItem(key, dataSting);
};

export const getSessionItem = (key) => {
	const dataSting = sessionStorage.getItem(key);
	if (isEmpty(dataSting)) {
		return;
	}
	return JSON.parse(dataSting);
};

export const setSessionItem = (key, value) => {
	const dataSting = JSON.stringify(value);
	if (isEmpty(dataSting)) {
		return;
	}
	sessionStorage.setItem(key, dataSting);
};
