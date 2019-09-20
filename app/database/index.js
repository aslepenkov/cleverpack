'use strict';

const config = require('../config');
const Mongoose = require('mongoose');
const logger = require('../logger');

// Connect to the database
// construct the database URI and encode username and password.
const dbURI = 'mongodb://' +
  encodeURIComponent(config.db.username) + ':' +
  encodeURIComponent(config.db.password) + '@' +
  config.db.host + ':' +
  config.db.port + '/' +
  config.db.name;
Mongoose.connect(dbURI);

// Throw an error if the connection fails
Mongoose.connection.on('error', function(err) {
  if (err) throw err;
});

// mpromise (mongoose's default promise library) is deprecated,
// Plug-in your own promise library instead.
// Use native promises
Mongoose.Promise = global.Promise;

module.exports = {
  Mongoose,
  models: {
    user: require('./schemas/user.js'),
    room: require('./schemas/room.js'),
    code: require('./schemas/code.js'),
    msg: require('./schemas/msg.js'),
  },
};
