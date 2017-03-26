const { join } = require('path');
const menubar = require('menubar');
const { app } = require('electron');

const mb = menubar({
  width: 300,
  height: 500,
  dir: join(process.cwd(), 'dist'),
  icon: join(process.cwd(), 'IconTemplate.png')
});

mb.on('ready', function ready () {
  console.log('app is ready');
});
