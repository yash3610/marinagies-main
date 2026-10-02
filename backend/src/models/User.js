const mongoose = require("mongoose");
const { ROLES } = require("../utils/accessControl");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            maxlength: 254,
            lowercase: true,
            trim: true,
        },

        passwordHash: { type: String, select: false },

        password: {
            type: String,
            required: function () { return !this.passwordHash; },
            minlength: 10,
            select: false,
        },

        role: {
            type: String,
            default: "BRIDGE_OFFICER",
            required: true,
            enum: Object.values(ROLES),
        },

        vesselAccess: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vessel",
        }],

        fleetAccess: [{
            type: String,
            trim: true,
        }],

        allVessels: {
            type: Boolean,
            default: false,
        },

        mfa: {
            enabled: { type: Boolean, default: false },
            secret: { type: String, select: false, default: null },
            verifiedAt: { type: Date, default: null },
        },

        failedLoginAttempts: {
            type: Number,
            default: 0,
            min: 0,
        },

        lockedUntil: {
            type: Date,
            default: null,
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },

        active: {
            type: Boolean,
            default: true,
        },

        refreshTokenHash: {
            type: String,
            select: false,
            default: null,
        },

        refreshTokenExpiresAt: {
            type: Date,
            select: false,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.index({ role: 1, active: 1 });
userSchema.index({ vesselAccess: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
