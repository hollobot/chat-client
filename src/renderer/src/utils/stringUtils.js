export const isEmpty = (obj) => {
	if (obj == null || obj.trim() === "" || obj == undefined) {
		return true;
	}
	return false;
};

export const escapeHtml=(message)=> {
	return message
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
		.replace(/\r\n/g, "<br>")
		.replace(/\n/g, "<br>")
		.replace(/ /g, "&nbsp;")
}
