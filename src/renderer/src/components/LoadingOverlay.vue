<!-- LoadingOverlay.vue -->
<template>
    <transition name="fade">
        <div v-if="visible" class="resize-overlay">
            <div class="pulse-loader">
                <div class="pulse-container">
                    <div class="pulse-bubble pulse-bubble-1"></div>
                    <div class="pulse-bubble pulse-bubble-2"></div>
                    <div class="pulse-bubble pulse-bubble-3"></div>
                </div>
                <div v-if="text" class="loading-text">{{ text }}</div>
            </div>
        </div>
    </transition>
</template>

<script setup>
defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    text: {
        type: String,
        default: ''
    }
});
</script>

<style scoped>
/* 您的样式代码 */
.resize-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 1);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
}

.pulse-loader {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.pulse-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 15px;
}

.pulse-bubble {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin: 0 3px;
    background-color: #07c160;
}

.pulse-bubble-1 {
    animation: pulse 0.6s ease 0s infinite alternate;
}

.pulse-bubble-2 {
    animation: pulse 0.6s ease 0.15s infinite alternate;
}

.pulse-bubble-3 {
    animation: pulse 0.6s ease 0.3s infinite alternate;
}

@keyframes pulse {
    from {
        opacity: 1;
        transform: scale(1);
    }
    to {
        opacity: 0.2;
        transform: scale(0.8);
    }
}

.loading-text {
    color: #07c160;
    font-size: 16px;
    margin-top: 10px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>