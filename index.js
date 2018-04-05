//Web Server
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
// var cors = require('cors');
var requestImageSize = require('request-image-size');
var bodyParser = require('body-parser');
var app = express();
var server = app.listen(process.env.PORT || 8000, function() {
    console.log('serverstarted');
})
// app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extented: true}));
app.use(express.static("public"));

var path = require('path');
var fs = require('fs');

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', function(socket) {
    console.log(socket.id);
    io.sockets.connected[socket.id].emit('sessionID', socket.id);

    socket.on('newChatText', function(data) {
        console.log('new chat recieved');
        console.log(data);
        socket.broadcast.emit('newChatText', data);
    });

    socket.on('urlToScrape', function(data){
      console.log('urlToScrape data received');
      var url = data.linkURL;
      console.log('url', url);
      request(url, function(error, response, html) {
          console.log('response.statusCode: ' + response.statusCode);
          if (!error && response.statusCode == 200) {
              console.log('get response received');
              var $ = cheerio.load(html);
              fs.writeFileSync('tempWebpage.html', html);
              var images = [];
              $('img').each(function(i, element) {
                  if($(this).attr('src') != null) {
                    images.push($(this).attr('src'));
                  }
              })
              var urlScrapedData = {
                  "pageHeading": $('title').text(),
                  "images": images,
                  "newMessage": data.newMessage
              }
              io.sockets.connected[data.thisUsersocketID].emit('urlScrapedData', urlScrapedData);
          }
      });
    })
});

// app.post('/urlScraper', function(req, res) {
//
// });
