#!/usr/bin/env bun
import { flags, flag } from "../src/new-flags";

const parser = flags({
  port: flag("--port", "-p").number().default(3000),
  host: flag("--host", "-h").string().default("localhost"),
  showHelp: flag("--help", "-h").boolean(),
});

const run = () => {
  const { port, host, showHelp } = parser.parse(process.argv.slice(2));

  if (showHelp) {
    console.log(parser.helpMessage());
    return;
  }

  console.log(`🚀 start server http://${host}:${port}`);
};

run();
