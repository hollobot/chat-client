import { defineStore } from "pinia";

export const useGlobalInfoStore = defineStore("globalInfoStore", {
	state: () => ({
		globalInfo: {}
	}),
	actions: {
        setInfo(key,value){
            this.globalInfo[key] = value;
        },
        getInfo(key){
            return this.globalInfo[key];
        }
	}
});
