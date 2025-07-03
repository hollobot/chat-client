import { defineStore } from "pinia";

export const useAvatarUpdateStore = defineStore("avatarUpdateStore", {
    state: () => ({
        avatarMap: {}
    }),
    actions: {
        push(key,value){
            this.avatarMap[key] = value;
        },
        get(key){
            return this.avatarMap[key];
        },
         // 触发头像更新（使用时间戳）
        triggerUpdate(key) {
            const timestamp = Date.now();
            this.avatarMap[key] = timestamp;
            return timestamp;
        },
    }
});
