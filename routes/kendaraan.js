const router = require("express").Router();

const {
	getAllKendaraan,
	getKendaraanById,
	createKendaraan,
	updateKendaraan,
	deleteKendaraan,
} = require("../controllers/kendaraan");

router.get("/", getAllKendaraan);
router.get("/:id", getKendaraanById);
router.post("/", createKendaraan);
router.put("/:id", updateKendaraan);
router.delete("/:id", deleteKendaraan);

module.exports = router;
