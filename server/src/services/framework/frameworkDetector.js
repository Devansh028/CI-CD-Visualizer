const fs = require("fs");
const path = require("path");

/**
 * Heuristically detects the framework of a project repository workspace.
 * 
 * @param {string} workspacePath - Absolute path of cloned repo
 * @param {Function} onData - Logging callback
 * @returns {Promise<string>} The detected framework identifier matching seeded profiles
 */
const detectFramework = async (workspacePath, onData = () => {}) => {
  onData("Running multi-framework detection...\n");

  // 1. Next.js
  const hasNextConfig = fs.existsSync(path.join(workspacePath, "next.config.js")) ||
                        fs.existsSync(path.join(workspacePath, "next.config.mjs")) ||
                        fs.existsSync(path.join(workspacePath, "next.config.ts"));
  if (hasNextConfig) {
    onData("Detected framework: Next.js (found config file)\n");
    return "Next.js";
  }

  const pkgPath = path.join(workspacePath, "package.json");
  let hasPackageJson = fs.existsSync(pkgPath);
  let pkgDeps = {};
  if (hasPackageJson) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkgDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (pkgDeps["next"]) {
        onData("Detected framework: Next.js (next dependency in package.json)\n");
        return "Next.js";
      }
    } catch (e) {}
  }

  // 2. Go
  if (fs.existsSync(path.join(workspacePath, "go.mod"))) {
    onData("Detected framework: Go (found go.mod)\n");
    return "Go";
  }

  // 3. Spring Boot
  const hasPomXml = fs.existsSync(path.join(workspacePath, "pom.xml"));
  const hasBuildGradle = fs.existsSync(path.join(workspacePath, "build.gradle"));
  if (hasPomXml || hasBuildGradle) {
    onData("Detected framework: Spring Boot\n");
    return "Spring Boot";
  }

  // 4. Django
  const hasManagePy = fs.existsSync(path.join(workspacePath, "manage.py"));
  const reqPath = path.join(workspacePath, "requirements.txt");
  let hasDjangoInReq = false;
  let hasFastApiInReq = false;
  let hasUvicornInReq = false;

  if (fs.existsSync(reqPath)) {
    try {
      const content = fs.readFileSync(reqPath, "utf8").toLowerCase();
      hasDjangoInReq = content.includes("django");
      hasFastApiInReq = content.includes("fastapi");
      hasUvicornInReq = content.includes("uvicorn");
    } catch (e) {}
  }

  if (hasManagePy || hasDjangoInReq) {
    onData("Detected framework: Django\n");
    return "Django";
  }

  // 5. FastAPI
  const hasMainPy = fs.existsSync(path.join(workspacePath, "main.py"));
  if (hasFastApiInReq || hasMainPy || hasUvicornInReq) {
    onData("Detected framework: FastAPI\n");
    return "FastAPI";
  }

  // 6. Node.js / Express / NestJS / React / Vite
  if (hasPackageJson) {
    if (pkgDeps["@nestjs/core"]) {
      onData("Detected framework: NestJS\n");
      return "NestJS";
    }
    if (pkgDeps["express"]) {
      onData("Detected framework: Express\n");
      return "Express";
    }
    if (pkgDeps["react"]) {
      onData("Detected framework: React\n");
      return "React";
    }
    if (pkgDeps["vite"]) {
      onData("Detected framework: Vite\n");
      return "Vite";
    }
    onData("Detected framework: Node.js (fallback)\n");
    return "Node.js";
  }

  // 7. Static Website: index.html only
  const hasIndexHtml = fs.existsSync(path.join(workspacePath, "index.html"));
  if (hasIndexHtml) {
    onData("Detected framework: Static Websites (found index.html)\n");
    return "Static Websites";
  }

  // Check Flask fallback
  if (fs.existsSync(reqPath)) {
    onData("Detected framework: Flask (requirements.txt fallback)\n");
    return "Flask";
  }

  onData("Detected framework: Static Websites (default fallback)\n");
  return "Static Websites";
};

module.exports = {
  detectFramework,
};
