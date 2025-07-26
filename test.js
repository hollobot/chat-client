const axios = require("axios");

const fun = async () => {
	const response = await axios.post("http://127.0.0.1:80/api/chat/download", {});
	console.log(response.headers["content-type"]);
};

fun().catch(console.error);
