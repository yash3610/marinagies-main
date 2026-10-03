const mongoose = require("mongoose");
const NetworkEvent = require("../models/NetworkEvent");
const NetworkPolicy = require("../models/NetworkPolicy");
const ThreatIndicator = require("../models/ThreatIndicator");
const Vessel = require("../models/Vessel");
const { vesselScope, canAccessVessel } = require("../utils/dataScope");
const { emitVesselEvent } = require("../services/realtime.service");
const { normalizeDomain, isValidDomain, getOrCreatePolicy, processNetworkEvent } = require("../services/netGuard.service");

const getNetworkOverview = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 200, 1), 500);
        const filter = { ...vesselScope(req) };
        if (req.query.vessel) {
            if (!mongoose.isValidObjectId(req.query.vessel) || !canAccessVessel(req, req.query.vessel)) {
                return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
            }
            filter.vessel = req.query.vessel;
        }
        const [events, policies, total, blocked, sinkholed, indicators] = await Promise.all([
            NetworkEvent.find(filter).populate("vessel", "name vesselId").sort({ timestamp: -1 }).limit(limit).lean(),
            NetworkPolicy.find(filter).populate("vessel", "name vesselId").sort({ updatedAt: -1 }).lean(),
            NetworkEvent.countDocuments(filter),
            NetworkEvent.countDocuments({ ...filter, verdict: "BLOCKED" }),
            NetworkEvent.countDocuments({ ...filter, verdict: "SINKHOLED" }),
            ThreatIndicator.find({ indicatorType: "DOMAIN", active: true }).sort({ lastSeenAt: -1 }).limit(200).lean(),
        ]);
        res.status(200).json({
            success: true, events, policies, indicators,
            stats: { total, blocked, sinkholed, allowed: Math.max(0, total - blocked - sinkholed) },
        });
    } catch (error) {
        console.error("Get NetGuard overview error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch NetGuard data" });
    }
};

const ingestNetworkEvent = async (req, res) => {
    try {
        if (!canAccessVessel(req, req.body?.vessel)) {
            return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        }
        const result = await processNetworkEvent(req.body, req.app.get("io"));
        res.status(result.duplicate ? 200 : 201).json({
            success: true,
            message: result.event.verdict === "SINKHOLED" ? `DNS request redirected to ${result.event.sinkholeIp}` : `Network request ${result.event.verdict.toLowerCase()}`,
            ...result,
        });
    } catch (error) {
        res.status(error.status || 400).json({ success: false, message: error.message || "Failed to process network event" });
    }
};

const updateDomainPolicy = async (req, res, mode) => {
    const vesselId = req.body?.vessel;
    if (!mongoose.isValidObjectId(vesselId) || !canAccessVessel(req, vesselId)) {
        return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
    }
    const domain = normalizeDomain(req.body.domain);
    if (!isValidDomain(domain)) return res.status(400).json({ success: false, message: "A valid domain is required" });
    const reason = String(req.body.reason || (mode === "WHITELIST" ? "Operator-confirmed false positive" : "Operator block rule")).trim();
    const policy = await getOrCreatePolicy(vesselId);
    if (mode === "WHITELIST") {
        policy.dns.localBlocklist = policy.dns.localBlocklist.filter((item) => item !== domain);
        if (!policy.dns.whitelist.includes(domain)) policy.dns.whitelist.push(domain);
        await ThreatIndicator.findOneAndUpdate(
            { indicatorType: "DOMAIN", value: domain },
            { $set: { verdict: "TRUSTED", confidence: 100, reason, source: "OPERATOR", active: true, fleetWide: false, createdBy: req.user.userId, lastSeenAt: new Date() }, $setOnInsert: { firstSeenAt: new Date() } },
            { upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
    } else {
        policy.dns.whitelist = policy.dns.whitelist.filter((item) => item !== domain);
        if (!policy.dns.localBlocklist.includes(domain)) policy.dns.localBlocklist.push(domain);
        await ThreatIndicator.findOneAndUpdate(
            { indicatorType: "DOMAIN", value: domain },
            { $set: { verdict: "MALICIOUS", confidence: 100, reason, source: "LOCAL_POLICY", active: true, fleetWide: true, createdBy: req.user.userId, lastSeenAt: new Date() }, $setOnInsert: { firstSeenAt: new Date() } },
            { upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
    }
    policy.policyVersion += 1;
    await policy.save();
    res.locals.auditVesselId = vesselId;
    res.locals.auditResourceId = String(policy._id);
    emitVesselEvent(req.app.get("io"), "netguard:policy", policy, vesselId);
    return res.status(200).json({ success: true, message: `${domain} ${mode === "WHITELIST" ? "whitelisted" : "blocked"}`, policy });
};

const blockDomain = (req, res) => updateDomainPolicy(req, res, "BLOCK").catch((error) => res.status(400).json({ success: false, message: error.message }));
const whitelistDomain = (req, res) => updateDomainPolicy(req, res, "WHITELIST").catch((error) => res.status(400).json({ success: false, message: error.message }));

const updateSegmentation = async (req, res) => {
    try {
        const vesselId = req.params.vesselId;
        if (!mongoose.isValidObjectId(vesselId) || !canAccessVessel(req, vesselId)) {
            return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        }
        if (!Array.isArray(req.body.rules) || !req.body.rules.length || req.body.rules.length > 50) {
            return res.status(400).json({ success: false, message: "Between 1 and 50 segmentation rules are required" });
        }
        const policy = await getOrCreatePolicy(vesselId);
        policy.segmentationRules = req.body.rules;
        policy.policyVersion += 1;
        await policy.save();
        res.locals.auditVesselId = vesselId;
        res.locals.auditResourceId = String(policy._id);
        emitVesselEvent(req.app.get("io"), "netguard:policy", policy, vesselId);
        res.status(200).json({ success: true, message: "Segmentation policy updated", policy });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Failed to update segmentation policy" });
    }
};

const failoverSatellite = async (req, res) => {
    try {
        const vesselId = req.params.vesselId;
        if (!mongoose.isValidObjectId(vesselId) || !canAccessVessel(req, vesselId)) {
            return res.status(403).json({ success: false, message: "You do not have access to this vessel" });
        }
        const vessel = await Vessel.findById(vesselId).select("name vesselId");
        if (!vessel) return res.status(404).json({ success: false, message: "Vessel not found" });
        const policy = await getOrCreatePolicy(vesselId);
        const previousProvider = policy.satellite.activeProvider;
        policy.satellite.activeProvider = previousProvider === policy.satellite.primaryProvider
            ? policy.satellite.backupProvider : policy.satellite.primaryProvider;
        policy.satellite.primaryHealthy = policy.satellite.activeProvider === policy.satellite.primaryProvider;
        policy.satellite.lastSwitchedAt = new Date();
        await policy.save();
        const event = await NetworkEvent.create({
            eventId: `satellite:${vesselId}:${Date.now()}`, vessel: vesselId, eventType: "SATELLITE_LINK_CHANGE",
            sourceDevice: "NETGUARD-SD-WAN", sourceSegment: "MARINEAEGIS", protocol: "SYSTEM",
            satelliteProvider: policy.satellite.activeProvider, verdict: "ALLOWED",
            reason: `Policy version ${policy.policyVersion} reapplied after link change from ${previousProvider} to ${policy.satellite.activeProvider}.`,
            confidence: 100, riskScore: 0, simulated: Boolean(req.body.simulated),
        });
        res.locals.auditVesselId = vesselId;
        res.locals.auditResourceId = String(policy._id);
        emitVesselEvent(req.app.get("io"), "netguard:policy", policy, vesselId);
        emitVesselEvent(req.app.get("io"), "netguard:event", { ...event.toObject(), vessel }, vesselId);
        res.status(200).json({ success: true, message: "Satellite link changed; the same NetGuard policy remains active", policy, event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Satellite failover failed" });
    }
};

const syncThreatFeed = async (req, res) => {
    try {
        const indicators = Array.isArray(req.body.indicators) ? req.body.indicators : [];
        if (!indicators.length || indicators.length > 500) return res.status(400).json({ success: false, message: "A feed must contain 1 to 500 indicators" });
        let synced = 0;
        for (const item of indicators) {
            const value = normalizeDomain(item.value);
            if (!isValidDomain(value)) continue;
            await ThreatIndicator.findOneAndUpdate(
                { indicatorType: "DOMAIN", value },
                { $set: { verdict: item.verdict || "MALICIOUS", confidence: Number(item.confidence) || 90, reason: item.reason || "Shore threat feed", source: "SHORE_FEED", active: true, fleetWide: true, lastSeenAt: new Date() }, $setOnInsert: { firstSeenAt: new Date() } },
                { upsert: true, runValidators: true, setDefaultsOnInsert: true }
            );
            synced += 1;
        }
        await NetworkPolicy.updateMany(vesselScope(req), { $set: { lastShoreSyncAt: new Date() } });
        res.status(200).json({ success: true, message: `${synced} threat indicators synchronized`, synced });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "Threat-feed sync failed" });
    }
};

module.exports = { getNetworkOverview, ingestNetworkEvent, blockDomain, whitelistDomain, updateSegmentation, failoverSatellite, syncThreatFeed };
