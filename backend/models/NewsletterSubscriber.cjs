const mongoose = require("mongoose");

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    /** e.g. homepage, footer — optional */
    source: { type: String, default: "homepage", trim: true, maxlength: 64 },
  },
  { timestamps: true }
);

newsletterSubscriberSchema.index({ createdAt: -1 });

module.exports = mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
