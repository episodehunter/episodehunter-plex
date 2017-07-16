const { join } = require('path');
const menubar = require('menubar');
const { app, ipcMain } = require('electron');

const mb = menubar({
  width: 300,
  height: 500,
  dir: join(__dirname, 'dist'),
  icon: join(__dirname, 'IconTemplate.png')
});

ipcMain.on('request-quit', function requestQuit() {
  app.quit();
});

mb.on('ready', function ready () {
  console.log('app is ready');
});
