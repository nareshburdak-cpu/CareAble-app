// server/seed/diagnoseTLS.js
const tls = require("tls");

const host = "ac-3nlongx-shard-00-02.cfnwyql.mongodb.net";
const port = 27017;

console.log(`Connecting TLS to ${host}:${port}...`);
console.log(`Node version: ${process.version}`);
console.log(`Current time: ${new Date().toISOString()}`);
console.log("");

const socket = tls.connect(port, host, { servername: host }, () => {
  console.log("✅ TLS connection established");
  console.log("Authorized:", socket.authorized);
  if (!socket.authorized) {
    console.log("Auth error:", socket.authorizationError);
  }
  const cert = socket.getPeerCertificate();
  console.log("Cert subject:", cert.subject);
  console.log("Cert issuer:", cert.issuer);
  console.log("Valid from:", cert.valid_from);
  console.log("Valid to:", cert.valid_to);
  socket.end();
});

socket.on("error", (err) => {
  console.error("❌ TLS error:", err.message);
  console.error("Code:", err.code);
});

// Don't hang forever
setTimeout(() => {
  console.error("Timeout after 10s");
  process.exit(1);
}, 10000);