var request = require("request");
var argv = require("marge").argv;

module.exports = function (ev) {
  if (argv.kibana_url) {
    request({
      method: "POST",
      json: true,
      timeout: 1000,
      body: ev,
      url: argv.kibana_url
    }, function (error, response, body) {
      if (error) {
        console.log("logging error:", error);
      } else {
        console.log("logging success. Response:", response, body);
      }
    });
  }
};