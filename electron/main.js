import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { startServer } from '../server.js'; // Note: In TS output this will be .js

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let botProcess = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'LLM AutoBot',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // icon: path.join(__dirname, '../app_icon.png') // Uncomment if icon is provided
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    // In dev, wait for Vite server to be ready
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, server.ts serves the dist folder statically at localhost:3000
    // Wait for the local server to start
    await mainWindow.loadURL('http://localhost:3000');
  }
}

app.whenReady().then(async () => {
  try {
    // Start the local API server & Vite (if dev) or static file server (if prod)
    console.log('Starting local server...');
    // We register tsx if we are in dev so that it can run the TS server file
    if (!app.isPackaged) {
      // In dev we just run it because we run electron via a script that might support it
      // Actually, if we use `electron .` it runs Node without tsx. Let's just assume we compile or run via tsx.
    }
    await startServer();
    console.log('Local server started.');
  } catch (err) {
    console.error('Failed to start server:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Run Python Bot Script
ipcMain.on('run-bot-script', (event, scriptPath, configData) => {
  if (botProcess) {
    event.reply('bot-script-log', '[System] Bot is already running.\n');
    return;
  }

  const configPath = path.join(app.getPath('userData'), 'bot_config.json');

  try {
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  } catch (err) {
    console.error('Failed to write bot config:', err);
  }

  event.reply('bot-script-log', `[System] Starting Python script...\n`);
  
  // Use python3 or python based on platform
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  
  const absScriptPath = path.isAbsolute(scriptPath) ? scriptPath : path.join(__dirname, '..', scriptPath);

  botProcess = spawn(pythonCmd, [absScriptPath, configPath], {
    cwd: path.dirname(absScriptPath)
  });

  botProcess.stdout.on('data', (data) => {
    event.reply('bot-script-log', data.toString());
  });

  botProcess.stderr.on('data', (data) => {
    event.reply('bot-script-log', `[Error] ${data.toString()}`);
  });

  botProcess.on('close', (code) => {
    event.reply('bot-script-log', `[System] Bot process exited with code ${code}\n`);
    botProcess = null;
    event.reply('bot-script-status', 'stopped');
  });
  
  event.reply('bot-script-status', 'running');
});

// IPC: Stop Python Bot Script
ipcMain.on('stop-bot-script', (event) => {
  if (botProcess) {
    botProcess.kill();
    botProcess = null;
    event.reply('bot-script-log', '[System] Bot process was terminated by user.\n');
    event.reply('bot-script-status', 'stopped');
  }
});
