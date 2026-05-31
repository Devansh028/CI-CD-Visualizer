const { spawn } = require("child_process");

/**
 * Runs a command and streams stdout and stderr back via a callback.
 * 
 * @param {string} command - The command executable
 * @param {Array<string>} args - Arguments array
 * @param {Object} options - Options to pass to spawn (cwd, env, etc.)
 * @param {Function} [onData] - Optional callback receiving stdout/stderr string data
 * @returns {Promise<number>} - Resolves with the exit code (0), or rejects with an error
 */
const runCommand = (command, args = [], options = {}, onData = null) => {
  return new Promise((resolve, reject) => {
    // Windows supports shell execution automatically; node:20 container is Debian Linux.
    // Specifying shell: true allows executing script files and running npm commands cleanly.
    const child = spawn(command, args, {
      shell: true,
      ...options,
    });

    child.stdout.on("data", (data) => {
      if (onData) {
        onData(data.toString());
      }
    });

    child.stderr.on("data", (data) => {
      if (onData) {
        onData(data.toString());
      }
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        const fullCmd = `${command} ${args.join(" ")}`.trim();
        reject(new Error(`Command '${fullCmd}' failed with exit code ${code}`));
      }
    });
  });
};

module.exports = {
  runCommand,
};
