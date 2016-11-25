var express = require('express');
var logger = require('./tools/logger');

logger.info(`🍻 Xitu2RSS start! Cheers!`);

var app = express();
app.all('*', require('./routes/all'));
app.get('/', require('./routes/get'));
app.get('/:category', require('./routes/get'));
app.listen(1208);