const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    termExec : (command) => ipcRenderer.invoke("terminal:execute", command),
    mlog : (args) => ipcRenderer.send("console:log", args),
    merr : (args) => ipcRenderer.send("console:err", args),
    kill : () => ipcRenderer.send("terminal:kill")
});