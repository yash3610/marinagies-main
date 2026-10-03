const mongoose = require("mongoose");

const autonomousAttackPatternSchema = new mongoose.Schema({
    signature: { type: String, required: true, unique: true, trim: true },
    stageSequence: [{ type: String, required: true }],
    eventKinds: [{ type: String, required: true }],
    mitreTechniqueIds: [{ type: String, required: true }],
    confidence: { type: Number, min: 0, max: 100, required: true },
    occurrences: { type: Number, min: 0, default: 0 },
    sourceSequence: { type: mongoose.Schema.Types.ObjectId, ref: "AttackSequence", required: true },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sharedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("AutonomousAttackPattern", autonomousAttackPatternSchema);
