var menubar = require('menubar');
require('electron-reload')(__dirname);

var mb = menubar({
  width: 300,
  height: 500
});

mb.on('ready', function ready () {
  console.log('app is ready');
});
