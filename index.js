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
var probe = require('probe-image-size');
// var getImageUrls = require('get-image-urls');
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

    socket.on('urlToScrape', function(data) {
        console.log('urlToScrape data received');
        var url = data.linkURL;
        var newMessage = data.newMessage;
        request(url, function(error, response, html) {
            console.log(response.statusCode);
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                fs.writeFileSync('tempWebpage.html', html);
                //HEADING
                newMessage.headline = $('title').text();
                console.log(newMessage.headline);
                //IMAGES
                var srcList = [];
                var num_images = 0;
                var probe_callback = 0;
                $('img').each(function(i, element) {
                    if ($(this).attr('src') != null) {
                        num_images += 1;
                        probe($(this).attr('src'), function(err, result){
                            if(err) {console.log(err)}
                            srcList.push(result);
                            probe_callback += 1;
                            if (probe_callback == num_images) {
                                console.log(srcList);
                                newMessage.feature_image = findFeatureImage(srcList);
                                io.sockets.connected[data.thisUsersocketID].emit('urlScrapedData', newMessage);
                            }
                        });
                    }
                })
            }
        });
    })
});

function findFeatureImage(srcList) {
    var final_image = null;
    var max_size = null;
    var aspectThreshold = 2.5;
    var areaThreshold = 80000;
    if (srcList.length > 0) {
        for (var i = 0; i < srcList.length; i++) {
            if(srcList[i] != undefined) {
              if (srcList[i].type == "jpg" || srcList[i].type == "png") {
                  var imageurl = srcList[i].url;
                  if (imageurl.indexOf("https") == -1 && imageurl.indexOf("http") != -1) {
                      imageurl = "https" + imageurl.split("http")[1];
                  }
                  if (imageurl.indexOf("https") != -1) {
                      var width = srcList[i].width;
                      var height = srcList[i].height;
                      if (width / height < aspectThreshold && width / height > (1 / aspectThreshold) && width * height > areaThreshold) {
                          if (max_size == null || width * height > max_size) {
                              max_size = width * height;
                              final_image = imageurl;
                          }
                      }
                  }
              }
            }
        }
        console.log("FINAL IMAGE: " + final_image);
        return final_image;
    }
}
