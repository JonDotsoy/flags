#!/usr/bin/env bun
import { flags, flag } from "../src/flags.js";

// Basic example with simple flags
const parser = flags({
  verbose: flag("--verbose", "-v").boolean().describe("Enable verbose output"),
  help: flag("--help", "-h").boolean().describe("Show help message"),
})
  .programName("basic")
  .describe("A basic CLI example");

// Show help
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(parser.helpMessage());
  process.exit(0);
}

// Parse arguments
const args = parser.parse(process.argv.slice(2));

console.log("Parsed arguments:", args);

if (args.verbose) {
  console.log("Verbose mode enabled!");
}
