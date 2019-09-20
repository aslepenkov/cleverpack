'use strict';

const Mongoose = require('mongoose');

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
const MsgSchema = new Mongoose.Schema({
  title: {type: String, required: true},
  roomId: {type: String, required: true},
  created_at: Date,
});

const msgModel = Mongoose.model('msg', MsgSchema);

module.exports = msgModel;
