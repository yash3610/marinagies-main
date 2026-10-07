require("dotenv").config();

const connectDB = require("../config/db");
const Vessel = require("../models/Vessel");
const { getDemoNavigation } = require("../services/demoFleetNavigation.service");

const vesselDefinitions = [
    {
        name: "MV Samudra",
        vesselId: "VSL-001",
        imoNumber: "9123456",
        vesselType: "CONTAINER",
        status: "ONLINE",
        riskScore: 18,
        riskLevel: "LOW",
        speed: 14.5,
        captain: "Rajesh Kumar",
        isActive: true,
    },

    {
        name: "MV Ocean Guardian",
        vesselId: "VSL-002",
        imoNumber: "9234567",
        vesselType: "TANKER",
        status: "ONLINE",
        riskScore: 42,
        riskLevel: "MEDIUM",
        speed: 11.2,
        captain: "Amit Sharma",
        isActive: true,
    },

    {
        name: "MV Arabian Star",
        vesselId: "VSL-003",
        imoNumber: "9345678",
        vesselType: "BULK_CARRIER",
        status: "WARNING",
        riskScore: 67,
        riskLevel: "HIGH",
        speed: 9.8,
        captain: "Vikram Singh",
        isActive: true,
    },

    {
        name: "MV Blue Horizon",
        vesselId: "VSL-004",
        imoNumber: "9456789",
        vesselType: "CARGO",
        status: "OFFLINE",
        riskScore: 76,
        riskLevel: "HIGH",
        speed: 0,
        captain: "Suresh Patil",
        isActive: true,
    },

    {
        name: "MV Neptune Shield",
        vesselId: "VSL-005",
        imoNumber: "9567890",
        vesselType: "CONTAINER",
        status: "CRITICAL",
        riskScore: 91,
        riskLevel: "CRITICAL",
        speed: 7.4,
        captain: "Arun Mehta",
        isActive: true,
    },
];

const vessels = vesselDefinitions.map((vessel) => ({
    ...vessel,
    ...getDemoNavigation(vessel.vesselId),
}));

const seedVessels = async () => {
    try {
        await connectDB();

        console.log("Connected to MongoDB");

        await Vessel.deleteMany({});

        console.log("Old vessels removed");

        const createdVessels = await Vessel.insertMany(vessels);

        console.log(
            `${createdVessels.length} vessels inserted successfully`
        );

        createdVessels.forEach((vessel) => {
            console.log(
                `✓ ${vessel.vesselId} - ${vessel.name} - ${vessel.status}`
            );
        });

        console.log("\nVessel seeding completed successfully.");

        process.exit(0);
    } catch (error) {
        console.error("Vessel seed error:", error);
        process.exit(1);
    }
};

seedVessels();
