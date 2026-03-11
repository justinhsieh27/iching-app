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

請依照以下步驟在本地環境設定並執行此專案：

### 1. 取得專案原始碼

將此專案目錄下載或使用 Git 複製 (Clone) 到您的本地電腦，並透過終端機 (Terminal) 進入專案根目錄。

### 2. 安裝依賴套件

在專案根目錄下，執行以下指令來安裝所有必需的 Node.js 套件：

```bash
npm install
```

### 3. 啟動開發伺服器

依賴套件安裝完畢後，執行以下指令以啟動 Vite 本地開發伺服器：

```bash
npm run dev
```

### 4. 開啟應用程式

伺服器啟動後，終端機會顯示一個本地端的網址（預設通常為 `http://localhost:5173`）。請在網頁瀏覽器中開啟該網址，即可開始使用易經占卜應用程式。

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
