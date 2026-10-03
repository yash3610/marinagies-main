const mongoose = require("mongoose");

const operatorCommandBaselineSchema = new mongoose.Schema({
    operator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    totalCommands: { type: Number, min: 0, default: 0 },
    commandTypeCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    hourCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    averageRisk: { type: Number, min: 0, max: 1, default: 0 },
    blockedCommands: { type: Number, min: 0, default: 0 },
    lastCommandAt: { type: Date, default: null },
    lastCommandType: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("OperatorCommandBaseline", operatorCommandBaselineSchema);
