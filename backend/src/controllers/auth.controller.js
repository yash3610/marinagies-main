const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            userId: user._id.toString(),
            role: user.role,
        },
        secret,
        {
            expiresIn: "1d",
        }
    );
};

// LOGIN

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
        }).select("+passwordHash");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.active) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive",
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password || user.passwordHash || ""
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// GET CURRENT USER

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select(
            "-password -passwordHash"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.active) return res.status(403).json({ success: false, message: "User account is inactive" });

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body || {};
        if (typeof name !== "string" || !name.trim() || name.trim().length > 100 || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ success: false, message: "Enter your name, a valid email and a password of at least 8 characters." });
        }
        if (confirmPassword !== undefined && confirmPassword !== password) return res.status(400).json({ success: false, message: "Passwords do not match." });
        const normalizedEmail = email.trim().toLowerCase();
        if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: "Email is already registered." });
        const user = await User.create({ name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 12), role: "BRIDGE_OFFICER" });
        return res.status(201).json({ success: true, message: "Account created successfully.", token: generateToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        return res.status(error.code === 11000 ? 409 : 500).json({ success: false, message: error.code === 11000 ? "Email is already registered." : "Unable to create account." });
    }
};

module.exports = {
    register,
    login,
    getMe,
};