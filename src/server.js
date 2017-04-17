var path = require("path");
var log = require("./log");

var express = require("express");
var bodyParser = require("body-parser");

var createRESTAPI = require("./restapi");
var createSocketAPI = require("./socketapi");

var app = express();
var PORT = process.env.LOCKS_PORT || 4765;

log.init();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var monitor = require("./monitor");

monitor.initialize(function () {
  console.log("Starting HTTP server..");

  createRESTAPI(app, monitor);

  var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    createSocketAPI(server, monitor);

    console.log("locks HTTP server started at http://%s:%s", host, port);
  });
});

