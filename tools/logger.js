var log4js = require('log4js');
log4js.configure({
    appenders: [
        {
            type: "file",
            filename: 'logs/Xitu2RSS.log',
            maxLogSize: 20480,
            backups: 3,
            category: [ 'Xitu2RSS','console' ]
        },
        {
            type: "console"
        }
    ],
    replaceConsole: true
});
var logger = log4js.getLogger('Xitu2RSS');
logger.setLevel('INFO');

module.exports = logger;