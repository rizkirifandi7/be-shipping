const router = require("express").Router();

const {
	getAllCustomer,
	getCustomerById,
	createCustomer,
	updateCustomer,
	deleteCustomer,
} = require("../controllers/customer");

router.get("/", getAllCustomer);
router.get("/:id", getCustomerById);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;
