'use strict';

const MsgModel = require('../database').models.msg;
const Msg = require('../models/msg');

const create = function(data, callback) {
  const newMsg = new MsgModel(data);
  newMsg.save(callback);
};
const findAll = function(data, callback) {
  return MsgModel.find(data);
};
const find = function(data, callback) {
  MsgModel.find(data, callback);
};

const findOne = function(data, callback) {
  MsgModel.findOne(data, callback).sort({created_at: -1});
};

const findById = function(id, callback) {
  MsgModel.findById(id, callback);
};

const findByIdAndUpdate = function(id, data, callback) {
  MsgModel.findByIdAndUpdate(id, data, {new: true}, callback);
};

/**
 * Add a Msg along with the corresponding socket to the passed Msg
 *
 */
const addMsg = function(Msg, socket, callback) {
  // Get current Msg's id
  const MsgId = socket.request.session.passport.Msg;

  // Push a new connection object(i.e. {MsgId + socketId})
  const conn = {MsgId: MsgId, socketId: socket.id};
  Msg.connections.push(conn);
  Msg.save(callback);
};

/**
 * Get all Msgs in a Msg
 *
 */
const getMsgs = function(Msg, socket, callback) {
  const Msgs = []; const vis = {}; let cunt = 0;
  const MsgId = socket.request.session.passport.Msg;

  // Loop on Msg's connections, Then:
  Msg.connections.forEach(function(conn) {
    // 1. Count the number of connections of the current Msg(using one or more sockets) to the passed Msg.
    if (conn.MsgId === MsgId) {
      cunt++;
    }

    // 2. Create an array(i.e. Msgs) contains unique Msgs' ids
    if (!vis[conn.MsgId]) {
      Msgs.push(conn.MsgId);
    }
    vis[conn.MsgId] = true;
  });

  // Loop on each Msg id, Then:
  // Get the Msg object by id, and assign it to Msgs array.
  // So, Msgs array will hold Msgs' objects instead of ids.
  Msgs.forEach(function(MsgId, i) {
    Msg.findById(MsgId, function(err, Msg) {
      if (err) {
        return callback(err);
      }
      Msgs[i] = Msg;
      if (i + 1 === Msgs.length) {
        return callback(null, Msgs, cunt);
      }
    });
  });
};

/**
 * Remove a Msg along with the corresponding socket from a Msg
 *
 */
const removeMsg = function(socket, callback) {
  // Get current Msg's id
  const MsgId = socket.request.session.passport.Msg;

  find(function(err, Msgs) {
    if (err) {
      return callback(err);
    }

    // Loop on each Msg, Then:
    Msgs.every(function(Msg) {
      let pass = true; let cunt = 0; let target = 0;

      // For every Msg,
      // 1. Count the number of connections of the current Msg(using one or more sockets).
      Msg.connections.forEach(function(conn, i) {
        if (conn.MsgId === MsgId) {
          cunt++;
        }
        if (conn.socketId === socket.id) {
          pass = false, target = i;
        }
      });

      // 2. Check if the current Msg has the disconnected socket,
      // If so, then, remove the current connection object, and terminate the loop.
      if (!pass) {
        Msg.connections.id(Msg.connections[target]._id).remove();
        Msg.save(function(err) {
          callback(err, Msg, MsgId, cunt);
        });
      }

      return pass;
    });
  });
};

module.exports = {
  create,
  find,
  findOne,
  findById,
  findAll,
  addMsg,
  getMsgs,
  removeMsg,
};
