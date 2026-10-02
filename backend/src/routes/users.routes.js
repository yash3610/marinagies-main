const express = require("express");

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} = require("../controllers/users.controller");

const {
    authenticate,
    authorizePermission,
} = require("../middleware/auth.middleware");
const { PERMISSIONS } = require("../utils/accessControl");
const { auditAction } = require("../middleware/audit.middleware");

const router = express.Router();

/*
    All user management APIs require authentication
    and ADMIN role.
*/

router.use(authenticate);
router.use(authorizePermission(PERMISSIONS.USERS_MANAGE));

router.get("/", getUsers);

router.get("/:id", getUserById);

router.post("/", auditAction("USER_CREATE", "USER"), createUser);

router.put("/:id", auditAction("USER_UPDATE", "USER"), updateUser);

router.delete("/:id", auditAction("USER_DELETE", "USER"), deleteUser);

module.exports = router;
