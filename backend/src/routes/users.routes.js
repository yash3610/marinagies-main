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
    authorize,
} = require("../middleware/auth.middleware");

const router = express.Router();

/*
    All user management APIs require authentication
    and ADMIN role.
*/

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", getUsers);

router.get("/:id", getUserById);

router.post("/", createUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

module.exports = router;