const mongoose = require("mongoose");

const galleryItemSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true, enum: ["image", "youtube"] },
    imageUrl: { type: String, default: "" },
    /** YouTube video id for embed (kind === youtube) */
    youtubeVideoId: { type: String, default: "" },
    /** Original link pasted by admin */
    youtubeUrl: { type: String, default: "" },
    title: { type: String, default: "", trim: true },
    caption: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

galleryItemSchema.index({ order: 1, createdAt: -1 });
galleryItemSchema.index({ active: 1, order: 1 });

module.exports = mongoose.model("GalleryItem", galleryItemSchema);
