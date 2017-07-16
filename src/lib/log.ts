const electron = require('electron');
import * as Raven from 'raven-js';

export function createLogger() {
    Raven
        .config('https://14a889bd545a496a8de6066cf18146de@sentry.io/192024')
        .install();
    const remote = electron.remote;
    if (remote) {
        const log = remote.require('electron-log');
        log.transports.console.level = 'info';
        log.transports.file.level = 'info';
        return {
            info: msg => {
                log.info(msg);
            },
            error: msg => {
                log.error(msg);
                Raven.captureMessage(msg);
            }
        };
    } else {
        return {
            info: msg => {
                Raven.captureMessage(msg);
            },
            error: msg => {
                Raven.captureMessage(msg);
            }
        };
    }
}
