const mongoose = require("mongoose");

const connectivityStateSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, default: "PLATFORM" },
    mode: {
        type: String,
        enum: ["CONNECTED", "LIMITED", "MINIMAL", "OFFLINE"],
        default: "CONNECTED",
        index: true,
    },
    reason: { type: String, trim: true, maxlength: 300, default: "Normal satellite connectivity" },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lastSuccessfulSyncAt: { type: Date, default: null },
    lastSyncError: { type: String, maxlength: 500, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("ConnectivityState", connectivityStateSchema);
