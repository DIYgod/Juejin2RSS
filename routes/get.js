var request = require('request');
var logger = require('../tools/logger');
var redis = require('../tools/redis');
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

    function categorydone (id, name, callback) {
        request.get({
            url: `https://timeline-merger-ms.juejin.im/v1/get_entry_by_timeline?src=web&limit=20&category=${id}`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.75 Safari/537.36',
                'Referer': `https://juejin.im/welcome/${category}`,
                'Origin': 'https://juejin.im',
            }
        }, function (err, httpResponse, body) {
            if (body) {
                const data = JSON.parse(body);
                const list = data.d.entrylist || [];
                var rss =
                    `<?xml version="1.0" encoding="UTF-8"?>
                <rss version="2.0">
                <channel>
                <title>掘金RSS - ${name}</title>
                <link>https://juejin.im/welcome/${category}</link>
                <description>掘金RSS - ${name}，使用 Juejin2RSS(https://github.com/DIYgod/Juejin2RSS) 构建</description>
                <language>zh-cn</language>
                <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
                <ttl>300</ttl>`
                    for (var i = 0; i < list.length; i++) {
                        rss += `
                <item>
                    <title><![CDATA[${list[i].title}]]></title>
                    <description><![CDATA[${(list[i].content || list[i].summaryInfo || '无描述').replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, '')}]]></description>
                    <pubDate>${new Date(list[i].createdAt).toUTCString()}</pubDate>
                    <guid>${list[i].originalUrl}</guid>
                    <link>${list[i].originalUrl}</link>
                </item>`
                    }
                    rss += `
                </channel>
                </rss>`
                callback(rss);
            }
            else {
                callback('');
            }
        });
    }

    redis.client.get(`JuejinCategories`, function (err, reply) {
        if (reply) {
            logger.info(`Juejin2RSS category ${category} from redis, IP: ${ip}`);
            const cat = JSON.parse(reply).filter(item => item.title === category)[0];
            if (cat) {
                categorydone(cat.id, cat.name, (rss) => {
                    res.send(rss);
                });
            }
            else {
                res.send('');
            }
        }
        else {
            logger.info(`Juejin2RSS category ${category} form origin, IP: ${ip}`);

            request.get({
                url: `https://gold-tag-ms.juejin.im/v1/categories`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.75 Safari/537.36',
                    'Referer': `https://juejin.im/welcome/${category}`,
                    'Origin': 'https://juejin.im',
                    'X-Juejin-Client': '',
                    'X-Juejin-Src': 'web',
                    'X-Juejin-Token': '',
                    'X-Juejin-Uid': ''
                }
            }, function (err, httpResponse, body) {
                if (body) {
                    const data = JSON.parse(body);
                    redis.set(`JuejinCategories`, JSON.stringify(data.d.categoryList));
                    const cat = data.d.categoryList.filter(item => item.title === category)[0];
                    if (cat) {
                        categorydone(cat.id, cat.name, (rss) => {
                            res.send(rss);
                        });
                    }
                    else {
                        res.send('');
                    }
                }
            });
        }
    });
};