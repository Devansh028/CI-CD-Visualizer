const mongoose = require("mongoose");

const registryImageSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegistryRepository",
      required: true
    },
    tag: {
      type: String,
      required: true,
      trim: true
    },
    digest: {
      type: String,
      required: true,
      trim: true
    },
    sizeBytes: {
      type: Number,
      required: true
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Unique constraint: tag per repository
registryImageSchema.index({ repositoryId: 1, tag: 1 }, { unique: true });

module.exports = mongoose.model("RegistryImage", registryImageSchema);
