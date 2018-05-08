module.exports = {
  getconnection:function(){

  },
  init:function(server){
    var io = require('socket.io')(server);
    io.on('connection', function (socket) {
      var addedUser = false;
      var numUsers = 0;

      ;

      // when the client emits 'add user', this listens and executes
      socket.on('add user', function (username) {
        console.log("add user called")
        console.log(username);
        if (addedUser){
          console.log("user already addded so skip")
          return; 
        } else{
          console.log("new user so add")
        }

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
          numUsers: numUsers
        });

        //console.log("broadcast scorecard");
        // echo globally (all clients) that a person has connected
       /* socket.broadcast.emit('scorecard', {
          username: socket.username,
          message: "start match",
          score: "1234"
        });*/
      });
    });

    return io;

  }
}