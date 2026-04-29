const { app, BrowserWindow, ipcMain } = require("electron");

let mainWindow;
let workerWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        transparent: true,
        frame: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false },
    });

    // ⚛️ 建立一個隱藏視窗專門負責語音 (它不會有渲染壓力，也不容易崩潰)
    workerWindow = new BrowserWindow({
        show: false, // 隱藏起來
        webPreferences: { nodeIntegration: true, contextIsolation: false },
    });

    mainWindow.loadURL("http://localhost:3000");
    workerWindow.loadURL("http://localhost:3000/speech-worker"); // 稍後建立這個路由

    // 轉發語音識別結果
    ipcMain.on("speech-result", (event, data) => {
        mainWindow.webContents.send("speech-data", data);
    });

    // 轉發語音啟動指令
    ipcMain.on("toggle-speech", (event, active) => {
        workerWindow.webContents.send("toggle-recognition", active);
    });
}

app.whenReady().then(createWindow);
