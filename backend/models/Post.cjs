const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["news", "blog"] },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    content: { type: String, default: "" },
    format: {
      type: String,
      enum: ["standard", "gallery", "video", "audio", "link", "quote"],
      default: "standard",
    },
    featuredImageUrl: { type: String, default: "" },
    media: {
      gallery: [{ type: String }],
      videoUrl: { type: String },
      audioUrl: { type: String },
      linkUrl: { type: String },
      quoteText: { type: String },
    },
    category: { type: String, required: true, trim: true },
    featuredImageAlt: { type: String, trim: true, default: "" },
    excerpt: { type: String, trim: true, default: "" },
    readTime: { type: String, trim: true, default: "4 min read" },
    metaTitle: { type: String, trim: true, default: "" },
    metaDescription: { type: String, trim: true, default: "" },
    /** SEO / topic tags (like WordPress tags) — stored as trimmed strings, max length enforced in API */
    tags: { type: [String], default: [] },
    focusKeyphrase: { type: String, trim: true, default: "" },
    publishedBy: {
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      role: { type: String, trim: true, default: "" },
    },
    lastEditedBy: {
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      role: { type: String, trim: true, default: "" },
    },
    views: { type: Number, default: 0 },
    /** `draft` = admin-only until published */
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
  },
  { timestamps: true }
);

postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ type: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("Post", postSchema);
