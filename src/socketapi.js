var WebSocketServer = require("ws").Server;
var log = require("./log");

module.exports = function (server, monitor) {
  var wss = new WebSocketServer({
    server: server
  });

  wss.on("connection", function (ws) {
    ws.on("message", function (message) {
      message = JSON.parse(message);

      switch (message.type) {

        case "claim":
          const claim = monitor.claimVM();
          if (claim) {
            log.increment("accepted");
            ws.send(JSON.stringify({
              accepted: true,
              token: claim.token
            }));
          } else {
            log.increment("rejected");
            ws.send(JSON.stringify({
              accepted: false
            }));
          }
          break;

        case "release":
          const token = message.token;
          if (monitor.releaseVM(token)) {
            log.increment("released");
          } else {
            log.increment("ignored");
          }
          break;
      }
    });
  });
};