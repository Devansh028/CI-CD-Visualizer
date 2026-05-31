const mongoose = require("mongoose");
const logger = require("../utils/logger");
const FrameworkProfile = require("../models/FrameworkProfile");
const Template = require("../models/Template");

const seedFrameworkProfiles = async () => {
  const defaults = [
    { framework: "React", buildCommand: "npm install && npm run build", startCommand: "nginx -g \"daemon off;\"", dockerStrategy: "static-nginx" },
    { framework: "Vite", buildCommand: "npm install && npm run build", startCommand: "nginx -g \"daemon off;\"", dockerStrategy: "static-nginx" },
    { framework: "Node.js", buildCommand: "npm install", startCommand: "npm start", dockerStrategy: "node-server" },
    { framework: "Express", buildCommand: "npm install", startCommand: "npm start", dockerStrategy: "node-server" },
    { framework: "NestJS", buildCommand: "npm install && npm run build", startCommand: "node dist/main", dockerStrategy: "node-server" },
    { framework: "Flask", buildCommand: "pip install -r requirements.txt", startCommand: "python app.py", dockerStrategy: "python-flask" },
    { framework: "Next.js", buildCommand: "npm install && npm run build", startCommand: "npm start", dockerStrategy: "node-server" },
    { framework: "Django", buildCommand: "pip install -r requirements.txt && python manage.py migrate", startCommand: "python manage.py runserver 0.0.0.0:8000", dockerStrategy: "python-django" },
    { framework: "FastAPI", buildCommand: "pip install -r requirements.txt", startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000", dockerStrategy: "python-fastapi" },
    { framework: "Spring Boot", buildCommand: "./gradlew build", startCommand: "java -jar build/libs/*.jar", dockerStrategy: "java-springboot" },
    { framework: "Go", buildCommand: "go build -o main .", startCommand: "./main", dockerStrategy: "go-binary" },
    { framework: "Static Websites", buildCommand: "", startCommand: "nginx -g \"daemon off;\"", dockerStrategy: "static-nginx" },
  ];

  try {
    const count = await FrameworkProfile.countDocuments();
    if (count === 0) {
      await FrameworkProfile.insertMany(defaults);
      logger.info("[DB Seed] Seeded framework profiles successfully.");
    }
  } catch (err) {
    logger.error(`[DB Seed] Failed to seed framework profiles: ${err.message}`);
  }
};

const seedTemplates = async () => {
  const defaultTemplates = [
    {
      name: "React App",
      framework: "React",
      buildCommand: "npm install && npm run build",
      startCommand: "nginx -g \"daemon off;\"",
      dockerTemplate: "static-nginx",
      defaultPort: 80,
    },
    {
      name: "Node API",
      framework: "Node.js",
      buildCommand: "npm install",
      startCommand: "npm start",
      dockerTemplate: "node-server",
      defaultPort: 3000,
    },
    {
      name: "MERN App",
      framework: "MERN",
      buildCommand: "npm install && npm run build",
      startCommand: "npm start",
      dockerTemplate: "node-server",
      defaultPort: 5000,
    },
    {
      name: "Next.js App",
      framework: "Next.js",
      buildCommand: "npm install && npm run build",
      startCommand: "npm start",
      dockerTemplate: "node-server",
      defaultPort: 3000,
    },
    {
      name: "Flask API",
      framework: "Flask",
      buildCommand: "pip install -r requirements.txt",
      startCommand: "python app.py",
      dockerTemplate: "python-flask",
      defaultPort: 5000,
    },
    {
      name: "FastAPI",
      framework: "FastAPI",
      buildCommand: "pip install -r requirements.txt",
      startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000",
      dockerTemplate: "python-fastapi",
      defaultPort: 8000,
    },
    {
      name: "Spring Boot",
      framework: "Spring Boot",
      buildCommand: "./gradlew build",
      startCommand: "java -jar build/libs/*.jar",
      dockerTemplate: "java-springboot",
      defaultPort: 8080,
    },
    {
      name: "Go Service",
      framework: "Go",
      buildCommand: "go build -o main .",
      startCommand: "./main",
      dockerTemplate: "go-binary",
      defaultPort: 8080,
    },
  ];

  try {
    const count = await Template.countDocuments();
    if (count === 0) {
      await Template.insertMany(defaultTemplates);
      logger.info("[DB Seed] Seeded default templates successfully.");
    }
  } catch (err) {
    logger.error(`[DB Seed] Failed to seed templates: ${err.message}`);
  }
};

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cicd_visualizer";
  try {
    const conn = await mongoose.connect(mongoURI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    await seedFrameworkProfiles();
    await seedTemplates();
  } catch (error) {
    logger.error(`MongoDB Initial Connection Error: ${error.message}. Process will continue and attempt reconnection.`);
  }
};

module.exports = connectDB;
