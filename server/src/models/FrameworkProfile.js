const mongoose = require("mongoose");

const frameworkProfileSchema = new mongoose.Schema(
  {
    framework: {
      type: String,
      required: [true, "Framework name is required"],
      unique: true,
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
    dockerStrategy: {
      type: String,
      required: [true, "Docker strategy is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FrameworkProfile", frameworkProfileSchema);
