var request = require("request");
var argv = require("marge").argv;
var path = require("path");
var fs = require("fs");
const SDC = require("hot-shots");
var _ = require("lodash");

var host = process.env.LOCKS_STATSD_URL;
var port = process.env.LOCKS_STATSD_PORT || 8125;
var prefix = (process.env.LOCKS_STATSD_PREFIX || 'locks') + ".";

if (host) {
  console.log("Sending results to statsd server at: " + host + ":" + port + " [" + prefix + "*]" );
} else {
  console.log("No statsd server configured.");
}

var options = {
  telegraf: true,   
  host: host,
  port: port,
  prefix: prefix
};

var client;

var counts = {};

var init = function () {

  if (host) {
    client = new SDC(options);
  }
};

var sendStats = function (type, metricName, value, tags) {
  var tagStr = tags ? JSON.stringify(tags) : "";
  console.log("[" + type + "] " + metricName + " : " + value + " " + tagStr);
  client[type](metricName, value, tags);
};

var gauge = function(metricName, value, tags) {
  sendStats("gauge", metricName, value, tags);
};

var increment = function(metricName, value, tags) {
  sendStats("increment", metricName, value, tags);
};

module.exports = {
  init: init,
  gauge: gauge,
  increment: increment
};
