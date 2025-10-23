#!/usr/bin/env bun
import { flags, flag } from "../src/new-flags";

// Build tool example with multiple string flags
const parser = flags({
  entry: flag("--entry", "-e").string().describe("Entry point file").required(),
  output: flag("--output", "-o")
    .string()
    .describe("Output directory")
    .required(),
  format: flag("--format", "-f")
    .string()
    .describe("Output format (esm, cjs, iife)"),
  minify: flag("--minify", "-m").boolean().describe("Minify output"),
  sourcemap: flag("--sourcemap", "-s")
    .boolean()
    .describe("Generate source maps"),
  external: flag("--external", "-x")
    .strings()
    .describe("External dependencies (can be used multiple times)"),
  watch: flag("--watch", "-w").boolean().describe("Watch mode for development"),
})
  .programName("build")
  .describe("Build and bundle your application");

// Show help
if (process.argv.includes("--help")) {
  console.log(parser.helpMessage());
  process.exit(0);
}

try {
  const options = parser.parse(process.argv.slice(2));

  console.log("🔨 Building application...\n");
  console.log("Configuration:");
  console.log(`  Entry: ${options.entry}`);
  console.log(`  Output: ${options.output}`);
  console.log(`  Format: ${options.format || "esm"}`);
  console.log(`  Minify: ${options.minify ? "yes" : "no"}`);
  console.log(`  Source maps: ${options.sourcemap ? "yes" : "no"}`);

  if (options.external.length > 0) {
    console.log(`  External deps: ${options.external.join(", ")}`);
  }

  if (options.watch) {
    console.log("\n👀 Watch mode enabled - watching for changes...");
  } else {
    console.log("\n✅ Build complete!");
  }
} catch (error) {
  console.error("❌ Build failed:", (error as Error).message);
  console.log("\nRun with --help for usage information");
  process.exit(1);
}
