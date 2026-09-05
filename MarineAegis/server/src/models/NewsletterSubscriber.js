import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true }
  },
  { timestamps: true }
);

export default mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
