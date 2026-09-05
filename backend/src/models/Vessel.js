const mongoose = require("mongoose");

const vesselSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        vesselId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        imoNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        vesselType: {
            type: String,
            enum: [
                "CONTAINER",
                "TANKER",
                "CARGO",
                "BULK_CARRIER",
                "PASSENGER",
                "OTHER",
            ],
            default: "CARGO",
        },

        status: {
            type: String,
            enum: ["ONLINE", "OFFLINE", "WARNING", "CRITICAL"],
            default: "OFFLINE",
        },

        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        riskLevel: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "LOW",
        },

        latitude: {
            type: Number,
            default: 0,
        },

        longitude: {
            type: Number,
            default: 0,
        },

        speed: {
            type: Number,
            default: 0,
        },

        heading: {
            type: Number,
            min: 0,
            max: 360,
            default: 0,
        },

        destination: {
            type: String,
            trim: true,
            default: "",
        },

        route: {
            origin: {
                type: String,
                default: "",
            },
            destination: {
                type: String,
                default: "",
            },
        },

        captain: {
            type: String,
            default: "",
        },

        lastSeen: {
            type: Date,
            default: Date.now,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

vesselSchema.index({ vesselId: 1 });
vesselSchema.index({ status: 1 });
vesselSchema.index({ riskLevel: 1 });

const Vessel = mongoose.model("Vessel", vesselSchema);

module.exports = Vessel;