const mongoose = require("mongoose");

const auditSequenceSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: "audit-log",
    },
    value: {
        type: Number,
        default: 0,
        min: 0,
    },
});

module.exports = mongoose.model("AuditSequence", auditSequenceSchema);
