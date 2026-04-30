const { app, BrowserWindow, ipcMain, screen } = require("electron");

let mainWindow;

function createWindow() {
    const { width, height, x, y } = screen.getPrimaryDisplay().workArea;
    mainWindow = new BrowserWindow({
        width,
        height,
        x,
        y,
        transparent: true,
        frame: false,
        hasShadow: false,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadURL("http://localhost:3000");

    // 🚀 自動穿透邏輯：
    // 如果你點擊到透明的地方，點擊會傳給後面的視窗
    // 只有點擊到有內容（球、文字）的地方才會有反應
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    // 監聽來自 Next.js 的指令：當滑鼠移入球體時，恢復點擊
    ipcMain.on("set-ignore-mouse", (event, ignore) => {
        mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
    });
}

app.whenReady().then(createWindow);
