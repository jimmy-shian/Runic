import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { polyfill } from "mobile-drag-drop";
// 引入這個可以修正拖曳影像在捲動頁面時的錯位問題
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";

// 啟動 Polyfill
polyfill({
    // 讓拖曳的殘影在手指中心 (手感較好)
    dragImageCenterOnTouch: true,
    
    // 允許在 iOS 上也能觸發
    forceApply: true, 
    
    // ▼▼▼ 【關鍵修正】 ▼▼▼
    // 預設是 500ms (要長按)，改成 50ms 讓它幾乎是「隨點隨拖」
    holdToDrag: 50, 
    
    // 修正拖曳影像的位置計算
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride
});

// 解決 iOS Safari 的捲動干擾問題
// 注意：如果您的 CSS 已經加了 touch-none，這裡其實只是雙重保險
window.addEventListener( 'touchmove', function(e) {
    // 這裡留空即可，mobile-drag-drop 會處理大部份邏輯
}, {passive: false});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);