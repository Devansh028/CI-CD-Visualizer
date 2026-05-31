const mongoose = require("mongoose");

const registryRepositorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Repository name is required"],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      default: ""
    },
    pullCount: {
      type: Number,
      default: 0
    },
    storageBytes: {
      type: Number,
      default: 0
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("RegistryRepository", registryRepositorySchema);
