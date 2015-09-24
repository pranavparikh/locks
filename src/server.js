var monitor = require("./monitor");

process.stdin.resume(); 
process.stdin.setEncoding("utf8"); 
process.stdin.setRawMode(true); 
process.stdin.on("data", function (key) { 
  if (key === "\3") { 
    console.log("\nShutting down server ..."); 
    process.exit(); 
  } else if (key === "c") {
    console.log("\nGenerating a synthetic claim...");
    if (monitor.claimVM()) {
      console.log("(claim accepted)");
    } else {
      console.log("(claim rejected: too many claims right now)");
    }
  } 
});

monitor.initialize();