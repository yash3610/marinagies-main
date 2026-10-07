const { planMarineRoute } = require("./marineRoute.service");

// Stable, water-only demo positions for the original seeded fleet. Keeping this
// in one place prevents vessel metadata and seeded telemetry from drifting apart.
const DEMO_NAVIGATION = Object.freeze({
    "VSL-001": { originPort: "MUMBAI", destinationPort: "DUBAI", latitude: 18.7, longitude: 71.5, heading: 280 },
    "VSL-002": { originPort: "MUMBAI", destinationPort: "DUBAI", latitude: 19.5, longitude: 68, heading: 270 },
    "VSL-003": { originPort: "MUMBAI", destinationPort: "MUSCAT", latitude: 20.5, longitude: 64, heading: 285 },
    "VSL-004": { originPort: "KARACHI", destinationPort: "COLOMBO", latitude: 17.2, longitude: 69.7, heading: 155 },
    "VSL-005": { originPort: "KOCHI", destinationPort: "MUSCAT", latitude: 22, longitude: 60.5, heading: 300 },
});

const getDemoNavigation = (vesselId) => {
    const navigation = DEMO_NAVIGATION[vesselId];
    if (!navigation) return null;
    const plan = planMarineRoute(navigation.originPort, navigation.destinationPort);
    return {
        ...navigation,
        destination: plan.destination.name,
        route: {
            originPort: navigation.originPort,
            destinationPort: navigation.destinationPort,
            origin: plan.origin.name,
            destination: plan.destination.name,
            destinationLatitude: plan.destination.latitude,
            destinationLongitude: plan.destination.longitude,
            waypoints: plan.waypoints,
            distanceNm: plan.distanceNm,
            planner: plan.planner,
        },
    };
};

module.exports = { DEMO_NAVIGATION, getDemoNavigation };
