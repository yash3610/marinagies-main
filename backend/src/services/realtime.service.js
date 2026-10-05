const vesselRoom = (vesselId) => `vessel:${String(vesselId)}`;

const queueRealtimeForShore = async (eventName, payload, vesselId) => {
    const { shouldQueueForShore, queueOfflineEvent } = require("./connectivity.service");
    if (!await shouldQueueForShore()) return;
    const plain = payload?.toObject ? payload.toObject() : payload;
    const id = plain?._id || plain?.alertId || plain?.incidentId || plain?.eventId || plain?.commandId;
    const isAlert = eventName === "alert:new";
    const isIncident = eventName === "incident:new";
    const suppliedSeverity = String(plain?.severity || "").toUpperCase();
    const severity = suppliedSeverity === "URGENT" ? "CRITICAL"
        : ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(suppliedSeverity) ? suppliedSeverity
            : isIncident ? "HIGH" : "MEDIUM";
    await queueOfflineEvent({
        eventKey: `${eventName}:${id || Date.now()}`,
        eventType: isAlert ? "ALERT" : isIncident ? "INCIDENT" : "SYSTEM",
        severity,
        vessel: vesselId || plain?.vessel || null,
        sourceRef: id ? String(id) : eventName,
        payload: { eventName, data: plain },
    });
};

const emitVesselEvent = (io, eventName, payload, vesselId) => {
    queueRealtimeForShore(eventName, payload, vesselId).catch((error) => {
        console.error("Offline realtime queue error:", error.message);
    });
    if (!io) return;
    const emitter = io.to("fleet:all");
    if (vesselId) emitter.to(vesselRoom(vesselId));
    emitter.emit(eventName, payload);
};

const emitTelemetry = (io, records) => {
    if (!io) return;
    const timestamp = new Date().toISOString();
    io.to("fleet:all").emit("telemetry:update", {
        success: true,
        data: records,
        timestamp,
    });

    records.forEach((record) => {
        const vesselId = record.vessel?._id || record.vessel;
        if (!vesselId) return;
        io.to(vesselRoom(vesselId)).emit("telemetry:update", {
            success: true,
            data: [record],
            timestamp,
        });
    });
};

module.exports = { vesselRoom, emitVesselEvent, emitTelemetry, queueRealtimeForShore };
