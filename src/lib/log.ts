const electron = require('electron');

export function createLogger() {
    const remote = electron.remote;
    if (remote) {
        const log = remote.require('electron-log');
        log.transports.console.level = 'info';
        log.transports.file.level = 'info';
        return log;
    } else {
        return {};
    }
}
