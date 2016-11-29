var fetch = require('node-fetch');
var logger = require('../tools/logger');
var xml2js = require('xml2js');
var parseString = xml2js.parseString;
var builder = new xml2js.Builder({
    allowSurrogateChars: true
});

module.exports = function (req, res) {
    res.header('Content-Type', 'application/xml; charset=utf-8');

    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    var category = req.params.category;

    logger.info(`Xitu2RSS category ${category}, IP: ${ip}`);

    fetch(`http://gold.xitu.io/rss`).then(
        response => response.text()
    ).then((data) => {
            parseString(data, function (err, result) {
                if (category) {
                    var newItem = result.rss.channel[0].item.filter((ele) => ele.category[0] === category);
                    result.rss.channel[0].item = newItem;
                }
                var xml = builder.buildObject(result);
                res.send(xml);
            });
        }
    ).catch(
        e => logger.error("Xitu2RSS Error: getting RSS", e)
    );
};