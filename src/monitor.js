var currentProvider = "sauce";
var provider = require("./providers/" + currentProvider);

var lastRemoteClaims = undefined;
var claims = [];
var concurrency = undefined;

var DELAY = 5000;

// Use a short expiry time for test purposes
// var EXPIRY_TIME = 1000 * 60 * 2;
var EXPIRY_TIME = 1000 * 15;

var getTotalClaims = function () {
  return lastRemoteClaims + claims.length;
};

var claimVM = function () {
  if (getTotalClaims() < concurrency) {
    claims.push({
      timestamp: Date.now()
    });
    return true;
  } else {
    return false;
  }
};

var expireClaims = function () {
  var now = Date.now();
  claims = claims.filter(function (claim) {
    if (now - claim.timestamp > EXPIRY_TIME) {
      console.log("Expiring claim from " + claim.timestamp + "  (now = " + now + ")");
      return false;
    }
    return true;
  });
};

var garbageCollector;

var monitor = function () {
  console.log("--> ping");
  provider.getUsage(function (error, data) {
    //
    // data's fields:
    //
    //   max      - total number of VMs allowed for this account
    //   claimed  - total number of active AND queued VMs
    //   active   - total number of VMs running tests
    //   queued   - total number of VMs getting ready to run tests
    //
    if (error) {
      return fail(error);
    }

    if (typeof concurrency === "undefined") {
      concurrency = data.max
    }

    lastRemoteClaims = data.claimed;

    console.log("    Local Claims: " + claims.length);
    console.log("   Remote Actual: " + data.claimed + " / " + concurrency);
    console.log("    Likely total: " + (claims.length + data.claimed) + " / " + concurrency);

    setTimeout(monitor, DELAY);

    if (!garbageCollector) {
      garbageCollector = setInterval(function () {
        expireClaims();
      }, 500);
    }
  })
};

// TODO: sensible error handling -- this will kill the monitor on any error
var fail = function (error) {
  console.log("Error: ", error);
  process.exit(1);
};

module.exports = {
  initialize: function (callback) {
    provider.initialize(function (error) {
      if (error) {
        throw new Error("Failed to initialize provider connection: " + error);
      }
      monitor();
      if (callback) {
        callback();
      }
    });
  },

  claimVM: claimVM
};