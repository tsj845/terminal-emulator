const {app, BrowserWindow, ipcMain} = require("electron");
const {exec} = require("child_process");
const path = require("path");

const createWindow = () => {
    const win = new BrowserWindow({
        width : 800,
        height : 600,
        webPreferences : {
            preload : path.join(__dirname, "preload.js")
        }
    });

    win.loadFile("index.html");
};

async function handleTermExec (event, command) {
    return new Promise((resolve, reject)=>{
        let res = exec(command, (e, o, r) => {
            if (e) {
                resolve(r);
            }
            resolve(o);
        });
    });
}

app.whenReady().then(() => {
    ipcMain.handle("terminal:execute", handleTermExec);
    createWindow();

    app.on("activate", () => {
        if (false && BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (true || process.platform !== "darwin") {
        app.quit();
    }
});