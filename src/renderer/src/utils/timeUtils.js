import moment from "moment";

const formatDate = (timestamp) => {
	const timestampTime = moment(timestamp);
	const days =
		Number.parseInt(moment().format("YYYYMMDD")) -
		Number.parseInt(timestampTime.format("YYYYMMDD"));
	if (days == 0) {
		return timestampTime.format("HH:mm");
	} else if (days == 1) {
		return "昨天";
	} else if (days > 1) {
		return timestampTime.format("YY/MM/DD");
	}
};

export { formatDate };
