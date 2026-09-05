import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    service: { type: String, trim: true },
    preferredDate: { type: Date },
    message: { type: String, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new"
    }
  },
  { timestamps: true }
);

export default mongoose.model("ServiceRequest", serviceRequestSchema);
