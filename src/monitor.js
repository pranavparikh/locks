var currentProvider = "sauce";
var provider = require("./providers/" + currentProvider);

var lastRemoteClaims = undefined;
var claims = [];
var concurrency = undefined;

var DELAY = 5000;
var ERROR_DELAY = 10000;

// Expire claims after 30 seconds, assuming we don't learn about external
// release of claim in that time window.
var EXPIRY_TIME = 1000 * 30;

var getTotalClaims = function () {
  return lastRemoteClaims + claims.length;
};

var claimVM = function () {
  if (getTotalClaims() < concurrency) {
    var claim = {
      token: "vm" + Math.round(100000 + (Math.random() * 99999999)).toString(16),
      timestamp: Date.now()
    };
    claims.push(claim);
    return claim;
  } else {
    return false;
  }
};

var releaseVM = function (token) {
  claims = claims.filter(function (claim) {
    if (claim.token === token) {
      console.log("Early-releasing claim by token " + token + " from " + claim.timestamp + "  (now = " + now + ")");
      return false;
    }
    return true;
  });
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
      showError(error);
      console.log("Waiting " + ERROR_DELAY + "ms before polling again...");
      setTimeout(monitor, ERROR_DELAY);
      return;
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
var showError = function (error) {
  console.log("Error: ", error);
  if (error.stack) {
    console.log("Stack trace:", error.stack);
  }
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

  claimVM: claimVM,
  releaseVM: releaseVM
};