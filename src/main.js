module.exports = {

  // Make contact with a locks server and ask it for a VM
  getVM: function () {
    // 1. Make a request to locks server
    // 2. If we got a VM, return it, possibly with a token for identity
    // 3. If no VM is available yet, return an empty result
  },

  // Make contact with a locks server and tell it we are no longer using this VM
  // (The use of this method is optional. The claim on this VM is released
  // automatically by locks within a given timeout anyway, but this allows
  // the claim to be released even faster).
  releaseVM: function (identity) {

  }
};