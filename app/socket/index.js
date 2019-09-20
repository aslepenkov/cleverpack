'use strict';

const config = require('../config');
const redis = require('redis').createClient;
const adapter = require('socket.io-redis');

const Room = require('../models/room');
const Code = require('../models/code');
const Msg = require('../models/msg');

/**
 * Encapsulates all code for emitting and listening to socket events
 *
 */
const ioEvents = function(io) {
  // Rooms namespace
  io.of('/rooms').on('connection', function(socket) {
    // Create a new room
    socket.on('createRoom', function(title) {
      Room.findOne({'title': new RegExp('^' + title + '$', 'i')}, function(err, room) {
        if (err) throw err;
        if (room) {
          socket.emit('updateRoomsList', {error: 'Room title already exists.'});
        } else {
          Room.create({
            title: title,
          }, function(err, newRoom) {
            if (err) throw err;
            socket.emit('updateRoomsList', newRoom);
            socket.broadcast.emit('updateRoomsList', newRoom);
          });
        }
      });
      // Code.findOne({'title': new RegExp('.*', 'i')}, function(err, room){
      //     if(err) throw err;
      //     if(room){
      //         socket.emit('updateRoomsList', { error: 'Room title already exists.' });
      //     } else {
      //         Room.create({
      //             title: title
      //         }, function(err, newRoom){
      //             if(err) throw err;
      //             socket.emit('updateRoomsList', newRoom);
      //             socket.broadcast.emit('updateRoomsList', newRoom);
      //         });
      //     }
      // });
    });
  });

  // Chatroom namespace
  io.of('/chatroom').on('connection', function(socket) {
    socket.on('createNote', function(data) {
      socket.broadcast.emit('onNoteCreated', data);
    });

    socket.on('updateNote', function(data) {
      socket.broadcast.emit('onNoteUpdated', data);
    });

    socket.on('moveNote', function(data) {
      socket.broadcast.emit('onNoteMoved', data);
    });

    socket.on('deleteNote', function(data) {
      socket.broadcast.emit('onNoteDeleted', data);
    });

    // Join a chatroom
    socket.on('join', function(roomId) {
      Room.findById(roomId, function(err, room) {
        if (err) throw err;
        if (!room) {
          // Assuming that you already checked in router that chatroom exists
          // Then, if a room doesn't exist here, return an error to inform the client-side.
          socket.emit('updateUsersList', {error: 'Room doesnt exist.'});
        } else {
          // Check if user exists in the session
          if (socket.request.session.passport == null) {
            return;
          }


          Code.findOne({'roomId': roomId}, function(err, code) {
            if (code) {
              socket.emit('loadCode', code);
            }
          });

          Room.addUser(room, socket, function(err, newRoom) {
            // Join the room channel
            socket.join(newRoom.id);

            Room.getUsers(newRoom, socket, function(err, users, cuntUserInRoom) {
              if (err) throw err;

              // Return list of all user connected to the room to the current user
              socket.emit('updateUsersList', users, true);

              // Return the current user to other connecting sockets in the room
              // ONLY if the user wasn't connected already to the current room
              if (cuntUserInRoom === 1) {
                socket.broadcast.to(newRoom.id).emit('updateUsersList', users[users.length - 1]);
              }
            });
          });
        }
      });
    });

    // When a socket exits
    socket.on('disconnect', function() {
      // Check if user exists in the session
      if (socket.request.session.passport == null) {
        return;
      }

      // Find the room to which the socket is connected to,
      // and remove the current user + socket from this room
      Room.removeUser(socket, function(err, room, userId, cuntUserInRoom) {
        if (err) throw err;

        // Leave the room channel
        socket.leave(room.id);

        // Return the user id ONLY if the user was connected to the current room using one socket
        // The user id will be then used to remove the user from users list on chatroom page
        if (cuntUserInRoom === 1) {
          socket.broadcast.to(room.id).emit('removeUser', userId);
        }
      });
    });

    // When a new message arrives
    socket.on('newMessage', function(roomId, message) {
      // No need to emit 'addMessage' to the current socket
      // As the new message will be added manually in 'main.js' file
      // socket.emit('addMessage', message);
      Msg.create({
        title: message.username + ':' + message.content,
        roomId: roomId,
        created_at: message.date,
      }, function(err, newRoom) {
        // if (err) throw err;
        // socket.emit('updateRoomsList', newRoom);
        // socket.broadcast.emit('updateRoomsList', newRoom);
      });
      socket.broadcast.to(roomId).emit('addMessage', message);
    });

    socket.on('newCode', function(roomId, message) {
      Code.create({
        title: message.content,
        roomId: roomId,
        created_at: message.created_at,
      }, function(err, newRoom) {
        // if (err) throw err;
        // socket.emit('updateRoomsList', newRoom);
        // socket.broadcast.emit('updateRoomsList', newRoom);
      });
      // No need to emit 'addMessage' to the current socket
      // As the new message will be added manually in 'main.js' file
      // socket.emit('addMessage', message);
      // console.log('socket.on(\'newCode\'' + roomId);

      socket.broadcast.to(roomId).emit('addCode', message);
    });

    socket.on('newDraw', function(roomId, message) {
      socket.broadcast.to(roomId).emit('addDraw', message);
    });
  });
};

/**
 * Initialize Socket.io
 * Uses Redis as Adapter for Socket.io
 *
 */
const init = function(app) {
  const server = require('http').Server(app);
  const io = require('socket.io')(server);

  // Force Socket.io to ONLY use "websockets"; No Long Polling.
  io.set('transports', ['websocket']);

  // Using Redis
  const port = config.redis.port;
  const host = config.redis.host;
  const password = config.redis.password;
  const pubClient = redis(port, host, {auth_pass: password});
  const subClient = redis(port, host, {auth_pass: password, return_buffers: true});
  io.adapter(adapter({pubClient, subClient}));

  // Allow sockets to access session data
  io.use((socket, next) => {
    require('../session')(socket.request, {}, next);
  });

  // Define all Events
  ioEvents(io);

  // The server object will be then used to list to a port number
  return server;
};

module.exports = init;
