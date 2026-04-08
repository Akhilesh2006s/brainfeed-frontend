const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    content: { type: String, default: "" },
    // Optional visual fields used by specific pages like "About"
    heroImageUrl: { type: String, default: "" },
    heroImageAlt: { type: String, default: "" },
    aboutCovers: {
      main: { type: String, default: "" },
      high: { type: String, default: "" },
      primary2: { type: String, default: "" },
      primary1: { type: String, default: "" },
      junior: { type: String, default: "" },
    },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Page", default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// slug already has unique: true (creates index). Only add compound index for list order.
pageSchema.index({ parent: 1, order: 1 });

module.exports = mongoose.model("Page", pageSchema);
