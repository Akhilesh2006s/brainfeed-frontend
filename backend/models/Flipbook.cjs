const mongoose = require("mongoose");

const flipbookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    /** Cloudinary (or any HTTPS) URL to the PDF file */
    pdfUrl: { type: String, default: "" },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flipbook", flipbookSchema);
