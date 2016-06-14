/**
 * People counter v1.0.1
 * https://github.com/cedricve
 * License: MIT
 *
 */

var config = require('./config') // local config.js file
, http     = require('http')
, io       = require('socket.io')
, path     = require('path')
, fs       = require('fs')
, counter  = 0

var incoming = 0;
var outgoing = 0;
var server = http.createServer(handler).listen(config.PORT) // creates the HTTP server
var sio    = io.listen(server) // socket.io is listening to server

/**
* The function used by `server` to handle a request
*/
function handler (request, response) {
    var filePath  = config.VIEWS + request.url
    , extension   = path.extname(filePath)
    , contentType = 'text/html'
    // Special cases
    switch (filePath) {
        case config.VIEWS + '/':
            filePath = config.VIEWS + '/' + 'index.html'
        break;
        case './supersecretfunction':
            counter = 0;
            filePath = config.VIEWS + '/' + 'index.html'
            console.log("Counter reset.")
        break;
    }
    // Serve static files
    switch (extension) {
        case '.js':
            contentType = 'text/javascript'
        break;
        case '.css':
            contentType = 'text/css'
        break;
    }

    if(request.method == 'POST')
    {
        request.on('data', function(data)
        {
            var object = JSON.parse(data);

            incoming += object.incoming;
            outgoing += object.outgoing;
            sio.sockets.emit("updateval", {"in": incoming, "out": outgoing});
        });
    }

    fs.exists(filePath, function (exists) {
        if (exists) {
            fs.readFile(filePath, function (error, content) {
                if (error) {
                    response.writeHead(500)
                    response.end("Error loading " + filePath)
                } else {
                    response.writeHead(200, {'Content-Type': contentType });
                    response.end(content, 'utf-8')
                }
            });
        } else {
            response.writeHead(404)
            response.end("Couldn't find " + filePath)
        }
    });
}

// Socket.IO events
sio.sockets.on("connection", function (socket) {

    socket.emit("updateval", {"in": incoming, "out": outgoing}); // send to the socket (the new client)

}); // sio.sockets.on

console.log("Server running on port %d", config.PORT)
