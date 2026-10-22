# APK release 與雲端發布

## 本機一鍵編譯

雙擊專案根目錄的 `build-apk.bat`，成功後 APK 與 SHA-256 檔會放在 `releases/`。
腳本會安裝鎖定依賴、檢查型別、執行測試、建置 Web、同步 Capacitor、產生並驗證簽章 APK；任一步失敗就停止。

本機需要 Node.js 22+、JDK 21、Android SDK platform 35 與 build-tools 35.0.0。
SDK 預設為 `%LOCALAPPDATA%\Android\Sdk`，也可設定 `ANDROID_HOME`。

此電腦已設定 `android/keystore.properties`，引用 `C:/Users/Administrator/Desktop/ISLAB/release-key.jks`。
金鑰與密碼檔均被 Git 忽略。另一台電腦需複製 `android/keystore.properties.example` 為 `android/keystore.properties`，填入同一把金鑰的資料。
也可透過 `ANDROID_KEYSTORE_PATH`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、`ANDROID_KEY_PASSWORD` 環境變數設定。

指定版本：

```powershell
.\build-apk.bat -VersionName 1.1.1
```

版本碼由 `scripts/release-version.mjs` 統一產生，採 UTC 秒數減去 2020 年起點，並超過最新 GitHub Release 與上次本機版本。
`.release-state.json` 記錄上次本機成功版本，不進 Git。必須能連上 GitHub 查詢最新版本，查詢失敗會停止，避免誤用舊版號。
特殊情況可指定 `-VersionCode`，但必須自行確保高於已安裝版本。

## GitHub Actions

`Android release` workflow：PR 執行型別、測試與 Web 建置；push main 或手動執行時，建置簽章 APK，附於 GitHub Release 並上傳 Actions artifact。
原有 Pages workflow 保留，新增型別與測試檢查，改用 Node.js 22 與 `npm ci`。

雲端使用以下 repository Actions secrets：

| Secret | 內容 |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | 同一個 `ISLAB/release-key.jks` 的 Base64 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密碼 |
| `ANDROID_KEY_ALIAS` | 私鑰 alias |
| `ANDROID_KEY_PASSWORD` | 私鑰密碼 |

簽章檔只在建置期間還原，結束後刪除，不會放進 APK 附件、artifact 或 Git。
發布頁：https://github.com/jimmy-shian/Runic/releases

## 本地與雲端互相更新

兩邊的 applicationId 固定為 `io.github.jimmyshian.runic`，並使用同一把 release key；後編譯的版本碼高於前一版，可直接覆蓋安裝。
這是下載 APK 後手動覆蓋更新，不包含 App 內自動下載更新。
若手機現有安裝版使用 debug key 或其他金鑰，Android 不允許用此 release key 直接覆蓋，應先確認既有版本的簽章。

## 本輪驗證範圍

P0/P1/P2/P4 已納入，並依使用者後續指示保留原玩法：任何相鄰兩格均可交換，即使沒有形成消除也會交換成功並計一步；非相鄰格不能直接交換。
交換覆層取消回原點動畫；拖曳預覽會把目標符文顯示於來源格，放開後兩顆符文滑動到位。消除時先亮起、碎片向外飛散並縮小淡出，再合成及補件。單點選取保留高光與等級標籤。
五種 Lv2 已依使用者後續指示重新繪製為寶珠，生成母檔及提示詞存於 `art/runes-lv2/`，遊戲圖存於 `public/runes/*-lv2.png`。
App icon、浮分與白閃維持延後。
25 張透明 PNG 放在 `public/runes/`，母檔 `RunicElements_25/` 保留原樣。
重製圖片腳本為 `scripts/prepare-runes.py`，需 Pillow 與 NumPy；執行 Python 使用 `C:\Users\Administrator\venv\Scripts\python.exe`。
