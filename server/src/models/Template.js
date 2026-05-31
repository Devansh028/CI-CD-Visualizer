const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      unique: true,
      trim: true,
    },
    framework: {
      type: String,
      required: [true, "Framework is required"],
      trim: true,
    },
    buildCommand: {
      type: String,
      default: "",
    },
    startCommand: {
      type: String,
      default: "",
    },
    dockerTemplate: {
      type: String,
      required: [true, "Docker template strategy is required"],
      trim: true,
    },
    defaultPort: {
      type: Number,
      required: [true, "Default port is required"],
      min: [1, "Port must be greater than 0"],
      max: [65535, "Port must be less than 65536"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Template", templateSchema);
