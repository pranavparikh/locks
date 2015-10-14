var marge = require("marge");
var path = require("path");
marge.init(path.resolve("./locks.json"));

var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var PORT = 4765;

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true }));

var monitor = require("./monitor");

app.post("/claim", function (req, res) {
  var claim = monitor.claimVM();
  if (claim) {
    console.log("<-- claim accepted from " + req.ip);
    res.send({
      accepted: true,
      token: claim.token,
      message: "Claim accepted"
    });
  } else {
    console.log("<-- claim rejected from " + req.ip);
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
      console.log("<-- releasing token " + token + " received from " + req.ip);
    } else {
      console.log("<-- ignoring token release request " + token + " received from " + req.ip + ", likely already cleaned up.");
    }
  } else {
    console.log("<-- invalid token release request received from " + req.ip);
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
