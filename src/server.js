var express = require("express");
var app = express();
var PORT = 3000;

var monitor = require("./monitor");

process.stdin.resume(); 
process.stdin.setEncoding("utf8"); 
process.stdin.setRawMode(true); 
process.stdin.on("data", function (key) { 
  if (key === "\3") { 
    console.log("\nShutting down server ..."); 
    process.exit(); 
  } else if (key === "c") {
    console.log("\nGenerating a synthetic claim...");
    if (monitor.claimVM()) {
      console.log("(claim accepted)");
    } else {
      console.log("(claim rejected: too many claims right now)");
    }
  } 
});

app.get("/claim", function (req, res) {
  if (monitor.claimVM()) {
    console.log("<-- claim accepted from " + req.ip);
    res.send({
      accepted: true,
      token: null,
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

monitor.initialize(function () {
  console.log("Starting HTTP server..");
  var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("locks HTTP server started at http://%s:%s", host, port);
  });
});