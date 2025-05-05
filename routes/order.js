const router = require("express").Router();

const {
	getAllOrders,
	getOrdersById,
	createOrders,
	updateOrders,
	deleteOrders,
	createOrderWithDetails,
} = require("../controllers/order");

router.get("/", getAllOrders);
router.get("/:id", getOrdersById);
router.post("/", createOrders);
router.post("/produk", createOrderWithDetails);
router.put("/:id", updateOrders);
router.delete("/:id", deleteOrders);

module.exports = router;