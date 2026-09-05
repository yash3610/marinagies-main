const mongoose = require("mongoose");

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
            enum: [
                "ADMIN",
                "SHORE_SECURITY_ANALYST",
                "BRIDGE_OFFICER",
            ],
        },

        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);


const User = mongoose.model("User", userSchema);

module.exports = User;