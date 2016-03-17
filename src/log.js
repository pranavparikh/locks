var request = require("request");
var argv = require("marge").argv;
var path = require("path");
var fs = require("fs");
var StatsD = require('node-statsd');
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
  host: host,
  port: port,
  prefix: prefix
};

var client;

var init = function () {

  if (host) {
    client = new StatsD(options);
  }
};

var log = function (ev) {
  if (client) {
    _.each(ev, function (value, key) {
      // send metrics to statsd over UDP.  no error handling by design.
      // https://codeascraft.com/2011/02/15/measure-anything-measure-everything/
      // (see the `Why UDP?` section)
      client.gauge(key, value);
    });
  }
};

module.exports = {
  init: init,
  log: log
};