const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runScript: (scriptPath) => ipcRenderer.send('run-bot-script', scriptPath),
  stopScript: () => ipcRenderer.send('stop-bot-script'),
  onScriptLog: (callback) => {
    // Deliberately strip event as it includes `sender` 
    const newCallback = (_, data) => callback(data);
    ipcRenderer.on('bot-script-log', newCallback);
    // Return unsubscribe function
    return () => ipcRenderer.removeListener('bot-script-log', newCallback);
  },
  onScriptStatus: (callback) => {
    const newCallback = (_, status) => callback(status);
    ipcRenderer.on('bot-script-status', newCallback);
    return () => ipcRenderer.removeListener('bot-script-status', newCallback);
  }
});
