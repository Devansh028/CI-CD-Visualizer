const fs = require("fs");
const path = require("path");
const { runCommand } = require("../../utils/commandRunner");

/**
 * Auto-detects package manager based on lockfiles and installs dependencies.
 * 
 * @param {string} workspacePath - Cloned project directory
 * @param {Function} onData - Logging callback
 */
const installDependencies = async (workspacePath, onData) => {
  const pkgPath = path.join(workspacePath, "package.json");
  if (!fs.existsSync(pkgPath)) {
    onData("Skipping dependency installation. No package.json found in workspace root.\n");
    return;
  }

  const hasYarn = fs.existsSync(path.join(workspacePath, "yarn.lock"));
  const hasPnpm = fs.existsSync(path.join(workspacePath, "pnpm-lock.yaml"));

  let command = "npm";
  let args = ["install"];

  if (hasPnpm) {
    command = "pnpm";
    args = ["install"];
    onData("Auto-detected package manager: pnpm\n");
  } else if (hasYarn) {
    command = "yarn";
    args = ["install"];
    onData("Auto-detected package manager: yarn\n");
  } else {
    onData("Auto-detected package manager: npm (fallback)\n");
  }

  onData(`Running dependency installation: ${command} ${args.join(" ")}...\n`);
  await runCommand(command, args, { cwd: workspacePath }, onData);
};

module.exports = {
  installDependencies,
};
