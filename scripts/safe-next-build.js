#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const nextBin = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");
const buildDir = path.join(rootDir, ".next");
const rollbackDir = path.join(rootDir, ".next.previous");
const rollbackMetaPath = path.join(rootDir, ".next.rollback.json");
const args = new Set(process.argv.slice(2));
const vmMode = args.has("--vm");
const memoryMb = vmMode ? 384 : 448;

function log(message) {
  process.stdout.write(`[safe-next-build] ${message}\n`);
}

function removeDir(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function moveDir(fromPath, toPath) {
  if (!fs.existsSync(fromPath)) return false;
  removeDir(toPath);
  fs.renameSync(fromPath, toPath);
  return true;
}

if (!fs.existsSync(nextBin)) {
  log("Next.js build binary is missing. Run install before building.");
  process.exit(1);
}

const hadExistingBuild = moveDir(buildDir, rollbackDir);
if (hadExistingBuild) {
  log(`Moved existing build to ${path.basename(rollbackDir)} for rollback.`);
}

const nodeOptions = [process.env.NODE_OPTIONS || "", `--max-old-space-size=${memoryMb}`, "--max-semi-space-size=16"]
  .join(" ")
  .trim();

const env = {
  ...process.env,
  CI: process.env.CI || "1",
  NEXT_TELEMETRY_DISABLED: "1",
  NODE_OPTIONS: nodeOptions,
};

log(`Starting Next build with ${memoryMb} MB heap cap${vmMode ? " (vm mode)" : ""}.`);
const result = spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
  cwd: rootDir,
  stdio: "inherit",
  env,
});

if (result.status !== 0) {
  log("Build failed.");
  removeDir(buildDir);
  if (hadExistingBuild) {
    moveDir(rollbackDir, buildDir);
    log("Restored previous .next build.");
  }
  process.exit(result.status || 1);
}

const meta = {
  builtAt: new Date().toISOString(),
  vmMode,
  memoryMb,
  rollbackAvailable: fs.existsSync(rollbackDir),
};
fs.writeFileSync(rollbackMetaPath, JSON.stringify(meta, null, 2));
log("Build completed successfully.");
if (meta.rollbackAvailable) {
  log("Previous build kept at .next.previous for rollback.");
}
