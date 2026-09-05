const bcrypt = require("bcryptjs");
const User = require("../models/User");

/* ========================================================= */
/* GET ALL USERS */
/* ========================================================= */

const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

/* ========================================================= */
/* GET SINGLE USER */
/* ========================================================= */

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
};

/* ========================================================= */
/* CREATE USER */
/* ========================================================= */

const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            active = true,
        } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password and role are required",
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "A user with this email already exists",
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role,
            active,
        });

        const safeUser = user.toObject();
        delete safeUser.password;

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: safeUser,
        });
    } catch (error) {
        console.error("Create user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create user",
        });
    }
};

/* ========================================================= */
/* UPDATE USER */
/* ========================================================= */

const updateUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            active,
        } = req.body;

        const user = await User.findById(
            req.params.id
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        /* Prevent admin from disabling own account */

        if (
            req.user.userId === user._id.toString() &&
            active === false
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot deactivate your own account",
            });
        }

        /* EMAIL */

        if (email !== undefined) {
            const normalizedEmail =
                email.trim().toLowerCase();

            const emailExists =
                await User.findOne({
                    email: normalizedEmail,
                    _id: { $ne: user._id },
                });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Another user already uses this email",
                });
            }

            user.email = normalizedEmail;
        }

        /* NAME */

        if (name !== undefined) {
            user.name = name.trim();
        }

        /* ROLE */

        if (role !== undefined) {
            user.role = role;
        }

        /* STATUS */

        if (active !== undefined) {
            user.active = active;
        }

        /* PASSWORD */

        if (
            password !== undefined &&
            password.trim()
        ) {
            user.password =
                await bcrypt.hash(
                    password,
                    10
                );
        }

        await user.save();

        const safeUser = user.toObject();
        delete safeUser.password;

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: safeUser,
        });
    } catch (error) {
        console.error("Update user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update user",
        });
    }
};

/* ========================================================= */
/* DELETE USER */
/* ========================================================= */

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(
            req.params.id
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        /* Prevent deleting own account */

        if (
            req.user.userId === user._id.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot delete your own account",
            });
        }

        await User.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Delete user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};