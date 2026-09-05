require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../models/User");

const seedUsers = async () => {
    try {
        await connectDB();

        console.log("Creating MarineAegis demo users...");

        const password = "Marine@123";

        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        const users = [
            {
                name: "System Administrator",
                email: "admin@marineaegis.com",
                password: hashedPassword,
                role: "ADMIN",
                active: true,
            },

            {
                name: "Shore Security Analyst",
                email: "analyst@marineaegis.com",
                password: hashedPassword,
                role: "SHORE_SECURITY_ANALYST",
                active: true,
            },

            {
                name: "Bridge Officer",
                email: "officer@marineaegis.com",
                password: hashedPassword,
                role: "BRIDGE_OFFICER",
                active: true,
            },
        ];

        await User.deleteMany({});

        await User.insertMany(users);

        console.log("");
        console.log("========================================");
        console.log("      MARINEAEGIS USERS CREATED");
        console.log("========================================");
        console.log("");
        console.log("ADMIN");
        console.log("Email: admin@marineaegis.com");
        console.log("");
        console.log("ANALYST");
        console.log("Email: analyst@marineaegis.com");
        console.log("");
        console.log("BRIDGE OFFICER");
        console.log("Email: officer@marineaegis.com");
        console.log("");
        console.log("Password: Marine@123");
        console.log("");
        console.log("========================================");

        process.exit(0);
    } catch (error) {
        console.error("Seed failed:");
        console.error(error);

        process.exit(1);
    }
};

seedUsers();