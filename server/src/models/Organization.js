const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Organization slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", organizationSchema);
