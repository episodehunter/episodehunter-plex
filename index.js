var menubar = require('menubar');

var mb = menubar({
  width: 300,
  height: 500
});

mb.on('ready', function ready () {
  console.log('app is ready');
});
