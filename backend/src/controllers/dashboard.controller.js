const Vessel = require("../models/Vessel");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");

const getDashboardStats = async (req, res) => {
    try {
        const vessels = await Vessel.find({ isActive: true });

        // Vessel statistics
        const totalVessels = vessels.length;

        const onlineVessels = vessels.filter(
            (vessel) => vessel.status === "ONLINE"
        ).length;

        const offlineVessels = vessels.filter(
            (vessel) => vessel.status === "OFFLINE"
        ).length;

        const warningVessels = vessels.filter(
            (vessel) => vessel.status === "WARNING"
        ).length;

        const criticalVessels = vessels.filter(
            (vessel) => vessel.status === "CRITICAL"
        ).length;

        // Risk statistics
        const lowRiskVessels = vessels.filter(
            (vessel) => vessel.riskLevel === "LOW"
        ).length;

        const mediumRiskVessels = vessels.filter(
            (vessel) => vessel.riskLevel === "MEDIUM"
        ).length;

        const highRiskVessels = vessels.filter(
            (vessel) => vessel.riskLevel === "HIGH"
        ).length;

        const criticalRiskVessels = vessels.filter(
            (vessel) => vessel.riskLevel === "CRITICAL"
        ).length;

        const totalRisk = vessels.reduce(
            (sum, vessel) => sum + vessel.riskScore,
            0
        );

        const averageRiskScore =
            totalVessels > 0
                ? Math.round(totalRisk / totalVessels)
                : 0;

        let overallRiskLevel = "LOW";

        if (averageRiskScore >= 75) {
            overallRiskLevel = "CRITICAL";
        } else if (averageRiskScore >= 50) {
            overallRiskLevel = "HIGH";
        } else if (averageRiskScore >= 25) {
            overallRiskLevel = "MEDIUM";
        }

        // Alert statistics
        const activeAlerts = await Alert.countDocuments({
            status: { $ne: "RESOLVED" },
        });

        const criticalAlerts = await Alert.countDocuments({
            severity: "CRITICAL",
            status: { $ne: "RESOLVED" },
        });

        // Incident statistics
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const incidentsToday = await Incident.countDocuments({
            detectedAt: {
                $gte: startOfToday,
            },
        });

        res.status(200).json({
            success: true,
            stats: {
                // Vessel statistics
                totalVessels,
                onlineVessels,
                offlineVessels,
                warningVessels,
                criticalVessels,

                // Risk statistics
                averageRiskScore,
                overallRiskLevel,

                lowRiskVessels,
                mediumRiskVessels,
                highRiskVessels,
                criticalRiskVessels,

                // Alert statistics
                activeAlerts,
                criticalAlerts,

                // Incident statistics
                incidentsToday,
            },
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
        });
    }
};

module.exports = {
    getDashboardStats,
};