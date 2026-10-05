require("dotenv").config();
const mongoose = require("mongoose");
const Alert = require("../models/Alert");
const { ensureExplanation } = require("../services/explanation.service");

const run = async () => {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
    await mongoose.connect(process.env.MONGO_URI);
    const alerts = await Alert.find().select("module type confidence message source evidence explanation").lean();
    if (!alerts.length) {
        console.log("No alerts found; nothing to backfill.");
        return;
    }
    const result = await Alert.bulkWrite(alerts.map((alert) => ({
        updateOne: {
            filter: { _id: alert._id },
            update: { $set: { explanation: ensureExplanation(alert) } },
        },
    })));
    console.log(`Explain Why backfill complete: ${result.modifiedCount} of ${alerts.length} alert(s) updated.`);
};

run()
    .catch((error) => {
        console.error("Explain Why backfill failed:", error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
