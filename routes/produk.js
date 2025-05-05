const router = require("express").Router();

const {
	getAllProduk,
	getProdukById,
	createProduk,
	updateProduk,
	deleteProduk,
} = require("../controllers/produk");

router.get("/", getAllProduk);
router.get("/:id", getProdukById);
router.post("/", createProduk);
router.put("/:id", updateProduk);
router.delete("/:id", deleteProduk);

module.exports = router;
