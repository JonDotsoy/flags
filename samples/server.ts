#!/usr/bin/env bun
import { flags, flag } from "../src/flags.js";

// Server configuration example
const parser = flags({
  port: flag("--port", "-p")
    .number()
    .describe("Port number to listen on")
    .required(),
  host: flag("--host", "-h").string().describe("Host address to bind to"),
  ssl: flag("--ssl").boolean().describe("Enable SSL/TLS"),
  cert: flag("--cert").string().describe("Path to SSL certificate"),
  key: flag("--key").string().describe("Path to SSL private key"),
  verbose: flag("--verbose", "-v").boolean().describe("Enable verbose logging"),
})
  .programName("server")
  .describe("Start a web server with custom configuration");

// Show help
if (process.argv.includes("--help")) {
  console.log(parser.helpMessage());
  process.exit(0);
}

try {
  const config = parser.parse(process.argv.slice(2));

  console.log("🚀 Starting server with configuration:");
  console.log(`   Port: ${config.port}`);
  console.log(`   Host: ${config.host || "localhost"}`);
  console.log(`   SSL: ${config.ssl ? "enabled" : "disabled"}`);

  if (config.ssl) {
    if (!config.cert || !config.key) {
      console.error("❌ Error: SSL enabled but --cert and --key are required");
      process.exit(1);
    }
    console.log(`   Certificate: ${config.cert}`);
    console.log(`   Private Key: ${config.key}`);
  }

  if (config.verbose) {
    console.log("   Verbose logging: enabled");
  }

  console.log("\n✅ Server would start here...");
} catch (error) {
  console.error("❌ Error:", (error as Error).message);
  console.log("\nRun with --help for usage information");
  process.exit(1);
}
