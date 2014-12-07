var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var midi = require('midi');

var input = new midi.input();

// Count the available input ports.
if (input.getPortCount) {
    try{
    // Get the name of a specified input port.
    input.getPortName(0);
    input.openPort(0);
    }
    catch(e){
        console.log('could not connect to midi device');
    }
};



// Configure a callback.
// input.on('message', function(deltaTime, message) {
//   console.log('m:' + message + ' d:' + deltaTime);
// });

// Open the first available input port.

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', routes);
// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

app.get('/', function(req, res){
    res.sendfile('index.html');
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

io.on('connection', function(socket){
    console.log('Socket Established');
    input.on('message', function(deltaTime, message) {
      console.log('m:' + message + ' d:' + deltaTime);
      socket.emit('midiNote', {'note' : message});
    });

    socket.emit('command', 'yak yak');
});

server.listen((process.env.PORT || 3000));


module.exports = app;
