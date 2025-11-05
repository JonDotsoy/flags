#!/usr/bin/env bun
import { flags, flag } from "../src/flags.js";

// Git clone-like example
const parser = flags({
  repository: flag("--repo", "-r")
    .string()
    .describe("Repository URL")
    .required(),
  branch: flag("--branch", "-b").string().describe("Branch to clone"),
  depth: flag("--depth", "-d")
    .number()
    .describe("Create a shallow clone with history truncated"),
  recursive: flag("--recursive").boolean().describe("Initialize submodules"),
  quiet: flag("--quiet", "-q").boolean().describe("Suppress output"),
  verbose: flag("--verbose", "-v").boolean().describe("Verbose output"),
  output: flag("--output", "-o").string().describe("Output directory"),
})
  .programName("git-clone")
  .describe("Clone a git repository");

// Show help
if (process.argv.includes("--help")) {
  console.log(parser.helpMessage());
  process.exit(0);
}

try {
  const options = parser.parse(process.argv.slice(2));

  if (!options.quiet) {
    console.log("📦 Cloning repository...\n");
    console.log(`Repository: ${options.repository}`);

    if (options.branch) {
      console.log(`Branch: ${options.branch}`);
    }

    if (options.depth) {
      console.log(`Depth: ${options.depth} (shallow clone)`);
    }

    if (options.recursive) {
      console.log("Submodules: will be initialized");
    }

    if (options.output) {
      console.log(`Output: ${options.output}`);
    }
  }

  if (options.verbose) {
    console.log("\n[Verbose] Fetching objects...");
    console.log("[Verbose] Resolving deltas...");
    console.log("[Verbose] Checking out files...");
  }

  if (!options.quiet) {
    console.log("\n✅ Clone complete!");
  }
} catch (error) {
  console.error("❌ Error:", (error as Error).message);
  console.log("\nRun with --help for usage information");
  process.exit(1);
}
