# 易經占卜 (I Ching Divination App)

這是一個基於 React 和 Vite 開發的易經占卜 Web 應用程式。使用者可以透過點擊模擬傳統的「大衍之數」五十蓍草占卜過程，並支援英文與繁體中文雙語切換。

## 功能特點

- 🌿 **模擬大衍之數**：透過點擊互動模擬傳統蓍草分策過程。
- ☯️ **自動排卦**：根據每次隨機分裂的結果，自動計算本卦（包含變爻邏輯）。
- 🌐 **雙語支援**：支援英文 (English) 與繁體中文 (Traditional Chinese) 介面與卦名顯示。
- 🎨 **現代化 UI**：使用 Tailwind CSS 打造乾淨、響應式的現代化風格。

## 系統需求

- [Node.js](https://nodejs.org/) (建議版本 18.0.0 或是更新版本)
- npm (通常隨附於 Node.js)

## 安裝與執行說明

請依照以下步驟在本地環境設定並執行此專案。此專案提供 `install.sh` 和 `run.sh`，從 GitHub 下載後可以用腳本完成安裝與啟動。

### 1. 取得專案原始碼

將此專案目錄下載或使用 Git 複製 (Clone) 到您的本地電腦，並透過終端機 (Terminal) 進入專案根目錄。

### 2. 安裝專案

在專案根目錄下執行：

```bash
./install.sh
```

`install.sh` 會檢查 Node.js 與 npm、安裝所有 Node.js 依賴套件，並執行一次 production build 確認專案可以正常建置。

如果您的系統顯示權限不足，請先執行：

```bash
chmod +x install.sh run.sh
```

再重新執行 `./install.sh`。

### 3. 一鍵啟動程式

安裝完成後，在專案根目錄下執行：

```bash
./run.sh
```

`run.sh` 會使用固定 port `5173` 啟動程式，並以背景模式執行。預設會 listen `0.0.0.0`，因此同一個網路中的其他裝置可以透過此電腦的 IP 連線。

```text
http://<此電腦的 IP>:5173/
```

如果 port `5173` 已被其他程式佔用，`run.sh` 會先終止佔用該 port 的程序，再啟動此應用程式。

啟動後，log 會寫入：

```text
logs/iching-app.log
```

查看 log：

```bash
tail -f logs/iching-app.log
```

停止背景程序：

```bash
kill $(cat iching-app.pid)
```

### 4. 開啟應用程式

伺服器啟動後，本機可開啟 `http://127.0.0.1:5173/`。外部裝置請開啟 `http://<此電腦的 IP>:5173/`。

如果外部裝置無法連線，請確認作業系統防火牆、路由器或雲端主機安全群組已允許 TCP port `5173`。

### npm 指令

您也可以直接使用 npm scripts：

```bash
npm run setup
npm run start
```

`npm run start`、`npm run dev` 和 `npm run preview` 都會固定使用 `0.0.0.0:5173`，可供外部網路連線。

## 建置生產版本 (Production Build)

如果您需要將專案打包以進行正式環境部署，請執行：

```bash
npm run build
```

這項指令會在專案根目錄下產生一個 `dist` 資料夾，裡面包含了所有經過壓縮與最佳化的靜態檔案。您可以使用第三方靜態伺服器來託管這些檔案，或者使用 `npm run preview` 在本地預覽建置後的結果。

## 開發技術棧

- [React](https://react.dev/) v19 - 前端 UI 框架
- [Vite](https://vitejs.dev/) - 極速的前端構建工具
- [Tailwind CSS](https://tailwindcss.com/) v4 - 實用優先的 CSS 框架
- [i18next](https://www.i18next.com/) & [react-i18next](https://react.i18next.com/) - 國際化 (多國語系) 解決方案
