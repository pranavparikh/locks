var marge = require("marge");
var path = require("path");
var log = require("./log");
marge.init(path.resolve("./locks.json"));

var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var PORT = 4765;

log.init();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var monitor = require("./monitor");

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

monitor.initialize(function () {
  console.log("Starting HTTP server..");
  var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("locks HTTP server started at http://%s:%s", host, port);
  });
});
