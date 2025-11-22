import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";

polyfill({
    // 1. 讓拖曳影像跟隨手指中心
    dragImageCenterOnTouch: true,
    
    // 2. 強制套用 (不管瀏覽器是否宣稱支援)
    forceApply: true, 
    
    // 3. 【極限設定】改成 1 或 2 毫秒
    // 這代表手指一碰到螢幕，瀏覽器只有 2ms 的時間猶豫，之後立刻進入拖曳模式
    holdToDrag: 2, 
    
    // 4. 修正影像位置
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,

    // 5. 【新增】強制覆寫預設行為
    // 當 Polyfill 偵測到拖曳意圖時，直接告訴瀏覽器：「閉嘴，這是拖曳，不要捲動」
    defaultActionOverride: (e) => {
        e.preventDefault(); 
    }
});

// 6. 暴力禁止全域的觸控捲動 (針對 iOS Safari 特別有效)
// 因為您的遊戲是全螢幕，不需要網頁捲動，這樣寫最保險
window.addEventListener('touchmove', function(e) {
    // 如果事件是可以取消的，就取消它 (防止捲動回彈)
    if (e.cancelable) {
        e.preventDefault();
    }
}, { passive: false }); // passive: false 是關鍵，讓 preventDefault 生效

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // 記得移除 StrictMode，它會導致手機開發模式下的拖曳閃爍
  <App />
);