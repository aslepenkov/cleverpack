'use strict';

const Mongoose = require('mongoose');

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
const CodeSchema = new Mongoose.Schema({
  title: {type: String, required: true},
  roomId: {type: String, required: true},
  created_at: Date,
  // connections: { type: [{ userId: String, socketId: String }]}
});

const codeModel = Mongoose.model('code', CodeSchema);

module.exports = codeModel;
