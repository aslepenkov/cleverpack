'use strict';

var app = {


  rooms: function() {
    const socket = io('/rooms', {transports: ['websocket']});

    // When socket connects, get a list of chatrooms
    socket.on('connect', function() {
      // Update rooms list upon emitting updateRoomsList event
      socket.on('updateRoomsList', function(room) {
        // Display an error message upon a user error(i.e. creating a room with an existing title)
        $('.room-create p.message').remove();
        if (room.error != null) {
          $('.room-create').append(`<p class="message error">${room.error}</p>`);
        } else {
          app.helpers.updateRoomsList(room);
        }
      });

      // Whenever the user hits the create button, emit createRoom event.
      $('.room-create button').on('click', function(e) {
        const inputEle = $('input[name=\'title\']');
        const roomTitle = inputEle.val().trim();
        if (roomTitle !== '') {
          socket.emit('createRoom', roomTitle);
          inputEle.val('');
        }
      });
    });
  },

  chat: function(roomId, username) {
    const socket = io('/chatroom', {transports: ['websocket']});
    // let canvas = document.getElementsByTagName("BODY")[0];
    // let colors = document.getElementsByClassName('color');
    // let context = canvas[0].getContext("2d");
    const canvas = document.getElementById('canvas');
    const colors = document.getElementsByClassName('color');
    const context = canvas.getContext('2d');
    const current = {
      color: 'black',
    };
    let drawing = false;

    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

    for (let i = 0; i < colors.length; i++) {
      colors[i].addEventListener('click', onColorUpdate, false);
    }


    window.addEventListener('resize', onResize, false);


    function drawLine(x0, y0, x1, y1, color, emit) {
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.stroke();
      context.closePath();

      if (!emit) {
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      socket.emit('newDraw', roomId, {
        x0: (x0) / w,
        y0: y0 / h,
        x1: (x1) / w,
        y1: y1 / h,
        color: color,
      });
    }

    function onMouseDown(e) {
      drawing = true;
      current.x = e.clientX;
      current.y = e.clientY;
    }

    function onMouseUp(e) {
      if (!drawing) {
        return;
      }
      drawing = false;

      drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    }

    function onMouseMove(e) {
      if (!drawing) {
        return;
      }
      drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
      current.x = e.clientX;
      current.y = e.clientY;
    }

    function onColorUpdate(e) {
      current.color = e.target.className.split(' ')[1];
    }

    socket.on('newDraw', onDrawingEvent);

    // limit the number of events per second
    function throttle(callback, delay) {
      let previousCall = new Date().getTime();
      return function() {
        const time = new Date().getTime();

        if ((time - previousCall) >= delay) {
          previousCall = time;
          callback.apply(null, arguments);
        }
      };
    }

    function onDrawingEvent(data) {
      const w = canvas.width;
      const h = canvas.height;
      drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    }

    // make the canvas fill its parent
    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.zIndex = -1;
    }

    onResize();
    // When socket connects, join the current chatroom
    socket.on('connect', function() {
      onResize();
      socket.emit('join', roomId);
      // socket.on('drawing', onDrawingEvent);
      // Update users list upon emitting updateUsersList event
      socket.on('updateUsersList', function(users, clear) {
        $('.container p.message').remove();
        if (users.error != null) {
          $('.container').html(`<p class="message error">${users.error}</p>`);
        } else {
          app.helpers.updateUsersList(users, clear);
        }
      });

      // Whenever the user hits the save button, emit newMessage event.
      $('.chat-message button').on('click', function(e) {
        const textareaEle = $('textarea[name=\'message\']');
        const messageContent = textareaEle.val().trim();
        if (messageContent !== '') {
          const message = {
            content: messageContent,
            username: username,
            date: Date.now(),
          };

          socket.emit('newMessage', roomId, message);


          textareaEle.val('');
          app.helpers.addMessage(message);
          // работало
          // socket.emit('newCode', roomId, message);
          // app.helpers.addCode(message);
        }
      });

      // Whenever a user leaves the current room, remove the user from users list
      socket.on('removeUser', function(userId) {
        $('li#user-' + userId).remove();
        app.helpers.updateNumOfUsers();
      });

      // Append a new message
      socket.on('addMessage', function(message) {
        app.helpers.addMessage(message);
      });

      socket.on('addCode', function(code) {
        app.helpers.addCode(code);
      });

      socket.on('loadCode', function(code) {
        app.helpers.loadCode(code);
      });


      socket.on('addDraw', function(draw) {
        app.helpers.addDraw(draw);
      });


      socket.on('onNoteMoved', function(data) {
        // Update if the same note
        if (data.id == scope.note.id) {
          element.animate({
            left: data.x,
            top: data.y,
          });
        }
      });
      socket.on('onNoteUpdated', function(data) {
        // Update if the same note
        if (data.id == $scope.note.id) {
          $scope.note.title = data.title;
          $scope.note.body = data.body;
        }
      });
      const editor = ace.edit('editor');

      editor.setTheme('ace/theme/monokai');
      editor.session.setMode('ace/mode/javascript');
      editor.on('change', () => {
        setTimeout(function() {
          const val = editor.getSession().getValue();

          const code = {
            content: val,
            created_at: Date.now(),
          };
          const usr = document.getElementById(username);
          if (usr && usr.checked) {
            socket.emit('newCode', roomId, code);
          }
        }, 1);


        // app.helpers.addCode(code);
        // socket.emit('addCode', roomId, code);

        // console ('socket.emit(\'newCode\'');
        // app.helpers.addCode(code); не надо тк Ace сам все обновил. создавать новое не нужно

        // alert(roomId);
      });
    });
  },

  helpers: {

    encodeHTML: function(str) {
      return $('<div />').text(str).html();
    },

    // Update rooms list
    updateRoomsList: function(room) {
      room.title = this.encodeHTML(room.title);
      const html = `<a href="/chat/${room._id}"><li class="room-item">${room.title}</li></a>`;

      if (html === '') {
        return;
      }

      if ($('.room-list ul li').length > 0) {
        $('.room-list ul').prepend(html);
      } else {
        $('.room-list ul').html('').html(html);
      }

      this.updateNumOfRooms();
    },

    // Update users list
    updateUsersList: function(users, clear) {
      if (users.constructor !== Array) {
        users = [users];
      }

      let html = '';
      for (const user of users) {
        user.username = this.encodeHTML(user.username);
        html += `<li class="clearfix" id="user-${user._id}">

                     <div class="about">
                     <img src="https://api.adorable.io/avatars/40/${user.username}" /><input type="radio" name="access" id="${user.username}" value="${user.username}" />

                        <div class="name">${user.username}</div>
                        <!--<div class="status"><i class="fa fa-circle online"></i> online</div>-->
                     </div></li>`;
      }

      if (html === '') {
        return;
      }

      if (clear != null && clear == true) {
        $('.users-list ul').html('').html(html);
      } else {
        $('.users-list ul').prepend(html);
      }

      this.updateNumOfUsers();
    },

    // Adding a new message to chat history
    addMessage: function(message) {
      message.date = (new Date(message.date)).toLocaleString();
      message.username = this.encodeHTML(message.username);
      message.content = this.encodeHTML(message.content);

      const html = `<li>
                    <div class="message-data">
                      <!--<span class="message-data-name">${message.username}!</span>-->
                        <img src="https://api.adorable.io/avatars/40/${message.username}" style="border-radius: 50%" />
                      <!--<span class="message-data-time">${message.date}</span>-->
                    <div class="message my-message" dir="auto">${message.content}</div>
                    </div>
                  </li>`;
      $(html).hide().appendTo('.chat-history ul').slideDown(200);

      // Keep scroll bar down
      $('.chat-history').animate({scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
    },
    addDraw: function(draw) {
      function drawLine(x0, y0, x1, y1, color, emit) {
        const canvas = document.getElementById('canvas');
        const colors = document.getElementsByClassName('color');
        const context = canvas.getContext('2d');
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.stroke();
        context.closePath();

        if (!emit) {
          return;
        }

        const w = canvas.width;
        const h = canvas.height;

        socket.emit('newDraw', roomId, {
          x0: x0 / w,
          y0: y0 / h,
          x1: x1 / w,
          y1: y1 / h,
          color: color,
        });
      }

      console.log('socket.on(\'drawing\', ');
      const w = canvas.width;
      const h = canvas.height;
      drawLine(draw.x0 * w, draw.y0 * h, draw.x1 * w, draw.y1 * h, draw.color);
    },

    loadCode: function(code) {
      const editor = ace.edit('editor');
      // var codes = editor.getValue();

      setTimeout(function() {
        editor.setValue(code.title);
      }, 1);
    },
    addCode: function(code) {
      // message.date = (new Date(message.date)).toLocaleString();
      // message.username = this.encodeHTML(message.username);
      code.content = this.encodeHTML(code.content);
      //
      // let html = `<li>
      //         <div class="message-data">
      //           <span class="message-data-name">${message.username}</span>
      //           <span class="message-data-time">${message.date}</span>
      //         </div>
      //         <div class="message my-message" dir="auto">${message.content}</div>
      //       </li>`;
      // $(html).hide().appendTo('.chat-history ul').slideDown(200);
      //
      // // Keep scroll bar down
      // $(".chat-history").animate({scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
      const editor = ace.edit('editor');
      const codes = editor.getValue();


      if (!(codes === code.content)) {
        setTimeout(function() {
          console.log('codes:' + codes);
          console.log('code:' + code.content);
          editor.setValue(code.content);
        }, 1000);
      }
      //       editor.setValue(code.content);
    },

    // Update number of rooms
    // This method MUST be called after adding a new room
    updateNumOfRooms: function() {
      const num = $('.room-list ul li').length;
      $('.room-num-rooms').text(num + ' Room(s)');
    },

    // Update number of online users in the current room
    // This method MUST be called after adding, or removing list element(s)
    updateNumOfUsers: function() {
      const num = $('.users-list ul li').length;
      $('.chat-num-users').text(num + ' User(s)');
    },
  },

  sticky:
    {},
};
