//Web Server
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var requestImageSize = require('request-image-size');
var bodyParser = require('body-parser');
var app = express();
var server = app.listen(process.env.PORT || 8000, function() {
    console.log('serverstarted');
})
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extented: true}));
app.use(express.static("public"));

var path = require('path');
var fs = require('fs');

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', function(socket) {
    console.log(socket.id);
    socket.on('newChatText', function(data) {
        console.log('new chat recieved');
        console.log(data);
        socket.broadcast.emit('newChatText', data);
    });
});

app.post('/urlScraper', function(req, res) {
    var url = req.body.linkURL;
    request(url, function(error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            fs.writeFileSync('tempWebpage.html', html);
            var images = [];
            $('img').each(function(i, element) {
                if($(this).attr('src') != null) {
                  images.push($(this).attr('src'));
                }
            })

            var reply = {
                "pageHeading": $('title').text(),
                "images": images
            }
            res.send(reply);
        }
    });
});
