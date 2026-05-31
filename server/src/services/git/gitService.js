const path = require("path");
const fs = require("fs");
const { runCommand } = require("../../utils/commandRunner");

/**
 * Clones a repository and checks out the specific branch.
 * Cleans up the old workspace directory if it exists.
 * 
 * @param {string} repoUrl - Git repository URL
 * @param {string} branch - Target branch
 * @param {string} workspacePath - Directory to clone into
 * @param {Function} onData - Logging callback
 */
const cloneRepository = async (repoUrl, branch, workspacePath, onData) => {
  // 1. Cleanup old workspace if it exists
  if (fs.existsSync(workspacePath)) {
    onData(`Cleaning up existing directory: ${workspacePath}...\n`);
    fs.rmSync(workspacePath, { recursive: true, force: true });
  }

  // Create parent directory if needed
  fs.mkdirSync(path.dirname(workspacePath), { recursive: true });

  onData(`Cloning repository ${repoUrl} (branch: ${branch}) into temporary workspace...\n`);

  // Use git clone --branch --single-branch to clone the specific branch directly
  await runCommand(
    "git",
    ["clone", "--branch", branch, "--single-branch", repoUrl, workspacePath],
    {},
    onData
  );
};

module.exports = {
  cloneRepository,
};
