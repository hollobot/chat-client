import { defineStore } from "pinia";

export const useSysSettingStore = defineStore("sysSettingStore", {
	state: () => ({
		sysSetting: {}
	}),
	actions: {
		setSysSetting(data) {
			this.sysSetting = data;
		},
		getSysSetting() {
			return this.sysSetting;
		}
	}
});
