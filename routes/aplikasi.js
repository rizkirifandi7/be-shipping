const router = require("express").Router();

const {
	getAplikasi,
	getAplikasiById,
	createAplikasi,
	updateAplikasi,
	deleteAplikasi,
} = require("../controllers/aplikasi");

const upload = require("../middleware/multer");

router.get("/", getAplikasi);
router.get("/:id", getAplikasiById);
router.post("/", upload.single("logo"), createAplikasi);
router.put("/:id", upload.single("logo"), updateAplikasi);
router.delete("/:id", deleteAplikasi);
router.get("/logo/:filename", (req, res) => {
	const path = require("path");
	const fs = require("fs");

	const filename = req.params.filename;
	const filePath = path.join(__dirname, "..", "uploads", filename);

	fs.access(filePath, fs.constants.F_OK, (err) => {
		if (err) {
			return res.status(404).json({ message: "File not found" });
		}
		res.sendFile(filePath);
	});
});

module.exports = router;
