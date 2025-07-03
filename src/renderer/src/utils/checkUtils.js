import { isEmpty } from "./stringUtils";

export const ruleInfo = {
	email: {
		name: "邮箱",
		message: "邮箱不规范",
		check: /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/
	},
	password: {
		name: "密码",
		message: "8~16位,数字,大小写字母,特殊字符",
		check: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?.&_-])[\w$@$!%*?.&-]{6,16}$/
	},
	checkCode: {
		name: "验证码",
		message: "验证码不规范",
		check: /^(-100|-(?:[1-9][0-9]?)|0|100|[1-9][0-9]?)$/
	}
};

export const updatePwdRuleInfo = {
	newPwd: {
		name: "密码",
		message: "新密码不符合要求",
		check: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?.&_-])[\w$@$!%*?.&-]{8,16}$/
	},
	oldPwd: {
		name: "密码",
		message: "原密码不符合要求",
		check: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?.&_-])[\w$@$!%*?.&-]{8,16}$/
	}
};

/**
 * 自定义封装校验规则
 * @param {*} ruleInfo
 * @returns
 */
export const customCheck = (ruleInfo) => {
	return (rule, value, callback) => {
		if (value === "") {
			callback(new Error(ruleInfo.name + "不能为空"));
		} else if (!ruleInfo.check.test(value)) {
			callback(new Error(ruleInfo.message));
		} else {
			callback();
		}
	};
};

/**
 * 确认密码校验
 * @param {*} password
 */
export const ConfirmPassword = (password) => {
	return (rule, value, callback) => {
		if (isEmpty(value)) {
			callback(new Error("确认密码不为空"));
		} else if (password.value.password != value) {
			callback(new Error("密码不一致"));
		} else {
			callback();
		}
	};
};

/**
 * 修改密码 确认密码校验
 * @param {*} NewPwd
 * @returns
 */
export const ConfirmNewPwd = (NewPwd) => {
	return (rule, value, callback) => {
		if (isEmpty(value)) {
			callback(new Error("确认密码不为空"));
		} else if (NewPwd.value.newPwd != value) {
			callback(new Error("密码不一致"));
		} else {
			callback();
		}
	};
};

/**
 *判断按钮是否禁用
 */
export const isSubmit = (obj) => {
	for (const key in obj) {
		if (!obj[key]) {
			return true;
		}
	}
	return false;
};
