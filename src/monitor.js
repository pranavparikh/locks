var currentProvider = "sauce";
var provider = require("./providers/" + currentProvider);
var log = require("./log");
var _ = require("lodash");



var HISTORY_MAX = 100;

var DELAY = 5000;
var ERROR_DELAY = 10000;

// Expire claims after 30 seconds, assuming we don't learn about external
// release of claim in that time window.
var EXPIRY_TIME = 1000 * 30;

var lastRemoteClaims = undefined;
var claims = [];
var concurrency = undefined;
var status;
var localClaimsExpiry = EXPIRY_TIME;
var history = [];

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
  var didReleaseSomething = false;
  claims = claims.filter(function (claim) {
    if (claim.token === token) {
      didReleaseSomething = true;
      console.log("Releasing claim (request): token " + token);
      return false;
    }
    return true;
  });
  return didReleaseSomething;
};

var expireClaims = function () {
  var now = Date.now();
  claims = claims.filter(function (claim) {
    if (now - claim.timestamp > localClaimsExpiry) {
      console.log("Releasing claim (expired): token " + claim.token);
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

    concurrency = data.max;

    lastRemoteClaims = data.claimed;

    status = {
      timestamp: Date.now(),
      localClaims: claims.length,
      remoteActual: data.claimed,
      remoteMax: concurrency,
      remoteQueued: data.queued,
      remoteActive: data.active,
      likelyTotal: (claims.length + data.claimed),
      localClaimsExpiry: localClaimsExpiry
    };

    if (data.teams) {
      _.each(data.teams, function (val, key) {
        console.log("activeByAccount" + key + " : " + val);
        log.gauge("activeByAccount", val, ["account:" + key])
      });
    }

    history.push(status);

    if (history.length > HISTORY_MAX) {
      history.shift();
    }

    console.log("    Local Claims: " + claims.length);
    console.log("   Remote Queued: " + data.queued);
    console.log("   Remote Active: " + data.active);

    console.log("   Remote Actual: " + data.claimed + " / " + concurrency);
    console.log("    Likely total: " + (claims.length + data.claimed) + " / " + concurrency);

   log.gauge("localClaims", status.localClaims);
   log.gauge("remoteActual", status.remoteActual);
   log.gauge("remoteMax", status.remoteMax);
   log.gauge("remoteQueued", status.remoteQueued);
   log.gauge("remoteActive", status.remoteActive);
   log.gauge("likelyTotal", status.likelyTotal);

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
  releaseVM: releaseVM,
  getStatus: function () {
    return status;
  },
  getHistory: function () {
    return history;
  },
  setClaimTimeout: function (timeout) {
    
    if (_.isInteger(_.toNumber(timeout))) {
      localClaimsExpiry = _.toNumber(timeout);
      console.log("localClaims expiry has been successfully set to", timeout, "ms");
    } else {
      console.log("timeout needs to be an integer");
    }
  }
};
