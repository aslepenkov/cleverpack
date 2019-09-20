'use strict';
const logger = require('../logger');

const init = function() {
  logger.log('NODE_ENV=' + process.env.NODE_ENV);
  if (false) { // process.env.NODE_ENV === 'production'
    const redisURI = require('url').parse(process.env.REDIS_URL);
    const redisPassword = redisURI.auth.split(':')[1];
    return {
      db: {
        username: process.env.dbUsername,
        password: process.env.dbPassword,
        host: process.env.dbHost,
        port: process.env.dbPort,
        name: process.env.dbName,
      },
      sessionSecret: process.env.sessionSecret,
      facebook: {
        clientID: process.env.facebookClientID,
        clientSecret: process.env.facebookClientSecret,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'photos'],
      },
      twitter: {
        consumerKey: process.env.twitterConsumerKey,
        consumerSecret: process.env.twitterConsumerSecret,
        callbackURL: '/auth/twitter/callback',
        profileFields: ['id', 'displayName', 'photos'],
      },
      google: {
        clientID: process.env.googleConsumerKey,
        clientSecret: process.env.googleConsumerSecret,
        callbackURL: '/auth/google/callback',
        profileFields: ['id', 'displayName', 'photos'],
      },
      redis: {
        host: redisURI.hostname,
        port: redisURI.port,
        password: redisPassword,
      },
    };
  } else if (process.env.islocal === 'false') {
    return require('./config.json');
  } else {
    return require('./configloc.json');
  }
};

module.exports = init();
