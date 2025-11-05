#!/usr/bin/env bun
import { flags, flag } from "../src/flags.js";

// Docker-like CLI example
const parser = flags({
  image: flag("--image", "-i")
    .string()
    .describe("Docker image name")
    .required(),
  tag: flag("--tag", "-t").string().describe("Image tag"),
  port: flag("--port", "-p")
    .strings()
    .describe("Port mappings (e.g., 8080:80)"),
  env: flag("--env", "-e").strings().describe("Environment variables"),
  volume: flag("--volume", "-v").strings().describe("Volume mounts"),
  detach: flag("--detach", "-d")
    .boolean()
    .describe("Run container in background"),
  name: flag("--name").string().describe("Container name"),
  rm: flag("--rm")
    .boolean()
    .describe("Automatically remove container when it exits"),
})
  .programName("docker-run")
  .describe("Run a Docker container with specified configuration");

// Show help
if (process.argv.includes("--help")) {
  console.log(parser.helpMessage());
  process.exit(0);
}

try {
  const config = parser.parse(process.argv.slice(2));

  const imageTag = config.tag ? `${config.image}:${config.tag}` : config.image;

  console.log("🐳 Running Docker container...\n");
  console.log(`Image: ${imageTag}`);

  if (config.name) {
    console.log(`Name: ${config.name}`);
  }

  if (config.port.length > 0) {
    console.log(`Ports: ${config.port.join(", ")}`);
  }

  if (config.env.length > 0) {
    console.log(`Environment:`);
    config.env.forEach((e) => console.log(`  - ${e}`));
  }

  if (config.volume.length > 0) {
    console.log(`Volumes:`);
    config.volume.forEach((v) => console.log(`  - ${v}`));
  }

  console.log(`Detached: ${config.detach ? "yes" : "no"}`);
  console.log(`Auto-remove: ${config.rm ? "yes" : "no"}`);

  console.log("\n✅ Container would start here...");
} catch (error) {
  console.error("❌ Error:", (error as Error).message);
  console.log("\nRun with --help for usage information");
  process.exit(1);
}
