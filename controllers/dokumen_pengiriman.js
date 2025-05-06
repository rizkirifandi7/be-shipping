const { Dokumen_Pengiriman, Jadwal_Pengiriman } = require("../models");

const getAllDokumenPengiriman = async (req, res) => {
	try {
		const dokumenPengiriman = await Dokumen_Pengiriman.findAll({
			include: [
				{
					model: Jadwal_Pengiriman,
					as: "jadwal_pengiriman",
				},
			],
		});
		res.status(200).json({
			message: "Dokumen Pengiriman retrieved successfully",
			data: dokumenPengiriman,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getDokumenPengirimanById = async (req, res) => {
	try {
		const { id } = req.params;
		const dokumenPengiriman = await Dokumen_Pengiriman.findByPk(id);
		if (!dokumenPengiriman) {
			return res.status(404).json({ message: "Dokumen Pengiriman not found" });
		}
		res.status(200).json({
			message: "Dokumen Pengiriman retrieved successfully",
			data: dokumenPengiriman,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const createDokumenPengiriman = async (req, res) => {
	try {
		const { nama_dokumen, nomor_dokumen } = req.body;

		const file_path = req.file;

		const dokumenPengiriman = await Dokumen_Pengiriman.create({
			nama_dokumen,
			nomor_dokumen,
			catatan: "-",
			file_path,
		});
		res.status(201).json({
			message: "Dokumen Pengiriman created successfully",
			data: dokumenPengiriman,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const updateDokumenPengiriman = async (req, res) => {
	try {
		const { id } = req.params;
		const { nama_dokumen, nomor_dokumen } = req.body;
		const dokumenPengiriman = await Dokumen_Pengiriman.findByPk(id);
		if (!dokumenPengiriman) {
			return res.status(404).json({ message: "Dokumen Pengiriman not found" });
		}
		dokumenPengiriman.nama_dokumen = nama_dokumen;
		dokumenPengiriman.nomor_dokumen = nomor_dokumen;
		if (req.file) {
			dokumenPengiriman.file_path = req.file.path; // Assuming you are using multer for file upload
		}

		await dokumenPengiriman.save();
		res.status(200).json({
			message: "Dokumen Pengiriman updated successfully",
			data: dokumenPengiriman,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const deleteDokumenPengiriman = async (req, res) => {
	try {
		const { id } = req.params;
		const dokumenPengiriman = await Dokumen_Pengiriman.findByPk(id);
		if (!dokumenPengiriman) {
			return res.status(404).json({ message: "Dokumen Pengiriman not found" });
		}
		await dokumenPengiriman.destroy();
		res.status(200).json({
			message: "Dokumen Pengiriman deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getAllDokumenPengiriman,
	getDokumenPengirimanById,
	createDokumenPengiriman,
	updateDokumenPengiriman,
	deleteDokumenPengiriman,
};
