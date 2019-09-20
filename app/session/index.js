'use strict';

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const db = require('../database');
const config = require('../config');

/**
 * Initialize Session
 * Uses MongoDB-based session store
 *
 */
const init = function() {
  if (process.env.NODE_ENV === 'production') {
    return session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      unset: 'destroy',
      store: new MongoStore({mongooseConnection: db.Mongoose.connection}),
    });
  } else {
    return session({
      secret: config.sessionSecret,
      resave: false,
      unset: 'destroy',
      saveUninitialized: true,
    });
  }
};

module.exports = init();
