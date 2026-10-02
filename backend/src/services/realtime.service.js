const vesselRoom = (vesselId) => `vessel:${String(vesselId)}`;

const emitVesselEvent = (io, eventName, payload, vesselId) => {
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

module.exports = { vesselRoom, emitVesselEvent, emitTelemetry };
