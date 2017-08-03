var log = require("./log");
var packagejson = require('../package.json');

module.exports = function (app, monitor) {

  app.post("/claim", function (req, res) {
    var claim = monitor.claimVM();
    if (claim) {
      log.increment("accepted");
      res.send({
        accepted: true,
        token: claim.token,
        message: "Claim accepted"
      });
    } else {
      log.increment("rejected");
      res.send({
        accepted: false,
        message: "Claim rejected. No VMs available."
      });
    }
  });

  app.post("/release", function (req, res) {
    if (req.body) {
      var token = req.body.token;
      if (monitor.releaseVM(token)) {
        log.increment("released");
      } else {
        log.increment("ignored");
      }
    } else {
      log.increment("invalid");
    }
  });

  app.post("/timeout", function (req, res) {
    if (req.body) {
      var claimTimeout = req.body.timeout;
      res.send(monitor.setClaimTimeout(claimTimeout));
    }
  });

  app.get("/status", function (req, res) {
    res.send(monitor.getStatus());
  });

  app.get("/history", function (req, res) {
    res.send(monitor.getHistory());
  });

  app.get("/version", function (req, res) {
    res.send(packagejson.version)
  });

};
