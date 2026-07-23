import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { delimiter, join, resolve } from "node:path";

const home = process.env.USERPROFILE || process.env.HOME || "";
const cargoBin = join(home, ".cargo", "bin");
const cargoExe = join(cargoBin, process.platform === "win32" ? "cargo.exe" : "cargo");

if (!existsSync(cargoExe)) {
  console.error(`未找到 Rust Cargo：${cargoExe}`);
  process.exit(1);
}

const env = { ...process.env };
const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") || "PATH";
env[pathKey] = `${cargoBin}${delimiter}${env[pathKey] || ""}`;

const tauriCli = resolve("node_modules", "@tauri-apps", "cli", "tauri.js");
const child = spawn(process.execPath, [tauriCli, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Tauri 启动失败：${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
