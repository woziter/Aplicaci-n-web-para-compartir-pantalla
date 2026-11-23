
/**
 * Dependencias del servidor HTTP, Express y Socket.IO.
 * Se usan para servir la interfaz web y coordinar la sesión de transmisión.
 */

var express = require('express')
  , app = express()  
  , http = require('http')
  , os = require('os')
  , server = http.createServer(app)
  , io = require('socket.io')(server);


// Puerto configurable por el entorno; 5000 es el valor local por defecto.
var port = process.env.PORT || 5000;
// Inicia el servidor y acepta conexiones desde cualquier interfaz de red.
server.listen(port, '0.0.0.0');

// Guarda las sesiones registradas; la sesión actual usa la clave "screen".
var connections = {};
// SIN USO: se asigna, pero ningún flujo vuelve a leer este valor.
var globalID = '';
// Nombre fijo del namespace de Socket.IO.
var sessionID = 'screen';

// Funciones auxiliares y rutas del servidor: gestionan la sesión, la conexión y la entrega de la vista del emisor/receptor.

// SIN USO: quedó de la versión que generaba identificadores aleatorios.
function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

// Analiza cuerpos JSON enviados por el cliente.
app.use(express.json());
// Analiza formularios HTML enviados por el cliente.
app.use(express.urlencoded({extended: true}));
// Publica los archivos estáticos del frontend.
app.use(express.static(__dirname + '/public'));

// Sirve la pantalla inicial de la aplicación, donde el usuario comparte su pantalla.
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
  });

// Devuelve la información del host y el puerto para construir enlaces de acceso desde otros equipos.
app.get('/connection-info', function(req, res) {
  // Obtiene una IP IPv4 no interna para informar cómo conectarse.
  var interfaces = os.networkInterfaces();
  var lanHost = req.headers.host.split(':')[0];

  Object.keys(interfaces).some(function(name) {
    return interfaces[name].some(function(address) {
      if (address.family === 'IPv4' && !address.internal) {
        lanHost = address.address;
        return true;
      }
      return false;
    });
  });

  res.json({host: lanHost, port: port});
});

// Sirve la vista que recibe y muestra la pantalla compartida.
app.get('/receiver', function(req, res) {
  res.sendFile(__dirname + '/views/post.html');
});

// Ruta alternativa para abrir la vista receptora desde una URL con identificador de sesión.
app.get('/:unique', function(req, res) {
  res.sendFile(__dirname + '/views/post.html');
    });

// Registra la sesión fija y comunica el identificador al cliente para que inicie la conexión.
function getAndSendID(socket) {
  globalID = sessionID;
  connections[sessionID] = sessionID;
  socket.emit('youAreIn', {id:sessionID});
  return sessionID;
}

// Crea el espacio de nombres aislado para la negociación WebRTC de emisor y receptores.
function setupSession(sessionID) {
  var namespace = io.of('/' + sessionID);
    var senderSocketId = null;
    var streamStarted = false;

  // Cuenta y publica cuántos receptores están conectados a la sesión actual.
  function broadcastViewerCount() {
    var viewerCount = Array.from(namespace.sockets.values()).filter(function(socket) {
      return socket.handshake.query.role === 'viewer';
    }).length;
    namespace.emit('viewer-count', {count: viewerCount});
  }

  namespace.on('connection', function(sessionSocket) {
      // Detecta si el cliente conectado es el emisor y notifica si ya había una transmisión en curso.
      if (sessionSocket.handshake.query.role === 'sender') {
        senderSocketId = sessionSocket.id;
        if (streamStarted) {
          sessionSocket.emit('signal', {type: 'stream-started'});
        }
      } else if (streamStarted && senderSocketId) {
        sessionSocket.emit('signal', {type: 'stream-started'});
      }
    broadcastViewerCount();

    // Reenvía el contenido de la transmisión a los demás clientes del espacio compartido.
    sessionSocket.on('stream', function(data) {
      console.log("Stream Data Recived");
      sessionSocket.broadcast.emit('op_stream', data);
    });

    // Coordina la negociación WebRTC entre emisor y espectadores mediante señales ICE y ofertas/respuestas.
    sessionSocket.on('signal', function(data) {
        if ((sessionSocket.handshake.query.role === 'sender' || data.role === 'sender') && data.type === 'sender-ready') {
          senderSocketId = sessionSocket.id;
          streamStarted = true;
          sessionSocket.broadcast.emit('signal', {type: 'stream-started'});
          return;
        }
      var signal = Object.assign({}, data, {from: sessionSocket.id});
      if (data.type === 'viewer-ready' && senderSocketId) {
        var sender = namespace.sockets.get(senderSocketId);
        if (sender) {
          sender.emit('signal', signal);
        }
        return;
      }
      if (data.target) {
        var target = namespace.sockets.get(data.target);
        if (target) {
          target.emit('signal', signal);
        }
      } else {
        sessionSocket.broadcast.emit('signal', signal);
      }
    });

    sessionSocket.on('release', function(data) {
      // Elimina la sesión solicitada y notifica a los clientes conectados.
      console.log(connections);
      delete connections[data.id];
      sessionSocket.broadcast.emit('no_connection', data);
      sessionSocket.emit('disconnect_client');
      console.log(connections);
    });

      sessionSocket.on('disconnect', function() {
        // Limpia el estado del emisor y actualiza el contador.
        if (sessionSocket.id === senderSocketId) {
          senderSocketId = null;
          streamStarted = false;
          namespace.emit('signal', {type: 'stream-stopped'});
        }
        broadcastViewerCount();
      });
  });
}

io.on('connection', function(socket) {
  // Conexión general para el estado inicial y el registro de sesión.
     socket.on('Test', function() {
   // SIN USO: evento de diagnóstico que solo escribe en la consola.
      console.log("TEST");
     });

     socket.emit('status',{data:"Connected"});



     socket.on("getMeIn", function(data){
      // Registra al cliente y le devuelve el identificador de la sesión.
      getAndSendID(socket);

  });

});

setupSession(sessionID);

// SIN USO: implementación antigua de Socket.IO conservada como referencia.
// io.sockets.on('connection', function(socket) {
//     //storing the room in the socket
//     socket.room = params;
//     console.log("Params: "+params);
    

//     socket.join(params);

//     socket.on('transmitter', function(data) {
//         console.log("transmitter connectted.");
//         socket.leave(params);
//         socket.join('share');

//     });


//     socket.on('stream', function(data) {
//         console.log("Stream Data Recived");
//          io.sockets.in('share').emit('op_stream',data);
//            socket.volatile.broadcast.emit('op_stream', data);
//     });

//     socket.on('disconnect', function() {
//         console.log("disconnect called");
//         socket.leave(socket.room);
//     });
// });