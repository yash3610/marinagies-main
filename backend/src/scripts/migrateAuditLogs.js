require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const AuditLog = require("../models/AuditLog");
const AuditSequence = require("../models/AuditSequence");
const { calculateEntryHash } = require("../services/audit.service");

const migrateAuditLogs = async () => {
    await connectDB();

    const entries = await AuditLog.find()
        .sort({ createdAt: 1, _id: 1 })
        .lean();
    let previousHash = "GENESIS";
    const operations = entries.map((entry, index) => {
        const sequenceNumber = index + 1;
        const hashPayload = {
            sequenceNumber,
            createdAt: entry.createdAt,
            user: entry.user ? String(entry.user) : null,
            actorRole: entry.actorRole || null,
            vessel: entry.vessel ? String(entry.vessel) : null,
            action: entry.action,
            resource: entry.resource,
            resourceId: entry.resourceId || null,
            description: entry.description || "",
            status: entry.status || "SUCCESS",
            metadata: entry.metadata || {},
            previousHash,
        };
        const entryHash = calculateEntryHash(hashPayload);
        previousHash = entryHash;
        return {
            updateOne: {
                filter: { _id: entry._id },
                update: {
                    $set: {
                        sequenceNumber,
                        previousHash: hashPayload.previousHash,
                        entryHash,
                    },
                },
            },
        };
    });

    if (operations.length) {
        // Deliberately use the native collection during this one-time migration;
        // normal model-level updates remain blocked by the immutability hooks.
        await AuditLog.collection.bulkWrite(operations, { ordered: true });
    }
    await AuditSequence.collection.updateOne(
        { _id: "audit-log" },
        { $set: { value: entries.length } },
        { upsert: true }
    );

    console.log(`Migrated ${entries.length} audit log entries.`);
    await mongoose.disconnect();
};

migrateAuditLogs().catch(async (error) => {
    console.error("Audit log migration failed:", error.message);
    await mongoose.disconnect().catch(() => undefined);
    process.exitCode = 1;
});
