const router = require("express").Router();

const {
	getAllDokumenPengiriman,
	getDokumenPengirimanById,
	createDokumenPengiriman,
	updateDokumenPengiriman,
	deleteDokumenPengiriman,
} = require("../controllers/dokumen_pengiriman");

const upload = require("../middleware/multer");

router.get("/", getAllDokumenPengiriman);
router.get("/:id", getDokumenPengirimanById);
router.post("/", upload.single("file_path"), createDokumenPengiriman);
router.put("/:id", upload.single("file_path"), updateDokumenPengiriman);
router.delete("/:id", deleteDokumenPengiriman);

module.exports = router;
