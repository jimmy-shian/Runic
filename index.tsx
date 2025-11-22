import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { polyfill } from "mobile-drag-drop";
// 引入預設的拖曳樣式（選擇性，但建議加，能解決拖曳時沒有半透明影子的問題）
import "mobile-drag-drop/default.css";

// 啟動 Polyfill
polyfill({
    // 讓拖曳的殘影在手指中心 (手感較好)
    dragImageCenterOnTouch: true,
    // 允許在 iOS 上也能觸發
    forceApply: true, 
});

// 解決 iOS Safari 的捲動干擾問題
window.addEventListener( 'touchmove', function() {}, {passive: false});

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