'use strict';

const codeModel = require('../database').models.code;
const Code = require('../models/code');

const create = function(data, callback) {
  const newCode = new codeModel(data);
  newCode.save(callback);
};
const findAll = function(data, callback) {
  return codeModel.find(data);
};
const find = function(data, callback) {
  codeModel.find(data, callback);
};

const findOne = function(data, callback) {
  codeModel.findOne(data, callback).sort({created_at: -1});
};

const findById = function(id, callback) {
  codeModel.findById(id, callback);
};

const findByIdAndUpdate = function(id, data, callback) {
  codeModel.findByIdAndUpdate(id, data, {new: true}, callback);
};

/**
 * Add a code along with the corresponding socket to the passed code
 *
 */
const addCode = function(code, socket, callback) {
  // Get current code's id
  const codeId = socket.request.session.passport.code;

  // Push a new connection object(i.e. {codeId + socketId})
  const conn = {codeId: codeId, socketId: socket.id};
  code.connections.push(conn);
  code.save(callback);
};

/**
 * Get all codes in a code
 *
 */
const getCodes = function(code, socket, callback) {
  const codes = []; const vis = {}; let cunt = 0;
  const codeId = socket.request.session.passport.code;

  // Loop on code's connections, Then:
  code.connections.forEach(function(conn) {
    // 1. Count the number of connections of the current code(using one or more sockets) to the passed code.
    if (conn.codeId === codeId) {
      cunt++;
    }

    // 2. Create an array(i.e. codes) contains unique codes' ids
    if (!vis[conn.codeId]) {
      codes.push(conn.codeId);
    }
    vis[conn.codeId] = true;
  });

  // Loop on each code id, Then:
  // Get the code object by id, and assign it to codes array.
  // So, codes array will hold codes' objects instead of ids.
  codes.forEach(function(codeId, i) {
    Code.findById(codeId, function(err, code) {
      if (err) {
        return callback(err);
      }
      codes[i] = code;
      if (i + 1 === codes.length) {
        return callback(null, codes, cunt);
      }
    });
  });
};

/**
 * Remove a code along with the corresponding socket from a code
 *
 */
const removeCode = function(socket, callback) {
  // Get current code's id
  const codeId = socket.request.session.passport.code;

  find(function(err, codes) {
    if (err) {
      return callback(err);
    }

    // Loop on each code, Then:
    codes.every(function(code) {
      let pass = true; let cunt = 0; let target = 0;

      // For every code,
      // 1. Count the number of connections of the current code(using one or more sockets).
      code.connections.forEach(function(conn, i) {
        if (conn.codeId === codeId) {
          cunt++;
        }
        if (conn.socketId === socket.id) {
          pass = false, target = i;
        }
      });

      // 2. Check if the current code has the disconnected socket,
      // If so, then, remove the current connection object, and terminate the loop.
      if (!pass) {
        code.connections.id(code.connections[target]._id).remove();
        code.save(function(err) {
          callback(err, code, codeId, cunt);
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
  addCode,
  getCodes,
  removeCode,
};
