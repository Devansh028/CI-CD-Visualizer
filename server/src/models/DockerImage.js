const mongoose = require("mongoose");

const dockerImageSchema = new mongoose.Schema(
  {
    imageName: {
      type: String,
      required: [true, "Image name is required"],
      trim: true,
    },
    tag: {
      type: String,
      required: [true, "Image tag is required"],
      trim: true,
    },
    imageId: {
      type: String,
      required: [true, "Docker image ID is required"],
      trim: true,
    },
    size: {
      type: Number, // in bytes
      required: [true, "Docker image size is required"],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    projectName: {
      type: String,
      trim: true,
    },
    dockerImageId: {
      type: String,
      trim: true,
    },
    imageSize: {
      type: Number,
    },
    deploymentVersion: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to automatically resolve and populate metadata fields if missing
dockerImageSchema.pre("save", async function () {
  if (!this.dockerImageId) {
    this.dockerImageId = this.imageId;
  }
  if (!this.imageSize) {
    this.imageSize = this.size;
  }
  
  if (!this.projectName) {
    try {
      const Project = mongoose.model("Project");
      const proj = await Project.findById(this.projectId);
      if (proj) {
        this.projectName = proj.name;
      }
    } catch (err) {
      // ignore
    }
  }

  if (!this.deploymentVersion) {
    try {
      const Deployment = mongoose.model("Deployment");
      const dep = await Deployment.findOne({ projectId: this.projectId, status: "success" }).sort({ createdAt: -1 });
      if (dep) {
        this.deploymentVersion = dep.deploymentVersion;
      } else {
        this.deploymentVersion = this.tag || "v1";
      }
    } catch (err) {
      this.deploymentVersion = "v1";
    }
  }
});

module.exports = mongoose.model("DockerImage", dockerImageSchema);
