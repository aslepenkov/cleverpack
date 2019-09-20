'use strict';

const userModel = require('../database').models.user;

const create = function(data, callback) {
  const newUser = new userModel(data);
  newUser.save(callback);
};
const findAll = function(data, callback) {
  return userModel.find(data);
};
const find = function(data, callback) {
  userModel.find(data, callback);
};

const findOne = function(data, callback) {
  userModel.findOne(data, callback);
};

const findById = function(id, callback) {
  userModel.findById(id, callback);
};


/**
 * Find a user, and create one if doesn't exist already.
 * This method is used ONLY to find user accounts registered via Social Authentication.
 *
 */
const findOrCreate = function(data, callback) {
  findOne({'socialId': data.id}, function(err, user) {
    if (err) {
      return callback(err);
    }
    if (user) {
      return callback(err, user);
    } else {
      const userData = {
        username: data.displayName,
        socialId: data.id,
        picture: data.photos[0].value || null,
      };

      // To avoid expired Facebook CDN URLs
      // Request user's profile picture using user id
      // @see http://stackoverflow.com/a/34593933/6649553
      if (data.provider == 'facebook' && userData.picture) {
        userData.picture = 'http://graph.facebook.com/' + data.id + '/picture?type=large';
      }

      create(userData, function(err, newUser) {
        callback(err, newUser);
      });
    }
  });
};

/**
 * A middleware allows user to get access to pages ONLY if the user is already logged in.
 *
 */
const isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
};

module.exports = {
  create,
  find,
  findAll,
  findOne,
  findById,
  findOrCreate,
  isAuthenticated,
};
