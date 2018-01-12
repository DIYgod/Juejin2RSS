var log4js = require('log4js');
log4js.configure({
    appenders: {
        Juejin2RSS: {
            type: 'file',
            filename: 'logs/Juejin2RSS.log',
            maxLogSize: 20480,
            backups: 3,
            compress: true
        },
        console: {
            type: 'console'
        }
    },
    categories: { default: { appenders: ['Juejin2RSS', 'console'], level: 'INFO' } }
});
var logger = log4js.getLogger('Juejin2RSS');

module.exports = logger;