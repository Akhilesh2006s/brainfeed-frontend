const mongoose = require("mongoose");

const flipbookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    /** Cloudinary (or any HTTPS) URL to the PDF file */
    pdfUrl: { type: String, default: "" },
    /** Magazine issue month (store as first day of month). Used for E-magazines listing. */
    issueDate: { type: Date, default: null },
    /** Whether this flipbook is publicly visible at all (used by /flipbooks and flipbook view). */
    published: { type: Boolean, default: true },
    /** If false, keep flipbook accessible by slug but hide it from the /e-magazines list. */
    showOnEmagazines: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flipbook", flipbookSchema);
