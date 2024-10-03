const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1000,  // Aumenta a largura da janela
    height: 800,  // Aumenta a altura da janela
    resizable: false,  // Deixa a janela sem redimensionamento (opcional)
    webPreferences: {
      nodeIntegration: true,  // Integração do Node.js no renderer
      contextIsolation: false, // Permitimos acesso direto ao Node.js
    }
  });

  win.loadFile('src/index.html');

  // Oculta os menus padrão
  Menu.setApplicationMenu(null);

  // Atalho para abrir o Developer Tools com F11
  globalShortcut.register('F11', () => {
    win.webContents.openDevTools();  // Abre o Developer Tools
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Registrar atalhos globais
  globalShortcut.register('F11', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.webContents.openDevTools();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Handle directory selection from the renderer process
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result;
});

// Expor caminho do executável para o renderer
ipcMain.handle('getAppPath', async () => {
  return path.dirname(app.getPath('exe'));  // Retorna o diretório do executável
});
