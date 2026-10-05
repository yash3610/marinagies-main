const crypto = require("node:crypto");
const AuditLog = require("../models/AuditLog");
const AuditSequence = require("../models/AuditSequence");

const canonicalize = (value) => {
    if (value === null || value === undefined) return value ?? null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(canonicalize);
    if (typeof value === "object") {
        return Object.keys(value)
            .sort()
            .reduce((result, key) => {
                result[key] = canonicalize(value[key]);
                return result;
            }, {});
    }
    return value;
};

const calculateEntryHash = (entry) =>
    crypto
        .createHash("sha256")
        .update(JSON.stringify(canonicalize(entry)))
        .digest("hex");

let writeQueue = Promise.resolve();

const persistAuditLog = async (data) => {
    const currentSequence = await AuditSequence.findById("audit-log").lean();
    if (!currentSequence) {
        const legacyEntries = await AuditLog.countDocuments({
            sequenceNumber: { $exists: false },
        });
        if (legacyEntries > 0) {
            throw new Error(
                "Legacy audit records must be migrated with npm run migrate:audit-logs"
            );
        }
    }

    const sequence = await AuditSequence.findOneAndUpdate(
        { _id: "audit-log" },
        { $inc: { value: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    const sequenceNumber = sequence.value;
    const previous = sequenceNumber > 1
        ? await AuditLog.findOne({ sequenceNumber: sequenceNumber - 1 })
            .select("entryHash")
            .lean()
        : null;
    const previousHash = previous?.entryHash || "GENESIS";
    const createdAt = new Date();
    const hashPayload = {
        sequenceNumber,
        createdAt,
        user: data.user ? String(data.user) : null,
        actorRole: data.actorRole || null,
        vessel: data.vessel ? String(data.vessel) : null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        description: data.description || "",
        status: data.status || "SUCCESS",
        metadata: data.metadata || {},
        previousHash,
    };

    const auditLog = await AuditLog.create({
        ...data,
        ...hashPayload,
        entryHash: calculateEntryHash(hashPayload),
        createdAt,
        updatedAt: createdAt,
    });
    const { shouldQueueForShore, queueOfflineEvent } = require("./connectivity.service");
    if (await shouldQueueForShore()) {
        await queueOfflineEvent({
            eventKey: `audit:${auditLog._id}`,
            eventType: "AUDIT",
            severity: data.status === "FAILED" ? "HIGH" : "LOW",
            vessel: data.vessel || null,
            sourceRef: String(auditLog._id),
            payload: {
                sequenceNumber: auditLog.sequenceNumber,
                action: auditLog.action,
                resource: auditLog.resource,
                status: auditLog.status,
                entryHash: auditLog.entryHash,
                createdAt: auditLog.createdAt,
            },
        });
    }
    return auditLog;
};

const writeAuditLog = (data) => {
    const pending = writeQueue.then(() => persistAuditLog(data));
    writeQueue = pending.catch(() => undefined);
    return pending;
};

const verifyAuditChain = async () => {
    const entries = await AuditLog.find().sort({ sequenceNumber: 1 }).lean();
    let expectedPreviousHash = "GENESIS";
    let expectedSequence = 1;

    for (const entry of entries) {
        const hashPayload = {
            sequenceNumber: entry.sequenceNumber,
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
            previousHash: entry.previousHash,
        };
        const calculatedHash = calculateEntryHash(hashPayload);
        if (
            entry.sequenceNumber !== expectedSequence ||
            entry.previousHash !== expectedPreviousHash ||
            entry.entryHash !== calculatedHash
        ) {
            return {
                valid: false,
                checkedEntries: expectedSequence - 1,
                failedSequence: entry.sequenceNumber,
            };
        }
        expectedSequence += 1;
        expectedPreviousHash = entry.entryHash;
    }

    return { valid: true, checkedEntries: entries.length, failedSequence: null };
};

module.exports = {
    calculateEntryHash,
    writeAuditLog,
    verifyAuditChain,
};
