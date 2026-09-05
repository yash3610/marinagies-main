require("dotenv").config();

const connectDB = require("../config/db");
const Vessel = require("../models/Vessel");

const vessels = [
    {
        name: "MV Samudra",
        vesselId: "VSL-001",
        imoNumber: "9123456",
        vesselType: "CONTAINER",
        status: "ONLINE",
        riskScore: 18,
        riskLevel: "LOW",
        latitude: 18.9400,
        longitude: 72.8350,
        speed: 14.5,
        heading: 285,
        destination: "Dubai",
        route: {
            origin: "Mumbai",
            destination: "Dubai",
        },
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
        latitude: 19.0760,
        longitude: 72.8777,
        speed: 11.2,
        heading: 270,
        destination: "Jebel Ali",
        route: {
            origin: "Mumbai",
            destination: "Jebel Ali",
        },
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
        latitude: 20.5937,
        longitude: 72.8777,
        speed: 9.8,
        heading: 255,
        destination: "Muscat",
        route: {
            origin: "Mumbai",
            destination: "Muscat",
        },
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
        latitude: 21.0000,
        longitude: 70.0000,
        speed: 0,
        heading: 180,
        destination: "Colombo",
        route: {
            origin: "Mundra",
            destination: "Colombo",
        },
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
        latitude: 22.5000,
        longitude: 68.9000,
        speed: 7.4,
        heading: 310,
        destination: "Singapore",
        route: {
            origin: "Mundra",
            destination: "Singapore",
        },
        captain: "Arun Mehta",
        isActive: true,
    },
];

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