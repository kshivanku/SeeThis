//Web Server
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = app.listen(process.env.PORT || 8000, function() {
    console.log('serverstarted');
})
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extented: true
}));
app.use(express.static("public"));

var path = require('path');
var fs = require('fs');

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', function(socket){
  console.log(socket.id);
  socket.on('newChatText', function(data){
    console.log('new chat recieved');
    console.log(data);
    socket.broadcast.emit('newChatText', data);
  });
});


// app.post('/uploadDP', function (req, res) {
//   var avatar = req.body.avatar;
//   console.log(req.body);
//   // var targetPath = path.resolve('/public/displayPictures/image.png');
//   // fs.rename(tempPath, targetPath, function(err) {
//   //   if (err) throw err;
//   //   console.log("Upload completed!");
//   // });
// });
