var request = require("request");
var _ = require("lodash");

var initialized = false;

if (process.env.SAUCE_OUTBOUND_PROXY) {
  request = request.defaults(process.env.SAUCE_OUTBOUND_PROXY);
}

var settings = {
  username: process.env.SAUCE_USERNAME,
  accessKey: process.env.SAUCE_ACCESS_KEY
};

var concurrency;

var SAUCE_REQUEST_TIMEOUT = 1000 * 10;

// TODO: need a timeout option so we don't get into a zombie mode
var getSauce = function (verb, callback) {
  var url;

  if (verb === "concurrency") {
    url = "https://saucelabs.com/rest/v1/users/" + settings.username + "/concurrency";
  } else if (verb === "activity") {
    url = "https://saucelabs.com/rest/v1/" + settings.username + "/activity";
  }
  request.get(url, {
    auth: {
      user: settings.username,
      pass: settings.accessKey
    },
    timeout: SAUCE_REQUEST_TIMEOUT
  }, function (error, response, body) {
    if (error) {
      callback(error);
    } else {
      try {
        var parsedBody = JSON.parse(body);
      } catch (e) {
        callback("could not parse JSON response from SauceLabs endpoint at " + url + " " + e.toString());
        return;
      }
      callback(null, parsedBody);
    }
  });
};

module.exports = {
  initialize: function (callback) {
    this._init(function (error) {
      if (error) {
        callback(error);
      } else {
        initialized = true;
        console.log("SauceLabs connection initialized. Account concurrency is " + concurrency + " virtual machines.");
        callback(null);
      }
    });
  },

  getUsage: function (callback) {
    /*
      {
        "subaccounts": {
          "{account name}": {
            "in progress": 1,
            "all": 1,
            "queued": 0
          }
        },
        "totals": {
          "in progress": 1,
          "all": 1,
          "queued": 0
        }
      }
    */
    getSauce("activity", function (error, data) {
      if (error) {
        callback(error);
      } else {
        if (data) {

          var teams = {};
          if (data.subaccounts) {
            _.each(data.subaccounts, function(val, key) {
              var countForTeam = val["in progress"];
              if (countForTeam) {
                key = key.replace(".", "_");
                teams[key] = countForTeam;
              }
            });
          }

          console.log(JSON.stringify(teams));

          if (data.totals) {
            callback(null, {
              max: concurrency,
              claimed: data.totals.all,
              active: data.totals["in progress"],
              queued: data.totals.queued,
              teams: teams              
            });
          } else {
            callback(new Error("Data from SauceLabs activity endpoint was invalid: no totals field found."))
          }
        } else {
          callback(new Error("Data from SauceLabs activity endpoint was invalid: data body is null or undefined."))
        }
      }
    });
  },

  _init: function (callback) {
    /*
    "{account name}": {
      "current": {
        "overall": 1,
        "mac": 0,
        "manual": 0
      },
      "remaining": {
        "overall": 99,
        "mac": 100,
        "manual": 5
      }
    },
    */
    getSauce("concurrency", function (error, data) {
      if (error) {
        callback(error);
      } else {
        if (data && data.concurrency) {
          if (data.concurrency[settings.username]) {
            var summary = data.concurrency[settings.username];
            concurrency = summary.current.overall + summary.remaining.overall;
            callback();
          } else {
            callback(new Error("Data from SauceLabs concurrency endpoint was invalid: concurrency field found, but cannot find data for username " + settings.username));
          }
        } else {
          callback(new Error("Data from SauceLabs concurrency endpoint was invalid: no concurrency field found."));
        }
      }
    });
  }
};
