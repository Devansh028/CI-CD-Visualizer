const mongoose = require("mongoose");

const environmentVariableSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    key: {
      type: String,
      required: [true, "Environment key is required"],
      trim: true,
      uppercase: true,
      match: [/^[A-Z_][A-Z0-9_]*$/, "Please fill a valid environment variable key name (alphanumeric and underscores, cannot start with a digit)"],
    },
    value: {
      type: String,
      default: "",
    },
    encryptedValue: {
      type: String,
      default: null,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Enforce compound uniqueness: unique key per project
environmentVariableSchema.index({ projectId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("EnvironmentVariable", environmentVariableSchema);
