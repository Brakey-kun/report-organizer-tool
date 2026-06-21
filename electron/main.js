import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Report Organizer",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the Vite dev server URL if running in dev mode
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    // Open the DevTools automatically if desired
    // win.webContents.openDevTools();
  } else {
    // In production, load the built index.html from Vite's dist folder
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Prevent navigating away from the app (e.g. clicking links)
  win.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  // Prevent opening new windows/tabs
  win.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
