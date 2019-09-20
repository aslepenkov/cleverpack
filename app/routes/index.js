'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');

const User = require('../models/user');
const Room = require('../models/room');
const Code = require('../models/code');
const Msg = require('../models/msg');

// Home page
router.get('/', function(req, res, next) {
  // If user is already logged in, then redirect to rooms page
  if (req.isAuthenticated()) {
    res.redirect('/rooms');
  } else {
    res.render('login', {
      success: req.flash('success')[0],
      errors: req.flash('error'),
      showRegisterForm: req.flash('showRegisterForm')[0],
    });
  }
});

// Login
router.post('/login', passport.authenticate('local', {
  successRedirect: '/rooms',
  failureRedirect: '/',
  failureFlash: true,
}));

// Register via username and password
router.post('/register', function(req, res, next) {
  const credentials = {'username': req.body.username, 'password': req.body.password};

  if (credentials.username === '' || credentials.password === '') {
    req.flash('error', 'Missing credentials');
    req.flash('showRegisterForm', true);
    res.redirect('/');
  } else {
    // Check if the username already exists for non-social account
    User.findOne({
      'username': new RegExp('^' + req.body.username + '$', 'i'),
      'socialId': null,
    }, function(err, user) {
      if (err) throw err;
      if (user) {
        req.flash('error', 'Username already exists.');
        req.flash('showRegisterForm', true);
        res.redirect('/');
      } else {
        User.create(credentials, function(err, newUser) {
          if (err) throw err;
          req.flash('success', 'Your account has been created. Please log in.');
          res.redirect('/');
        });
      }
    });
  }
});

// Social Authentication routes
// 1. Login via Facebook
router.get('/auth/facebook', passport.authenticate('facebook'));
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/rooms',
  failureRedirect: '/',
  failureFlash: true,
}));

// 2. Login via Twitter
router.get('/auth/twitter', passport.authenticate('twitter'));
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successRedirect: '/rooms',
  failureRedirect: '/',
  failureFlash: true,
}));

router.get('/auth/google', passport.authenticate('google', {scope: 'https://www.googleapis.com/auth/plus.login'}));
router.get('/auth/google/callback', passport.authenticate('google', {
  successRedirect: '/rooms',
  failureRedirect: '/',
  failureFlash: true,
}));

// Rooms
router.get('/rooms', [User.isAuthenticated, function(req, res, next) {
  Room.find(function(err, rooms) {
    if (err) throw err;
    res.render('rooms', {rooms});
  });
}]);

// Chat Room
router.get('/chat/:id', [User.isAuthenticated, function(req, res, next) {
  const roomId = req.params.id;
  Room.findById(roomId, function(err, room) {
    if (err) throw err;
    if (!room) {
      return next();
    }
    res.render('chatroom', {user: req.user, room: room});
  });
}]);

router.get('/mars', [User.isAuthenticated, function(req, res, next) {
  const users = [];
  const rooms = [];
  const codes = [];
  const messages = [];

  User.find({}, function(err, u) {
    u.forEach(function(user) {
      users.push({
        id: user._id,
        username: user.username,
      });
    });
    Code.find({}, function(err, u) {
      u.forEach(function(o) {
        codes.push({
          title: o.title,
          roomId: o.roomId,
          created_at: o.created_at,
        });
      });
      Room.find({}, function(err, u) {
        u.forEach(function(o) {
          rooms.push({
            id: o._id,
            title: o.title,
            connections: o.connections,
          });
        });
        Msg.find({}, function(err, u) {
          u.forEach(function(o) {
            messages.push({
              title: o.title,
              roomId: o.roomId,
              created_at: o.created_at,
            });
          });


          res.render('admin', {rooms: rooms, users: users, codes: codes, messages: messages});
        });
      });
    });
  });


  console.log(
      rooms + ' ' + users + ' ' + codes + ' ' + messages
  );
}]);
// Logout
router.get('/logout', function(req, res, next) {
  // remove the req.user property and clear the login session
  req.logout();

  // destroy session data
  req.session = null;

  // redirect to homepage
  res.redirect('/');
});

module.exports = router;
