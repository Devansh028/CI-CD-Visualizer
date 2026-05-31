const mongoose = require("mongoose");

const k8sClusterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Cluster name is required"],
      trim: true,
      unique: true
    },
    type: {
      type: String,
      required: [true, "Cluster type is required"],
      enum: ["local", "minikube", "kind", "k3s", "managed"],
      default: "minikube"
    },
    apiEndpoint: {
      type: String,
      required: [true, "API Endpoint URL is required"],
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "inactive", "error"],
      default: "active"
    },
    namespaces: {
      type: [String],
      default: ["default", "kube-system", "kube-public", "kube-node-lease"]
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

module.exports = mongoose.model("K8sCluster", k8sClusterSchema);
