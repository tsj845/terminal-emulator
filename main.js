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
    console.log(command);
    return new Promise((resolve, reject)=>{
        exec(command, (e, o, r) => {
            if (e) {
                resolve(r);
            }
            resolve(o);
        });
    });
}

function kill_term (ev) {
    BrowserWindow.fromWebContents(ev.sender).close();
}

app.whenReady().then(() => {
    ipcMain.handle("terminal:execute", handleTermExec);
    ipcMain.on("terminal:kill", kill_term);
    ipcMain.on("console:log", (_, a) => {console.log(...a)});
    ipcMain.on("console:err", (_, a) => {console.log("\x1b[38;2;200;50;50m", ...a, "\x1b[0m")});
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