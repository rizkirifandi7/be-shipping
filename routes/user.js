const router = require("express").Router();

const {
	getAllUser,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
} = require("../controllers/user");

const authenticateJWT = require("../middleware/verifyToken");

router.get("/", getAllUser);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
