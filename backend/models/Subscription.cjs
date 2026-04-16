const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "" }, // website, event, etc.
    planName: { type: String, trim: true, required: true },
    planType: { type: String, trim: true, default: "" }, // e.g. Pre Primary Pack, Classroom Pack
    notes: { type: String, trim: true, default: "" },
    deliveryAddress: {
      address: { type: String, trim: true, default: "" },
      pin: { type: String, trim: true, default: "" },
      mobile: { type: String, trim: true, default: "" },
      landline: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      institution: { type: String, trim: true, default: "" },
    },
    items: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
      },
    ],
    currency: { type: String, default: "INR" },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "active", "delivered", "cancelled"],
      default: "pending",
    },
    deliveryStatus: { type: String, trim: true, default: "" },
    deliveryExpectedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

subscriptionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);

