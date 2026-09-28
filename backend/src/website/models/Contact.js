const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["new", "read", "resolved"],
      default: "new"
    },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending"
    },
    emailedAt: { type: Date, default: null },
    emailError: { type: String, select: false, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
