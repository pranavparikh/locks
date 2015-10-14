var request = require("request");
var argv = require("marge").argv;
var path = require("path");
var fs = require("fs");

module.exports = function (ev) {
  if (argv.kibana_url) {
    var options = {
      method: "POST",
      json: true,
      timeout: 1000,
      body: ev,
      url: argv.kibana_url
    };

    if (argv.ca) {
      var ca = fs.readFileSync(path.resolve(argv.ca));
      options.ca = ca;
    }

    if (argv.cert) {
      var cert = fs.readFileSync(path.resolve(argv.cert));
      options.cert = cert;
    }

    request(options, function (error, response, body) {
      if (error) {
        console.log("logging error:", error);
      } else {
        console.log("logging success. Response:", response, body);
      }
    });
  }
};