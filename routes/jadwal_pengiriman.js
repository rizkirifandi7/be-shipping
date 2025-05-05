const router = require("express").Router();

const {
	getAllJadwalPengiriman,
	getJadwalPengirimanById,
	createJadwalPengiriman,
	updateJadwalPengiriman,
	deleteJadwalPengiriman,
} = require("../controllers/jadwal_pengiriman");

const {
	createJadwalPengirimanDenganOptimasi,
} = require("../controllers/optimasi-pengiriman");

router.get("/", getAllJadwalPengiriman);
router.get("/:id", getJadwalPengirimanById);
router.post("/", createJadwalPengiriman);
router.put("/:id", updateJadwalPengiriman);
router.delete("/:id", deleteJadwalPengiriman);
router.post("/optimasi", createJadwalPengirimanDenganOptimasi);

module.exports = router;
