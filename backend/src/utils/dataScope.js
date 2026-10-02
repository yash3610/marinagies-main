const getAccessibleVesselIds = (req) =>
    req.user?.allVessels ? null : (req.user?.vesselAccess || []).map(String);

const vesselScope = (req, field = "vessel") => {
    const ids = getAccessibleVesselIds(req);
    return ids === null ? {} : { [field]: { $in: ids } };
};

const canAccessVessel = (req, vesselId) => {
    if (req.user?.allVessels) return true;
    return (req.user?.vesselAccess || []).map(String).includes(String(vesselId));
};

module.exports = { getAccessibleVesselIds, vesselScope, canAccessVessel };
