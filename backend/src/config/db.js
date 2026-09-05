const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error("MONGO_URI is not defined in .env file");
        }

        const connection = await mongoose.connect(mongoURI);

        console.log(
            `MongoDB connected: ${connection.connection.host}`
        );
    } catch (error) {
        console.error("MongoDB connection failed:");
        console.error(error.message);

        process.exit(1);
    }
};

module.exports = connectDB;