export const windowsMap = {};

const setWindowsMap = (id, window) => {
	windowsMap[id] = window;
};

const getWindowsMap = (id) => {
	return windowsMap[id];
};

const delWindowsMap = (id) => {
	delete windowsMap[id];
};

export { setWindowsMap, getWindowsMap, delWindowsMap };
